import { useEffect, useRef, useState } from 'react'
import { apiGetJob, JobStatus } from '@/lib/api'

const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 60   // 3 minutes max

interface UseJobPollerOptions {
  jobId: string | null
  onComplete: (job: JobStatus) => void
  onError: (message: string) => void
}

export function useJobPoller({ jobId, onComplete, onError }: UseJobPollerOptions) {
  const [polling, setPolling] = useState(false)
  const pollCount = useRef(0)
  const timer     = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!jobId) return

    pollCount.current = 0
    setPolling(true)

    const poll = async () => {
      if (pollCount.current >= MAX_POLLS) {
        setPolling(false)
        onError('Job timed out waiting for completion.')
        return
      }

      try {
        const job = await apiGetJob(jobId)
        pollCount.current += 1

        if (job.status === 'completed') {
          setPolling(false)
          onComplete(job)
        } else if (job.status === 'failed') {
          setPolling(false)
          onError(job.error_code ?? 'Job failed.')
        } else {
          // pending or processing — keep polling
          timer.current = setTimeout(poll, POLL_INTERVAL_MS)
        }
      } catch {
        setPolling(false)
        onError('Failed to poll job status.')
      }
    }

    timer.current = setTimeout(poll, POLL_INTERVAL_MS)

    return () => {
      if (timer.current) clearTimeout(timer.current)
      setPolling(false)
    }
  }, [jobId])   // eslint-disable-line react-hooks/exhaustive-deps

  return { polling }
}
