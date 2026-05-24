'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  PageHeader, TabBar, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, Modal, Input, Select, Textarea, EmptyState, SearchInput, Skeleton
} from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Plus, Lightbulb, CheckCircle, XCircle, Settings, TrendingUp, Filter } from 'lucide-react'

type KaizenSuggestion = {
  id: string
  suggestion_number: string
  title: string
  problem_description: string
  proposed_solution: string
  expected_benefit: string | null
  category: string
  priority: string
  status: string
  submission_date: string
  target_date: string | null
  reward_points: number
  submitted_by_emp: { id: string; users: { full_name: string } } | null
  dept: { name: string } | null
}

const STATUS_COLUMNS = ['submitted', 'under_review', 'approved', 'implementing', 'implemented', 'verified']
const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  implementing: 'Implementing',
  implemented: 'Implemented',
  verified: 'Verified',
}
const STATUS_COLOR: Record<string, 'default' | 'warning' | 'success' | 'danger' | 'info' | 'neutral'> = {
  submitted: 'default',
  under_review: 'warning',
  approved: 'info',
  rejected: 'danger',
  implementing: 'warning',
  implemented: 'success',
  verified: 'success',
}
const PRIORITY_COLOR: Record<string, 'danger' | 'warning' | 'neutral'> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
}
const CATEGORY_OPTIONS = [
  { label: 'Safety', value: 'safety' },
  { label: 'Quality', value: 'quality' },
  { label: 'Productivity', value: 'productivity' },
  { label: 'Cost', value: 'cost' },
  { label: 'Environment', value: 'environment' },
  { label: 'Morale', value: 'morale' },
]

