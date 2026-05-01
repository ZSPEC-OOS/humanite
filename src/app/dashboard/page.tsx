'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore }     from '@/stores/userStore'
import { useHumanizeStore } from '@/stores/humanizeStore'
import { useScanStore }     from '@/stores/scanStore'
import { useEditorStore }   from '@/stores/editorStore'
import { ControlPanel }     from '@/components/editor/ControlPanel'
import { PresetSelector }   from '@/components/editor/PresetSelector'
import { ExportMenu }       from '@/components/output/ExportMenu'
import { ScanReport }       from '@/components/scanner/ScanReport'
import { Spinner }          from '@/components/ui/Spinner'

const MAX_CHARS = 10_000

function wordCount(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0
}

function CircularScore({ pct }: { pct: number }) {
  const r = 26, circ = 2 * Math.PI * r
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden>
      <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle
        cx="34" cy="34" r={r} fill="none" stroke="#22c55e" strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" transform="rotate(-90 34 34)"
      />
      <text x="34" y="34" textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize="13" fontWeight="700">{pct}%</text>
    </svg>
  )
}

type MobileTab = 'input' | 'output' | 'scan'

export default function Dashboard() {
  const { isAuthenticated, tier, clearAuth }                           = useUserStore()
  const { humanize, status: hStatus, reset: resetH, response, error } = useHumanizeStore()
  const { scan, status: sStatus, reset: resetS, response: scanResp }  = useScanStore()
  const { text, setText, clearText }                                   = useEditorStore()
  const router = useRouter()
  const [mobileTab, setMobileTab] = useState<MobileTab>('input')
  const [copied, setCopied]       = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/auth/login')
  }, [isAuthenticated, router])

  useEffect(() => { if (hStatus === 'done') setMobileTab('output') }, [hStatus])
  useEffect(() => { if (sStatus === 'done') setMobileTab('scan')   }, [sStatus])

  if (!isAuthenticated()) return null

  const output     = response?.output
  const outputText = output?.text ?? ''
  const canSubmit  = text.trim().length >= 20
  const hLoading   = hStatus === 'loading'
  const sLoading   = sStatus === 'loading'
  const showScan   = sStatus !== 'idle'

  const handleClear = () => { clearText(); resetH(); resetS(); setMobileTab('input') }
  const handleCopy  = () => {
    if (!outputText) return
    navigator.clipboard.writeText(outputText).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  const humanScore = output ? Math.round((output.quality_scores.bertscore_f1 ?? 0.85) * 100) : 0
  const scoreLabel = humanScore >= 90 ? 'Excellent' : humanScore >= 75 ? 'Good' : humanScore > 0 ? 'Fair' : '—'
  const aiDetLabel = scanResp?.classification === 'human-written' ? 'Undetectable'
                   : scanResp?.classification === 'ai-generated'  ? 'Detected'
                   : scanResp?.classification === 'mixed'         ? 'Partial'
                   : null

  /* ── Shared panel JSX ── */
  const inputPanel = (
    <div className="bg-[#0a0a18] border border-white/8 rounded-2xl flex flex-col h-full min-h-[260px]">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-white/6 shrink-0">
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
          <rect x="2" y="2" width="16" height="16" rx="4" stroke="#818cf8" strokeWidth="1.4" />
          <path d="M5 7h10M5 10.5h7M5 14h5" stroke="#818cf8" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-semibold text-white/60">AI-Generated Text</span>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
        placeholder="Paste your AI-generated text here…"
        className="flex-1 bg-transparent resize-none text-sm text-white/80 leading-relaxed
                   px-4 py-3 outline-none placeholder-white/20 font-sans"
      />
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/6 shrink-0">
        <span className="text-xs text-white/30">{wordCount(text)} Words</span>
        <button onClick={handleClear} title="Clear"
          className="text-white/20 hover:text-white/55 transition-colors">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M2 14l12-12M14 14L2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )

  const outputPanel = (
    <div className="bg-[#0a0a18] border border-white/8 rounded-2xl flex flex-col h-full min-h-[260px]">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/6 shrink-0">
        <div className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
            <circle cx="10" cy="10" r="7.5" stroke="#a855f7" strokeWidth="1.4" />
            <path d="M7 10l2 2 4-4" stroke="#a855f7" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-semibold text-white/60">Humanized Text</span>
        </div>
        {output?.quality_scores.passed && (
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-green-400">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.4" />
            <path d="M6.5 10l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
        {hLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Spinner className="w-8 h-8 border-brand-violet/30 border-t-brand-violet block mx-auto mb-3" />
              <p className="text-xs text-white/40">Rewriting…</p>
            </div>
          </div>
        ) : hStatus === 'error' ? (
          <p className="text-sm text-red-400">{error ?? 'Humanization failed.'}</p>
        ) : outputText ? outputText : (
          <span className="text-white/20 italic">Your humanized text will appear here…</span>
        )}
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/6 shrink-0">
        <span className="text-xs text-white/30">{wordCount(outputText)} Words</span>
        <div className="flex items-center gap-3">
          {output && <ExportMenu />}
          <button onClick={handleCopy} disabled={!outputText} title={copied ? 'Copied!' : 'Copy'}
            className="text-white/25 hover:text-white/65 transition-colors disabled:opacity-30">
            {copied ? (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 8l4 4 8-8" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                <rect x="5" y="1" width="9" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M3 4H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-[100dvh] bg-[#080810] flex flex-col items-center py-3 px-3 md:py-6 md:px-6"
      style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(124,58,237,0.07) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236,72,153,0.05) 0%, transparent 50%)' }}>

      <div className="w-full max-w-6xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(#0f0f1c, #0f0f1c) padding-box, linear-gradient(135deg, rgba(124,58,237,0.4), rgba(30,27,75,0.15), rgba(236,72,153,0.3)) border-box',
          border: '1px solid transparent',
          minHeight: 'calc(100dvh - 1.5rem)',
        }}>

        {/* ── Header ── */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M10 1.5l2.5 6L19 10l-6.5 2.5L10 19l-2.5-6.5L1 10l6.5-2L10 1.5z" fill="url(#hg)" />
              <defs>
                <linearGradient id="hg" x1="1" y1="1" x2="19" y2="19">
                  <stop stopColor="#a855f7" /><stop offset="1" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-base font-bold"
              style={{ background: 'linear-gradient(90deg,#c084fc,#f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Humanite
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block"><PresetSelector /></div>
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full
                             border border-brand-purple/40 bg-brand-purple/15 text-brand-violet">
              ✦ {(tier ?? 'free').charAt(0).toUpperCase() + (tier ?? 'free').slice(1)} Plan
            </span>
            <button onClick={handleClear}
              className="text-xs text-white/30 hover:text-white/60 transition-colors hidden sm:inline">
              Clear
            </button>
            <button onClick={() => { clearAuth(); router.push('/auth/login') }}
              className="text-xs text-white/30 hover:text-white/60 transition-colors">
              Sign out
            </button>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════════
            DESKTOP  (md+)
            ══════════════════════════════════════════════════════════════ */}
        <div className="hidden md:flex flex-col flex-1 min-h-0 p-5 gap-4">

          {/* Two panels + centre orb */}
          <div className="grid flex-1 min-h-0" style={{ gridTemplateColumns: '1fr 108px 1fr', minHeight: '320px' }}>
            {inputPanel}

            {/* Centre orb */}
            <div className="flex flex-col items-center justify-center gap-4 px-2">
              <button
                aria-label="Humanize"
                onClick={() => humanize(text)}
                disabled={!canSubmit || hLoading}
                className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center
                           disabled:opacity-40 disabled:cursor-not-allowed
                           transition-transform hover:scale-105 active:scale-95
                           focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                style={{
                  background: 'radial-gradient(circle at 38% 38%, #9333ea, #4f46e5 80%)',
                  boxShadow: '0 0 0 8px rgba(139,92,246,0.12), 0 0 0 18px rgba(139,92,246,0.06), 0 0 40px rgba(139,92,246,0.5)',
                }}
              >
                {hLoading
                  ? <Spinner className="w-5 h-5 border-white/30 border-t-white" />
                  : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )
                }
              </button>
              <button
                onClick={() => scan(text)}
                disabled={!canSubmit || sLoading}
                className="text-xs text-white/30 hover:text-white/65 transition-colors
                           disabled:opacity-30 flex items-center gap-1.5 focus:outline-none"
              >
                {sLoading && <Spinner className="w-3 h-3 border-white/20 border-t-white/60" />}
                Scan
              </button>
            </div>

            {outputPanel}
          </div>

          {/* Settings */}
          <ControlPanel />

          {/* Stats — only after first result */}
          {(output || showScan) && (
            <div className="bg-[#0a0a18] border border-white/8 rounded-2xl px-6 py-4 shrink-0">
              <div className="flex items-center gap-6 flex-wrap">

                {output && (
                  <>
                    <div className="flex items-center gap-3">
                      <CircularScore pct={humanScore} />
                      <div>
                        <p className="text-sm font-semibold text-white/70">Human Score</p>
                        <p className="text-sm font-bold text-green-400">{scoreLabel}</p>
                      </div>
                    </div>
                    <div className="w-px h-12 bg-white/8" />
                  </>
                )}

                {showScan && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center
                                      bg-brand-violet/10 border border-brand-violet/25">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
                          <path d="M10 2l1.5 4.5L16 8l-4.5 2L10 14l-1.5-4L4 8l4.5-1.5L10 2z"
                            stroke="#a855f7" strokeWidth="1.3" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/70">AI Detection</p>
                        <p className={`text-sm font-bold ${
                          aiDetLabel === 'Undetectable' ? 'text-green-400'
                          : aiDetLabel === 'Detected'   ? 'text-red-400'
                          : aiDetLabel === 'Partial'    ? 'text-amber-400'
                          : 'text-white/30'
                        }`}>{aiDetLabel ?? 'Run scan'}</p>
                      </div>
                    </div>
                    {output && <div className="w-px h-12 bg-white/8" />}
                  </>
                )}

                {output && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center
                                    bg-green-500/10 border border-green-500/25">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
                        <circle cx="10" cy="10" r="7.5" stroke="#22c55e" strokeWidth="1.4" />
                        <path d="M6.5 10l2.5 2.5 5-5" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/70">Readability</p>
                      <p className="text-sm font-bold text-green-400">
                        {output.quality_scores.passed ? 'Natural' : 'Review'}
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            MOBILE  (<md) — tab-based
            ══════════════════════════════════════════════════════════════ */}
        <div className="flex md:hidden flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto">

            {mobileTab === 'input' && (
              <div className="flex flex-col gap-3 p-3 min-h-full">
                <div style={{ minHeight: '220px' }}>{inputPanel}</div>
                <ControlPanel />
              </div>
            )}

            {mobileTab === 'output' && (
              <div className="flex flex-col gap-3 p-3 min-h-full">
                <div style={{ minHeight: '280px', flex: 1 }}>{outputPanel}</div>
                {output && (
                  <div className="bg-[#0a0a18] border border-white/8 rounded-xl px-4 py-3
                                  flex items-center gap-4 shrink-0">
                    <CircularScore pct={humanScore} />
                    <div>
                      <p className="text-sm font-semibold text-white/70">Human Score</p>
                      <p className="text-sm font-bold text-green-400">{scoreLabel}</p>
                    </div>
                    <button onClick={handleCopy} disabled={!outputText}
                      className="ml-auto text-xs text-brand-violet/70 hover:text-brand-violet
                                 disabled:opacity-30 transition-colors">
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {mobileTab === 'scan' && (
              <div className="min-h-full"><ScanReport /></div>
            )}
          </div>

          {/* Bottom tab bar */}
          <nav className="shrink-0 flex border-t border-white/8 bg-[#0f0f1c] safe-area-pb">
            {([
              { id: 'input',  label: 'Input',  icon: (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M5 7h10M5 10.5h7M5 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )},
              { id: 'output', label: 'Output', icon: (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )},
              { id: 'scan',   label: 'Scan',   icon: (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L12.5 8 19 10l-6.5 2.5L10 18l-2.5-5.5L1 10l6.5-2L10 2z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              )},
            ] as const).map(tab => {
              const active   = mobileTab === tab.id
              const hasBadge = (tab.id === 'output' && hStatus !== 'idle')
                            || (tab.id === 'scan'   && showScan)
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
    </div>
  )
}
