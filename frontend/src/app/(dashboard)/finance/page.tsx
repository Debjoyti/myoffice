'use client'

import { useState } from 'react'
import { PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td, StatCard, TabBar, SearchInput } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, FileText, Download, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

const INVOICES = [
  { id: 'INV-2026-041', client: 'Tata Consultancy Services', amount: 480000, due: '15 Jun 2026', issued: '15 May 2026', status: 'Sent' },
  { id: 'INV-2026-040', client: 'Infosys Ltd', amount: 320000, due: '01 Jun 2026', issued: '01 May 2026', status: 'Paid' },
  { id: 'INV-2026-039', client: 'Wipro Technologies', amount: 215000, due: '28 May 2026', issued: '28 Apr 2026', status: 'Overdue' },
  { id: 'INV-2026-038', client: 'HCL Technologies', amount: 560000, due: '20 Jun 2026', issued: '20 May 2026', status: 'Draft' },
]

const EXPENSES = [
  { category: 'Office Rent', amount: 850000, vendor: 'Embassy Business Hub', date: '01 May', status: 'Approved' },
  { category: 'Cloud Infrastructure', amount: 125000, vendor: 'AWS India', date: '03 May', status: 'Approved' },
  { category: 'Team Travel', amount: 45000, vendor: 'IndiGo Airlines', date: '05 May', status: 'Pending' },
  { category: 'Software Licenses', amount: 95000, vendor: 'Adobe Inc.', date: '07 May', status: 'Approved' },
  { category: 'Marketing', amount: 200000, vendor: 'Google Ads', date: '10 May', status: 'Approved' },
]

const INV_STATUS: Record<string, 'success' | 'info' | 'danger' | 'neutral'> = {
  Paid: 'success', Sent: 'info', Overdue: 'danger', Draft: 'neutral',
}

export default function FinancePage() {
  const [tab, setTab] = useState('overview')
  const [search, setSearch] = useState('')

  const totalAR = INVOICES.filter(i => i.status !== 'Draft').reduce((s, i) => s + i.amount, 0)
  const totalOverdue = INVOICES.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0)
  const totalExpenses = EXPENSES.filter(e => e.status === 'Approved').reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Finance"
        description="Accounts receivable, expenses, and financial reporting"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>New Invoice</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Revenue MTD" value={formatCurrency(12450000)} delta={{ value: '8.3%', positive: true }} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Accounts Receivable" value={formatCurrency(totalAR)} icon={<ArrowUpRight className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard label="Total Expenses" value={formatCurrency(totalExpenses)} icon={<ArrowDownLeft className="h-4 w-4" />} iconColor="bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400" />
        <StatCard label="Overdue" value={formatCurrency(totalOverdue)} delta={{ value: 'Needs attention', positive: false }} icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      </div>

      {/* P&L snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Gross Revenue', value: formatCurrency(12450000), note: 'May 2026', color: 'text-emerald-600' },
          { label: 'Operating Expenses', value: formatCurrency(totalExpenses), note: 'May 2026', color: 'text-red-500' },
          { label: 'Net Profit', value: formatCurrency(12450000 - totalExpenses), note: `${((12450000 - totalExpenses) / 12450000 * 100).toFixed(1)}% margin`, color: 'text-indigo-600' },
        ].map(m => (
          <Card key={m.label} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 font-medium">{m.label}</p>
              <p className={`text-xl font-bold mt-1 data-value ${m.color}`}>{m.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{m.note}</p>
            </div>
            <DollarSign className="h-8 w-8 text-slate-200 dark:text-slate-700 flex-shrink-0" />
          </Card>
        ))}
      </div>

      <Card padding="none">
        <TabBar
          tabs={[{ id: 'overview', label: 'Invoices' }, { id: 'expenses', label: 'Expenses' }]}
          active={tab}
          onChange={setTab}
        />

        <div className="px-5 pb-4">
          <SearchInput placeholder={tab === 'overview' ? 'Search invoices...' : 'Search expenses...'} value={search} onChange={setSearch} className="w-64" />
        </div>

        {tab === 'overview' && (
          <Table>
            <Thead>
              <tr>
                <Th>Invoice #</Th>
                <Th>Client</Th>
                <Th>Issued</Th>
                <Th>Due Date</Th>
                <Th align="right">Amount</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {INVOICES.filter(i => !search || i.client.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase())).map(inv => (
                <Tr key={inv.id}>
                  <Td><span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">{inv.id}</span></Td>
                  <Td><span className="font-medium text-slate-800 dark:text-slate-200">{inv.client}</span></Td>
                  <Td><span className="text-slate-500">{inv.issued}</span></Td>
                  <Td><span className={inv.status === 'Overdue' ? 'text-red-600 font-medium' : 'text-slate-500'}>{inv.due}</span></Td>
                  <Td align="right"><span className="font-semibold data-value">{formatCurrency(inv.amount)}</span></Td>
                  <Td><Badge variant={INV_STATUS[inv.status]} dot>{inv.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" leftIcon={<FileText className="h-3 w-3" />}>View</Button>
                      {inv.status === 'Draft' && <Button variant="outline" size="sm">Send</Button>}
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        {tab === 'expenses' && (
          <Table>
            <Thead>
              <tr>
                <Th>Category</Th>
                <Th>Vendor</Th>
                <Th>Date</Th>
                <Th align="right">Amount</Th>
                <Th>Status</Th>
              </tr>
            </Thead>
            <Tbody>
              {EXPENSES.filter(e => !search || e.category.toLowerCase().includes(search.toLowerCase()) || e.vendor.toLowerCase().includes(search.toLowerCase())).map(exp => (
                <Tr key={exp.category}>
                  <Td><span className="font-medium text-slate-800 dark:text-slate-200">{exp.category}</span></Td>
                  <Td><span className="text-slate-500">{exp.vendor}</span></Td>
                  <Td><span className="text-slate-500">{exp.date}</span></Td>
                  <Td align="right"><span className="font-semibold data-value">{formatCurrency(exp.amount)}</span></Td>
                  <Td><Badge variant={exp.status === 'Approved' ? 'success' : 'warning'} dot>{exp.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500">{tab === 'overview' ? `${INVOICES.length} invoices` : `${EXPENSES.length} expenses`}</p>
        </div>
      </Card>
    </div>
  )
}
