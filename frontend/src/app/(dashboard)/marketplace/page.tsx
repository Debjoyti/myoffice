// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader, Card, StatCard, Button, EmptyState } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  ShoppingBag, Package, TrendingUp, IndianRupee, Boxes, Truck,
  Star, AlertTriangle, Plus, Store, ArrowRight, Receipt,
} from 'lucide-react'

export default function MarketplaceDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/marketplace/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const k = data?.kpis ?? {}
  const trend = data?.sales_trend ?? []
  const maxTrend = Math.max(1, ...trend.map(t => t.total))

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Seller Center"
        description="Your storefront at a glance — sales, orders, and inventory health"
        actions={
          <>
            <Link href="/marketplace/storefront"><Button variant="outline" size="sm" leftIcon={<Store className="h-3.5 w-3.5" />}>View Storefront</Button></Link>
            <Link href="/marketplace/products"><Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>Add Product</Button></Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="GMV (Gross Sales)" value={formatCurrency(k.gmv ?? 0)} icon={<IndianRupee className="h-4 w-4" />} accent="emerald" loading={loading} />
        <StatCard label="Orders" value={(k.orders ?? 0).toString()} icon={<ShoppingBag className="h-4 w-4" />} accent="blue" loading={loading} />
        <StatCard label="Units Sold" value={(k.units_sold ?? 0).toString()} icon={<Boxes className="h-4 w-4" />} accent="violet" loading={loading} />
        <StatCard label="Avg Order Value" value={formatCurrency(k.avg_order_value ?? 0)} icon={<TrendingUp className="h-4 w-4" />} accent="amber" loading={loading} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Listings" value={(k.active_listings ?? 0).toString()} icon={<Package className="h-4 w-4" />} accent="blue" loading={loading} />
        <StatCard label="Pending Orders" value={(k.pending_orders ?? 0).toString()} icon={<Receipt className="h-4 w-4" />} accent="amber" loading={loading} />
        <StatCard label="Ready to Ship" value={(k.to_ship ?? 0).toString()} icon={<Truck className="h-4 w-4" />} accent="violet" loading={loading} />
        <StatCard label="Out of Stock" value={(k.low_stock ?? 0).toString()} icon={<AlertTriangle className="h-4 w-4" />} accent="red" loading={loading}
          delta={k.low_stock > 0 ? { value: 'Restock now', positive: false } : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales trend */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Sales — last 30 days</h3>
            <span className="text-xs text-slate-400">Commission earned: <strong className="text-slate-600">{formatCurrency(k.commission ?? 0)}</strong></span>
          </div>
          {trend.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-slate-400">No sales yet — your trend will appear here.</div>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {trend.map(t => (
                <div key={t.date} className="flex-1 flex flex-col items-center justify-end group" title={`${t.date}: ${formatCurrency(t.total)}`}>
                  <div className="w-full rounded-t bg-blue-500/80 group-hover:bg-blue-600 transition-all" style={{ height: `${(t.total / maxTrend) * 100}%`, minHeight: 2 }} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top products */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Best Sellers</h3>
          {(data?.top_products ?? []).length === 0 ? (
            <EmptyState icon={<Package className="h-6 w-6" />} title="No bestsellers yet" description="Sell your first unit to see rankings." />
          ) : (
            <div className="space-y-3">
              {data.top_products.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300 w-4">{i + 1}</span>
                  <div className="h-9 w-9 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : <Package className="h-4 w-4 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{p.title}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> {Number(p.rating_avg || 0).toFixed(1)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{p.units_sold} sold</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/marketplace/products', label: 'Manage Products', icon: Package },
          { href: '/marketplace/orders', label: 'Orders', icon: ShoppingBag },
          { href: '/marketplace/categories', label: 'Categories', icon: Boxes },
          { href: '/marketplace/settings', label: 'Fees & Settings', icon: TrendingUp },
        ].map(l => (
          <Link key={l.href} href={l.href}>
            <Card hover className="p-4 flex items-center gap-3">
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600"><l.icon className="h-4 w-4" /></span>
              <span className="text-sm font-medium text-slate-700 flex-1">{l.label}</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
