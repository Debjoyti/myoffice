'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  PageHeader, TabBar, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  Alert, EmptyState, Modal, Input, Select, Skeleton
} from '@/components/ui'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ShieldCheck, Plus, CheckCircle, AlertCircle, Clock } from 'lucide-react'

type ComplianceSettings = {
  esi_enabled: boolean; esi_wage_threshold: number; esi_employer_rate: number; esi_employee_rate: number
  pf_enabled: boolean; pf_employer_rate: number; pf_employee_rate: number; vpf_allowed: boolean
  pt_enabled: boolean; lwf_enabled: boolean; tds_enabled: boolean; gratuity_enabled: boolean
  notes: string | null
}

type GovtNotification = {
  id: string; notification_type: string; period_month: number | null; period_year: number | null
  due_date: string; amount_due: number | null; amount_paid: number | null
  status: string; filed_date: string | null; reference_number: string | null; remarks: string | null
}

const STATUS_COLOR: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
  filed: 'success', overdue: 'danger', pending: 'warning', waived: 'neutral'
}
const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const NOTIFICATION_TYPES = [
  { label: 'ESI', value: 'ESI' }, { label: 'PF', value: 'PF' },
  { label: 'PT', value: 'PT' }, { label: 'TDS', value: 'TDS' }, { label: 'LWF', value: 'LWF' },
]

