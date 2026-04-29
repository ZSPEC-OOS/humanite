import { useUserStore } from '@/stores/userStore'

// In production this is empty string (same-origin). Set NEXT_PUBLIC_API_URL only
// when pointing at an external backend (legacy microservices deployment).
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  skipAuth = false,
): Promise<T> {
  const token = useUserStore.getState().accessToken
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = path.startsWith('http') ? path : `${API_BASE}/api${path}`
  const resp = await fetch(url, { ...options, headers })

  if (!resp.ok) {
    let errorBody: { error?: { code?: string; message?: string }; detail?: { code?: string; message?: string } } = {}
    try {
      errorBody = await resp.json()
    } catch {
      // ignore parse failure
    }
    const detail = errorBody.detail ?? errorBody.error
    throw new APIError(
      detail?.code ?? 'UNKNOWN_ERROR',
      detail?.message ?? `HTTP ${resp.status}`,
      resp.status,
    )
  }

  if (resp.status === 204) return undefined as T
  return resp.json()
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export async function authLogin(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>(
    '/v1/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    true,
  )
}

export async function authRegister(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>(
    '/v1/auth/register',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    true,
  )
}

// ── Humanize ──────────────────────────────────────────────────────────────────

export interface HumanizeSettings {
  intensity: number
  tone: string
  domain: string
  preserve_citations: boolean
}

export interface HumanizeOutput {
  text: string
  quality_scores: {
    bertscore_f1: number
    nli_entailment: number
    entity_overlap: number
    passed: boolean
    failed_gate: string | null
    retry_count: number
  }
  watermark: {
    type: string
    fingerprint: string
    job_id: string
    model: string
    verification_url: string
    issued_at: string
  }
  postprocessor_substitutions: number
}

export interface HumanizeAPIResponse {
  job_id: string
  status: string
  output: HumanizeOutput | null
  preprocessing_metadata: {
    language: string
    word_count: number
    char_count: number
    fact_lock_count: number
    ai_signal_strength: number
  } | null
  processing_metadata: {
    model_used: string
    provider_used: string
    processing_duration_ms: number
  } | null
  result_url: string | null
  warning: string | null
}

export async function apiHumanize(
  text: string,
  settings: HumanizeSettings,
  asyncMode = false,
): Promise<HumanizeAPIResponse> {
  return apiFetch<HumanizeAPIResponse>('/v1/humanize', {
    method: 'POST',
    body: JSON.stringify({ text, settings, async_mode: asyncMode }),
  })
}

// ── Scan ──────────────────────────────────────────────────────────────────────

export interface FeatureContribution {
  feature: string
  observed_value: number
  direction: 'ai_indicator' | 'human_indicator'
  contribution: number
}

export interface ScanAPIResponse {
  job_id: string
  status: string
  scan_id: string | null
  classification: 'human-written' | 'ai-generated' | 'mixed' | 'uncertain' | null
  confidence: number | null
  human_probability: number | null
  ai_probability: number | null
  uncertain_probability: number | null
  per_sentence_perplexity: number[]
  top_features: FeatureContribution[]
  explanation: { summary: string; detail: string } | null
  model_used: string | null
  processing_duration_ms: number | null
  result_url: string | null
  warning: string | null
}

export async function apiScan(
  text: string,
  mode: 'quick' | 'standard' = 'standard',
): Promise<ScanAPIResponse> {
  return apiFetch<ScanAPIResponse>('/v1/scan', {
    method: 'POST',
    body: JSON.stringify({ text, mode }),
  })
}

// ── Job polling ───────────────────────────────────────────────────────────────

export interface JobStatus {
  job_id: string
  job_type: string
  status: string
  created_at: string
  completed_at: string | null
  result_url: string | null
  error_code: string | null
}

export async function apiGetJob(jobId: string): Promise<JobStatus> {
  return apiFetch<JobStatus>(`/v1/jobs/${jobId}`)
}

// ── Presets ───────────────────────────────────────────────────────────────────

export interface Preset {
  id: string
  name: string
  intensity: number
  tone: string
  domain: string
  preserve_citations: boolean
  created_at: string
}

export async function apiListPresets(): Promise<Preset[]> {
  return apiFetch<Preset[]>('/v1/user/presets')
}

export async function apiCreatePreset(
  data: Omit<Preset, 'id' | 'created_at'>,
): Promise<Preset> {
  return apiFetch<Preset>('/v1/user/presets', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function apiDeletePreset(presetId: string): Promise<void> {
  return apiFetch<void>(`/v1/user/presets/${presetId}`, { method: 'DELETE' })
}

// ── Batch ────────────────────────────────────────────────────────────────────

export interface BatchItemRequest {
  item_id: string
  text: string
  operation: 'humanize' | 'scan'
  settings?: Record<string, unknown>
}

export interface BatchItemStatus {
  item_id: string
  status: string
  job_id?: string
  error_code?: string
  skipped_reason?: string
}

export interface BatchSubmitResponse {
  batch_job_id: string
  status: string
  total_items: number
  accepted_items: number
  rejected_items: number
  item_statuses: BatchItemStatus[]
  poll_url: string
}

export interface BatchJobStatus {
  batch_job_id: string
  status: string
  total_items: number
  completed_items: number
  failed_items: number
  progress_percent: number
  created_at: string
  completed_at: string | null
}

export async function apiSubmitBatch(
  items: BatchItemRequest[],
): Promise<BatchSubmitResponse> {
  return apiFetch<BatchSubmitResponse>('/v1/batch', {
    method: 'POST',
    body: JSON.stringify({ items }),
  })
}

export async function apiBatchStatus(batchId: string): Promise<BatchJobStatus> {
  return apiFetch<BatchJobStatus>(`/v1/batch/jobs/${batchId}`)
}

// ── Export ────────────────────────────────────────────────────────────────────

export async function apiExport(
  text: string,
  format: 'text' | 'markdown' | 'docx',
  watermark: Record<string, string>,
  jobId: string,
  title = 'Humanite Export',
): Promise<Blob> {
  const token = useUserStore.getState().accessToken
  const resp = await fetch(`${API_BASE}/api/v1/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ text, format, watermark, job_id: jobId, title }),
  })

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}))
    throw new Error(data.error?.message ?? `Export failed: HTTP ${resp.status}`)
  }
  return resp.blob()
}
