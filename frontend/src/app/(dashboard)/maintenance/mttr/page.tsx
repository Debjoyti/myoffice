'use client'

import { useState } from 'react'
import { BarChart2, TrendingDown, TrendingUp, Activity } from 'lucide-react'

const DEMO_DATA = [
  { equipment_number: 'EQ-001000', description: 'CNC Milling Machine', notification: 'BD-0100001', malf_start: '2026-05-01 08:00', malf_end: '2026-05-01 12:00', downtime: 4, total_breakdowns: 3, mttr: 2.5, mtbr: 320, availability: 99.2 },
  { equipment_number: 'EQ-001001', description: 'Industrial Compressor 75kW', notification: 'BD-0100002', malf_start: '2026-04-15 14:00', malf_end: '2026-04-15 17:00', downtime: 3, total_breakdowns: 1, mttr: 3.0, mtbr: 720, availability: 99.6 },
  { equipment_number: 'EQ-001002', description: 'Overhead Crane 10T', notification: 'BD-0100003', malf_start: '2026-05-29 14:00', malf_end: null, downtime: null, total_breakdowns: 2, mttr: 5.5, mtbr: 180, availability: 96.9 },
]

function StatCard({ label, value, unit, icon: Icon, color }: { label: string; value: string; unit: string; icon: React.ElementType; color: string }) {
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-sm opacity-70">{unit}</span>
      </div>
    </div>
  )
}

export default function MTTRPage() {
  const [month, setMonth] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))

  const avgMTTR = (DEMO_DATA.reduce((s, d) => s + d.mttr, 0) / DEMO_DATA.length).toFixed(1)
  const avgMTBR = Math.round(DEMO_DATA.reduce((s, d) => s + d.mtbr, 0) / DEMO_DATA.length)
  const avgAvl  = (DEMO_DATA.reduce((s, d) => s + d.availability, 0) / DEMO_DATA.length).toFixed(1)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart2 className="h-6 w-6 text-green-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">MTTR & MTTF Dashboard</h1>
            <p className="text-xs text-slate-500">Mean Time to Repair · Mean Time Between Failures · Availability</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select value={month} onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">All Months</option>
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
              <option key={m} value={String(i + 1)}>{m}</option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Avg MTTR" value={avgMTTR} unit="hours" icon={TrendingDown} color="bg-red-50 text-red-700 border-red-100" />
        <StatCard label="Avg MTBR" value={String(avgMTBR)} unit="hours" icon={TrendingUp} color="bg-green-50 text-green-700 border-green-100" />
        <StatCard label="Avg Availability" value={avgAvl} unit="%" icon={Activity} color="bg-blue-50 text-blue-700 border-blue-100" />
      </div>

      {/* Formula reference */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-xs text-amber-800 space-y-1">
        <p><strong>MTTR</strong> = Total Downtime / Number of Failures</p>
        <p><strong>MTBR</strong> = Total Uptime / Number of Failures</p>
        <p><strong>Availability (%)</strong> = [MTBR / (MTTR + MTBR)] × 100</p>
        <p><strong>Failure Rate (λ)</strong> = Number of Failures / Total Time</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
          Equipment Reliability Report
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Equipment No.','Description','Notification','Malf. Start','Malf. End','Total B/D','Downtime (H)','MTTR (H)','MTBR (H)','Avail. %'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_DATA.map((row, i) => (
                <tr key={row.equipment_number} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">{row.equipment_number}</td>
                  <td className="px-4 py-3 text-slate-800 font-medium">{row.description}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.notification}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{row.malf_start}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{row.malf_end ?? '—'}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700">{row.total_breakdowns}</td>
                  <td className="px-4 py-3 text-center text-red-600 font-medium">{row.downtime ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-amber-600 font-medium">{row.mttr}</td>
                  <td className="px-4 py-3 text-center text-green-600 font-medium">{row.mtbr}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${row.availability >= 99 ? 'bg-green-100 text-green-700' : row.availability >= 97 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {row.availability}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-4">
        Reliability: Higher MTBR = More reliable. Case with fewer failures but same downtime hours has higher MTBR and better reliability.
      </p>
    </div>
  )
}
