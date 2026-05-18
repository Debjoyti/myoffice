'use client'

import { PageHeader, Card, CardHeader, Badge, Avatar, Button, StatCard, TabBar } from '@/components/ui'
import { useState } from 'react'
import { Zap, CheckCircle2, Clock, AlertTriangle, Plus } from 'lucide-react'

const PROJECTS = [
  {
    id: 'P1', name: 'PRSK Mobile App', status: 'In Progress', progress: 68, team: ['Priya Sharma', 'Divya Nair', 'Vikram Joshi'],
    due: '30 Jun 2026', priority: 'High', tasks: { total: 24, done: 16 }
  },
  {
    id: 'P2', name: 'CRM Integration v2', status: 'In Progress', progress: 40, team: ['Karan Singh', 'Sneha Reddy'],
    due: '15 Jul 2026', priority: 'Medium', tasks: { total: 18, done: 7 }
  },
  {
    id: 'P3', name: 'Q2 Infrastructure Upgrade', status: 'Planning', progress: 10, team: ['Vikram Joshi', 'Amit Patel'],
    due: '31 Jul 2026', priority: 'Low', tasks: { total: 12, done: 1 }
  },
  {
    id: 'P4', name: 'IATF Compliance Module', status: 'Completed', progress: 100, team: ['Priya Sharma', 'Ananya Iyer'],
    due: '01 May 2026', priority: 'High', tasks: { total: 30, done: 30 }
  },
]

const TASKS = [
  { title: 'Design auth flow mockups', project: 'PRSK Mobile App', assignee: 'Priya Sharma', due: '14 May', priority: 'High', status: 'In Progress' },
  { title: 'API endpoint for lead scoring', project: 'CRM Integration v2', assignee: 'Karan Singh', due: '16 May', priority: 'Medium', status: 'Todo' },
  { title: 'Write infra migration runbook', project: 'Q2 Infrastructure Upgrade', assignee: 'Vikram Joshi', due: '20 May', priority: 'Low', status: 'Todo' },
  { title: 'QA regression testing', project: 'PRSK Mobile App', assignee: 'Divya Nair', due: '18 May', priority: 'High', status: 'Blocked' },
  { title: 'Update API docs', project: 'CRM Integration v2', assignee: 'Sneha Reddy', due: '15 May', priority: 'Medium', status: 'In Review' },
]

const PRIORITY_COLOR: Record<string, 'danger' | 'warning' | 'neutral'> = { High: 'danger', Medium: 'warning', Low: 'neutral' }
const TASK_STATUS_COLOR: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  'In Progress': 'info', Todo: 'neutral', Blocked: 'danger', 'In Review': 'warning', Done: 'success',
}

export default function ProjectsPage() {
  const [tab, setTab] = useState('projects')

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Projects"
        description="Track projects, tasks, and team delivery"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>New Project</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value={PROJECTS.filter(p => p.status === 'In Progress').length} icon={<Zap className="h-4 w-4" />} />
        <StatCard label="Completed" value={PROJECTS.filter(p => p.status === 'Completed').length} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard label="Open Tasks" value={TASKS.filter(t => t.status !== 'Done').length} icon={<Clock className="h-4 w-4" />} iconColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
        <StatCard label="Blocked" value={TASKS.filter(t => t.status === 'Blocked').length} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400" />
      </div>

      <div>
        <TabBar tabs={[{ id: 'projects', label: 'Projects' }, { id: 'tasks', label: 'Tasks' }]} active={tab} onChange={setTab} />
      </div>

      {tab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROJECTS.map(p => (
            <Card key={p.id} hover>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Due: {p.due}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={PRIORITY_COLOR[p.priority]} size="sm">{p.priority}</Badge>
                  <Badge variant={p.status === 'Completed' ? 'success' : p.status === 'Planning' ? 'neutral' : 'info'} dot size="sm">{p.status}</Badge>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">{p.tasks.done}/{p.tasks.total} tasks</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{p.progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${p.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>

              {/* Team */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {p.team.slice(0, 3).map(member => (
                    <Avatar key={member} name={member} size="xs" className="ring-2 ring-white dark:ring-slate-900" />
                  ))}
                  {p.team.length > 3 && (
                    <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-semibold text-slate-500 flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                      +{p.team.length - 3}
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="sm">View Project →</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'tasks' && (
        <Card padding="none">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {TASKS.map(task => (
              <div key={task.title} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{task.project}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Avatar name={task.assignee} size="xs" />
                    <span className="text-xs text-slate-500 hidden sm:block">{task.assignee.split(' ')[0]}</span>
                  </div>
                  <Badge variant={PRIORITY_COLOR[task.priority]} size="sm">{task.priority}</Badge>
                  <Badge variant={TASK_STATUS_COLOR[task.status]} size="sm" dot>{task.status}</Badge>
                  <span className="text-xs text-slate-400 hidden sm:block">{task.due}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
