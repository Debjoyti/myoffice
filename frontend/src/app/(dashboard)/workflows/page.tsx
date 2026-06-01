'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, Modal, Input, Select, Divider
} from '@/components/ui'
import {
  Zap, Plus, Play, Pause, Edit2, BarChart3, CheckCircle2, Clock,
  AlertTriangle, ArrowRight, Settings, RefreshCw, GitBranch
} from 'lucide-react'

const MOCK_WORKFLOWS = [
  { id: 'wf1', name: 'New Employee Onboarding', trigger: 'Employee status → Active', steps: 8, runs_total: 24, runs_success: 23, runs_failed: 1, last_run: '2026-05-30 10:15 AM', status: 'active', category: 'HR' },
  { id: 'wf2', name: 'Leave Request Approval', trigger: 'Leave application submitted', steps: 4, runs_total: 156, runs_success: 154, runs_failed: 2, last_run: '2026-05-31 9:00 AM', status: 'active', category: 'HR' },
  { id: 'wf3', name: 'PR → PO Auto-Conversion', trigger: 'PR status → Approved', steps: 3, runs_total: 38, runs_success: 38, runs_failed: 0, last_run: '2026-05-30 2:45 PM', status: 'active', category: 'Procurement' },
  { id: 'wf4', name: 'Invoice Payment Reminder', trigger: 'Invoice due in 7 days', steps: 2, runs_total: 64, runs_success: 62, runs_failed: 2, last_run: '2026-05-29 8:00 AM', status: 'active', category: 'Finance' },
  { id: 'wf5', name: 'Customer Onboarding Checklist', trigger: 'New subscription created', steps: 6, runs_total: 12, runs_success: 12, runs_failed: 0, last_run: '2026-05-28 3:00 PM', status: 'active', category: 'Sales' },
  { id: 'wf6', name: 'NCR to CAPA Auto-Raise', trigger: 'NCR severity → Major/Critical', steps: 4, runs_total: 8, runs_success: 7, runs_failed: 1, last_run: '2026-05-27 11:00 AM', status: 'paused', category: 'Quality' },
  { id: 'wf7', name: 'Birthday & Work Anniversary Alert', trigger: 'Daily 8 AM cron', steps: 3, runs_total: 152, runs_success: 152, runs_failed: 0, last_run: '2026-06-01 8:00 AM', status: 'active', category: 'HR' },
]

const MOCK_STEPS_SAMPLE = [
  { step: 1, type: 'trigger', name: 'Leave Application Submitted', icon: '⚡' },
  { step: 2, type: 'condition', name: 'If Leave Type = Sick Leave → Skip Manager', icon: '❓' },
  { step: 3, type: 'action', name: 'Notify Manager via Slack/Email', icon: '📧' },
  { step: 4, type: 'approval', name: 'Manager Approval (48hr timeout)', icon: '✅' },
  { step: 5, type: 'action', name: 'Update Leave Balance in HRMS', icon: '🔄' },
]

const CATEGORY_COLOR: Record<string, string> = {
  HR: 'bg-blue-50 text-blue-700', Finance: 'bg-emerald-50 text-emerald-700',
  Procurement: 'bg-violet-50 text-violet-700', Sales: 'bg-amber-50 text-amber-700',
  Quality: 'bg-red-50 text-red-700',
}

