'use client'

import { useState, useEffect } from 'react'
import { StatCard, Card, CardHeader, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td, PageHeader, ProgressBar } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  Users, Clock, Banknote, TrendingUp, AlertCircle,
  ArrowRight, CalendarDays, UserPlus, FileText, ShieldCheck,
  CheckCircle2, Building2, Target, Package, MessageSquare,
  Zap, BarChart3, ArrowUpRight, Activity
} from 'lucide-react'

const RECENT_HIRES = [
  { name: 'Priya Sharma', dept: 'Engineering', role: 'Sr. Software Engineer', joined: '10 May 2026', status: 'Active' },
  { name: 'Rahul Mehta', dept: 'Finance', role: 'Financial Analyst', joined: '08 May 2026', status: 'Active' },
  { name: 'Ananya Iyer', dept: 'HR', role: 'HR Business Partner', joined: '05 May 2026', status: 'Onboarding' },
  { name: 'Karan Singh', dept: 'Sales', role: 'Account Executive', joined: '01 May 2026', status: 'Active' },
]

const PENDING_ACTIONS = [
  { icon: <FileText className="h-3.5 w-3.5" />, title: '5 leave requests pending approval', urgency: 'warning' as const, link: '/attendance' },
  { icon: <AlertCircle className="h-3.5 w-3.5" />, title: '3 employees with expiring documents', urgency: 'danger' as const, link: '/hrms' },
  { icon: <UserPlus className="h-3.5 w-3.5" />, title: '2 onboarding tasks incomplete', urgency: 'warning' as const, link: '/hrms' },
  { icon: <ShieldCheck className="h-3.5 w-3.5" />, title: 'May payroll ready to process', urgency: 'info' as const, link: '/payroll' },
  { icon: <CheckCircle2 className="h-3.5 w-3.5" />, title: '1 PO pending CFO approval', urgency: 'warning' as const, link: '/procurement' },
]

const UPCOMING = [
  { title: 'All-Hands Meeting', date: 'Today, 3:00 PM', type: 'Meeting' },
  { title: 'Payroll Processing — May', date: 'Tomorrow', type: 'Payroll' },
  { title: 'Q2 Business Review', date: '20 May', type: 'Review' },
  { title: 'GST Filing Deadline', date: '25 May', type: 'Compliance' },
]

const MODULES = [
  { name: 'HRMS', desc: 'People & org', href: '/hrms', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30', stat: '284 employees', pct: 92 },
  { name: 'Attendance', desc: 'Time & leave', href: '/attendance', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30', stat: '84.9% present', pct: 85 },
  { name: 'Payroll', desc: 'Salary & compliance', href: '/payroll', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30', stat: 'May pending', pct: 60 },
  { name: 'Finance', desc: 'Accounting & AR', href: '/finance', color: 'text-sky-600 bg-sky-50 dark:bg-sky-900/30', stat: '₹1.24Cr MTD', pct: 78 },
  { name: 'Procurement', desc: 'PO & vendors', href: '/procurement', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30', stat: '12 open POs', pct: 45 },
  { name: 'CRM', desc: 'Leads & pipeline', href: '/crm', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30', stat: '₹48L pipeline', pct: 65 },
]

const DEPT_BREAKDOWN = [
  { name: 'Engineering', count: 98, color: 'bg-indigo-500' },
  { name: 'Sales', count: 54, color: 'bg-emerald-500' },
  { name: 'Operations', count: 42, color: 'bg-amber-500' },
  { name: 'Marketing', count: 30, color: 'bg-sky-500' },
  { name: 'Finance', count: 28, color: 'bg-purple-500' },
  { name: 'HR', count: 18, color: 'bg-rose-500' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardHome() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const totalHeadcount = DEPT_BREAKDOWN.reduce((s, d) => s + d.count, 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={`${getGreeting()}, Admin`}
        description={`${dateStr} · PRSK Technologies Pvt. Ltd.`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value="284" delta={{ value: '3 new this month', positive: true }} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Present Today" value="241" delta={{ value: '84.9%', positive: true }} icon={<Clock className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard label="Monthly Payroll" value={formatCurrency(4_280_000)} delta={{ value: '2.1%', positive: true }} icon={<Banknote className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <StatCard label="Revenue MTD" value={formatCurrency(12_450_000)} delta={{ value: '8.3%', positive: true }} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Hires */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <CardHeader
              title="Recent Hires"
              description="Employees who joined this month"
              className="px-5 pt-5"
              action={<Link href="/hrms"><Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>View all</Button></Link>}
            />
            <Table>
              <Thead><tr><Th>Employee</Th><Th>Department</Th><Th>Joined</Th><Th>Status</Th></tr></Thead>
              <Tbody>
                {RECENT_HIRES.map(e => (
                  <Tr key={e.name}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={e.name} size="sm" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{e.name}</p>
                          <p className="text-xs text-slate-400">{e.role}</p>
                        </div>
                      </div>
                    </Td>
                    <Td><span className="text-slate-600 dark:text-slate-400">{e.dept}</span></Td>
                    <Td><span className="text-slate-500 text-xs">{e.joined}</span></Td>
                    <Td><Badge variant={e.status === 'Active' ? 'success' : 'warning'} dot>{e.status}</Badge></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Action Items */}
          <Card padding="none">
            <CardHeader title="Action Required" description={`${PENDING_ACTIONS.length} items need attention`} className="px-4 pt-4" />
            <div className="px-2 pb-2 space-y-0.5">
              {PENDING_ACTIONS.map(a => (
                <Link key={a.title} href={a.link} className="flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors group">
                  <span className={`mt-0.5 flex-shrink-0 ${a.urgency === 'danger' ? 'text-red-500' : a.urgency === 'warning' ? 'text-amber-500' : 'text-blue-500'}`}>
                    {a.icon}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 leading-snug">{a.title}</span>
                </Link>
              ))}
            </div>
          </Card>

          {/* Upcoming */}
          <Card padding="none">
            <CardHeader title="Upcoming" className="px-4 pt-4" />
            <div className="px-2 pb-2 space-y-0.5">
              {UPCOMING.map(e => (
                <div key={e.title} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{e.title}</p>
                    <p className="text-xs text-slate-400">{e.date}</p>
                  </div>
                  <Badge variant="neutral" size="sm">{e.type}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Headcount by Department */}
        <Card>
          <CardHeader title="Headcount by Dept" description={`${totalHeadcount} total`} />
          <div className="space-y-3">
            {DEPT_BREAKDOWN.map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <div className="w-20 text-xs text-slate-600 dark:text-slate-400 truncate">{d.name}</div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${d.color}`} style={{ width: `${(d.count / totalHeadcount) * 100}%` }} />
                </div>
                <div className="w-6 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right tabular-nums">{d.count}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Module Quick Access */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <CardHeader title="Quick Access" description="Jump to any module" className="px-5 pt-5" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800">
              {MODULES.map(m => (
                <Link key={m.name} href={m.href} className="flex flex-col gap-2 p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${m.color}`}>{m.name}</span>
                    <ArrowUpRight className="h-3 w-3 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{m.desc}</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{m.stat}</p>
                  </div>
                  <ProgressBar value={m.pct} color="indigo" size="xs" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
