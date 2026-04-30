'use client'
import { useEffect, useState } from 'react'
import { useHumanizeStore } from '@/stores/humanizeStore'
import { useUserStore }     from '@/stores/userStore'
import { apiListPresets, apiCreatePreset, apiDeletePreset, Preset, APIError } from '@/lib/api'

const inputCls = `text-xs rounded-lg px-2.5 py-1.5 border
  bg-white/5 border-white/10 text-white/70 placeholder-white/25
  focus:outline-none focus:border-brand-violet/60 focus:ring-1 focus:ring-brand-violet/40`

export function PresetSelector() {
  const { isAuthenticated }               = useUserStore()
  const { settings, setSettings }         = useHumanizeStore()
  const [presets, setPresets]             = useState<Preset[]>([])
  const [saveName, setSaveName]           = useState('')
  const [showSaveForm, setShowSaveForm]   = useState(false)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) return
    apiListPresets().then(setPresets).catch(() => {})
  }, [isAuthenticated])

  const handleLoad = (preset: Preset) => {
    setSettings({
      intensity: preset.intensity,
      tone: preset.tone,
      domain: preset.domain,
      preserve_citations: preset.preserve_citations,
    })
  }

  const handleSave = async () => {
    if (!saveName.trim()) return
    setSaving(true); setError(null)
    try {
      const created = await apiCreatePreset({
        name: saveName.trim(),
        intensity: settings.intensity,
        tone: settings.tone,
        domain: settings.domain,
        preserve_citations: settings.preserve_citations,
      })
      setPresets(prev => [created, ...prev])
      setSaveName('')
      setShowSaveForm(false)
    } catch (e) {
      setError(e instanceof APIError ? e.message : 'Failed to save preset.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (presetId: string) => {
    try {
      await apiDeletePreset(presetId)
      setPresets(prev => prev.filter(p => p.id !== presetId))
    } catch { /* non-critical */ }
  }

  if (!isAuthenticated()) return null

  return (
    <div className="flex items-center gap-2">
      {presets.length > 0 && (
        <select
          onChange={(e) => {
            const preset = presets.find(p => p.id === e.target.value)
            if (preset) handleLoad(preset)
            e.target.value = ''
          }}
          defaultValue=""
          className={`${inputCls} max-w-[140px] appearance-none cursor-pointer`}
          style={{ background: '#0f0f1c' }}
        >
          <option value="" disabled style={{ background: '#0f0f1c' }}>Load preset…</option>
          {presets.map(p => (
            <option key={p.id} value={p.id} style={{ background: '#0f0f1c' }}>{p.name}</option>
          ))}
        </select>
      )}

      {showSaveForm ? (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            placeholder="Preset name…"
            maxLength={100}
            className={`${inputCls} w-28`}
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={!saveName.trim() || saving}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-brand-violet text-white
                       hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {saving ? '…' : 'Save'}
          </button>
          <button
            onClick={() => { setShowSaveForm(false); setSaveName(''); setError(null) }}
            className="text-xs text-white/30 hover:text-white/60 px-1"
          >✕</button>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      ) : (
        <button
          onClick={() => setShowSaveForm(true)}
          className="text-xs text-white/30 hover:text-brand-violet transition-colors"
          title="Save current settings as preset"
        >
          + Save preset
        </button>
      )}
    </div>
  )
}
