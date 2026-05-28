'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, Button, Badge, StatCard } from '@/components/ui'
import {
  BarChart2, TrendingDown, RefreshCw, Download, FileText,
  Package, AlertCircle
} from 'lucide-react'

type PortfolioReport = {
  totalAssets: number; activeAssets: number
  totalPurchaseValue: number; totalCurrentValue: number
  totalDepreciation: number; depreciationRate: number
  byCategory: Record<string, { count: number; value: number; purchaseValue: number }>
  byStatus: Record<string, number>
  topAssets: {
    id: string; asset_id: string; asset_name: string
    current_value: number; purchase_price: number; category?: string
  }[]
}

type DeprRow = {
  id: string; asset_id: string; asset_name: string
  purchase_date: string; purchase_price: number; current_value: number
  total_depreciation: number; annual_depreciation: number
  depreciation_rate: number; years_elapsed: number
  estimated_remaining_life_years: number | null
}

type DeprReport = {
  asOfDate: string; totalAssets: number; totalDepreciation: number; assets: DeprRow[]
}

function fmtCurrency(n: number) {
  if (n >= 10000000) return `₹${(n/10000000).toFixed(2)}Cr`
  if (n >= 100000)   return `₹${(n/100000).toFixed(2)}L`
  if (n >= 1000)     return `₹${(n/1000).toFixed(1)}K`
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
}

const REPORT_TABS = ['Portfolio', 'Depreciation', 'Category Breakdown'] as const
type Tab = typeof REPORT_TABS[number]

