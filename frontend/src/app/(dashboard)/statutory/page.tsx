'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, Modal, Input, Select
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  Shield, Download, Send, CheckCircle2, AlertCircle, Clock, FileText, Users
} from 'lucide-react'

const MOCK_PF = [
  { id: 'PF-001', month: 'Apr 2026', employees: 82, employee_contribution: 524880, employer_contribution: 524880, admin_charges: 5249, eps_contribution: 191800, total: 1055009, due_date: '2026-05-15', status: 'paid', challan: 'PF-CHALLAN-001' },
  { id: 'PF-002', month: 'May 2026', employees: 84, employee_contribution: 537600, employer_contribution: 537600, admin_charges: 5376, eps_contribution: 196560, total: 1080576, due_date: '2026-06-15', status: 'pending', challan: null },
]

const MOCK_ESI = [
  { id: 'ESI-001', month: 'Apr 2026', eligible_employees: 48, employee_contribution: 84480, employer_contribution: 281600, total: 366080, due_date: '2026-05-15', status: 'paid', challan: 'ESI-CHALLAN-001' },
  { id: 'ESI-002', month: 'May 2026', eligible_employees: 50, employee_contribution: 88000, employer_contribution: 293333, total: 381333, due_date: '2026-06-15', status: 'pending', challan: null },
]

const MOCK_PT = [
  { id: 'PT-001', state: 'Maharashtra', month: 'Apr 2026', employees: 82, amount: 2050, due_date: '2026-05-31', status: 'paid' },
  { id: 'PT-002', state: 'Karnataka', month: 'Apr 2026', employees: 15, amount: 1500, due_date: '2026-05-20', status: 'paid' },
  { id: 'PT-003', state: 'Maharashtra', month: 'May 2026', employees: 84, amount: 2100, due_date: '2026-06-30', status: 'pending' },
]

const MOCK_COMPLIANCE = [
  { id: 'CMP-001', act: 'Provident Fund (EPF)', frequency: 'Monthly', next_due: '2026-06-15', amount: 1080576, status: 'pending' },
  { id: 'CMP-002', act: 'ESI (ESIC)', frequency: 'Monthly', next_due: '2026-06-15', amount: 381333, status: 'pending' },
  { id: 'CMP-003', act: 'Professional Tax (Maharashtra)', frequency: 'Monthly', next_due: '2026-06-30', amount: 2100, status: 'pending' },
  { id: 'CMP-004', act: 'TDS Deposit (194J, 194C, 194I)', frequency: 'Monthly', next_due: '2026-06-07', amount: 160100, status: 'pending' },
  { id: 'CMP-005', act: 'GSTR-1', frequency: 'Monthly', next_due: '2026-06-11', amount: null, status: 'pending' },
  { id: 'CMP-006', act: 'GSTR-3B', frequency: 'Monthly', next_due: '2026-06-20', amount: 324000, status: 'pending' },
  { id: 'CMP-007', act: 'Advance Tax (Q1)', frequency: 'Quarterly', next_due: '2026-06-15', amount: 1500000, status: 'upcoming' },
  { id: 'CMP-008', act: 'Annual Return — PF (Form 3A/6A)', frequency: 'Annual', next_due: '2026-04-30', amount: null, status: 'filed' },
  { id: 'CMP-009', act: 'Annual Return — ESI', frequency: 'Annual', next_due: '2026-11-11', amount: null, status: 'upcoming' },
  { id: 'CMP-010', act: 'Labour Welfare Fund (LWF)', frequency: 'Half-yearly', next_due: '2026-06-30', amount: 1680, status: 'upcoming' },
]

const STATUS_VARIANT: Record<string, any> = { paid: 'success', pending: 'warning', upcoming: 'info', filed: 'success' }

