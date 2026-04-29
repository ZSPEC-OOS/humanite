import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { hashPassword, issueAccessToken, generateRefreshToken } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } },
      { status: 400 },
    )
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const password = body.password ?? ''

  if (!email || !password) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Email and password are required.' } },
      { status: 400 },
    )
  }

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`
  if (existing.length > 0) {
    return NextResponse.json(
      { error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists.' } },
      { status: 409 },
    )
  }

  const passwordHash = await hashPassword(password)

  const rows = await sql`
    INSERT INTO users (email, password_hash, tier, region)
    VALUES (${email}, ${passwordHash}, 'free', 'us-east-1')
    RETURNING id, email, tier, region
  `
  const user = rows[0]
  if (!user) throw new Error('User insert returned no row')

  const accessToken = await issueAccessToken(
    user.id as string,
    user.email as string,
    user.tier as string,
    user.region as string,
  )
  const { raw, hash } = generateRefreshToken()

  await sql`
    INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
    VALUES (${user.id}, ${hash}, gen_random_uuid(), NOW() + INTERVAL '7 days')
  `

  return NextResponse.json(
    { access_token: accessToken, refresh_token: raw, token_type: 'bearer', expires_in: 900 },
    { status: 201 },
  )
}
