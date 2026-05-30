'use client'

import { useState } from 'react'
import { ClipboardList, Plus, X } from 'lucide-react'

const DEMO = [
  { id: '1', equipment: 'EQ-001000', operation: '0010', description: 'Spindle Lubrication Check', work_center: 'MECH-01', work_hours: 0.5, preventive_months: 1, task_code: 'TL-0010' },
  { id: '2', equipment: 'EQ-001000', operation: '0020', description: 'CNC Calibration', work_center: 'MECH-01', work_hours: 2, preventive_months: 3, task_code: 'TL-0020' },
  { id: '3', equipment: 'EQ-001001', operation: '0010', description: 'Compressor Filter Replacement', work_center: 'UTIL-01', work_hours: 1, preventive_months: 2, task_code: 'TL-0030' },
  { id: '4', equipment: 'EQ-001002', operation: '0010', description: 'Wire Rope Inspection', work_center: 'MECH-02', work_hours: 1.5, preventive_months: 1, task_code: 'TL-0040' },
]

const EMPTY = {
  equipment_number: '', operation: '', sub_operation: '', group: '', work_center: '',
  description: '', control_key: 'PM01', work_hours: '', number_of_workers: '1',
  normal_duration: '', percentage: '100', preventive_months: '', predictive_schedule: '',
}

export default function TaskListsPage() {
  const [tasks, setTasks] = useState(DEMO)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/v1/maintenance/task-lists', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } catch { /* offline */ }
    setTasks(prev => [{
      id: String(Date.now()), equipment: form.equipment_number, operation: form.operation,
      description: form.description, work_center: form.work_center,
      work_hours: Number(form.work_hours), preventive_months: Number(form.preventive_months),
      task_code: `TL-${String(Date.now()).slice(-4)}`,
    }, ...prev])
    setShowForm(false)
    setForm(EMPTY)
    setSaving(false)
    setToast('Task list created.')
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-violet-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Equipment Task Lists</h1>
            <p className="text-xs text-slate-500">Create preventive & predictive maintenance operations</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg">
          <Plus className="h-4 w-4" /> Create Task List
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Task Code','Equipment','Operation','Description','Work Center','Work Hrs','PM Schedule (months)'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => (
              <tr key={t.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="px-4 py-3 font-mono text-xs text-violet-700 font-semibold">{t.task_code}</td>
                <td className="px-4 py-3 text-xs text-slate-500 font-mono">{t.equipment}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{t.operation}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{t.description}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{t.work_center}</td>
                <td className="px-4 py-3 text-xs text-slate-700">{t.work_hours}h</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                    Every {t.preventive_months} mo.
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toast && <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50">{toast}</div>}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 text-lg">Create Equipment Task List</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Equipment Number</label>
                  <input required value={form.equipment_number} onChange={e => f('equipment_number', e.target.value)}
                    placeholder="EQ-001000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Work Center</label>
                  <input value={form.work_center} onChange={e => f('work_center', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Operation</label>
                  <input value={form.operation} onChange={e => f('operation', e.target.value)} placeholder="0010"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Sub-Operation</label>
                  <input value={form.sub_operation} onChange={e => f('sub_operation', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Group</label>
                  <input value={form.group} onChange={e => f('group', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Operation Description *</label>
                <input required value={form.description} onChange={e => f('description', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Control Key</label>
                  <input value={form.control_key} onChange={e => f('control_key', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Work (hours)</label>
                  <input type="number" step="0.5" value={form.work_hours} onChange={e => f('work_hours', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Workers</label>
                  <input type="number" value={form.number_of_workers} onChange={e => f('number_of_workers', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">%</label>
                  <input type="number" value={form.percentage} onChange={e => f('percentage', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Preventive Schedule (months)</label>
                  <input type="number" value={form.preventive_months} onChange={e => f('preventive_months', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Predictive Maintenance Schedule</label>
                  <input value={form.predictive_schedule} onChange={e => f('predictive_schedule', e.target.value)}
                    placeholder="e.g. Vibration analysis every 500 hrs"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
                  {saving ? 'Creating…' : 'Create Task List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
