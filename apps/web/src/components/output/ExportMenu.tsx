'use client'
import { useState } from 'react'
import { useHumanizeStore } from '@/stores/humanizeStore'
import { apiExport }        from '@/lib/api'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const FORMATS = [
  { key: 'text',     label: 'TXT',  ext: 'txt'  },
  { key: 'markdown', label: 'MD',   ext: 'md'   },
  { key: 'docx',     label: 'DOCX', ext: 'docx' },
] as const

export function ExportMenu() {
  const { response }            = useHumanizeStore()
  const [loading, setLoading]   = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)

  const output = response?.output
  if (!output) return null

  const handleExport = async (format: 'text' | 'markdown' | 'docx') => {
    if (!output.watermark || !response?.job_id) return
    setLoading(format)
    setError(null)
    try {
      const blob = await apiExport(
        output.text,
        format,
        output.watermark as Record<string, string>,
        response.job_id,
      )
      const ext      = FORMATS.find((f) => f.key === format)?.ext ?? format
      const filename = `humanite-${response.job_id.slice(0, 8)}.${ext}`
      downloadBlob(blob, filename)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-400 mr-1">Export:</span>
      {FORMATS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => handleExport(key)}
          disabled={loading !== null}
          className="text-xs px-2 py-1 border border-gray-200 rounded-md
                     hover:bg-gray-50 hover:border-gray-300
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors text-gray-600"
        >
          {loading === key ? (
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              {label}
            </span>
          ) : (
            label
          )}
        </button>
      ))}
      {error && (
        <span className="text-xs text-red-500 ml-1">{error}</span>
      )}
    </div>
  )
}
