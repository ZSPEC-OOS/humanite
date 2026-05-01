'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'

export default function LoginPage() {
  const { setAuth } = useUserStore()
  const router = useRouter()

  useEffect(() => {
    setAuth('dev-token', 'dev-user', 'pro', 'us-east-1', ['humanize', 'scan', 'export'])
    router.replace('/dashboard')
  }, [setAuth, router])

  return null
}
