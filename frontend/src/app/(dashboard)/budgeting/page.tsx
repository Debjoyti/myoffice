'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, Modal, Input, Select, Textarea
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart3, Plus, Download, Eye, Edit2, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Target
} from 'lucide-react'

const MOCK_BUDGETS = [
  { id: 'BUD-001', cost_center: 'Engineering', head: 'Salaries', annual_budget: 12000000, q1: 3000000, q2: 3000000, q3: 3000000, q4: 3000000, ytd_actual: 6200000, variance: -200000 },
  { id: 'BUD-002', cost_center: 'Engineering', head: 'Software & Tools', annual_budget: 1200000, q1: 300000, q2: 300000, q3: 300000, q4: 300000, ytd_actual: 580000, variance: 20000 },
  { id: 'BUD-003', cost_center: 'Marketing', head: 'Digital Marketing', annual_budget: 2400000, q1: 600000, q2: 600000, q3: 600000, q4: 600000, ytd_actual: 950000, variance: 250000 },
  { id: 'BUD-004', cost_center: 'Marketing', head: 'Events & Conferences', annual_budget: 800000, q1: 200000, q2: 200000, q3: 200000, q4: 200000, ytd_actual: 450000, variance: -50000 },
  { id: 'BUD-005', cost_center: 'Operations', head: 'Office Rent', annual_budget: 10200000, q1: 2550000, q2: 2550000, q3: 2550000, q4: 2550000, ytd_actual: 5100000, variance: 0 },
  { id: 'BUD-006', cost_center: 'Operations', head: 'Utilities', annual_budget: 600000, q1: 150000, q2: 150000, q3: 150000, q4: 150000, ytd_actual: 310000, variance: -10000 },
  { id: 'BUD-007', cost_center: 'Sales', head: 'Sales Salaries', annual_budget: 8000000, q1: 2000000, q2: 2000000, q3: 2000000, q4: 2000000, ytd_actual: 3800000, variance: 200000 },
  { id: 'BUD-008', cost_center: 'Sales', head: 'Travel & Entertainment', annual_budget: 1500000, q1: 375000, q2: 375000, q3: 375000, q4: 375000, ytd_actual: 820000, variance: -70000 },
]

const MOCK_COST_CENTERS = [
  { id: 'CC-001', name: 'Engineering', code: 'ENG', head: 'Rajesh Mehta', budget: 13200000, actual: 6780000 },
  { id: 'CC-002', name: 'Marketing', code: 'MKT', head: 'Anita Singh', budget: 3200000, actual: 1400000 },
  { id: 'CC-003', name: 'Operations', code: 'OPS', head: 'Suresh Reddy', budget: 10800000, actual: 5410000 },
  { id: 'CC-004', name: 'Sales', code: 'SAL', head: 'Vikram Sharma', budget: 9500000, actual: 4620000 },
  { id: 'CC-005', name: 'HR & Admin', code: 'HRA', head: 'Neha Patel', budget: 2800000, actual: 1250000 },
]

const MOCK_FORECASTS = [
  { month: 'Jun 2026', revenue_forecast: 13200000, expense_forecast: 8100000, profit_forecast: 5100000, confidence: 'high' },
  { month: 'Jul 2026', revenue_forecast: 12500000, expense_forecast: 7800000, profit_forecast: 4700000, confidence: 'medium' },
  { month: 'Aug 2026', revenue_forecast: 13800000, expense_forecast: 8200000, profit_forecast: 5600000, confidence: 'medium' },
  { month: 'Sep 2026', revenue_forecast: 14100000, expense_forecast: 8400000, profit_forecast: 5700000, confidence: 'low' },
]

