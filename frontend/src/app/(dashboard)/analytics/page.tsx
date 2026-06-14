'use client'

import { useState, useEffect } from 'react'
import { PageHeader, Card, CardHeader, StatCard, Button } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Users, Clock, IndianRupee, Download, RefreshCw } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6', '#f43f5e']
const TOOLTIP_STYLE = { fontSize: 12, borderRadius: 8 }
const TICK_STYLE = { fontSize: 11, fill: '#94a3b8' }

type DeptStat = { dept: string; count: number; cost: number }
type PayrollMonth = { month: string; payroll: number; headcount: number }

export default function AnalyticsPage() {
  const [loading, setLoading]       = useState(true)
  const [deptData, setDeptData]     = useState<DeptStat[]>([])
  const [payrollData, setPayrollData] = useState<PayrollMonth[]>([])
  const [totalHeadcount, setTotalHeadcount] = useState(0)
  const [activeCount, setActiveCount] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [empRes, payRes] = await Promise.all([
        fetch('/api/v1/employees?status=all&limit=1000'),
        fetch('/api/v1/payroll'),
      ])

      if (empRes.ok) {
        const { employees = [] } = await empRes.json()
        setTotalHeadcount(employees.length)
        setActiveCount(employees.filter((e: any) => e.status === 'active').length)

        // Group by department
        const deptMap: Record<string, { count: number; cost: number }> = {}
        for (const emp of employees) {
          const dept = emp.department || 'Other'
          if (!deptMap[dept]) deptMap[dept] = { count: 0, cost: 0 }
          deptMap[dept].count++
          // Use ctc_monthly from salary structure if available, else default
          deptMap[dept].cost += (emp.ctc_monthly ?? 0) * 12
        }
        const depts = Object.entries(deptMap)
          .map(([dept, v]) => ({ dept, ...v }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
        setDeptData(depts)
      }

      if (payRes.ok) {
        const { payrolls = [] } = await payRes.json()
        // Build monthly payroll trend (last 8 runs)
        const months = [...payrolls]
          .sort((a: any, b: any) => a.payroll_month.localeCompare(b.payroll_month))
          .slice(-8)
          .map((p: any) => ({
            month: p.payroll_month?.slice(0, 7) ?? '—',
            payroll: p.total_gross ?? 0,
            headcount: p.employee_count ?? 0,
          }))
        setPayrollData(months)
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const lastPay = payrollData[payrollData.length - 1]
  const prevPay = payrollData[payrollData.length - 2]
  const payrollGrowth = lastPay && prevPay && prevPay.payroll > 0
    ? ((lastPay.payroll - prevPay.payroll) / prevPay.payroll * 100).toFixed(1)
    : null

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Analytics"
        description="Workforce performance and payroll intelligence"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={fetchData}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Headcount"
          value={loading ? '—' : totalHeadcount}
          delta={!loading && activeCount < totalHeadcount ? { value: `${totalHeadcount - activeCount} inactive`, positive: false } : undefined}
          icon={<Users className="h-4 w-4" />}
          loading={loading}
        />
        <StatCard
          label="Active Employees"
          value={loading ? '—' : activeCount}
          icon={<TrendingUp className="h-4 w-4" />}
          iconColor="bg-emerald-50 text-emerald-600"
          loading={loading}
        />
        <StatCard
          label="Departments"
          value={loading ? '—' : deptData.length}
          icon={<Clock className="h-4 w-4" />}
          iconColor="bg-sky-50 text-sky-600"
          loading={loading}
        />
        <StatCard
          label="Last Payroll"
          value={loading ? '—' : lastPay ? formatCurrency(lastPay.payroll) : '—'}
          delta={payrollGrowth ? { value: `${payrollGrowth}%`, positive: parseFloat(payrollGrowth) > 0 } : undefined}
          icon={<IndianRupee className="h-4 w-4" />}
          iconColor="bg-amber-50 text-amber-600"
          loading={loading}
        />
      </div>

      <div className="space-y-4">
        {/* Payroll Trend */}
        <Card>
          <CardHeader title="Payroll Cost Trend" description={`Last ${payrollData.length} payroll runs`} />
          {loading ? (
            <div className="h-52 skeleton rounded-lg" />
          ) : payrollData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-slate-400">
              No payroll data yet — run your first payroll to see trends.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={payrollData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gPay" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={TICK_STYLE} axisLine={false} tickLine={false} width={52} />
                <Tooltip formatter={(v) => [formatCurrency(v as number), 'Payroll']} contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="payroll" name="Payroll" stroke="#2563eb" strokeWidth={2} fill="url(#gPay)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Headcount by Dept */}
          <Card>
            <CardHeader title="Headcount by Department" description={`${totalHeadcount} total employees`} />
            {loading ? (
              <div className="h-44 skeleton rounded-lg" />
            ) : deptData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-sm text-slate-400">
                Add employees and departments to see distribution.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={TICK_STYLE} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="dept" tick={{ ...TICK_STYLE, fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Dept Cost Breakdown */}
          <Card>
            <CardHeader title="Annual Payroll by Dept" description="Based on CTC data" />
            {loading ? (
              <div className="h-44 skeleton rounded-lg" />
            ) : deptData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-sm text-slate-400">
                Assign salary structures to see cost breakdown.
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={deptData} dataKey="count" nameKey="dept" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {deptData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} employees`, 'Headcount']} contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {deptData.map((d, i) => (
                    <div key={d.dept} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-slate-600 truncate flex-1">{d.dept}</span>
                      <span className="font-medium text-slate-700 tabular-nums">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Key Metrics */}
        <Card>
          <CardHeader title="Key Workforce Metrics" description="Derived from live data" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Active Rate', value: totalHeadcount > 0 ? `${((activeCount / totalHeadcount) * 100).toFixed(1)}%` : '—', note: 'Of total headcount' },
              { label: 'Departments', value: String(deptData.length), note: 'Active org units' },
              { label: 'Avg Team Size', value: deptData.length > 0 ? String(Math.round(activeCount / deptData.length)) : '—', note: 'Per department' },
              { label: 'Payroll Runs', value: String(payrollData.length), note: 'In system' },
            ].map(m => (
              <div key={m.label} className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className="text-xl font-bold mt-1 data-value text-slate-900">{loading ? '—' : m.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{m.note}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
