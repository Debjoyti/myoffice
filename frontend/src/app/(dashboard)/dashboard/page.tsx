'use client'

import { useState, useEffect } from 'react'
import { StatCard, Card, CardHeader, Badge, Avatar, Button, EmptyState } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Users, Clock, Banknote, TrendingUp, ArrowRight,
  UserPlus, FileText, CheckCircle2, Wallet,
  CalendarDays, Building2, UserCheck, AlertCircle,
  IndianRupee, RefreshCw
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────────────────────── */
type DashStats = {
  total_employees: number
  active_employees: number
  departments: number
  pending_leaves: number
  present_today: number
  payroll_month: string | null
  last_payroll_gross: number | null
  unread_notifications: number
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

/* ── Quick links ─────────────────────────────────────────────────────────────── */
const QUICK_LINKS = [
  { name: 'HRMS',       href: '/hrms',       icon: Users,        accent: 'blue',    desc: 'Employees & org' },
  { name: 'Attendance', href: '/attendance', icon: Clock,        accent: 'emerald', desc: 'Time & leave' },
  { name: 'Payroll',    href: '/payroll',    icon: Banknote,     accent: 'amber',   desc: 'Monthly salary' },
  { name: 'Salary',     href: '/salary',     icon: Wallet,       accent: 'sky',     desc: 'Your payslip' },
  { name: 'My Home',    href: '/home',       icon: CheckCircle2, accent: 'violet',  desc: 'Check in / out' },
  { name: 'Settings',   href: '/settings',   icon: Building2,    accent: 'rose',    desc: 'Admin config' },
]

const ACCENT_STYLE: Record<string, { card: string; icon: string; text: string }> = {
  blue:    { card: 'hover:border-blue-200 hover:bg-blue-50/50',    icon: 'bg-blue-100 text-blue-600',    text: 'text-blue-700' },
  emerald: { card: 'hover:border-emerald-200 hover:bg-emerald-50/50', icon: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-700' },
  amber:   { card: 'hover:border-amber-200 hover:bg-amber-50/50',   icon: 'bg-amber-100 text-amber-600',   text: 'text-amber-700' },
  sky:     { card: 'hover:border-sky-200 hover:bg-sky-50/50',      icon: 'bg-sky-100 text-sky-600',      text: 'text-sky-700' },
  violet:  { card: 'hover:border-violet-200 hover:bg-violet-50/50', icon: 'bg-violet-100 text-violet-600', text: 'text-violet-700' },
  rose:    { card: 'hover:border-rose-200 hover:bg-rose-50/50',    icon: 'bg-rose-100 text-rose-600',    text: 'text-rose-700' },
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [stats,    setStats]    = useState<DashStats | null>(null)
  const [recent,   setRecent]   = useState<RecentEmployee[]>([])
  const [pending,  setPending]  = useState<PendingApproval[]>([])
  const [loading,  setLoading]  = useState(true)
  const [me,       setMe]       = useState<any>(null)
  const [isHR,     setIsHR]     = useState(false)

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      // Fetch everything in parallel
      const [meRes, empRes, attRes, payRes, notifRes] = await Promise.all([
        fetch('/api/v1/me'),
        fetch('/api/v1/employees?status=all&limit=5'),
        fetch('/api/v1/attendance/today'),
        fetch('/api/v1/payroll'),
        fetch('/api/v1/notifications'),
      ])

      const meData  = meRes.ok  ? await meRes.json()  : null
      const empData = empRes.ok ? await empRes.json()  : null
      const attData = attRes.ok ? await attRes.json()  : null
      const payData = payRes.ok ? await payRes.json()  : null
      const notifData = notifRes.ok ? await notifRes.json() : null

      if (meData?.employee) {
        setMe(meData.employee)
        setIsHR(['admin', 'hr'].includes(meData.employee.role))
      }

      // Fetch dept count
      const deptRes  = await fetch('/api/v1/departments')
      const deptData = deptRes.ok ? await deptRes.json() : null

      const employees = empData?.employees ?? []
      const payrolls  = payData?.payrolls  ?? []
      const latestPay = payrolls[0]

      // Recent hires (last 5 by join date)
      const sorted = [...employees].sort(
        (a, b) => new Date(b.date_of_joining).getTime() - new Date(a.date_of_joining).getTime()
      )
      setRecent(sorted.slice(0, 5))

      const unread = notifData?.unread_count ?? 0

      setStats({
        total_employees:      employees.length,
        active_employees:     employees.filter((e: any) => e.status === 'active').length,
        departments:          deptData?.departments?.length ?? 0,
        pending_leaves:       0,           // loaded below
        present_today:        attData?.session ? 1 : 0,
        payroll_month:        latestPay?.payroll_month ?? null,
        last_payroll_gross:   latestPay?.total_gross ?? null,
        unread_notifications: unread,
      })

      // Pending approvals for HR/managers
      if (meData?.employee && ['admin', 'hr', 'manager'].includes(meData.employee.role)) {
        const pendRes = await fetch('/api/v1/approvals?mode=pending_for_me')
        if (pendRes.ok) {
          const d = await pendRes.json()
          setPending(d.leave_requests ?? [])
          setStats(s => s ? { ...s, pending_leaves: d.leave_requests?.length ?? 0 } : s)
        }
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDashboard() }, [])

  const displayName = me?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Good {getGreeting()}, {displayName} 👋</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3 w-3" />} onClick={fetchDashboard}>
          Refresh
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={stats?.total_employees ?? '—'} accent="blue"
          icon={<Users className="h-4 w-4" />} loading={loading} />
        <StatCard label="Active Employees" value={stats?.active_employees ?? '—'} accent="emerald"
          icon={<UserCheck className="h-4 w-4" />} loading={loading} />
        <StatCard label="Departments" value={stats?.departments ?? '—'} accent="sky"
          icon={<Building2 className="h-4 w-4" />} loading={loading} />
        {isHR ? (
          <StatCard label="Pending Approvals" value={stats?.pending_leaves ?? '—'} accent="amber"
            icon={<AlertCircle className="h-4 w-4" />} loading={loading}
            onClick={() => window.location.href = '/attendance'} />
        ) : (
          <StatCard label="Last Payroll" value={stats?.last_payroll_gross ? formatCurrency(stats.last_payroll_gross) : '—'}
            accent="teal" icon={<IndianRupee className="h-4 w-4" />} loading={loading} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Quick Navigation */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader title="Quick Navigation" description="Jump to any module" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {QUICK_LINKS.map(link => {
                const a = ACCENT_STYLE[link.accent] ?? ACCENT_STYLE.blue
                return (
                  <Link key={link.href} href={link.href}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white',
                      'transition-all duration-150 group', a.card
                    )}
                  >
                    <div className={cn('p-2 rounded-lg flex-shrink-0 transition-colors', a.icon)}>
                      <link.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn('text-sm font-semibold truncate', a.text)}>{link.name}</p>
                      <p className="text-xs text-slate-400 truncate">{link.desc}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>

          {/* Recent Hires */}
          <Card>
            <CardHeader
              title="Recent Employees"
              description="Latest additions to the team"
              action={
                <Link href="/hrms" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
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
                  <div key={emp.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={emp.full_name} src={emp.avatar_url ?? undefined} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{emp.full_name}</p>
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
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Pending Approvals */}
          {isHR && (
            <Card>
              <CardHeader
                title="Pending Approvals"
                description="Leave requests awaiting review"
                action={
                  <Link href="/attendance" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
                    All <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />
              {loading ? (
                <div className="space-y-2">
                  {[1,2].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}
                </div>
              ) : pending.length === 0 ? (
                <div className="flex items-center gap-2 py-3 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  All caught up!
                </div>
              ) : (
                <div className="space-y-2">
                  {pending.slice(0, 5).map(p => (
                    <Link key={p.id} href="/attendance"
                      className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                      <div className="p-1.5 bg-amber-100 rounded text-amber-600 flex-shrink-0">
                        <FileText className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">
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
                <Link href="/payroll" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
                  Details <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="skeleton h-8 rounded" />)}
              </div>
            ) : stats?.payroll_month ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Month</span>
                  <span className="font-semibold text-sm text-slate-800">{stats.payroll_month}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-xs text-slate-500">Gross Salary</span>
                  <span className="font-semibold text-sm text-slate-800">
                    {stats.last_payroll_gross ? formatCurrency(stats.last_payroll_gross) : '—'}
                  </span>
                </div>
                <Link href="/payroll"
                  className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
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

          {/* My Salary */}
          <Link href="/salary"
            className="block p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md">
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
