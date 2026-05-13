'use client'

import { useState } from 'react'
import { PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td, StatCard, SearchInput, TabBar } from '@/components/ui'
import { MessageSquare, Clock, CheckCircle2, AlertTriangle, Plus } from 'lucide-react'

const TICKETS = [
  { id: 'TKT-1041', subject: 'Unable to access payroll module', requester: 'Rahul Mehta', type: 'Bug', priority: 'High', status: 'Open', created: '13 May, 09:15', sla: '2h remaining' },
  { id: 'TKT-1040', subject: 'Request: Add new employee onboarding flow', requester: 'Ananya Iyer', type: 'Feature Request', priority: 'Medium', status: 'In Progress', created: '12 May, 14:30', sla: '18h remaining' },
  { id: 'TKT-1039', subject: 'Salary slip download not working', requester: 'Karan Singh', type: 'Bug', priority: 'High', status: 'Resolved', created: '11 May, 11:00', sla: 'Resolved' },
  { id: 'TKT-1038', subject: 'Leave balance showing incorrect', requester: 'Priya Sharma', type: 'Bug', priority: 'Critical', status: 'Open', created: '11 May, 08:45', sla: '30m remaining' },
  { id: 'TKT-1037', subject: 'Export CSV format request', requester: 'Divya Nair', type: 'Feature Request', priority: 'Low', status: 'Closed', created: '10 May, 16:00', sla: 'Closed' },
]

const STATUS_COLOR: Record<string, 'danger' | 'info' | 'success' | 'neutral'> = {
  Open: 'danger', 'In Progress': 'info', Resolved: 'success', Closed: 'neutral',
}
const PRIORITY_COLOR: Record<string, 'danger' | 'warning' | 'neutral'> = {
  Critical: 'danger', High: 'danger', Medium: 'warning', Low: 'neutral',
}

export default function SupportPage() {
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')

  const open = TICKETS.filter(t => t.status === 'Open').length
  const inProgress = TICKETS.filter(t => t.status === 'In Progress').length

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Support"
        description="Internal helpdesk and ticket management"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>New Ticket</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Open Tickets" value={open} icon={<MessageSquare className="h-4 w-4" />} iconColor="bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400" />
        <StatCard label="In Progress" value={inProgress} icon={<Clock className="h-4 w-4" />} iconColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
        <StatCard label="Resolved Today" value={1} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard label="SLA Breaches" value={0} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-4 pb-3">
          <SearchInput placeholder="Search tickets..." value={search} onChange={setSearch} className="w-72" />
        </div>
        <TabBar
          tabs={[{ id: 'all', label: 'All', count: TICKETS.length }, { id: 'open', label: 'Open', count: open }, { id: 'inprogress', label: 'In Progress', count: inProgress }]}
          active={tab} onChange={setTab}
        />
        <Table>
          <Thead>
            <tr>
              <Th>Ticket ID</Th>
              <Th>Subject</Th>
              <Th>Requester</Th>
              <Th>Type</Th>
              <Th>Priority</Th>
              <Th>SLA</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {TICKETS
              .filter(t => {
                const matchTab = tab === 'all' || (tab === 'open' && t.status === 'Open') || (tab === 'inprogress' && t.status === 'In Progress')
                const matchSearch = !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase())
                return matchTab && matchSearch
              })
              .map(t => (
                <Tr key={t.id}>
                  <Td><span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">{t.id}</span></Td>
                  <Td><span className="font-medium text-slate-800 dark:text-slate-200 max-w-xs block truncate">{t.subject}</span></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar name={t.requester} size="xs" />
                      <span className="text-xs text-slate-500">{t.requester}</span>
                    </div>
                  </Td>
                  <Td><Badge variant="neutral" size="sm">{t.type}</Badge></Td>
                  <Td><Badge variant={PRIORITY_COLOR[t.priority]} size="sm">{t.priority}</Badge></Td>
                  <Td>
                    <span className={`text-xs ${t.sla.includes('30m') ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                      {t.sla}
                    </span>
                  </Td>
                  <Td><Badge variant={STATUS_COLOR[t.status]} dot>{t.status}</Badge></Td>
                  <Td>
                    <Button variant="ghost" size="sm">View</Button>
                  </Td>
                </Tr>
              ))}
          </Tbody>
        </Table>
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500">{TICKETS.length} total tickets</p>
        </div>
      </Card>
    </div>
  )
}
