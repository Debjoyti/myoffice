'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, DetailGrid, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Plus, Download,
  FileText, CheckCircle2, Clock, AlertCircle, Eye, Edit2
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const MONTHLY = [
  { month: 'Oct', revenue: 9800000, expenses: 6200000, profit: 3600000 },
  { month: 'Nov', revenue: 10200000, expenses: 6500000, profit: 3700000 },
  { month: 'Dec', revenue: 11500000, expenses: 7000000, profit: 4500000 },
  { month: 'Jan', revenue: 10800000, expenses: 6800000, profit: 4000000 },
  { month: 'Feb', revenue: 11200000, expenses: 6900000, profit: 4300000 },
  { month: 'Mar', revenue: 12100000, expenses: 7200000, profit: 4900000 },
  { month: 'Apr', revenue: 11700000, expenses: 7000000, profit: 4700000 },
  { month: 'May', revenue: 12450000, expenses: 7315000, profit: 5135000 },
]

const INVOICES = [
  { id: 'INV-2026-041', client: 'Tata Consultancy Services', amount: 480000, due: '15 Jun 2026', issued: '15 May 2026', status: 'Sent' },
  { id: 'INV-2026-040', client: 'Infosys Ltd', amount: 320000, due: '01 Jun 2026', issued: '01 May 2026', status: 'Paid' },
  { id: 'INV-2026-039', client: 'Wipro Technologies', amount: 215000, due: '28 May 2026', issued: '28 Apr 2026', status: 'Overdue' },
  { id: 'INV-2026-038', client: 'HCL Technologies', amount: 560000, due: '20 Jun 2026', issued: '20 May 2026', status: 'Draft' },
  { id: 'INV-2026-037', client: 'Cognizant Technology', amount: 395000, due: '10 Jun 2026', issued: '10 May 2026', status: 'Paid' },
]

const EXPENSES = [
  { id: 'EXP-001', category: 'Office Rent', amount: 850000, vendor: 'Embassy Business Hub', date: '01 May', status: 'Approved', account: 'Rent Expense' },
  { id: 'EXP-002', category: 'Cloud Infrastructure', amount: 125000, vendor: 'AWS India', date: '03 May', status: 'Approved', account: 'IT Expense' },
  { id: 'EXP-003', category: 'Team Travel', amount: 45000, vendor: 'IndiGo Airlines', date: '05 May', status: 'Pending', account: 'Travel Expense' },
  { id: 'EXP-004', category: 'Software Licenses', amount: 95000, vendor: 'Adobe Inc.', date: '07 May', status: 'Approved', account: 'Software Expense' },
  { id: 'EXP-005', category: 'Marketing', amount: 200000, vendor: 'Google Ads', date: '10 May', status: 'Approved', account: 'Marketing Expense' },
  { id: 'EXP-006', category: 'Office Supplies', amount: 28000, vendor: 'Staples India', date: '12 May', status: 'Pending', account: 'Office Expense' },
]

const INV_STATUS: Record<string, 'success' | 'info' | 'danger' | 'neutral'> = {
  Paid: 'success', Sent: 'info', Overdue: 'danger', Draft: 'neutral',
}

function fmtLakh(n: number) {
  const l = n / 100000
  return `₹${l >= 100 ? (n / 10000000).toFixed(1) + 'Cr' : l.toFixed(1) + 'L'}`
}

