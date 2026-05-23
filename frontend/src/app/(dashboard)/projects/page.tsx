'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, ProgressBar, EmptyState
} from '@/components/ui'
import { Zap, CheckCircle2, Clock, AlertTriangle, Plus, CalendarDays, Users } from 'lucide-react'

type ProjStatus = 'In Progress' | 'Planning' | 'Completed' | 'On Hold'
type TaskStatus = 'Todo' | 'In Progress' | 'In Review' | 'Blocked' | 'Done'

type Project = {
  id: string; name: string; status: ProjStatus; progress: number
  team: string[]; due: string; priority: 'High' | 'Medium' | 'Low'
  tasks: { total: number; done: number }; description: string
}

type Task = {
  id: string; title: string; project: string; assignee: string; due: string
  priority: 'High' | 'Medium' | 'Low'; status: TaskStatus
}

const PROJECTS: Project[] = [
  { id: 'P1', name: 'PRSK Mobile App', status: 'In Progress', progress: 68, team: ['Priya Sharma', 'Divya Nair', 'Vikram Joshi'], due: '30 Jun 2026', priority: 'High', tasks: { total: 24, done: 16 }, description: 'iOS & Android mobile app for employee self-service.' },
  { id: 'P2', name: 'CRM Integration v2', status: 'In Progress', progress: 40, team: ['Karan Singh', 'Sneha Reddy'], due: '15 Jul 2026', priority: 'Medium', tasks: { total: 18, done: 7 }, description: 'Deeper CRM ↔ Finance integration with auto-invoicing.' },
  { id: 'P3', name: 'Q2 Infrastructure Upgrade', status: 'Planning', progress: 10, team: ['Vikram Joshi', 'Amit Patel'], due: '31 Jul 2026', priority: 'Low', tasks: { total: 12, done: 1 }, description: 'Kubernetes migration and DB performance improvements.' },
  { id: 'P4', name: 'IATF Compliance Module', status: 'Completed', progress: 100, team: ['Priya Sharma', 'Ananya Iyer'], due: '01 May 2026', priority: 'High', tasks: { total: 30, done: 30 }, description: 'IATF 16949 compliance tracking and reporting module.' },
]

const TASKS: Task[] = [
  { id: 'T1', title: 'Design auth flow mockups', project: 'PRSK Mobile App', assignee: 'Priya Sharma', due: '14 May', priority: 'High', status: 'In Progress' },
  { id: 'T2', title: 'API endpoint for lead scoring', project: 'CRM Integration v2', assignee: 'Karan Singh', due: '16 May', priority: 'Medium', status: 'Todo' },
  { id: 'T3', title: 'Write infra migration runbook', project: 'Q2 Infrastructure Upgrade', assignee: 'Vikram Joshi', due: '20 May', priority: 'Low', status: 'Todo' },
  { id: 'T4', title: 'QA regression testing', project: 'PRSK Mobile App', assignee: 'Divya Nair', due: '18 May', priority: 'High', status: 'Blocked' },
  { id: 'T5', title: 'Update API docs', project: 'CRM Integration v2', assignee: 'Sneha Reddy', due: '15 May', priority: 'Medium', status: 'In Review' },
  { id: 'T6', title: 'Push notification service', project: 'PRSK Mobile App', assignee: 'Priya Sharma', due: '22 May', priority: 'High', status: 'Todo' },
]

const PROJ_STATUS_COLOR: Record<ProjStatus, 'info' | 'neutral' | 'success' | 'warning'> = {
  'In Progress': 'info', Planning: 'neutral', Completed: 'success', 'On Hold': 'warning',
}
const TASK_STATUS_COLOR: Record<TaskStatus, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  'In Progress': 'info', Todo: 'neutral', Blocked: 'danger', 'In Review': 'warning', Done: 'success',
}
const PRIORITY_COLOR: Record<string, 'danger' | 'warning' | 'neutral'> = {
  High: 'danger', Medium: 'warning', Low: 'neutral',
}

