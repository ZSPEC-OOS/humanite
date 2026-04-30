'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore }     from '@/stores/userStore'
import { useHumanizeStore } from '@/stores/humanizeStore'
import { useScanStore }     from '@/stores/scanStore'
import { useEditorStore }   from '@/stores/editorStore'
import { TextInput }        from '@/components/editor/TextInput'
import { ControlPanel }     from '@/components/editor/ControlPanel'
import { PresetSelector }   from '@/components/editor/PresetSelector'
import { SplitView }        from '@/components/output/SplitView'
import { ExportMenu }       from '@/components/output/ExportMenu'
import { ScanReport }       from '@/components/scanner/ScanReport'

export default function Dashboard() {
  const { isAuthenticated, tier, clearAuth }   = useUserStore()
  const { status: hStatus, reset: resetH, response } = useHumanizeStore()
  const { status: sStatus, reset: resetS }     = useScanStore()
  const { clearText }                           = useEditorStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/auth/login')
  }, [isAuthenticated, router])

  if (!isAuthenticated()) return null

  const showScanPanel   = sStatus !== 'idle'
  const showOutputPanel = hStatus !== 'idle'

  const handleClear = () => {
    clearText()
    resetH()
    resetS()
  }

  return (
    <div className="h-screen flex flex-col bg-dark-base overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex items-center px-5 py-3 bg-dark-card border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2">
          {/* Logo mark */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M9 1.5l2 5L16.5 9l-5.5 2.5L9 16.5 6.5 11.5 1.5 9l5-2L9 1.5z"
              fill="url(#logo-g)" />
            <defs>
              <linearGradient id="logo-g" x1="1.5" y1="1.5" x2="16.5" y2="16.5">
                <stop stopColor="#a855f7" />
                <stop offset="1" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-sm font-bold text-gradient">Humanite</span>
          <span className="text-white/20 text-xs">/</span>
          <span className="text-xs text-white/40">Dashboard</span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full
                           bg-brand-purple/20 text-brand-violet border border-brand-purple/30
                           uppercase tracking-wide">
            {tier ?? 'free'}
          </span>
          <PresetSelector />
          <button
            onClick={handleClear}
            className="text-xs text-white/30 hover:text-white/70 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => { clearAuth(); router.push('/auth/login') }}
            className="text-xs text-white/30 hover:text-white/70 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Control panel ───────────────────────────────────────────────── */}
      <ControlPanel />

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">

        <div className={`flex flex-col min-h-0 transition-all ${showScanPanel ? 'w-2/3' : 'w-full'} border-r border-white/8`}>
          <div className="h-1/3 border-b border-white/8 shrink-0">
            <TextInput />
          </div>
          <div className="flex-1 min-h-0">
            {showOutputPanel ? (
              <div className="flex flex-col h-full">
                <div className="flex-1 min-h-0">
                  <SplitView />
                </div>
                {response?.output && (
                  <div className="shrink-0 flex items-center justify-between
                                  px-3 py-2 border-t border-white/8 bg-dark-card">
                    <ExportMenu />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-xs">
                  <div className="text-3xl mb-3 opacity-30">✦</div>
                  <p className="text-sm font-medium text-white/40">Ready</p>
                  <p className="text-xs mt-1 text-white/30">
                    Paste your AI-generated text above and click{' '}
                    <span className="font-medium text-brand-violet">Humanize</span>{' '}
                    or{' '}
                    <span className="font-medium text-brand-blue">Scan</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {showScanPanel && (
          <div className="w-1/3 flex flex-col min-h-0 bg-dark-base">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8
                            bg-brand-purple/10 shrink-0">
              <span className="text-xs font-semibold text-brand-violet uppercase tracking-wide">
                Scanner Report
              </span>
              <button
                onClick={resetS}
                className="text-xs text-brand-violet/60 hover:text-brand-violet transition-colors"
              >
                ✕ Close
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ScanReport />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
