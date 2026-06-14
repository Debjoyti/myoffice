// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, StatCard, Badge, Button } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  Package, Warehouse, Ship, AlertTriangle, TrendingUp, TrendingDown,
  ShoppingCart, ArrowUpDown,
  ArrowDown, FileText, RefreshCw, FlaskConical
} from 'lucide-react'

const MOCK_STATS = {
  inventory: { total_items: 48, items_with_stock: 42, total_value: 18420000, warehouses: 3 },
  alerts: { pending_prs: 5, open_pos: 8, import_pos: 3, grns_pending_qc: 2, active_imports: 4, imports_at_customs: 1 },
  movement_30d: { inward_value: 4250000, outward_value: 3180000, net_change: 1070000, transactions: 86 },
  po_pipeline: { total: 8, open_value: 6840000, by_status: { draft: 2, approved: 3, sent_to_vendor: 2, partially_received: 1 } },
}

const MOCK_REORDER = [
  { sku: 'RAW-STL-001', name: 'Steel Sheet 2mm', qty: 80, reorder: 200, warehouse: 'WH-02', status: 'critical' },
  { sku: 'CHM-SOL-001', name: 'Flux Solution 500ml', qty: 15, reorder: 50, warehouse: 'WH-03', status: 'critical' },
  { sku: 'ELE-RES-047', name: 'Resistor 47Ω', qty: 850, reorder: 1000, warehouse: 'WH-01', status: 'low' },
]

const MOCK_RECENT = [
  { id: '1', ref: 'GRN-2026-0021', type: 'GRN', item: 'PCB Assembly Board × 200 pcs', warehouse: 'WH-01', value: 250000, at: '30 May, 4:12 PM', direction: 'in' },
  { id: '2', ref: 'GI-2026-0018',  type: 'GI',  item: 'Capacitor 100µF × 500 pcs',    warehouse: 'WH-01', value: 4000,   at: '30 May, 2:00 PM', direction: 'out' },
  { id: '3', ref: 'STO-2026-005',  type: 'STO', item: 'Fin. Assembly A1 × 30 pcs',    warehouse: 'WH-01→WH-02', value: 144000, at: '29 May, 11:30 AM', direction: 'transfer' },
  { id: '4', ref: 'GRN-2026-0020', type: 'GRN', item: 'Flux Solution × 20 btl',        warehouse: 'WH-03', value: 6400,   at: '26 May, 9:45 AM', direction: 'in' },
]

const MOCK_PENDING_POS = [
  { po_no: 'PO-2026-0031', vendor: 'BFW India Ltd', type: 'domestic', amount: 450000, status: 'approved', delivery_date: '2026-06-10' },
  { po_no: 'PO-2026-0030', vendor: 'Shenzhen Tech Co.', type: 'import', amount: 1850000, status: 'sent_to_vendor', delivery_date: '2026-06-25' },
  { po_no: 'PO-2026-0029', vendor: 'ABC Steel Traders', type: 'domestic', amount: 280000, status: 'partially_received', delivery_date: '2026-05-28' },
]

const TYPE_BADGE: Record<string, any> = { GRN: 'success', GI: 'danger', STO: 'info' }
const PO_STATUS_COLOR: Record<string, string> = {
  draft: 'text-slate-500', approved: 'text-blue-600', sent_to_vendor: 'text-violet-600',
  partially_received: 'text-amber-600',
}

