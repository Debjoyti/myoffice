'use client'

import { useState, useEffect, useCallback } from 'react'
import { StatCard, Card, CardHeader, Badge, Avatar, Button, EmptyState } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Users, Clock, Banknote, TrendingUp, ArrowRight,
  FileText, CheckCircle2, Wallet,
  Building2, UserCheck, AlertCircle,
  IndianRupee, RefreshCw, UserPlus, CalendarCheck,
  BarChart3, ShieldCheck, Settings, BriefcaseIcon,
  Receipt, BookOpen, Layers
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────────────────────── */
type DashStats = {
  active_employees: number
  departments: number
  present_today: number
  absent_today: number
  attendance_rate: number
  new_hires_month: number
  pending_leaves: number
  pending_approvals: number
  latest_payroll: {
    id: string
    month: string
    total_gross: number
    status: string
  } | null
}

type RecentEmployee = {
  id: string; full_name: string; designation: string; department: string
  date_of_joining: string; avatar_url: string | null
}

type PendingApproval = {
  id: string; type: string; title: string; status: string
  employee?: { full_name: string; designation: string }
  from_date?: string; days_count?: number
}

type Role = 'admin' | 'hr' | 'manager' | 'accountant' | 'employee'

/* ── Role-specific quick links ──────────────────────────────────────────────── */
const QUICK_LINKS_BY_ROLE: Record<Role, Array<{ name: string; href: string; icon: React.ElementType; accent: string; desc: string }>> = {
  admin: [
    { name: 'HRMS',       href: '/hrms',       icon: Users,        accent: 'blue',    desc: 'Employees & org' },
    { name: 'Attendance', href: '/attendance', icon: Clock,        accent: 'emerald', desc: 'Time & leave' },
    { name: 'Payroll',    href: '/payroll',    icon: Banknote,     accent: 'amber',   desc: 'Monthly salary' },
    { name: 'Finance',    href: '/finance',    icon: Receipt,      accent: 'teal',    desc: 'AR / AP / P&L' },
    { name: 'Analytics',  href: '/analytics',  icon: BarChart3,    accent: 'violet',  desc: 'Reports & trends' },
    { name: 'Settings',   href: '/settings',   icon: Settings,     accent: 'rose',    desc: 'Org config' },
  ],
  hr: [
    { name: 'HRMS',       href: '/hrms',       icon: Users,        accent: 'blue',    desc: 'Employees & org' },
    { name: 'Attendance', href: '/attendance', icon: Clock,        accent: 'emerald', desc: 'Time & leave' },
    { name: 'Payroll',    href: '/payroll',    icon: Banknote,     accent: 'amber',   desc: 'Monthly salary' },
    { name: 'Salary',     href: '/salary',     icon: Wallet,       accent: 'sky',     desc: 'Payslips' },
    { name: 'Analytics',  href: '/analytics',  icon: BarChart3,    accent: 'violet',  desc: 'HR analytics' },
    { name: 'IATF Hub',   href: '/iatf',       icon: ShieldCheck,  accent: 'rose',    desc: 'Compliance' },
  ],
  manager: [
    { name: 'HRMS',       href: '/hrms',       icon: Users,        accent: 'blue',    desc: 'My team' },
    { name: 'Attendance', href: '/attendance', icon: Clock,        accent: 'emerald', desc: 'Time & leave' },
    { name: 'Projects',   href: '/projects',   icon: Layers,       accent: 'amber',   desc: 'Project tracker' },
    { name: 'Salary',     href: '/salary',     icon: Wallet,       accent: 'sky',     desc: 'My payslip' },
    { name: 'My Home',    href: '/home',       icon: BriefcaseIcon, accent: 'violet', desc: 'Check in / out' },
    { name: 'Support',    href: '/support',    icon: BookOpen,     accent: 'rose',    desc: 'Tickets' },
  ],
  accountant: [
    { name: 'Finance',    href: '/finance',    icon: Receipt,      accent: 'blue',    desc: 'AR / AP / P&L' },
    { name: 'Payroll',    href: '/payroll',    icon: Banknote,     accent: 'amber',   desc: 'Monthly runs' },
    { name: 'Salary',     href: '/salary',     icon: Wallet,       accent: 'sky',     desc: 'Payslips' },
    { name: 'Procurement',href: '/procurement',icon: Building2,    accent: 'emerald', desc: 'POs & vendors' },
    { name: 'Analytics',  href: '/analytics',  icon: BarChart3,    accent: 'violet',  desc: 'Financial reports' },
  ],
  employee: [
    { name: 'My Home',    href: '/home',       icon: BriefcaseIcon, accent: 'blue',  desc: 'Check in / out' },
    { name: 'Salary',     href: '/salary',     icon: Wallet,       accent: 'sky',     desc: 'My payslip' },
    { name: 'Attendance', href: '/attendance', icon: Clock,        accent: 'emerald', desc: 'My attendance' },
  ],
}

