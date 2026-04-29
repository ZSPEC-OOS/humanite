'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'

export default function Dashboard() {
  const { isAuthenticated, tier, clearAuth } = useUserStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/auth/login')
  }, [isAuthenticated, router])

  if (!isAuthenticated()) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Humanite</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium uppercase">
            {tier}
          </span>
          <button
            onClick={() => {
              clearAuth()
              router.push('/auth/login')
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg font-medium">Dashboard coming in Phase 7</p>
          <p className="text-sm mt-1">Authentication complete ✓</p>
        </div>
      </main>
    </div>
  )
}