export default function WorkflowsPage() {
  const [tab, setTab] = useState('workflows')
  const [newWF, setNewWF] = useState(false)
  const [viewWF, setViewWF] = useState<any>(null)

  const active = MOCK_WORKFLOWS.filter(w => w.status === 'active').length
  const totalRuns = MOCK_WORKFLOWS.reduce((s, w) => s + w.runs_total, 0)
  const failedRuns = MOCK_WORKFLOWS.reduce((s, w) => s + w.runs_failed, 0)
  const successRate = Math.round(((totalRuns - failedRuns) / totalRuns) * 100)

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Workflow Automation"
        description="No-code automation — trigger actions across modules on any event, condition, or schedule"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<BarChart3 className="h-3.5 w-3.5" />}>Run History</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewWF(true)}>New Workflow</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Workflows" value={active.toString()} icon={<Zap className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Total Runs" value={totalRuns.toString()} icon={<RefreshCw className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="Success Rate" value={`${successRate}%`} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" delta={{ value: '+2% vs last month', positive: true }} />
        <StatCard label="Failed Runs" value={failedRuns.toString()} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
      </div>

      <TabBar tabs={[
        { id: 'workflows', label: 'All Workflows', count: MOCK_WORKFLOWS.length },
        { id: 'templates', label: 'Templates' },
        { id: 'logs', label: 'Run Logs' },
      ]} active={tab} onChange={setTab} />

      {tab === 'workflows' && (
        <div className="space-y-3">
          {MOCK_WORKFLOWS.map(wf => {
            const sr = Math.round(((wf.runs_total - wf.runs_failed) / wf.runs_total) * 100)
            return (
              <Card key={wf.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${wf.status === 'active' ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-800">{wf.name}</p>
                        <Badge variant={wf.status === 'active' ? 'success' : 'neutral'}>{wf.status}</Badge>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[wf.category]}`}>{wf.category}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Trigger: {wf.trigger} · {wf.steps} steps</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Last run: {wf.last_run}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Runs</p>
                      <p className="font-bold text-slate-700">{wf.runs_total}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Success</p>
                      <p className={`font-bold ${sr >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>{sr}%</p>
                    </div>
                    {wf.runs_failed > 0 && (
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Failed</p>
                        <p className="font-bold text-red-600">{wf.runs_failed}</p>
                      </div>
                    )}
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewWF(wf)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon"><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" title={wf.status === 'active' ? 'Pause' : 'Activate'}>
                        {wf.status === 'active' ? <Pause className="h-3.5 w-3.5 text-amber-600" /> : <Play className="h-3.5 w-3.5 text-emerald-600" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'templates' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { name: 'Employee Onboarding Checklist', cat: 'HR', steps: 8 },
            { name: 'Leave Approval Flow', cat: 'HR', steps: 4 },
            { name: 'Expense Approval', cat: 'Finance', steps: 3 },
            { name: 'PR → PO Conversion', cat: 'Procurement', steps: 3 },
            { name: 'Customer Welcome Series', cat: 'Sales', steps: 5 },
            { name: 'NCR → CAPA Escalation', cat: 'Quality', steps: 4 },
            { name: 'Invoice Payment Reminder', cat: 'Finance', steps: 2 },
            { name: 'Interview Scheduling', cat: 'HR', steps: 6 },
            { name: 'SLA Breach Alert', cat: 'Support', steps: 3 },
          ].map(t => (
            <Card key={t.name} className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start gap-2 mb-3">
                <Zap className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${CATEGORY_COLOR[t.cat] ?? 'bg-slate-100 text-slate-600'}`}>{t.cat}</span>
                    <span className="text-xs text-slate-400">{t.steps} steps</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs">Use Template</Button>
            </Card>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Recent Workflow Runs</p>
          </div>
          <Table>
            <Thead><tr><Th>Workflow</Th><Th>Triggered By</Th><Th>Started</Th><Th>Duration</Th><Th>Steps</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {[
                { wf: 'Leave Request Approval', by: 'Arjun Mehta submitted leave', at: '2026-06-01 9:00 AM', dur: '0.3s', steps: '4/4', status: 'success' },
                { wf: 'Birthday Alert', by: 'Cron 8:00 AM', at: '2026-06-01 8:00 AM', dur: '0.1s', steps: '3/3', status: 'success' },
                { wf: 'Invoice Payment Reminder', by: 'Invoice INV-2026-039 due', at: '2026-05-31 8:00 AM', dur: '0.2s', steps: '2/2', status: 'success' },
                { wf: 'NCR → CAPA Escalation', by: 'NCR-2026-008 raised', at: '2026-05-30 3:00 PM', dur: '1.2s', steps: '2/4', status: 'failed' },
              ].map((run, i) => (
                <Tr key={i}>
                  <Td><span className="font-medium text-slate-800">{run.wf}</span></Td>
                  <Td><span className="text-xs text-slate-500">{run.by}</span></Td>
                  <Td><span className="text-xs text-slate-500">{run.at}</span></Td>
                  <Td><span className="font-mono text-xs">{run.dur}</span></Td>
                  <Td><span className="text-sm">{run.steps}</span></Td>
                  <Td><Badge variant={run.status === 'success' ? 'success' : 'danger'}>{run.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {viewWF && (
        <Modal open={!!viewWF} onClose={() => setViewWF(null)} title={viewWF.name} size="lg"
          footer={<><Button variant="ghost" size="sm" onClick={() => setViewWF(null)}>Close</Button><Button size="sm" leftIcon={<Edit2 className="h-3.5 w-3.5" />}>Edit Workflow</Button></>}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="font-semibold text-slate-700">Trigger: {viewWF.trigger}</p>
            </div>
            <Divider label="Workflow Steps" />
            <div className="space-y-2">
              {MOCK_STEPS_SAMPLE.map((step, i) => (
                <div key={step.step} className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${step.type === 'trigger' ? 'bg-blue-100' : step.type === 'condition' ? 'bg-amber-100' : step.type === 'approval' ? 'bg-emerald-100' : 'bg-violet-100'}`}>
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{step.name}</p>
                    <p className="text-[10px] text-slate-400">{step.type}</p>
                  </div>
                  {i < MOCK_STEPS_SAMPLE.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-slate-300 absolute" style={{ display: 'none' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      <Modal open={newWF} onClose={() => setNewWF(false)} title="Create New Workflow" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewWF(false)}>Cancel</Button><Button variant="outline" size="sm">Save Draft</Button><Button size="sm" leftIcon={<Play className="h-3.5 w-3.5" />}>Activate Workflow</Button></>}
      >
        <div className="space-y-4">
          <Input label="Workflow Name *" required placeholder="e.g. New Employee Onboarding" />
          <Select label="Category" options={['HR','Finance','Procurement','Sales','Quality','Operations','Support'].map(c => ({ label: c, value: c }))} />
          <Divider label="Trigger" />
          <Select label="Trigger Type" options={[
            { label: 'Record Created (e.g. new employee)', value: 'create' },
            { label: 'Record Updated (e.g. status changed)', value: 'update' },
            { label: 'Scheduled (cron)', value: 'schedule' },
            { label: 'Form Submitted', value: 'form' },
            { label: 'Webhook', value: 'webhook' },
          ]} />
          <Select label="Module" options={['HRMS','Leave','Payroll','Procurement','Finance','Sales','Support','Quality'].map(m => ({ label: m, value: m }))} />
          <Divider label="First Action" />
          <Select label="Action Type" options={[
            { label: 'Send Email Notification', value: 'email' },
            { label: 'Send Slack/Teams Message', value: 'chat' },
            { label: 'Update Record Field', value: 'update' },
            { label: 'Create Task / Checklist', value: 'task' },
            { label: 'Request Approval', value: 'approval' },
            { label: 'Call Webhook (API)', value: 'webhook' },
          ]} />
          <p className="text-xs text-slate-400">You can add more steps after saving.</p>
        </div>
      </Modal>
    </div>
  )
}
