'use client'

import { useState } from 'react'

type MaintenanceType = 'scheduled' | 'active' | 'partial'

const FEATURES = [
  'Payroll', 'Attendance', 'Leave', 'CRM', 'Finance', 'Reports',
  'Recruitment', 'Assets', 'Stores', 'Analytics',
]

export default function AdminMaintenancePage() {
  const [form, setForm] = useState({
    is_active: false,
    type: 'scheduled' as MaintenanceType,
    start_time: '',
    end_time: '',
    duration: '',
    description: '',
    affected_features: [] as string[],
    contact_email: 'support@example.com',
    alternate_url: '',
    redirect_url: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const toggleFeature = (f: string) => {
    setForm(prev => ({
      ...prev,
      affected_features: prev.affected_features.includes(f)
        ? prev.affected_features.filter(x => x !== f)
        : [...prev.affected_features, f],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const payload = {
        ...form,
        start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
        alternate_url: form.alternate_url || null,
        redirect_url: form.redirect_url || null,
      }

      const res = await fetch('/api/v1/maintenance/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.formErrors?.[0] ?? data.error ?? 'Update failed')
      }

      setStatus('success')
      setMessage('Maintenance zone updated successfully.')
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || 'Failed to update maintenance zone.')
    }
  }

  const field = 'block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent'
  const label = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Maintenance Zone Management</h1>
      <p className="text-gray-500 text-sm mb-8">
        Configure site-wide or partial maintenance modes. Changes take effect immediately.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">

        {/* Active toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => setForm({ ...form, is_active: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
          />
          <span className="text-sm font-medium text-gray-700">Activate Maintenance Mode</span>
        </label>

        {/* Type */}
        <div>
          <label htmlFor="type" className={label}>Maintenance Type</label>
          <select
            id="type"
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value as MaintenanceType })}
            className={field}
          >
            <option value="scheduled">Scheduled — Banner (non-blocking)</option>
            <option value="active">Active — Full Page (blocking)</option>
            <option value="partial">Partial — Section only</option>
          </select>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_time" className={label}>Start Time</label>
            <input
              id="start_time"
              type="datetime-local"
              value={form.start_time}
              onChange={e => setForm({ ...form, start_time: e.target.value })}
              className={field}
              required
            />
          </div>
          <div>
            <label htmlFor="end_time" className={label}>End Time</label>
            <input
              id="end_time"
              type="datetime-local"
              value={form.end_time}
              onChange={e => setForm({ ...form, end_time: e.target.value })}
              className={field}
              required
            />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className={label}>Expected Duration</label>
          <input
            id="duration"
            type="text"
            placeholder="e.g. 2 hours"
            value={form.duration}
            onChange={e => setForm({ ...form, duration: e.target.value })}
            className={field}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className={label}>
            Description <span className="text-gray-400 font-normal">(10–500 chars)</span>
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="What's being maintained?"
            minLength={10}
            maxLength={500}
            rows={3}
            className={field}
            required
          />
        </div>

        {/* Affected features (partial only) */}
        {form.type === 'partial' && (
          <div>
            <p className={label}>Affected Features</p>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFeature(f)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    form.affected_features.includes(f)
                      ? 'bg-amber-100 border-amber-400 text-amber-800'
                      : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contact email */}
        <div>
          <label htmlFor="contact_email" className={label}>Contact Email</label>
          <input
            id="contact_email"
            type="email"
            value={form.contact_email}
            onChange={e => setForm({ ...form, contact_email: e.target.value })}
            className={field}
            required
          />
        </div>

        {/* Optional URLs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="alternate_url" className={label}>Alternate URL <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              id="alternate_url"
              type="url"
              value={form.alternate_url}
              onChange={e => setForm({ ...form, alternate_url: e.target.value })}
              placeholder="https://..."
              className={field}
            />
          </div>
          <div>
            <label htmlFor="redirect_url" className={label}>Redirect URL <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              id="redirect_url"
              type="url"
              value={form.redirect_url}
              onChange={e => setForm({ ...form, redirect_url: e.target.value })}
              placeholder="https://..."
              className={field}
            />
          </div>
        </div>

        {/* Feedback */}
        {status === 'success' && (
          <div role="status" className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
            ✓ {message}
          </div>
        )}
        {status === 'error' && (
          <div role="alert" className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            ✗ {message}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          {status === 'loading' ? 'Updating…' : 'Update Maintenance Zone'}
        </button>
      </form>
    </div>
  )
}
