'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, StatCard, PageHeader, Badge } from '@/components/ui'
import { TrendingUp, TrendingDown, DollarSign, Users, Briefcase, AlertCircle, CheckCircle2, Zap, RefreshCw, FlaskConical } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type DashStats = {
  active_employees: number
  departments: number
  present_today: number
  attendance_rate: number
  new_hires_month: number
  pending_leaves: number
  pending_approvals: number
  latest_payroll: { month: string; total_gross: number; status: string } | null
}

type Lead = { id: string; name: string; company?: string; value: number; status: string }

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const MOCK_METRICS = {
  revenue: 852000, expenses: 425000, netProfit: 427000, bankBalance: 154000,
  runwayMonths: 18, burnRate: 15000,
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
  const [stats, setStats] = useState<DashStats | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, crmRes] = await Promise.all([
        fetch('/api/v1/dashboard/stats'),
        fetch('/api/v1/crm'),
      ])
      let gotLiveData = false
      if (statsRes.ok) {
        const d = await statsRes.json()
        if (d.active_employees != null) { setStats(d); gotLiveData = true }
      }
      if (crmRes.ok) {
        const d = await crmRes.json()
        if (d.leads?.length > 0) { setLeads(d.leads); gotLiveData = true }
      }
      setIsPreview(!gotLiveData)
    } catch {
      setIsPreview(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const employees = stats?.active_employees ?? 25
  const openRoles = 4
  const pipelineDeals = leads.length > 0
    ? leads.filter(l => !['won', 'lost'].includes(l.status)).slice(0, 3).map(l => ({
        name: `${l.name}${l.company ? ` – ${l.company}` : ''}`,
        value: Number(l.value),
        stage: l.status.charAt(0).toUpperCase() + l.status.slice(1),
        probability: l.status === 'negotiation' ? 80 : l.status === 'proposal' ? 55 : 40,
      }))
    : MOCK_METRICS.deals
  const pipelineTotal = pipelineDeals.reduce((s, d) => s + d.value * d.probability / 100, 0)

  const kpis = stats
    ? [
        { label: 'Active Employees', value: String(stats.active_employees), delta: `+${stats.new_hires_month} this month`, up: stats.new_hires_month >= 0 },
        { label: 'Attendance Rate', value: `${stats.attendance_rate}%`, delta: `${stats.present_today} present today`, up: stats.attendance_rate >= 80 },
        { label: 'Pending Approvals', value: String(stats.pending_approvals), delta: `${stats.pending_leaves} leave requests`, up: stats.pending_approvals === 0 },
        { label: 'Departments', value: String(stats.departments), delta: 'active', up: true },
      ]
    : MOCK_METRICS.kpis

  return (
    <div className="space-y-6 animate-fadeIn">
      {isPreview && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
          <span><strong>Founder Cockpit</strong> — Financial metrics are illustrative. HR and pipeline data pulls from live modules when available.</span>
        </div>
      )}

      <PageHeader
        title="Founder Cockpit"
        description="Executive overview — revenue, burn, pipeline, and team health at a glance"
        actions={
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={fmt(MOCK_METRICS.revenue)} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Total Expenses" value={fmt(MOCK_METRICS.expenses)} icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
        <StatCard label="Net Profit" value={fmt(MOCK_METRICS.netProfit)} icon={<DollarSign className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Bank Balance" value={fmt(MOCK_METRICS.bankBalance)} icon={<DollarSign className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      {/* HR KPIs — live when available */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={employees} icon={<Users className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Open Roles" value={openRoles} icon={<Briefcase className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Runway" value={`${MOCK_METRICS.runwayMonths} months`} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Monthly Burn" value={fmt(MOCK_METRICS.burnRate)} icon={<Zap className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
      </div>

      {stats?.latest_payroll && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Latest Payroll Run</p>
              <p className="text-sm font-semibold text-slate-800">{stats.latest_payroll.month}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{formatCurrency(stats.latest_payroll.total_gross)}</p>
              <Badge variant={stats.latest_payroll.status === 'completed' ? 'success' : 'warning'} size="sm">
                {stats.latest_payroll.status}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business KPIs */}
        <Card>
          <h3 className="text-sm font-semibold text-slate-800 mb-4">
            {stats ? 'Live HR Metrics' : 'Business KPIs'}
          </h3>
          <div className="space-y-3">
            {kpis.map((k, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
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
            {pipelineDeals.map((d, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-start justify-between mb-1.5">
                  <p className="text-xs font-semibold text-slate-800 flex-1 mr-2 leading-tight">{d.name}</p>
                  <Badge
                    variant={d.stage === 'Negotiation' || d.stage === 'negotiation' ? 'success' : d.stage === 'Proposal' || d.stage === 'proposal' ? 'warning' : 'info'}
                    size="sm"
                  >
                    {d.stage}
                  </Badge>
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
            {pipelineDeals.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No active pipeline deals. Add leads in CRM.</p>
            )}
          </div>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-500" /> AI Insights
        </h3>
        <div className="space-y-3">
          {MOCK_METRICS.insights.map((ins, i) => (
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
