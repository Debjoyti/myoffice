'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  SearchInput, TabBar, StatCard, EmptyState, Modal, Input, Select, Textarea,
  DetailGrid, Alert
} from '@/components/ui'
import { formatDate } from '@/lib/utils'
import {
  Clock, CheckCircle2, XCircle, AlertTriangle, UserCheck,
  Check, X, RefreshCw, Calendar, LogIn, LogOut, Timer, MapPin
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────────────────────── */
type TodaySession = {
  id: string
  date: string
  check_in_at: string | null
  check_out_at: string | null
  duration_minutes: number | null
  status: 'active' | 'completed' | null
}

type Session = {
  id: string
  date: string
  check_in_at: string | null
  check_out_at: string | null
  duration_minutes: number | null
  is_late: boolean
  employee_id: string
}

type LeaveRequest = {
  id: string
  type: string
  status: string
  title: string
  description: string | null
  from_date: string
  to_date: string
  days_count: number
  created_at: string
  employee?: { id: string; full_name: string; designation: string; department: string; avatar_url: string | null }
  approver?: { full_name: string; designation: string } | null
}

type LeaveBalance = {
  id: string; leave_type: string; total_days: number
  used_days: number; available_days: number
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function fmtTime(iso: string | null, tz?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    timeZone: tz,
  })
}

