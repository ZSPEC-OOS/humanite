'use client'
import dynamic from 'next/dynamic'
import { useEditorStore } from '@/stores/editorStore'

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false, loading: () => <div className="h-full bg-gray-50 animate-pulse" /> },
)

const MAX_CHARS = 10_000

export function TextInput() {
  const { text, setText } = useEditorStore()
  const overLimit = text.length > MAX_CHARS
  const pct       = Math.min((text.length / MAX_CHARS) * 100, 100)

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200 shrink-0">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Input
        </span>
        <div className="flex items-center gap-2">
          {/* Progress bar */}
          <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                overLimit ? 'bg-red-500' : pct > 80 ? 'bg-amber-400' : 'bg-blue-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-xs tabular-nums ${overLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
            {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          defaultLanguage="plaintext"
          value={text}
          onChange={(v) => setText(v ?? '')}
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
            padding: { top: 12, bottom: 12 },
            fontFamily: "'Inter', 'SF Pro Text', system-ui, sans-serif",
            theme: 'vs',
          }}
        />
      </div>
    </div>
  )
}
