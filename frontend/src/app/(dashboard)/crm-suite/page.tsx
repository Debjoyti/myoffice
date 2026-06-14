// @ts-nocheck
'use client'

import Link from 'next/link'
import { useLiveData, InsightHeader, KpiTile, Panel, Donut, Bars, RankList, Empty } from '@/components/insights'
import { formatCurrency } from '@/lib/utils'
import {
  Briefcase, Target, Trophy, TrendingUp, Users, Building2, CheckSquare, AlertCircle,
  ArrowRight,
} from 'lucide-react'

const LIFECYCLE_LABEL = { subscriber: 'Subscriber', lead: 'Lead', mql: 'MQL', sql: 'SQL', opportunity: 'Opportunity', customer: 'Customer', evangelist: 'Evangelist' }

export default function CRMDashboard() {
  const { data, loading, updatedAt, refresh } = useLiveData('/api/v1/crm/stats', 15000)
  const k = data?.kpis ?? {}
  const funnel = data?.stage_funnel ?? []
  const maxF = Math.max(1, ...funnel.map(f => f.count))

  return (
    <div className="space-y-5 animate-fadeIn">
      <InsightHeader title="CRM" accent="indigo" updatedAt={updatedAt} onRefresh={refresh}
        subtitle="Your relationships, pipeline and revenue — all in one place" />

      <div className="flex flex-wrap gap-2">
        <Link href="/crm-suite/deals"><QuickBtn icon={<Target className="h-3.5 w-3.5" />} label="Pipeline" /></Link>
        <Link href="/crm-suite/contacts"><QuickBtn icon={<Users className="h-3.5 w-3.5" />} label="Contacts" /></Link>
        <Link href="/crm-suite/accounts"><QuickBtn icon={<Building2 className="h-3.5 w-3.5" />} label="Accounts" /></Link>
        <Link href="/crm-suite/activities"><QuickBtn icon={<CheckSquare className="h-3.5 w-3.5" />} label="Activities" /></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Open Pipeline" value={formatCurrency(k.open_value ?? 0)} icon={<Briefcase className="h-4 w-4" />} accent="indigo" loading={loading} sub={`${k.open_deals ?? 0} deals`} />
        <KpiTile label="Weighted Forecast" value={formatCurrency(k.weighted_value ?? 0)} icon={<TrendingUp className="h-4 w-4" />} accent="violet" loading={loading} sub="probability-adjusted" />
        <KpiTile label="Won" value={formatCurrency(k.won_value ?? 0)} icon={<Trophy className="h-4 w-4" />} accent="emerald" loading={loading} sub={`${k.won_deals ?? 0} deals`} />
        <KpiTile label="Win Rate" value={`${k.win_rate ?? 0}%`} icon={<Target className="h-4 w-4" />} accent="amber" loading={loading} sub={`avg ${formatCurrency(k.avg_deal ?? 0)}`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Contacts" value={k.contacts ?? 0} icon={<Users className="h-4 w-4" />} accent="blue" loading={loading} sub={`+${k.new_contacts_30d ?? 0} this month`} />
        <KpiTile label="Accounts" value={k.accounts ?? 0} icon={<Building2 className="h-4 w-4" />} accent="cyan" loading={loading} />
        <KpiTile label="Open Tasks" value={k.open_tasks ?? 0} icon={<CheckSquare className="h-4 w-4" />} accent="violet" loading={loading} />
        <KpiTile label="Overdue" value={k.overdue_tasks ?? 0} icon={<AlertCircle className="h-4 w-4" />} accent="rose" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2" title="Pipeline by stage" action={<Link href="/crm-suite/deals" className="text-xs text-indigo-600 inline-flex items-center gap-1">Open board <ArrowRight className="h-3 w-3" /></Link>}>
          {funnel.length === 0 ? <Empty msg="No open deals — add your first deal" /> : (
            <div className="space-y-2 py-1">
              {funnel.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-slate-500 truncate">{f.label}</span>
                  <div className="flex-1 h-7 rounded-lg bg-slate-50 overflow-hidden">
                    <div className="h-full rounded-lg flex items-center px-2.5 text-[11px] font-semibold text-white" style={{ width: `${Math.max((f.count / maxF) * 100, 7)}%`, background: f.color }}>{f.count}</div>
                  </div>
                  <span className="w-28 text-right text-xs font-medium text-slate-600">{formatCurrency(f.value)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Contacts by lifecycle">
          <Donut data={Object.entries(data?.lifecycle ?? {}).map(([k2, v]) => ({ label: LIFECYCLE_LABEL[k2] ?? k2, value: v }))} centerValue={k.contacts ?? 0} centerLabel="contacts" />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Won revenue (6 mo)">
          <Bars data={data?.won_trend ?? []} accent="emerald" valueFmt={(n) => formatCurrency(n)} />
        </Panel>
        <Panel title="Activity mix">
          <Donut data={(data?.activity_by_type ?? []).map(a => ({ label: a.label, value: a.value }))} centerValue={(data?.activity_by_type ?? []).reduce((s, a) => s + a.value, 0)} centerLabel="logged" />
        </Panel>
        <Panel title="Leaderboard (open pipeline)">
          <RankList items={(data?.leaderboard ?? []).map(l => ({ label: l.label, value: formatCurrency(l.value), bar: l.value }))} accent="indigo" />
        </Panel>
      </div>
    </div>
  )
}

function QuickBtn({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-colors">
      {icon}{label}
    </span>
  )
}
