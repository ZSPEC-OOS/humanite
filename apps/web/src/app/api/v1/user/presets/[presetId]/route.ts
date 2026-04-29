import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireAuth, isAuthFailure } from '@/lib/require-auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  req: NextRequest,
  { params }: { params: { presetId: string } },
) {
  const auth = await requireAuth(req)
  if (isAuthFailure(auth)) return auth

  if (!UUID_RE.test(params.presetId)) {
    return NextResponse.json(
      { error: { code: 'PRESET_NOT_FOUND', message: 'Preset not found.' } },
      { status: 404 },
    )
  }

  const rows = await sql`
    SELECT id, name, intensity, tone, domain, preserve_citations, created_at
    FROM presets
    WHERE id = ${params.presetId} AND user_id = ${auth.claims.sub}
  `
  const p = rows[0]
  if (!p) {
    return NextResponse.json(
      { error: { code: 'PRESET_NOT_FOUND', message: 'Preset not found.' } },
      { status: 404 },
    )
  }

  return NextResponse.json({
    id: String(p.id),
    name: p.name,
    intensity: p.intensity,
    tone: p.tone,
    domain: p.domain,
    preserve_citations: p.preserve_citations,
    created_at: new Date(p.created_at as string).toISOString(),
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { presetId: string } },
) {
  const auth = await requireAuth(req)
  if (isAuthFailure(auth)) return auth

  if (!UUID_RE.test(params.presetId)) {
    return NextResponse.json(
      { error: { code: 'PRESET_NOT_FOUND', message: 'Preset not found.' } },
      { status: 404 },
    )
  }

  const rows = await sql`
    DELETE FROM presets
    WHERE id = ${params.presetId} AND user_id = ${auth.claims.sub}
    RETURNING id
  `
  if (!rows[0]) {
    return NextResponse.json(
      { error: { code: 'PRESET_NOT_FOUND', message: 'Preset not found.' } },
      { status: 404 },
    )
  }

  return new NextResponse(null, { status: 204 })
}