function fmtDuration(mins: number | null) {
  if (mins === null || mins === undefined) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

function getLiveDuration(checkInAt: string | null): string {
  if (!checkInAt) return '0h 00m'
  const diffMs = Date.now() - new Date(checkInAt).getTime()
  const totalMins = Math.floor(diffMs / 60_000)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  const s = Math.floor((diffMs % 60_000) / 1_000)
  return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
}

const LEAVE_TYPE_LABEL: Record<string, string> = {
  sick: 'Sick Leave', casual: 'Casual Leave', annual: 'Annual Leave',
  maternity: 'Maternity', paternity: 'Paternity', earned: 'Earned Leave',
  compensatory: 'Comp-off', wfh: 'Work From Home', unpaid: 'Unpaid Leave',
}

/* ── Today's Attendance Hero Card ───────────────────────────────────────────── */
function TodayAttendanceCard({
  session, onCheckIn, onCheckOut, loading, timezone,
}: {
  session: TodaySession | null
  onCheckIn: () => void
  onCheckOut: () => void
  loading: boolean
  timezone: string
}) {
  const [now, setNow] = useState(new Date())
  const [liveDuration, setLiveDuration] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setNow(new Date())
      if (session?.status === 'active' && session.check_in_at) {
        setLiveDuration(getLiveDuration(session.check_in_at))
      }
    }, 1_000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [session])

  useEffect(() => {
    if (session?.status === 'active' && session.check_in_at) {
      setLiveDuration(getLiveDuration(session.check_in_at))
    } else {
      setLiveDuration('')
    }
  }, [session])

  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: timezone,
  })
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: timezone,
  })
  const tzLabel = Intl.DateTimeFormat().resolvedOptions().timeZone

  const isCheckedIn  = session?.status === 'active'
  const isCheckedOut = session?.status === 'completed'
  const notStarted   = !session

  return (
    <Card>
      <div className="flex flex-col md:flex-row md:items-center gap-6 p-1">

        {/* Left — Live Clock */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium truncate">{tzLabel}</span>
          </div>
          <div className="font-mono text-4xl font-bold text-slate-900 tracking-tight tabular-nums leading-none">
            {timeStr}
          </div>
          <div className="text-sm text-slate-500 mt-1">{dateStr}</div>
        </div>

        {/* Middle — Status */}
        <div className="flex flex-col items-start md:items-center gap-1 md:min-w-[160px]">
          {isCheckedIn && (
            <>
              <Badge variant="success" dot size="sm">Checked In</Badge>
              <p className="text-xs text-slate-500 mt-0.5">
                Since {fmtTime(session!.check_in_at, timezone)}
              </p>
              <div className="flex items-center gap-1.5 mt-1 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5">
                <Timer className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-mono text-sm font-semibold text-emerald-700 tabular-nums">
                  {liveDuration || '…'}
                </span>
              </div>
            </>
          )}
          {isCheckedOut && (
            <>
              <Badge variant="neutral" dot size="sm">Day Complete</Badge>
              <p className="text-xs text-slate-500 mt-0.5">
                {fmtTime(session!.check_in_at, timezone)} → {fmtTime(session!.check_out_at, timezone)}
              </p>
              <div className="flex items-center gap-1.5 mt-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-mono text-sm font-semibold text-slate-700">
                  {fmtDuration(session!.duration_minutes)}
                </span>
              </div>
            </>
          )}
          {notStarted && (
            <>
              <Badge variant="warning" dot size="sm">Not Checked In</Badge>
              <p className="text-xs text-slate-400 mt-0.5">Click to start your day</p>
            </>
          )}
        </div>

        {/* Right — Action Button */}
        <div className="flex-shrink-0">
          {notStarted && (
            <Button
              size="lg"
              variant="primary"
              loading={loading}
              leftIcon={<LogIn className="h-4 w-4" />}
              onClick={onCheckIn}
              className="min-w-[140px]"
            >
              Check In
            </Button>
          )}
          {isCheckedIn && (
            <Button
              size="lg"
              variant="danger"
              loading={loading}
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={onCheckOut}
              className="min-w-[140px]"
            >
              Check Out
            </Button>
          )}
          {isCheckedOut && (
            <div className="flex flex-col items-center gap-1 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <span className="text-xs text-slate-500 font-medium">Attendance<br />Recorded</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

/* ── Apply Leave Modal ──────────────────────────────────────────────────────── */
function ApplyLeaveModal({ open, onClose, onSuccess }: {
  open: boolean; onClose: () => void; onSuccess: () => void
}) {
  const [form, setForm] = useState({
    type: 'casual', title: '', description: '', from_date: '', to_date: '', days_count: 1,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) { setErr(null); setForm({ type: 'casual', title: '', description: '', from_date: '', to_date: '', days_count: 1 }) }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.from_date) { setErr('Please select start date'); return }
    setSaving(true); setErr(null)
    try {
      const res = await fetch('/api/v1/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, to_date: form.to_date || form.from_date }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Failed to submit')
      onSuccess(); onClose()
    } catch (err: any) { setErr(err.message) }
    finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Apply for Leave" size="md"
      footer={<>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={e => handleSubmit(e as any)}>Submit Request</Button>
      </>}
    >
      {err && <div className="mb-4"><Alert variant="danger">{err}</Alert></div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Leave Type" value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          options={Object.entries(LEAVE_TYPE_LABEL).map(([v, l]) => ({ value: v, label: l }))}
        />
        <Input label="Subject" required value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="e.g. Sick leave — fever" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="From Date" type="date" required value={form.from_date}
            onChange={e => setForm(f => ({ ...f, from_date: e.target.value, to_date: f.to_date || e.target.value }))} />
          <Input label="To Date" type="date" value={form.to_date}
            min={form.from_date}
            onChange={e => setForm(f => ({ ...f, to_date: e.target.value }))} />
        </div>
        <Input label="Days" type="number" min="0.5" step="0.5" value={String(form.days_count)}
          onChange={e => setForm(f => ({ ...f, days_count: parseFloat(e.target.value) || 1 }))} />
        <Textarea label="Reason (optional)" value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Brief description…" rows={2} />
      </form>
    </Modal>
  )
}

/* ── Approval Action Modal ──────────────────────────────────────────────────── */
function ApprovalActionModal({ request, onClose, onDone }: {
  request: LeaveRequest | null; onClose: () => void; onDone: () => void
}) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState<string | null>(null)

  useEffect(() => { if (!request) { setReason(''); setErr(null) } }, [request])

  const act = async (action: 'approve' | 'reject') => {
    setSaving(true); setErr(null)
    try {
      const res = await fetch(`/api/v1/approvals/${request!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason, resource_type: 'leave' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Failed')
      onDone(); onClose()
    } catch (err: any) { setErr(err.message) }
    finally { setSaving(false) }
  }

  if (!request) return null
  return (
    <Modal open={!!request} onClose={onClose} title="Review Leave Request" size="md"
      footer={<>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="danger" size="sm" loading={saving} onClick={() => act('reject')}
          leftIcon={<X className="h-3.5 w-3.5" />}>Reject</Button>
        <Button variant="primary" size="sm" loading={saving} onClick={() => act('approve')}
          leftIcon={<Check className="h-3.5 w-3.5" />}>Approve</Button>
      </>}
    >
      {err && <div className="mb-4"><Alert variant="danger">{err}</Alert></div>}
      <div className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-lg">
          <DetailGrid cols={2} items={[
            { label: 'Employee',   value: request.employee?.full_name ?? '—' },
            { label: 'Leave Type', value: LEAVE_TYPE_LABEL[request.type] ?? request.type },
            { label: 'From',       value: formatDate(request.from_date) },
            { label: 'To',         value: formatDate(request.to_date) },
            { label: 'Days',       value: String(request.days_count) },
            { label: 'Applied On', value: formatDate(request.created_at) },
          ]} />
          {request.description && (
            <p className="mt-3 text-sm text-slate-600">"{request.description}"</p>
          )}
        </div>
        <Textarea label="Note (optional)" value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Add a note for the employee…" rows={2} />
      </div>
    </Modal>
  )
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function AttendancePage() {
  const [todaySession,  setTodaySession]  = useState<TodaySession | null>(null)
  const [sessions,      setSessions]      = useState<Session[]>([])
  const [myRequests,    setMyRequests]    = useState<LeaveRequest[]>([])
  const [pendingReqs,   setPendingReqs]   = useState<LeaveRequest[]>([])
  const [balances,      setBalances]      = useState<LeaveBalance[]>([])
  const [pageLoading,   setPageLoading]   = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg,     setActionMsg]     = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [tab,           setTab]           = useState('my_history')
  const [search,        setSearch]        = useState('')
  const [applyOpen,     setApplyOpen]     = useState(false)
  const [reviewing,     setReviewing]     = useState<LeaveRequest | null>(null)
  const [isHR,          setIsHR]          = useState(false)

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const fetchAll = useCallback(async () => {
    setPageLoading(true)
    try {
      const [todayRes, meRes, sessRes, myReqRes, balRes] = await Promise.all([
        fetch('/api/v1/attendance/today'),
        fetch('/api/v1/me'),
        fetch('/api/v1/attendance/history?limit=60'),
        fetch('/api/v1/approvals?limit=20'),
        fetch('/api/v1/leave/balance'),
      ])

      if (todayRes.ok) {
        const d = await todayRes.json()
        // Map check_in_at / check_out_at fields to session shape
        if (d.session) {
          setTodaySession({
            id:               d.session.id,
            date:             d.session.date,
            check_in_at:      d.session.check_in_at ?? null,
            check_out_at:     d.session.check_out_at ?? null,
            duration_minutes: d.session.duration_minutes ?? null,
            status:           d.session.status ?? null,
          })
        } else {
          setTodaySession(null)
        }
      }

      let meEmployee: { role: string } | null = null
      if (meRes.ok) {
        const d = await meRes.json()
        meEmployee = d.employee
        setIsHR(['admin', 'hr', 'manager'].includes(d.employee?.role))
      }
      if (sessRes.ok)  { const d = await sessRes.json();  setSessions(d.sessions ?? []) }
      if (myReqRes.ok) { const d = await myReqRes.json(); setMyRequests(d.approvals ?? []) }
      if (balRes.ok)   { const d = await balRes.json();   setBalances(d.balances ?? []) }

      if (meEmployee && ['admin', 'hr', 'manager'].includes(meEmployee.role)) {
        const pendRes = await fetch('/api/v1/approvals?mode=pending_for_me')
        if (pendRes.ok) {
          const d = await pendRes.json()
          setPendingReqs(d.leave_requests ?? [])
        }
      }
    } catch { /* silent */ }
    finally { setPageLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Dismiss action message after 4s
  useEffect(() => {
    if (!actionMsg) return
    const t = setTimeout(() => setActionMsg(null), 4_000)
    return () => clearTimeout(t)
  }, [actionMsg])

  const handleCheckIn = async () => {
    setActionLoading(true); setActionMsg(null)
    try {
      const res = await fetch('/api/v1/attendance/check-in', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Check-in failed')
      setActionMsg({ type: 'success', text: `Checked in at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezone })}` })
      await fetchAll()
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message })
    } finally { setActionLoading(false) }
  }

  const handleCheckOut = async () => {
    setActionLoading(true); setActionMsg(null)
    try {
      const res = await fetch('/api/v1/attendance/check-out', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Check-out failed')
      setActionMsg({ type: 'success', text: `Checked out at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezone })}` })
      await fetchAll()
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message })
    } finally { setActionLoading(false) }
  }

  // Stats
  const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone }) // YYYY-MM-DD in local tz
  const thisMonthSessions = sessions.filter(s => s.date?.startsWith(today.slice(0, 7)))
  const presentDays  = thisMonthSessions.filter(s => s.check_in_at).length
  const lateDays     = thisMonthSessions.filter(s => s.is_late).length
  const totalHours   = Math.round(
    thisMonthSessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) / 60 * 10
  ) / 10
  const pendingCount = myRequests.filter(r => r.status === 'pending').length

  const filteredSessions = useMemo(() =>
    sessions.filter(s => !search || s.date?.includes(search)),
    [sessions, search]
  )

  const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
    approved: 'success', pending: 'warning', rejected: 'danger', cancelled: 'neutral',
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Attendance"
        description="Mark your attendance, track time, and manage leave requests"
        actions={
          <Button leftIcon={<Calendar className="h-3.5 w-3.5" />} onClick={() => setApplyOpen(true)}>
            Apply Leave
          </Button>
        }
      />

      {/* Action feedback */}
      {actionMsg && (
        <Alert variant={actionMsg.type === 'success' ? 'success' : 'danger'}>
          {actionMsg.text}
        </Alert>
      )}

      {/* Today's Attendance — Hero */}
      <TodayAttendanceCard
        session={todaySession}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        loading={actionLoading}
        timezone={timezone}
      />

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Present This Month" value={presentDays} accent="emerald"
          icon={<UserCheck className="h-4 w-4" />} loading={pageLoading} />
        <StatCard label="Hours Worked" value={`${totalHours}h`} accent="blue"
          icon={<Clock className="h-4 w-4" />} loading={pageLoading} />
        <StatCard label="Late Arrivals" value={lateDays} accent="amber"
          icon={<AlertTriangle className="h-4 w-4" />} loading={pageLoading} />
        <StatCard label="Pending Leaves" value={pendingCount} accent="violet"
          icon={<Calendar className="h-4 w-4" />} loading={pageLoading} />
      </div>

      {/* Leave Balances */}
      {balances.length > 0 && (
        <Card>
          <CardHeader title="Leave Balances" description="Current year" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {balances.map(b => (
              <div key={b.id} className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-xs text-slate-500 mb-1 truncate">{LEAVE_TYPE_LABEL[b.leave_type] ?? b.leave_type}</p>
                <p className="text-xl font-bold text-slate-900">{b.available_days}</p>
                <p className="text-[10px] text-slate-400">{b.used_days}/{b.total_days} used</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* History / Leave tabs */}
      <Card padding="none">
        <TabBar
          className="px-4"
          tabs={[
            { id: 'my_history', label: 'Attendance History' },
            { id: 'my_leaves',  label: 'My Leave Requests', count: myRequests.length },
            ...(isHR ? [{ id: 'approvals', label: 'Pending Approvals', count: pendingReqs.length }] : []),
          ]}
          active={tab} onChange={setTab}
        />

        {/* Attendance History */}
        {tab === 'my_history' && (
          <div>
            <div className="flex items-center gap-3 p-4 border-b border-slate-100">
              <SearchInput placeholder="Filter by month (YYYY-MM)…" value={search} onChange={setSearch} className="w-56" />
              <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3 w-3" />} onClick={fetchAll}>
                Refresh
              </Button>
            </div>
            {pageLoading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading attendance…</div>
            ) : filteredSessions.length === 0 ? (
              <EmptyState icon={<Clock className="h-8 w-8" />} title="No attendance records"
                description="Your check-in history will appear here" />
            ) : (
              <Table>
                <Thead><tr>
                  <Th>Date</Th>
                  <Th>Check In</Th>
                  <Th>Check Out</Th>
                  <Th>Duration</Th>
                  <Th>Status</Th>
                </tr></Thead>
                <Tbody>
                  {filteredSessions.map(s => {
                    const isToday = s.date === today
                    const status  = !s.check_in_at ? 'Absent' : s.is_late ? 'Late' : 'Present'
                    return (
                      <Tr key={s.id}>
                        <Td>
                          <span className={isToday ? 'font-semibold text-blue-600' : ''}>
                            {formatDate(s.date)}
                            {isToday && (
                              <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                                Today
                              </span>
                            )}
                          </span>
                        </Td>
                        <Td>{fmtTime(s.check_in_at, timezone)}</Td>
                        <Td>{fmtTime(s.check_out_at, timezone)}</Td>
                        <Td><span className="font-mono text-sm">{fmtDuration(s.duration_minutes)}</span></Td>
                        <Td>
                          <Badge
                            variant={status === 'Present' ? 'success' : status === 'Late' ? 'warning' : 'danger'}
                            dot size="sm"
                          >
                            {status}
                          </Badge>
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            )}
          </div>
        )}

        {/* My Leave Requests */}
        {tab === 'my_leaves' && (
          <div>
            {pageLoading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading leave requests…</div>
            ) : myRequests.length === 0 ? (
              <EmptyState icon={<Calendar className="h-8 w-8" />} title="No leave requests"
                description="You haven't applied for any leave yet"
                action={<Button size="sm" onClick={() => setApplyOpen(true)}>Apply for Leave</Button>}
              />
            ) : (
              <Table>
                <Thead><tr>
                  <Th>Type</Th>
                  <Th>Subject</Th>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th>Days</Th>
                  <Th>Status</Th>
                  <Th>Approver</Th>
                </tr></Thead>
                <Tbody>
                  {myRequests.map(r => (
                    <Tr key={r.id}>
                      <Td><Badge variant="neutral" size="sm">{LEAVE_TYPE_LABEL[r.type] ?? r.type}</Badge></Td>
                      <Td><span className="font-medium text-slate-800">{r.title}</span></Td>
                      <Td>{formatDate(r.from_date)}</Td>
                      <Td>{formatDate(r.to_date)}</Td>
                      <Td><span className="font-semibold">{r.days_count}</span></Td>
                      <Td>
                        <Badge variant={STATUS_VARIANT[r.status] ?? 'neutral'} dot size="sm">
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </Badge>
                      </Td>
                      <Td><span className="text-sm text-slate-500">{r.approver?.full_name ?? '—'}</span></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </div>
        )}

        {/* Pending Approvals (HR / Manager) */}
        {tab === 'approvals' && isHR && (
          <div>
            {pageLoading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading pending approvals…</div>
            ) : pendingReqs.length === 0 ? (
              <EmptyState icon={<CheckCircle2 className="h-8 w-8" />}
                title="All caught up!" description="No pending leave requests to review" />
            ) : (
              <Table>
                <Thead><tr>
                  <Th>Employee</Th>
                  <Th>Type</Th>
                  <Th>Subject</Th>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th>Days</Th>
                  <Th>Applied</Th>
                  <Th align="center">Action</Th>
                </tr></Thead>
                <Tbody>
                  {pendingReqs.map(r => (
                    <Tr key={r.id}>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Avatar name={r.employee?.full_name ?? '?'} size="sm"
                            src={r.employee?.avatar_url ?? undefined} />
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{r.employee?.full_name ?? '—'}</p>
                            <p className="text-xs text-slate-400">{r.employee?.designation}</p>
                          </div>
                        </div>
                      </Td>
                      <Td><Badge variant="neutral" size="sm">{LEAVE_TYPE_LABEL[r.type] ?? r.type}</Badge></Td>
                      <Td><span className="text-sm font-medium text-slate-700">{r.title}</span></Td>
                      <Td>{formatDate(r.from_date)}</Td>
                      <Td>{formatDate(r.to_date)}</Td>
                      <Td><span className="font-semibold">{r.days_count}</span></Td>
                      <Td><span className="text-xs text-slate-400">{formatDate(r.created_at)}</span></Td>
                      <Td align="center">
                        <Button size="sm" variant="outline" onClick={() => setReviewing(r)}>
                          Review
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </div>
        )}
      </Card>

      {/* Modals */}
      <ApplyLeaveModal open={applyOpen} onClose={() => setApplyOpen(false)} onSuccess={fetchAll} />
      <ApprovalActionModal request={reviewing} onClose={() => setReviewing(null)} onDone={fetchAll} />
    </div>
  )
}
