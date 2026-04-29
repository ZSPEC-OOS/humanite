import { createHash } from 'crypto'

const VERIFICATION_BASE = 'https://api.humanite.ai/v1/verify'

export function generateWatermark(jobId: string, model: string) {
  const salt = process.env.WATERMARK_SECRET_SALT ?? 'dev-salt-replace-in-production'
  const today = new Date().toISOString().slice(0, 10)
  const fingerprint = createHash('sha256')
    .update(`${jobId}:${model}:${today}:${salt}`)
    .digest('hex')

  return {
    type: 'ai_processed',
    fingerprint,
    job_id: jobId,
    model,
    verification_url: `${VERIFICATION_BASE}/${fingerprint}`,
    issued_at: new Date().toISOString(),
  }
}
