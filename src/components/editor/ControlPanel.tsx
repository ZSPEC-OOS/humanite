'use client'
import { useHumanizeStore } from '@/stores/humanizeStore'
import { useScanStore } from '@/stores/scanStore'
import { useEditorStore } from '@/stores/editorStore'

const TONES   = ['balanced', 'formal', 'casual', 'academic', 'professional']
const DOMAINS = ['general', 'academic', 'business', 'technical', 'medical', 'legal']

const INTENSITY_LABELS: Record<number, string> = {
  1: 'Minimal',
  3: 'Light',
  5: 'Moderate',
  7: 'Heavy',
  10: 'Aggressive',
}

function intensityLabel(v: number): string {
  const keys = [1, 3, 5, 7, 10]
  const nearest = keys.reduce((a, b) =>
    Math.abs(b - v) < Math.abs(a - v) ? b : a
  )
  return INTENSITY_LABELS[nearest] ?? ''
}

export function ControlPanel() {
  const { settings, setSettings, humanize, status: hStatus } = useHumanizeStore()
  const { scan, status: sStatus }                             = useScanStore()
  const { text }                                              = useEditorStore()

  const canSubmit = text.trim().length >= 20
  const hLoading  = hStatus === 'loading'
  const sLoading  = sStatus === 'loading'

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200 shrink-0">
      {/* Intensity */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-500 whitespace-nowrap">
          Intensity
        </label>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={settings.intensity}
          onChange={(e) => setSettings({ intensity: Number(e.target.value) })}
          className="w-24 accent-blue-600"
        />
        <span className="text-xs font-semibold text-blue-700 w-16">
          {settings.intensity} — {intensityLabel(settings.intensity)}
        </span>
      </div>

      <div className="w-px h-5 bg-gray-200" />

      {/* Tone */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-gray-500">Tone</label>
        <select
          value={settings.tone}
          onChange={(e) => setSettings({ tone: e.target.value })}
          className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TONES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Domain */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-gray-500">Domain</label>
        <select
          value={settings.domain}
          onChange={(e) => setSettings({ domain: e.target.value })}
          className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {DOMAINS.map((d) => (
            <option key={d} value={d}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Citations toggle */}
      <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.preserve_citations}
          onChange={(e) => setSettings({ preserve_citations: e.target.checked })}
          className="accent-blue-600"
        />
        Preserve citations
      </label>

      {/* Actions */}
      <div className="flex gap-2 ml-auto">
        <button
          onClick={() => humanize(text)}
          disabled={!canSubmit || hLoading}
          className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          {hLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Humanizing…
            </span>
          ) : (
            'Humanize'
          )}
        </button>

        <button
          onClick={() => scan(text)}
          disabled={!canSubmit || sLoading}
          className="px-4 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg
                     hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
        >
          {sLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Scanning…
            </span>
          ) : (
            'Scan'
          )}
        </button>
      </div>
    </div>
  )
}
