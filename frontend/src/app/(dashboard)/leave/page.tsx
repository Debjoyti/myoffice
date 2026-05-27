'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, TabBar, Modal, Input, Select, Textarea, EmptyState,
  Alert, SkeletonTable
} from '@/components/ui'
import { CalendarDays, Clock, CheckCircle2, XCircle, Plus, FlaskConical, RefreshCw } from 'lucide-react'

type ApiLeave = {
  id: string
  type: string
  status: 'pending' | 'approved' | 'rejected'
  title: string
  description: string
  from_date: string
  to_date: string
  days_count: number
  created_at: string
  approver?: { full_name: string; designation: string } | null
}

type ApiBalance = {
  leave_type: string
  total: number
  used: number
  available: number
  year: number
}

const MOCK_LEAVES: ApiLeave[] = [
  { id: 'LV-001', type: 'casual', status: 'pending', title: 'Casual Leave', description: 'Family function', from_date: '2026-05-28', to_date: '2026-05-30', days_count: 3, created_at: '2026-05-22T00:00:00Z' },
  { id: 'LV-002', type: 'sick', status: 'approved', title: 'Sick Leave', description: 'Fever and rest', from_date: '2026-05-20', to_date: '2026-05-21', days_count: 2, created_at: '2026-05-19T00:00:00Z' },
  { id: 'LV-003', type: 'earned', status: 'approved', title: 'Earned Leave', description: 'Annual vacation', from_date: '2026-06-02', to_date: '2026-06-06', days_count: 5, created_at: '2026-05-15T00:00:00Z' },
  { id: 'LV-004', type: 'casual', status: 'rejected', title: 'Casual Leave', description: 'Personal work', from_date: '2026-05-25', to_date: '2026-05-25', days_count: 1, created_at: '2026-05-23T00:00:00Z' },
  { id: 'LV-005', type: 'lop', status: 'approved', title: 'LOP', description: 'Exhausted leaves', from_date: '2026-05-18', to_date: '2026-05-19', days_count: 2, created_at: '2026-05-17T00:00:00Z' },
]

const MOCK_BALANCES: ApiBalance[] = [
  { leave_type: 'casual', total: 12, used: 4, available: 8, year: 2026 },
  { leave_type: 'sick', total: 12, used: 2, available: 10, year: 2026 },
  { leave_type: 'earned', total: 15, used: 5, available: 10, year: 2026 },
  { leave_type: 'maternity', total: 26, used: 0, available: 26, year: 2026 },
]

const TYPE_LABEL: Record<string, string> = {
  casual: 'Casual', sick: 'Sick', earned: 'Earned',
  maternity: 'Maternity', paternity: 'Paternity', lop: 'LOP', other: 'Other',
}
const TYPE_COLOR: Record<string, string> = {
  casual: 'bg-blue-50 text-blue-700', sick: 'bg-red-50 text-red-700',
  earned: 'bg-emerald-50 text-emerald-700', maternity: 'bg-pink-50 text-pink-700',
  paternity: 'bg-indigo-50 text-indigo-700', lop: 'bg-amber-50 text-amber-700',
  other: 'bg-slate-50 text-slate-700',
}
const STATUS_COLOR: Record<string, 'warning' | 'success' | 'danger'> = {
  pending: 'warning', approved: 'success', rejected: 'danger',
}

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return d }
}

const INITIAL_FORM = { type: 'casual', from_date: '', to_date: '', description: '' }

