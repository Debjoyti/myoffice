'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  BookOpen, Plus, Download, RefreshCw, Eye, Edit2, TrendingUp,
  TrendingDown, DollarSign, BarChart3, FileText, CheckCircle2
} from 'lucide-react'

const MOCK_ACCOUNTS = [
  { code: '1001', name: 'Cash & Bank', type: 'Asset', group: 'Current Assets', balance: 4250000, normal: 'Dr' },
  { code: '1100', name: 'Accounts Receivable', type: 'Asset', group: 'Current Assets', balance: 8420000, normal: 'Dr' },
  { code: '1200', name: 'Inventory', type: 'Asset', group: 'Current Assets', balance: 3180000, normal: 'Dr' },
  { code: '1500', name: 'Fixed Assets (Net)', type: 'Asset', group: 'Non-Current Assets', balance: 12500000, normal: 'Dr' },
  { code: '2001', name: 'Accounts Payable', type: 'Liability', group: 'Current Liabilities', balance: 3200000, normal: 'Cr' },
  { code: '2100', name: 'GST Payable', type: 'Liability', group: 'Current Liabilities', balance: 544000, normal: 'Cr' },
  { code: '2200', name: 'TDS Payable', type: 'Liability', group: 'Current Liabilities', balance: 125000, normal: 'Cr' },
  { code: '2500', name: 'Long-term Loans', type: 'Liability', group: 'Non-Current Liabilities', balance: 5000000, normal: 'Cr' },
  { code: '3001', name: 'Share Capital', type: 'Equity', group: 'Shareholders Equity', balance: 10000000, normal: 'Cr' },
  { code: '3100', name: 'Retained Earnings', type: 'Equity', group: 'Shareholders Equity', balance: 9481000, normal: 'Cr' },
  { code: '4001', name: 'Revenue from Services', type: 'Income', group: 'Operating Revenue', balance: 12450000, normal: 'Cr' },
  { code: '4100', name: 'Other Income', type: 'Income', group: 'Non-Operating', balance: 230000, normal: 'Cr' },
  { code: '5001', name: 'Cost of Services', type: 'Expense', group: 'COGS', balance: 4820000, normal: 'Dr' },
  { code: '5100', name: 'Employee Salaries', type: 'Expense', group: 'Operating Expenses', balance: 3200000, normal: 'Dr' },
  { code: '5200', name: 'Rent & Utilities', type: 'Expense', group: 'Operating Expenses', balance: 980000, normal: 'Dr' },
  { code: '5300', name: 'Marketing', type: 'Expense', group: 'Operating Expenses', balance: 315000, normal: 'Dr' },
]

const MOCK_JOURNALS = [
  { id: 'JV-2026-001', date: '2026-05-01', reference: 'INV-2026-041', narration: 'Revenue from TCS Project', debit: 480000, credit: 480000, status: 'posted' },
  { id: 'JV-2026-002', date: '2026-05-03', reference: 'EXP-2026-001', narration: 'Office Rent — Embassy Business Hub', debit: 850000, credit: 850000, status: 'posted' },
  { id: 'JV-2026-003', date: '2026-05-05', reference: 'SAL-2026-05', narration: 'Salary disbursement May 2026', debit: 3200000, credit: 3200000, status: 'posted' },
  { id: 'JV-2026-004', date: '2026-05-10', reference: 'TDS-2026-05', narration: 'TDS deducted on professional fees', debit: 125000, credit: 125000, status: 'posted' },
  { id: 'JV-2026-005', date: '2026-05-15', reference: 'GST-2026-05', narration: 'GST payment — GSTR-3B May', debit: 324000, credit: 324000, status: 'pending' },
  { id: 'JV-2026-006', date: '2026-05-20', reference: 'INV-2026-042', narration: 'Revenue from Wipro engagement', debit: 215000, credit: 215000, status: 'draft' },
]

