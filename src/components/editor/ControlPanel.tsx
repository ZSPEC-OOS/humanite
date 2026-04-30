'use client'
import { useHumanizeStore } from '@/stores/humanizeStore'
import { useScanStore } from '@/stores/scanStore'
import { useEditorStore } from '@/stores/editorStore'
import { Spinner } from '@/components/ui/Spinner'
import { darkSelectCls } from '@/components/ui/styles'

const TONES   = ['balanced', 'formal', 'casual', 'academic', 'professional']
const DOMAINS = ['general', 'academic', 'business', 'technical', 'medical', 'legal']

const INTENSITY_LABELS: Record<number, string> = {
  1: 'Minimal', 3: 'Light', 5: 'Moderate', 7: 'Heavy', 10: 'Aggressive',
}

function intensityLabel(v: number): string {
  const keys = [1, 3, 5, 7, 10]
  const nearest = keys.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a)
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
    <div className="flex flex-wrap items-center gap-3 px-4 py-3
                    bg-dark-card border-b border-white/8 shrink-0">

      {/* Intensity */}
      <div className="flex items-center gap-2.5">
        <label className="text-xs font-medium text-white/40 whitespace-nowrap">Intensity</label>
        <input
          type="range" min={1} max={10} step={1}
          value={settings.intensity}
          onChange={(e) => setSettings({ intensity: Number(e.target.value) })}
          className="w-24 h-1 rounded-full appearance-none cursor-pointer
                     bg-white/10 accent-violet-500"
          style={{ accentColor: '#a855f7' }}
        />
        <span className="text-xs font-semibold text-brand-violet w-[88px]">
          {settings.intensity} — {intensityLabel(settings.intensity)}
        </span>
      </div>

      <div className="w-px h-4 bg-white/10" />

      {/* Tone */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-white/40">Tone</label>
        <select value={settings.tone}
          onChange={(e) => setSettings({ tone: e.target.value })}
          className={darkSelectCls}>
          {TONES.map(t => (
            <option key={t} value={t} style={{ background: '#0f0f1c' }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Domain */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-white/40">Domain</label>
        <select value={settings.domain}
          onChange={(e) => setSettings({ domain: e.target.value })}
          className={darkSelectCls}>
          {DOMAINS.map(d => (
            <option key={d} value={d} style={{ background: '#0f0f1c' }}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Citations */}
      <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={settings.preserve_citations}
          onChange={(e) => setSettings({ preserve_citations: e.target.checked })}
          className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-violet-500"
          style={{ accentColor: '#a855f7' }}
        />
        Preserve citations
      </label>

      {/* Action buttons */}
      <div className="flex gap-2 ml-auto">
        <button
          onClick={() => humanize(text)}
          disabled={!canSubmit || hLoading}
          className="px-4 py-1.5 text-xs font-semibold rounded-lg
                     bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500
                     text-white hover:opacity-90
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-opacity shadow-md shadow-violet-900/30
                     focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        >
          {hLoading ? (
            <span className="flex items-center gap-1.5">
              <Spinner className="w-3 h-3 border-white" />
              Humanizing…
            </span>
          ) : 'Humanize'}
        </button>

        <button
          onClick={() => scan(text)}
          disabled={!canSubmit || sLoading}
          className="px-4 py-1.5 text-xs font-semibold rounded-lg
                     bg-white/8 border border-white/15 text-white/80
                     hover:bg-white/12 hover:border-white/25
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          {sLoading ? (
            <span className="flex items-center gap-1.5">
              <Spinner className="w-3 h-3 border-white/60" />
              Scanning…
            </span>
          ) : 'Scan'}
        </button>
      </div>
    </div>
  )
}
