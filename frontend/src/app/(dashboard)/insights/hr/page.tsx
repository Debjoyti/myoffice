// @ts-nocheck
'use client'

import {
  useLiveData, InsightHeader, KpiTile, Panel, Bars, Donut, Ring, AreaSpark, exportToCsv, Empty,
} from '@/components/insights'
import { formatCurrency } from '@/lib/utils'
import {
  Users, UserPlus, UserMinus, CalendarCheck, Clock, Banknote, Building2, ClipboardCheck,
} from 'lucide-react'

export default function HRInsights() {
  const { data, loading, updatedAt, refresh } = useLiveData('/api/v1/insights/hr', 15000)
  const k = data?.kpis ?? {}

  return (
    <div className="space-y-5 animate-fadeIn">
      <InsightHeader title="People & HR" accent="emerald" updatedAt={updatedAt} onRefresh={refresh}
        subtitle="Headcount, attendance, hiring and payroll — live"
        onExport={() => exportToCsv('hr-headcount-by-dept', data?.headcount_by_dept ?? [])} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Headcount" value={k.headcount ?? 0} icon={<Users className="h-4 w-4" />} accent="emerald" loading={loading} sub={`${k.departments ?? 0} departments`} />
        <KpiTile label="Present Today" value={k.present_today ?? 0} icon={<Clock className="h-4 w-4" />} accent="blue" loading={loading} sub={`${k.attendance_rate ?? 0}% attendance`} />
        <KpiTile label="New Hires (mo)" value={k.new_hires_month ?? 0} icon={<UserPlus className="h-4 w-4" />} accent="violet" loading={loading} />
        <KpiTile label="Attrition" value={k.attrition ?? 0} icon={<UserMinus className="h-4 w-4" />} accent="rose" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2" title="Attendance — last 14 days">
          {(data?.attendance_trend ?? []).length === 0 ? <Empty /> : (
            <>
              <AreaSpark data={data.attendance_trend.map(d => d.present)} accent="emerald" width={720} height={140} />
              <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                <span>{data.attendance_trend[0]?.date}</span>
                <span>{data.attendance_trend[data.attendance_trend.length - 1]?.date}</span>
              </div>
            </>
          )}
        </Panel>
        <Panel title="Today's attendance">
          <div className="flex flex-col items-center justify-center h-full gap-3 py-4">
            <Ring value={k.attendance_rate ?? 0} accent="emerald" size={120} label="present" />
            <p className="text-xs text-slate-500">{k.present_today ?? 0} of {k.headcount ?? 0} employees</p>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Headcount by department">
          <Donut data={data?.headcount_by_dept ?? []} centerValue={k.headcount ?? 0} centerLabel="people" />
        </Panel>
        <Panel title="Hiring trend (6 mo)">
          <Bars data={data?.hires_trend ?? []} accent="violet" />
        </Panel>
        <Panel title="Approvals & payroll">
          <div className="space-y-3 py-1">
            <Stat icon={<CalendarCheck className="h-4 w-4 text-amber-500" />} label="Pending leave requests" value={k.pending_leaves ?? 0} />
            <Stat icon={<ClipboardCheck className="h-4 w-4 text-blue-500" />} label="Pending approvals" value={k.pending_approvals ?? 0} />
            <Stat icon={<Banknote className="h-4 w-4 text-emerald-500" />} label={`Payroll (${k.latest_payroll_month ?? '—'})`} value={formatCurrency(k.latest_payroll_cost ?? 0)} />
            <Stat icon={<Building2 className="h-4 w-4 text-violet-500" />} label="Departments" value={k.departments ?? 0} />
          </div>
        </Panel>
      </div>

      {(data?.payroll_trend ?? []).length > 0 && (
        <Panel title="Payroll cost trend">
          <Bars data={data.payroll_trend} accent="emerald" valueFmt={(n) => formatCurrency(n)} />
        </Panel>
      )}
    </div>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
      <span className="p-1.5 rounded-lg bg-slate-50">{icon}</span>
      <span className="text-xs text-slate-600 flex-1">{label}</span>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  )
}
