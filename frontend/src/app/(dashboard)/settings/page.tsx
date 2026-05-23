'use client'

import { useState } from 'react'
import {
  PageHeader, Card, Button, Input, Select, Alert, Divider, Badge, Avatar, DetailGrid
} from '@/components/ui'
import { Building2, Users, Shield, Bell, Palette, CreditCard, Globe, Check } from 'lucide-react'

type Section = 'org' | 'users' | 'security' | 'notifications' | 'appearance' | 'billing' | 'integrations'

const SIDEBAR: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'org', label: 'Organisation', icon: Building2 },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Globe },
]

const ROLES = [
  { name: 'Super Admin', users: 2, color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300', perms: 'Full access to all modules and settings' },
  { name: 'HR Manager', users: 5, color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', perms: 'HRMS, Payroll, Attendance, Leave approval' },
  { name: 'Finance Manager', users: 3, color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', perms: 'Finance, Procurement, Payroll (read-only)' },
  { name: 'Employee', users: 274, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', perms: 'Self-service portal, payslips, leave requests' },
]

const TEAM_MEMBERS = [
  { name: 'Divya Nair', email: 'divya.nair@prsk.in', role: 'Super Admin', lastLogin: '13 May, 09:30' },
  { name: 'Ananya Iyer', email: 'ananya.iyer@prsk.in', role: 'HR Manager', lastLogin: '13 May, 10:15' },
  { name: 'Rahul Mehta', email: 'rahul.mehta@prsk.in', role: 'Finance Manager', lastLogin: '12 May, 17:45' },
  { name: 'Priya Sharma', email: 'priya.sharma@prsk.in', role: 'Employee', lastLogin: '13 May, 08:55' },
]

const INTEGRATIONS = [
  { name: 'Razorpay', desc: 'Payroll disbursements and expense reimbursements', connected: true, icon: '💳' },
  { name: 'Google Workspace', desc: 'SSO login and calendar sync', connected: true, icon: '📧' },
  { name: 'Slack', desc: 'Notifications for approvals and alerts', connected: false, icon: '💬' },
  { name: 'Zoho Books', desc: 'Two-way GL sync', connected: false, icon: '📊' },
  { name: 'WhatsApp Business', desc: 'Candidate screening and leave requests', connected: true, icon: '📱' },
]

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="ml-8 flex-shrink-0">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('org')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader title="Settings" description="Manage your organisation, team access, and platform configuration" />

      <div className="flex gap-6">
        {/* Settings Sidebar */}
        <nav className="w-44 flex-shrink-0 space-y-0.5">
          {SIDEBAR.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Settings Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {activeSection === 'org' && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-5">Organisation Details</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Input label="Company Name" defaultValue="PRSK Technologies Pvt. Ltd." />
                <Input label="CIN" defaultValue="U72900KA2020PTC123456" />
                <Input label="GST Number" defaultValue="29AAFCP1234A1Z5" />
                <Input label="PAN Number" defaultValue="AAFCP1234A" />
                <Input label="Registered Email" type="email" defaultValue="legal@prsk.in" />
                <Input label="Phone" defaultValue="+91 80 4567 8900" />
                <div className="col-span-2">
                  <Input label="Registered Address" defaultValue="Embassy TechVillage, Outer Ring Road, Bengaluru, Karnataka – 560103" />
                </div>
                <Select label="Financial Year Start" options={[{ label: 'April (India standard)', value: 'apr' }, { label: 'January', value: 'jan' }]} />
                <Select label="Default Currency" options={[{ label: 'INR (₹)', value: 'INR' }, { label: 'USD ($)', value: 'USD' }]} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} leftIcon={saved ? <Check className="h-3.5 w-3.5" /> : undefined}>
                  {saved ? 'Saved!' : 'Save Changes'}
                </Button>
                <Button variant="ghost" size="sm">Discard</Button>
              </div>
            </Card>
          )}

          {activeSection === 'users' && (
            <div className="space-y-4">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Team Members</h3>
                  <Button size="sm">Invite User</Button>
                </div>
                <div className="space-y-2">
                  {TEAM_MEMBERS.map(m => (
                    <div key={m.email} className="flex items-center gap-3 py-2.5 px-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Avatar name={m.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{m.name}</p>
                        <p className="text-xs text-slate-400">{m.email}</p>
                      </div>
                      <Badge variant={m.role === 'Super Admin' ? 'danger' : m.role === 'HR Manager' ? 'default' : m.role === 'Finance Manager' ? 'warning' : 'neutral'} size="sm">
                        {m.role}
                      </Badge>
                      <p className="text-xs text-slate-400 hidden sm:block w-32 text-right">{m.lastLogin}</p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Role Permissions</h3>
                <div className="space-y-3">
                  {ROLES.map(r => (
                    <div key={r.name} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md flex-shrink-0 ${r.color}`}>{r.name}</span>
                      <div className="flex-1">
                        <p className="text-xs text-slate-600 dark:text-slate-400">{r.perms}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{r.users} {r.users === 1 ? 'user' : 'users'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'security' && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Security Settings</h3>
              <SettingRow label="Two-Factor Authentication" description="Require 2FA for all admin users">
                <Button variant="outline" size="sm">Enable</Button>
              </SettingRow>
              <SettingRow label="Session Timeout" description="Automatically log out after inactivity">
                <Select options={[{ label: '30 minutes', value: '30' }, { label: '1 hour', value: '60' }, { label: '4 hours', value: '240' }, { label: '8 hours', value: '480' }]} className="w-32" />
              </SettingRow>
              <SettingRow label="IP Allowlist" description="Restrict access to specific IP ranges">
                <Button variant="outline" size="sm">Configure</Button>
              </SettingRow>
              <SettingRow label="Audit Log Retention" description="How long to retain activity logs">
                <Select options={[{ label: '90 days', value: '90' }, { label: '1 year', value: '365' }, { label: '3 years', value: '1095' }]} className="w-28" />
              </SettingRow>
            </Card>
          )}

          {activeSection === 'billing' && (
            <div className="space-y-4">
              <Card>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Current Plan</h3>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-indigo-700 dark:text-indigo-300">Business Pro</span>
                      <Badge variant="default" size="sm">Active</Badge>
                    </div>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">₹499/user/month · 284 seats · Billed annually</p>
                    <p className="text-xs text-slate-500 mt-1">Next renewal: 01 Jan 2027</p>
                  </div>
                  <Button variant="outline" size="sm">Upgrade Plan</Button>
                </div>
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Billing Summary</h3>
                <DetailGrid items={[
                  { label: 'Monthly Cost', value: '₹1,41,716' },
                  { label: 'Annual Cost', value: '₹17,00,592' },
                  { label: 'Active Seats', value: '284' },
                  { label: 'Payment Method', value: 'HDFC CC ending 4242' },
                ]} />
              </Card>
            </div>
          )}

          {activeSection === 'integrations' && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Connected Integrations</h3>
              <div className="space-y-3">
                {INTEGRATIONS.map(i => (
                  <div key={i.name} className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <span className="text-2xl">{i.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{i.name}</p>
                      <p className="text-xs text-slate-500">{i.desc}</p>
                    </div>
                    {i.connected ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="success" dot>Connected</Badge>
                        <Button variant="ghost" size="sm">Configure</Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm">Connect</Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(activeSection === 'notifications' || activeSection === 'appearance') && (
            <Card>
              <Alert variant="info" title="Coming Soon">
                This settings section is under development and will be available in the next release.
              </Alert>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