export default function KaizenPage() {
  const [tab, setTab] = useState('pipeline')
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<KaizenSuggestion[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showSubmit, setShowSubmit] = useState(false)
  const [selectedItem, setSelectedItem] = useState<KaizenSuggestion | null>(null)
  const [saving, setSaving] = useState(false)

  const [submitForm, setSubmitForm] = useState({
    title: '',
    problem_description: '',
    proposed_solution: '',
    expected_benefit: '',
    category: 'quality',
    priority: 'medium',
    target_date: '',
  })

  const [reviewForm, setReviewForm] = useState({
    status: '',
    rejection_reason: '',
    before_description: '',
    after_description: '',
    actual_benefit: '',
    cost_savings: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      let url = '/api/v1/iatf/kaizen?'
      if (filterStatus) url += `status=${filterStatus}&`
      if (filterCategory) url += `category=${filterCategory}&`
      const res = await fetch(url)
      if (res.ok) {
        const d = await res.json()
        setSuggestions(d.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterCategory])

  useEffect(() => { loadData() }, [loadData])

  async function handleSubmit() {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/iatf/kaizen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitForm),
      })
      if (res.ok) {
        setShowSubmit(false)
        setSubmitForm({ title: '', problem_description: '', proposed_solution: '', expected_benefit: '', category: 'quality', priority: 'medium', target_date: '' })
        loadData()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleReview() {
    if (!selectedItem) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = { status: reviewForm.status }
      if (reviewForm.rejection_reason) body.rejection_reason = reviewForm.rejection_reason
      if (reviewForm.before_description || reviewForm.after_description) {
        body.kaizen_sheet = {
          before_description: reviewForm.before_description,
          after_description: reviewForm.after_description,
          actual_benefit: reviewForm.actual_benefit,
          cost_savings: reviewForm.cost_savings ? parseFloat(reviewForm.cost_savings) : undefined,
        }
      }
      const res = await fetch(`/api/v1/iatf/kaizen/${selectedItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setSelectedItem(null)
        loadData()
      }
    } finally {
      setSaving(false)
    }
  }

  const filtered = suggestions.filter(s => {
    const q = search.toLowerCase()
    return !q || s.title.toLowerCase().includes(q) || s.suggestion_number.toLowerCase().includes(q)
  })

  const counts = {
    submitted: suggestions.filter(s => s.status === 'submitted').length,
    approved: suggestions.filter(s => s.status === 'approved').length,
    implemented: suggestions.filter(s => s.status === 'implemented').length,
    rejected: suggestions.filter(s => s.status === 'rejected').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kaizen System"
        description="Continuous improvement suggestions, review pipeline, and kaizen sheets"
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowSubmit(true)}>
            Submit Kaizen
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Submitted" value={counts.submitted} icon={<Lightbulb className="h-4 w-4" />} accent="indigo" />
        <StatCard label="Approved" value={counts.approved} icon={<CheckCircle className="h-4 w-4" />} accent="sky" />
        <StatCard label="Implemented" value={counts.implemented} icon={<TrendingUp className="h-4 w-4" />} accent="emerald" />
        <StatCard label="Rejected" value={counts.rejected} icon={<XCircle className="h-4 w-4" />} accent="rose" />
      </div>

      <TabBar
        tabs={[
          { id: 'pipeline', label: 'Pipeline' },
          { id: 'list', label: 'All Suggestions', count: suggestions.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search suggestions..." value={search} onChange={setSearch} className="w-64" />
        <Select
          options={[{ label: 'All Statuses', value: '' }, ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ label: l, value: v }))]}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        />
        <Select
          options={[{ label: 'All Categories', value: '' }, ...CATEGORY_OPTIONS]}
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        />
        {(filterStatus || filterCategory) && (
          <Button variant="ghost" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />} onClick={() => { setFilterStatus(''); setFilterCategory('') }}>
            Clear
          </Button>
        )}
      </div>

      {/* TAB: Pipeline (Kanban-style) */}
      {tab === 'pipeline' && (
        loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[0,1,2].map(i => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto">
            {STATUS_COLUMNS.map(col => {
              const colItems = filtered.filter(s => s.status === col)
              return (
                <div key={col} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 min-w-[160px]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{STATUS_LABELS[col]}</span>
                    <Badge variant={STATUS_COLOR[col]} size="sm">{colItems.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {colItems.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Empty</p>
                    ) : (
                      colItems.map(item => (
                        <div
                          key={item.id}
                          onClick={() => { setSelectedItem(item); setReviewForm({ status: item.status, rejection_reason: '', before_description: '', after_description: '', actual_benefit: '', cost_savings: '' }) }}
                          className="bg-white dark:bg-slate-900 rounded-md p-2.5 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                        >
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug mb-1">{item.title}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant={PRIORITY_COLOR[item.priority]} size="sm">{item.priority}</Badge>
                            <span className="text-[10px] text-slate-400">{item.suggestion_number}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* TAB: All List */}
      {tab === 'list' && (
        <Card padding="none">
          {loading ? (
            <div className="p-5 space-y-3">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-10 w-full"/>)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Lightbulb className="h-6 w-6" />}
              title="No kaizen suggestions"
              description="Submit the first suggestion to get started."
              action={<Button size="sm" onClick={() => setShowSubmit(true)}>Submit Kaizen</Button>}
            />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Number</Th>
                  <Th>Title</Th>
                  <Th>Category</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                  <Th>Submitted By</Th>
                  <Th>Date</Th>
                </tr>
              </Thead>
              <Tbody>
                {filtered.map(s => (
                  <Tr key={s.id} onClick={() => { setSelectedItem(s); setReviewForm({ status: s.status, rejection_reason: '', before_description: '', after_description: '', actual_benefit: '', cost_savings: '' }) }}>
                    <Td><span className="font-mono text-xs text-slate-500">{s.suggestion_number}</span></Td>
                    <Td><p className="font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">{s.title}</p></Td>
                    <Td><Badge variant="neutral" size="sm">{s.category}</Badge></Td>
                    <Td><Badge variant={PRIORITY_COLOR[s.priority]} size="sm">{s.priority}</Badge></Td>
                    <Td><Badge variant={STATUS_COLOR[s.status]} size="sm" dot>{STATUS_LABELS[s.status]}</Badge></Td>
                    <Td>{s.submitted_by_emp?.users?.full_name ?? '—'}</Td>
                    <Td>{formatDate(s.submission_date)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {/* Submit Kaizen Modal */}
      <Modal
        open={showSubmit}
        onClose={() => setShowSubmit(false)}
        title="Submit Kaizen Suggestion"
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowSubmit(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleSubmit}>Submit</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Title" required value={submitForm.title} onChange={e => setSubmitForm(f => ({ ...f, title: e.target.value }))} />
          <Textarea label="Problem Description" required rows={3} value={submitForm.problem_description} onChange={e => setSubmitForm(f => ({ ...f, problem_description: e.target.value }))} />
          <Textarea label="Proposed Solution" required rows={3} value={submitForm.proposed_solution} onChange={e => setSubmitForm(f => ({ ...f, proposed_solution: e.target.value }))} />
          <Textarea label="Expected Benefit" rows={2} value={submitForm.expected_benefit} onChange={e => setSubmitForm(f => ({ ...f, expected_benefit: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" options={CATEGORY_OPTIONS} value={submitForm.category} onChange={e => setSubmitForm(f => ({ ...f, category: e.target.value }))} />
            <Select label="Priority" options={[{label:'Low',value:'low'},{label:'Medium',value:'medium'},{label:'High',value:'high'}]} value={submitForm.priority} onChange={e => setSubmitForm(f => ({ ...f, priority: e.target.value }))} />
          </div>
          <Input label="Target Date" type="date" value={submitForm.target_date} onChange={e => setSubmitForm(f => ({ ...f, target_date: e.target.value }))} />
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title ?? 'Kaizen Detail'}
        size="xl"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>Close</Button>
            <Button size="sm" loading={saving} onClick={handleReview}>Save Changes</Button>
          </>
        }
      >
        {selectedItem && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Number:</span> <span className="font-mono font-medium">{selectedItem.suggestion_number}</span></div>
              <div><span className="text-slate-500">Category:</span> <Badge variant="neutral" size="sm">{selectedItem.category}</Badge></div>
              <div><span className="text-slate-500">Priority:</span> <Badge variant={PRIORITY_COLOR[selectedItem.priority]} size="sm">{selectedItem.priority}</Badge></div>
              <div><span className="text-slate-500">Submitted:</span> <span>{formatDate(selectedItem.submission_date)}</span></div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Problem</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-md p-3">{selectedItem.problem_description}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Proposed Solution</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-md p-3">{selectedItem.proposed_solution}</p>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Update Status / Add Kaizen Sheet</h4>
              <div className="space-y-4">
                <Select
                  label="Status"
                  options={Object.entries(STATUS_LABELS).map(([v, l]) => ({ label: l, value: v }))}
                  value={reviewForm.status}
                  onChange={e => setReviewForm(f => ({ ...f, status: e.target.value }))}
                />
                {reviewForm.status === 'rejected' && (
                  <Textarea label="Rejection Reason" rows={2} value={reviewForm.rejection_reason} onChange={e => setReviewForm(f => ({ ...f, rejection_reason: e.target.value }))} />
                )}
                {['implemented', 'verified'].includes(reviewForm.status) && (
                  <>
                    <Textarea label="Before Description" rows={2} value={reviewForm.before_description} onChange={e => setReviewForm(f => ({ ...f, before_description: e.target.value }))} />
                    <Textarea label="After Description" rows={2} value={reviewForm.after_description} onChange={e => setReviewForm(f => ({ ...f, after_description: e.target.value }))} />
                    <Textarea label="Actual Benefit" rows={2} value={reviewForm.actual_benefit} onChange={e => setReviewForm(f => ({ ...f, actual_benefit: e.target.value }))} />
                    <Input label="Cost Savings (INR)" type="number" value={reviewForm.cost_savings} onChange={e => setReviewForm(f => ({ ...f, cost_savings: e.target.value }))} />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
