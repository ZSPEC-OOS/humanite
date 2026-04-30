'use client'
import dynamic from 'next/dynamic'
import { useEditorStore } from '@/stores/editorStore'

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false, loading: () => <div className="h-full bg-white/3 animate-pulse" /> },
)

const MAX_CHARS = 10_000

export function TextInput() {
  const { text, setText } = useEditorStore()
  const overLimit = text.length > MAX_CHARS
  const pct       = Math.min((text.length / MAX_CHARS) * 100, 100)

  return (
    <div className="flex flex-col h-full bg-dark-base">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2
                      bg-dark-card border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
            <rect x="1" y="1" width="14" height="14" rx="3" stroke="#818cf8" strokeWidth="1.3"/>
            <path d="M4 6h8M4 9h5" stroke="#818cf8" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            AI-Generated Text
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                overLimit ? 'bg-red-500' : pct > 80 ? 'bg-amber-400' : 'bg-brand-violet'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-xs tabular-nums ${
            overLimit ? 'text-red-400 font-semibold' : 'text-white/30'
          }`}>
            {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          defaultLanguage="plaintext"
          value={text}
          onChange={(v) => setText(v ?? '')}
          theme="vs-dark"
          options={{
            wordWrap: 'on',
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 22,
            lineNumbers: 'off',
            scrollBeyondLastLine: false,
            renderWhitespace: 'none',
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: { vertical: 'auto', horizontal: 'hidden' },
            padding: { top: 14, bottom: 14 },
            fontFamily: "'Inter', 'SF Pro Text', system-ui, sans-serif",
          }}
        />
      </div>
    </div>
  )
}
