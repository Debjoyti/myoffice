'use client'

import { useState } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, Modal, Input, Select, Textarea, EmptyState
} from '@/components/ui'
import { Target, Clock, CheckCircle2, AlertTriangle, Plus, FlaskConical } from 'lucide-react'

type PIPStatus = 'Active' | 'Completed' | 'Extended' | 'Terminated'

type PIPRecord = {
  id: string; employee: string; department: string; manager: string
  startDate: string; endDate: string; goals: string
  progress: number; status: PIPStatus; concerns: string
}

const PIPS: PIPRecord[] = [
  { id: 'PIP-001', employee: 'Sanjay Verma', department: 'Engineering', manager: 'Rahul Mehta', startDate: '01 May 2026', endDate: '31 Jul 2026', goals: 'Complete 3 PRs weekly; reduce bug reopen rate to <5%; attend all sprint ceremonies', progress: 40, status: 'Active', concerns: 'Low code quality and missed deadlines in Q1 2026' },
  { id: 'PIP-002', employee: 'Rekha Sharma', department: 'Sales', manager: 'Karan Singh', startDate: '01 Apr 2026', endDate: '30 Jun 2026', goals: 'Achieve 80% of monthly sales target; improve follow-up response time to <24h', progress: 75, status: 'Active', concerns: 'Consistently missing Q4 2025 and Q1 2026 sales targets' },
  { id: 'PIP-003', employee: 'Vivek Rao', department: 'Finance', manager: 'Ananya Iyer', startDate: '01 Mar 2026', endDate: '31 May 2026', goals: 'Zero reconciliation errors; submit monthly reports by 5th of each month', progress: 100, status: 'Completed', concerns: 'Multiple financial reporting errors in FY 2025–26' },
]

const STATUS_COLOR: Record<PIPStatus, 'warning' | 'success' | 'info' | 'danger'> = {
  Active: 'warning', Completed: 'success', Extended: 'info', Terminated: 'danger',
}

export default function PIPPage() {
  const [selected, setSelected] = useState<PIPRecord | null>(null)
  const [newModal, setNewModal] = useState(false)

  const active = PIPS.filter(p => p.status === 'Active').length
  const completed = PIPS.filter(p => p.status === 'Completed').length

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — PIP data is illustrative. Performance management module is on the roadmap.</span>
      </div>

      <PageHeader
        title="Performance Improvement Plans"
        description="Track PIPs, goals, and employee performance recovery with manager oversight"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewModal(true)}>Create PIP</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active PIPs" value={active} icon={<Target className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Completed" value={completed} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Avg Progress" value={`${Math.round(PIPS.reduce((s, p) => s + p.progress, 0) / PIPS.length)}%`} icon={<Clock className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Departments" value={new Set(PIPS.map(p => p.department)).size} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
      </div>

      {PIPS.length === 0 ? (
        <Card><EmptyState icon={<Target className="h-6 w-6" />} title="No PIPs created" /></Card>
      ) : (
        <div className="space-y-3">
          {PIPS.map(p => (
            <Card key={p.id} hover onClick={() => setSelected(p)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar name={p.employee} size="md" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{p.employee}</p>
                    <p className="text-xs text-slate-500">{p.department} · Manager: {p.manager}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_COLOR[p.status]}>{p.status}</Badge>
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-3 line-clamp-2">{p.goals}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Progress</span>
                  <span className="font-semibold text-slate-700">{p.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${p.progress === 100 ? 'bg-emerald-500' : p.progress >= 60 ? 'bg-blue-500' : 'bg-amber-400'}`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                <span>{p.startDate} → {p.endDate}</span>
                <span>{p.department}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`PIP — ${selected?.employee}`} size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          {selected?.status === 'Active' && <Button size="sm">Update Progress</Button>}
        </>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={selected.employee} size="md" />
              <div>
                <p className="font-semibold text-slate-900">{selected.employee}</p>
                <p className="text-sm text-slate-500">{selected.department} · Manager: {selected.manager}</p>
              </div>
              <div className="ml-auto"><Badge variant={STATUS_COLOR[selected.status]}>{selected.status}</Badge></div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-800 mb-1">Performance Concerns</p>
              <p className="text-xs text-amber-700">{selected.concerns}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Goals & Expectations</p>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 leading-relaxed">{selected.goals}</p>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Overall Progress</span>
                <span className="font-semibold text-slate-700">{selected.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${selected.progress === 100 ? 'bg-emerald-500' : selected.progress >= 60 ? 'bg-blue-500' : 'bg-amber-400'}`}
                  style={{ width: `${selected.progress}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-0.5">Start Date</p>
                <p className="text-sm font-semibold text-slate-800">{selected.startDate}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-0.5">Review Date</p>
                <p className="text-sm font-semibold text-slate-800">{selected.endDate}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* New PIP Modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="Create PIP" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm">Create PIP</Button>
        </>}
      >
        <div className="space-y-4">
          <Input label="Employee Name" placeholder="Select employee..." required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" required />
            <Input label="Review Date" type="date" required />
          </div>
          <Textarea label="Performance Concerns" placeholder="Describe the performance issues observed..." rows={3} required />
          <Textarea label="Goals & Expectations" placeholder="List specific, measurable goals..." rows={3} required />
        </div>
      </Modal>
    </div>
  )
}