export default function ProjectsPage() {
  const [tab, setTab] = useState('projects')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Project | null>(null)
  const [newProj, setNewProj] = useState(false)

  const active = PROJECTS.filter(p => p.status === 'In Progress').length
  const completed = PROJECTS.filter(p => p.status === 'Completed').length
  const openTasks = TASKS.filter(t => t.status !== 'Done').length
  const blocked = TASKS.filter(t => t.status === 'Blocked').length

  const filteredTasks = useMemo(() =>
    TASKS.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.project.toLowerCase().includes(search.toLowerCase())), [search])

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Projects"
        description="Track projects, milestones, and team delivery"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewProj(true)}>New Project</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value={active} icon={<Zap className="h-4 w-4" />} iconColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
        <StatCard label="Completed" value={completed} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard label="Open Tasks" value={openTasks} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <StatCard label="Blocked" value={blocked} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400" />
      </div>

      <TabBar
        tabs={[{ id: 'projects', label: 'Projects', count: PROJECTS.length }, { id: 'tasks', label: 'Tasks', count: openTasks }]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'projects' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PROJECTS.map(p => (
            <Card key={p.id} hover onClick={() => setSelected(p)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.description}</p>
                </div>
                <Badge variant={PROJ_STATUS_COLOR[p.status]} className="ml-2 flex-shrink-0">{p.status}</Badge>
              </div>

              <div className="mb-3">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-slate-500">Progress</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">{p.tasks.done}/{p.tasks.total} tasks</span>
                </div>
                <ProgressBar value={p.tasks.done} max={p.tasks.total} color={p.progress === 100 ? 'emerald' : 'indigo'} size="sm" showLabel />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3 text-slate-400" />
                  <span className="text-xs text-slate-500">{p.due}</span>
                  <Badge variant={PRIORITY_COLOR[p.priority]} size="sm" className="ml-1">{p.priority}</Badge>
                </div>
                <div className="flex -space-x-1.5">
                  {p.team.slice(0, 3).map(name => (
                    <Avatar key={name} name={name} size="xs" className="ring-1 ring-white dark:ring-slate-900" />
                  ))}
                  {p.team.length > 3 && (
                    <span className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 text-[9px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center ring-1 ring-white dark:ring-slate-900">
                      +{p.team.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'tasks' && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-4">
            <SearchInput placeholder="Search tasks or projects..." value={search} onChange={setSearch} className="w-72" />
          </div>
          {filteredTasks.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="h-6 w-6" />} title="No tasks found" />
          ) : (
            <Table>
              <Thead><tr><Th>Task</Th><Th>Project</Th><Th>Assignee</Th><Th>Due</Th><Th>Priority</Th><Th>Status</Th></tr></Thead>
              <Tbody>
                {filteredTasks.map(t => (
                  <Tr key={t.id}>
                    <Td><span className="font-medium text-slate-800 dark:text-slate-200">{t.title}</span></Td>
                    <Td><Badge variant="neutral" size="sm">{t.project}</Badge></Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <Avatar name={t.assignee} size="xs" />
                        <span className="text-xs text-slate-500">{t.assignee.split(' ')[0]}</span>
                      </div>
                    </Td>
                    <Td><span className="text-xs text-slate-500">{t.due}</span></Td>
                    <Td><Badge variant={PRIORITY_COLOR[t.priority]} size="sm">{t.priority}</Badge></Td>
                    <Td><Badge variant={TASK_STATUS_COLOR[t.status]} dot>{t.status}</Badge></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {/* Project Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Project Details" size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          <Button size="sm">Open Board</Button>
        </>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{selected.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{selected.description}</p>
              </div>
              <Badge variant={PROJ_STATUS_COLOR[selected.status]}>{selected.status}</Badge>
            </div>
            <div className="mb-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Overall Progress</span>
                <span>{selected.progress}%</span>
              </div>
              <ProgressBar value={selected.progress} color={selected.progress === 100 ? 'emerald' : 'indigo'} size="md" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-400 mb-0.5">Due Date</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{selected.due}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Priority</p><Badge variant={PRIORITY_COLOR[selected.priority]}>{selected.priority}</Badge></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Tasks Done</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{selected.tasks.done} / {selected.tasks.total}</p></div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Team ({selected.team.length})</p>
                <div className="flex -space-x-1">
                  {selected.team.map(name => <Avatar key={name} name={name} size="sm" className="ring-1 ring-white dark:ring-slate-900" />)}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* New Project Modal */}
      <Modal open={newProj} onClose={() => setNewProj(false)} title="Create New Project" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewProj(false)}>Cancel</Button>
          <Button size="sm">Create Project</Button>
        </>}
      >
        <div className="space-y-4">
          <Input label="Project Name" placeholder="e.g. Customer Portal Redesign" required />
          <Textarea label="Description" placeholder="Brief description of goals and scope..." rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Due Date" type="date" />
            <Select label="Priority" options={[{ label: 'High', value: 'High' }, { label: 'Medium', value: 'Medium' }, { label: 'Low', value: 'Low' }]} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
