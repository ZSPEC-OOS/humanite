import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireAuth, isAuthFailure } from '@/lib/require-auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (isAuthFailure(auth)) return auth

  const rows = await sql`
    SELECT id, name, intensity, tone, domain, preserve_citations, created_at
    FROM presets
    WHERE user_id = ${auth.claims.sub}
    ORDER BY created_at DESC
  `

  return NextResponse.json(
    rows.map(p => ({
      id: String(p.id),
      name: p.name,
      intensity: p.intensity,
      tone: p.tone,
      domain: p.domain,
      preserve_citations: p.preserve_citations,
      created_at: new Date(p.created_at as string).toISOString(),
    })),
  )
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (isAuthFailure(auth)) return auth

  let body: {
    name?: string
    intensity?: number
    tone?: string
    domain?: string
    preserve_citations?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } },
      { status: 400 },
    )
  }

  const name = (body.name ?? '').trim()
  if (!name) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Preset name is required.' } },
      { status: 400 },
    )
  }

  const intensity = Math.min(10, Math.max(1, body.intensity ?? 5))
  const tone = body.tone ?? 'balanced'
  const domain = body.domain ?? 'general'
  const preserveCitations = body.preserve_citations ?? true

  try {
    const rows = await sql`
      INSERT INTO presets (user_id, name, intensity, tone, domain, preserve_citations)
      VALUES (${auth.claims.sub}, ${name}, ${intensity}, ${tone}, ${domain}, ${preserveCitations})
      RETURNING id, name, intensity, tone, domain, preserve_citations, created_at
    `
    const p = rows[0]
    if (!p) throw new Error('Insert returned no row')

    return NextResponse.json(
      {
        id: String(p.id),
        name: p.name,
        intensity: p.intensity,
        tone: p.tone,
        domain: p.domain,
        preserve_citations: p.preserve_citations,
        created_at: new Date(p.created_at as string).toISOString(),
      },
      { status: 201 },
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json(
        { error: { code: 'PRESET_NAME_TAKEN', message: `A preset named '${name}' already exists.` } },
        { status: 409 },
      )
    }
    throw err
  }
}
