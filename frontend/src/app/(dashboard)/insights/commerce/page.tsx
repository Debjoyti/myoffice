// @ts-nocheck
'use client'

import { useState } from 'react'
import {
  useLiveData, InsightHeader, KpiTile, Panel, AreaSpark, Bars, Donut, RankList, exportToCsv, Empty,
} from '@/components/insights'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  IndianRupee, ShoppingBag, Boxes, TrendingUp, Percent, UserPlus,
} from 'lucide-react'

const RANGES = [{ id: '7d', label: '7D' }, { id: '30d', label: '30D' }, { id: '90d', label: '90D' }, { id: '12m', label: '12M' }]
const STATUS_COLOR = { delivered: 'bg-emerald-100 text-emerald-700', completed: 'bg-emerald-100 text-emerald-700', shipped: 'bg-blue-100 text-blue-700', confirmed: 'bg-blue-100 text-blue-700', processing: 'bg-blue-100 text-blue-700', pending: 'bg-amber-100 text-amber-700', cancelled: 'bg-rose-100 text-rose-700', returned: 'bg-slate-100 text-slate-600' }

export default function CommerceInsights() {
  const [range, setRange] = useState('30d')
  const { data, loading, updatedAt, refresh } = useLiveData(`/api/v1/insights/commerce?range=${range}`, 12000)
  const k = data?.kpis ?? {}
  const trend = data?.trend ?? []

  return (
    <div className="space-y-5 animate-fadeIn">
      <InsightHeader title="Commerce Analytics" accent="violet" updatedAt={updatedAt} onRefresh={refresh}
        subtitle="Marketplace sales — what's bought, registered and sold"
        range={range} onRange={setRange} ranges={RANGES}
        onExport={() => exportToCsv('commerce-orders', data?.recent_orders ?? [])} />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <KpiTile label="GMV" value={formatCurrency(k.gmv ?? 0)} icon={<IndianRupee className="h-4 w-4" />} accent="violet" loading={loading} spark={trend.map(t => t.revenue)} />
        <KpiTile label="Orders" value={k.orders ?? 0} icon={<ShoppingBag className="h-4 w-4" />} accent="blue" loading={loading} spark={trend.map(t => t.orders)} />
        <KpiTile label="Units Sold" value={k.units ?? 0} icon={<Boxes className="h-4 w-4" />} accent="indigo" loading={loading} />
        <KpiTile label="Avg Order" value={formatCurrency(k.aov ?? 0)} icon={<TrendingUp className="h-4 w-4" />} accent="emerald" loading={loading} />
        <KpiTile label="Commission" value={formatCurrency(k.commission ?? 0)} icon={<Percent className="h-4 w-4" />} accent="amber" loading={loading} />
        <KpiTile label="New Customers" value={k.new_customers ?? 0} icon={<UserPlus className="h-4 w-4" />} accent="rose" loading={loading} sub={`${k.total_customers ?? 0} total`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel className="lg:col-span-2" title="Revenue trend"
          action={<span className="text-xs text-slate-400">{k.new_listings ?? 0} new listings · {k.to_ship ?? 0} to ship</span>}>
          {trend.length ? <AreaSpark data={trend.map(t => t.revenue)} accent="violet" width={720} height={150} /> : <Empty />}
        </Panel>
        <Panel title="Orders by status">
          <Donut data={(data?.status_breakdown ?? []).map(s => ({ label: s.label, value: s.value }))} centerValue={k.orders ?? 0} centerLabel="orders" />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Daily order volume">
          <Bars data={trend.map(t => ({ label: t.date.slice(5), value: t.orders }))} accent="blue" />
        </Panel>
        <Panel title="Payment methods">
          <Donut data={(data?.payment_breakdown ?? []).map(s => ({ label: s.label, value: s.value }))} centerValue={k.valid_orders ?? 0} centerLabel="paid-able" />
        </Panel>
        <Panel title="Best sellers">
          <RankList items={data?.top_products ?? []} accent="violet" />
        </Panel>
      </div>

      <Panel title="Recent orders" action={<span className="text-xs text-slate-400">live</span>}>
        {(data?.recent_orders ?? []).length === 0 ? <Empty /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="py-2">Order</th><th>Customer</th><th>Date</th><th className="text-right">Total</th><th>Payment</th><th>Status</th>
              </tr></thead>
              <tbody>
                {data.recent_orders.map((o, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2 font-mono text-xs text-violet-600 font-semibold">{o.order_no}</td>
                    <td className="text-slate-700">{o.customer}</td>
                    <td className="text-slate-500 text-xs">{formatDate(o.placed_at)}</td>
                    <td className="text-right font-semibold">{formatCurrency(o.total)}</td>
                    <td className="text-xs text-slate-500">{o.payment}</td>
                    <td><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[o.status] ?? 'bg-slate-100 text-slate-600'}`}>{o.status}</span></td>
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
