'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, TabBar, Modal, Input, Select, Textarea, EmptyState
} from '@/components/ui'
import { CalendarDays, Clock, CheckCircle2, XCircle, Plus, FlaskConical } from 'lucide-react'

type LeaveType = 'Casual' | 'Sick' | 'Earned' | 'Maternity' | 'Paternity' | 'LOP'
type LeaveStatus = 'Pending' | 'Approved' | 'Rejected'

type LeaveRequest = {
  id: string; employee: string; type: LeaveType; from: string; to: string
  days: number; reason: string; status: LeaveStatus; applied: string
}

const LEAVES: LeaveRequest[] = [
  { id: 'LV-001', employee: 'Rahul Mehta', type: 'Casual', from: '28 May 2026', to: '30 May 2026', days: 3, reason: 'Family function', status: 'Pending', applied: '22 May 2026' },
  { id: 'LV-002', employee: 'Priya Sharma', type: 'Sick', from: '20 May 2026', to: '21 May 2026', days: 2, reason: 'Fever and rest', status: 'Approved', applied: '19 May 2026' },
  { id: 'LV-003', employee: 'Karan Singh', type: 'Earned', from: '02 Jun 2026', to: '06 Jun 2026', days: 5, reason: 'Annual vacation', status: 'Approved', applied: '15 May 2026' },
  { id: 'LV-004', employee: 'Ananya Iyer', type: 'Casual', from: '25 May 2026', to: '25 May 2026', days: 1, reason: 'Personal work', status: 'Rejected', applied: '23 May 2026' },
  { id: 'LV-005', employee: 'Vikram Joshi', type: 'LOP', from: '18 May 2026', to: '19 May 2026', days: 2, reason: 'Exhausted leaves', status: 'Approved', applied: '17 May 2026' },
]

const LEAVE_BALANCES = [
  { employee: 'Rahul Mehta', casual: 5, sick: 8, earned: 12 },
  { employee: 'Priya Sharma', casual: 6, sick: 6, earned: 15 },
  { employee: 'Karan Singh', casual: 8, sick: 10, earned: 8 },
  { employee: 'Ananya Iyer', casual: 3, sick: 9, earned: 20 },
]

const STATUS_COLOR: Record<LeaveStatus, 'warning' | 'success' | 'danger'> = {
  Pending: 'warning', Approved: 'success', Rejected: 'danger',
}

const TYPE_COLOR: Record<LeaveType, string> = {
  Casual: 'bg-blue-50 text-blue-700', Sick: 'bg-red-50 text-red-700',
  Earned: 'bg-emerald-50 text-emerald-700', Maternity: 'bg-pink-50 text-pink-700',
  Paternity: 'bg-indigo-50 text-indigo-700', LOP: 'bg-amber-50 text-amber-700',
}

export default function LeavePage() {
  const [tab, setTab] = useState('requests')
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)

  const pending = LEAVES.filter(l => l.status === 'Pending').length
  const approved = LEAVES.filter(l => l.status === 'Approved').length

  const filtered = useMemo(() =>
    LEAVES.filter(l => !search || l.employee.toLowerCase().includes(search.toLowerCase()) || l.type.toLowerCase().includes(search.toLowerCase())),
    [search]
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — Leave data is illustrative. Full leave management integrates with payroll and attendance.</span>
      </div>

      <PageHeader
        title="Leave Management"
        description="Apply for leave, track balances, and approve team requests"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewModal(true)}>Apply Leave</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Pending Requests" value={pending} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Approved" value={approved} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="On Leave Today" value={1} icon={<CalendarDays className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Rejected" value={LEAVES.filter(l => l.status === 'Rejected').length} icon={<XCircle className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
      </div>

      <TabBar
        tabs={[
          { id: 'requests', label: 'Leave Requests', count: LEAVES.length },
          { id: 'balances', label: 'Leave Balances', count: LEAVE_BALANCES.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'requests' && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-4">
            <SearchInput placeholder="Search by employee or leave type..." value={search} onChange={setSearch} className="w-80" />
          </div>
          <Table>
            <Thead><tr><Th>Employee</Th><Th>Type</Th><Th>From</Th><Th>To</Th><Th>Days</Th><Th>Reason</Th><Th>Applied</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {filtered.map(l => (
                <Tr key={l.id}>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Avatar name={l.employee} size="xs" />
                      <span className="text-xs font-medium text-slate-700">{l.employee}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[l.type]}`}>{l.type}</span>
                  </Td>
                  <Td><span className="text-xs text-slate-600">{l.from}</span></Td>
                  <Td><span className="text-xs text-slate-600">{l.to}</span></Td>
                  <Td><span className="text-xs font-semibold text-slate-800">{l.days}d</span></Td>
                  <Td><span className="text-xs text-slate-500 max-w-40 truncate block">{l.reason}</span></Td>
                  <Td><span className="text-xs text-slate-400">{l.applied}</span></Td>
                  <Td><Badge variant={STATUS_COLOR[l.status]} dot size="sm">{l.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'balances' && (
        <Card padding="none">
          <Table>
            <Thead><tr><Th>Employee</Th><Th>Casual Leave</Th><Th>Sick Leave</Th><Th>Earned Leave</Th><Th>Total Available</Th></tr></Thead>
            <Tbody>
              {LEAVE_BALANCES.map(b => (
                <Tr key={b.employee}>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Avatar name={b.employee} size="xs" />
                      <span className="text-xs font-medium text-slate-700">{b.employee}</span>
                    </div>
                  </Td>
                  <Td><span className="text-xs font-semibold text-blue-700">{b.casual} days</span></Td>
                  <Td><span className="text-xs font-semibold text-red-700">{b.sick} days</span></Td>
                  <Td><span className="text-xs font-semibold text-emerald-700">{b.earned} days</span></Td>
                  <Td><span className="text-xs font-bold text-slate-800">{b.casual + b.sick + b.earned} days</span></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Apply Leave Modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="Apply for Leave" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm">Submit Request</Button>
        </>}
      >
        <div className="space-y-4">
          <Select label="Leave Type" options={[
            { label: 'Casual Leave', value: 'Casual' },
            { label: 'Sick Leave', value: 'Sick' },
            { label: 'Earned Leave', value: 'Earned' },
            { label: 'Maternity Leave', value: 'Maternity' },
            { label: 'Paternity Leave', value: 'Paternity' },
          ]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="From Date" type="date" required />
            <Input label="To Date" type="date" required />
          </div>
          <Textarea label="Reason" placeholder="Briefly describe the reason for leave..." rows={3} required />
        </div>
      </Modal>
    </div>
  )
}
