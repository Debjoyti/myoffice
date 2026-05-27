'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, TabBar, Modal, Input, Select, Textarea, EmptyState, Alert
} from '@/components/ui'
import { TrendingUp, Clock, CheckCircle2, XCircle, Plus, FlaskConical, Receipt } from 'lucide-react'

type ExpenseStatus = 'Submitted' | 'Manager Approved' | 'Approved' | 'Rejected' | 'Paid'
type Category = 'Travel' | 'Meals' | 'Software' | 'Equipment' | 'Training' | 'Marketing' | 'Other'

type Expense = {
  id: string; employee: string; category: Category; amount: number
  description: string; date: string; status: ExpenseStatus; method: 'Bank Transfer' | 'Payroll'
}

const MOCK: Expense[] = [
  { id: 'EXP-001', employee: 'Rahul Mehta', category: 'Travel', amount: 4500, description: 'Client visit to Pune', date: '22 May 2026', status: 'Submitted', method: 'Bank Transfer' },
  { id: 'EXP-002', employee: 'Priya Sharma', category: 'Software', amount: 2999, description: 'Figma annual subscription', date: '20 May 2026', status: 'Approved', method: 'Payroll' },
  { id: 'EXP-003', employee: 'Karan Singh', category: 'Meals', amount: 1200, description: 'Team lunch – sprint retrospective', date: '18 May 2026', status: 'Paid', method: 'Bank Transfer' },
  { id: 'EXP-004', employee: 'Ananya Iyer', category: 'Training', amount: 8000, description: 'AWS certification course', date: '15 May 2026', status: 'Manager Approved', method: 'Bank Transfer' },
  { id: 'EXP-005', employee: 'Vikram Joshi', category: 'Equipment', amount: 3500, description: 'USB-C hub for home setup', date: '12 May 2026', status: 'Rejected', method: 'Payroll' },
  { id: 'EXP-006', employee: 'Sneha Reddy', category: 'Marketing', amount: 12000, description: 'LinkedIn ad campaign', date: '10 May 2026', status: 'Approved', method: 'Bank Transfer' },
]

const CATEGORY_EMOJI: Record<Category, string> = {
  Travel: '✈️', Meals: '🍽️', Software: '💻', Equipment: '🔧', Training: '📚', Marketing: '📢', Other: '📋',
}

const STATUS_COLOR: Record<ExpenseStatus, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
  Submitted: 'info', 'Manager Approved': 'warning', Approved: 'success', Rejected: 'danger', Paid: 'neutral',
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'Submitted', label: 'Submitted' },
  { id: 'Manager Approved', label: 'Pending Finance' },
  { id: 'Approved', label: 'Approved' },
  { id: 'Paid', label: 'Paid' },
  { id: 'Rejected', label: 'Rejected' },
]

