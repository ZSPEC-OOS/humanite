'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'

const CORRECT_PIN = '5522'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', 'del']

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { setAuth } = useUserStore()
  const router = useRouter()

  useEffect(() => { inputRef.current?.focus() }, [])

  function handlePin(next: string) {
    if (next.length < 4) { setPin(next); return }
    setPin(next)
    if (next === CORRECT_PIN) {
      setAuth('dev-token', 'dev-user', 'pro', 'us-east-1', ['humanize', 'scan', 'export'])
      router.push('/dashboard')
    } else {
      setError(true)
      setTimeout(() => { setError(false); setPin(''); inputRef.current?.focus() }, 600)
    }
  }

  function pressDigit(d: string) {
    if (error) return
    handlePin((pin + d).slice(0, 4))
  }

  function pressDelete() {
    if (error) return
    setPin(p => p.slice(0, -1))
  }

  function onKeyInput(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
    e.target.value = ''
    if (digits) handlePin((pin + digits).slice(0, 4))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-base relative overflow-hidden">
      {/* Glow blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full
                      bg-brand-purple/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full
                      bg-brand-blue/8 blur-[100px] pointer-events-none" />

      {/* Hidden keyboard capture */}
      <input
        ref={inputRef}
        inputMode="numeric"
        pattern="[0-9]*"
        onChange={onKeyInput}
        className="sr-only"
        aria-label="PIN entry"
      />

      <div
        className="card-dark p-10 w-full max-w-sm flex flex-col items-center gap-8 relative"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
              <path d="M11 2L13.5 8.5L20 11L13.5 13.5L11 20L8.5 13.5L2 11L8.5 8.5L11 2Z"
                fill="url(#login-star)" />
              <defs>
                <linearGradient id="login-star" x1="2" y1="2" x2="20" y2="20">
                  <stop stopColor="#a855f7" />
                  <stop offset="1" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-xl font-bold text-gradient">Humanite</span>
          </div>
          <p className="text-sm text-white/40">Enter PIN to continue</p>
        </div>

        {/* PIN dots */}
        <div
          className="flex gap-4"
          style={error ? { animation: 'shake 0.5s ease-in-out' } : undefined}
        >
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                error
                  ? 'bg-red-500 border-red-500 scale-110'
                  : pin.length > i
                  ? 'bg-brand-violet border-brand-violet scale-110'
                  : 'bg-transparent border-white/20'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-400 -mt-4">Incorrect PIN</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {KEYS.map((key, i) => {
            if (key === null) return <div key={`empty-${i}`} />
            return (
              <button
                key={key}
                type="button"
                onClick={() => key === 'del' ? pressDelete() : pressDigit(key)}
                className="h-14 rounded-xl text-lg font-semibold
                           bg-white/5 hover:bg-white/10 active:bg-white/15
                           border border-white/8 hover:border-white/20
                           text-white transition-all select-none"
              >
                {key === 'del' ? '⌫' : key}
              </button>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-8px); }
          80%      { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
