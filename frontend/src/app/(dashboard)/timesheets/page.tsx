'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, Modal, Input, Select, Textarea, EmptyState, Alert
} from '@/components/ui'
import { Clock, CheckCircle2, Play, Calendar, Plus, FlaskConical } from 'lucide-react'

type TSStatus = 'Draft' | 'Submitted' | 'Approved'

type Entry = {
  id: string; employee: string; project: string; task: string
  date: string; hours: number; description: string; status: TSStatus
}

const MOCK_ENTRIES: Entry[] = [
  { id: 'TS-001', employee: 'Priya Sharma', project: 'PRSK Mobile App', task: 'Auth flow design', date: '27 May 2026', hours: 6, description: 'Wireframes and Figma prototypes for login screen', status: 'Submitted' },
  { id: 'TS-002', employee: 'Karan Singh', project: 'CRM Integration v2', task: 'Lead scoring API', date: '27 May 2026', hours: 8, description: 'Built lead score endpoint with ML model integration', status: 'Approved' },
  { id: 'TS-003', employee: 'Rahul Mehta', project: 'Q2 Infrastructure', task: 'K8s migration plan', date: '26 May 2026', hours: 4, description: 'Documented Kubernetes migration steps and rollback plan', status: 'Draft' },
  { id: 'TS-004', employee: 'Ananya Iyer', project: 'PRSK Mobile App', task: 'QA regression', date: '26 May 2026', hours: 7, description: 'Tested 45 test cases; 3 bugs found in payroll module', status: 'Submitted' },
  { id: 'TS-005', employee: 'Vikram Joshi', project: 'CRM Integration v2', task: 'Frontend dashboard', date: '25 May 2026', hours: 5, description: 'Built CRM analytics widgets with Chart.js', status: 'Approved' },
]

const STATUS_COLOR: Record<TSStatus, 'neutral' | 'info' | 'success'> = {
  Draft: 'neutral', Submitted: 'info', Approved: 'success',
}

const PROJECT_OPTIONS = [
  { label: 'PRSK Mobile App', value: 'PRSK Mobile App' },
  { label: 'CRM Integration v2', value: 'CRM Integration v2' },
  { label: 'Q2 Infrastructure', value: 'Q2 Infrastructure' },
  { label: 'Internal Tools', value: 'Internal Tools' },
]

const today = new Date().toISOString().split('T')[0]
const INITIAL_FORM = { project: 'PRSK Mobile App', task: '', date: today, hours: '', description: '' }

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

export default function TimesheetsPage() {
  const [entries, setEntries] = useState<Entry[]>(MOCK_ENTRIES)
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formError, setFormError] = useState('')

  const totalHours = entries.reduce((s, e) => s + e.hours, 0)
  const approvedCount = entries.filter(e => e.status === 'Approved').length
  const pendingCount = entries.filter(e => e.status === 'Submitted').length

  const filtered = useMemo(() =>
    entries.filter(e =>
      !search ||
      e.employee.toLowerCase().includes(search.toLowerCase()) ||
      e.project.toLowerCase().includes(search.toLowerCase()) ||
      e.task.toLowerCase().includes(search.toLowerCase())
    ),
    [entries, search]
  )

  const handleSave = async () => {
    if (!form.task.trim()) { setFormError('Task description is required'); return }
    if (!form.hours || Number(form.hours) <= 0) { setFormError('Hours must be greater than 0'); return }
    if (Number(form.hours) > 24) { setFormError('Hours cannot exceed 24 per day'); return }
    setSaving(true)
    setFormError('')
    await new Promise(r => setTimeout(r, 400))
    setEntries(prev => [{
      id: `TS-${String(prev.length + 1).padStart(3, '0')}`,
      employee: 'You',
      project: form.project,
      task: form.task.trim(),
      date: fmtDate(form.date),
      hours: Number(form.hours),
      description: form.description.trim(),
      status: 'Draft',
    }, ...prev])
    setNewModal(false)
    setForm(INITIAL_FORM)
    setSaving(false)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — Timesheet data is illustrative. Full timesheet integration with projects is on the roadmap.</span>
      </div>

      <PageHeader
        title="Timesheets"
        description="Log work hours by project and task; submit for manager approval"
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setNewModal(true); setFormError('') }}>
            Log Hours
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Hours (Week)" value={totalHours} icon={<Clock className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Pending Approval" value={pendingCount} icon={<Play className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Approved Entries" value={approvedCount} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
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

      <Modal
        open={newModal}
        onClose={() => { setNewModal(false); setFormError('') }}
        title="Log Hours"
        size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSave}>Save Entry</Button>
        </>}
      >
        <div className="space-y-4">
          {formError && <Alert variant="danger">{formError}</Alert>}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Project"
              options={PROJECT_OPTIONS}
              value={form.project}
              onChange={e => setForm(f => ({ ...f, project: (e.target as HTMLSelectElement).value }))}
            />
            <Input
              label="Task"
              placeholder="e.g. API development"
              required
              value={form.task}
              onChange={e => setForm(f => ({ ...f, task: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              required
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
            <Input
              label="Hours"
              type="number"
              placeholder="0.0"
              min="0.5"
              max="24"
              step="0.5"
              required
              value={form.hours}
              onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
            />
          </div>
          <Textarea
            label="Description"
            placeholder="What did you work on?"
            rows={3}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
