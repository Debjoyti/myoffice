'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, Modal, Input, Select, Textarea, EmptyState
} from '@/components/ui'
import { Clock, CheckCircle2, Play, Calendar, Plus, FlaskConical } from 'lucide-react'

type TSStatus = 'Draft' | 'Submitted' | 'Approved'

type Entry = {
  id: string; employee: string; project: string; task: string
  date: string; hours: number; description: string; status: TSStatus
}

const ENTRIES: Entry[] = [
  { id: 'TS-001', employee: 'Priya Sharma', project: 'PRSK Mobile App', task: 'Auth flow design', date: '27 May 2026', hours: 6, description: 'Wireframes and Figma prototypes for login screen', status: 'Submitted' },
  { id: 'TS-002', employee: 'Karan Singh', project: 'CRM Integration v2', task: 'Lead scoring API', date: '27 May 2026', hours: 8, description: 'Built lead score endpoint with ML model integration', status: 'Approved' },
  { id: 'TS-003', employee: 'Rahul Mehta', project: 'Q2 Infrastructure', task: 'K8s migration plan', date: '26 May 2026', hours: 4, description: 'Documented Kubernetes migration steps and rollback plan', status: 'Draft' },
  { id: 'TS-004', employee: 'Ananya Iyer', project: 'PRSK Mobile App', task: 'QA regression', date: '26 May 2026', hours: 7, description: 'Tested 45 test cases; 3 bugs found in payroll module', status: 'Submitted' },
  { id: 'TS-005', employee: 'Vikram Joshi', project: 'CRM Integration v2', task: 'Frontend dashboard', date: '25 May 2026', hours: 5, description: 'Built CRM analytics widgets with Chart.js', status: 'Approved' },
]

const STATUS_COLOR: Record<TSStatus, 'neutral' | 'info' | 'success'> = {
  Draft: 'neutral', Submitted: 'info', Approved: 'success',
}

export default function TimesheetsPage() {
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)

  const totalHours = ENTRIES.reduce((s, e) => s + e.hours, 0)
  const approved = ENTRIES.filter(e => e.status === 'Approved')
  const pending = ENTRIES.filter(e => e.status === 'Submitted')

  const filtered = useMemo(() =>
    ENTRIES.filter(e =>
      !search ||
      e.employee.toLowerCase().includes(search.toLowerCase()) ||
      e.project.toLowerCase().includes(search.toLowerCase()) ||
      e.task.toLowerCase().includes(search.toLowerCase())
    ),
    [search]
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — Timesheet data is illustrative. Full timesheet integration with projects is on the roadmap.</span>
      </div>

      <PageHeader
        title="Timesheets"
        description="Log work hours by project and task; submit for manager approval"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewModal(true)}>Log Hours</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Hours (Week)" value={totalHours} icon={<Clock className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Pending Approval" value={pending.length} icon={<Play className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Approved Entries" value={approved.length} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Avg Hours / Day" value={(totalHours / 5).toFixed(1)} icon={<Calendar className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-4">
          <SearchInput placeholder="Search by employee, project, or task..." value={search} onChange={setSearch} className="w-80" />
        </div>
        {filtered.length === 0 ? (
          <div className="py-10"><EmptyState icon={<Clock className="h-6 w-6" />} title="No timesheet entries found" /></div>
        ) : (
          <Table>
            <Thead><tr><Th>Employee</Th><Th>Project</Th><Th>Task</Th><Th>Date</Th><Th align="right">Hours</Th><Th>Description</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {filtered.map(e => (
                <Tr key={e.id}>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Avatar name={e.employee} size="xs" />
                      <span className="text-xs font-medium text-slate-700">{e.employee}</span>
                    </div>
                  </Td>
                  <Td><Badge variant="neutral" size="sm">{e.project}</Badge></Td>
                  <Td><span className="text-xs text-slate-600">{e.task}</span></Td>
                  <Td><span className="text-xs text-slate-500">{e.date}</span></Td>
                  <Td align="right"><span className="text-xs font-bold text-blue-700 tabular-nums">{e.hours}h</span></Td>
                  <Td><span className="text-xs text-slate-500 max-w-48 truncate block">{e.description}</span></Td>
                  <Td><Badge variant={STATUS_COLOR[e.status]} dot size="sm">{e.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">{filtered.length} entries · {filtered.reduce((s, e) => s + e.hours, 0)}h total</p>
        </div>
      </Card>

      <Modal open={newModal} onClose={() => setNewModal(false)} title="Log Hours" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm">Save Entry</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Project" options={[
              { label: 'PRSK Mobile App', value: 'p1' },
              { label: 'CRM Integration v2', value: 'p2' },
              { label: 'Q2 Infrastructure', value: 'p3' },
            ]} />
            <Input label="Task" placeholder="e.g. API development" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            <Input label="Hours" type="number" placeholder="0.0" min="0.5" max="24" step="0.5" required />
          </div>
          <Textarea label="Description" placeholder="What did you work on?" rows={3} />
        </div>
      </Modal>
    </div>
  )
}
