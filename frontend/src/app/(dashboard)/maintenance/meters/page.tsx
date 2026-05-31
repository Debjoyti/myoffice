'use client'

import { useState } from 'react'
import { Zap, Plus, X } from 'lucide-react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const DEMO_METERS = [
  { id: '1', meter_number: 'EM-001', meter_name: 'CNC Section Main Panel', readings: [120, 118, 125, 130, 122, null, null, null, null, null, null, null] },
  { id: '2', meter_number: 'EM-002', meter_name: 'Compressor Room', readings: [85, 88, 92, 87, 90, null, null, null, null, null, null, null] },
  { id: '3', meter_number: 'EM-003', meter_name: 'Overhead Crane Bay', readings: [40, 42, 38, 45, 43, null, null, null, null, null, null, null] },
]

const EMPTY_METER = { meter_number: '', meter_name: '' }

export default function MetersPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [meters, setMeters] = useState(DEMO_METERS)
  const [showAddMeter, setShowAddMeter] = useState(false)
  const [meterForm, setMeterForm] = useState(EMPTY_METER)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const updateReading = (meterId: string, monthIdx: number, value: string) => {
    setMeters(prev => prev.map(m => {
      if (m.id !== meterId) return m
      const readings = [...m.readings]
      readings[monthIdx] = value === '' ? null : Number(value)
      return { ...m, readings }
    }))
  }

  const handleAddMeter = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/v1/maintenance/meters', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meterForm),
      })
    } catch { /* offline */ }
    setMeters(prev => [...prev, { id: String(Date.now()), ...meterForm, readings: Array(12).fill(null) }])
    setShowAddMeter(false)
    setMeterForm(EMPTY_METER)
    setSaving(false)
    setToast('Electricity meter account created.')
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-yellow-500" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Electricity Meter Readings</h1>
            <p className="text-xs text-slate-500">Daily unit consumption per meter — per month view</p>
          </div>
        </div>
        <div className="flex gap-3">
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500">
            {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <button onClick={() => setShowAddMeter(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg">
            <Plus className="h-4 w-4" /> Add Meter
          </button>
        </div>
      </div>

      {/* Readings Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-28">Sr. No.</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide w-32">Meter No.</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Meter Name</th>
              {MONTHS.map(m => (
                <th key={m} className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">{m}</th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">Total</th>
            </tr>
            <tr className="border-b border-slate-100">
              <td colSpan={3} />
              {MONTHS.map((_, i) => (
                <td key={i} className="px-2 py-1 text-center text-[10px] text-slate-400">{i + 1}</td>
              ))}
              <td />
            </tr>
          </thead>
          <tbody>
            {meters.map((m, idx) => {
              const total = m.readings.reduce((s: number, r) => s + (r ?? 0), 0)
              return (
                <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-2 text-slate-500 text-xs">{idx + 1}</td>
                  <td className="px-4 py-2 font-mono text-xs text-yellow-700 font-semibold">{m.meter_number}</td>
                  <td className="px-4 py-2 font-medium text-slate-800">{m.meter_name}</td>
                  {m.readings.map((r, i) => (
                    <td key={i} className="px-1 py-1">
                      <input
                        type="number"
                        value={r ?? ''}
                        onChange={e => updateReading(m.id, i, e.target.value)}
                        className="w-14 text-center px-1 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-yellow-500"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2 text-center font-bold text-slate-800">{total}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {toast && <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50">{toast}</div>}

      {showAddMeter && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900">Create Electricity Meter Account</h2>
              <button onClick={() => setShowAddMeter(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddMeter} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Meter Number *</label>
                <input required value={meterForm.meter_number}
                  onChange={e => setMeterForm(p => ({ ...p, meter_number: e.target.value }))}
                  placeholder="EM-004"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Meter Name *</label>
                <input required value={meterForm.meter_name}
                  onChange={e => setMeterForm(p => ({ ...p, meter_name: e.target.value }))}
                  placeholder="e.g. Assembly Line Panel"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddMeter(false)}
                  className="px-5 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
                  {saving ? 'Creating…' : 'Create Meter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
