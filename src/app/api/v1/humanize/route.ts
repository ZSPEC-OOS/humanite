import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { randomUUID, createHash } from 'crypto'
import { db } from '@/lib/firestore'
import { requireAuth, isAuthFailure } from '@/lib/require-auth'
import { preprocess } from '@/lib/preprocess'
import { postprocess } from '@/lib/postprocess'
import { generateWatermark } from '@/lib/watermark'
import { runQualityGates, QualityScores } from '@/lib/qualityGates'

const MAX_GATE_RETRIES = 2

// Humanize runs synchronously against the Vercel function's request timeout —
// there is no job queue behind the "pending" status yet, so the cap below IS
// the real limit until async processing (chunked, queue-backed) ships.
const MAX_CHARS = 10_000

const SYSTEM_PROMPT = `You are a professional editor. Your only job is to rewrite the provided text \
so it reads as natural, fluent human prose. You must:
- Preserve every fact, number, name, date, citation, and technical term exactly as written.
- Never add information that is not in the original.
- Never correct factual errors — your job is style, not content.
- Never remove content — only restructure and rephrase.
- Output ONLY the rewritten text. No preamble, no commentary, no explanation.`

function buildUserPrompt(
  text: string,
  factLocks: { text: string; lock_type: string; label: string }[],
  intensity: number,
  tone: string,
  domain: string,
): string {
  const lockLines = factLocks.length
    ? factLocks.map(l => `- "${l.text}" [${l.lock_type}/${l.label}]`).join('\n')
    : '- (no explicit locks — still preserve all numbers, names, and dates exactly)'

  let intensityGuide: string
  if (intensity <= 3) {
    intensityGuide =
      'Apply minimal changes — fix only the most obvious AI patterns (flatten transition word overuse, reduce passive voice). Keep structure identical.'
  } else if (intensity <= 6) {
    intensityGuide =
      'Apply moderate rewriting — vary sentence rhythm, replace AI-typical vocabulary, restructure for flow. Preserve all paragraph breaks.'
  } else {
    intensityGuide =
      'Apply thorough rewriting — diversify sentence lengths aggressively (mix 6-word fragments with 28-word sentences), add natural register markers (parentheticals, em-dashes, rhetorical questions where appropriate), replace all AI-typical openers and vocabulary. Preserve paragraph structure.'
  }

  return `## HARD CONSTRAINTS — DO NOT ALTER THESE EXACT STRINGS
The following spans must appear in your output verbatim:
${lockLines}

## STYLE PARAMETERS
Tone: ${tone}
Domain: ${domain}
Intensity: ${intensity}/10
${intensityGuide}

## VOCABULARY SUBSTITUTIONS (mandatory)
Replace these words wherever they appear, unless inside a locked span:
- "utilize" → "use"
- "leverage" (verb) → "apply" or "use"
- "delve into" → "explore"
- "robust" (generic) → "strong" or "reliable"
- "multifaceted" → "complex"
- "comprehensive" → "thorough"
- "facilitate" → "help" or "enable"
- "Furthermore," / "Moreover," / "Additionally," (sentence openers) → remove or replace
- "In conclusion," → remove; restructure closing sentence naturally
- "It is important to note that" → remove; integrate content directly

## INPUT TEXT
${text}`
}

function maxTokensForIntensity(intensity: number): number {
  if (intensity <= 3) return 2048
  if (intensity <= 6) return 3072
  return 4096
}

