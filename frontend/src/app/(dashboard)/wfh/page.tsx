'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, Modal, Input, Textarea, EmptyState
} from '@/components/ui'
import { Home, Calendar, CheckCircle2, Clock, Plus, FlaskConical } from 'lucide-react'

type WFHStatus = 'Pending' | 'Approved' | 'Rejected'

type WFHRequest = {
  id: string; employee: string; from: string; to: string
  days: number; reason: string; status: WFHStatus; applied: string
}

const REQUESTS: WFHRequest[] = [
  { id: 'WFH-001', employee: 'Rahul Mehta', from: '02 Jun 2026', to: '04 Jun 2026', days: 3, reason: 'Deep work sprint – needs focus environment', status: 'Approved', applied: '25 May 2026' },
  { id: 'WFH-002', employee: 'Priya Sharma', from: '28 May 2026', to: '28 May 2026', days: 1, reason: 'Internet installation at office blocked today', status: 'Approved', applied: '27 May 2026' },
  { id: 'WFH-003', employee: 'Ananya Iyer', from: '30 May 2026', to: '31 May 2026', days: 2, reason: 'Parent visiting from out of town', status: 'Pending', applied: '27 May 2026' },
  { id: 'WFH-004', employee: 'Karan Singh', from: '27 May 2026', to: '27 May 2026', days: 1, reason: 'Minor health issue, mild fever', status: 'Rejected', applied: '26 May 2026' },
]

const STATUS_COLOR: Record<WFHStatus, 'success' | 'warning' | 'danger'> = {
  Approved: 'success', Pending: 'warning', Rejected: 'danger',
}

export default function WFHPage() {
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)

  const approved = REQUESTS.filter(r => r.status === 'Approved').length
  const pending = REQUESTS.filter(r => r.status === 'Pending').length

  const filtered = useMemo(() =>
    REQUESTS.filter(r => !search || r.employee.toLowerCase().includes(search.toLowerCase())),
    [search]
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — WFH request data is illustrative. Approval flow integrates with attendance tracking.</span>
      </div>

      <PageHeader
        title="Work From Home Requests"
        description="Submit and manage WFH requests. Max 3 days per week with manager approval."
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewModal(true)}>Request WFH</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={REQUESTS.length} icon={<Home className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Approved" value={approved} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Pending" value={pending} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="WFH Today" value={2} icon={<Calendar className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-4">
          <SearchInput placeholder="Search by employee..." value={search} onChange={setSearch} className="w-72" />
        </div>
        {filtered.length === 0 ? (
          <div className="py-10"><EmptyState icon={<Home className="h-6 w-6" />} title="No WFH requests found" /></div>
        ) : (
          <Table>
            <Thead><tr><Th>Employee</Th><Th>From</Th><Th>To</Th><Th>Days</Th><Th>Reason</Th><Th>Applied</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {filtered.map(r => (
                <Tr key={r.id}>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Avatar name={r.employee} size="xs" />
                      <span className="text-xs font-medium text-slate-700">{r.employee}</span>
                    </div>
                  </Td>
                  <Td><span className="text-xs text-slate-600">{r.from}</span></Td>
                  <Td><span className="text-xs text-slate-600">{r.to}</span></Td>
                  <Td><span className="text-xs font-bold text-blue-700">{r.days}d</span></Td>
                  <Td><span className="text-xs text-slate-500 max-w-48 truncate block">{r.reason}</span></Td>
                  <Td><span className="text-xs text-slate-400">{r.applied}</span></Td>
                  <Td><Badge variant={STATUS_COLOR[r.status]} dot size="sm">{r.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal open={newModal} onClose={() => setNewModal(false)} title="Request WFH" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm">Submit Request</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="From Date" type="date" required />
            <Input label="To Date" type="date" required />
          </div>
          <Textarea label="Reason" placeholder="Why do you need to work from home?" rows={3} required />
          <p className="text-xs text-slate-500">WFH requests must be submitted at least 24 hours in advance. Maximum 3 days per week.</p>
        </div>
      </Modal>
    </div>
  )
}
