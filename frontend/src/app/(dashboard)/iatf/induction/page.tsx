'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  EmptyState, Modal, Input, Textarea, Select, StatCard, Skeleton
} from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Plus, UserCheck, BookOpen, CheckCircle, Clock, AlertCircle } from 'lucide-react'

type InductionProgram = {
  id: string; title: string; description: string | null; total_duration_hours: number
  version: number; status: string; effective_from: string | null; is_active: boolean
}

type InductionRecord = {
  id: string; employee_id: string; program_id: string; scheduled_date: string | null
  completed_date: string | null; status: string; overall_score: number | null; remarks: string | null
  emp: { id: string; users: { full_name: string } } | null
  program: { title: string } | null
}

const STATUS_COLOR: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
  scheduled: 'info', in_progress: 'warning', completed: 'success', failed: 'danger'
}

export default function InductionPage() {
  const [loading, setLoading] = useState(true)
  const [programs, setPrograms] = useState<InductionProgram[]>([])
  const [records, setRecords] = useState<InductionRecord[]>([])
  const [showAddProgram, setShowAddProgram] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<InductionProgram | null>(null)
  const [saving, setSaving] = useState(false)

  const [programForm, setProgramForm] = useState({
    title: '', description: '', total_duration_hours: '8', effective_from: '',
  })
  const [scheduleForm, setScheduleForm] = useState({
    employee_id: '', program_id: '', scheduled_date: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [progRes, recRes] = await Promise.all([
        fetch('/api/v1/iatf/induction?view=programs'),
        fetch('/api/v1/iatf/induction?view=records'),
      ])
      if (progRes.ok) {
        const d = await progRes.json()
        setPrograms(d.data ?? [])
      }
      if (recRes.ok) {
        const d = await recRes.json()
        setRecords(d.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleCreateProgram() {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/iatf/induction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'program',
          ...programForm,
          total_duration_hours: parseFloat(programForm.total_duration_hours),
        }),
      })
      if (res.ok) {
        setShowAddProgram(false)
        setProgramForm({ title: '', description: '', total_duration_hours: '8', effective_from: '' })
        loadData()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleSchedule() {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/iatf/induction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'record', ...scheduleForm }),
      })
      if (res.ok) {
        setShowSchedule(false)
        setScheduleForm({ employee_id: '', program_id: '', scheduled_date: '' })
        loadData()
      }
    } finally {
      setSaving(false)
    }
  }

  const scheduledCount = records.filter(r => r.status === 'scheduled').length
  const completedCount = records.filter(r => r.status === 'completed').length
  const inProgressCount = records.filter(r => r.status === 'in_progress').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Induction Management"
        description="New hire induction programs, scheduling, and completion tracking"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddProgram(true)}>
              New Program
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowSchedule(true)}>
              Schedule Induction
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Programs" value={programs.length} icon={<BookOpen className="h-4 w-4" />} accent="indigo" />
        <StatCard label="Scheduled" value={scheduledCount} icon={<Clock className="h-4 w-4" />} accent="sky" />
        <StatCard label="In Progress" value={inProgressCount} icon={<AlertCircle className="h-4 w-4" />} accent="amber" />
        <StatCard label="Completed" value={completedCount} icon={<CheckCircle className="h-4 w-4" />} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Programs */}
        <Card padding="none">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <CardHeader title="Induction Programs" description="Version-controlled program library" />
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-16 w-full"/>)}</div>
          ) : programs.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-6 w-6" />}
              title="No programs defined"
              description="Create induction programs to onboard new employees."
              action={<Button size="sm" onClick={() => setShowAddProgram(true)}>New Program</Button>}
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {programs.map(prog => (
                <div
                  key={prog.id}
                  onClick={() => setSelectedProgram(prog)}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{prog.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Duration: {prog.total_duration_hours}h · v{prog.version}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={prog.is_active ? 'success' : 'neutral'} size="sm">{prog.is_active ? 'Active' : 'Inactive'}</Badge>
                      {prog.effective_from && <span className="text-xs text-slate-400">{formatDate(prog.effective_from)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Records */}
        <Card padding="none">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <CardHeader title="Induction Records" description="Per-employee induction status" />
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10 w-full"/>)}</div>
          ) : records.length === 0 ? (
            <EmptyState
              icon={<UserCheck className="h-6 w-6" />}
              title="No induction records"
              description="Schedule inductions for new employees."
              action={<Button size="sm" onClick={() => setShowSchedule(true)}>Schedule</Button>}
            />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Employee</Th>
                  <Th>Program</Th>
                  <Th>Scheduled</Th>
                  <Th>Status</Th>
                  <Th>Score</Th>
                </tr>
              </Thead>
              <Tbody>
                {records.map(r => (
                  <Tr key={r.id}>
                    <Td>{r.emp?.users?.full_name ?? 'Unknown'}</Td>
                    <Td><span className="text-xs text-slate-500 truncate max-w-[120px] block">{r.program?.title ?? '—'}</span></Td>
                    <Td>{r.scheduled_date ? formatDate(r.scheduled_date) : '—'}</Td>
                    <Td><Badge variant={STATUS_COLOR[r.status] ?? 'neutral'} size="sm" dot>{r.status.replace('_', ' ')}</Badge></Td>
                    <Td>{r.overall_score != null ? `${r.overall_score}%` : '—'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      </div>

      {/* Program Detail Modal */}
      <Modal
        open={!!selectedProgram}
        onClose={() => setSelectedProgram(null)}
        title={selectedProgram?.title ?? ''}
        size="md"
      >
        {selectedProgram && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Version:</span> <span className="font-medium">v{selectedProgram.version}</span></div>
              <div><span className="text-slate-500">Duration:</span> <span className="font-medium">{selectedProgram.total_duration_hours}h</span></div>
              <div><span className="text-slate-500">Status:</span> <Badge variant={selectedProgram.is_active ? 'success' : 'neutral'} size="sm">{selectedProgram.is_active ? 'Active' : 'Inactive'}</Badge></div>
              <div><span className="text-slate-500">Effective:</span> <span>{selectedProgram.effective_from ? formatDate(selectedProgram.effective_from) : '—'}</span></div>
            </div>
            {selectedProgram.description && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Description</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{selectedProgram.description}</p>
              </div>
            )}
            <div className="pt-2">
              <Button size="sm" onClick={() => { setShowSchedule(true); setScheduleForm(f => ({ ...f, program_id: selectedProgram.id })); setSelectedProgram(null) }}>
                Schedule for Employee
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Program Modal */}
      <Modal
        open={showAddProgram}
        onClose={() => setShowAddProgram(false)}
        title="Create Induction Program"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowAddProgram(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleCreateProgram}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Program Title" required value={programForm.title} onChange={e => setProgramForm(f => ({ ...f, title: e.target.value }))} />
          <Textarea label="Description" rows={3} value={programForm.description} onChange={e => setProgramForm(f => ({ ...f, description: e.target.value }))} />
          <Input label="Total Duration (hours)" type="number" value={programForm.total_duration_hours} onChange={e => setProgramForm(f => ({ ...f, total_duration_hours: e.target.value }))} />
          <Input label="Effective From" type="date" value={programForm.effective_from} onChange={e => setProgramForm(f => ({ ...f, effective_from: e.target.value }))} />
        </div>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        title="Schedule Induction"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowSchedule(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleSchedule}>Schedule</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Employee ID (UUID)" required placeholder="Enter employee UUID" value={scheduleForm.employee_id} onChange={e => setScheduleForm(f => ({ ...f, employee_id: e.target.value }))} />
          <Select
            label="Program"
            required
            options={[{ label: 'Select program...', value: '' }, ...programs.map(p => ({ label: p.title, value: p.id }))]}
            value={scheduleForm.program_id}
            onChange={e => setScheduleForm(f => ({ ...f, program_id: e.target.value }))}
          />
          <Input label="Scheduled Date" type="date" value={scheduleForm.scheduled_date} onChange={e => setScheduleForm(f => ({ ...f, scheduled_date: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