export default function StatutoryPage() {
  const [tab, setTab] = useState('calendar')

  const pendingPayments = MOCK_COMPLIANCE.filter(c => c.status === 'pending').length
  const totalPFDue = MOCK_PF.filter(p => p.status === 'pending').reduce((s, p) => s + p.total, 0)
  const totalESIDue = MOCK_ESI.filter(e => e.status === 'pending').reduce((s, e) => s + e.total, 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Statutory Compliance"
        description="EPF, ESI, Professional Tax, Labour Welfare Fund, and all statutory obligations"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export Calendar</Button>
            <Button size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>Generate ECR (PF)</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Pending Obligations" value={pendingPayments.toString()} icon={<AlertCircle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" delta={{ value: 'This month', positive: false }} />
        <StatCard label="PF Due" value={formatCurrency(totalPFDue)} icon={<Users className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="ESI Due" value={formatCurrency(totalESIDue)} icon={<Shield className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="Prof. Tax Due" value={formatCurrency(MOCK_PT.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0))} icon={<FileText className="h-4 w-4" />} />
      </div>

      <TabBar
        tabs={[
          { id: 'calendar', label: 'Compliance Calendar' },
          { id: 'pf', label: 'PF / EPF' },
          { id: 'esi', label: 'ESI / ESIC' },
          { id: 'pt', label: 'Professional Tax' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'calendar' && (
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Statutory Compliance Calendar — Jun 2026</p>
          </div>
          <Table>
            <Thead><tr><Th>Statutory Obligation</Th><Th>Frequency</Th><Th>Due Date</Th><Th align="right">Amount</Th><Th>Status</Th><Th></Th></tr></Thead>
            <Tbody>
              {MOCK_COMPLIANCE.map(c => (
                <Tr key={c.id}>
                  <Td><span className="font-medium text-slate-800">{c.act}</span></Td>
                  <Td><span className="text-xs text-slate-500">{c.frequency}</span></Td>
                  <Td><span className="text-xs font-medium text-slate-600">{c.next_due}</span></Td>
                  <Td align="right"><span className="data-value">{c.amount ? formatCurrency(c.amount) : '—'}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></Td>
                  <Td>{c.status === 'pending' && <Button variant="ghost" size="sm">Mark Paid</Button>}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'pf' && (
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Employees Provident Fund (EPF) — Monthly Summary</p>
            <p className="text-xs text-slate-400 mt-0.5">EPFO UAN-based contribution at 12% employee + 12% employer (3.67% EPS + 8.33% EPF)</p>
          </div>
          <Table>
            <Thead>
              <tr><Th>Month</Th><Th>Employees</Th><Th align="right">Employee (12%)</Th><Th align="right">Employer EPF</Th><Th align="right">EPS (8.33%)</Th><Th align="right">Admin</Th><Th align="right">Total</Th><Th>Due Date</Th><Th>Status</Th></tr>
            </Thead>
            <Tbody>
              {MOCK_PF.map(p => (
                <Tr key={p.id}>
                  <Td><span className="font-medium text-slate-800">{p.month}</span></Td>
                  <Td><span className="text-sm">{p.employees}</span></Td>
                  <Td align="right"><span className="text-slate-600">{formatCurrency(p.employee_contribution)}</span></Td>
                  <Td align="right"><span className="text-slate-600">{formatCurrency(p.employer_contribution - p.eps_contribution)}</span></Td>
                  <Td align="right"><span className="text-slate-600">{formatCurrency(p.eps_contribution)}</span></Td>
                  <Td align="right"><span className="text-slate-600">{formatCurrency(p.admin_charges)}</span></Td>
                  <Td align="right"><span className="font-bold text-blue-700">{formatCurrency(p.total)}</span></Td>
                  <Td><span className="text-xs text-slate-500">{p.due_date}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'esi' && (
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Employees State Insurance (ESI) — Monthly Summary</p>
            <p className="text-xs text-slate-400 mt-0.5">Employees earning ≤ ₹21,000/month: Employee 0.75% + Employer 3.25%</p>
          </div>
          <Table>
            <Thead>
              <tr><Th>Month</Th><Th>Eligible Employees</Th><Th align="right">Employee (0.75%)</Th><Th align="right">Employer (3.25%)</Th><Th align="right">Total</Th><Th>Due Date</Th><Th>Status</Th></tr>
            </Thead>
            <Tbody>
              {MOCK_ESI.map(e => (
                <Tr key={e.id}>
                  <Td><span className="font-medium text-slate-800">{e.month}</span></Td>
                  <Td><span className="text-sm">{e.eligible_employees}</span></Td>
                  <Td align="right"><span className="text-slate-600">{formatCurrency(e.employee_contribution)}</span></Td>
                  <Td align="right"><span className="text-slate-600">{formatCurrency(e.employer_contribution)}</span></Td>
                  <Td align="right"><span className="font-bold text-violet-700">{formatCurrency(e.total)}</span></Td>
                  <Td><span className="text-xs text-slate-500">{e.due_date}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[e.status]}>{e.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'pt' && (
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Professional Tax (State-wise)</p>
          </div>
          <Table>
            <Thead><tr><Th>State</Th><Th>Month</Th><Th>Employees</Th><Th align="right">Amount</Th><Th>Due Date</Th><Th>Status</Th><Th></Th></tr></Thead>
            <Tbody>
              {MOCK_PT.map(p => (
                <Tr key={p.id}>
                  <Td><span className="font-medium text-slate-800">{p.state}</span></Td>
                  <Td><span className="text-sm">{p.month}</span></Td>
                  <Td><span className="text-sm">{p.employees}</span></Td>
                  <Td align="right"><span className="font-semibold">{formatCurrency(p.amount)}</span></Td>
                  <Td><span className="text-xs text-slate-500">{p.due_date}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge></Td>
                  <Td>{p.status === 'pending' && <Button variant="ghost" size="sm">Pay</Button>}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}
