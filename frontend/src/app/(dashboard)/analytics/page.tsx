'use client'

import { PageHeader, Card, CardHeader, StatCard, Badge } from '@/components/ui'
import { BarChart3, TrendingUp, Users, Clock, DollarSign, Target } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const DEPT_HEADCOUNT = [
  { dept: 'Engineering', count: 98, pct: 34.5 },
  { dept: 'Sales', count: 54, pct: 19.0 },
  { dept: 'Finance', count: 28, pct: 9.9 },
  { dept: 'HR', count: 18, pct: 6.3 },
  { dept: 'Operations', count: 42, pct: 14.8 },
  { dept: 'Marketing', count: 30, pct: 10.6 },
  { dept: 'Others', count: 14, pct: 4.9 },
]

const DEPT_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-purple-500', 'bg-rose-500', 'bg-slate-400']

const MONTHLY_DATA = [
  { month: 'Oct', revenue: 9800000, payroll: 3800000 },
  { month: 'Nov', revenue: 10200000, payroll: 3900000 },
  { month: 'Dec', revenue: 11500000, payroll: 4000000 },
  { month: 'Jan', revenue: 10800000, payroll: 4100000 },
  { month: 'Feb', revenue: 11200000, payroll: 4150000 },
  { month: 'Mar', revenue: 12100000, payroll: 4200000 },
  { month: 'Apr', revenue: 11700000, payroll: 4250000 },
  { month: 'May', revenue: 12450000, payroll: 4280000 },
]

const maxRevenue = Math.max(...MONTHLY_DATA.map(d => d.revenue))

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Analytics"
        description="Business intelligence and performance metrics"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Revenue MTD" value={formatCurrency(12450000)} delta={{ value: '8.3%', positive: true }} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Total Headcount" value="284" delta={{ value: '3 new', positive: true }} icon={<Users className="h-4 w-4" />} iconColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
        <StatCard label="Avg Attendance" value="84.9%" delta={{ value: '1.2%', positive: true }} icon={<Clock className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard label="Payroll Ratio" value="34.4%" delta={{ value: '0.5%', positive: false }} icon={<DollarSign className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue trend */}
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue vs Payroll Trend" description="Last 8 months" />
          <div className="space-y-1">
            {MONTHLY_DATA.map(d => (
              <div key={d.month} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-8 flex-shrink-0">{d.month}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${(d.revenue / maxRevenue) * 100}%` }} />
                    <span className="text-xs text-slate-500 whitespace-nowrap">{formatCurrency(d.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-rose-400 rounded-full" style={{ width: `${(d.payroll / maxRevenue) * 100}%` }} />
                    <span className="text-xs text-slate-400 whitespace-nowrap">{formatCurrency(d.payroll)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5"><div className="h-2 w-4 bg-indigo-500 rounded" /><span className="text-xs text-slate-500">Revenue</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-4 bg-rose-400 rounded" /><span className="text-xs text-slate-500">Payroll</span></div>
          </div>
        </Card>

        {/* Headcount by dept */}
        <Card>
          <CardHeader title="Headcount by Dept" description="284 total employees" />
          <div className="space-y-2.5">
            {DEPT_HEADCOUNT.map((d, i) => (
              <div key={d.dept}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">{d.dept}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{d.count}</span>
                    <span className="text-xs text-slate-400">{d.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${DEPT_COLORS[i]} rounded-full`} style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Offers Accepted', value: '94.2%', trend: '+2.1%', positive: true, note: 'Last 30 days' },
          { label: 'Avg Time to Hire', value: '18 days', trend: '-3 days', positive: true, note: 'vs last quarter' },
          { label: 'Employee NPS', value: '72', trend: '+5', positive: true, note: 'Q2 2026 survey' },
          { label: 'Attrition Rate', value: '4.2%', trend: '-0.8%', positive: true, note: 'Annualized' },
        ].map(k => (
          <Card key={k.label}>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{k.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 data-value">{k.value}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-xs font-semibold ${k.positive ? 'text-emerald-600' : 'text-red-600'}`}>{k.trend}</span>
              <span className="text-xs text-slate-400">{k.note}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