export default function ExpensesPage() {
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [selected, setSelected] = useState<Expense | null>(null)

  const total = MOCK.reduce((s, e) => s + e.amount, 0)
  const pending = MOCK.filter(e => ['Submitted', 'Manager Approved'].includes(e.status))
  const approved = MOCK.filter(e => ['Approved', 'Paid'].includes(e.status))

  const filtered = useMemo(() => {
    const byTab = tab === 'all' ? MOCK : MOCK.filter(e => e.status === tab)
    return byTab.filter(e =>
      !search ||
      e.employee.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase())
    )
  }, [tab, search])

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — Expense data is illustrative. Submit expense flow will connect to the approvals engine.</span>
      </div>

      <PageHeader
        title="Expense Management"
        description="Track, submit, and approve team expenses with AI fraud detection"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewModal(true)}>Submit Expense</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Expenses" value={`₹${total.toLocaleString('en-IN')}`} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Pending Approval" value={pending.length} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Approved / Paid" value={approved.length} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Rejected" value={MOCK.filter(e => e.status === 'Rejected').length} icon={<XCircle className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-3">
          <SearchInput placeholder="Search expenses, employees..." value={search} onChange={setSearch} className="w-80" />
        </div>
        <TabBar
          tabs={TABS.map(t => ({ id: t.id, label: t.label, count: t.id === 'all' ? MOCK.length : MOCK.filter(e => e.status === t.id).length }))}
          active={tab}
          onChange={setTab}
          className="px-5"
        />
        {filtered.length === 0 ? (
          <div className="py-10"><EmptyState icon={<Receipt className="h-6 w-6" />} title="No expenses found" /></div>
        ) : (
          <Table>
            <Thead>
              <tr><Th>Expense ID</Th><Th>Employee</Th><Th>Category</Th><Th>Amount</Th><Th>Description</Th><Th>Date</Th><Th>Method</Th><Th>Status</Th></tr>
            </Thead>
            <Tbody>
              {filtered.map(e => (
                <Tr key={e.id} onClick={() => setSelected(e)}>
                  <Td><span className="font-mono text-xs font-medium text-blue-600">{e.id}</span></Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Avatar name={e.employee} size="xs" />
                      <span className="text-xs font-medium text-slate-700">{e.employee}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-1.5 text-xs">
                      <span>{CATEGORY_EMOJI[e.category]}</span>
                      <span>{e.category}</span>
                    </span>
                  </Td>
                  <Td align="right"><span className="font-semibold text-slate-800 tabular-nums">₹{e.amount.toLocaleString('en-IN')}</span></Td>
                  <Td><span className="text-slate-600 max-w-48 truncate block text-xs">{e.description}</span></Td>
                  <Td><span className="text-xs text-slate-500">{e.date}</span></Td>
                  <Td><Badge variant="neutral" size="sm">{e.method}</Badge></Td>
                  <Td><Badge variant={STATUS_COLOR[e.status]} dot size="sm">{e.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">{filtered.length} expense{filtered.length !== 1 ? 's' : ''} shown • ₹{filtered.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')} total</p>
        </div>
      </Card>

      {/* Expense Detail */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.id ?? ''} size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          {selected?.status === 'Submitted' && <Button variant="secondary" size="sm">Manager Approve</Button>}
          {selected?.status === 'Manager Approved' && <Button size="sm">Finance Approve</Button>}
        </>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CATEGORY_EMOJI[selected.category]}</span>
                  <div>
                    <p className="font-semibold text-slate-900">₹{selected.amount.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-slate-500">{selected.description}</p>
                  </div>
                </div>
              </div>
              <Badge variant={STATUS_COLOR[selected.status]} dot>{selected.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Employee', value: selected.employee },
                { label: 'Category', value: selected.category },
                { label: 'Date', value: selected.date },
                { label: 'Payment Method', value: selected.method },
              ].map(r => (
                <div key={r.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{r.label}</p>
                  <p className="font-medium text-slate-800">{r.value}</p>
                </div>
              ))}
            </div>
            <Alert variant="info" title="AI Compliance Check">
              No policy violations detected. Expense is within category limits.
            </Alert>
          </div>
        )}
      </Modal>

      {/* Submit Expense Modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="Submit Expense" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm">Submit for Approval</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" options={[
              { label: '✈️ Travel', value: 'Travel' },
              { label: '🍽️ Meals', value: 'Meals' },
              { label: '💻 Software', value: 'Software' },
              { label: '🔧 Equipment', value: 'Equipment' },
              { label: '📚 Training', value: 'Training' },
              { label: '📢 Marketing', value: 'Marketing' },
              { label: '📋 Other', value: 'Other' },
            ]} />
            <Input label="Amount (₹)" type="number" placeholder="0.00" min="0" step="0.01" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            <Select label="Reimbursement Method" options={[
              { label: 'Bank Transfer', value: 'Bank Transfer' },
              { label: 'Add to Payroll', value: 'Payroll' },
            ]} />
          </div>
          <Textarea label="Description" placeholder="What was this expense for?" rows={2} />
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Receipt (optional)</label>
            <input type="file" accept="image/*,.pdf"
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            <p className="text-[11px] text-slate-400 mt-1">AI will auto-extract amount and vendor from the receipt</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
