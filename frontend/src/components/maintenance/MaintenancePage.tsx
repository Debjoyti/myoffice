'use client'

import { useEffect, useState } from 'react'

interface MaintenanceState {
  id: string
  end_time: string | null
  duration: string | null
  description: string | null
  contact_email: string
  alternate_url: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return 'To be determined'
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
}

function useCountdown(endTime: string | null) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    if (!endTime) return
    const update = () => {
      const diff = new Date(endTime).getTime() - Date.now()
      if (diff <= 0) { setRemaining('Completing soon…'); return }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setRemaining(`${h > 0 ? `${h}h ` : ''}${m}m ${s}s`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [endTime])

  return remaining
}

export default function MaintenancePage({ maintenance }: { maintenance: MaintenanceState }) {
  const countdown = useCountdown(maintenance.end_time)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/v1/maintenance/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, maintenance_id: maintenance.id }),
      })
      if (!res.ok) throw new Error('Request failed')
      setSubmitted(true)
    } catch {
      setError('Failed to sign up. Please try again.')
    }
  }

  return (
    <div
      role="main"
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12"
    >
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6" aria-hidden="true">🔧</div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">We&apos;re Under Maintenance</h1>

        <p className="text-gray-600 text-lg mb-8">
          {maintenance.description ||
            "We're improving your experience. We'll be back shortly with better features and performance."}
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 text-left">
          <div className="space-y-3 text-gray-700 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Expected completion</span>
              <time dateTime={maintenance.end_time ?? undefined}>{formatDate(maintenance.end_time)}</time>
            </div>
            {maintenance.duration && (
              <div className="flex justify-between">
                <span className="font-medium">Duration</span>
                <span>{maintenance.duration}</span>
              </div>
            )}
            {countdown && (
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="font-medium">Time remaining</span>
                <span className="text-2xl font-bold text-amber-600">{countdown}</span>
              </div>
            )}
          </div>
        </div>

        {!submitted ? (
          <form onSubmit={handleNotify} className="flex gap-2 mb-6" noValidate>
            <label htmlFor="notify-email" className="sr-only">Email address</label>
            <input
              id="notify-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              aria-required="true"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 whitespace-nowrap"
            >
              Notify Me
            </button>
          </form>
        ) : (
          <div role="status" className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
            ✓ You&apos;ll be notified when we&apos;re back online!
          </div>
        )}

        {error && (
          <p role="alert" className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <div className="text-sm text-gray-500 space-y-2">
          <p>
            Questions? Email us at{' '}
            <a
              href={`mailto:${maintenance.contact_email}`}
              className="text-amber-600 hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 rounded"
            >
              {maintenance.contact_email}
            </a>
          </p>
          {maintenance.alternate_url && (
            <a
              href={maintenance.alternate_url}
              className="inline-block mt-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              Visit Alternative Page
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
