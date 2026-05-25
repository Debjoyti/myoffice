'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, DetailGrid, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Plus, Download,
  FileText, CheckCircle2, Clock, AlertCircle, Eye, Edit2, FlaskConical, RefreshCw
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// ─── Illustrative fallback data (shown when DB is empty) ────────────────────
const MOCK_MONTHLY = [
  { month: 'Oct', revenue: 9800000, expenses: 6200000, profit: 3600000 },
  { month: 'Nov', revenue: 10200000, expenses: 6500000, profit: 3700000 },
  { month: 'Dec', revenue: 11500000, expenses: 7000000, profit: 4500000 },
  { month: 'Jan', revenue: 10800000, expenses: 6800000, profit: 4000000 },
  { month: 'Feb', revenue: 11200000, expenses: 6900000, profit: 4300000 },
  { month: 'Mar', revenue: 12100000, expenses: 7200000, profit: 4900000 },
  { month: 'Apr', revenue: 11700000, expenses: 7000000, profit: 4700000 },
  { month: 'May', revenue: 12450000, expenses: 7315000, profit: 5135000 },
]

const MOCK_INVOICES = [
  { id: 'INV-2026-041', invoice_number: 'INV-2026-041', client: 'Tata Consultancy Services', total_amount: 480000, due_date: '2026-06-15', issue_date: '2026-05-15', status: 'sent' },
  { id: 'INV-2026-040', invoice_number: 'INV-2026-040', client: 'Infosys Ltd', total_amount: 320000, due_date: '2026-06-01', issue_date: '2026-05-01', status: 'paid' },
  { id: 'INV-2026-039', invoice_number: 'INV-2026-039', client: 'Wipro Technologies', total_amount: 215000, due_date: '2026-05-28', issue_date: '2026-04-28', status: 'overdue' },
  { id: 'INV-2026-038', invoice_number: 'INV-2026-038', client: 'HCL Technologies', total_amount: 560000, due_date: '2026-06-20', issue_date: '2026-05-20', status: 'draft' },
  { id: 'INV-2026-037', invoice_number: 'INV-2026-037', client: 'Cognizant Technology', total_amount: 395000, due_date: '2026-06-10', issue_date: '2026-05-10', status: 'paid' },
]

const MOCK_EXPENSES = [
  { id: 'EXP-001', category: 'Office Rent', amount: 850000, employee: { full_name: 'Finance Team' }, description: 'Embassy Business Hub', created_at: '2026-05-01', status: 'approved' },
  { id: 'EXP-002', category: 'Cloud Infrastructure', amount: 125000, employee: { full_name: 'IT Team' }, description: 'AWS India', created_at: '2026-05-03', status: 'approved' },
  { id: 'EXP-003', category: 'Team Travel', amount: 45000, employee: { full_name: 'Ravi Kumar' }, description: 'IndiGo Airlines', created_at: '2026-05-05', status: 'pending' },
  { id: 'EXP-004', category: 'Software Licenses', amount: 95000, employee: { full_name: 'IT Team' }, description: 'Adobe Inc.', created_at: '2026-05-07', status: 'approved' },
  { id: 'EXP-005', category: 'Marketing', amount: 200000, employee: { full_name: 'Marketing Team' }, description: 'Google Ads', created_at: '2026-05-10', status: 'approved' },
]

// ─── Types ──────────────────────────────────────────────────────────────────
type Invoice = {
  id: string; invoice_number: string; client?: string; total_amount: number
  due_date: string; issue_date: string; status: string
}
type Expense = {
  id: string; category: string; amount: number; description?: string
  employee?: { full_name: string }; created_at: string; status: string
}
type Monthly = { month: string; revenue: number; expenses: number; profit: number }

const INV_STATUS: Record<string, 'success' | 'info' | 'danger' | 'neutral'> = {
  paid: 'success', sent: 'info', overdue: 'danger', draft: 'neutral', partial: 'warning' as any,
}

