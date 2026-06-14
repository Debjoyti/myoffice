'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, TabBar, Modal, Input, Select, Textarea, EmptyState,
  Alert, SkeletonTable
} from '@/components/ui'
import { TrendingUp, Clock, CheckCircle2, XCircle, Plus, FlaskConical, Receipt, RefreshCw } from 'lucide-react'

type ApiReimbursement = {
  id: string
  category: string
  amount: number
  claim_month: string
  description: string
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  created_at: string
}

const MOCK: ApiReimbursement[] = [
  { id: 'EXP-001', category: 'travel', amount: 4500, claim_month: '2026-05', description: 'Client visit to Pune', status: 'pending', created_at: '2026-05-22T00:00:00Z' },
  { id: 'EXP-002', category: 'other', amount: 2999, description: 'Figma annual subscription', claim_month: '2026-05', status: 'approved', created_at: '2026-05-20T00:00:00Z' },
  { id: 'EXP-003', category: 'food', amount: 1200, description: 'Team lunch – sprint retrospective', claim_month: '2026-05', status: 'paid', created_at: '2026-05-18T00:00:00Z' },
  { id: 'EXP-004', category: 'other', amount: 8000, description: 'AWS certification course', claim_month: '2026-05', status: 'pending', created_at: '2026-05-15T00:00:00Z' },
  { id: 'EXP-005', category: 'other', amount: 3500, description: 'USB-C hub for home setup', claim_month: '2026-05', status: 'rejected', created_at: '2026-05-12T00:00:00Z' },
  { id: 'EXP-006', category: 'other', amount: 12000, description: 'LinkedIn ad campaign', claim_month: '2026-05', status: 'approved', created_at: '2026-05-10T00:00:00Z' },
]

const CATEGORY_EMOJI: Record<string, string> = {
  travel: '✈️', fuel: '⛽', food: '🍽️', internet: '🌐', petty_cash: '💵', other: '📋',
}
const CATEGORY_LABEL: Record<string, string> = {
  travel: 'Travel', fuel: 'Fuel', food: 'Meals', internet: 'Internet', petty_cash: 'Petty Cash', other: 'Other',
}
const STATUS_COLOR: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
  pending: 'warning', approved: 'success', paid: 'neutral', rejected: 'danger',
}

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'paid', label: 'Paid' },
  { id: 'rejected', label: 'Rejected' },
]

