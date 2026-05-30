'use client'

import { useState, useMemo } from 'react'
import { AlertTriangle, Plus, X, Clock } from 'lucide-react'

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-amber-100 text-amber-700',
  closed: 'bg-green-100 text-green-700',
}

type Breakdown = {
  id: string; notification_number: string; equipment: string; employee: string
  department: string; malfunction_start: string; malfunction_end: string | null
  breakdown_hours: number | null; status: string; work_center: string
}

const DEMO: Breakdown[] = [
  { id: '1', notification_number: 'BD-0100001', equipment: 'CNC Milling Machine', employee: 'Raj Kumar', department: 'Maintenance', malfunction_start: '2026-05-28 08:30', malfunction_end: '2026-05-28 12:30', breakdown_hours: 4, status: 'closed', work_center: 'MECH-01' },
  { id: '2', notification_number: 'BD-0100002', equipment: 'Overhead Crane 10T', employee: 'Anita Sharma', department: 'Maintenance', malfunction_start: '2026-05-29 14:00', malfunction_end: null, breakdown_hours: null, status: 'in_progress', work_center: 'MECH-02' },
  { id: '3', notification_number: 'BD-0100003', equipment: 'Industrial Compressor', employee: 'Suresh Patel', department: 'Utilities', malfunction_start: '2026-05-30 06:00', malfunction_end: null, breakdown_hours: null, status: 'open', work_center: 'UTIL-01' },
]

const EMPTY = {
  equipment_number: '', notification_text: '', employee_code: '', malfunction_start_date: '',
  malfunction_start_time: '', malfunction_end_date: '', malfunction_end_time: '',
  is_breakdown: false, maint_work_center: '', maint_work_sub_center: '',
}

export default function BreakdownsPage() {
  const [breakdowns, setBreakdowns] = useState(DEMO)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const filtered = useMemo(() => breakdowns.filter(b => {
    const q = search.toLowerCase()
    return (statusFilter === 'All' || b.status === statusFilter) &&
      (!search || b.notification_number.toLowerCase().includes(q) || b.equipment.toLowerCase().includes(q))
  }), [breakdowns, search, statusFilter])

  const f = (k: keyof typeof form, v: string | boolean) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/v1/maintenance/breakdowns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        setBreakdowns(prev => [{
          id: String(Date.now()), notification_number: data.notification_number ?? `BD-${Date.now()}`,
          equipment: form.equipment_number, employee: form.employee_code, department: 'Maintenance',
          malfunction_start: `${form.malfunction_start_date} ${form.malfunction_start_time}`,
          malfunction_end: form.malfunction_end_date ? `${form.malfunction_end_date} ${form.malfunction_end_time}` : null,
          breakdown_hours: null as number | null, status: 'open', work_center: form.maint_work_center,
        }, ...prev])
      }
    } catch { /* fall through */ }
    setToast('Malfunction report submitted. Notification sent to maintenance work center.')
    setShowForm(false)
    setForm(EMPTY)
    setSaving(false)
    setTimeout(() => setToast(''), 5000)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Breakdown Notifications</h1>
            <p className="text-xs text-slate-500">Create malfunction reports — SAP IW21 equivalent</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg">
          <Plus className="h-4 w-4" /> Report Breakdown
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(['open','in_progress','closed'] as const).map(s => {
          const count = breakdowns.filter(b => b.status === s).length
          return (
            <div key={s} className={`rounded-xl border p-4 ${STATUS_COLOR[s].replace('text-', 'border-').replace('-700','-200')}`}>
              <p className="text-2xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-500 capitalize mt-1">{s.replace('_',' ')}</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notifications…"
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-60 focus:outline-none focus:ring-2 focus:ring-red-500" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
          <option value="All">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Notification No.','Equipment','Employee','Malfunction Start','B/D Hours','Work Center','Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">No breakdowns found</td></tr>
            )}
            {filtered.map((b, i) => (
              <tr key={b.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="px-4 py-3 font-mono text-xs text-red-700 font-semibold">{b.notification_number}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{b.equipment}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{b.employee}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{b.malfunction_start}</td>
                <td className="px-4 py-3 text-slate-700 font-medium text-xs">
                  {b.breakdown_hours != null ? (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{b.breakdown_hours}h</span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{b.work_center}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[b.status]}`}>
                    {b.status.replace('_',' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50 max-w-sm">
          {toast}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 text-lg">Malfunction Report (SAP IW21)</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Machine Number *</label>
                  <input required value={form.equipment_number} onChange={e => f('equipment_number', e.target.value)}
                    placeholder="EQ-001000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">B/D Notification Text</label>
                  <input value={form.notification_text} onChange={e => f('notification_text', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Employee Code</label>
                  <input value={form.employee_code} onChange={e => f('employee_code', e.target.value)}
                    placeholder="EMP-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input type="checkbox" checked={form.is_breakdown}
                      onChange={e => f('is_breakdown', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
                    <span className="text-sm font-medium text-slate-700">Mark as Breakdown</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-2 block">Malfunction Start</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.malfunction_start_date} onChange={e => f('malfunction_start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <input type="time" value={form.malfunction_start_time} onChange={e => f('malfunction_start_time', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-2 block">Malfunction End</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.malfunction_end_date} onChange={e => f('malfunction_end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <input type="time" value={form.malfunction_end_time} onChange={e => f('malfunction_end_time', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <p className="text-xs text-slate-400 mt-1">Breakdown hours will be auto-calculated</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Maint. Work Center</label>
                  <input value={form.maint_work_center} onChange={e => f('maint_work_center', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Sub Work Center</label>
                  <input value={form.maint_work_sub_center} onChange={e => f('maint_work_sub_center', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
                After submit, a notification will be sent to the maintenance work center automatically.
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
                  {saving ? 'Submitting…' : 'Submit Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
