'use client'

import { useState, useEffect } from 'react'
import { StatCard, Card, CardHeader, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Users, Clock, Banknote, TrendingUp, AlertCircle,
  ArrowRight, CalendarDays, UserPlus, FileText, ShieldCheck,
  CheckCircle2, Target, Package, MessageSquare,
  Zap, BarChart3, ArrowUpRight
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

const MODULE_ACCENT: Record<string, { bg: string; text: string; bar: string }> = {
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-500/10',  text: 'text-indigo-600 dark:text-indigo-400',  bar: 'bg-indigo-500' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',   bar: 'bg-amber-500' },
  sky:     { bg: 'bg-sky-50 dark:bg-sky-500/10',      text: 'text-sky-600 dark:text-sky-400',      bar: 'bg-sky-500' },
  purple:  { bg: 'bg-purple-50 dark:bg-purple-500/10',  text: 'text-purple-600 dark:text-purple-400',  bar: 'bg-purple-500' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',    bar: 'bg-rose-500' },
}

const MODULES = [
  { name: 'HRMS',        desc: 'People & org',          href: '/hrms',        icon: Users,        accent: 'indigo',  stat: '284 employees', pct: 92, trend: '+3 this month' },
  { name: 'Attendance',  desc: 'Time & leave',          href: '/attendance',  icon: Clock,        accent: 'emerald', stat: '84.9% present', pct: 85, trend: '+2% vs last wk' },
  { name: 'Payroll',     desc: 'Salary & compliance',   href: '/payroll',     icon: Banknote,     accent: 'amber',   stat: 'May pending',   pct: 60, trend: 'Due 31 May' },
  { name: 'Finance',     desc: 'Accounting & AR',       href: '/finance',     icon: TrendingUp,   accent: 'sky',     stat: '₹1.24Cr MTD',  pct: 78, trend: '+8.3% MoM' },
  { name: 'Procurement', desc: 'PO & vendors',          href: '/procurement', icon: Package,      accent: 'purple',  stat: '12 open POs',   pct: 45, trend: '3 pending POs' },
  { name: 'CRM',         desc: 'Leads & pipeline',      href: '/crm',         icon: Target,       accent: 'rose',    stat: '₹48L pipeline',pct: 65, trend: '+12% pipeline' },
]

const DEPT_BREAKDOWN = [
  { name: 'Engineering', count: 98,  color: 'bg-indigo-500' },
  { name: 'Sales',       count: 54,  color: 'bg-emerald-500' },
  { name: 'Operations',  count: 42,  color: 'bg-amber-500' },
  { name: 'Marketing',   count: 30,  color: 'bg-sky-500' },
  { name: 'Finance',     count: 28,  color: 'bg-purple-500' },
  { name: 'HR',          count: 18,  color: 'bg-rose-500' },
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
    <div className="space-y-5 animate-fadeIn">

      {/* ── Welcome Banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-6 text-white">
        <div className="absolute inset-0 bg-dot-grid" />
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/5" />
        <div className="absolute -right-2 top-10 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-indigo-300 text-sm font-medium">{dateStr}</p>
            <h1 className="text-2xl font-bold mt-0.5 tracking-tight">{getGreeting()}, Admin</h1>
            <p className="text-indigo-300/80 text-sm mt-1">PRSK Technologies Pvt. Ltd.</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-1.5 text-xs font-semibold self-start">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            All systems operational
          </div>
        </div>

        <div className="relative flex flex-wrap gap-2 mt-5">
          {PENDING_ACTIONS.slice(0, 3).map(a => (
            <Link key={a.title} href={a.link}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors',
                a.urgency === 'danger'  ? 'bg-red-500/20 text-red-100 hover:bg-red-500/30' :
                a.urgency === 'warning' ? 'bg-amber-500/20 text-amber-100 hover:bg-amber-500/30' :
                                          'bg-blue-500/20 text-blue-100 hover:bg-blue-500/30'
              )}
            >
              {a.icon}
              {a.title}
            </Link>
          ))}
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Employees" value="284" accent="indigo"
          delta={{ value: '3 new this month', positive: true }}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Present Today" value="241" accent="emerald"
          delta={{ value: '84.9% attendance', positive: true }}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Monthly Payroll" value={formatCurrency(4_280_000)} accent="amber"
          delta={{ value: '2.1% increase', positive: true }}
          icon={<Banknote className="h-4 w-4" />}
        />
        <StatCard
          label="Revenue MTD" value={formatCurrency(12_450_000)} accent="sky"
          delta={{ value: '8.3% growth', positive: true }}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* ── Recent Hires + Action Items ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card padding="none">
            <CardHeader
              title="Recent Hires"
              description="Employees who joined this month"
              className="px-5 pt-5"
              action={
                <Link href="/hrms">
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                    View all
                  </Button>
                </Link>
              }
            />
            <Table>
              <Thead>
                <tr>
                  <Th>Employee</Th>
                  <Th>Department</Th>
                  <Th>Joined</Th>
                  <Th>Status</Th>
                </tr>
              </Thead>
              <Tbody>
                {RECENT_HIRES.map(e => (
                  <Tr key={e.name}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={e.name} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{e.name}</p>
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

        <div className="space-y-4">
          {/* Action Required */}
          <Card padding="none">
            <CardHeader
              title="Action Required"
              description={`${PENDING_ACTIONS.length} items need attention`}
              className="px-4 pt-4"
            />
            <div className="px-2 pb-2 space-y-0.5">
              {PENDING_ACTIONS.map(a => (
                <Link key={a.title} href={a.link}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <span className={cn(
                    'mt-0.5 flex-shrink-0',
                    a.urgency === 'danger' ? 'text-red-500' : a.urgency === 'warning' ? 'text-amber-500' : 'text-blue-500'
                  )}>
                    {a.icon}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 leading-snug">
                    {a.title}
                  </span>
                </Link>
              ))}
            </div>
          </Card>

          {/* Upcoming */}
          <Card padding="none">
            <CardHeader title="Upcoming" className="px-4 pt-4" />
            <div className="px-2 pb-2 space-y-0.5">
              {UPCOMING.map(e => (
                <div key={e.title} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{e.title}</p>
                    <p className="text-xs text-slate-400">{e.date}</p>
                  </div>
                  <Badge variant="neutral" size="sm">{e.type}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Headcount + Module Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Headcount by Department */}
        <Card>
          <CardHeader title="Headcount by Dept" description={`${totalHeadcount} total`} />
          <div className="space-y-3">
            {DEPT_BREAKDOWN.map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <div className="w-20 text-xs font-medium text-slate-600 dark:text-slate-400 truncate">{d.name}</div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', d.color)}
                    style={{ width: `${(d.count / totalHeadcount) * 100}%` }}
                  />
                </div>
                <div className="w-7 text-xs font-bold text-slate-700 dark:text-slate-300 text-right tabular-nums">{d.count}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Module Quick Access */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <CardHeader title="Module Overview" description="Live metrics across all modules" className="px-5 pt-5" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-100 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800">
              {MODULES.map(m => {
                const a = MODULE_ACCENT[m.accent]
                return (
                  <Link
                    key={m.name}
                    href={m.href}
                    className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-150 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className={cn('p-2 rounded-lg', a.bg)}>
                        <m.icon className={cn('h-4 w-4', a.text)} />
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{m.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{m.desc}</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{m.stat}</span>
                        <span className={cn('text-[10px] font-bold flex-shrink-0', a.text)}>{m.trend}</span>
                      </div>
                      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', a.bar)}
                          style={{ width: `${m.pct}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
