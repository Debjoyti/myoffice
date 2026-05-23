'use client'

import { useState } from 'react'
import { PageHeader, Card, CardHeader, StatCard, Badge, TabBar, Button } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Users, Clock, DollarSign, Download, BarChart3 } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const MONTHLY = [
  { month: 'Oct', revenue: 9800000, payroll: 3800000, headcount: 268 },
  { month: 'Nov', revenue: 10200000, payroll: 3900000, headcount: 272 },
  { month: 'Dec', revenue: 11500000, payroll: 4000000, headcount: 275 },
  { month: 'Jan', revenue: 10800000, payroll: 4100000, headcount: 278 },
  { month: 'Feb', revenue: 11200000, payroll: 4150000, headcount: 280 },
  { month: 'Mar', revenue: 12100000, payroll: 4200000, headcount: 281 },
  { month: 'Apr', revenue: 11700000, payroll: 4250000, headcount: 283 },
  { month: 'May', revenue: 12450000, payroll: 4280000, headcount: 284 },
]

const DEPT_DATA = [
  { dept: 'Engineering', count: 98, cost: 17640000 },
  { dept: 'Sales', count: 54, cost: 7560000 },
  { dept: 'Operations', count: 42, cost: 5040000 },
  { dept: 'Marketing', count: 30, cost: 3900000 },
  { dept: 'Finance', count: 28, cost: 3360000 },
  { dept: 'HR', count: 18, cost: 2160000 },
]

const ATTRITION = [
  { month: 'Oct', joined: 4, left: 2 },
  { month: 'Nov', joined: 3, left: 1 },
  { month: 'Dec', joined: 5, left: 3 },
  { month: 'Jan', joined: 6, left: 2 },
  { month: 'Feb', joined: 4, left: 2 },
  { month: 'Mar', joined: 3, left: 1 },
  { month: 'Apr', joined: 5, left: 2 },
  { month: 'May', joined: 3, left: 2 },
]

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#f43f5e']

const TOOLTIP_STYLE = { fontSize: 12, borderRadius: 8 }
const TICK_STYLE = { fontSize: 11, fill: '#94a3b8' }

export default function AnalyticsPage() {
  const [tab, setTab] = useState('overview')

  const totalHeadcount = DEPT_DATA.reduce((s, d) => s + d.count, 0)
  const lastMonth = MONTHLY[MONTHLY.length - 1]
  const prevMonth = MONTHLY[MONTHLY.length - 2]
  const revGrowth = ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1)
  const payrollRatio = (lastMonth.payroll / lastMonth.revenue * 100).toFixed(1)

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Analytics"
        description="Business intelligence and workforce performance metrics"
        actions={<Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export Report</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Revenue MTD" value={formatCurrency(lastMonth.revenue)} delta={{ value: `${revGrowth}%`, positive: parseFloat(revGrowth) > 0 }} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Total Headcount" value={totalHeadcount} delta={{ value: '3 new', positive: true }} icon={<Users className="h-4 w-4" />} iconColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
        <StatCard label="Avg Attendance" value="84.9%" delta={{ value: '1.2%', positive: true }} icon={<Clock className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard label="Payroll/Revenue" value={`${payrollRatio}%`} delta={{ value: '0.5%', positive: false }} icon={<DollarSign className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      </div>

      <TabBar
        tabs={[{ id: 'overview', label: 'Business' }, { id: 'workforce', label: 'Workforce' }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'overview' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Revenue vs Payroll Cost" description="Last 8 months" />
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={MONTHLY} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPay" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v / 1000000).toFixed(0)}M`} tick={TICK_STYLE} axisLine={false} tickLine={false} width={52} />
                <Tooltip formatter={(v, n) => [formatCurrency(v as number), (n as string) === 'revenue' ? 'Revenue' : 'Payroll']} contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#gRev)" />
                <Area type="monotone" dataKey="payroll" name="Payroll" stroke="#f59e0b" strokeWidth={2} fill="url(#gPay)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Revenue per Employee" description="Monthly trend" />
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={MONTHLY.map(m => ({ ...m, rpe: Math.round(m.revenue / m.headcount) }))} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} tick={TICK_STYLE} axisLine={false} tickLine={false} width={48} />
                  <Tooltip formatter={(v) => [formatCurrency(v as number), 'Rev/Employee']} contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="rpe" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardHeader title="Dept Cost Distribution" description="Annual payroll by department" />
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={DEPT_DATA} dataKey="cost" nameKey="dept" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {DEPT_DATA.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v as number)} contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {DEPT_DATA.map((d, i) => (
                    <div key={d.dept} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{d.dept}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'workforce' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Headcount Growth" description="New hires vs departures (8 months)" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ATTRITION} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="joined" name="Joined" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="left" name="Left" fill="#f87171" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardHeader title="Headcount by Department" description={`${totalHeadcount} total employees`} />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={DEPT_DATA} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="dept" tick={{ ...TICK_STYLE, fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card>
            <CardHeader title="Key Workforce Metrics" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Avg Tenure', value: '2.8 years', note: 'Company average' },
                { label: 'Attrition Rate', value: '8.4%', note: 'Rolling 12 months', bad: true },
                { label: 'Time to Hire', value: '28 days', note: 'Avg across all roles' },
                { label: 'Offer Acceptance', value: '78%', note: 'Last quarter' },
              ].map(m => (
                <div key={m.label} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{m.label}</p>
                  <p className={`text-xl font-bold mt-1 data-value ${m.bad ? 'text-amber-600' : 'text-slate-900 dark:text-slate-100'}`}>{m.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{m.note}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
