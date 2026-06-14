'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui'
import Link from 'next/link'
import {
  Clock, CheckCircle2, LogIn, LogOut, Calendar, Bell,
  BriefcaseIcon, AlertTriangle,
  Coffee, Sun, Sunset, Moon,
  FileText, Plane, Home, Receipt, TrendingUp, PartyPopper,
  RefreshCw, LayoutDashboard, ArrowRight, X,
  Banknote, BarChart3
} from 'lucide-react'

// ── Admin / HR / Accountant shortcut banner ───────────────────────────────────
type RoleBannerProps = { role: string; pendingApprovals?: number }
function RoleBanner({ role, pendingApprovals = 0 }: RoleBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  if (role === 'admin' || role === 'hr') {
    return (
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl text-white shadow-lg shadow-indigo-900/20">
        <LayoutDashboard className="h-4.5 w-4.5 flex-shrink-0 opacity-90" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {role === 'admin' ? 'Admin Dashboard' : 'HR Dashboard'}
          </p>
          <p className="text-xs text-indigo-200 mt-0.5">
            {pendingApprovals > 0
              ? `${pendingApprovals} pending approval${pendingApprovals > 1 ? 's' : ''} waiting`
              : 'Company-wide view, payroll & analytics'
            }
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {pendingApprovals > 0 && (
            <span className="h-5 w-5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold flex items-center justify-center">
              {pendingApprovals}
            </span>
          )}
          <Link href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
            Open Dashboard <ArrowRight className="h-3 w-3" />
          </Link>
          <button onClick={() => setDismissed(true)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  if (role === 'accountant') {
    return (
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl text-white shadow-lg shadow-teal-900/20">
        <Banknote className="h-4.5 w-4.5 flex-shrink-0 opacity-90" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Finance & Payroll</p>
          <p className="text-xs text-teal-200 mt-0.5">Accounts receivable, payroll runs, and compliance</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/finance"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
            Finance <ArrowRight className="h-3 w-3" />
          </Link>
          <Link href="/payroll"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
            Payroll
          </Link>
          <button onClick={() => setDismissed(true)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  if (role === 'manager') {
    return (
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gradient-to-r from-sky-600 to-blue-600 rounded-2xl text-white shadow-lg shadow-blue-900/20">
        <BarChart3 className="h-4.5 w-4.5 flex-shrink-0 opacity-90" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Manager Dashboard</p>
          <p className="text-xs text-sky-200 mt-0.5">Team overview, approvals & project tracker</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
            Open Dashboard <ArrowRight className="h-3 w-3" />
          </Link>
          <button onClick={() => setDismissed(true)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return null
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Employee = {
  id: string; employee_code: string; full_name: string; email: string
  designation: string; department: string; avatar_url: string | null
  date_of_joining: string; employment_type: string; status: string
}
type AttendanceSession = {
  id: string; date: string; check_in_at: string
  check_out_at: string | null; status: string; duration_minutes: number | null
}
type TeamMember = {
  id: string; full_name: string; designation: string
  avatar_url: string | null; attendance_status: 'checked_in' | 'checked_out' | 'not_checked_in'
}
type ScheduleDay = {
  date: string; isToday: boolean; dayStatus: string
  schedule: { shift_start: string; shift_end: string; is_working_day: boolean } | null
  session: { check_in_at: string; check_out_at: string | null; duration_minutes: number | null } | null
  holiday: { name: string; type: string } | null
}
type Holiday = { id: string; name: string; date: string; type: string }
type Approval = {
  id: string; type: string; status: string; title: string
  from_date: string | null; to_date: string | null; days_count: number | null
  created_at: string; approver: { full_name: string; designation: string } | null
}
type Notification = {
  id: string; title: string; message: string | null
  type: string; is_read: boolean; created_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Good morning', Icon: Sun }
  if (h < 17) return { text: 'Good afternoon', Icon: Coffee }
  if (h < 20) return { text: 'Good evening', Icon: Sunset }
  return { text: 'Good night', Icon: Moon }
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })
}
function fmtDuration(minutes: number) {
  const h = Math.floor(minutes / 60), m = minutes % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}
function liveDuration(checkInAt: string) {
  const mins = Math.floor((Date.now() - new Date(checkInAt).getTime()) / 60_000)
  return fmtDuration(mins)
}
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}
const AVATAR_COLORS = [
  'from-indigo-500 to-violet-600', 'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600', 'from-rose-500 to-pink-600',
  'from-sky-500 to-blue-600', 'from-purple-500 to-fuchsia-600',
]
function avatarGradient(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

const TYPE_CONFIG: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  leave:    { label: 'Leave',      Icon: Plane,       color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300' },
  wfh:      { label: 'WFH',        Icon: Home,        color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300' },
  expense:  { label: 'Expense',    Icon: Receipt,     color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300' },
  overtime: { label: 'Overtime',   Icon: TrendingUp,  color: 'text-sky-600 bg-sky-50 dark:bg-sky-900/30 dark:text-sky-300' },
  comp_off: { label: 'Comp-off',   Icon: Coffee,      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300' },
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function EmployeeHome() {
  const [activeTab, setActiveTab] = useState<'today' | 'schedule' | 'leave' | 'approvals' | 'files'>('today')
  const [employee, setEmployee]   = useState<Employee | null>(null)
  const [manager, setManager]     = useState<any>(null)
  const [session, setSession]     = useState<AttendanceSession | null>(null)
  const [team, setTeam]           = useState<TeamMember[]>([])
  const [week, setWeek]           = useState<ScheduleDay[]>([])
  const [holidays, setHolidays]   = useState<Holiday[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [notifs, setNotifs]       = useState<Notification[]>([])
  const [unread, setUnread]       = useState(0)
  const [ticker, setTicker]       = useState(0)       // increments every second for live timer
  const [checkLoading, setCheckLoading] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [myRole, setMyRole]       = useState<string>('employee')
  const [adminPending, setAdminPending] = useState(0)

  // ── Live 1-second ticker ────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setTicker(n => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [meRes, todayRes, teamRes, schedRes, holidayRes, approvRes, notifRes] = await Promise.all([
        fetch('/api/v1/me'),
        fetch('/api/v1/attendance/today'),
        fetch('/api/v1/team'),
        fetch('/api/v1/schedule'),
        fetch('/api/v1/holidays'),
        fetch('/api/v1/approvals'),
        fetch('/api/v1/notifications'),
      ])

      if (meRes.status === 404) {
        setError('Your employee record is not set up yet. Please contact HR.')
        setLoading(false)
        return
      }

      const [me, tod, tm, sched, hol, appr, notif] = await Promise.all([
        meRes.json(), todayRes.json(), teamRes.json(),
        schedRes.json(), holidayRes.json(), approvRes.json(), notifRes.json(),
      ])

      setEmployee(me.employee)
      setManager(me.manager)
      setSession(tod.session)
      setTeam(tm.team ?? [])
      setWeek(sched.week ?? [])
      setHolidays(hol.holidays ?? [])
      setApprovals(appr.approvals ?? [])
      setNotifs(notif.notifications ?? [])
      setUnread(notif.unread_count ?? 0)

      // For admin/hr/manager: also fetch pending approvals count for the banner
      const role: string = me.employee?.role ?? 'employee'
      setMyRole(role)
      if (['admin', 'hr', 'manager'].includes(role)) {
        const pendRes = await fetch('/api/v1/approvals?mode=pending_for_me')
        if (pendRes.ok) {
          const pendData = await pendRes.json()
          setAdminPending(pendData.leave_requests?.length ?? 0)
        }
      }
    } catch {
      setError('Failed to load dashboard. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Refresh every 60s ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(fetchAll, 60_000)
    return () => clearInterval(t)
  }, [fetchAll])

  // ── Check-in / Check-out ────────────────────────────────────────────────────
  async function handleCheckIn() {
    setCheckLoading(true)
    const res = await fetch('/api/v1/attendance/check-in', { method: 'POST' })
    const json = await res.json()
    if (res.ok) setSession(json.session)
    setCheckLoading(false)
  }
  async function handleCheckOut() {
    setCheckLoading(true)
    const res = await fetch('/api/v1/attendance/check-out', { method: 'POST' })
    const json = await res.json()
    if (res.ok) setSession(json.session)
    setCheckLoading(false)
  }

  // ── Mark all notifs read ────────────────────────────────────────────────────
  async function markAllRead() {
    await fetch('/api/v1/notifications', { method: 'PATCH' })
    setNotifs(n => n.map(x => ({ ...x, is_read: true })))
    setUnread(0)
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const { text: greetText, Icon: GreetIcon } = getGreeting()
  const isCheckedIn  = session?.status === 'active'
  const isCheckedOut = session?.status === 'completed'
  const pendingApprovals = approvals.filter(a => a.status === 'pending')
  const todaySchedule = week.find(d => d.isToday)
  const todayHoliday  = todaySchedule?.holiday ?? null

  // ── Loading / Error ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400">Loading your workspace…</p>
      </div>
    </div>
  )
  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
      </div>
    </div>
  )
  if (!employee) return null

  const TABS = [
    { id: 'today',    label: 'Today' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'leave',    label: 'Leave' },
    { id: 'approvals',label: 'Approvals', count: pendingApprovals.length },
    { id: 'files',    label: 'Files' },
  ]

  // ── Shift info from today's schedule ───────────────────────────────────────
  const shiftStart = todaySchedule?.schedule?.shift_start
  const shiftEnd   = todaySchedule?.schedule?.shift_end
  const shiftLabel = shiftStart && shiftEnd
    ? `${shiftStart.slice(0,5)} – ${shiftEnd.slice(0,5)}`
    : 'No shift today'

  // ── Check-in status logic ─────────────────────────────────────────────────
  let checkInStatus: 'not_started' | 'working' | 'done' = 'not_started'
  if (isCheckedIn)  checkInStatus = 'working'
  if (isCheckedOut) checkInStatus = 'done'

  // ── Late check-in ─────────────────────────────────────────────────────────
  const isLate = shiftStart && !isCheckedIn && !isCheckedOut && (() => {
    const [h, m] = shiftStart.split(':').map(Number)
    const shiftTime = new Date(); shiftTime.setHours(h, m, 0, 0)
    return today > shiftTime
  })()

  return (
    <div className="space-y-4 animate-fadeIn">

      {/* ── Role banner (admin / hr / accountant / manager only) ───────────── */}
      {myRole !== 'employee' && (
        <RoleBanner role={myRole} pendingApprovals={adminPending} />
      )}

      {/* ── Greeting strip ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <GreetIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {greetText}, {employee.full_name.split(' ')[0]}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{dateStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {todayHoliday && (
            <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-700">
              <PartyPopper className="h-3.5 w-3.5" />
              Holiday: {todayHoliday.name}
            </span>
          )}
          {isLate && (
            <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 rounded-full border border-red-200 dark:border-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              You're running late
            </span>
          )}
          <button onClick={fetchAll} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Tab Bar ────────────────────────────────────────────────────────── */}
      <div className="flex gap-0.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            )}
          >
            {tab.label}
            {tab.count ? (
              <span className={cn(
                'h-4.5 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center',
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              )}>{tab.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════ TODAY TAB ════════════════════════ */}
      {activeTab === 'today' && (
        <div className="space-y-4">

          {/* ── Row 1: Profile | Check-in | Manager+Team ─────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Employee Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3.5">
                <div className={cn(
                  'h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-lg',
                  avatarGradient(employee.full_name)
                )}>
                  {employee.avatar_url
                    ? <img src={employee.avatar_url} alt={employee.full_name} className="h-14 w-14 rounded-2xl object-cover" />
                    : initials(employee.full_name)
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{employee.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{employee.designation}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{employee.employee_code} · {employee.department}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Status</span>
                  <span className={cn(
                    'flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full',
                    checkInStatus === 'working'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : checkInStatus === 'done'
                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full',
                      checkInStatus === 'working' ? 'bg-emerald-500 animate-pulse' :
                      checkInStatus === 'done' ? 'bg-slate-400' : 'bg-amber-500'
                    )} />
                    {checkInStatus === 'working' ? 'Working' : checkInStatus === 'done' ? 'Signed off' : 'Not checked in'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Joined</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {new Date(employee.date_of_joining).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Type</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                    {employee.employment_type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Check-in / Check-out Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Today's Attendance</p>
                <Clock className="h-4 w-4 text-slate-400" />
              </div>

              {/* Shift */}
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <BriefcaseIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-500">Shift</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-auto">{shiftLabel}</span>
              </div>

              {/* Live timer */}
              {checkInStatus !== 'not_started' && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 tabular-nums tracking-tight">
                    {checkInStatus === 'working' && session
                      ? liveDuration(session.check_in_at)
                      : session?.duration_minutes ? fmtDuration(session.duration_minutes) : '—'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {checkInStatus === 'working' ? 'working hours' : 'total today'}
                  </p>
                </div>
              )}

              {/* Times row */}
              {session && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Check-in</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{fmtTime(session.check_in_at)}</p>
                  </div>
                  <div className={cn('px-3 py-2 rounded-xl', session.check_out_at ? 'bg-slate-50 dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50')}>
                    <p className="text-[10px] text-slate-400 font-medium">Check-out</p>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                      {session.check_out_at ? fmtTime(session.check_out_at) : '—'}
                    </p>
                  </div>
                </div>
              )}

              {/* Big action button */}
              {checkInStatus === 'not_started' && (
                <button
                  onClick={handleCheckIn}
                  disabled={checkLoading || !!todayHoliday || todaySchedule?.schedule?.is_working_day === false}
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkLoading
                    ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    : <LogIn className="h-4.5 w-4.5" />
                  }
                  {todayHoliday ? 'Holiday today' : checkLoading ? 'Checking in…' : 'Check In'}
                </button>
              )}
              {checkInStatus === 'working' && (
                <button
                  onClick={handleCheckOut}
                  disabled={checkLoading}
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-bold text-sm shadow-lg transition-all disabled:opacity-50"
                >
                  {checkLoading
                    ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    : <LogOut className="h-4.5 w-4.5" />
                  }
                  {checkLoading ? 'Checking out…' : 'Check Out'}
                </button>
              )}
              {checkInStatus === 'done' && (
                <div className="flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Day complete
                </div>
              )}
            </div>

            {/* Manager + Team Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4">
              {/* Manager */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Reporting Manager</p>
                {manager ? (
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-9 w-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                      avatarGradient(manager.full_name)
                    )}>
                      {initials(manager.full_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{manager.full_name}</p>
                      <p className="text-xs text-slate-400 truncate">{manager.designation}</p>
                    </div>
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full flex-shrink-0">
                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                      Available
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No manager assigned</p>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                  Team · {team.length} members
                </p>
                {team.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No team data</p>
                ) : (
                  <div className="space-y-2">
                    {team.slice(0, 5).map(m => (
                      <div key={m.id} className="flex items-center gap-2.5">
                        <div className="relative flex-shrink-0">
                          <div className={cn(
                            'h-7 w-7 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold',
                            avatarGradient(m.full_name)
                          )}>
                            {initials(m.full_name)}
                          </div>
                          <span className={cn(
                            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900',
                            m.attendance_status === 'checked_in' ? 'bg-emerald-500' :
                            m.attendance_status === 'checked_out' ? 'bg-slate-400' : 'bg-amber-400'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{m.full_name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{m.designation}</p>
                        </div>
                        <span className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0',
                          m.attendance_status === 'checked_in' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                          m.attendance_status === 'checked_out' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        )}>
                          {m.attendance_status === 'checked_in' ? 'IN' :
                           m.attendance_status === 'checked_out' ? 'OUT' : 'AWAY'}
                        </span>
                      </div>
                    ))}
                    {team.length > 5 && (
                      <p className="text-[10px] text-slate-400 text-center pt-1">+{team.length - 5} more</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Row 2: Notifications | Approvals | Holidays ──────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Notifications */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
                  {unread > 0 && (
                    <span className="h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </div>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-0.5 flex-1">
                {notifs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 italic">No notifications</p>
                ) : (
                  notifs.slice(0, 5).map(n => (
                    <div key={n.id} className={cn(
                      'flex gap-2.5 px-2.5 py-2 rounded-lg transition-colors',
                      !n.is_read ? 'bg-indigo-50 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}>
                      <span className={cn(
                        'mt-0.5 h-1.5 w-1.5 rounded-full flex-shrink-0',
                        !n.is_read ? 'bg-indigo-500' : 'bg-transparent'
                      )} />
                      <div className="min-w-0">
                        <p className={cn('text-xs leading-snug truncate', !n.is_read ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400')}>
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{n.message}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Approvals</p>
                {pendingApprovals.length > 0 && (
                  <span className="h-5 min-w-5 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingApprovals.length}
                  </span>
                )}
              </div>

              <div className="space-y-2 flex-1">
                {approvals.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 italic">No requests found</p>
                ) : (
                  approvals.slice(0, 4).map(a => {
                    const cfg = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.leave
                    return (
                      <div key={a.id} className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <span className={cn('p-1.5 rounded-lg flex-shrink-0', cfg.color)}>
                          <cfg.Icon className="h-3 w-3" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{a.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {a.from_date ? fmtDate(a.from_date) : ''}
                            {a.days_count && a.days_count > 1 ? ` · ${a.days_count}d` : ''}
                          </p>
                        </div>
                        <Badge
                          variant={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {a.status}
                        </Badge>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Upcoming Holidays */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Upcoming Holidays</p>
              </div>

              <div className="space-y-2">
                {holidays.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6 italic">No upcoming holidays</p>
                ) : (
                  holidays.slice(0, 5).map(h => {
                    const d = new Date(h.date + 'T00:00:00')
                    const daysAway = Math.ceil((d.getTime() - Date.now()) / 86_400_000)
                    return (
                      <div key={h.id} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                            {d.toLocaleDateString('en-IN', { month: 'short' })}
                          </span>
                          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 leading-none">
                            {d.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{h.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`}
                            {h.type === 'company' ? ' · Company' : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ SCHEDULE TAB ════════════════════════ */}
      {activeTab === 'schedule' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">This Week</p>
          {week.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-8">No schedule data available.</p>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {week.map(day => {
                const d = new Date(day.date + 'T00:00:00')
                const status = day.dayStatus
                return (
                  <div key={day.date} className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors',
                    day.isToday
                      ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
                  )}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                    <span className={cn('text-base font-bold', day.isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300')}>
                      {d.getDate()}
                    </span>
                    <div className="flex flex-col items-center gap-1">
                      {status === 'holiday' && (
                        <>
                          <PartyPopper className="h-4 w-4 text-emerald-500" />
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium text-center leading-tight">{day.holiday?.name}</span>
                        </>
                      )}
                      {status === 'weekend' && <span className="text-[10px] text-slate-400">Off</span>}
                      {status === 'checked_in' && <><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">IN</span></>}
                      {status === 'checked_out' && <><CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" /><span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold">{day.session?.duration_minutes ? fmtDuration(day.session.duration_minutes) : 'Done'}</span></>}
                      {status === 'absent' && <><span className="h-2 w-2 rounded-full bg-red-400" /><span className="text-[9px] text-red-500 font-bold">Absent</span></>}
                      {(status === 'today' || status === 'upcoming') && day.schedule?.is_working_day && (
                        <span className="text-[9px] text-slate-400 text-center leading-tight">{day.schedule.shift_start.slice(0,5)}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════ LEAVE TAB ═════════════════════════ */}
      {activeTab === 'leave' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Leave Requests</p>
            <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
              + Apply Leave
            </button>
          </div>
          {approvals.filter(a => a.type === 'leave' || a.type === 'wfh' || a.type === 'comp_off').length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-8">No leave requests found.</p>
          ) : (
            <div className="space-y-2">
              {approvals
                .filter(a => ['leave','wfh','comp_off'].includes(a.type))
                .map(a => {
                  const cfg = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.leave
                  return (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <span className={cn('p-2 rounded-lg flex-shrink-0', cfg.color)}>
                        <cfg.Icon className="h-4 w-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{a.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {a.from_date ? fmtDate(a.from_date) : ''}
                          {a.to_date && a.to_date !== a.from_date ? ` – ${fmtDate(a.to_date)}` : ''}
                          {a.days_count ? ` · ${a.days_count} day${a.days_count > 1 ? 's' : ''}` : ''}
                        </p>
                      </div>
                      <Badge variant={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}>
                        {a.status}
                      </Badge>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════ APPROVALS TAB ═══════════════════════ */}
      {activeTab === 'approvals' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
            All Requests · {approvals.length} total
          </p>
          {approvals.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-8">No requests found.</p>
          ) : (
            <div className="space-y-2">
              {approvals.map(a => {
                const cfg = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.leave
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className={cn('p-2 rounded-lg flex-shrink-0', cfg.color)}>
                      <cfg.Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{a.title}</p>
                        <Badge variant="neutral" size="sm">{cfg.label}</Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {a.from_date ? fmtDate(a.from_date) : ''}
                        {a.days_count ? ` · ${a.days_count}d` : ''}
                        {a.approver ? ` · Approver: ${a.approver.full_name}` : ''}
                      </p>
                    </div>
                    <Badge variant={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}>
                      {a.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════ FILES TAB ═════════════════════════ */}
      {activeTab === 'files' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center justify-center gap-3 py-16">
          <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Files module coming soon</p>
          <p className="text-xs text-slate-400">Payslips, offer letters, and documents will appear here.</p>
        </div>
      )}
    </div>
  )
}