function fmtLakh(n: number) {
  const l = n / 100000
  return `₹${l >= 100 ? (n / 10000000).toFixed(1) + 'Cr' : l.toFixed(1) + 'L'}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function FinancePage() {
  const [tab, setTab] = useState('overview')
  const [search, setSearch] = useState('')
  const [newInvoice, setNewInvoice] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(false)

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [monthly, setMonthly] = useState<Monthly[]>([])

  // New invoice form state
  const [form, setForm] = useState({ invoice_number: '', client: '', issue_date: '', due_date: '', total_amount: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/finance')
      if (!res.ok) throw new Error('API error')
      const data = await res.json()

      const hasRealData = data.invoices?.length > 0 || data.expenses?.length > 0
      if (hasRealData) {
        setInvoices(data.invoices ?? [])
        setExpenses(data.expenses ?? [])
        setMonthly(data.monthly?.length > 0 ? data.monthly : MOCK_MONTHLY)
        setIsPreview(false)
      } else {
        // Empty DB — show illustrative data with preview banner
        setInvoices(MOCK_INVOICES as any)
        setExpenses(MOCK_EXPENSES as any)
        setMonthly(MOCK_MONTHLY)
        setIsPreview(true)
      }
    } catch {
      setInvoices(MOCK_INVOICES as any)
      setExpenses(MOCK_EXPENSES as any)
      setMonthly(MOCK_MONTHLY)
      setIsPreview(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreateInvoice = async () => {
    if (!form.invoice_number || !form.total_amount) return
    setSaving(true)
    try {
      const res = await fetch('/api/v1/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'invoice', ...form }),
      })
      if (res.ok) {
        setNewInvoice(false)
        setForm({ invoice_number: '', client: '', issue_date: '', due_date: '', total_amount: '' })
        fetchData()
      }
    } finally {
      setSaving(false)
    }
  }

  const totalAR = invoices.filter(i => i.status === 'sent').reduce((s, i) => s + Number(i.total_amount), 0)
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.total_amount), 0)
  const totalExpenses = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + Number(e.amount), 0)
  const currentMonth = monthly[monthly.length - 1] ?? { revenue: 0, expenses: 0, profit: 0 }

  const filteredInvoices = invoices.filter(i =>
    !search ||
    (i.client ?? i.invoice_number).toLowerCase().includes(search.toLowerCase()) ||
    i.invoice_number.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Preview banner — only when DB has no real data */}
      {isPreview && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
          <span><strong>Preview mode</strong> — Finance data is illustrative. Create your first invoice to see live data.</span>
        </div>
      )}

      <PageHeader
        title="Finance"
        description="Accounts receivable, expenses, P&L, and financial reporting"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchData}>Refresh</Button>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewInvoice(true)}>New Invoice</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Revenue MTD" value={fmtLakh(currentMonth.revenue)} delta={{ value: '8.3%', positive: true }} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Accounts Receivable" value={fmtLakh(totalAR)} icon={<ArrowUpRight className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Operating Expenses" value={fmtLakh(totalExpenses)} icon={<ArrowDownLeft className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
        <StatCard label="Overdue AR" value={fmtLakh(totalOverdue)} delta={totalOverdue > 0 ? { value: 'Needs attention', positive: false } : undefined} icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
      </div>

      <TabBar
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'invoices', label: 'Invoices', count: invoices.length },
          { id: 'expenses', label: 'Expenses', count: expenses.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Gross Revenue', value: fmtLakh(currentMonth.revenue), note: 'Current month', color: 'text-emerald-600' },
              { label: 'Operating Expenses', value: fmtLakh(currentMonth.expenses), note: 'Current month', color: 'text-red-500' },
              { label: 'Net Profit', value: fmtLakh(currentMonth.profit), note: `${currentMonth.revenue > 0 ? ((currentMonth.profit / currentMonth.revenue) * 100).toFixed(1) : '0'}% margin`, color: 'text-blue-600' },
            ].map(s => (
              <Card key={s.label}>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
                <p className={`text-2xl font-bold mt-2 data-value ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.note}</p>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader title="Revenue & Profit Trend" description={isPreview ? 'Last 8 months (illustrative)' : 'Based on recorded payments'} />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
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
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#rev)" />
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
              <Button variant="outline" size="sm" onClick={() => setSearch('')}>All</Button>
              <Button variant="ghost" size="sm" onClick={() => setSearch('sent')}>Unpaid</Button>
              <Button variant="ghost" size="sm" onClick={() => setSearch('overdue')}>Overdue</Button>
            </div>
          </div>
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading invoices…</div>
          ) : (
            <Table>
              <Thead><tr><Th>Invoice</Th><Th>Client</Th><Th>Issued</Th><Th>Due Date</Th><Th align="right">Amount</Th><Th>Status</Th><Th></Th></tr></Thead>
              <Tbody>
                {filteredInvoices.length === 0 ? (
                  <Tr><Td colSpan={7}><div className="py-8 text-center text-slate-400 text-sm">No invoices yet</div></Td></Tr>
                ) : filteredInvoices.map(inv => (
                  <Tr key={inv.id}>
                    <Td><span className="font-mono text-xs font-medium text-blue-600">{inv.invoice_number}</span></Td>
                    <Td><span className="font-medium text-slate-800">{inv.client ?? '—'}</span></Td>
                    <Td><span className="text-xs text-slate-500">{fmtDate(inv.issue_date)}</span></Td>
                    <Td>
                      <span className={`text-xs ${inv.status === 'overdue' ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                        {inv.status === 'overdue' && <AlertCircle className="h-3 w-3 inline mr-1" />}
                        {fmtDate(inv.due_date)}
                      </span>
                    </Td>
                    <Td align="right"><span className="data-value font-medium">{formatCurrency(Number(inv.total_amount))}</span></Td>
                    <Td><Badge variant={INV_STATUS[inv.status] ?? 'neutral'}>{inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</Badge></Td>
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
          )}
        </Card>
      )}

      {tab === 'expenses' && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Expense Claims</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => {}}>Add Expense</Button>
          </div>
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading expenses…</div>
          ) : (
            <>
              <Table>
                <Thead><tr><Th>Category</Th><Th>Employee</Th><Th>Description</Th><Th>Date</Th><Th align="right">Amount</Th><Th>Status</Th></tr></Thead>
                <Tbody>
                  {expenses.length === 0 ? (
                    <Tr><Td colSpan={6}><div className="py-8 text-center text-slate-400 text-sm">No expense claims yet</div></Td></Tr>
                  ) : expenses.map(exp => (
                    <Tr key={exp.id}>
                      <Td><span className="font-medium text-slate-800">{exp.category}</span></Td>
                      <Td><span className="text-slate-600">{(exp.employee as any)?.full_name ?? '—'}</span></Td>
                      <Td><span className="text-xs text-slate-500 truncate max-w-[180px] block">{exp.description ?? '—'}</span></Td>
                      <Td><span className="text-xs text-slate-500">{fmtDate(exp.created_at)}</span></Td>
                      <Td align="right"><span className="data-value font-medium">{formatCurrency(Number(exp.amount))}</span></Td>
                      <Td>
                        <Badge variant={exp.status === 'approved' ? 'success' : exp.status === 'rejected' ? 'danger' : 'warning'} dot>
                          {exp.status.charAt(0).toUpperCase() + exp.status.slice(1)}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">Total approved: <span className="font-semibold text-slate-700">{formatCurrency(totalExpenses)}</span></p>
              </div>
            </>
          )}
        </Card>
      )}

      {/* New Invoice Modal */}
      <Modal open={newInvoice} onClose={() => setNewInvoice(false)} title="Create Invoice" size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewInvoice(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleCreateInvoice}>Save as Draft</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Invoice Number" placeholder="INV-2026-001" required value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} />
            <Input label="Client Name" placeholder="e.g. Infosys Ltd" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} />
            <Input label="Invoice Date" type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
            <Input label="Due Date" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
          <Divider label="Amount" />
          <Input label="Total Amount (₹)" type="number" placeholder="100000" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
