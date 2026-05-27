'use client'

import { Card, StatCard, PageHeader, Badge, Alert } from '@/components/ui'
import { TrendingUp, TrendingDown, DollarSign, Users, Briefcase, AlertCircle, CheckCircle2, Zap, FlaskConical } from 'lucide-react'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const METRICS = {
  revenue: 852000, expenses: 425000, netProfit: 427000, bankBalance: 154000,
  employees: 25, openRoles: 4, runwayMonths: 18, burnRate: 15000,
  deals: [
    { name: 'Vertex Global – Enterprise License', value: 250000, stage: 'Negotiation', probability: 80 },
    { name: 'TechCorp – Pilot Contract', value: 80000, stage: 'Proposal', probability: 55 },
    { name: 'SmartFin – SaaS License', value: 120000, stage: 'Demo', probability: 40 },
  ],
  kpis: [
    { label: 'Monthly Recurring Revenue', value: fmt(852000), delta: '+12%', up: true },
    { label: 'Customer Acquisition Cost', value: fmt(4200), delta: '-8%', up: false },
    { label: 'Employee Productivity Index', value: '87/100', delta: '+3pts', up: true },
    { label: 'Gross Margin', value: '50.1%', delta: '+2.1%', up: true },
  ],
  insights: [
    { type: 'warning', text: '3 high-performing engineers have notice periods ending soon. Consider retention talks.' },
    { type: 'opportunity', text: '5 deals in Negotiation phase worth ₹4.5L combined. High closing probability this quarter.' },
    { type: 'info', text: 'Travel expenses up 22% this quarter. AI suggests shifting to virtual internal audits.' },
  ],
}

export default function CockpitPage() {
  const pipelineTotal = METRICS.deals.reduce((s, d) => s + d.value * d.probability / 100, 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Founder Cockpit</strong> — Executive metrics view. Data is illustrative; real data pulls from Finance, CRM, and HRMS modules.</span>
      </div>

      <PageHeader
        title="Founder Cockpit"
        description="Executive overview — revenue, burn, pipeline, and team health at a glance"
      />

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={fmt(METRICS.revenue)} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Total Expenses" value={fmt(METRICS.expenses)} icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
        <StatCard label="Net Profit" value={fmt(METRICS.netProfit)} icon={<DollarSign className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Bank Balance" value={fmt(METRICS.bankBalance)} icon={<DollarSign className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={METRICS.employees} icon={<Users className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Open Roles" value={METRICS.openRoles} icon={<Briefcase className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Runway" value={`${METRICS.runwayMonths} months`} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Monthly Burn" value={fmt(METRICS.burnRate)} icon={<Zap className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPI Cards */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Business KPIs</h3>
          <div className="space-y-3">
            {METRICS.kpis.map(k => (
              <div key={k.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-600">{k.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{k.value}</span>
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${k.up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {k.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sales Pipeline */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Sales Pipeline</h3>
            <span className="text-xs text-slate-500">Weighted: {fmt(pipelineTotal)}</span>
          </div>
          <div className="space-y-3">
            {METRICS.deals.map(d => (
              <div key={d.name} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-start justify-between mb-1.5">
                  <p className="text-xs font-semibold text-slate-800 flex-1 mr-2">{d.name}</p>
                  <Badge variant={d.stage === 'Negotiation' ? 'success' : d.stage === 'Proposal' ? 'warning' : 'info'} size="sm">{d.stage}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{fmt(d.value)}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-200 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${d.probability}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">{d.probability}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-500" /> AI Insights
        </h3>
        <div className="space-y-3">
          {METRICS.insights.map((ins, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
              ins.type === 'warning' ? 'bg-amber-50 border border-amber-100' :
              ins.type === 'opportunity' ? 'bg-emerald-50 border border-emerald-100' :
              'bg-blue-50 border border-blue-100'
            }`}>
              <AlertCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                ins.type === 'warning' ? 'text-amber-500' :
                ins.type === 'opportunity' ? 'text-emerald-500' : 'text-blue-500'
              }`} />
              <p className="text-xs text-slate-700 leading-relaxed">{ins.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
