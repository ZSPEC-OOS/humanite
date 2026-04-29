import { create } from 'zustand'
import { apiHumanize, HumanizeAPIResponse, HumanizeSettings } from '@/lib/api'

interface HumanizeState {
  settings: HumanizeSettings
  response: HumanizeAPIResponse | null
  status: 'idle' | 'loading' | 'done' | 'error'
  error: string | null
  setSettings: (patch: Partial<HumanizeSettings>) => void
  humanize: (text: string) => Promise<void>
  reset: () => void
}

const DEFAULT_SETTINGS: HumanizeSettings = {
  intensity: 5,
  tone: 'balanced',
  domain: 'general',
  preserve_citations: true,
}

export const useHumanizeStore = create<HumanizeState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  response: null,
  status: 'idle',
  error: null,

  setSettings: (patch) =>
    set((state) => ({ settings: { ...state.settings, ...patch } })),

  humanize: async (text) => {
    set({ status: 'loading', error: null })
    try {
      const resp = await apiHumanize(text, get().settings)
      set({ response: resp, status: 'done' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Humanization failed.'
      set({ status: 'error', error: msg })
    }
  },

  reset: () => set({ response: null, status: 'idle', error: null }),
}))
