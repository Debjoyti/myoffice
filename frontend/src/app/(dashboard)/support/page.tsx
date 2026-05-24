'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, TabBar, Modal, Input, Select, Textarea, DetailGrid
} from '@/components/ui'
import { MessageSquare, Clock, CheckCircle2, AlertTriangle, Plus, FlaskConical } from 'lucide-react'

type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed'
type Priority = 'Critical' | 'High' | 'Medium' | 'Low'

type Ticket = {
  id: string; subject: string; requester: string; type: string
  priority: Priority; status: TicketStatus; created: string; sla: string; description: string
}

const TICKETS: Ticket[] = [
  { id: 'TKT-1041', subject: 'Unable to access payroll module', requester: 'Rahul Mehta', type: 'Bug', priority: 'High', status: 'Open', created: '13 May, 09:15', sla: '2h remaining', description: 'Getting a 403 error when navigating to /payroll after the latest deployment.' },
  { id: 'TKT-1040', subject: 'Request: Add new employee onboarding flow', requester: 'Ananya Iyer', type: 'Feature', priority: 'Medium', status: 'In Progress', created: '12 May, 14:30', sla: '18h remaining', description: 'Need a guided onboarding checklist for new joiners with document upload support.' },
  { id: 'TKT-1039', subject: 'Salary slip download not working on mobile', requester: 'Karan Singh', type: 'Bug', priority: 'High', status: 'Resolved', created: '11 May, 11:00', sla: 'Resolved in 4h', description: 'PDF download triggers a blank page on iOS Safari.' },
  { id: 'TKT-1038', subject: 'Leave balance showing incorrect count', requester: 'Priya Sharma', type: 'Bug', priority: 'Critical', status: 'Open', created: '11 May, 08:45', sla: '30m remaining', description: 'Annual leave balance is showing 12 days instead of 18. Affects multiple employees.' },
  { id: 'TKT-1037', subject: 'Export CSV format inconsistency', requester: 'Divya Nair', type: 'Feature', priority: 'Low', status: 'Closed', created: '10 May, 16:00', sla: 'Closed', description: 'Date format in CSV exports should follow DD/MM/YYYY per Indian standards.' },
]

const STATUS_COLOR: Record<TicketStatus, 'danger' | 'info' | 'success' | 'neutral'> = {
  Open: 'danger', 'In Progress': 'info', Resolved: 'success', Closed: 'neutral',
}
const PRIORITY_COLOR: Record<Priority, 'danger' | 'warning' | 'neutral'> = {
  Critical: 'danger', High: 'danger', Medium: 'warning', Low: 'neutral',
}

export default function SupportPage() {
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [newTicket, setNewTicket] = useState(false)

  const open = TICKETS.filter(t => t.status === 'Open').length
  const inProgress = TICKETS.filter(t => t.status === 'In Progress').length
  const resolved = TICKETS.filter(t => t.status === 'Resolved').length

  const filtered = useMemo(() => {
    const byTab = tab === 'open' ? TICKETS.filter(t => t.status === 'Open')
      : tab === 'inprogress' ? TICKETS.filter(t => t.status === 'In Progress')
      : TICKETS
    return byTab.filter(t => !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.requester.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()))
  }, [tab, search])

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Demo banner */}
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — Support tickets are illustrative. Helpdesk integration is on the roadmap.</span>
      </div>

      <PageHeader
        title="Support"
        description="Internal helpdesk and IT ticket management"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewTicket(true)}>New Ticket</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Open Tickets" value={open} icon={<MessageSquare className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
        <StatCard label="In Progress" value={inProgress} icon={<Clock className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Resolved Today" value={resolved} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Avg Resolution" value="3.8h" icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-4 flex items-center gap-3">
          <SearchInput placeholder="Search tickets, subjects, requesters..." value={search} onChange={setSearch} className="w-80" />
        </div>
        <TabBar
          tabs={[
            { id: 'all', label: 'All Tickets', count: TICKETS.length },
            { id: 'open', label: 'Open', count: open },
            { id: 'inprogress', label: 'In Progress', count: inProgress },
          ]}
          active={tab}
          onChange={setTab}
          className="px-5"
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
            </tr>
          </Thead>
          <Tbody>
            {filtered.map(t => (
              <Tr key={t.id} onClick={() => setSelected(t)}>
                <Td><span className="font-mono text-xs font-medium text-blue-600">{t.id}</span></Td>
                <Td>
                  <span className="font-medium text-slate-800 max-w-64 truncate block">{t.subject}</span>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <Avatar name={t.requester} size="xs" />
                    <span className="text-xs text-slate-600">{t.requester}</span>
                  </div>
                </Td>
                <Td><Badge variant="neutral" size="sm">{t.type}</Badge></Td>
                <Td>
                  <Badge variant={PRIORITY_COLOR[t.priority]} size="sm" dot>
                    {t.priority}
                  </Badge>
                </Td>
                <Td>
                  <span className={`text-xs ${t.sla.includes('remaining') && t.sla.startsWith('30') ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                    {t.sla}
                  </span>
                </Td>
                <Td><Badge variant={STATUS_COLOR[t.status]} dot>{t.status}</Badge></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">{filtered.length} tickets shown</p>
        </div>
      </Card>

      {/* Ticket Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.id ?? ''} size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          {selected?.status === 'Open' && <Button variant="secondary" size="sm">Assign to Me</Button>}
          {selected?.status !== 'Closed' && selected?.status !== 'Resolved' && <Button size="sm">Resolve Ticket</Button>}
        </>}
      >
        {selected && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900">{selected.subject}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={STATUS_COLOR[selected.status]} dot>{selected.status}</Badge>
                <Badge variant={PRIORITY_COLOR[selected.priority]} dot>{selected.priority} Priority</Badge>
                <Badge variant="neutral">{selected.type}</Badge>
              </div>
            </div>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 leading-relaxed">
              {selected.description}
            </p>
            <DetailGrid items={[
              { label: 'Requester', value: <span className="flex items-center gap-1.5"><Avatar name={selected.requester} size="xs" />{selected.requester}</span> },
              { label: 'Created', value: selected.created },
              { label: 'SLA', value: <span className={selected.sla.includes('30m') ? 'text-red-600 font-semibold' : ''}>{selected.sla}</span> },
            ]} cols={2} />
            <div>
              <p className="text-xs text-slate-400 mb-2">Add Response</p>
              <Textarea placeholder="Type your response or resolution steps..." rows={3} />
            </div>
          </div>
        )}
      </Modal>

      {/* New Ticket Modal */}
      <Modal open={newTicket} onClose={() => setNewTicket(false)} title="Create New Ticket" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewTicket(false)}>Cancel</Button>
          <Button size="sm">Submit Ticket</Button>
        </>}
      >
        <div className="space-y-4">
          <Input label="Subject" placeholder="Brief description of the issue" required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" options={[{ label: 'Bug', value: 'Bug' }, { label: 'Feature Request', value: 'Feature' }, { label: 'Access Issue', value: 'Access' }, { label: 'Other', value: 'Other' }]} />
            <Select label="Priority" options={[{ label: 'Critical', value: 'Critical' }, { label: 'High', value: 'High' }, { label: 'Medium', value: 'Medium' }, { label: 'Low', value: 'Low' }]} />
          </div>
          <Textarea label="Description" placeholder="Detailed description of the issue, steps to reproduce, screenshots if any..." rows={4} required />
        </div>
      </Modal>
    </div>
  )
}