export default function BudgetingPage() {
  const [tab, setTab] = useState('budget')
  const [newBudget, setNewBudget] = useState(false)

  const totalBudget = MOCK_BUDGETS.reduce((s, b) => s + b.annual_budget, 0)
  const totalActual = MOCK_BUDGETS.reduce((s, b) => s + b.ytd_actual, 0)
  const ytdBudget = totalBudget / 2  // ~50% of year elapsed
  const overBudget = MOCK_BUDGETS.filter(b => b.variance < 0).length

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Budgeting & Forecasting"
        description="Annual budgets, cost center tracking, variance analysis, and financial forecasting"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewBudget(true)}>Add Budget Line</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Annual Budget" value={formatCurrency(totalBudget)} icon={<Target className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="YTD Actual" value={formatCurrency(totalActual)} icon={<BarChart3 className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="Budget Utilization" value={`${Math.round((totalActual / ytdBudget) * 100)}%`} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" delta={{ value: 'vs YTD budget', positive: totalActual <= ytdBudget }} />
        <StatCard label="Over-Budget Lines" value={overBudget.toString()} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" delta={overBudget > 0 ? { value: 'Review needed', positive: false } : undefined} />
      </div>

      <TabBar
        tabs={[
          { id: 'budget', label: 'Budget Lines' },
          { id: 'costcenters', label: 'Cost Centers' },
          { id: 'variance', label: 'Variance Analysis' },
          { id: 'forecast', label: 'Forecast' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'budget' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Budget Lines — FY 2026-27</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewBudget(true)}>Add Line</Button>
          </div>
          <Table>
            <Thead>
              <tr><Th>Cost Center</Th><Th>Budget Head</Th><Th align="right">Annual Budget</Th><Th align="right">YTD Budget</Th><Th align="right">YTD Actual</Th><Th align="right">Variance</Th><Th>Status</Th></tr>
            </Thead>
            <Tbody>
              {MOCK_BUDGETS.map(b => {
                const ytd = (b.q1 + b.q2) / 2
                const variancePct = b.variance !== 0 ? (Math.abs(b.variance) / ytd * 100).toFixed(1) : '0'
                return (
                  <Tr key={b.id}>
                    <Td><span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{b.cost_center}</span></Td>
                    <Td><span className="font-medium text-slate-800">{b.head}</span></Td>
                    <Td align="right"><span className="data-value">{formatCurrency(b.annual_budget)}</span></Td>
                    <Td align="right"><span className="text-slate-600">{formatCurrency(b.q1 + b.q2)}</span></Td>
                    <Td align="right"><span className="font-semibold">{formatCurrency(b.ytd_actual)}</span></Td>
                    <Td align="right">
                      <span className={`font-bold ${b.variance < 0 ? 'text-red-600' : b.variance > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {b.variance < 0 ? '-' : b.variance > 0 ? '+' : ''}{formatCurrency(Math.abs(b.variance))}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">({variancePct}%)</span>
                    </Td>
                    <Td>
                      <Badge variant={b.variance < -100000 ? 'danger' : b.variance < 0 ? 'warning' : 'success'}>
                        {b.variance < 0 ? 'Over' : b.variance > 0 ? 'Under' : 'On Track'}
                      </Badge>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex gap-6 text-xs">
            <span className="text-slate-500">Total Budget: <strong>{formatCurrency(totalBudget)}</strong></span>
            <span className="text-slate-500">YTD Actual: <strong>{formatCurrency(totalActual)}</strong></span>
            <span className="text-slate-500">Net Variance: <strong className={totalActual > ytdBudget ? 'text-red-600' : 'text-emerald-600'}>{formatCurrency(Math.abs(totalActual - ytdBudget))}</strong></span>
          </div>
        </Card>
      )}

      {tab === 'costcenters' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {MOCK_COST_CENTERS.map(cc => {
            const pct = Math.round((cc.actual / (cc.budget / 2)) * 100)
            return (
              <Card key={cc.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-800">{cc.name}</p>
                    <p className="text-xs text-slate-500">Head: {cc.head} · Code: {cc.code}</p>
                  </div>
                  <Badge variant={pct > 110 ? 'danger' : pct > 95 ? 'warning' : 'success'}>{pct}% utilized</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Annual Budget</span>
                    <span className="font-semibold">{formatCurrency(cc.budget)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">YTD Actual</span>
                    <span className="font-semibold">{formatCurrency(cc.actual)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Remaining</span>
                    <span className={`font-semibold ${cc.budget - cc.actual < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(cc.budget - cc.actual)}</span>
                  </div>
                  <div className="mt-2">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct > 110 ? 'bg-red-500' : pct > 95 ? 'bg-amber-400' : 'bg-blue-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'variance' && (
        <Card>
          <CardHeader title="Variance Analysis" description="Budget vs Actual — YTD May 2026" />
          <div className="space-y-3 mt-4">
            {MOCK_BUDGETS.sort((a, b) => a.variance - b.variance).map(b => {
              const ytd = b.q1 + b.q2
              const pct = ytd > 0 ? ((b.variance / ytd) * 100) : 0
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{b.cost_center} — {b.head}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${b.variance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {b.variance < 0 ? '▼' : '▲'} {formatCurrency(Math.abs(b.variance))}
                      </span>
                      <span className="text-xs text-slate-400">({Math.abs(pct).toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${b.variance < 0 ? 'bg-red-400' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min(Math.abs(pct), 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {tab === 'forecast' && (
        <div className="space-y-4">
          <Card padding="none">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">Rolling 4-Month Financial Forecast</p>
            </div>
            <Table>
              <Thead><tr><Th>Month</Th><Th align="right">Revenue Forecast</Th><Th align="right">Expense Forecast</Th><Th align="right">Profit Forecast</Th><Th>Confidence</Th></tr></Thead>
              <Tbody>
                {MOCK_FORECASTS.map(f => (
                  <Tr key={f.month}>
                    <Td><span className="font-medium text-slate-800">{f.month}</span></Td>
                    <Td align="right"><span className="data-value text-emerald-700">{formatCurrency(f.revenue_forecast)}</span></Td>
                    <Td align="right"><span className="data-value text-red-600">{formatCurrency(f.expense_forecast)}</span></Td>
                    <Td align="right"><span className="font-bold text-blue-700">{formatCurrency(f.profit_forecast)}</span></Td>
                    <Td><Badge variant={f.confidence === 'high' ? 'success' : f.confidence === 'medium' ? 'warning' : 'neutral'}>{f.confidence}</Badge></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      <Modal open={newBudget} onClose={() => setNewBudget(false)} title="Add Budget Line" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewBudget(false)}>Cancel</Button><Button size="sm">Save</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Cost Center" options={MOCK_COST_CENTERS.map(c => ({ label: c.name, value: c.id }))} />
            <Input label="Budget Head / Account" placeholder="e.g. Salaries, Software Tools" required />
            <Input label="Annual Budget (₹)" type="number" required />
            <Select label="Financial Year" options={[{ label: 'FY 2026-27', value: 'FY2027' }, { label: 'FY 2025-26', value: 'FY2026' }]} />
            <Input label="Q1 Budget (₹)" type="number" placeholder="Auto-split" />
            <Input label="Q2 Budget (₹)" type="number" placeholder="Auto-split" />
            <Input label="Q3 Budget (₹)" type="number" placeholder="Auto-split" />
            <Input label="Q4 Budget (₹)" type="number" placeholder="Auto-split" />
          </div>
          <Textarea label="Remarks" rows={2} placeholder="Budget justification / notes" />
        </div>
      </Modal>
    </div>
  )
}
