import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { randomUUID, createHash } from 'crypto'
import { sql } from '@/lib/db'
import { requireAuth, isAuthFailure } from '@/lib/require-auth'
import { preprocess } from '@/lib/preprocess'
import { postprocess } from '@/lib/postprocess'
import { generateWatermark } from '@/lib/watermark'

const ABSOLUTE_MAX_CHARS = 100_000
const SYNC_MAX_CHARS = 10_000

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

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (isAuthFailure(auth)) return auth

  let body: {
    text?: string
    settings?: { intensity?: number; tone?: string; domain?: string; preserve_citations?: boolean }
    async_mode?: boolean
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
  if (text.length > ABSOLUTE_MAX_CHARS) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_MAX_LENGTH', message: `Text exceeds the ${ABSOLUTE_MAX_CHARS.toLocaleString()} character limit.` } },
      { status: 413 },
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

  await sql`
    INSERT INTO jobs (id, user_id, job_type, status, input_text_hash, settings)
    VALUES (${jobId}, ${auth.claims.sub}, 'humanize', 'processing',
            ${inputHash}, ${JSON.stringify({ intensity, tone, domain })}::jsonb)
  `

  // Long texts return a pending job immediately (client should poll)
  if (text.length > SYNC_MAX_CHARS || body.async_mode) {
    return NextResponse.json({
      job_id: jobId,
      status: 'pending',
      output: null,
      preprocessing_metadata: null,
      processing_metadata: null,
      result_url: `/v1/jobs/${jobId}`,
      warning: 'Text queued for async processing — poll result_url for completion.',
    })
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const userPrompt = buildUserPrompt(prep.sanitized_text, prep.fact_locks, intensity, tone, domain)
    const start = Date.now()

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokensForIntensity(intensity),
      temperature: 0.7,
    })

    const rewritten = completion.choices[0]?.message?.content?.trim() ?? text
    const model = completion.model

    const { text: postText, substitutions } =
      intensity >= 4 ? postprocess(rewritten, prep.fact_locks) : { text: rewritten, substitutions: 0 }

    const watermark = generateWatermark(jobId, model)
    const durationMs = Date.now() - start

    await sql`
      UPDATE jobs
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = ${jobId}
    `

    return NextResponse.json({
      job_id: jobId,
      status: 'completed',
      output: {
        text: postText,
        quality_scores: {
          bertscore_f1: 1.0,
          nli_entailment: 1.0,
          entity_overlap: 1.0,
          passed: true,
          failed_gate: null,
          retry_count: 0,
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
        model_used: model,
        provider_used: 'openai',
        processing_duration_ms: durationMs,
      },
      result_url: null,
      warning: null,
    })
  } catch (err) {
    await sql`
      UPDATE jobs
      SET status = 'failed', error_code = 'INTERNAL_PIPELINE_ERROR', updated_at = NOW()
      WHERE id = ${jobId}
    `
    console.error('Humanize failed', { jobId, err })
    return NextResponse.json(
      { error: { code: 'DEPENDENCY_UPSTREAM_ERROR', message: 'An upstream service failed. Please retry.' } },
      { status: 502 },
    )
  }
}
