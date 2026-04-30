import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { hashRefreshToken, issueAccessToken, generateRefreshToken } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  let body: { refresh_token?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } },
      { status: 400 },
    )
  }

  const rawToken = body.refresh_token ?? ''
  if (!rawToken) {
    return NextResponse.json(
      { error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is required.' } },
      { status: 401 },
    )
  }

  const tokenHash = hashRefreshToken(rawToken)

  const rows = await sql`
    SELECT id, user_id, family_id, revoked_at, expires_at
    FROM refresh_tokens
    WHERE token_hash = ${tokenHash}
  `
  const tokenRecord = rows[0] ?? null

  if (!tokenRecord) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is invalid, expired, or already used.',
        },
      },
      { status: 401 },
    )
  }

  // Token was already revoked — possible theft, revoke entire family
  if (tokenRecord.revoked_at) {
    await sql`
      UPDATE refresh_tokens SET revoked_at = NOW()
      WHERE family_id = ${tokenRecord.family_id} AND revoked_at IS NULL
    `
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is invalid, expired, or already used.',
        },
      },
      { status: 401 },
    )
  }

  if (new Date(tokenRecord.expires_at) < new Date()) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is invalid, expired, or already used.',
        },
      },
      { status: 401 },
    )
  }

  // Revoke the used token
  await sql`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ${tokenRecord.id}`

  const userRows = await sql`
    SELECT id, email, tier, region FROM users
    WHERE id = ${tokenRecord.user_id} AND deleted_at IS NULL
  `
  const user = userRows[0] ?? null

  if (!user) {
    return NextResponse.json(
      { error: { code: 'USER_NOT_FOUND', message: 'User not found.' } },
      { status: 401 },
    )
  }

  const accessToken = await issueAccessToken(user.id, user.email, user.tier, user.region)
  const { raw, hash } = generateRefreshToken()

  // Issue new token in same family
  await sql`
    INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
    VALUES (${user.id}, ${hash}, ${tokenRecord.family_id}, NOW() + INTERVAL '7 days')
  `

  return NextResponse.json({
    access_token: accessToken,
    refresh_token: raw,
    token_type: 'bearer',
    expires_in: 900,
  })
}