export default function ReportsPage() {
  const [tab, setTab]             = useState<Tab>('Portfolio')
  const [portfolio, setPortfolio] = useState<PortfolioReport | null>(null)
  const [depr, setDepr]           = useState<DeprReport | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  async function loadPortfolio() {
    if (portfolio) return
    setLoading(true); setError('')
    const res = await fetch('/api/v1/personal-assets/reports?type=portfolio')
    if (res.ok) setPortfolio(await res.json())
    else setError('Failed to load portfolio report')
    setLoading(false)
  }

  async function loadDepr() {
    if (depr) return
    setLoading(true); setError('')
    const res = await fetch('/api/v1/personal-assets/reports?type=depreciation')
    if (res.ok) setDepr(await res.json())
    else setError('Failed to load depreciation report')
    setLoading(false)
  }

  useEffect(() => {
    if (tab === 'Portfolio' || tab === 'Category Breakdown') loadPortfolio()
    else if (tab === 'Depreciation') loadDepr()
  }, [tab])

  function exportCSV(data: object[], filename: string) {
    if (!data.length) return
    const keys = Object.keys(data[0])
    const csv  = [keys.join(','), ...data.map(row => keys.map(k => JSON.stringify((row as any)[k] ?? '')).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-800">Reports</h1>
          <p className="text-xs text-slate-500">Financial analysis of your personal asset portfolio</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200">
        {REPORT_TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Portfolio Report */}
      {tab === 'Portfolio' && portfolio && !loading && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Assets"       value={portfolio.totalAssets}   icon={<Package className="h-4 w-4" />} iconColor="bg-indigo-50 text-indigo-600" />
            <StatCard label="Active Assets"      value={portfolio.activeAssets}  icon={<Package className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
            <StatCard label="Portfolio Value"    value={fmtCurrency(portfolio.totalCurrentValue)} icon={<BarChart2 className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
            <StatCard label="Total Depreciation" value={fmtCurrency(portfolio.totalDepreciation)} icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
          </div>

          <Card>
            <CardHeader
              title="Portfolio Valuation Report"
              action={
                <Button variant="outline" size="sm" leftIcon={<Download className="h-3 w-3" />}
                  onClick={() => exportCSV(portfolio.topAssets, 'portfolio-report.csv')}>
                  Export CSV
                </Button>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Asset','Category','Purchase Price','Current Value','Depreciation','Status'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portfolio.topAssets.map(a => {
                    const deprAmt  = a.purchase_price - a.current_value
                    const deprPct  = a.purchase_price > 0 ? Math.round((deprAmt / a.purchase_price) * 100) : 0
                    return (
                      <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <p className="font-semibold text-slate-700">{a.asset_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{a.asset_id}</p>
                        </td>
                        <td className="py-2 px-3 text-slate-500">{a.category ?? '—'}</td>
                        <td className="py-2 px-3 text-slate-600 tabular-nums">{fmtCurrency(a.purchase_price)}</td>
                        <td className="py-2 px-3 font-semibold text-indigo-700 tabular-nums">{fmtCurrency(a.current_value)}</td>
                        <td className="py-2 px-3">
                          <span className={`font-medium tabular-nums ${deprPct > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {deprPct > 0 ? `−${deprPct}%` : '—'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <Badge variant="success" dot size="sm">Active</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-700" colSpan={2}>Totals</td>
                    <td className="py-2 px-3 font-bold text-slate-700 tabular-nums">{fmtCurrency(portfolio.totalPurchaseValue)}</td>
                    <td className="py-2 px-3 font-bold text-indigo-700 tabular-nums">{fmtCurrency(portfolio.totalCurrentValue)}</td>
                    <td className="py-2 px-3 font-bold text-amber-600">{Math.round(portfolio.depreciationRate * 10)/10}%</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Depreciation Report */}
      {tab === 'Depreciation' && depr && !loading && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Assets Depreciating" value={depr.totalAssets} icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
            <StatCard label="Total Depreciation"  value={fmtCurrency(depr.totalDepreciation)} icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
            <StatCard label="As of Date"           value={fmtDate(depr.asOfDate)} icon={<FileText className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
          </div>

          <Card>
            <CardHeader
              title="Depreciation Schedule"
              action={
                <Button variant="outline" size="sm" leftIcon={<Download className="h-3 w-3" />}
                  onClick={() => exportCSV(depr.assets, 'depreciation-report.csv')}>
                  Export CSV
                </Button>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Asset','Purchase Date','Purchase Price','Current Value','Annual Depr.','Total Depr.','Remaining Life'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {depr.assets.map(a => (
                    <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <p className="font-semibold text-slate-700 whitespace-nowrap">{a.asset_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{a.asset_id}</p>
                      </td>
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{fmtDate(a.purchase_date)}</td>
                      <td className="py-2 px-3 text-slate-600 tabular-nums">{fmtCurrency(a.purchase_price)}</td>
                      <td className="py-2 px-3 font-semibold text-indigo-700 tabular-nums">{fmtCurrency(a.current_value)}</td>
                      <td className="py-2 px-3 text-amber-600 tabular-nums">{fmtCurrency(a.annual_depreciation)}/yr</td>
                      <td className="py-2 px-3 text-red-500 tabular-nums">{fmtCurrency(a.total_depreciation)}</td>
                      <td className="py-2 px-3 text-slate-500">
                        {a.estimated_remaining_life_years !== null
                          ? `${a.estimated_remaining_life_years} yrs`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-700" colSpan={5}>Total Depreciation</td>
                    <td className="py-2 px-3 font-bold text-red-500 tabular-nums">{fmtCurrency(depr.totalDepreciation)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Category Breakdown */}
      {tab === 'Category Breakdown' && portfolio && !loading && (
        <Card>
          <CardHeader title="Portfolio by Category" />
          <div className="space-y-3">
            {Object.entries(portfolio.byCategory)
              .sort(([,a],[,b]) => b.value - a.value)
              .map(([name, data]) => {
                const pct = portfolio.totalCurrentValue > 0
                  ? Math.round((data.value / portfolio.totalCurrentValue) * 100)
                  : 0
                const catDepr = data.purchaseValue > 0
                  ? Math.round(((data.purchaseValue - data.value) / data.purchaseValue) * 100)
                  : 0
                return (
                  <div key={name} className="flex items-center gap-4">
                    <div className="w-28 flex-shrink-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{name}</p>
                      <p className="text-[10px] text-slate-400">{data.count} asset{data.count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right w-36 flex-shrink-0">
                      <p className="text-xs font-semibold text-slate-700 tabular-nums">{fmtCurrency(data.value)}</p>
                      <p className="text-[10px] text-slate-400">{pct}% of portfolio · {catDepr > 0 ? `−${catDepr}% depr` : 'no depr'}</p>
                    </div>
                  </div>
                )
              })}
          </div>
        </Card>
      )}
    </div>
  )
}
