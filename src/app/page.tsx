import Link from 'next/link'

// ── Static demo content for the app preview card ──────────────────────────
const AI_SAMPLE = `Artificial intelligence has become an essential part of our daily lives. It helps us accomplish tasks quickly and efficiently. From writing emails to generating content, AI tools save time and increase productivity. However, many AI-generated texts lack a human touch and can be easily detected by AI detectors.`

const HUMAN_SAMPLE = `There's no denying how much artificial intelligence has become a part of our everyday lives. It helps us get things done faster, whether it's drafting an email, brainstorming ideas, or creating content. That said, AI-generated text often feels a little flat or mechanical—and honestly, it's usually pretty easy for detectors to flag.`

// ── Sub-components ─────────────────────────────────────────────────────────

function Logo() {
  return (
    <span className="flex items-center gap-2 text-xl font-bold">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <path d="M11 2L13.5 8.5L20 11L13.5 13.5L11 20L8.5 13.5L2 11L8.5 8.5L11 2Z"
          fill="url(#star-g)" />
        <defs>
          <linearGradient id="star-g" x1="2" y1="2" x2="20" y2="20">
            <stop stopColor="#a855f7" />
            <stop offset="1" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-gradient">Humanite</span>
    </span>
  )
}

function NavBar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-4
                       bg-dark-base/80 backdrop-blur-md border-b border-white/5">
      <Logo />
      <nav className="hidden md:flex items-center gap-8 text-sm text-white/60">
        {['Features', 'How It Works', 'Benefits', 'Pricing', 'FAQ'].map(l => (
          <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}
             className="hover:text-white transition-colors">{l}</a>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <Link href="/auth/login"
          className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5">
          Sign in
        </Link>
        <Link href="/auth/login"
          className="btn-primary px-5 py-2 text-sm flex items-center gap-1.5">
          Open Humanite Professional
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </header>
  )
}

function FeatureIcon({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center max-w-[140px]">
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center
                      justify-center text-2xl">
        {icon}
      </div>
      <span className="text-sm font-semibold text-white">{label}</span>
      <span className="text-xs text-white/50 leading-relaxed">{desc}</span>
    </div>
  )
}

