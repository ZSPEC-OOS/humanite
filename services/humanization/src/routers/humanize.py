import logging
import time
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from ..config import settings
from ..gates.bertscore_gate import check_bertscore
from ..gates.entity_gate import check_entity_overlap
from ..gates.nli_gate import check_nli
from ..pipeline.intensity_router import get_pipeline_config
from ..pipeline.postprocessor import postprocess
from ..pipeline.prompt_builder import build_prompt
from ..pipeline.watermark import generate_watermark
from ..providers.base import BaseLLMProvider
from ..schemas import HumanizeRequest, HumanizeResponse, QualityScores

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/humanize", tags=["humanization"])


def _get_provider() -> BaseLLMProvider:
    """
    In development: use Ollama if available, fall back to OpenAI.
    In production: always OpenAI (or Anthropic if configured).
    """
    if settings.environment == "development" and settings.ollama_base_url:
        from ..providers.ollama_adapter import OllamaProvider
        return OllamaProvider(settings.ollama_base_url, settings.ollama_model)
    if settings.openai_api_key:
        from ..providers.openai_adapter import OpenAIProvider
        return OpenAIProvider(settings.openai_api_key, settings.openai_model)
    raise RuntimeError(
        "No LLM provider configured. Set OPENAI_API_KEY or ensure Ollama is running."
    )


@router.post("/", response_model=HumanizeResponse)
async def humanize(body: HumanizeRequest) -> HumanizeResponse:
    start_time = time.monotonic()
    job_id = body.job_id or str(uuid4())
    pipeline_cfg = get_pipeline_config(body.settings.intensity)
    fact_locks_raw = [lock.model_dump() for lock in body.fact_locks]

    system_prompt, user_prompt = build_prompt(
        text=body.text,
        fact_locks=fact_locks_raw,
        intensity=body.settings.intensity,
        tone=body.settings.tone,
        domain=body.settings.domain,
    )

    provider = _get_provider()

    last_scores: QualityScores | None = None
    last_rewrite: str | None = None

    for attempt in range(settings.max_retries):
        temperature = settings.retry_temperatures[attempt]

        # ── LLM call ──────────────────────────────────────────────────────────
        try:
            llm_resp = await provider.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=pipeline_cfg.llm_max_tokens,
                temperature=temperature,
                timeout=(
                    settings.llm_timeout_ollama
                    if settings.environment == "development"
                    else settings.llm_timeout_sync
                ),
            )
        except RuntimeError as exc:
            if attempt < settings.max_retries - 1:
                logger.warning(
                    "LLM call failed on attempt %d, retrying. type=%s",
                    attempt + 1, type(exc).__name__,
                )
                continue
            # All attempts exhausted with LLM errors
            logger.error("LLM provider failed on all %d attempts. type=%s", settings.max_retries, type(exc).__name__)
            raise HTTPException(
                502,
                detail={
                    "code": "DEPENDENCY_LLM_PROVIDER_UNAVAILABLE",
                    "message": "Language model is temporarily unavailable. Please retry.",
                },
            )

        rewritten = llm_resp.text.strip()

        # ── Post-processing ───────────────────────────────────────────────────
        post_result = postprocess(rewritten, fact_locks_raw) if pipeline_cfg.run_postprocessor else None
        if post_result:
            rewritten = post_result.text

        # ── Quality gates ─────────────────────────────────────────────────────
        failed_gate: str | None = None
        bs_f1       = 0.0
        nli_score   = 0.0
        ent_overlap = 1.0

        try:
            bs_pass, bs_f1 = check_bertscore(body.text, rewritten)
        except Exception:
            bs_pass = False

        if not bs_pass:
            failed_gate = "bertscore"
        else:
            try:
                nli_pass, nli_score = check_nli(body.text, rewritten)
            except Exception:
                nli_pass = False

            if not nli_pass:
                failed_gate = "nli"
            else:
                try:
                    ent_pass, ent_overlap = check_entity_overlap(body.text, rewritten)
                except Exception:
                    ent_pass = False

                if not ent_pass:
                    failed_gate = "entity_overlap"

        all_passed = failed_gate is None
        last_scores = QualityScores(
            bertscore_f1=round(bs_f1, 4),
            nli_entailment=round(nli_score, 4),
            entity_overlap=round(ent_overlap, 4),
            passed=all_passed,
            failed_gate=failed_gate,
            retry_count=attempt,
        )
        last_rewrite = rewritten

        if all_passed:
            # ── Success path ──────────────────────────────────────────────────
            watermark = generate_watermark(job_id, llm_resp.model)
            duration  = int((time.monotonic() - start_time) * 1000)

            logger.info(
                "Humanization succeeded job_id=%s attempt=%d bs_f1=%.4f nli=%.4f",
                job_id, attempt, bs_f1, nli_score,
            )

            return HumanizeResponse(
                job_id=job_id,
                status="completed",
                output_text=rewritten,
                quality_scores=last_scores,
                watermark=watermark,
                model_used=llm_resp.model,
                provider_used=llm_resp.provider,
                processing_duration_ms=duration,
                postprocessor_substitutions=post_result.substitutions_made if post_result else 0,
            )

        logger.warning(
            "Quality gate failed job_id=%s attempt=%d gate=%s bs_f1=%.4f nli=%.4f",
            job_id, attempt, failed_gate, bs_f1, nli_score,
        )

    # ── All retries exhausted ─────────────────────────────────────────────────
    # NEVER return the last failing rewrite. Return original with warning.
    watermark = generate_watermark(job_id, "fallback")
    duration  = int((time.monotonic() - start_time) * 1000)

    logger.error(
        "All %d retry attempts failed quality gates. job_id=%s. "
        "Returning original text with quality_gate_failed status.",
        settings.max_retries, job_id,
    )

    return HumanizeResponse(
        job_id=job_id,
        status="quality_gate_failed",
        output_text=body.text,          # Original text — not a failing rewrite
        quality_scores=last_scores or QualityScores(
            bertscore_f1=0.0, nli_entailment=0.0, entity_overlap=0.0,
            passed=False, failed_gate="all_retries_exhausted", retry_count=settings.max_retries,
        ),
        watermark=watermark,
        model_used="fallback",
        provider_used="none",
        processing_duration_ms=duration,
        warning=(
            "QUALITY_GATE_NOT_MET: All retry attempts failed quality validation. "
            "Original text returned unmodified."
        ),
    )
