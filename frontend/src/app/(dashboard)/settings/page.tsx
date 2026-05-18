'use client'

import { useState } from 'react'
import { PageHeader, Card, Button, Input, Select, TabBar, Alert, Divider, Badge } from '@/components/ui'
import { Settings, Building2, Users, Shield, Bell, Palette, CreditCard, Globe } from 'lucide-react'

const SIDEBAR_ITEMS = [
  { id: 'org', label: 'Organisation', icon: Building2 },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Globe },
]

const ROLES = [
  { name: 'Super Admin', users: 2, perms: 'Full access to all modules', color: 'bg-red-50 text-red-700' },
  { name: 'HR Manager', users: 5, perms: 'HRMS, Payroll, Attendance', color: 'bg-indigo-50 text-indigo-700' },
  { name: 'Finance Manager', users: 3, perms: 'Finance, Payroll (read)', color: 'bg-amber-50 text-amber-700' },
  { name: 'Employee', users: 274, perms: 'Self-service portal only', color: 'bg-slate-100 text-slate-600' },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('org')

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader title="Settings" description="Manage organisation, users, and platform configuration" />

      <div className="flex gap-6">
        {/* Settings Sidebar */}
        <nav className="w-44 flex-shrink-0 space-y-0.5">
          {SIDEBAR_ITEMS.map(item => (
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
        <div className="flex-1 min-w-0">
          {activeSection === 'org' && (
            <Card>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Organisation Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Company Name" defaultValue="PRSK Technologies Pvt. Ltd." />
                <Input label="GST Number" defaultValue="29AABCP1234J1ZK" />
                <Input label="PAN" defaultValue="AABCP1234J" />
                <Input label="Corporate CIN" defaultValue="U74999KA2021PTC123456" />
                <Input label="Registered Address" defaultValue="Embassy Tech Village, Marathahalli, Bengaluru 560103" />
                <Input label="City" defaultValue="Bengaluru" />
                <Select label="State" options={[{ label: 'Karnataka', value: 'KA' }, { label: 'Maharashtra', value: 'MH' }]} />
                <Input label="Pincode" defaultValue="560103" />
                <Input label="Contact Email" defaultValue="admin@prsk.in" type="email" />
                <Input label="Contact Phone" defaultValue="+91 80 4567 8900" />
              </div>
              <Divider className="my-5" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Financial Year Start" options={[{ label: 'April (Indian FY)', value: 'apr' }, { label: 'January', value: 'jan' }]} />
                <Select label="Currency" options={[{ label: 'INR (₹)', value: 'INR' }, { label: 'USD ($)', value: 'USD' }]} />
                <Select label="Date Format" options={[{ label: 'DD/MM/YYYY', value: 'dmy' }, { label: 'MM/DD/YYYY', value: 'mdy' }]} />
                <Select label="Timezone" options={[{ label: 'Asia/Kolkata (IST)', value: 'IST' }]} />
              </div>
              <div className="mt-5 flex gap-2">
                <Button size="sm">Save Changes</Button>
                <Button variant="ghost" size="sm">Discard</Button>
              </div>
            </Card>
          )}

          {activeSection === 'users' && (
            <div className="space-y-4">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Roles & Permissions</h2>
                  <Button size="sm" variant="outline">Create Role</Button>
                </div>
                <div className="space-y-3">
                  {ROLES.map(role => (
                    <div key={role.name} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${role.color}`}>{role.name}</span>
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{role.perms}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{role.users} user{role.users !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  ))}
                </div>
              </Card>
              <Alert variant="info" title="Invite Team Members">
                Send email invitations to new users. They will be assigned the default Employee role and can be upgraded after joining.
              </Alert>
              <Card>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Invite User</h2>
                <div className="flex gap-2">
                  <Input placeholder="colleague@company.com" type="email" className="flex-1" />
                  <Select options={ROLES.map(r => ({ label: r.name, value: r.name }))} className="w-40" />
                  <Button size="sm">Send Invite</Button>
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'security' && (
            <Card>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Security Settings</h2>
              <div className="space-y-5">
                {[
                  { label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin accounts', enabled: true },
                  { label: 'Session Timeout', desc: 'Auto-logout after 8 hours of inactivity', enabled: true },
                  { label: 'IP Allowlist', desc: 'Restrict login to specific IP ranges', enabled: false },
                  { label: 'Audit Log Retention', desc: 'Keep audit logs for 365 days', enabled: true },
                ].map(setting => (
                  <div key={setting.label} className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{setting.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{setting.desc}</p>
                    </div>
                    <button className={`relative h-5 w-9 rounded-full transition-colors flex-shrink-0 ${setting.enabled ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${setting.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <Button size="sm">Save Security Settings</Button>
              </div>
            </Card>
          )}

          {(activeSection === 'notifications' || activeSection === 'appearance' || activeSection === 'billing' || activeSection === 'integrations') && (
            <Card className="text-center py-12">
              <Settings className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">{activeSection} settings</p>
              <p className="text-xs text-slate-400 mt-1">Configuration for this section coming soon</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
