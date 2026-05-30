'use client'

import { useState } from 'react'
import { Calendar, CheckCircle2, Clock, X as XIcon } from 'lucide-react'

const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
const MONTH_YEARS = [
  '2026','2026','2026','2026','2026','2026','2026','2026','2026','2027','2027','2027'
]

const STATUS_STYLE: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  skipped: 'bg-slate-100 text-slate-500',
  overdue: 'bg-red-100 text-red-700',
}

type PlanType = 'preventive' | 'predictive'

const DEMO_PLANS = [
  {
    equipment: 'EQ-001000', description: 'CNC Milling Machine',
    preventive: ['done','done','planned','planned','planned','planned','planned','planned','planned','planned','planned','planned'],
    predictive: ['','','done','','','done','','','done','','',''],
  },
  {
    equipment: 'EQ-001001', description: 'Industrial Compressor 75kW',
    preventive: ['done','done','done','planned','planned','planned','planned','planned','planned','planned','planned','planned'],
    predictive: ['','done','','','done','','','done','','','done',''],
  },
  {
    equipment: 'EQ-001002', description: 'Overhead Crane 10T',
    preventive: ['done','overdue','planned','planned','planned','planned','planned','planned','planned','planned','planned','planned'],
    predictive: ['done','','','done','','','done','','','done','',''],
  },
]

export default function PMPlanPage() {
  const [planType, setPlanType] = useState<PlanType>('preventive')
  const [plans, setPlans] = useState(DEMO_PLANS)

  const toggleStatus = (eqIdx: number, monthIdx: number) => {
    setPlans(prev => prev.map((p, i) => {
      if (i !== eqIdx) return p
      const key = planType === 'preventive' ? 'preventive' : 'predictive'
      const updated = [...p[key]]
      const current = updated[monthIdx]
      updated[monthIdx] = current === 'planned' ? 'done' : current === 'done' ? 'skipped' : current === '' ? 'planned' : 'planned'
      return { ...p, [key]: updated }
    }))
  }

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-teal-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Preventive & Predictive Maintenance Plan</h1>
            <p className="text-xs text-slate-500">Annual maintenance calendar (Apr 2026 – Mar 2027)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPlanType('preventive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${planType === 'preventive' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Preventive
          </button>
          <button
            onClick={() => setPlanType('predictive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${planType === 'predictive' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Predictive
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-5 text-xs">
        {Object.entries(STATUS_STYLE).map(([k, v]) => (
          <div key={k} className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${v}`}>
            {k === 'done' && <CheckCircle2 className="h-3 w-3" />}
            {k === 'planned' && <Clock className="h-3 w-3" />}
            {k === 'skipped' && <XIcon className="h-3 w-3" />}
            <span className="capitalize font-medium">{k}</span>
          </div>
        ))}
        <div className="text-slate-400 flex items-center">Click a cell to toggle status</div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase w-28">Eq. No.</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
              <th colSpan={MONTHS.length} className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">
                {planType === 'preventive' ? 'Preventive Maintenance Plan' : 'Predictive Maintenance Schedule'}
              </th>
            </tr>
            <tr className="border-b border-slate-100 bg-slate-50">
              <td colSpan={2} />
              {MONTHS.map((m, i) => (
                <th key={i} className="px-2 py-2 text-center text-xs font-semibold text-slate-600">
                  <div>{m}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{MONTH_YEARS[i]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map((p, eqIdx) => {
              const cells = planType === 'preventive' ? p.preventive : p.predictive
              return (
                <tr key={p.equipment} className={eqIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">{p.equipment}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 text-xs">{p.description}</td>
                  {cells.map((status, mIdx) => (
                    <td key={mIdx} className="px-1 py-2 text-center">
                      {status === '' ? (
                        <button onClick={() => toggleStatus(eqIdx, mIdx)}
                          className="h-7 w-7 rounded border border-dashed border-slate-300 hover:border-teal-400 hover:bg-teal-50 transition-colors" />
                      ) : (
                        <button
                          onClick={() => toggleStatus(eqIdx, mIdx)}
                          className={`h-7 w-7 rounded text-xs font-bold ${STATUS_STYLE[status] ?? 'bg-slate-100 text-slate-400'} hover:opacity-80 transition-opacity`}
                          title={`${p.equipment} - ${MONTHS[mIdx]} ${MONTH_YEARS[mIdx]}: ${status}`}
                        >
                          {status === 'done' ? '✓' : status === 'skipped' ? '—' : status === 'overdue' ? '!' : 'P'}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 mt-4">
        Click any cell to toggle: empty → planned → done → skipped → planned
      </p>
    </div>
  )
}