const ACCENT_STYLE: Record<string, { card: string; icon: string; text: string }> = {
  blue:    { card: 'hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20',    icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',    text: 'text-blue-700 dark:text-blue-300' },
  emerald: { card: 'hover:border-emerald-200 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20', icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', text: 'text-emerald-700 dark:text-emerald-300' },
  amber:   { card: 'hover:border-amber-200 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-900/20',   icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',   text: 'text-amber-700 dark:text-amber-300' },
  teal:    { card: 'hover:border-teal-200 dark:hover:border-teal-700 hover:bg-teal-50/50 dark:hover:bg-teal-900/20',     icon: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',     text: 'text-teal-700 dark:text-teal-300' },
  sky:     { card: 'hover:border-sky-200 dark:hover:border-sky-700 hover:bg-sky-50/50 dark:hover:bg-sky-900/20',        icon: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',        text: 'text-sky-700 dark:text-sky-300' },
  violet:  { card: 'hover:border-violet-200 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-900/20', icon: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400', text: 'text-violet-700 dark:text-violet-300' },
  rose:    { card: 'hover:border-rose-200 dark:hover:border-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-900/20',    icon: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',    text: 'text-rose-700 dark:text-rose-300' },
}

/* ── Role-specific stat configs ─────────────────────────────────────────────── */
function getRoleStats(stats: DashStats | null, role: Role, loading: boolean) {
  const base = [
    {
      label: 'Active Employees',
      value: stats?.active_employees ?? '—',
      accent: 'blue' as const,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: 'Departments',
      value: stats?.departments ?? '—',
      accent: 'sky' as const,
      icon: <Building2 className="h-4 w-4" />,
    },
  ]

  if (role === 'accountant') {
    return [
      { label: 'Active Employees', value: stats?.active_employees ?? '—', accent: 'blue' as const, icon: <Users className="h-4 w-4" /> },
      { label: 'Departments',      value: stats?.departments ?? '—',      accent: 'sky' as const,  icon: <Building2 className="h-4 w-4" /> },
      { label: 'Last Payroll',     value: stats?.latest_payroll?.total_gross ? formatCurrency(stats.latest_payroll.total_gross) : '—', accent: 'amber' as const, icon: <IndianRupee className="h-4 w-4" /> },
      { label: 'Payroll Status',   value: stats?.latest_payroll?.status ? capitalize(stats.latest_payroll.status) : '—', accent: 'teal' as const, icon: <CheckCircle2 className="h-4 w-4" /> },
    ]
  }

  return [
    ...base,
    {
      label: 'Present Today',
      value: stats ? `${stats.present_today} / ${stats.active_employees}` : '—',
      accent: 'emerald' as const,
      icon: <UserCheck className="h-4 w-4" />,
      subtitle: stats ? `${stats.attendance_rate}% attendance` : undefined,
    },
    {
      label: role === 'admin' ? 'Pending Approvals' : 'New Hires',
      value: role === 'admin' ? (stats?.pending_approvals ?? '—') : (stats?.new_hires_month ?? '—'),
      accent: 'amber' as const,
      icon: role === 'admin' ? <AlertCircle className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />,
      subtitle: role === 'admin' ? 'Needs review' : 'This month',
    },
  ]
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [stats,   setStats]   = useState<DashStats | null>(null)
  const [recent,  setRecent]  = useState<RecentEmployee[]>([])
  const [pending, setPending] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [me,      setMe]      = useState<any>(null)
  const role: Role = me?.role ?? 'employee'
  const isHR = ['admin', 'hr'].includes(role)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const [meRes, statsRes, empRes] = await Promise.all([
        fetch('/api/v1/me'),
        fetch('/api/v1/dashboard/stats'),
        fetch('/api/v1/employees?status=all'),
      ])

      const meData    = meRes.ok    ? await meRes.json()    : null
      const statsData = statsRes.ok ? await statsRes.json() : null
      const empData   = empRes.ok   ? await empRes.json()   : null

      if (meData?.employee) setMe(meData.employee)
      if (statsData)        setStats(statsData)

      // Recent hires — sort by join date desc, take top 5
      const employees: RecentEmployee[] = empData?.employees ?? []
      const sorted = [...employees].sort(
        (a, b) => new Date(b.date_of_joining).getTime() - new Date(a.date_of_joining).getTime()
      )
      setRecent(sorted.slice(0, 5))

      // Pending approvals for HR/admin
      const currentRole: Role = meData?.employee?.role ?? 'employee'
      if (['admin', 'hr', 'manager'].includes(currentRole)) {
        const pendRes = await fetch('/api/v1/approvals?mode=pending_for_me')
        if (pendRes.ok) {
          const d = await pendRes.json()
          setPending(d.leave_requests ?? [])
        }
      }
    } catch { /* silent — graceful degradation */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const displayName = me?.full_name?.split(' ')[0] ?? 'there'
  const quickLinks  = QUICK_LINKS_BY_ROLE[role] ?? QUICK_LINKS_BY_ROLE.employee
  const kpiStats    = getRoleStats(stats, role, loading)

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* ── Welcome banner ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Good {getGreeting()}, {displayName} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3 w-3" />} onClick={fetchDashboard}>
          Refresh
        </Button>
      </div>

      {/* ── KPI Stats ───────────────────────────────────────────────────── */}
      <div className={cn('grid gap-4', kpiStats.length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3')}>
        {kpiStats.map(s => (
          <StatCard key={s.label} label={s.label} value={loading ? '—' : s.value} accent={s.accent} icon={s.icon} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left / main column ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Quick Navigation — role-filtered */}
          <Card>
            <CardHeader title="Quick Navigation" description="Jump to your modules" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickLinks.map(link => {
                const a = ACCENT_STYLE[link.accent] ?? ACCENT_STYLE.blue
                return (
                  <Link key={link.href} href={link.href}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
                      'transition-all duration-150 group', a.card
                    )}
                  >
                    <div className={cn('p-2 rounded-lg flex-shrink-0 transition-colors', a.icon)}>
                      <link.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn('text-sm font-semibold truncate', a.text)}>{link.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{link.desc}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>

          {/* Recent Hires — only for HR/admin; accountant sees payroll card instead */}
          {isHR ? (
            <Card>
              <CardHeader
                title="Recent Employees"
                description="Latest additions to the team"
                action={
                  <Link href="/hrms" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded-lg" />)}
                </div>
              ) : recent.length === 0 ? (
                <EmptyState icon={<Users className="h-6 w-6" />} title="No employees yet"
                  description="Add your first employee to get started" />
              ) : (
                <div className="space-y-2">
                  {recent.map(emp => (
                    <div key={emp.id} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={emp.full_name} src={emp.avatar_url ?? undefined} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{emp.full_name}</p>
                          <p className="text-xs text-slate-400">{emp.designation} · {emp.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="success" size="sm" dot>Active</Badge>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Joined {formatDate(emp.date_of_joining)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            /* Accountant: show payroll history instead */
            <Card>
              <CardHeader
                title="Payroll Overview"
                description="Latest payroll run"
                action={
                  <Link href="/payroll" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                    Full history <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />
              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="skeleton h-8 rounded" />)}
                </div>
              ) : stats?.latest_payroll ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Month',       value: stats.latest_payroll.month },
                      { label: 'Status',      value: capitalize(stats.latest_payroll.status) },
                      { label: 'Gross Total', value: formatCurrency(stats.latest_payroll.total_gross) },
                      { label: 'Headcount',   value: `${stats.active_employees} employees` },
                    ].map(row => (
                      <div key={row.label} className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{row.label}</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{row.value}</p>
                      </div>
                    ))}
                  </div>
                  <Link href="/payroll"
                    className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    View Payroll Details <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <EmptyState icon={<Banknote className="h-6 w-6" />}
                  title="No payroll yet"
                  description="No payroll runs found" />
              )}
            </Card>
          )}
        </div>

        {/* ── Right column ────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Attendance rate gauge — for HR/admin */}
          {isHR && (
            <Card>
              <CardHeader title="Today's Attendance" description={new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
              {loading ? (
                <div className="skeleton h-24 rounded-xl" />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Present</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {stats?.present_today ?? 0}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
                      style={{ width: `${stats?.attendance_rate ?? 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{stats?.attendance_rate ?? 0}% attendance rate</span>
                    <span>{stats?.absent_today ?? 0} absent</span>
                  </div>
                  <Link href="/attendance"
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    View all attendance
                  </Link>
                </div>
              )}
            </Card>
          )}

          {/* Pending Approvals — HR/admin/manager */}
          {['admin', 'hr', 'manager'].includes(role) && (
            <Card>
              <CardHeader
                title="Pending Approvals"
                description="Requests awaiting your review"
                action={
                  <Link href="/attendance" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                    All <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />
              {loading ? (
                <div className="space-y-2">
                  {[1,2].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}
                </div>
              ) : pending.length === 0 ? (
                <div className="flex items-center gap-2 py-3 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  All caught up!
                </div>
              ) : (
                <div className="space-y-2">
                  {pending.slice(0, 5).map(p => (
                    <Link key={p.id} href="/attendance"
                      className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                      <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-600 dark:text-amber-400 flex-shrink-0">
                        <FileText className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {p.employee?.full_name ?? 'Someone'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{p.title}</p>
                      </div>
                      <Badge variant="warning" size="sm">Pending</Badge>
                    </Link>
                  ))}
                  {pending.length > 5 && (
                    <p className="text-xs text-slate-400 text-center pt-1">
                      +{pending.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Latest Payroll */}
          <Card>
            <CardHeader
              title="Latest Payroll"
              action={
                <Link href="/payroll" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                  Details <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="skeleton h-8 rounded" />)}
              </div>
            ) : stats?.latest_payroll ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500">Month</span>
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{stats.latest_payroll.month}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500">Gross Salary</span>
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {formatCurrency(stats.latest_payroll.total_gross)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500">Status</span>
                  <Badge
                    variant={
                      stats.latest_payroll.status === 'paid' ? 'success' :
                      stats.latest_payroll.status === 'locked' ? 'info' : 'warning'
                    }
                    size="sm"
                  >
                    {capitalize(stats.latest_payroll.status)}
                  </Badge>
                </div>
                <Link href="/payroll"
                  className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  View Payroll <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <EmptyState icon={<Banknote className="h-6 w-6" />}
                title="No payroll yet"
                description="Run your first payroll from the Payroll module"
              />
            )}
          </Card>

          {/* My Salary shortcut */}
          <Link href="/salary"
            className="block p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl text-white hover:from-blue-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 opacity-90" />
              <span className="text-sm font-semibold">My Salary & Payslips</span>
            </div>
            <p className="text-xs text-blue-200">View your CTC breakdown, payslips, and reimbursements</p>
            <div className="flex items-center gap-1 mt-3 text-xs font-medium text-blue-100">
              Open Salary <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