export default function InventorySuiteDashboard() {
  const [stats, setStats] = useState(MOCK_STATS)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(true)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/inventory/stats')
      if (res.ok) {
        const data = await res.json()
        if (data.inventory?.total_items > 0) {
          setStats(data)
          setIsPreview(false)
        }
      }
    } catch { /* use mock */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Inventory & Warehouse Suite</h1>
          <p className="text-sm text-slate-500 mt-0.5">End-to-end IMS + WMS — domestic & import tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchStats}>Refresh</Button>
          <Button size="sm" leftIcon={<FileText className="h-3.5 w-3.5" />} as={Link as any} href="/inventory-suite/pr">New PR</Button>
        </div>
      </div>

      {isPreview && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
          <span><strong>Preview mode</strong> — Showing illustrative data. Start adding items and warehouses to see live data.</span>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Inventory Value" value={formatCurrency(stats.inventory.total_value)} icon={<Package className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" delta={{ value: `${stats.inventory.items_with_stock} SKUs in stock`, positive: true }} />
        <StatCard label="Active Warehouses" value={stats.inventory.warehouses.toString()} icon={<Warehouse className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="30-Day Inward" value={formatCurrency(stats.movement_30d.inward_value)} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="30-Day Outward" value={formatCurrency(stats.movement_30d.outward_value)} icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
      </div>

      {/* Alert Row */}
      {(stats.alerts.pending_prs + stats.alerts.grns_pending_qc + stats.alerts.imports_at_customs + MOCK_REORDER.length) > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.alerts.pending_prs > 0 && (
            <Link href="/inventory-suite/pr?status=submitted" className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div><p className="text-xs font-bold text-blue-800">{stats.alerts.pending_prs} PRs Pending Approval</p><p className="text-[10px] text-blue-600">Awaiting review</p></div>
            </Link>
          )}
          {stats.alerts.grns_pending_qc > 0 && (
            <Link href="/inventory-suite/grn?status=under_inspection" className="flex items-center gap-3 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
              <FlaskConical className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <div><p className="text-xs font-bold text-amber-800">{stats.alerts.grns_pending_qc} GRNs Pending QC</p><p className="text-[10px] text-amber-600">Quality check needed</p></div>
            </Link>
          )}
          {MOCK_REORDER.filter(r => r.status === 'critical').length > 0 && (
            <Link href="/inventory-suite/reorder" className="flex items-center gap-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <div><p className="text-xs font-bold text-red-800">{MOCK_REORDER.filter(r => r.status === 'critical').length} Critical Reorders</p><p className="text-[10px] text-red-600">Stock below safety level</p></div>
            </Link>
          )}
          {stats.alerts.imports_at_customs > 0 && (
            <Link href="/inventory-suite/imports?status=at_customs" className="flex items-center gap-3 px-3 py-2.5 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors">
              <Ship className="h-4 w-4 text-violet-600 flex-shrink-0" />
              <div><p className="text-xs font-bold text-violet-800">{stats.alerts.imports_at_customs} Shipment at Customs</p><p className="text-[10px] text-violet-600">Clearance pending</p></div>
            </Link>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Reorder Alerts */}
        <Card>
          <CardHeader title="Reorder Alerts" description="Items below reorder level" />
          <div className="space-y-2 mt-3">
            {MOCK_REORDER.map(item => (
              <div key={item.sku} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${item.status === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.sku} · {item.warehouse}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${item.status === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>{item.qty} left</p>
                  <p className="text-[10px] text-slate-400">Min: {item.reorder}</p>
                </div>
              </div>
            ))}
            <Link href="/inventory-suite/reorder" className="block text-center text-xs text-blue-600 hover:underline pt-1">View all reorder alerts →</Link>
          </div>
        </Card>

        {/* Recent Movements */}
        <Card>
          <CardHeader title="Recent Movements" description="Last stock transactions" />
          <div className="space-y-2 mt-3">
            {MOCK_RECENT.map(m => (
              <div key={m.id} className="flex items-start gap-3 pb-2 border-b border-slate-50 last:border-0">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  m.direction === 'in' ? 'bg-emerald-100' : m.direction === 'out' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {m.direction === 'in'
                    ? <ArrowDown className="h-3 w-3 text-emerald-600" />
                    : m.direction === 'out'
                    ? <TrendingDown className="h-3 w-3 text-red-600" />
                    : <ArrowUpDown className="h-3 w-3 text-blue-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold text-blue-600">{m.ref}</span>
                    <Badge variant={TYPE_BADGE[m.type] ?? 'neutral'}>{m.type}</Badge>
                  </div>
                  <p className="text-xs text-slate-700 truncate mt-0.5">{m.item}</p>
                  <p className="text-[10px] text-slate-400">{m.warehouse} · {m.at}</p>
                </div>
                <p className={`text-xs font-semibold flex-shrink-0 ${m.direction === 'in' ? 'text-emerald-600' : m.direction === 'out' ? 'text-red-600' : 'text-blue-600'}`}>
                  {m.direction === 'in' ? '+' : m.direction === 'out' ? '-' : '⇄'}{formatCurrency(m.value)}
                </p>
              </div>
            ))}
            <Link href="/inventory-suite/ledger" className="block text-center text-xs text-blue-600 hover:underline pt-1">View full stock ledger →</Link>
          </div>
        </Card>

        {/* PO Pipeline */}
        <Card>
          <CardHeader title="PO Pipeline" description="Open purchase orders" />
          <div className="space-y-2 mt-3">
            {MOCK_PENDING_POS.map(po => (
              <div key={po.po_no} className="p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600">{po.po_no}</span>
                  <Badge variant={po.type === 'import' ? 'info' : 'neutral'}>{po.type}</Badge>
                </div>
                <p className="text-xs font-medium text-slate-800 mt-1">{po.vendor}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-[10px] font-semibold ${PO_STATUS_COLOR[po.status] ?? 'text-slate-500'}`}>{po.status.replace(/_/g,' ')}</span>
                  <span className="text-xs font-bold text-slate-700">{formatCurrency(po.amount)}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Delivery: {po.delivery_date}</p>
              </div>
            ))}
            <Link href="/inventory-suite/po" className="block text-center text-xs text-blue-600 hover:underline pt-1">View all purchase orders →</Link>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: 'New PR',       href: '/inventory-suite/pr',       icon: FileText,    color: 'bg-blue-50 text-blue-600 border-blue-200' },
            { label: 'New PO',       href: '/inventory-suite/po',       icon: ShoppingCart,color: 'bg-violet-50 text-violet-600 border-violet-200' },
            { label: 'Receive GRN',  href: '/inventory-suite/grn',      icon: ArrowDown,   color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
            { label: 'Issue Stock',  href: '/inventory-suite/gi',       icon: TrendingDown,color: 'bg-amber-50 text-amber-600 border-amber-200' },
            { label: 'Transfer STO', href: '/inventory-suite/sto',      icon: ArrowUpDown, color: 'bg-slate-50 text-slate-600 border-slate-200' },
            { label: 'New Import',   href: '/inventory-suite/imports',  icon: Ship,        color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
          ].map(a => (
            <Link key={a.label} href={a.href} className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${a.color} hover:shadow-sm transition-all`}>
              <a.icon className="h-5 w-5" />
              <span className="text-[11px] font-semibold text-center leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
