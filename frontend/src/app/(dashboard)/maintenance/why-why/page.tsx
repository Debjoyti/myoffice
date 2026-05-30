'use client'

import { useState } from 'react'
import { HelpCircle, Plus, X, ChevronRight } from 'lucide-react'

const WHYS = [
  { key: 'why1', label: 'WHY 1', question: '1. Why did it happen?' },
  { key: 'why2', label: 'WHY 2', question: '2. Why did it happen?' },
  { key: 'why3', label: 'WHY 3', question: '3. Why did it happen?' },
  { key: 'why4', label: 'WHY 4', question: '4. Why did it happen?' },
  { key: 'why5', label: 'WHY 5', question: '5. Why did it happen?' },
  { key: 'rca',  label: 'RCA',   question: 'Root Cause Analysis' },
]

const ACTIVITIES = [
  { key: 'correction', code: 'C', label: 'Correction Done' },
  { key: 'corrective_action', code: 'CA', label: 'Corrective Action Taken' },
  { key: 'preventive_action', code: 'PA', label: 'Preventive Action Taken' },
]

const DEMO = [
  { id: '1', equipment: 'CNC Milling Machine', notification: 'BD-0100001', objective_damage: 'Spindle bearing failure', rca: 'Lubrication interval exceeded due to missed PM', status: 'complete' },
  { id: '2', equipment: 'Overhead Crane 10T', notification: 'BD-0100002', objective_damage: 'Wire rope fraying', rca: 'Pending', status: 'pending' },
]

const EMPTY = {
  equipment_number: '', notification_number: '', objective_damage: '',
  why1: '', why1_code: 'CAPA', why1_text: '',
  why2: '', why2_code: 'CAPA', why2_text: '',
  why3: '', why3_code: 'CAPA', why3_text: '',
  why4: '', why4_code: 'CAPA', why4_text: '',
  why5: '', why5_code: 'CAPA', why5_text: '',
  rca:  '', rca_code:  'CAPA', rca_text:  '',
  correction: '', correction_code: 'C', correction_text: '',
  corrective_action: '', ca_code: 'CA', ca_text: '',
  preventive_action: '', pa_code: 'PA', pa_text: '',
}

export default function WhyWhyPage() {
  const [analyses, setAnalyses] = useState(DEMO)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/v1/maintenance/why-why', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } catch { /* offline */ }
    setAnalyses(prev => [{
      id: String(Date.now()), equipment: form.equipment_number,
      notification: form.notification_number, objective_damage: form.objective_damage,
      rca: form.rca_text || form.rca || 'Pending', status: 'complete',
    }, ...prev])
    setShowForm(false)
    setForm(EMPTY)
    setSaving(false)
    setToast('Why-Why Analysis saved.')
    setTimeout(() => setToast(''), 4000)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-6 w-6 text-amber-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Why-Why Analysis</h1>
            <p className="text-xs text-slate-500">5-Why root cause analysis for equipment failures</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg">
          <Plus className="h-4 w-4" /> New Analysis
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {analyses.map(a => (
          <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-800">{a.equipment}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                  <span className="text-xs text-slate-400 font-mono">{a.notification}</span>
                </div>
                <p className="text-sm text-slate-600"><strong>Objective/Damage:</strong> {a.objective_damage}</p>
                <p className="text-sm text-slate-600 mt-1"><strong>RCA:</strong> {a.rca}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'complete' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {a.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50">{toast}</div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 text-lg">Why-Why Analysis Form</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Equipment Number</label>
                  <input value={form.equipment_number} onChange={e => f('equipment_number', e.target.value)}
                    placeholder="EQ-001000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Notification Number</label>
                  <input value={form.notification_number} onChange={e => f('notification_number', e.target.value)}
                    placeholder="BD-0100001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Objective Part & Damages</label>
                <textarea value={form.objective_damage} onChange={e => f('objective_damage', e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>

              {/* 5 Whys */}
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase mb-3 tracking-wide">2. Causes (5 Why Analysis)</p>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-amber-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 w-8">No.</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 w-16">Code</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 w-24">Cause</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Cause Code Text</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Cause Text</th>
                      </tr>
                    </thead>
                    <tbody>
                      {WHYS.map((w, i) => (
                        <tr key={w.key} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                          <td className="px-2 py-1">
                            <input value={(form as any)[`${w.key}_code`]} onChange={e => f(`${w.key}_code` as any, e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
                          </td>
                          <td className="px-2 py-1">
                            <input value={(form as any)[w.key]} onChange={e => f(w.key as any, e.target.value)}
                              placeholder={w.label}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
                          </td>
                          <td className="px-2 py-1 text-slate-400 text-xs">{w.question}</td>
                          <td className="px-2 py-1">
                            <input value={(form as any)[`${w.key}_text`]} onChange={e => f(`${w.key}_text` as any, e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-500" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Activities */}
              <div>
                <p className="text-xs font-bold text-slate-600 uppercase mb-3 tracking-wide">4. Activity</p>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-green-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 w-8">No.</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 w-16">Code</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Activity</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Activity Code Text</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Activity Text</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ACTIVITIES.map((a, i) => (
                        <tr key={a.key} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="px-3 py-2 text-slate-400 text-xs">{i + 1}</td>
                          <td className="px-3 py-2 text-xs font-mono text-slate-600">{a.code}</td>
                          <td className="px-3 py-2 text-xs text-slate-700">{a.label}</td>
                          <td className="px-2 py-1">
                            <input value={(form as any)[`${a.key.replace('_action','').replace('_','')}${a.key.includes('_action') ? '_code' : ''}`] ?? ''}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500" readOnly />
                          </td>
                          <td className="px-2 py-1">
                            <input value={(form as any)[`${a.key === 'correction' ? 'correction_text' : a.key === 'corrective_action' ? 'ca_text' : 'pa_text'}`]}
                              onChange={e => f(a.key === 'correction' ? 'correction_text' : a.key === 'corrective_action' ? 'ca_text' : 'pa_text', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
                  {saving ? 'Saving…' : 'Save Analysis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
