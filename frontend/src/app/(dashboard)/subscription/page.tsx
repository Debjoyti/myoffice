'use client'

import { Card, PageHeader, Badge, Button, Alert } from '@/components/ui'
import { CreditCard, Users, Briefcase, CheckCircle2, Calendar, Zap, AlertTriangle } from 'lucide-react'

const PLAN = {
  name: 'Growth',
  status: 'Active',
  renewsOn: '15 Jun 2027',
  employees: { used: 25, max: 100 },
  projects: { used: 6, max: 25 },
  storage: { usedGB: 8.4, maxGB: 50 },
  price: 12999,
}

const FEATURES = [
  'All core HR modules (Attendance, Payroll, Leaves)',
  'Finance & Procurement modules',
  'CRM with deal pipeline',
  'IATF 16949 compliance module',
  'Up to 100 employees',
  'Up to 25 active projects',
  '50 GB document storage',
  'Priority email support',
  'API access',
]

const USAGE_BAR = ({ used, max, label }: { used: number; max: number; label: string }) => {
  const pct = Math.min(used / max * 100, 100)
  const warn = pct >= 80
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600">{label}</span>
        <span className={`font-semibold ${warn ? 'text-amber-600' : 'text-slate-700'}`}>{used} / {max}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${warn ? 'bg-amber-400' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Subscription"
        description="Manage your PRSK plan, billing, and usage limits"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-900">{PLAN.name} Plan</h3>
                  <Badge variant="success" dot>Active</Badge>
                </div>
                <p className="text-sm text-slate-500">₹{PLAN.price.toLocaleString('en-IN')}/month · Renews {PLAN.renewsOn}</p>
              </div>
              <Button variant="secondary" size="sm">Upgrade Plan</Button>
            </div>

            <div className="space-y-4">
              <USAGE_BAR used={PLAN.employees.used} max={PLAN.employees.max} label="Employees" />
              <USAGE_BAR used={PLAN.projects.used} max={PLAN.projects.max} label="Active Projects" />
              <USAGE_BAR used={PLAN.storage.usedGB} max={PLAN.storage.maxGB} label={`Storage (${PLAN.storage.usedGB} GB / ${PLAN.storage.maxGB} GB)`} />
            </div>
          </Card>

          {/* Billing History */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Billing History</h3>
            <div className="space-y-2">
              {[
                { date: '15 May 2026', amount: 12999, status: 'Paid' },
                { date: '15 Apr 2026', amount: 12999, status: 'Paid' },
                { date: '15 Mar 2026', amount: 12999, status: 'Paid' },
              ].map(b => (
                <div key={b.date} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center">
                      <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Growth Plan — Monthly</p>
                      <p className="text-[11px] text-slate-400">{b.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800">₹{b.amount.toLocaleString('en-IN')}</span>
                    <Badge variant="success" size="sm">{b.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Plan Features */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Plan Features</h3>
            <ul className="space-y-2">
              {FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-600">{f}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Payment Method</h3>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <CreditCard className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs font-semibold text-slate-800">HDFC Visa **** 8822</p>
                <p className="text-[11px] text-slate-400">Expires 08/28</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="mt-3 w-full">Update Payment Method</Button>
          </Card>

          <Alert variant="info" title="Need more capacity?">
            Upgrade to Enterprise for unlimited employees, white-labelling, and dedicated support.
          </Alert>
        </div>
      </div>
    </div>
  )
}
