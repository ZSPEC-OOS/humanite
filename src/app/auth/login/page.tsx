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

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handlePin(next: string) {
    if (next.length < 4) {
      setPin(next)
      return
    }
    // exactly 4 digits
    setPin(next)
    if (next === CORRECT_PIN) {
      setAuth('dev-token', 'dev-user', 'pro', 'us-east-1', ['humanize', 'scan', 'export'])
      router.push('/dashboard')
    } else {
      setError(true)
      setTimeout(() => {
        setError(false)
        setPin('')
        inputRef.current?.focus()
      }, 600)
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* hidden input captures physical keyboard on desktop + mobile keyboard on tap */}
      <input
        ref={inputRef}
        inputMode="numeric"
        pattern="[0-9]*"
        onChange={onKeyInput}
        className="sr-only"
        aria-label="PIN entry"
      />

      <div
        className="bg-white p-10 rounded-2xl shadow-md w-full max-w-sm flex flex-col items-center gap-8"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Humanite</h1>
          <p className="text-sm text-gray-400 mt-1">Enter PIN to continue</p>
        </div>

        {/* PIN dots */}
        <div
          className="flex gap-4"
          style={error ? { animation: 'shake 0.5s ease-in-out' } : undefined}
        >
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-colors duration-150 ${
                error
                  ? 'bg-red-500 border-red-500'
                  : pin.length > i
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-transparent border-gray-300'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-500 -mt-4">Incorrect PIN</p>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {KEYS.map((key, i) => {
            if (key === null) return <div key={`empty-${i}`} />
            return (
              <button
                key={key}
                type="button"
                onClick={() => key === 'del' ? pressDelete() : pressDigit(key)}
                className="h-14 rounded-xl text-lg font-medium bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors select-none"
              >
                {key === 'del' ? '⌫' : key}
              </button>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-8px); }
          80%       { transform: translateX(8px); }
        }
      `}</style>
    </div>
  )
}
