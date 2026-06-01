'use client'

import { Card, CardHeader, StatCard, Badge } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { BarChart3, TrendingUp, TrendingDown, Package, Ship, Warehouse, Clock, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const MONTHLY_MOVEMENT = [
  { month: 'Dec', inward: 3200000, outward: 2800000 },
  { month: 'Jan', inward: 4100000, outward: 3400000 },
  { month: 'Feb', inward: 3800000, outward: 3200000 },
  { month: 'Mar', inward: 5200000, outward: 4100000 },
  { month: 'Apr', inward: 4600000, outward: 3900000 },
  { month: 'May', inward: 5800000, outward: 4700000 },
]

const CATEGORY_VALUE = [
  { name: 'Electronics', value: 640000, color: '#3b82f6' },
  { name: 'Finished Goods', value: 1056000, color: '#10b981' },
  { name: 'Raw Material', value: 23800, color: '#f59e0b' },
  { name: 'WIP', value: 126000, color: '#8b5cf6' },
  { name: 'Consumable', value: 58800, color: '#f43f5e' },
  { name: 'Spare Parts', value: 13680, color: '#64748b' },
]

const TOP_ITEMS = [
  { sku: 'FIN-ASM-A1', name: 'Finished Assembly A1', turnover: 82, value: 1056000, movements: 18 },
  { sku: 'ELE-PCB-001', name: 'PCB Assembly Board', turnover: 65, value: 562500, movements: 24 },
  { sku: 'ELE-CAP-100', name: 'Capacitor 100µF', turnover: 45, value: 40000, movements: 12 },
  { sku: 'RAW-STL-001', name: 'Steel Sheet 2mm', turnover: 38, value: 23800, movements: 8 },
  { sku: 'PKG-BOX-L', name: 'Packaging Box Large', turnover: 29, value: 54000, movements: 6 },
]

const IMPORT_TREND = [
  { month: 'Jan', value_usd: 12000, duty: 85000 },
  { month: 'Feb', value_usd: 8500, duty: 62000 },
  { month: 'Mar', value_usd: 22000, duty: 148000 },
  { month: 'Apr', value_usd: 18500, duty: 124000 },
  { month: 'May', value_usd: 31250, duty: 209000 },
]

const WH_UTILIZATION = [
  { name: 'WH-01 (Main)', capacity: 100, used: 64 },
  { name: 'WH-02 (Raw Mat.)', capacity: 100, used: 40 },
  { name: 'WH-03 (Chem.)', capacity: 100, used: 30 },
  { name: 'WH-04 (Bonded)', capacity: 100, used: 5 },
]

const totalInventoryValue = CATEGORY_VALUE.reduce((s, c) => s + c.value, 0)

export default function InventoryAnalyticsPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Inventory Analytics</h2>
        <p className="text-sm text-slate-500 mt-0.5">Comprehensive insights — stock movements, valuation, import trends, and warehouse utilization</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Inventory Value" value={formatCurrency(totalInventoryValue)} icon={<Package className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" delta={{ value: '+12.3% vs last month', positive: true }} />
        <StatCard label="Avg Monthly Turnover" value="4.2x" icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" delta={{ value: 'Industry avg: 3.8x', positive: true }} />
        <StatCard label="Import Ratio" value="38%" icon={<Ship className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="Avg Days of Stock" value="42 days" icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
      </div>

      {/* Movement Trend + Category Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Monthly Stock Movement" description="Inward vs Outward — last 6 months" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MONTHLY_MOVEMENT} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="inward" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outward" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
                <Tooltip formatter={(v) => [formatCurrency(v as number)]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="inward" stroke="#10b981" strokeWidth={2} fill="url(#inward)" name="Inward" />
                <Area type="monotone" dataKey="outward" stroke="#ef4444" strokeWidth={2} fill="url(#outward)" name="Outward" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
        <Card>
          <CardHeader title="Value by Category" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={CATEGORY_VALUE} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent ?? 0)*100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                {CATEGORY_VALUE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [formatCurrency(v as number)]} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Import Trend + WH Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Import Trend" description="Monthly import value (USD) and customs duty (₹)" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={IMPORT_TREND} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="usd" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
              <YAxis yAxisId="inr" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v, name) => [name === 'value_usd' ? `$${Number(v).toLocaleString()}` : formatCurrency(v as number), name === 'value_usd' ? 'Invoice (USD)' : 'Duty + IGST (₹)']} />
              <Bar yAxisId="usd" dataKey="value_usd" fill="#8b5cf6" radius={[3,3,0,0]} name="value_usd" />
              <Bar yAxisId="inr" dataKey="duty" fill="#f43f5e" radius={[3,3,0,0]} name="duty" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Warehouse Utilization" description="Current capacity usage" />
          <div className="space-y-4 mt-4">
            {WH_UTILIZATION.map(wh => (
              <div key={wh.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-700">{wh.name}</span>
                  <span className={`font-semibold ${wh.used > 80 ? 'text-red-600' : wh.used > 60 ? 'text-amber-600' : 'text-emerald-600'}`}>{wh.used}%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${wh.used > 80 ? 'bg-red-500' : wh.used > 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${wh.used}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Moving Items */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Top Items by Turnover</p>
          <p className="text-xs text-slate-400 mt-0.5">Based on last 30 days movement frequency</p>
        </div>
        <div className="divide-y divide-slate-50">
          {TOP_ITEMS.map((item, idx) => (
            <div key={item.sku} className="flex items-center gap-4 px-5 py-3">
              <span className="text-2xl font-black text-slate-100 w-8 text-center">#{idx + 1}</span>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{item.name}</p>
                <p className="font-mono text-xs text-slate-400">{item.sku}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-xs text-slate-400">Turnover</p>
                <p className="font-bold text-blue-600">{item.turnover}x</p>
              </div>
              <div className="text-center px-4">
                <p className="text-xs text-slate-400">Movements</p>
                <p className="font-bold text-slate-700">{item.movements}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Value</p>
                <p className="font-bold text-slate-800">{formatCurrency(item.value)}</p>
              </div>
              <div className="w-24">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item.turnover / TOP_ITEMS[0].turnover) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Aging Analysis */}
      <Card>
        <CardHeader title="Inventory Aging Analysis" description="Stock not moved in 30/60/90+ days" />
        <div className="grid grid-cols-4 gap-4 mt-4">
          {[
            { label: '< 30 days', items: 32, value: 1580000, color: 'text-emerald-600 bg-emerald-50' },
            { label: '30–60 days', items: 10, value: 248000, color: 'text-blue-600 bg-blue-50' },
            { label: '60–90 days', items: 4, value: 86000, color: 'text-amber-600 bg-amber-50' },
            { label: '> 90 days (slow)', items: 2, value: 4800, color: 'text-red-600 bg-red-50' },
          ].map(a => (
            <div key={a.label} className={`p-4 rounded-xl ${a.color}`}>
              <p className="text-xs font-semibold opacity-70">{a.label}</p>
              <p className="text-2xl font-black mt-1">{a.items}</p>
              <p className="text-xs font-semibold mt-1 opacity-80">{formatCurrency(a.value)}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">2 slow-moving items ({formatCurrency(4800)} value) may need review — consider liquidation or write-off.</p>
      </Card>
    </div>
  )
}