export default function LeavePage() {
  const [leaves, setLeaves] = useState<ApiLeave[]>(MOCK_LEAVES)
  const [balances, setBalances] = useState<ApiBalance[]>(MOCK_BALANCES)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(false)
  const [tab, setTab] = useState('requests')
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [leavesRes, balancesRes] = await Promise.all([
        fetch('/api/v1/approvals'),
        fetch('/api/v1/leave/balance'),
      ])
      if (leavesRes.ok && balancesRes.ok) {
        const leavesData = await leavesRes.json()
        const balancesData = await balancesRes.json()
        const leaveList: ApiLeave[] = (leavesData.approvals ?? []).filter(
          (l: ApiLeave) => l.type !== 'wfh'
        )
        if (leaveList.length > 0 || balancesData.balances?.length > 0) {
          setLeaves(leaveList)
          setBalances(balancesData.balances ?? [])
          setIsPreview(false)
          return
        }
      }
    } catch { /* fall through to mock */ }
    setLeaves(MOCK_LEAVES)
    setBalances(MOCK_BALANCES)
    setIsPreview(true)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData().finally(() => setLoading(false)) }, [fetchData])

  const handleApplyLeave = async () => {
    if (!form.from_date) { setFormError('From date is required'); return }
    setSaving(true)
    setFormError('')
    try {
      const from = new Date(form.from_date)
      const to = form.to_date ? new Date(form.to_date) : from
      const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1)
      const res = await fetch('/api/v1/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          title: `${TYPE_LABEL[form.type] ?? form.type} Leave`,
          description: form.description,
          from_date: form.from_date,
          to_date: form.to_date || form.from_date,
          days_count: days,
        }),
      })
      if (res.ok) {
        setNewModal(false)
        setForm(INITIAL_FORM)
        fetchData()
        return
      }
    } catch { /* fall through to optimistic */ }
    // Optimistic update for preview mode
    const days = form.to_date
      ? Math.max(1, Math.ceil((new Date(form.to_date).getTime() - new Date(form.from_date).getTime()) / 86400000) + 1)
      : 1
    setLeaves(prev => [{
      id: `LV-${Date.now()}`,
      type: form.type,
      status: 'pending',
      title: `${TYPE_LABEL[form.type] ?? form.type} Leave`,
      description: form.description,
      from_date: form.from_date,
      to_date: form.to_date || form.from_date,
      days_count: days,
      created_at: new Date().toISOString(),
    }, ...prev])
    setNewModal(false)
    setForm(INITIAL_FORM)
    setSaving(false)
  }

  const pending = useMemo(() => leaves.filter(l => l.status === 'pending').length, [leaves])
  const approved = useMemo(() => leaves.filter(l => l.status === 'approved').length, [leaves])
  const rejected = useMemo(() => leaves.filter(l => l.status === 'rejected').length, [leaves])
  const onLeaveToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return leaves.filter(l => l.status === 'approved' && l.from_date <= today && l.to_date >= today).length
  }, [leaves])

  const filtered = useMemo(() =>
    leaves.filter(l => !search ||
      (TYPE_LABEL[l.type] ?? l.type).toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase())
    ), [leaves, search]
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      {isPreview && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
          <span><strong>Preview mode</strong> — Leave data is illustrative. Full leave management integrates with payroll and attendance.</span>
        </div>
      )}

      <PageHeader
        title="Leave Management"
        description="Apply for leave, track balances, and approve team requests"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchData}>Refresh</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setNewModal(true); setFormError('') }}>Apply Leave</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Pending" value={pending} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Approved" value={approved} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="On Leave Today" value={onLeaveToday} icon={<CalendarDays className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Rejected" value={rejected} icon={<XCircle className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
      </div>

      <TabBar
        tabs={[
          { id: 'requests', label: 'Leave Requests', count: leaves.length },
          { id: 'balances', label: 'Leave Balances', count: balances.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'requests' && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-4">
            <SearchInput placeholder="Search by type or reason..." value={search} onChange={setSearch} className="w-80" />
          </div>
          {loading ? (
            <SkeletonTable rows={4} cols={7} />
          ) : filtered.length === 0 ? (
            <div className="py-10">
              <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No leave requests" description={search ? 'Try a different search' : 'Apply for leave to get started'} />
            </div>
          ) : (
            <Table>
              <Thead>
                <tr><Th>Type</Th><Th>From</Th><Th>To</Th><Th>Days</Th><Th>Reason</Th><Th>Applied</Th><Th>Status</Th></tr>
              </Thead>
              <Tbody>
                {filtered.map(l => (
                  <Tr key={l.id}>
                    <Td>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[l.type] ?? 'bg-slate-50 text-slate-700'}`}>
                        {TYPE_LABEL[l.type] ?? l.type}
                      </span>
                    </Td>
                    <Td><span className="text-xs text-slate-600">{fmtDate(l.from_date)}</span></Td>
                    <Td><span className="text-xs text-slate-600">{fmtDate(l.to_date)}</span></Td>
                    <Td><span className="text-xs font-semibold text-slate-800">{l.days_count}d</span></Td>
                    <Td><span className="text-xs text-slate-500 max-w-40 truncate block">{l.description}</span></Td>
                    <Td><span className="text-xs text-slate-400">{fmtDate(l.created_at)}</span></Td>
                    <Td>
                      <Badge variant={STATUS_COLOR[l.status] ?? 'neutral'} dot size="sm">
                        {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {tab === 'balances' && (
        <Card padding="none">
          {loading ? (
            <SkeletonTable rows={4} cols={5} />
          ) : balances.length === 0 ? (
            <div className="py-10">
              <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No balance data" description="Leave balances appear once your account is set up by HR" />
            </div>
          ) : (
            <Table>
              <Thead>
                <tr><Th>Leave Type</Th><Th align="right">Total</Th><Th align="right">Used</Th><Th align="right">Available</Th><Th>Usage</Th></tr>
              </Thead>
              <Tbody>
                {balances.map(b => (
                  <Tr key={b.leave_type}>
                    <Td>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[b.leave_type] ?? 'bg-slate-50 text-slate-700'}`}>
                        {TYPE_LABEL[b.leave_type] ?? b.leave_type}
                      </span>
                    </Td>
                    <Td align="right"><span className="text-xs font-semibold text-slate-700">{b.total}d</span></Td>
                    <Td align="right"><span className="text-xs text-slate-500">{b.used}d</span></Td>
                    <Td align="right"><span className="text-xs font-bold text-emerald-700">{b.available}d</span></Td>
                    <Td>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-blue-500"
                          style={{ width: `${b.total > 0 ? Math.round((b.used / b.total) * 100) : 0}%` }}
                        />
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      <Modal open={newModal} onClose={() => { setNewModal(false); setFormError('') }} title="Apply for Leave" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleApplyLeave}>Submit Request</Button>
        </>}
      >
        <div className="space-y-4">
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Select
            label="Leave Type"
            options={[
              { label: 'Casual Leave', value: 'casual' },
              { label: 'Sick Leave', value: 'sick' },
              { label: 'Earned Leave', value: 'earned' },
              { label: 'Maternity Leave', value: 'maternity' },
              { label: 'Paternity Leave', value: 'paternity' },
            ]}
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: (e.target as HTMLSelectElement).value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="From Date"
              type="date"
              required
              value={form.from_date}
              onChange={e => setForm(f => ({ ...f, from_date: e.target.value }))}
            />
            <Input
              label="To Date"
              type="date"
              value={form.to_date}
              onChange={e => setForm(f => ({ ...f, to_date: e.target.value }))}
            />
          </div>
          <Textarea
            label="Reason"
            placeholder="Briefly describe the reason for leave..."
            rows={3}
            required
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
