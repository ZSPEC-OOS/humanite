import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { verifyPassword, issueAccessToken, generateRefreshToken } from '@/lib/auth-utils'
import bcrypt from 'bcryptjs'

const DUMMY_HASH = '$2b$12$dummysaltdummysaltdummysaltdummydummyhashvaluethatisnotreal'

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

  const rows = await sql`
    SELECT id, email, password_hash, tier, region
    FROM users
    WHERE email = ${email} AND deleted_at IS NULL
  `
  const user = rows[0] ?? null

  // Always run bcrypt to prevent timing attacks
  const hashToCheck = user ? user.password_hash : DUMMY_HASH
  const passwordOk = await bcrypt.compare(password, hashToCheck)

  if (!user || !passwordOk) {
    return NextResponse.json(
      { error: { code: 'AUTHENTICATION_FAILED', message: 'Invalid email or password.' } },
      { status: 401 },
    )
  }

  const accessToken = await issueAccessToken(user.id, user.email, user.tier, user.region)
  const { raw, hash } = generateRefreshToken()

  await sql`
    INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
    VALUES (${user.id}, ${hash}, gen_random_uuid(), NOW() + INTERVAL '7 days')
  `

  return NextResponse.json({
    access_token: accessToken,
    refresh_token: raw,
    token_type: 'bearer',
    expires_in: 900,
  })
}
