'use client'
import { useRef, useEffect, useState } from 'react'
import { useEditorStore }    from '@/stores/editorStore'
import { useHumanizeStore }  from '@/stores/humanizeStore'
import { InlineDiff }        from './InlineDiff'

type ViewMode = 'split' | 'diff' | 'output'

export function SplitView() {
  const { text }                      = useEditorStore()
  const { response, status, error }   = useHumanizeStore()
  const [mode, setMode]               = useState<ViewMode>('split')
  const origRef                       = useRef<HTMLDivElement>(null)
  const humRef                        = useRef<HTMLDivElement>(null)
  const isSyncing                     = useRef(false)

  const output = response?.output
  const warn   = response?.warning
  const wm     = output?.watermark

  // Synchronized scroll between panels
  useEffect(() => {
    const orig = origRef.current
    const hum  = humRef.current
    if (!orig || !hum) return

    const syncLeft = () => {
      if (isSyncing.current) return
      isSyncing.current = true
      const ratio = orig.scrollTop / (orig.scrollHeight - orig.clientHeight || 1)
      hum.scrollTop = ratio * (hum.scrollHeight - hum.clientHeight)
      isSyncing.current = false
    }
    const syncRight = () => {
      if (isSyncing.current) return
      isSyncing.current = true
      const ratio = hum.scrollTop / (hum.scrollHeight - hum.clientHeight || 1)
      orig.scrollTop = ratio * (orig.scrollHeight - orig.clientHeight)
      isSyncing.current = false
    }

    orig.addEventListener('scroll', syncLeft)
    hum.addEventListener('scroll', syncRight)
    return () => {
      orig.removeEventListener('scroll', syncLeft)
      hum.removeEventListener('scroll', syncRight)
    }
  }, [])

  if (status === 'idle') {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-sm">Paste text above, then click Humanize or Scan</p>
          <p className="text-xs mt-1 text-gray-300">Minimum 20 characters</p>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
          <p className="text-sm">Rewriting with quality gates…</p>
          <p className="text-xs text-gray-400 mt-1">BERTScore validation on each attempt</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <p className="font-semibold mb-1">Error</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mode switcher + quality badge */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200 shrink-0">
        <div className="flex gap-0.5">
          {(['split', 'diff', 'output'] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                mode === m
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {output && (
          <div className="flex items-center gap-2">
            {output.quality_scores.passed ? (
              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                BERTScore {output.quality_scores.bertscore_f1.toFixed(3)}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Gate not met
              </span>
            )}
          </div>
        )}
      </div>

      {/* Warning banner */}
      {warn && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 shrink-0">
          ⚠ {warn}
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 min-h-0 flex">
        {mode === 'split' && (
          <>
            {/* Original */}
            <div className="flex-1 flex flex-col border-r border-gray-200">
              <div className="px-3 py-1 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium shrink-0">
                Original
              </div>
              <div
                ref={origRef}
                className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed whitespace-pre-wrap text-gray-800 font-mono"
              >
                {text || <span className="text-gray-300 italic">No input text</span>}
              </div>
            </div>

            {/* Humanized */}
            <div className="flex-1 flex flex-col">
              <div className="px-3 py-1 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 font-medium shrink-0">
                Humanized
              </div>
              <div
                ref={humRef}
                className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed whitespace-pre-wrap text-gray-800 font-mono"
              >
                {output?.text ?? <span className="text-gray-300 italic">Output will appear here</span>}
              </div>
            </div>
          </>
        )}

        {mode === 'diff' && output && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex gap-4 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-green-100 border border-green-300" />
                Added
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
                Removed
              </span>
            </div>
            <InlineDiff original={text} rewritten={output.text} />
          </div>
        )}

        {mode === 'output' && (
          <div className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
            {output?.text ?? <span className="text-gray-400 italic">No output yet</span>}
          </div>
        )}
      </div>

      {/* Watermark footer */}
      {wm && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-t border-gray-200 shrink-0">
          <span className="text-gray-400">🔒</span>
          <span className="text-xs text-gray-400">
            AI Processed · {wm.fingerprint.slice(0, 16)}…
          </span>
          <a
            href={wm.verification_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline ml-auto"
          >
            Verify
          </a>
        </div>
      )}
    </div>
  )
}