export default function CompliancePage() {
  const [tab, setTab] = useState('settings')
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<ComplianceSettings | null>(null)
  const [notifications, setNotifications] = useState<GovtNotification[]>([])
  const [saving, setSaving] = useState(false)
  const [showAddNotif, setShowAddNotif] = useState(false)
  const [showFiledModal, setShowFiledModal] = useState<GovtNotification | null>(null)

  const [notifForm, setNotifForm] = useState({
    notification_type: 'PF', period_month: '', period_year: String(new Date().getFullYear()),
    due_date: '', amount_due: '', remarks: '',
  })
  const [filedForm, setFiledForm] = useState({ filed_date: '', reference_number: '', amount_paid: '' })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [settingsRes, notifRes] = await Promise.all([
        fetch('/api/v1/iatf/compliance'),
        fetch('/api/v1/iatf/govt-notifications'),
      ])
      if (settingsRes.ok) {
        const d = await settingsRes.json()
        setSettings(d.data)
      }
      if (notifRes.ok) {
        const d = await notifRes.json()
        setNotifications(d.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleSaveSettings() {
    if (!settings) return
    setSaving(true)
    try {
      await fetch('/api/v1/iatf/compliance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleAddNotification() {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/iatf/govt-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...notifForm,
          period_month: notifForm.period_month ? parseInt(notifForm.period_month) : undefined,
          period_year: parseInt(notifForm.period_year),
          amount_due: notifForm.amount_due ? parseFloat(notifForm.amount_due) : undefined,
        }),
      })
      if (res.ok) {
        setShowAddNotif(false)
        loadData()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkFiled() {
    if (!showFiledModal) return
    setSaving(true)
    try {
      const res = await fetch('/api/v1/iatf/govt-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: showFiledModal.id,
          status: 'filed',
          filed_date: filedForm.filed_date,
          reference_number: filedForm.reference_number,
          amount_paid: filedForm.amount_paid ? parseFloat(filedForm.amount_paid) : undefined,
        }),
      })
      if (res.ok) {
        setShowFiledModal(null)
        setFiledForm({ filed_date: '', reference_number: '', amount_paid: '' })
        loadData()
      }
    } finally {
      setSaving(false)
    }
  }

  const overdueCount = notifications.filter(n => n.status === 'overdue').length
  const pendingCount = notifications.filter(n => n.status === 'pending').length
  const filedCount = notifications.filter(n => n.status === 'filed').length

  const toggle = (key: keyof ComplianceSettings) => {
    if (!settings) return
    setSettings(s => s ? { ...s, [key]: !s[key as keyof ComplianceSettings] } : s)
  }

  const updateNum = (key: keyof ComplianceSettings, val: string) => {
    setSettings(s => s ? { ...s, [key]: parseFloat(val) || 0 } : s)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance & Settings"
        description="ESI, PF, PT, LWF configuration and government filing tracker"
        actions={
          tab === 'notifications' ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddNotif(true)}>
              Add Filing
            </Button>
          ) : tab === 'settings' ? (
            <Button loading={saving} onClick={handleSaveSettings}>
              Save Settings
            </Button>
          ) : undefined
        }
      />

      {overdueCount > 0 && (
        <Alert variant="danger" title={`${overdueCount} overdue filing${overdueCount > 1 ? 's' : ''}`}>
          You have pending statutory filings that are past their due date.
        </Alert>
      )}

      <TabBar
        tabs={[
          { id: 'settings', label: 'Settings' },
          { id: 'notifications', label: 'Govt Notifications', count: pendingCount + overdueCount },
          { id: 'audit', label: 'Gap Analysis' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* Settings Tab */}
      {tab === 'settings' && (
        loading ? (
          <div className="space-y-4">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-24 w-full"/>)}</div>
        ) : settings ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ESI Card */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">ESI (Employee State Insurance)</h3>
                  <p className="text-xs text-slate-500">Wage ceiling: ₹{settings.esi_wage_threshold}/month</p>
                </div>
                <button
                  onClick={() => toggle('esi_enabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.esi_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.esi_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {settings.esi_enabled && (
                <div className="space-y-3">
                  <Input label="Wage Threshold (INR)" type="number" value={String(settings.esi_wage_threshold)} onChange={e => updateNum('esi_wage_threshold', e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Employer Rate %" type="number" step="0.01" value={String(settings.esi_employer_rate)} onChange={e => updateNum('esi_employer_rate', e.target.value)} />
                    <Input label="Employee Rate %" type="number" step="0.01" value={String(settings.esi_employee_rate)} onChange={e => updateNum('esi_employee_rate', e.target.value)} />
                  </div>
                </div>
              )}
            </Card>

            {/* PF Card */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">PF (Provident Fund)</h3>
                  <p className="text-xs text-slate-500">Employer: {settings.pf_employer_rate}% | Employee: {settings.pf_employee_rate}%</p>
                </div>
                <button
                  onClick={() => toggle('pf_enabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.pf_enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.pf_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {settings.pf_enabled && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Employer Rate %" type="number" step="0.01" value={String(settings.pf_employer_rate)} onChange={e => updateNum('pf_employer_rate', e.target.value)} />
                    <Input label="Employee Rate %" type="number" step="0.01" value={String(settings.pf_employee_rate)} onChange={e => updateNum('pf_employee_rate', e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="vpf" checked={settings.vpf_allowed} onChange={() => toggle('vpf_allowed')} className="rounded" />
                    <label htmlFor="vpf" className="text-sm text-slate-700 dark:text-slate-300">Allow VPF (Voluntary PF)</label>
                  </div>
                </div>
              )}
            </Card>

            {/* PT / LWF / TDS / Gratuity Toggles */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Other Deductions</h3>
              <div className="space-y-4">
                {[
                  { key: 'pt_enabled', label: 'Professional Tax (PT)' },
                  { key: 'lwf_enabled', label: 'Labour Welfare Fund (LWF)' },
                  { key: 'tds_enabled', label: 'TDS on Salary' },
                  { key: 'gratuity_enabled', label: 'Gratuity Provision' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                    <button
                      onClick={() => toggle(item.key as keyof ComplianceSettings)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${settings[item.key as keyof ComplianceSettings] ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${settings[item.key as keyof ComplianceSettings] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Notes */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Notes</h3>
              <textarea
                className="w-full h-28 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Additional compliance notes..."
                value={settings.notes ?? ''}
                onChange={e => setSettings(s => s ? { ...s, notes: e.target.value } : s)}
              />
            </Card>
          </div>
        ) : null
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase">Overdue</span>
              </div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{overdueCount}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase">Pending</span>
              </div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{pendingCount}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Filed</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{filedCount}</p>
            </div>
          </div>

          <Card padding="none">
            {loading ? (
              <div className="p-5 space-y-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10 w-full"/>)}</div>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck className="h-6 w-6" />}
                title="No filing records"
                description="Add government notification due dates to track compliance."
                action={<Button size="sm" onClick={() => setShowAddNotif(true)}>Add Filing</Button>}
              />
            ) : (
              <Table>
                <Thead>
                  <tr>
                    <Th>Type</Th>
                    <Th>Period</Th>
                    <Th>Due Date</Th>
                    <Th>Amount Due</Th>
                    <Th>Amount Paid</Th>
                    <Th>Status</Th>
                    <Th>Ref No.</Th>
                    <Th>Action</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {notifications.map(n => (
                    <Tr key={n.id}>
                      <Td><Badge variant="default" size="sm">{n.notification_type}</Badge></Td>
                      <Td>{n.period_month ? `${MONTHS[n.period_month]} ${n.period_year}` : n.period_year ?? '—'}</Td>
                      <Td>{formatDate(n.due_date)}</Td>
                      <Td>{n.amount_due != null ? formatCurrency(n.amount_due) : '—'}</Td>
                      <Td>{n.amount_paid != null ? formatCurrency(n.amount_paid) : '—'}</Td>
                      <Td><Badge variant={STATUS_COLOR[n.status] ?? 'neutral'} size="sm" dot>{n.status}</Badge></Td>
                      <Td><span className="text-xs font-mono text-slate-500">{n.reference_number ?? '—'}</span></Td>
                      <Td>
                        {n.status === 'pending' || n.status === 'overdue' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setShowFiledModal(n); setFiledForm({ filed_date: new Date().toISOString().split('T')[0], reference_number: '', amount_paid: '' }) }}
                          >
                            Mark Filed
                          </Button>
                        ) : null}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Card>
        </>
      )}

      {/* Gap Analysis Tab */}
      {tab === 'audit' && (
        <Card>
          <CardHeader title="IATF 16949 Gap Analysis" description="Module completion status for audit readiness" />
          <div className="space-y-3">
            {[
              { label: 'Compliance Settings Configured', done: !!settings?.pf_enabled },
              { label: 'Government Filing Records', done: filedCount > 0 },
              { label: 'Annual Training Calendar', done: false },
              { label: 'Skill Matrix Populated', done: false },
              { label: 'Induction Programs Defined', done: false },
              { label: 'Job Descriptions Published', done: false },
              { label: 'Kaizen Suggestions Active', done: false },
              { label: 'Satisfaction Assessment Completed', done: false },
              { label: 'Action Improvement Plans Tracked', done: false },
              { label: 'Process Approaches Documented', done: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                {item.done ? (
                  <Badge variant="success" size="sm" dot>Complete</Badge>
                ) : (
                  <Badge variant="warning" size="sm" dot>Pending</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Notification Modal */}
      <Modal
        open={showAddNotif}
        onClose={() => setShowAddNotif(false)}
        title="Add Government Filing Due Date"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowAddNotif(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleAddNotification}>Add</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Type" options={NOTIFICATION_TYPES} value={notifForm.notification_type} onChange={e => setNotifForm(f => ({ ...f, notification_type: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Month" options={[{label:'N/A',value:''},...MONTHS.slice(1).map((m,i)=>({label:m,value:String(i+1)}))]} value={notifForm.period_month} onChange={e => setNotifForm(f => ({ ...f, period_month: e.target.value }))} />
            <Input label="Year" type="number" value={notifForm.period_year} onChange={e => setNotifForm(f => ({ ...f, period_year: e.target.value }))} />
          </div>
          <Input label="Due Date" type="date" required value={notifForm.due_date} onChange={e => setNotifForm(f => ({ ...f, due_date: e.target.value }))} />
          <Input label="Amount Due (INR)" type="number" value={notifForm.amount_due} onChange={e => setNotifForm(f => ({ ...f, amount_due: e.target.value }))} />
          <Input label="Remarks" value={notifForm.remarks} onChange={e => setNotifForm(f => ({ ...f, remarks: e.target.value }))} />
        </div>
      </Modal>

      {/* Mark Filed Modal */}
      <Modal
        open={!!showFiledModal}
        onClose={() => setShowFiledModal(null)}
        title={`Mark as Filed — ${showFiledModal?.notification_type}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowFiledModal(null)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleMarkFiled}>Confirm Filed</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Filed Date" type="date" required value={filedForm.filed_date} onChange={e => setFiledForm(f => ({ ...f, filed_date: e.target.value }))} />
          <Input label="Reference Number / Acknowledgement" value={filedForm.reference_number} onChange={e => setFiledForm(f => ({ ...f, reference_number: e.target.value }))} />
          <Input label="Amount Paid (INR)" type="number" value={filedForm.amount_paid} onChange={e => setFiledForm(f => ({ ...f, amount_paid: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
