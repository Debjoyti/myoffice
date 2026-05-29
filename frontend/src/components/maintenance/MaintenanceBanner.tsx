'use client'

import { useEffect, useState } from 'react'

interface MaintenanceState {
  id: string
  type: 'scheduled' | 'active' | 'partial'
  start_time: string | null
  end_time: string | null
  duration: string | null
  description: string | null
  affected_features: string[]
  contact_email: string
  alternate_url: string | null
}

const DISMISS_KEY = 'maintenance_banner_dismissed'

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function MaintenanceBanner({ maintenance }: { maintenance: MaintenanceState }) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(DISMISS_KEY)
    setDismissed(stored === maintenance.id)
  }, [maintenance.id])

  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, maintenance.id)
    setDismissed(true)
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="bg-amber-50 border-b border-amber-200 px-4 py-3 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-2">
        <span className="text-xl flex-shrink-0" aria-hidden="true">🔧</span>
        <p className="text-amber-900 text-sm flex-1">
          <strong>Scheduled Maintenance:</strong>{' '}
          {maintenance.description || 'We will be performing scheduled maintenance'}.
          {maintenance.start_time && (
            <> Starting <strong>{formatDate(maintenance.start_time)}</strong>
              {maintenance.duration && <> for ~<strong>{maintenance.duration}</strong></>}.
            </>
          )}
        </p>
        <div className="flex gap-2 mt-1 sm:mt-0 flex-shrink-0">
          {maintenance.alternate_url && (
            <a
              href={maintenance.alternate_url}
              className="text-xs px-3 py-1 rounded bg-amber-200 text-amber-900 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              Learn More
            </a>
          )}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss maintenance notification"
            className="text-xs px-3 py-1 rounded border border-amber-300 text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
