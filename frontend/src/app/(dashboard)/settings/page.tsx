'use client'

import { useState, useEffect } from 'react'
import { PageHeader, Card, Button, Input, Select, Alert, Divider, Avatar } from '@/components/ui'
import { Building2, Users, Shield, Bell, Palette, Save } from 'lucide-react'

type Section = 'org' | 'users' | 'security' | 'notifications' | 'appearance'

const SIDEBAR: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'org',           label: 'Organisation',   icon: Building2 },
  { id: 'users',         label: 'Users & Roles',  icon: Users },
  { id: 'security',      label: 'Security',       icon: Shield },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'appearance',    label: 'Appearance',     icon: Palette },
]

type OrgSettings = {
  company_name: string
  payroll_cutoff_day: number
  default_work_start: string
  default_work_end: string
  late_threshold_mins: number
  timezone: string
  currency: string
  pf_applicable: boolean
  esi_applicable: boolean
  pt_applicable: boolean
  gratuity_applicable: boolean
}

type Employee = {
  id: string; full_name: string; email: string; role: string
  designation: string; employee_code: string
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-slate-100 last:border-0">
      <div className="flex-1 pr-6">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-slate-200'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  )
}

/* ── Org Settings ───────────────────────────────────────────────────────────── */
function OrgSection() {
  const [settings, setSettings] = useState<OrgSettings>({
    company_name: 'PRSK Technologies',
    payroll_cutoff_day: 25,
    default_work_start: '09:00',
    default_work_end: '18:00',
    late_threshold_mins: 15,
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    pf_applicable: true,
    esi_applicable: true,
    pt_applicable: true,
    gratuity_applicable: true,
  })
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [saved,   setSaved]     = useState(false)
  const [error,   setError]     = useState<string | null>(null)
  const [canEdit, setCanEdit]   = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [settRes, meRes] = await Promise.all([
          fetch('/api/v1/admin/settings'),
          fetch('/api/v1/me'),
        ])
        if (settRes.ok) { const d = await settRes.json(); setSettings(s => ({ ...s, ...d.settings })) }
        if (meRes.ok)   { const d = await meRes.json(); setCanEdit(['admin'].includes(d.employee?.role)) }
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true); setError(null); setSaved(false)
    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  const set = <K extends keyof OrgSettings>(k: K, v: OrgSettings[K]) =>
    setSettings(s => ({ ...s, [k]: v }))

  if (loading) return <div className="p-6 text-sm text-slate-400">Loading settings…</div>

  return (
    <div className="space-y-6">
      {error && <Alert variant="danger">{error}</Alert>}
      {saved && <Alert variant="success">Settings saved successfully.</Alert>}

      {/* Company Info */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Company Information</h4>
        <div className="space-y-0">
          <SettingRow label="Company Name" description="Displayed on payslips and offer letters">
            <Input value={settings.company_name} disabled={!canEdit}
              onChange={e => set('company_name', e.target.value)} className="w-56" />
          </SettingRow>
          <SettingRow label="Currency" description="Primary currency for all financial calculations">
            <Select value={settings.currency} disabled={!canEdit}
              onChange={e => set('currency', e.target.value)} className="w-28"
              options={[{ label: 'INR ₹', value: 'INR' }, { label: 'USD $', value: 'USD' }]}
            />
          </SettingRow>
          <SettingRow label="Timezone" description="Used for attendance and scheduling">
            <Select value={settings.timezone} disabled={!canEdit}
              onChange={e => set('timezone', e.target.value)} className="w-48"
              options={[
                { label: 'Asia/Kolkata (IST)', value: 'Asia/Kolkata' },
                { label: 'Asia/Dubai (GST)',   value: 'Asia/Dubai' },
              ]}
            />
          </SettingRow>
        </div>
      </div>

      <Divider />

      {/* Work Schedule */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Work Schedule Defaults</h4>
        <div className="space-y-0">
          <SettingRow label="Work Start Time" description="Default check-in time for new employees">
            <Input type="time" value={settings.default_work_start} disabled={!canEdit}
              onChange={e => set('default_work_start', e.target.value)} className="w-32" />
          </SettingRow>
          <SettingRow label="Work End Time" description="Default check-out time for new employees">
            <Input type="time" value={settings.default_work_end} disabled={!canEdit}
              onChange={e => set('default_work_end', e.target.value)} className="w-32" />
          </SettingRow>
          <SettingRow label="Late Threshold" description="Minutes after start time before marking as late">
            <div className="flex items-center gap-2">
              <Input type="number" min="0" max="120" value={String(settings.late_threshold_mins)} disabled={!canEdit}
                onChange={e => set('late_threshold_mins', parseInt(e.target.value) || 0)} className="w-20" />
              <span className="text-sm text-slate-500">mins</span>
            </div>
          </SettingRow>
          <SettingRow label="Payroll Cutoff Day" description="Day of month after which attendance is locked">
            <Input type="number" min="1" max="28" value={String(settings.payroll_cutoff_day)} disabled={!canEdit}
              onChange={e => set('payroll_cutoff_day', parseInt(e.target.value) || 25)} className="w-20" />
          </SettingRow>
        </div>
      </div>

      <Divider />

      {/* Statutory Compliance */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Statutory Compliance</h4>
        <div className="space-y-0">
          <SettingRow label="Provident Fund (PF)" description="12% employee + 12% employer on basic salary">
            <Toggle value={settings.pf_applicable} onChange={v => canEdit && set('pf_applicable', v)} />
          </SettingRow>
          <SettingRow label="ESI" description="Applicable when gross monthly salary ≤ ₹21,000">
            <Toggle value={settings.esi_applicable} onChange={v => canEdit && set('esi_applicable', v)} />
          </SettingRow>
          <SettingRow label="Professional Tax (PT)" description="₹200/month when gross > ₹10,000">
            <Toggle value={settings.pt_applicable} onChange={v => canEdit && set('pt_applicable', v)} />
          </SettingRow>
          <SettingRow label="Gratuity" description="4.81% of basic salary after 5 years">
            <Toggle value={settings.gratuity_applicable} onChange={v => canEdit && set('gratuity_applicable', v)} />
          </SettingRow>
        </div>
      </div>

      {canEdit && (
        <div className="flex justify-end pt-2">
          <Button loading={saving} leftIcon={<Save className="h-3.5 w-3.5" />} onClick={save}>
            Save Settings
          </Button>
        </div>
      )}

      {!canEdit && (
        <Alert variant="info">
          Settings can only be modified by Admin users.
        </Alert>
      )}
    </div>
  )
}

/* ── Users Section ──────────────────────────────────────────────────────────── */
function UsersSection() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/v1/employees?status=active&limit=50')
      .then(r => r.json())
      .then(d => setEmployees(d.employees ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-50 text-red-700', hr: 'bg-blue-50 text-blue-700',
    manager: 'bg-amber-50 text-amber-700', employee: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">System Users</h4>
        <p className="text-sm text-slate-600 mb-4">
          Employee roles control access to modules. Change roles from the HRMS module.
        </p>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { role: 'admin',    desc: 'Full system access', count: employees.filter(e => e.role === 'admin').length },
          { role: 'hr',       desc: 'HRMS, Payroll, Attendance', count: employees.filter(e => e.role === 'hr').length },
          { role: 'manager',  desc: 'Team approvals & reports', count: employees.filter(e => e.role === 'manager').length },
          { role: 'employee', desc: 'Self-service portal', count: employees.filter(e => e.role === 'employee').length },
        ].map(r => (
          <div key={r.role} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[r.role] ?? ''}`}>
                {r.role.charAt(0).toUpperCase() + r.role.slice(1)}
              </span>
              <p className="text-xs text-slate-400 mt-1">{r.desc}</p>
            </div>
            <span className="text-xl font-bold text-slate-700">{r.count}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">Loading users…</div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {employees.slice(0, 10).map((emp, i) => (
            <div key={emp.id} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
              <div className="flex items-center gap-2.5">
                <Avatar name={emp.full_name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{emp.full_name}</p>
                  <p className="text-xs text-slate-400">{emp.email}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[emp.role] ?? ''}`}>
                {emp.role.charAt(0).toUpperCase() + emp.role.slice(1)}
              </span>
            </div>
          ))}
          {employees.length > 10 && (
            <div className="px-4 py-2 bg-slate-50 text-xs text-slate-400 border-t border-slate-100">
              +{employees.length - 10} more employees · manage from <a href="/hrms" className="text-blue-600 hover:underline">HRMS</a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Security Section ───────────────────────────────────────────────────────── */
function SecuritySection() {
  return (
    <div className="space-y-0">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Security Settings</h4>
      {[
        { label: 'Two-Factor Authentication', desc: 'Require 2FA for admin and HR users', enabled: false },
        { label: 'Session Timeout', desc: 'Auto-logout after 8 hours of inactivity', enabled: true },
        { label: 'Audit Logging', desc: 'Log all data-modifying actions to the audit trail', enabled: true },
        { label: 'IP Allowlist', desc: 'Restrict login to trusted IP addresses', enabled: false },
      ].map(item => (
        <SettingRow key={item.label} label={item.label} description={item.desc}>
          <div className={`text-xs font-semibold px-2 py-1 rounded-full ${item.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {item.enabled ? 'Enabled' : 'Disabled'}
          </div>
        </SettingRow>
      ))}
      <div className="mt-4">
        <Alert variant="info">
          Authentication and advanced security settings are managed through Supabase Auth.
        </Alert>
      </div>
    </div>
  )
}

/* ── Notifications Section ──────────────────────────────────────────────────── */
function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    leave_approved: true, leave_rejected: true, payroll_complete: true,
    new_employee: true, reimbursement_approved: true,
  })
  return (
    <div className="space-y-0">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">In-App Notifications</h4>
      {[
        { key: 'leave_approved',         label: 'Leave Approved',          desc: 'When your leave request is approved' },
        { key: 'leave_rejected',         label: 'Leave Rejected',          desc: 'When your leave request is rejected' },
        { key: 'payroll_complete',       label: 'Payroll Processed',       desc: 'When monthly payroll is run' },
        { key: 'new_employee',           label: 'New Employee Added',      desc: 'When a new employee joins (HR only)' },
        { key: 'reimbursement_approved', label: 'Reimbursement Approved',  desc: 'When a claim is approved' },
      ].map(item => (
        <SettingRow key={item.key} label={item.label} description={item.desc}>
          <Toggle value={prefs[item.key as keyof typeof prefs]}
            onChange={v => setPrefs(p => ({ ...p, [item.key]: v }))} />
        </SettingRow>
      ))}
    </div>
  )
}

/* ── Appearance Section ─────────────────────────────────────────────────────── */
function AppearanceSection() {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Theme & Display</h4>
      <div className="grid grid-cols-3 gap-3">
        {[
          { id: 'light', label: 'Light',  preview: 'bg-white border-2 border-blue-600' },
          { id: 'dark',  label: 'Dark',   preview: 'bg-slate-900 border border-slate-700' },
          { id: 'system',label: 'System', preview: 'bg-gradient-to-br from-white to-slate-900 border border-slate-300' },
        ].map(t => (
          <div key={t.id} className={`rounded-lg overflow-hidden border-2 ${t.id === 'light' ? 'border-blue-600' : 'border-slate-200'} cursor-pointer`}>
            <div className={`h-16 ${t.preview}`} />
            <p className="text-center text-xs font-medium text-slate-700 py-2">{t.label}</p>
          </div>
        ))}
      </div>
      <Alert variant="info">Light theme is active. Dark mode support is coming soon.</Alert>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [section, setSection] = useState<Section>('org')

  const SECTIONS: Record<Section, React.ReactNode> = {
    org:           <OrgSection />,
    users:         <UsersSection />,
    security:      <SecuritySection />,
    notifications: <NotificationsSection />,
    appearance:    <AppearanceSection />,
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader title="Settings" description="Manage your organisation's configuration and preferences" />

      <div className="flex gap-5">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-0.5">
            {SIDEBAR.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  section === s.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                }`}>
                <s.icon className={`h-4 w-4 ${section === s.id ? 'text-blue-600' : 'text-slate-400'}`} />
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Card>
            {SECTIONS[section]}
          </Card>
        </div>
      </div>
    </div>
  )
}