function buildRetryAddendum(gate: QualityScores): string {
  switch (gate.failed_gate) {
    case 'entity_overlap':
      return `## PREVIOUS ATTEMPT FAILED VALIDATION — FIX THIS\nYour previous rewrite dropped or altered these required exact-match strings. Include every one of them verbatim this time: ${gate.missing_facts.map(f => `"${f}"`).join(', ')}`
    case 'entailment':
      return `## PREVIOUS ATTEMPT FAILED VALIDATION — FIX THIS\nYour previous rewrite changed the meaning of the source. Specific issues found: ${gate.entailment_issues.join('; ') || 'unspecified meaning drift'}. Do not add, remove, or alter any factual claim — rewrite style only.`
    case 'semantic_similarity':
      return `## PREVIOUS ATTEMPT FAILED VALIDATION — FIX THIS\nYour previous rewrite deviated too far from the source content. Keep the same content, structure, and claims — vary only the prose style.`
    default:
      return ''
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (isAuthFailure(auth)) return auth

  let body: {
    text?: string
    settings?: { intensity?: number; tone?: string; domain?: string; preserve_citations?: boolean }
    api_config?: { api_key?: string; model_id?: string; base_url?: string }
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } },
      { status: 400 },
    )
  }

  const text = (body.text ?? '').trim()
  const settings = body.settings ?? {}
  const intensity = Math.min(10, Math.max(1, settings.intensity ?? 5))
  const tone = settings.tone ?? 'balanced'
  const domain = settings.domain ?? 'general'

  if (text.length < 20) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_MIN_LENGTH', message: 'Text must be at least 20 characters.' } },
      { status: 400 },
    )
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_MAX_LENGTH',
          message: `Text exceeds the ${MAX_CHARS.toLocaleString()} character limit. Asynchronous processing for longer documents is not yet available.`,
        },
      },
      { status: 422 },
    )
  }

  let prep: ReturnType<typeof preprocess>
  try {
    prep = preprocess(text)
  } catch {
    return NextResponse.json(
      { error: { code: 'VALIDATION_INJECTION_ATTEMPT', message: 'Input contains disallowed content.' } },
      { status: 400 },
    )
  }

  const jobId = randomUUID()
  const inputHash = createHash('sha256').update(text).digest('hex')
  const now = new Date()

  await db().collection('jobs').doc(jobId).set({
    userId: auth.claims.sub,
    jobType: 'humanize',
    status: 'processing',
    inputTextHash: inputHash,
    settings: { intensity, tone, domain },
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    errorCode: null,
  })

  try {
    const apiCfg = body.api_config
    const client = new OpenAI({
      apiKey: apiCfg?.api_key || process.env.OPENAI_API_KEY,
      baseURL: apiCfg?.base_url || process.env.OPENAI_BASE_URL,
    })
    const model = apiCfg?.model_id || process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const basePrompt = buildUserPrompt(prep.sanitized_text, prep.fact_locks, intensity, tone, domain)
    const start = Date.now()

    let userPrompt = basePrompt
    let postText = text
    let substitutions = 0
    let modelUsed = model
    let gateResult: QualityScores | null = null
    let gatesUnavailable = false
    let retryCount = 0

    for (let attempt = 0; attempt <= MAX_GATE_RETRIES; attempt++) {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokensForIntensity(intensity),
        temperature: 0.7,
      })

      const rewritten = completion.choices[0]?.message?.content?.trim() ?? text
      modelUsed = completion.model

      const post = intensity >= 4 ? postprocess(rewritten, prep.fact_locks) : { text: rewritten, substitutions: 0 }
      postText = post.text
      substitutions = post.substitutions
      retryCount = attempt

      // Gate failures (e.g. a BYO base_url that doesn't support the
      // embeddings endpoint or JSON response_format) must not sink an
      // otherwise-successful rewrite — degrade to "unscored", don't 502.
      try {
        gateResult = await runQualityGates(client, model, prep.sanitized_text, postText, prep.fact_locks)
      } catch (gateErr) {
        console.warn('Quality gates unavailable, shipping unscored output', {
          jobId,
          type: gateErr instanceof Error ? gateErr.constructor.name : typeof gateErr,
        })
        gatesUnavailable = true
        break
      }

      if (gateResult.passed || attempt === MAX_GATE_RETRIES) break
      userPrompt = `${basePrompt}\n\n${buildRetryAddendum(gateResult)}`
    }

    const watermark = generateWatermark(jobId, modelUsed)
    const durationMs = Date.now() - start

    await db().collection('jobs').doc(jobId).update({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
      watermarkFingerprint: watermark.fingerprint,
    })

    return NextResponse.json({
      job_id: jobId,
      status: 'completed',
      output: {
        text: postText,
        quality_scores: gatesUnavailable
          ? {
              bertscore_f1: null,
              nli_entailment: null,
              entity_overlap: null,
              passed: null,
              failed_gate: null,
              retry_count: retryCount,
              missing_facts: [],
              entailment_issues: [],
            }
          : {
              bertscore_f1: gateResult!.bertscore_f1,
              nli_entailment: gateResult!.nli_entailment,
              entity_overlap: gateResult!.entity_overlap,
              passed: gateResult!.passed,
              failed_gate: gateResult!.failed_gate,
              retry_count: retryCount,
              missing_facts: gateResult!.missing_facts,
              entailment_issues: gateResult!.entailment_issues,
            },
        watermark,
        postprocessor_substitutions: substitutions,
      },
      preprocessing_metadata: {
        language: prep.language,
        word_count: prep.word_count,
        char_count: prep.char_count,
        fact_lock_count: prep.fact_locks.length,
        ai_signal_strength: 0,
      },
      processing_metadata: {
        model_used: modelUsed,
        provider_used: 'openai',
        processing_duration_ms: durationMs,
      },
      result_url: null,
      warning: gatesUnavailable
        ? 'Quality gates could not run against the configured model endpoint — output is unscored.'
        : null,
    })
  } catch (err) {
    await db().collection('jobs').doc(jobId).update({ status: 'failed', errorCode: 'INTERNAL_PIPELINE_ERROR', updatedAt: new Date() })
    console.error('Humanize failed', { jobId, err })
    return NextResponse.json(
      { error: { code: 'DEPENDENCY_UPSTREAM_ERROR', message: 'An upstream service failed. Please retry.' } },
      { status: 502 },
    )
  }
}