function AppPreviewCard() {
  return (
    <div className="card-dark p-5 w-full max-w-[680px] animate-float shadow-2xl shadow-purple-900/20">
      {/* Card header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/8">
        <Logo />
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-brand-violet bg-brand-purple/15
                           px-3 py-1 rounded-full border border-brand-purple/30">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M6 1l1.5 3.5L11 6 7.5 7.5 6 11 4.5 7.5 1 6l3.5-1.5L6 1z"
                fill="currentColor" />
            </svg>
            Pro Plan
          </span>
          <div className="w-7 h-7 rounded-full bg-gradient-brand" />
        </div>
      </div>

      {/* Split text panels */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <rect x="1" y="1" width="12" height="12" rx="2" stroke="#818cf8" strokeWidth="1.2"/>
              <path d="M4 5h6M4 7.5h4" stroke="#818cf8" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="text-xs font-semibold text-white/60">AI-Generated Text</span>
          </div>
          <div className="bg-white/4 rounded-xl p-4 text-xs text-white/70 leading-relaxed min-h-[180px]">
            {AI_SAMPLE}
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[11px] text-white/30">123 Words</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white/25" aria-hidden>
              <path d="M2 2h10M2 7h7M2 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center gap-1.5 mb-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <circle cx="7" cy="7" r="5.5" stroke="#a855f7" strokeWidth="1.2"/>
              <path d="M5 7l1.5 1.5L9 5.5" stroke="#a855f7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs font-semibold text-white/60">Humanized Text</span>
          </div>
          <div className="bg-white/4 rounded-xl p-4 text-xs text-white/85 leading-relaxed min-h-[180px] border border-brand-violet/20">
            {HUMAN_SAMPLE}
          </div>
          {/* Check badge */}
          <div className="absolute top-10 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[11px] text-white/30">123 Words</span>
            <div className="flex gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white/25" aria-hidden>
                <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4 4h6v6H4z" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white/25" aria-hidden>
                <path d="M4 2v10M4 2l6 5-6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/8">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 shrink-0">
            <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#score-g)" strokeWidth="3"
                strokeDasharray="99.8 100" strokeLinecap="round"/>
              <defs>
                <linearGradient id="score-g" x1="0" y1="0" x2="1" y2="0">
                  <stop stopColor="#a855f7"/>
                  <stop offset="1" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">98%</span>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-white/70">Human Score</div>
            <div className="text-[11px] text-green-400 font-semibold">Excellent</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M7 1l1.5 3.5L12 7 8.5 8.5 7 12 5.5 8.5 2 7l3.5-1.5L7 1z"
                stroke="#818cf8" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-white/70">AI Detection</div>
            <div className="text-[11px] text-green-400 font-semibold">Undetectable</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <circle cx="7" cy="7" r="5.5" stroke="#a855f7" strokeWidth="1.2"/>
              <path d="M5 7l1.5 1.5L9 5.5" stroke="#a855f7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-white/70">Readability</div>
            <div className="text-[11px] text-green-400 font-semibold">Natural</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TrustedBy() {
  const groups = [
    { icon: '🎓', label: 'Students', desc: 'Write better essays and assignments.' },
    { icon: '✍️', label: 'Writers', desc: 'Create content that connects naturally.' },
    { icon: '💼', label: 'Professionals', desc: 'Communicate with clarity and authenticity.' },
    { icon: '🏢', label: 'Businesses', desc: 'Deliver messages that build trust.' },
  ]
  return (
    <section className="py-24 px-6 text-center border-t border-white/5">
      <p className="text-xs tracking-[0.25em] uppercase text-white/30 mb-12">
        Trusted by students, writers, professionals &amp; businesses
      </p>
      <div className="flex flex-wrap justify-center gap-12">
        {groups.map(g => (
          <div key={g.label} className="flex flex-col items-center gap-2 max-w-[140px]">
            <span className="text-3xl">{g.icon}</span>
            <span className="text-sm font-semibold text-white">{g.label}</span>
            <span className="text-xs text-white/40 text-center leading-relaxed">{g.desc}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-dark-base text-white overflow-x-hidden">
      {/* Ambient glow blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full
                        bg-brand-purple/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full
                        bg-brand-blue/8 blur-[100px]" />
      </div>

      <NavBar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <main className="pt-32 pb-20 px-6 max-w-[1200px] mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Left column */}
          <div className="flex-1 flex flex-col gap-8 max-w-[540px]">
            <div className="inline-flex items-center gap-2 text-xs font-semibold
                            px-4 py-2 rounded-full bg-white/5 border border-white/10
                            text-brand-violet w-fit">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M6 1l1.5 3.5L11 6 7.5 7.5 6 11 4.5 7.5 1 6l3.5-1.5L6 1z"
                  fill="currentColor"/>
              </svg>
              AI TEXT. HUMAN IMPACT.
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
              <span className="text-gradient">AI to Human</span>
              <br />
              <span className="text-white">Text Converter</span>
            </h1>

            <p className="text-lg font-medium" style={{
              background: 'linear-gradient(90deg, #e2e2f0, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              — Indistinguishably Human... Text —
            </p>

            <p className="text-white/55 leading-relaxed text-base max-w-[420px]">
              Humanite transforms AI-generated text into writing that feels naturally
              human—indistinguishable, authentic, and undetectable. Perfect for essays,
              articles, emails, content, and more.
            </p>

            <div className="flex flex-wrap gap-8 mt-2">
              <FeatureIcon icon="🛡️" label="Undetectable"
                desc="Bypass AI detectors with human-like authenticity." />
              <FeatureIcon icon="🧠" label="Context Aware"
                desc="Understands meaning, tone, and intent deeply." />
              <FeatureIcon icon="⚡" label="Fast & Reliable"
                desc="Get humanized results in seconds, every time." />
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2">
              <Link href="/auth/login"
                className="btn-primary px-7 py-3.5 text-sm flex items-center gap-2">
                Open Humanite Professional
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <a href="#how-it-works"
                className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                Learn how it works
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M7 9l2 2 2-2" stroke="currentColor" strokeWidth="1.2"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Right column — app preview */}
          <div className="flex-1 flex justify-center w-full">
            <AppPreviewCard />
          </div>
        </div>
      </main>

      <TrustedBy />
    </div>
  )
}