const MOCK_TRIAL_BALANCE = [
  { account: 'Cash & Bank', debit: 4250000, credit: 0 },
  { account: 'Accounts Receivable', debit: 8420000, credit: 0 },
  { account: 'Inventory', debit: 3180000, credit: 0 },
  { account: 'Fixed Assets (Net)', debit: 12500000, credit: 0 },
  { account: 'Accounts Payable', debit: 0, credit: 3200000 },
  { account: 'GST Payable', debit: 0, credit: 544000 },
  { account: 'Share Capital', debit: 0, credit: 10000000 },
  { account: 'Retained Earnings', debit: 0, credit: 9481000 },
  { account: 'Revenue from Services', debit: 0, credit: 12450000 },
  { account: 'Cost of Services', debit: 4820000, credit: 0 },
  { account: 'Salaries', debit: 3200000, credit: 0 },
  { account: 'Rent & Utilities', debit: 980000, credit: 0 },
]

const TYPE_COLOR: Record<string, string> = {
  Asset: 'text-blue-600 bg-blue-50',
  Liability: 'text-red-600 bg-red-50',
  Equity: 'text-violet-600 bg-violet-50',
  Income: 'text-emerald-600 bg-emerald-50',
  Expense: 'text-amber-600 bg-amber-50',
}

const STATUS_VARIANT: Record<string, any> = { posted: 'success', pending: 'warning', draft: 'neutral' }

