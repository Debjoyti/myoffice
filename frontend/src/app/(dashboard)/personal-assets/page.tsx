'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card, CardHeader, StatCard, Badge, Button, EmptyState
} from '@/components/ui'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import {
  TrendingUp, TrendingDown, Package, MapPin, Plus, RefreshCw,
  AlertTriangle, Clock, CheckCircle2, ArrowRight, Laptop,
  Gem, Car, Sofa, BarChart3
} from 'lucide-react'

type Summary = {
  totalAssets: number
  activeAssets: number
  portfolioValue: number
  purchaseValue: number
  totalLocations: number
  totalCategories: number
  recentMovements: { movement_type: string; created_at: string }[]
}

type PortfolioReport = {
  totalAssets: number
  activeAssets: number
  totalPurchaseValue: number
  totalCurrentValue: number
  totalDepreciation: number
  depreciationRate: number
  byCategory: Record<string, { count: number; value: number; purchaseValue: number }>
  byStatus: Record<string, number>
  topAssets: {
    id: string; asset_id: string; asset_name: string
    current_value: number; purchase_price: number; category?: string
  }[]
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Electronics: Laptop,
  Jewelry: Gem,
  Vehicle: Car,
  Furniture: Sofa,
  Default: Package,
}

const PIE_COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#64748b']

