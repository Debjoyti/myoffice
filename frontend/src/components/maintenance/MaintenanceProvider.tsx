'use client'

import { useEffect, useState } from 'react'
import MaintenanceBanner from './MaintenanceBanner'
import MaintenancePage from './MaintenancePage'

interface MaintenanceState {
  id: string
  type: 'scheduled' | 'active' | 'partial'
  is_active: boolean
  start_time: string | null
  end_time: string | null
  duration: string | null
  description: string | null
  affected_features: string[]
  contact_email: string
  alternate_url: string | null
  redirect_url: string | null
}

export default function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [maintenance, setMaintenance] = useState<MaintenanceState | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/v1/maintenance/status')
        if (!res.ok) return
        const { maintenance: m } = await res.json()
        setMaintenance(m ?? null)
      } catch {
        // Silently ignore — don't block the app if this fails
      }
    }

    check()
    // Poll every 60 seconds for updates
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [])

  if (!maintenance) return <>{children}</>

  // Type B — full blocking page
  if (maintenance.type === 'active') {
    return <MaintenancePage maintenance={maintenance} />
  }

  // Type A — non-blocking banner at top
  return (
    <>
      <MaintenanceBanner maintenance={maintenance} />
      {children}
    </>
  )
}
