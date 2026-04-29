import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireAuth, isAuthFailure } from '@/lib/require-auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } },
) {
  const auth = await requireAuth(req)
  if (isAuthFailure(auth)) return auth

  const { jobId } = params
  if (!UUID_RE.test(jobId)) {
    return NextResponse.json(
      { error: { code: 'JOB_NOT_FOUND', message: 'Job not found.' } },
      { status: 404 },
    )
  }

  const rows = await sql`
    SELECT id, user_id, job_type, status, created_at, updated_at, completed_at,
           result_url, error_code
    FROM jobs
    WHERE id = ${jobId}
  `
  const job = rows[0]

  // Return 404 even if the job exists but belongs to a different user —
  // prevents job ID enumeration attacks
  if (!job || job.user_id !== auth.claims.sub) {
    return NextResponse.json(
      { error: { code: 'JOB_NOT_FOUND', message: 'Job not found.' } },
      { status: 404 },
    )
  }

  return NextResponse.json({
    job_id: String(job.id),
    job_type: job.job_type,
    status: job.status,
    created_at: new Date(job.created_at as string).toISOString(),
    completed_at: job.completed_at ? new Date(job.completed_at as string).toISOString() : null,
    result_url: job.result_url ?? null,
    error_code: job.error_code ?? null,
  })
}