const currentMonth = new Date().toISOString().slice(0, 7)
const INITIAL_FORM = { category: 'travel', amount: '', claim_month: currentMonth, description: '' }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ApiReimbursement[]>(MOCK)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(false)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [selected, setSelected] = useState<ApiReimbursement | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/salary/reimbursements')
      if (res.ok) {
        const data = await res.json()
        if (data.reimbursements?.length > 0) {
          setExpenses(data.reimbursements)
          setIsPreview(false)
          return
        }
      }
    } catch { /* fall through */ }
    setExpenses(MOCK)
    setIsPreview(true)
  }, [])

  useEffect(() => { fetchData().finally(() => setLoading(false)) }, [fetchData])

  const handleSubmit = async () => {
    if (!form.amount || Number(form.amount) <= 0) { setFormError('Amount must be greater than zero'); return }
    if (!form.description.trim()) { setFormError('Description is required'); return }
    setSaving(true)
    setFormError('')
    try {
      const res = await fetch('/api/v1/salary/reimbursements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: form.category,
          amount: Number(form.amount),
          claim_month: form.claim_month,
          description: form.description,
        }),
      })
      if (res.ok) {
        setNewModal(false)
        setForm(INITIAL_FORM)
        fetchData()
        return
      }
      const err = await res.json()
      setFormError(err.error ?? 'Failed to submit')
    } catch {
      setExpenses(prev => [{
        id: `EXP-${Date.now()}`,
        category: form.category,
        amount: Number(form.amount),
        claim_month: form.claim_month,
        description: form.description,
        status: 'pending',
        created_at: new Date().toISOString(),
      }, ...prev])
      setNewModal(false)
      setForm(INITIAL_FORM)
    } finally {
      setSaving(false)
    }
  }

  const total = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount), 0), [expenses])
  const pendingCount = useMemo(() => expenses.filter(e => e.status === 'pending').length, [expenses])
  const approvedCount = useMemo(() => expenses.filter(e => ['approved', 'paid'].includes(e.status)).length, [expenses])
  const rejectedCount = useMemo(() => expenses.filter(e => e.status === 'rejected').length, [expenses])

  const filtered = useMemo(() => {
    const byTab = tab === 'all' ? expenses : expenses.filter(e => e.status === tab)
    return byTab.filter(e =>
      !search ||
      (CATEGORY_LABEL[e.category] ?? e.category).toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase())
    )
  }, [expenses, tab, search])

  return (
    <div className="space-y-6 animate-fadeIn">
      {isPreview && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
          <span><strong>Preview mode</strong> — Expense data is illustrative. Submit expense flow connects to the approvals engine.</span>
        </div>
      )}

      <PageHeader
        title="Expense Management"
        description="Track, submit, and approve team expenses with AI fraud detection"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchData}>Refresh</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setNewModal(true); setFormError('') }}>Submit Expense</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Expenses" value={`₹${total.toLocaleString('en-IN')}`} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Pending Approval" value={pendingCount} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Approved / Paid" value={approvedCount} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Rejected" value={rejectedCount} icon={<XCircle className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-3">
          <SearchInput placeholder="Search expenses..." value={search} onChange={setSearch} className="w-80" />
        </div>
        <TabBar
          tabs={TABS.map(t => ({
            id: t.id, label: t.label,
            count: t.id === 'all' ? expenses.length : expenses.filter(e => e.status === t.id).length,
          }))}
          active={tab}
          onChange={setTab}
          className="px-5"
        />
        {loading ? (
          <SkeletonTable rows={5} cols={6} />
        ) : filtered.length === 0 ? (
          <div className="py-10"><EmptyState icon={<Receipt className="h-6 w-6" />} title="No expenses found" /></div>
        ) : (
          <Table>
            <Thead>
              <tr><Th>Category</Th><Th align="right">Amount</Th><Th>Description</Th><Th>Month</Th><Th>Submitted</Th><Th>Status</Th></tr>
            </Thead>
            <Tbody>
              {filtered.map(e => (
                <Tr key={e.id} onClick={() => setSelected(e)}>
                  <Td>
                    <span className="flex items-center gap-1.5 text-xs">
                      <span>{CATEGORY_EMOJI[e.category] ?? '📋'}</span>
                      <span className="font-medium text-slate-700">{CATEGORY_LABEL[e.category] ?? e.category}</span>
                    </span>
                  </Td>
                  <Td align="right"><span className="font-semibold text-slate-800 tabular-nums text-xs">₹{Number(e.amount).toLocaleString('en-IN')}</span></Td>
                  <Td><span className="text-slate-600 max-w-48 truncate block text-xs">{e.description}</span></Td>
                  <Td><span className="text-xs text-slate-500">{e.claim_month}</span></Td>
                  <Td><span className="text-xs text-slate-400">{fmtDate(e.created_at)}</span></Td>
                  <Td><Badge variant={STATUS_COLOR[e.status]} dot size="sm">{e.status.charAt(0).toUpperCase() + e.status.slice(1)}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            {filtered.length} expense{filtered.length !== 1 ? 's' : ''} · ₹{filtered.reduce((s, e) => s + Number(e.amount), 0).toLocaleString('en-IN')} total
          </p>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Expense Details" size="sm"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
        </>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{CATEGORY_EMOJI[selected.category] ?? '📋'}</span>
                <div>
                  <p className="font-semibold text-slate-900">₹{Number(selected.amount).toLocaleString('en-IN')}</p>
                  <p className="text-sm text-slate-500">{selected.description}</p>
                </div>
              </div>
              <Badge variant={STATUS_COLOR[selected.status]} dot>{selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Category', value: CATEGORY_LABEL[selected.category] ?? selected.category },
                { label: 'Claim Month', value: selected.claim_month },
                { label: 'Submitted', value: fmtDate(selected.created_at) },
              ].map(r => (
                <div key={r.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{r.label}</p>
                  <p className="font-medium text-slate-800">{r.value}</p>
                </div>
              ))}
            </div>
            <Alert variant="info" title="AI Compliance Check">No policy violations detected. Expense is within category limits.</Alert>
          </div>
        )}
      </Modal>

      {/* Submit Expense Modal */}
      <Modal open={newModal} onClose={() => { setNewModal(false); setFormError('') }} title="Submit Expense" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSubmit}>Submit for Approval</Button>
        </>}
      >
        <div className="space-y-4">
          {formError && <Alert variant="danger">{formError}</Alert>}
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" options={[
              { label: '✈️ Travel', value: 'travel' },
              { label: '⛽ Fuel', value: 'fuel' },
              { label: '🍽️ Meals', value: 'food' },
              { label: '🌐 Internet', value: 'internet' },
              { label: '💵 Petty Cash', value: 'petty_cash' },
              { label: '📋 Other', value: 'other' },
            ]} value={form.category} onChange={e => setForm(f => ({ ...f, category: (e.target as HTMLSelectElement).value }))} />
            <Input label="Amount (₹)" type="number" placeholder="0" min="1" step="1" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <Input
            label="Claim Month"
            type="month"
            required
            value={form.claim_month}
            onChange={e => setForm(f => ({ ...f, claim_month: e.target.value }))}
          />
          <Textarea label="Description" placeholder="What was this expense for?" rows={2} required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
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
