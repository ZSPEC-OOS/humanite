'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore }     from '@/stores/userStore'
import { useHumanizeStore } from '@/stores/humanizeStore'
import { useScanStore }     from '@/stores/scanStore'
import { useEditorStore }   from '@/stores/editorStore'
import { TextInput }        from '@/components/editor/TextInput'
import { ControlPanel }     from '@/components/editor/ControlPanel'
import { SplitView }        from '@/components/output/SplitView'
import { ScanReport }       from '@/components/scanner/ScanReport'

export default function Dashboard() {
  const { isAuthenticated, tier, clearAuth } = useUserStore()
  const { status: hStatus, reset: resetH }   = useHumanizeStore()
  const { status: sStatus, reset: resetS }   = useScanStore()
  const { clearText }                         = useEditorStore()
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
    <div className="h-screen flex flex-col bg-white overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex items-center px-4 py-2.5 bg-white border-b border-gray-200 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900">Humanite</span>
          <span className="text-xs text-gray-400">/</span>
          <span className="text-xs text-gray-500">Dashboard</span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 uppercase tracking-wide">
            {tier ?? 'free'}
          </span>
          <button
            onClick={handleClear}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => {
              clearAuth()
              router.push('/auth/login')
            }}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Control panel ───────────────────────────────────────────────── */}
      <ControlPanel />

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">

        {/* Text input + output — takes remaining width unless scan panel is open */}
        <div className={`flex flex-col min-h-0 transition-all ${showScanPanel ? 'w-2/3' : 'w-full'} border-r border-gray-200`}>

          {/* Text input: fixed height third of available space */}
          <div className="h-1/3 border-b border-gray-200 shrink-0">
            <TextInput />
          </div>

          {/* Output / split view */}
          <div className="flex-1 min-h-0">
            {showOutputPanel ? (
              <SplitView />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-400 max-w-xs">
                  <div className="text-3xl mb-3">✦</div>
                  <p className="text-sm font-medium text-gray-500">Ready</p>
                  <p className="text-xs mt-1">
                    Paste your AI-generated text above and click{' '}
                    <span className="font-medium text-blue-600">Humanize</span>{' '}
                    or{' '}
                    <span className="font-medium text-purple-600">Scan</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scanner panel — slides in when a scan is run */}
        {showScanPanel && (
          <div className="w-1/3 flex flex-col min-h-0 bg-white">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-purple-50 shrink-0">
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                Scanner Report
              </span>
              <button
                onClick={resetS}
                className="text-xs text-purple-400 hover:text-purple-600 transition-colors"
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
