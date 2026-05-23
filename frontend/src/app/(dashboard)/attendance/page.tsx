'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  SearchInput, TabBar, StatCard, EmptyState, Modal, Select, Textarea, DetailGrid
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Clock, CheckCircle2, XCircle, AlertTriangle, Download, Calendar, UserCheck, Check, X } from 'lucide-react'

type AttStatus = 'Present' | 'Absent' | 'Half Day' | 'Late'
type LeaveStatus = 'Pending' | 'Approved' | 'Rejected'

type AttRecord = { name: string; dept: string; checkIn: string; checkOut: string; hours: string; status: AttStatus; date: string }
type LeaveReq = { id: string; name: string; type: string; from: string; to: string; days: number; reason: string; status: LeaveStatus }

const TODAY: AttRecord[] = [
  { name: 'Priya Sharma', dept: 'Engineering', checkIn: '09:02', checkOut: '--:--', hours: '7h 15m', status: 'Present', date: '13 May' },
  { name: 'Rahul Mehta', dept: 'Finance', checkIn: '09:45', checkOut: '--:--', hours: '6h 32m', status: 'Late', date: '13 May' },
  { name: 'Ananya Iyer', dept: 'HR', checkIn: '--:--', checkOut: '--:--', hours: '—', status: 'Absent', date: '13 May' },
  { name: 'Karan Singh', dept: 'Sales', checkIn: '09:00', checkOut: '13:15', hours: '4h 15m', status: 'Half Day', date: '13 May' },
  { name: 'Divya Nair', dept: 'Engineering', checkIn: '08:55', checkOut: '--:--', hours: '7h 22m', status: 'Present', date: '13 May' },
  { name: 'Amit Patel', dept: 'Operations', checkIn: '09:05', checkOut: '--:--', hours: '7h 12m', status: 'Present', date: '13 May' },
  { name: 'Sneha Reddy', dept: 'Sales', checkIn: '--:--', checkOut: '--:--', hours: '—', status: 'Absent', date: '13 May' },
]

const LEAVE_REQUESTS: LeaveReq[] = [
  { id: 'LR-001', name: 'Karan Singh', type: 'Sick Leave', from: '13 May', to: '14 May', days: 2, reason: 'Fever and cold', status: 'Pending' },
  { id: 'LR-002', name: 'Sneha Reddy', type: 'Casual Leave', from: '15 May', to: '15 May', days: 1, reason: 'Family event', status: 'Pending' },
  { id: 'LR-003', name: 'Vikram Joshi', type: 'Annual Leave', from: '20 May', to: '25 May', days: 6, reason: 'Vacation', status: 'Approved' },
  { id: 'LR-004', name: 'Priya Sharma', type: 'Work from Home', from: '14 May', to: '14 May', days: 1, reason: 'Home repair', status: 'Approved' },
  { id: 'LR-005', name: 'Rahul Mehta', type: 'Sick Leave', from: '18 May', to: '18 May', days: 1, reason: 'Doctor appointment', status: 'Pending' },
]

const STATUS_COLOR: Record<AttStatus, 'success' | 'danger' | 'warning' | 'neutral'> = {
  Present: 'success', Absent: 'danger', 'Half Day': 'warning', Late: 'warning',
}
const LEAVE_COLOR: Record<LeaveStatus, 'success' | 'warning' | 'danger'> = {
  Approved: 'success', Pending: 'warning', Rejected: 'danger',
}