export default function FinancePage() {
  const [tab, setTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [newInvoice, setNewInvoice] = useState(false)

  const totalAR = INVOICES.filter(i => i.status === 'Sent').reduce((s, i) => s + i.amount, 0)
  const totalOverdue = INVOICES.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0)
  const totalExpenses = EXPENSES.filter(e => e.status === 'Approved').reduce((s, e) => s + e.amount, 0)
  const currentMonth = MONTHLY[MONTHLY.length - 1]

  const filteredInvoices = INVOICES.filter(i => !search || i.client.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Finance"
        description="Accounts receivable, expenses, P&L, and financial reporting"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewInvoice(true)}>New Invoice</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Revenue MTD" value={fmtLakh(currentMonth.revenue)} delta={{ value: '8.3%', positive: true }} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Accounts Receivable" value={fmtLakh(totalAR)} icon={<ArrowUpRight className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard label="Operating Expenses" value={fmtLakh(totalExpenses)} icon={<ArrowDownLeft className="h-4 w-4" />} iconColor="bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400" />
        <StatCard label="Overdue AR" value={fmtLakh(totalOverdue)} delta={{ value: 'Needs attention', positive: false }} icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      </div>

      <TabBar
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'invoices', label: 'Invoices', count: INVOICES.length },
          { id: 'expenses', label: 'Expenses', count: EXPENSES.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'overview' && (
        <div className="space-y-4">
          {/* P&L Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Gross Revenue', value: fmtLakh(currentMonth.revenue), note: 'May 2026', color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Operating Expenses', value: fmtLakh(currentMonth.expenses), note: 'May 2026', color: 'text-red-500 dark:text-red-400' },
              { label: 'Net Profit', value: fmtLakh(currentMonth.profit), note: `${((currentMonth.profit / currentMonth.revenue) * 100).toFixed(1)}% margin`, color: 'text-indigo-600 dark:text-indigo-400' },
            ].map(s => (
              <Card key={s.label}>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
                <p className={`text-2xl font-bold mt-2 data-value ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.note}</p>
              </Card>
            ))}
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader title="Revenue & Profit Trend" description="Last 8 months" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MONTHLY} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `₹${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={54} />
                <Tooltip formatter={(v, n) => [formatCurrency(v as number), (n as string) === 'revenue' ? 'Revenue' : 'Profit']} labelStyle={{ fontSize: 12 }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#rev)" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#profit)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {tab === 'invoices' && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-4 flex items-center gap-3">
            <SearchInput placeholder="Search invoices..." value={search} onChange={setSearch} className="w-72" />
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm">All</Button>
              <Button variant="ghost" size="sm">Unpaid</Button>
              <Button variant="ghost" size="sm">Overdue</Button>
            </div>
          </div>
          <Table>
            <Thead><tr><Th>Invoice</Th><Th>Client</Th><Th>Issued</Th><Th>Due Date</Th><Th align="right">Amount</Th><Th>Status</Th><Th></Th></tr></Thead>
            <Tbody>
              {filteredInvoices.map(inv => (
                <Tr key={inv.id}>
                  <Td><span className="font-mono text-xs font-medium text-indigo-600">{inv.id}</span></Td>
                  <Td><span className="font-medium text-slate-800 dark:text-slate-200">{inv.client}</span></Td>
                  <Td><span className="text-xs text-slate-500">{inv.issued}</span></Td>
                  <Td>
                    <span className={`text-xs ${inv.status === 'Overdue' ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                      {inv.status === 'Overdue' && <AlertCircle className="h-3 w-3 inline mr-1" />}
                      {inv.due}
                    </span>
                  </Td>
                  <Td align="right"><span className="data-value font-medium">{formatCurrency(inv.amount)}</span></Td>
                  <Td><Badge variant={INV_STATUS[inv.status]}>{inv.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon"><Edit2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'expenses' && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">All Expenses</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>Add Expense</Button>
          </div>
          <Table>
            <Thead><tr><Th>Category</Th><Th>Vendor</Th><Th>GL Account</Th><Th>Date</Th><Th align="right">Amount</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {EXPENSES.map(exp => (
                <Tr key={exp.id}>
                  <Td><span className="font-medium text-slate-800 dark:text-slate-200">{exp.category}</span></Td>
                  <Td><span className="text-slate-600 dark:text-slate-400">{exp.vendor}</span></Td>
                  <Td><span className="text-xs text-slate-500">{exp.account}</span></Td>
                  <Td><span className="text-xs text-slate-500">{exp.date}</span></Td>
                  <Td align="right"><span className="data-value font-medium">{formatCurrency(exp.amount)}</span></Td>
                  <Td>
                    <Badge variant={exp.status === 'Approved' ? 'success' : 'warning'} dot>{exp.status}</Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500">Total approved: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(totalExpenses)}</span></p>
          </div>
        </Card>
      )}

      {/* New Invoice Modal */}
      <Modal open={newInvoice} onClose={() => setNewInvoice(false)} title="Create Invoice" size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewInvoice(false)}>Cancel</Button>
          <Button variant="secondary" size="sm">Save as Draft</Button>
          <Button size="sm">Send Invoice</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Client Name" placeholder="e.g. Infosys Ltd" required />
            <Input label="Client Email" type="email" placeholder="accounts@infosys.com" />
            <Input label="Invoice Date" type="date" />
            <Input label="Due Date" type="date" />
          </div>
          <Divider label="Line Items" />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2"><Input label="Description" placeholder="Service / Product description" /></div>
            <Input label="Amount (₹)" type="number" placeholder="100000" />
          </div>
          <Textarea label="Notes" placeholder="Payment terms, bank details, or special instructions..." rows={3} />
        </div>
      </Modal>
    </div>
  )
}
