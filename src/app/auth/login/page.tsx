'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'

const CORRECT_PIN = '5522'

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)
  const { setAuth } = useUserStore()
  const router = useRouter()

  const submit = useCallback((entered: string) => {
    if (entered === CORRECT_PIN) {
      setAuth('dev-token', 'dev-user', 'pro', 'us-east-1', ['humanize', 'scan', 'export'])
      router.push('/dashboard')
    } else {
      setShake(true)
      setTimeout(() => {
        setShake(false)
        setPin('')
      }, 600)
    }
  }, [setAuth, router])

  const press = useCallback((digit: string) => {
    setPin(prev => {
      const next = prev.length < 4 ? prev + digit : prev
      if (next.length === 4) setTimeout(() => submit(next), 50)
      return next
    })
  }, [submit])

  const del = useCallback(() => setPin(prev => prev.slice(0, -1)), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') press(e.key)
      else if (e.key === 'Backspace') del()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [press, del])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-md w-full max-w-sm flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Humanite</h1>
          <p className="text-sm text-gray-400 mt-1">Enter PIN to continue</p>
        </div>

        {/* PIN dots */}
        <div className={`flex gap-4 ${shake ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-colors duration-150 ${
                pin.length > i ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-gray-300'
              }`}
            />
          ))}
        </div>

        {shake && (
          <p className="text-sm text-red-500 -mt-4">Incorrect PIN</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => {
            if (key === '') return <div key={i} />
            return (
              <button
                key={key}
                onClick={() => key === '⌫' ? del() : press(key)}
                className="h-14 rounded-xl text-lg font-medium bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors select-none"
              >
                {key}
              </button>
            )
          })}
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  )
}