export default function AttendancePage() {
  const [tab, setTab] = useState('today')
  const [search, setSearch] = useState('')
  const [leaveDetail, setLeaveDetail] = useState<LeaveReq | null>(null)

  const present = TODAY.filter(r => r.status === 'Present' || r.status === 'Late').length
  const absent = TODAY.filter(r => r.status === 'Absent').length
  const half = TODAY.filter(r => r.status === 'Half Day').length
  const late = TODAY.filter(r => r.status === 'Late').length
  const pendingLeaves = LEAVE_REQUESTS.filter(l => l.status === 'Pending').length

  const filteredToday = useMemo(() =>
    TODAY.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.dept.toLowerCase().includes(search.toLowerCase())), [search])

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Attendance"
        description="Track employee attendance, leaves, and time-off requests"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button variant="outline" size="sm" leftIcon={<Calendar className="h-3.5 w-3.5" />}>Monthly View</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Present Today" value={present} delta={{ value: `${Math.round(present / TODAY.length * 100)}%`, positive: true }} icon={<UserCheck className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard label="Absent" value={absent} icon={<XCircle className="h-4 w-4" />} iconColor="bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400" />
        <StatCard label="Late / Half Day" value={late + half} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <StatCard label="Pending Leaves" value={pendingLeaves} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
      </div>

      <TabBar
        tabs={[
          { id: 'today', label: "Today's Attendance" },
          { id: 'leaves', label: 'Leave Requests', count: pendingLeaves },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'today' && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-4">
            <SearchInput placeholder="Search employees..." value={search} onChange={setSearch} className="w-72" />
          </div>
          {filteredToday.length === 0 ? (
            <EmptyState icon={<Clock className="h-6 w-6" />} title="No records found" description="Try adjusting your search" />
          ) : (
            <Table>
              <Thead>
                <tr><Th>Employee</Th><Th>Department</Th><Th align="center">Check In</Th><Th align="center">Check Out</Th><Th align="center">Hours</Th><Th>Status</Th></tr>
              </Thead>
              <Tbody>
                {filteredToday.map(r => (
                  <Tr key={r.name}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.name} size="sm" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{r.name}</span>
                      </div>
                    </Td>
                    <Td><Badge variant="neutral" size="sm">{r.dept}</Badge></Td>
                    <Td align="center">
                      <span className={`font-mono text-sm font-medium ${r.status === 'Late' ? 'text-amber-600' : r.status === 'Absent' ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {r.checkIn}
                      </span>
                    </Td>
                    <Td align="center">
                      <span className="font-mono text-sm text-slate-500">{r.checkOut}</span>
                    </Td>
                    <Td align="center">
                      <span className="text-sm tabular-nums font-medium text-slate-700 dark:text-slate-300">{r.hours}</span>
                    </Td>
                    <Td>
                      <Badge variant={STATUS_COLOR[r.status]} dot>{r.status}</Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <p className="text-xs text-slate-500">
              <span className="text-emerald-600 font-semibold">{present}</span> present ·{' '}
              <span className="text-amber-600 font-semibold">{late}</span> late ·{' '}
              <span className="text-red-500 font-semibold">{absent}</span> absent ·{' '}
              <span className="text-slate-500 font-semibold">{half}</span> half-day
            </p>
          </div>
        </Card>
      )}

      {tab === 'leaves' && (
        <Card padding="none">
          <Table>
            <Thead>
              <tr><Th>Employee</Th><Th>Leave Type</Th><Th>Period</Th><Th align="center">Days</Th><Th>Reason</Th><Th>Status</Th><Th>Actions</Th></tr>
            </Thead>
            <Tbody>
              {LEAVE_REQUESTS.map(l => (
                <Tr key={l.id} onClick={() => setLeaveDetail(l)}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar name={l.name} size="sm" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{l.name}</span>
                    </div>
                  </Td>
                  <Td><Badge variant="neutral" size="sm">{l.type}</Badge></Td>
                  <Td>
                    <span className="text-xs text-slate-500">
                      {l.from === l.to ? l.from : `${l.from} – ${l.to}`}
                    </span>
                  </Td>
                  <Td align="center">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{l.days}</span>
                  </Td>
                  <Td>
                    <span className="text-xs text-slate-500 max-w-48 truncate block">{l.reason}</span>
                  </Td>
                  <Td>
                    <Badge variant={LEAVE_COLOR[l.status]} dot>{l.status}</Badge>
                  </Td>
                  <Td>
                    {l.status === 'Pending' && (
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="text-emerald-600 hover:bg-emerald-50">
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Leave Detail Modal */}
      <Modal open={!!leaveDetail} onClose={() => setLeaveDetail(null)} title="Leave Request" size="md"
        footer={leaveDetail?.status === 'Pending' ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => setLeaveDetail(null)}>Cancel</Button>
            <Button variant="danger" size="sm">Reject</Button>
            <Button size="sm">Approve</Button>
          </>
        ) : <Button variant="ghost" size="sm" onClick={() => setLeaveDetail(null)}>Close</Button>}
      >
        {leaveDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={leaveDetail.name} size="lg" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{leaveDetail.name}</p>
                <Badge variant={LEAVE_COLOR[leaveDetail.status]} dot className="mt-1">{leaveDetail.status}</Badge>
              </div>
            </div>
            <DetailGrid items={[
              { label: 'Leave Type', value: leaveDetail.type },
              { label: 'From', value: leaveDetail.from },
              { label: 'To', value: leaveDetail.to },
              { label: 'Duration', value: `${leaveDetail.days} day${leaveDetail.days > 1 ? 's' : ''}` },
              { label: 'Reason', value: leaveDetail.reason },
            ]} cols={2} />
          </div>
        )}
      </Modal>
    </div>
  )
}
