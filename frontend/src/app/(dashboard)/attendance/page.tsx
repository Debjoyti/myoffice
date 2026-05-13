'use client'

import { useState } from 'react'
import { PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td, SearchInput, TabBar, StatCard, EmptyState } from '@/components/ui'
import { Clock, CheckCircle2, XCircle, AlertTriangle, Download, Calendar } from 'lucide-react'

type AttRecord = { name: string; dept: string; checkIn: string; checkOut: string; hours: string; status: 'Present' | 'Absent' | 'Half Day' | 'Late'; date: string }

const TODAY = [
  { name: 'Priya Sharma', dept: 'Engineering', checkIn: '09:02', checkOut: '--:--', hours: '7h 15m', status: 'Present' as const, date: '13 May' },
  { name: 'Rahul Mehta', dept: 'Finance', checkIn: '09:45', checkOut: '--:--', hours: '6h 32m', status: 'Late' as const, date: '13 May' },
  { name: 'Ananya Iyer', dept: 'HR', checkIn: '--:--', checkOut: '--:--', hours: '—', status: 'Absent' as const, date: '13 May' },
  { name: 'Karan Singh', dept: 'Sales', checkIn: '09:00', checkOut: '13:15', hours: '4h 15m', status: 'Half Day' as const, date: '13 May' },
  { name: 'Divya Nair', dept: 'Engineering', checkIn: '08:55', checkOut: '--:--', hours: '7h 22m', status: 'Present' as const, date: '13 May' },
  { name: 'Amit Patel', dept: 'Operations', checkIn: '09:05', checkOut: '--:--', hours: '7h 12m', status: 'Present' as const, date: '13 May' },
  { name: 'Sneha Reddy', dept: 'Marketing', checkIn: '--:--', checkOut: '--:--', hours: '—', status: 'Absent' as const, date: '13 May' },
]

const LEAVE_REQUESTS = [
  { name: 'Karan Singh', type: 'Sick Leave', from: '13 May', to: '14 May', days: 2, reason: 'Fever and cold', status: 'Pending' },
  { name: 'Sneha Reddy', type: 'Casual Leave', from: '15 May', to: '15 May', days: 1, reason: 'Family event', status: 'Pending' },
  { name: 'Vikram Joshi', type: 'Annual Leave', from: '20 May', to: '25 May', days: 6, reason: 'Vacation', status: 'Approved' },
  { name: 'Priya Sharma', type: 'Work from Home', from: '14 May', to: '14 May', days: 1, reason: 'Home repair', status: 'Approved' },
]

const STATUS_COLOR: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  Present: 'success', Absent: 'danger', 'Half Day': 'warning', Late: 'warning',
}
const LEAVE_COLOR: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  Approved: 'success', Pending: 'warning', Rejected: 'danger',
}

export default function AttendancePage() {
  const [tab, setTab] = useState('today')
  const [search, setSearch] = useState('')

  const present = TODAY.filter(r => r.status === 'Present' || r.status === 'Late').length
  const absent = TODAY.filter(r => r.status === 'Absent').length
  const half = TODAY.filter(r => r.status === 'Half Day').length

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Attendance"
        description="Track daily attendance, leaves, and work hours"
        actions={
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export Report</Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Present Today" value={present} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" delta={{ value: `${Math.round(present/TODAY.length*100)}% rate`, positive: true }} />
        <StatCard label="Absent" value={absent} icon={<XCircle className="h-4 w-4" />} iconColor="bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400" />
        <StatCard label="Half Day" value={half} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400" />
        <StatCard label="Leave Requests" value={LEAVE_REQUESTS.filter(l => l.status === 'Pending').length} icon={<Calendar className="h-4 w-4" />} iconColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <SearchInput placeholder="Search employee..." value={search} onChange={setSearch} className="w-full sm:w-64" />
          <div className="sm:ml-auto">
            <Button variant="outline" size="sm" leftIcon={<Calendar className="h-3.5 w-3.5" />}>13 May 2026</Button>
          </div>
        </div>

        <TabBar
          tabs={[
            { id: 'today', label: "Today's Attendance", count: TODAY.length },
            { id: 'leaves', label: 'Leave Requests', count: LEAVE_REQUESTS.filter(l => l.status === 'Pending').length },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'today' && (
          <Table>
            <Thead>
              <tr>
                <Th>Employee</Th>
                <Th>Department</Th>
                <Th>Check In</Th>
                <Th>Check Out</Th>
                <Th>Hours</Th>
                <Th>Status</Th>
              </tr>
            </Thead>
            <Tbody>
              {TODAY.filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase())).map(r => (
                <Tr key={r.name}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.name} size="sm" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{r.name}</span>
                    </div>
                  </Td>
                  <Td><span className="text-slate-500">{r.dept}</span></Td>
                  <Td>
                    <span className={`font-mono text-sm ${r.checkIn === '--:--' ? 'text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {r.checkIn}
                    </span>
                  </Td>
                  <Td>
                    <span className={`font-mono text-sm ${r.checkOut === '--:--' ? 'text-slate-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {r.checkOut}
                    </span>
                  </Td>
                  <Td><span className="font-medium data-value">{r.hours}</span></Td>
                  <Td><Badge variant={STATUS_COLOR[r.status]} dot>{r.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        {tab === 'leaves' && (
          <Table>
            <Thead>
              <tr>
                <Th>Employee</Th>
                <Th>Leave Type</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Days</Th>
                <Th>Reason</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {LEAVE_REQUESTS.map(l => (
                <Tr key={l.name + l.from}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={l.name} size="sm" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">{l.name}</span>
                    </div>
                  </Td>
                  <Td><Badge variant="neutral">{l.type}</Badge></Td>
                  <Td><span className="text-slate-600 dark:text-slate-400">{l.from}</span></Td>
                  <Td><span className="text-slate-600 dark:text-slate-400">{l.to}</span></Td>
                  <Td><span className="font-medium">{l.days}d</span></Td>
                  <Td><span className="text-slate-500 max-w-xs truncate">{l.reason}</span></Td>
                  <Td><Badge variant={LEAVE_COLOR[l.status]} dot>{l.status}</Badge></Td>
                  <Td>
                    {l.status === 'Pending' && (
                      <div className="flex gap-1">
                        <Button variant="secondary" size="sm">Approve</Button>
                        <Button variant="ghost" size="sm">Reject</Button>
                      </div>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            {tab === 'today' ? `${TODAY.length} employees tracked today` : `${LEAVE_REQUESTS.length} leave requests total`}
          </p>
        </div>
      </Card>
    </div>
  )
}
