import { useUserStore } from '@/stores/userStore'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

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

  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!resp.ok) {
    let errorBody: { error?: { code?: string; message?: string } } = {}
    try {
      errorBody = await resp.json()
    } catch {
      // ignore parse failure
    }
    throw new APIError(
      errorBody.error?.code ?? 'UNKNOWN_ERROR',
      errorBody.error?.message ?? `HTTP ${resp.status}`,
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
