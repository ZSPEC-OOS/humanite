import { useEffect, useRef, useState } from 'react'
import { apiGetJob, JobStatus } from '@/lib/api'

const POLL_INTERVAL_MS = 3_000
const MAX_POLLS = 60   // 3 minutes max

interface UseJobPollerOptions {
  jobId: string | null
  onComplete: (job: JobStatus) => void
  onError: (message: string) => void
}

export function useJobPoller({ jobId, onComplete, onError }: UseJobPollerOptions) {
  const [polling, setPolling] = useState(false)

  // Capture callbacks in refs so the effect depends only on jobId.
  // Without this, passing inline arrow functions would cause infinite re-runs.
  const onCompleteRef = useRef(onComplete)
  const onErrorRef    = useRef(onError)
  onCompleteRef.current = onComplete
  onErrorRef.current    = onError

  useEffect(() => {
    if (!jobId) return
    const activeJobId = jobId   // narrow to string for the closure

    let pollCount = 0
    let timerId: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    setPolling(true)

    async function poll() {
      if (cancelled) return

      if (pollCount >= MAX_POLLS) {
        setPolling(false)
        onErrorRef.current('Job timed out waiting for completion.')
        return
      }

      try {
        const job = await apiGetJob(activeJobId)
        if (cancelled) return
        pollCount += 1

        if (job.status === 'completed') {
          setPolling(false)
          onCompleteRef.current(job)
        } else if (job.status === 'failed') {
          setPolling(false)
          onErrorRef.current(job.error_code ?? 'Job failed.')
        } else {
          timerId = setTimeout(poll, POLL_INTERVAL_MS)
        }
      } catch {
        if (!cancelled) {
          setPolling(false)
          onErrorRef.current('Failed to poll job status.')
        }
      }
    }

    timerId = setTimeout(poll, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      if (timerId) clearTimeout(timerId)
      setPolling(false)
    }
  }, [jobId])

  return { polling }
}
