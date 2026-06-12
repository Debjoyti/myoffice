// @ts-nocheck
'use client'

import Link from 'next/link'
import { useLiveData, InsightHeader, KpiTile, Panel, AreaSpark, ACCENT_SOFT } from '@/components/insights'
import { formatCurrency } from '@/lib/utils'
import {
  IndianRupee, Users, Boxes, ShoppingBag, TrendingUp, Target,
  Warehouse, Wallet, ArrowRight, Activity,
} from 'lucide-react'

const SYSTEMS = [
  { key: 'commerce', href: '/insights/commerce', title: 'Commerce', icon: ShoppingBag, accent: 'violet',
    metrics: s => [['GMV (30d)', formatCurrency(s.commerce?.gmv_30d ?? 0)], ['Orders', s.commerce?.orders_30d ?? 0], ['Listings', s.commerce?.active_listings ?? 0]] },
  { key: 'inventory', href: '/insights/inventory', title: 'Inventory & Warehouse', icon: Warehouse, accent: 'blue',
    metrics: s => [['Stock value', formatCurrency(s.inventory?.stock_value ?? 0)], ['Active SKUs', s.inventory?.active_items ?? 0]] },
  { key: 'hr', href: '/insights/hr', title: 'People & HR', icon: Users, accent: 'emerald',
    metrics: s => [['Headcount', s.hr?.headcount ?? 0], ['Present today', s.hr?.present_today ?? 0], ['Attendance', `${s.hr?.attendance_rate ?? 0}%`]] },
  { key: 'crm', href: '/insights/crm', title: 'CRM & Sales Pipeline', icon: Target, accent: 'amber',
    metrics: s => [['Pipeline', formatCurrency(s.crm?.pipeline_value ?? 0)], ['Open leads', s.crm?.open_leads ?? 0]] },
  { key: 'finance', href: '/insights/finance', title: 'Finance', icon: Wallet, accent: 'rose',
    metrics: s => [['Collected (30d)', formatCurrency(s.finance?.collected_30d ?? 0)], ['Outstanding', formatCurrency(s.finance?.outstanding ?? 0)]] },
]

export default function InsightsHub() {
  const { data, loading, updatedAt, refresh } = useLiveData('/api/v1/insights/overview', 20000)
  const h = data?.headline ?? {}
  const sys = data?.systems ?? {}
  const spark = data?.revenue_spark ?? []

  return (
    <div className="space-y-5 animate-fadeIn">
      <InsightHeader title="Insights Hub" accent="indigo" updatedAt={updatedAt} onRefresh={refresh}
        subtitle="One command center for every system — live, cross-domain reporting" />

      {/* Exec KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiTile label="Revenue (30d)" value={formatCurrency(h.total_revenue_30d ?? 0)} icon={<IndianRupee className="h-4 w-4" />} accent="indigo" spark={spark} loading={loading} sub="Sales + collections" />
        <KpiTile label="Marketplace GMV" value={formatCurrency(h.gmv_30d ?? 0)} icon={<ShoppingBag className="h-4 w-4" />} accent="violet" loading={loading} />
        <KpiTile label="Headcount" value={h.headcount ?? 0} icon={<Users className="h-4 w-4" />} accent="emerald" loading={loading} />
        <KpiTile label="Stock Value" value={formatCurrency(h.stock_value ?? 0)} icon={<Boxes className="h-4 w-4" />} accent="blue" loading={loading} />
        <KpiTile label="Open Orders" value={h.open_orders ?? 0} icon={<Activity className="h-4 w-4" />} accent="amber" loading={loading} />
      </div>

      {/* Revenue band */}
      <Panel title="Company revenue — last 30 days" action={<span className="text-xs text-slate-400">Marketplace sales + invoice collections</span>}>
        <AreaSpark data={spark.length ? spark : [0, 0]} accent="indigo" width={1100} height={120} />
      </Panel>

      {/* System cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Dashboards by system</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SYSTEMS.map(s => (
            <Link key={s.key} href={s.href}>
              <div className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-5 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className={`p-2 rounded-lg ${ACCENT_SOFT[s.accent]}`}><s.icon className="h-4 w-4" /></span>
                    <h3 className="font-semibold text-slate-800">{s.title}</h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {s.metrics(sys).map(([label, value], i) => (
                    <div key={i}>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
