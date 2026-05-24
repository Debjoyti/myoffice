'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  SearchInput, TabBar, StatCard, EmptyState, Modal, Input, Select, Textarea,
  DetailGrid, Alert, PageLoader
} from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Clock, CheckCircle2, XCircle, AlertTriangle, UserCheck, Check, X, RefreshCw, Calendar, Users } from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────────────────────── */
type Session = {
  id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
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

type MyProfile = { id: string; full_name: string; role: string }

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function fmtTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function fmtDuration(mins: number | null) {
  if (!mins) return '—'
  const h = Math.floor(mins / 60), m = mins % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

const LEAVE_TYPE_LABEL: Record<string, string> = {
  sick: 'Sick Leave', casual: 'Casual Leave', annual: 'Annual Leave',
  maternity: 'Maternity', paternity: 'Paternity', earned: 'Earned Leave',
  compensatory: 'Comp-off', wfh: 'Work From Home', unpaid: 'Unpaid Leave',
}

/* ── Leave Request Modal ────────────────────────────────────────────────────── */
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

/* ── Approve / Reject Modal ─────────────────────────────────────────────────── */
function ApprovalActionModal({ request, onClose, onDone }: {
  request: LeaveRequest | null; onClose: () => void; onDone: () => void
}) {
  const [reason, setReason]   = useState('')
  const [saving, setSaving]   = useState(false)
  const [err,    setErr]      = useState<string | null>(null)

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
            { label: 'Employee', value: request.employee?.full_name ?? '—' },
            { label: 'Leave Type', value: LEAVE_TYPE_LABEL[request.type] ?? request.type },
            { label: 'From', value: formatDate(request.from_date) },
            { label: 'To',   value: formatDate(request.to_date) },
            { label: 'Days', value: String(request.days_count) },
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
  const [me,          setMe]          = useState<MyProfile | null>(null)
  const [sessions,    setSessions]    = useState<Session[]>([])
  const [myRequests,  setMyRequests]  = useState<LeaveRequest[]>([])
  const [pendingReqs, setPendingReqs] = useState<LeaveRequest[]>([])
  const [balances,    setBalances]    = useState<LeaveBalance[]>([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('my_history')
  const [search,      setSearch]      = useState('')
  const [applyOpen,   setApplyOpen]   = useState(false)
  const [reviewing,   setReviewing]   = useState<LeaveRequest | null>(null)
  const [isHR,        setIsHR]        = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [meRes, sessRes, myReqRes, balRes] = await Promise.all([
        fetch('/api/v1/me'),
        fetch('/api/v1/attendance/history?limit=60'),
        fetch('/api/v1/approvals?limit=20'),
        fetch('/api/v1/leave/balance'),
      ])

      if (meRes.ok) {
        const d = await meRes.json()
        setMe(d.employee)
        setIsHR(['admin', 'hr', 'manager'].includes(d.employee?.role))
      }
      if (sessRes.ok)  { const d = await sessRes.json();  setSessions(d.sessions ?? []) }
      if (myReqRes.ok) { const d = await myReqRes.json(); setMyRequests(d.approvals ?? []) }
      if (balRes.ok)   { const d = await balRes.json();   setBalances(d.balances ?? []) }

      // Fetch pending approvals if manager/HR
      const meData = meRes.ok ? await meRes.clone().json().catch(() => null) : null
      if (meData && ['admin', 'hr', 'manager'].includes(meData?.employee?.role)) {
        const pendRes = await fetch('/api/v1/approvals?mode=pending_for_me')
        if (pendRes.ok) {
          const d = await pendRes.json()
          setPendingReqs(d.leave_requests ?? [])
        }
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Derived stats
  const today = new Date().toISOString().split('T')[0]
  const thisMonthSessions = sessions.filter(s => s.date.startsWith(today.slice(0, 7)))
  const presentDays = thisMonthSessions.filter(s => s.check_in_time).length
  const lateDays    = thisMonthSessions.filter(s => s.is_late).length
  const totalHours  = Math.round(
    thisMonthSessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0) / 60 * 10
  ) / 10
  const pendingCount = myRequests.filter(r => r.status === 'pending').length

  const filteredSessions = useMemo(() =>
    sessions.filter(s => !search || s.date.includes(search)),
    [sessions, search]
  )

  const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
    approved: 'success', pending: 'warning', rejected: 'danger', cancelled: 'neutral',
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Attendance"
        description="Track your attendance, apply for leave, and manage time-off requests"
        actions={
          <Button leftIcon={<Calendar className="h-3.5 w-3.5" />} onClick={() => setApplyOpen(true)}>
            Apply Leave
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Present This Month" value={presentDays} accent="emerald"
          icon={<UserCheck className="h-4 w-4" />} loading={loading} />
        <StatCard label="Hours Worked" value={`${totalHours}h`} accent="blue"
          icon={<Clock className="h-4 w-4" />} loading={loading} />
        <StatCard label="Late Arrivals" value={lateDays} accent="amber"
          icon={<AlertTriangle className="h-4 w-4" />} loading={loading} />
        <StatCard label="Pending Leaves" value={pendingCount} accent="violet"
          icon={<Calendar className="h-4 w-4" />} loading={loading} />
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

      {/* Tabs */}
      <Card padding="none">
        <TabBar
          className="px-4"
          tabs={[
            { id: 'my_history', label: 'My Attendance History' },
            { id: 'my_leaves',  label: 'My Leave Requests', count: myRequests.length },
            ...(isHR ? [{ id: 'approvals', label: 'Pending Approvals', count: pendingReqs.length }] : []),
          ]}
          active={tab} onChange={setTab}
        />

        {/* My Attendance History */}
        {tab === 'my_history' && (
          <div>
            <div className="flex items-center gap-3 p-4 border-b border-slate-100">
              <SearchInput placeholder="Filter by date (YYYY-MM)…" value={search} onChange={setSearch} className="w-56" />
              <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3 w-3" />} onClick={fetchAll}>
                Refresh
              </Button>
            </div>
            {loading ? (
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
                    const status  = !s.check_in_time ? 'Absent'
                      : s.is_late ? 'Late' : 'Present'
                    return (
                      <Tr key={s.id}>
                        <Td>
                          <span className={isToday ? 'font-semibold text-blue-600' : ''}>
                            {formatDate(s.date)}
                            {isToday && <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Today</span>}
                          </span>
                        </Td>
                        <Td>{fmtTime(s.check_in_time)}</Td>
                        <Td>{fmtTime(s.check_out_time)}</Td>
                        <Td><span className="font-mono text-sm">{fmtDuration(s.duration_minutes)}</span></Td>
                        <Td>
                          <Badge variant={status === 'Present' ? 'success' : status === 'Late' ? 'warning' : 'danger'} dot size="sm">
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
            {loading ? (
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
                      <Td>
                        <span className="text-sm text-slate-500">{r.approver?.full_name ?? '—'}</span>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </div>
        )}

        {/* Pending Approvals (HR/Manager) */}
        {tab === 'approvals' && isHR && (
          <div>
            {loading ? (
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
