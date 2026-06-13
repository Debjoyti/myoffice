// @ts-nocheck
'use client'

import { useState } from 'react'
import {
  useLiveData, InsightHeader, KpiTile, Panel, AreaSpark, RankList, Ring, exportToCsv, Empty, ACCENT_HEX,
} from '@/components/insights'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Target, TrendingUp, Trophy, XCircle, Briefcase, IndianRupee } from 'lucide-react'

const RANGES = [{ id: '30d', label: '30D' }, { id: '90d', label: '90D' }, { id: '12m', label: '12M' }]
const STAGE_LABEL = { new: 'New', contacted: 'Contacted', proposal: 'Proposal', negotiation: 'Negotiation', won: 'Won', lost: 'Lost' }

export default function CRMInsights() {
  const [range, setRange] = useState('90d')
  const { data, loading, updatedAt, refresh } = useLiveData(`/api/v1/insights/crm?range=${range}`, 15000)
  const k = data?.kpis ?? {}
  const funnel = (data?.funnel ?? []).filter(f => !['lost'].includes(f.label))
  const maxFunnel = Math.max(1, ...funnel.map(f => f.count))

  return (
    <div className="space-y-5 animate-fadeIn">
      <InsightHeader title="CRM & Sales Pipeline" accent="amber" updatedAt={updatedAt} onRefresh={refresh}
        subtitle="Lead flow, deal pipeline and conversion"
        range={range} onRange={setRange} ranges={RANGES}
        onExport={() => exportToCsv('crm-leads', data?.recent_leads ?? [])} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiTile label="Pipeline Value" value={formatCurrency(k.pipeline_value ?? 0)} icon={<IndianRupee className="h-4 w-4" />} accent="amber" loading={loading} />
        <KpiTile label="Open Leads" value={k.open_leads ?? 0} icon={<Briefcase className="h-4 w-4" />} accent="blue" loading={loading} sub={`${k.total_leads ?? 0} total`} />
        <KpiTile label="Won" value={k.won ?? 0} icon={<Trophy className="h-4 w-4" />} accent="emerald" loading={loading} sub={formatCurrency(k.won_value ?? 0)} />
        <KpiTile label="Win Rate" value={`${k.win_rate ?? 0}%`} icon={<TrendingUp className="h-4 w-4" />} accent="violet" loading={loading} />
        <KpiTile label="Avg Deal" value={formatCurrency(k.avg_deal ?? 0)} icon={<Target className="h-4 w-4" />} accent="rose" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Funnel */}
        <Panel className="lg:col-span-2" title="Sales funnel">
          {funnel.every(f => f.count === 0) ? <Empty /> : (
            <div className="space-y-2 py-1">
              {funnel.map((f, i) => {
                const pct = (f.count / maxFunnel) * 100
                return (
                  <div key={f.label} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-slate-500 capitalize">{STAGE_LABEL[f.label] ?? f.label}</span>
                    <div className="flex-1 h-8 rounded-lg bg-slate-50 overflow-hidden relative">
                      <div className="h-full rounded-lg flex items-center px-3 text-xs font-semibold text-white transition-all"
                        style={{ width: `${Math.max(pct, 8)}%`, background: ACCENT_HEX.amber, opacity: 1 - i * 0.12 }}>
                        {f.count}
                      </div>
                    </div>
                    <span className="w-28 text-right text-xs font-medium text-slate-600">{formatCurrency(f.value)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
        {/* Conversion ring */}
        <Panel title="Conversion">
          <div className="flex flex-col items-center justify-center h-full gap-3 py-4">
            <Ring value={k.win_rate ?? 0} accent="amber" size={120} label="win rate" />
            <div className="flex gap-4 text-center">
              <div><p className="text-lg font-bold text-emerald-600">{k.won ?? 0}</p><p className="text-[10px] text-slate-400">won</p></div>
              <div><p className="text-lg font-bold text-rose-500">{k.lost ?? 0}</p><p className="text-[10px] text-slate-400">lost</p></div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2" title="New leads trend">
          {(data?.leads_trend ?? []).length === 0 ? <Empty /> : <AreaSpark data={data.leads_trend.map(t => t.value)} accent="amber" width={720} height={140} />}
        </Panel>
        <Panel title="Top performers (by pipeline)">
          <RankList items={data?.top_owners ?? []} accent="amber" />
        </Panel>
      </div>

      <Panel title="Recent leads">
        {(data?.recent_leads ?? []).length === 0 ? <Empty /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="py-2">Name</th><th>Company</th><th>Owner</th><th className="text-right">Value</th><th>Stage</th><th>Created</th>
              </tr></thead>
              <tbody>
                {data.recent_leads.map((l, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2 font-medium text-slate-800">{l.name}</td>
                    <td className="text-slate-600">{l.company ?? '—'}</td>
                    <td className="text-slate-500 text-xs">{l.owner}</td>
                    <td className="text-right font-semibold">{formatCurrency(l.value)}</td>
                    <td><span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium capitalize">{l.status}</span></td>
                    <td className="text-slate-400 text-xs">{formatDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
