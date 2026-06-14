'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, Modal, Input, Textarea, EmptyState, Alert, SkeletonTable
} from '@/components/ui'
import { Home, Calendar, CheckCircle2, Clock, Plus, FlaskConical, RefreshCw } from 'lucide-react'

type ApiWFH = {
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

const MOCK_REQUESTS: ApiWFH[] = [
  { id: 'WFH-001', type: 'wfh', status: 'approved', title: 'WFH Request', description: 'Deep work sprint – needs focus environment', from_date: '2026-06-02', to_date: '2026-06-04', days_count: 3, created_at: '2026-05-25T00:00:00Z' },
  { id: 'WFH-002', type: 'wfh', status: 'approved', title: 'WFH Request', description: 'Internet installation at office blocked today', from_date: '2026-05-28', to_date: '2026-05-28', days_count: 1, created_at: '2026-05-27T00:00:00Z' },
  { id: 'WFH-003', type: 'wfh', status: 'pending', title: 'WFH Request', description: 'Parent visiting from out of town', from_date: '2026-05-30', to_date: '2026-05-31', days_count: 2, created_at: '2026-05-27T00:00:00Z' },
  { id: 'WFH-004', type: 'wfh', status: 'rejected', title: 'WFH Request', description: 'Minor health issue, mild fever', from_date: '2026-05-27', to_date: '2026-05-27', days_count: 1, created_at: '2026-05-26T00:00:00Z' },
]

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'danger'> = {
  approved: 'success', pending: 'warning', rejected: 'danger',
}

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return d }
}

const INITIAL_FORM = { from_date: '', to_date: '', description: '' }

export default function WFHPage() {
  const [requests, setRequests] = useState<ApiWFH[]>(MOCK_REQUESTS)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(false)
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/approvals')
      if (res.ok) {
        const data = await res.json()
        const wfhList: ApiWFH[] = (data.approvals ?? []).filter((r: ApiWFH) => r.type === 'wfh')
        if (wfhList.length > 0) {
          setRequests(wfhList)
          setIsPreview(false)
          return
        }
      }
    } catch { /* fall through */ }
    setRequests(MOCK_REQUESTS)
    setIsPreview(true)
  }, [])

  useEffect(() => { fetchData().finally(() => setLoading(false)) }, [fetchData])

  const handleSubmit = async () => {
    if (!form.from_date) { setFormError('From date is required'); return }
    if (!form.description.trim()) { setFormError('Please provide a reason'); return }
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
          type: 'wfh',
          title: 'WFH Request',
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
    } catch { /* optimistic fallback */ }
    const days = form.to_date
      ? Math.max(1, Math.ceil((new Date(form.to_date).getTime() - new Date(form.from_date).getTime()) / 86400000) + 1)
      : 1
    setRequests(prev => [{
      id: `WFH-${Date.now()}`,
      type: 'wfh',
      status: 'pending',
      title: 'WFH Request',
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

  const approved = useMemo(() => requests.filter(r => r.status === 'approved').length, [requests])
  const pending = useMemo(() => requests.filter(r => r.status === 'pending').length, [requests])
  const wfhToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return requests.filter(r => r.status === 'approved' && r.from_date <= today && r.to_date >= today).length
  }, [requests])

  const filtered = useMemo(() =>
    requests.filter(r => !search || r.description.toLowerCase().includes(search.toLowerCase())),
    [requests, search]
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      {isPreview && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
          <span><strong>Preview mode</strong> — WFH request data is illustrative. Approval flow integrates with attendance tracking.</span>
        </div>
      )}

      <PageHeader
        title="Work From Home Requests"
        description="Submit and manage WFH requests. Max 3 days per week with manager approval."
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchData}>Refresh</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setNewModal(true); setFormError('') }}>Request WFH</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={requests.length} icon={<Home className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Approved" value={approved} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Pending" value={pending} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="WFH Today" value={wfhToday} icon={<Calendar className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-4">
          <SearchInput placeholder="Search by reason..." value={search} onChange={setSearch} className="w-72" />
        </div>
        {loading ? (
          <SkeletonTable rows={4} cols={6} />
        ) : filtered.length === 0 ? (
          <div className="py-10"><EmptyState icon={<Home className="h-6 w-6" />} title="No WFH requests found" /></div>
        ) : (
          <Table>
            <Thead>
              <tr><Th>From</Th><Th>To</Th><Th>Days</Th><Th>Reason</Th><Th>Applied</Th><Th>Status</Th></tr>
            </Thead>
            <Tbody>
              {filtered.map(r => (
                <Tr key={r.id}>
                  <Td><span className="text-xs text-slate-600">{fmtDate(r.from_date)}</span></Td>
                  <Td><span className="text-xs text-slate-600">{fmtDate(r.to_date)}</span></Td>
                  <Td><span className="text-xs font-bold text-blue-700">{r.days_count}d</span></Td>
                  <Td><span className="text-xs text-slate-500 max-w-48 truncate block">{r.description}</span></Td>
                  <Td><span className="text-xs text-slate-400">{fmtDate(r.created_at)}</span></Td>
                  <Td>
                    <Badge variant={STATUS_COLOR[r.status] ?? 'neutral'} dot size="sm">
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal open={newModal} onClose={() => { setNewModal(false); setFormError('') }} title="Request WFH" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSubmit}>Submit Request</Button>
        </>}
      >
        <div className="space-y-4">
          {formError && <Alert variant="danger">{formError}</Alert>}
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
            placeholder="Why do you need to work from home?"
            rows={3}
            required
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <p className="text-xs text-slate-500">WFH requests must be submitted at least 24 hours in advance. Maximum 3 days per week.</p>
        </div>
      </Modal>
    </div>
  )
}
