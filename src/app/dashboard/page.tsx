'use client'
import { useEffect, useState } from 'react'
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

type MobileTab = 'input' | 'output' | 'scan'

export default function Dashboard() {
  const { isAuthenticated, tier, clearAuth }            = useUserStore()
  const { status: hStatus, reset: resetH, response }   = useHumanizeStore()
  const { status: sStatus, reset: resetS }              = useScanStore()
  const { clearText }                                   = useEditorStore()
  const router = useRouter()
  const [mobileTab, setMobileTab] = useState<MobileTab>('input')

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/auth/login')
  }, [isAuthenticated, router])

  // Auto-switch mobile tab when a result arrives
  useEffect(() => {
    if (hStatus === 'done') setMobileTab('output')
  }, [hStatus])
  useEffect(() => {
    if (sStatus === 'done') setMobileTab('scan')
  }, [sStatus])

  if (!isAuthenticated()) return null

  const showScanPanel   = sStatus !== 'idle'
  const showOutputPanel = hStatus !== 'idle'

  const handleClear = () => {
    clearText(); resetH(); resetS()
    setMobileTab('input')
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-dark-base overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-center px-4 py-2.5 bg-dark-card border-b border-white/8 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 min-w-0">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M9 1.5l2 5L16.5 9l-5.5 2.5L9 16.5 6.5 11.5 1.5 9l5-2L9 1.5z"
              fill="url(#logo-g)" />
            <defs>
              <linearGradient id="logo-g" x1="1.5" y1="1.5" x2="16.5" y2="16.5">
                <stop stopColor="#a855f7" /><stop offset="1" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-sm font-bold text-gradient">Humanite</span>
          <span className="text-white/20 text-xs hidden sm:inline">/</span>
          <span className="text-xs text-white/40 hidden sm:inline">Dashboard</span>
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full
                           bg-brand-purple/20 text-brand-violet border border-brand-purple/30
                           uppercase tracking-wide">
            {tier ?? 'free'}
          </span>
          {/* Preset selector hidden on very small screens to save space */}
          <div className="hidden sm:flex">
            <PresetSelector />
          </div>
          <button onClick={handleClear}
            className="text-xs text-white/30 hover:text-white/70 transition-colors px-1">
            Clear
          </button>
          <button onClick={() => { clearAuth(); router.push('/auth/login') }}
            className="text-xs text-white/30 hover:text-white/70 transition-colors px-1">
            Sign out
          </button>
        </div>
      </header>

      {/* ── Control panel ───────────────────────────────────────────────── */}
      <ControlPanel />

      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP layout  (md+): side-by-side panels
          MOBILE layout   (<md): single panel controlled by bottom tab bar
          ══════════════════════════════════════════════════════════════════ */}

      {/* ── Desktop main area ───────────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 min-h-0">
        <div className={`flex flex-col min-h-0 transition-all border-r border-white/8
                         ${showScanPanel ? 'w-2/3' : 'w-full'}`}>
          <div className="h-1/3 border-b border-white/8 shrink-0">
            <TextInput />
          </div>
          <div className="flex-1 min-h-0">
            {showOutputPanel ? (
              <div className="flex flex-col h-full">
                <div className="flex-1 min-h-0"><SplitView /></div>
                {response?.output && (
                  <div className="shrink-0 flex items-center px-3 py-2
                                  border-t border-white/8 bg-dark-card">
                    <ExportMenu />
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-xs">
                  <div className="text-3xl mb-3 opacity-30">✦</div>
                  <p className="text-sm font-medium text-white/40">Ready to humanize</p>
                  <p className="text-xs mt-1 text-white/30">
                    Paste text above and click{' '}
                    <span className="font-medium text-brand-violet">Humanize</span>{' '}
                    or <span className="font-medium text-brand-blue">Scan</span>
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
              <button onClick={resetS}
                className="text-xs text-brand-violet/60 hover:text-brand-violet transition-colors">
                ✕ Close
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto"><ScanReport /></div>
          </div>
        )}
      </div>

      {/* ── Mobile main area ────────────────────────────────────────────── */}
      <div className="flex md:hidden flex-1 min-h-0 flex-col">
        {/* Active panel */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {mobileTab === 'input' && (
            <div className="h-full">
              <TextInput />
            </div>
          )}
          {mobileTab === 'output' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 min-h-0">
                <SplitView mobileOutputOnly />
              </div>
              {response?.output && (
                <div className="shrink-0 flex items-center px-3 py-2
                                border-t border-white/8 bg-dark-card">
                  <ExportMenu />
                </div>
              )}
            </div>
          )}
          {mobileTab === 'scan' && (
            <div className="h-full overflow-y-auto">
              <ScanReport />
            </div>
          )}
        </div>

        {/* Bottom tab bar */}
        <nav className="shrink-0 flex border-t border-white/8 bg-dark-card
                        safe-area-pb">
          {([
            { id: 'input',  label: 'Input',  icon: (
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="16" height="16" rx="3"
                  stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 7h10M5 10.5h7M5 14h5"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )},
            { id: 'output', label: 'Output', icon: (
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7.5"
                  stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 10l2 2 4-4"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )},
            { id: 'scan',   label: 'Scan',   icon: (
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L12.5 8 19 10l-6.5 2.5L10 18l-2.5-5.5L1 10l6.5-2L10 2z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            )},
          ] as const).map(tab => {
            const active = mobileTab === tab.id
            const hasBadge = tab.id === 'output' && showOutputPanel
                          || tab.id === 'scan'   && showScanPanel
            return (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id as MobileTab)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium
                            transition-colors relative
                            ${active ? 'text-brand-violet' : 'text-white/30 hover:text-white/60'}`}
              >
                {tab.icon}
                {tab.label}
                {hasBadge && !active && (
                  <span className="absolute top-2 right-[calc(50%-14px)] w-1.5 h-1.5
                                   rounded-full bg-brand-violet" />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