function fmtCurrency(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const MOVEMENT_LABELS: Record<string, string> = {
  acquisition: 'Asset acquired',
  transfer:    'Location transfer',
  sale:        'Asset sold',
  disposal:    'Asset disposed',
  repair_out:  'Sent for repair',
  repair_in:   'Returned from repair',
  adjustment:  'Value adjustment',
  valuation:   'Valuation updated',
}

export default function PersonalAssetsDashboard() {
  const router = useRouter()
  const [summary, setSummary]   = useState<Summary | null>(null)
  const [portfolio, setPortfolio] = useState<PortfolioReport | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [sumRes, portRes] = await Promise.all([
        fetch('/api/v1/personal-assets/reports?type=summary'),
        fetch('/api/v1/personal-assets/reports?type=portfolio'),
      ])
      if (!sumRes.ok || !portRes.ok) throw new Error('Failed to load')
      const [sum, port] = await Promise.all([sumRes.json(), portRes.json()])
      setSummary(sum)
      setPortfolio(port)
    } catch (e: any) {
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const gainLoss  = portfolio
    ? portfolio.totalCurrentValue - portfolio.totalPurchaseValue
    : 0
  const isGain    = gainLoss >= 0
  const deprPct   = portfolio
    ? Math.round(portfolio.depreciationRate * 10) / 10
    : 0

  // Pie chart data
  const pieData = portfolio
    ? Object.entries(portfolio.byCategory).map(([name, d], i) => ({
        name, value: Math.round(d.value), count: d.count,
      }))
    : []

  // Bar chart: top 8 assets by current value
  const barData = portfolio?.topAssets.slice(0, 8).map(a => ({
    name: a.asset_name.length > 14 ? a.asset_name.slice(0, 14) + '…' : a.asset_name,
    value: Math.round(Number(a.current_value)),
    purchase: Math.round(Number(a.purchase_price)),
  })) ?? []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-sm">Loading your asset portfolio…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <Button size="sm" onClick={load} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!portfolio || portfolio.totalAssets === 0) {
    return (
      <EmptyState
        icon={<Package className="h-8 w-8" />}
        title="No assets yet"
        description="Start tracking your personal assets — add your first item to see your portfolio here."
        action={
          <Button
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => router.push('/personal-assets/add')}
          >
            Add First Asset
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* Top stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white pointer-events-none" />
          <div className="relative">
            <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wide mb-1">Portfolio Value</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{fmtCurrency(portfolio.totalCurrentValue)}</p>
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${isGain ? 'text-emerald-600' : 'text-red-500'}`}>
              {isGain ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isGain ? '+' : ''}{fmtCurrency(Math.abs(gainLoss))} vs purchase
            </div>
          </div>
        </Card>

        <StatCard
          label="Active Assets"
          value={portfolio.activeAssets}
          icon={<Package className="h-4 w-4" />}
          iconColor="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Depreciation"
          value={`${deprPct}%`}
          icon={<TrendingDown className="h-4 w-4" />}
          iconColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Locations"
          value={summary?.totalLocations ?? 0}
          icon={<MapPin className="h-4 w-4" />}
          iconColor="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Portfolio by category — pie */}
        <Card>
          <CardHeader title="Portfolio by Category" />
          {pieData.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No categorized assets</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [fmtCurrency(Number(v)), 'Value']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 min-w-0">
                {pieData.slice(0, 7).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-slate-600 truncate flex-1">{d.name}</span>
                    <span className="text-xs font-semibold text-slate-700 tabular-nums">{fmtCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Top assets — bar */}
        <Card>
          <CardHeader title="Top Assets by Value" />
          {barData.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No assets</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => fmtCurrency(v)} width={55} />
                <Tooltip formatter={(v, name) => [fmtCurrency(Number(v)), name === 'value' ? 'Current' : 'Purchase']} />
                <Bar dataKey="purchase" fill="#e0e7ff" radius={[2,2,0,0]} name="purchase" />
                <Bar dataKey="value"    fill="#6366f1" radius={[2,2,0,0]} name="value" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Bottom row: status + top assets + recent activity */}
      <div className="grid md:grid-cols-3 gap-5">

        {/* Status breakdown */}
        <Card>
          <CardHeader title="Status Breakdown" />
          <div className="space-y-3">
            {Object.entries(portfolio.byStatus).map(([status, count]) => {
              const statusConfig: Record<string, { label: string; color: string; variant: 'success'|'warning'|'danger'|'neutral'|'info' }> = {
                active:   { label: 'Active',    color: 'bg-emerald-500', variant: 'success' },
                sold:     { label: 'Sold',      color: 'bg-blue-500',   variant: 'info' },
                disposed: { label: 'Disposed',  color: 'bg-slate-400',  variant: 'neutral' },
                in_repair:{ label: 'In Repair', color: 'bg-amber-500',  variant: 'warning' },
                lost:     { label: 'Lost',      color: 'bg-red-400',    variant: 'danger' },
                stolen:   { label: 'Stolen',    color: 'bg-red-600',    variant: 'danger' },
              }
              const cfg = statusConfig[status] ?? { label: status, color: 'bg-slate-400', variant: 'neutral' as const }
              if (count === 0) return null
              const pct = Math.round((count / portfolio.totalAssets) * 100)
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant={cfg.variant} dot size="sm">{cfg.label}</Badge>
                    <span className="text-xs font-semibold text-slate-600">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cfg.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Top 5 assets */}
        <Card>
          <CardHeader
            title="Highest Value Assets"
            action={
              <button onClick={() => router.push('/personal-assets/inventory')}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-0.5">
                View all <ArrowRight className="h-3 w-3" />
              </button>
            }
          />
          <div className="space-y-2.5">
            {portfolio.topAssets.slice(0, 5).map((a, i) => {
              const Icon = CATEGORY_ICONS[a.category ?? ''] ?? CATEGORY_ICONS.Default
              return (
                <button
                  key={a.id}
                  onClick={() => router.push(`/personal-assets/${a.id}`)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="text-[11px] font-bold text-slate-300 w-4 text-center">{i + 1}</span>
                  <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{a.asset_name}</p>
                    <p className="text-[10px] text-slate-400">{a.asset_id}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-700 tabular-nums flex-shrink-0">
                    {fmtCurrency(a.current_value)}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader title="Recent Activity" />
          {(summary?.recentMovements ?? []).length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No recent activity</p>
          ) : (
            <div className="space-y-2.5">
              {(summary?.recentMovements ?? []).slice(0, 8).map((m, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 truncate">
                      {MOVEMENT_LABELS[m.movement_type] ?? m.movement_type}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {fmtDate(m.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => router.push('/personal-assets/add')}
        >
          Add Asset
        </Button>
        <Button
          variant="outline" size="sm"
          leftIcon={<BarChart3 className="h-3.5 w-3.5" />}
          onClick={() => router.push('/personal-assets/reports')}
        >
          View Reports
        </Button>
        <Button
          variant="ghost" size="sm"
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          onClick={load}
        >
          Refresh
        </Button>
      </div>
    </div>
  )
}