export default function AccountingPage() {
  const [tab, setTab] = useState('coa')
  const [search, setSearch] = useState('')
  const [newAccount, setNewAccount] = useState(false)
  const [newJV, setNewJV] = useState(false)

  const totalAssets = MOCK_ACCOUNTS.filter(a => a.type === 'Asset').reduce((s, a) => s + a.balance, 0)
  const totalLiabilities = MOCK_ACCOUNTS.filter(a => a.type === 'Liability').reduce((s, a) => s + a.balance, 0)
  const totalIncome = MOCK_ACCOUNTS.filter(a => a.type === 'Income').reduce((s, a) => s + a.balance, 0)
  const totalExpenses = MOCK_ACCOUNTS.filter(a => a.type === 'Expense').reduce((s, a) => s + a.balance, 0)

  const filteredAccounts = MOCK_ACCOUNTS.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search)
  )

  const tbDebit = MOCK_TRIAL_BALANCE.reduce((s, r) => s + r.debit, 0)
  const tbCredit = MOCK_TRIAL_BALANCE.reduce((s, r) => s + r.credit, 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="General Ledger & Accounting"
        description="Chart of accounts, journal entries, trial balance, P&L, and balance sheet"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewAccount(true)}>Add Account</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewJV(true)}>Journal Entry</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Assets" value={formatCurrency(totalAssets)} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Total Liabilities" value={formatCurrency(totalLiabilities)} icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
        <StatCard label="Total Revenue" value={formatCurrency(totalIncome)} icon={<DollarSign className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Net Profit" value={formatCurrency(totalIncome - totalExpenses)} icon={<BarChart3 className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" delta={{ value: `${((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1)}% margin`, positive: true }} />
      </div>

      <TabBar
        tabs={[
          { id: 'coa', label: 'Chart of Accounts' },
          { id: 'journals', label: 'Journal Entries', count: MOCK_JOURNALS.length },
          { id: 'trial', label: 'Trial Balance' },
          { id: 'pnl', label: 'P&L Statement' },
          { id: 'bs', label: 'Balance Sheet' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'coa' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
            <SearchInput placeholder="Search accounts..." value={search} onChange={setSearch} className="w-72" />
            <div className="flex gap-2 ml-auto">
              {['All','Asset','Liability','Income','Expense'].map(t => (
                <Button key={t} variant={search === t ? 'primary' : 'ghost'} size="sm" onClick={() => setSearch(t === 'All' ? '' : t)}>{t}</Button>
              ))}
            </div>
          </div>
          <Table>
            <Thead><tr><Th>Code</Th><Th>Account Name</Th><Th>Type</Th><Th>Group</Th><Th>Normal</Th><Th align="right">Balance</Th><Th></Th></tr></Thead>
            <Tbody>
              {filteredAccounts.map(a => (
                <Tr key={a.code}>
                  <Td><span className="font-mono text-xs font-bold text-slate-600">{a.code}</span></Td>
                  <Td><span className="font-medium text-slate-800">{a.name}</span></Td>
                  <Td><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[a.type]}`}>{a.type}</span></Td>
                  <Td><span className="text-xs text-slate-500">{a.group}</span></Td>
                  <Td><Badge variant={a.normal === 'Dr' ? 'info' : 'neutral'}>{a.normal}</Badge></Td>
                  <Td align="right"><span className="data-value font-semibold">{formatCurrency(a.balance)}</span></Td>
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

      {tab === 'journals' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Journal Vouchers</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewJV(true)}>New Journal Entry</Button>
          </div>
          <Table>
            <Thead><tr><Th>Voucher No</Th><Th>Date</Th><Th>Reference</Th><Th>Narration</Th><Th align="right">Debit</Th><Th align="right">Credit</Th><Th>Status</Th><Th></Th></tr></Thead>
            <Tbody>
              {MOCK_JOURNALS.map(j => (
                <Tr key={j.id}>
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{j.id}</span></Td>
                  <Td><span className="text-xs text-slate-500">{j.date}</span></Td>
                  <Td><span className="font-mono text-xs text-slate-600">{j.reference}</span></Td>
                  <Td><span className="text-sm text-slate-700">{j.narration}</span></Td>
                  <Td align="right"><span className="data-value text-blue-700">{formatCurrency(j.debit)}</span></Td>
                  <Td align="right"><span className="data-value text-emerald-700">{formatCurrency(j.credit)}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[j.status]}>{j.status}</Badge></Td>
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

      {tab === 'trial' && (
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Trial Balance — As of 31 May 2026</p>
          </div>
          <Table>
            <Thead><tr><Th>Account</Th><Th align="right">Debit (Dr)</Th><Th align="right">Credit (Cr)</Th></tr></Thead>
            <Tbody>
              {MOCK_TRIAL_BALANCE.map(r => (
                <Tr key={r.account}>
                  <Td><span className="font-medium text-slate-800">{r.account}</span></Td>
                  <Td align="right"><span className={`data-value ${r.debit ? 'text-blue-700' : 'text-slate-300'}`}>{r.debit ? formatCurrency(r.debit) : '—'}</span></Td>
                  <Td align="right"><span className={`data-value ${r.credit ? 'text-emerald-700' : 'text-slate-300'}`}>{r.credit ? formatCurrency(r.credit) : '—'}</span></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <div className="px-5 py-3 border-t-2 border-slate-300 bg-slate-50 flex justify-between">
            <span className="text-sm font-bold text-slate-700">Total</span>
            <div className="flex gap-12">
              <span className="font-bold text-blue-700">{formatCurrency(tbDebit)}</span>
              <span className="font-bold text-emerald-700">{formatCurrency(tbCredit)}</span>
            </div>
          </div>
          {tbDebit === tbCredit && (
            <div className="px-5 py-2 bg-emerald-50 flex items-center gap-2 text-emerald-700 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Trial balance is balanced — Dr = Cr
            </div>
          )}
        </Card>
      )}

      {tab === 'pnl' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Profit & Loss Statement" description="For the period ending 31 May 2026" />
            <div className="space-y-4 mt-3">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Revenue</p>
                <div className="space-y-1">
                  {MOCK_ACCOUNTS.filter(a => a.type === 'Income').map(a => (
                    <div key={a.code} className="flex justify-between text-sm py-1 px-2">
                      <span className="text-slate-600">{a.name}</span>
                      <span className="font-medium">{formatCurrency(a.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm py-1.5 px-2 bg-emerald-50 rounded font-semibold">
                    <span className="text-emerald-800">Total Revenue</span>
                    <span className="text-emerald-700">{formatCurrency(totalIncome)}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Expenses</p>
                <div className="space-y-1">
                  {MOCK_ACCOUNTS.filter(a => a.type === 'Expense').map(a => (
                    <div key={a.code} className="flex justify-between text-sm py-1 px-2">
                      <span className="text-slate-600">{a.name}</span>
                      <span className="font-medium">{formatCurrency(a.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm py-1.5 px-2 bg-red-50 rounded font-semibold">
                    <span className="text-red-800">Total Expenses</span>
                    <span className="text-red-700">{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              </div>
              <div className="border-t-2 border-slate-300 pt-3">
                <div className="flex justify-between text-base py-2 px-2 bg-blue-50 rounded font-bold">
                  <span className="text-blue-900">Net Profit / (Loss)</span>
                  <span className={totalIncome > totalExpenses ? 'text-emerald-700' : 'text-red-700'}>{formatCurrency(totalIncome - totalExpenses)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 px-2">Profit Margin: {((totalIncome - totalExpenses) / totalIncome * 100).toFixed(2)}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'bs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Assets" />
            <div className="space-y-3 mt-3">
              {['Current Assets', 'Non-Current Assets'].map(group => (
                <div key={group}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{group}</p>
                  {MOCK_ACCOUNTS.filter(a => a.type === 'Asset' && a.group === group).map(a => (
                    <div key={a.code} className="flex justify-between text-sm py-1 px-2">
                      <span className="text-slate-600">{a.name}</span>
                      <span className="font-medium">{formatCurrency(a.balance)}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="flex justify-between text-sm py-2 px-2 bg-blue-50 rounded font-bold border-t border-slate-200 mt-2">
                <span className="text-blue-900">Total Assets</span>
                <span className="text-blue-700">{formatCurrency(totalAssets)}</span>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Liabilities & Equity" />
            <div className="space-y-3 mt-3">
              {['Current Liabilities', 'Non-Current Liabilities', 'Shareholders Equity'].map(group => (
                <div key={group}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{group}</p>
                  {MOCK_ACCOUNTS.filter(a => (a.type === 'Liability' || a.type === 'Equity') && a.group === group).map(a => (
                    <div key={a.code} className="flex justify-between text-sm py-1 px-2">
                      <span className="text-slate-600">{a.name}</span>
                      <span className="font-medium">{formatCurrency(a.balance)}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="flex justify-between text-sm py-2 px-2 bg-emerald-50 rounded font-bold border-t border-slate-200 mt-2">
                <span className="text-emerald-900">Total L + E</span>
                <span className="text-emerald-700">{formatCurrency(totalLiabilities + MOCK_ACCOUNTS.filter(a => a.type === 'Equity').reduce((s, a) => s + a.balance, 0))}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* New Account Modal */}
      <Modal open={newAccount} onClose={() => setNewAccount(false)} title="Add Account" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewAccount(false)}>Cancel</Button><Button size="sm">Save Account</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Account Code" placeholder="e.g. 1300" required />
            <Input label="Account Name" placeholder="e.g. Prepaid Expenses" required />
            <Select label="Account Type" options={['Asset','Liability','Equity','Income','Expense'].map(t => ({ label: t, value: t }))} />
            <Select label="Account Group" options={['Current Assets','Non-Current Assets','Current Liabilities','Non-Current Liabilities','Shareholders Equity','Operating Revenue','Non-Operating','COGS','Operating Expenses'].map(g => ({ label: g, value: g }))} />
          </div>
          <Input label="Opening Balance (₹)" type="number" placeholder="0" />
          <Select label="Normal Balance" options={[{ label: 'Debit (Dr)', value: 'Dr' }, { label: 'Credit (Cr)', value: 'Cr' }]} />
        </div>
      </Modal>

      {/* New Journal Entry Modal */}
      <Modal open={newJV} onClose={() => setNewJV(false)} title="New Journal Entry" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewJV(false)}>Cancel</Button><Button variant="outline" size="sm">Save Draft</Button><Button size="sm">Post Entry</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Voucher Date" type="date" required />
            <Input label="Reference No" placeholder="INV / EXP ref" />
            <Select label="Voucher Type" options={[
              { label: 'Journal', value: 'JV' }, { label: 'Payment', value: 'PV' },
              { label: 'Receipt', value: 'RV' }, { label: 'Contra', value: 'CV' },
            ]} />
          </div>
          <Input label="Narration" placeholder="Brief description of transaction..." />
          <Divider label="Debit Entries" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Debit Account" options={MOCK_ACCOUNTS.map(a => ({ label: `${a.code} — ${a.name}`, value: a.code }))} />
            <Input label="Debit Amount (₹)" type="number" placeholder="0" />
          </div>
          <Divider label="Credit Entries" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Credit Account" options={MOCK_ACCOUNTS.map(a => ({ label: `${a.code} — ${a.name}`, value: a.code }))} />
            <Input label="Credit Amount (₹)" type="number" placeholder="0" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
