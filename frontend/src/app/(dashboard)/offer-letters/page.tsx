'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, Modal, Input, Select, EmptyState, Alert, SkeletonTable
} from '@/components/ui'
import { FileText, Send, CheckCircle2, Clock, Plus, Download, FlaskConical, RefreshCw } from 'lucide-react'

type ApiOffer = {
  id: string
  offer_number: string
  candidate_name: string
  candidate_email: string
  position_title: string
  department: string
  ctc_monthly: number
  ctc_annual: number
  joining_date: string
  offer_date: string
  expiry_date: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  accepted_at: string | null
  created_at: string
  creator?: { full_name: string; designation: string } | null
}

const MOCK_OFFERS: ApiOffer[] = [
  { id: '1', offer_number: 'OL-001', candidate_name: 'Arjun Menon', candidate_email: 'arjun@example.com', position_title: 'Senior Software Engineer', department: 'Engineering', ctc_monthly: 150000, ctc_annual: 1800000, joining_date: '2026-07-01', offer_date: '2026-05-20', expiry_date: '2026-06-10', status: 'accepted', accepted_at: '2026-05-22T00:00:00Z', created_at: '2026-05-20T00:00:00Z' },
  { id: '2', offer_number: 'OL-002', candidate_name: 'Kavya Nair', candidate_email: 'kavya@example.com', position_title: 'Product Manager', department: 'Product', ctc_monthly: 183333, ctc_annual: 2200000, joining_date: '2026-07-15', offer_date: '2026-05-25', expiry_date: '2026-06-15', status: 'sent', accepted_at: null, created_at: '2026-05-25T00:00:00Z' },
  { id: '3', offer_number: 'OL-003', candidate_name: 'Rohit Gupta', candidate_email: 'rohit@example.com', position_title: 'DevOps Engineer', department: 'Engineering', ctc_monthly: 133333, ctc_annual: 1600000, joining_date: '2026-08-01', offer_date: '2026-05-27', expiry_date: '2026-06-27', status: 'draft', accepted_at: null, created_at: '2026-05-27T00:00:00Z' },
  { id: '4', offer_number: 'OL-004', candidate_name: 'Meera Pillai', candidate_email: 'meera@example.com', position_title: 'UX Designer', department: 'Design', ctc_monthly: 116667, ctc_annual: 1400000, joining_date: '2026-06-15', offer_date: '2026-05-15', expiry_date: '2026-06-05', status: 'rejected', accepted_at: null, created_at: '2026-05-15T00:00:00Z' },
]

const STATUS_COLOR: Record<string, 'neutral' | 'info' | 'success' | 'danger' | 'warning'> = {
  draft: 'neutral', sent: 'info', accepted: 'success', rejected: 'danger', expired: 'warning',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', sent: 'Sent', accepted: 'Accepted', rejected: 'Rejected', expired: 'Expired',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

function fmtDate(d: string) {
  if (!d || d === '—') return '—'
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

const INITIAL_FORM = {
  candidate_name: '', candidate_email: '', position_title: '', department: '',
  ctc_monthly: '', joining_date: '', expiry_date: '', template: 'standard',
}

export default function OfferLettersPage() {
  const [offers, setOffers] = useState<ApiOffer[]>(MOCK_OFFERS)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(false)
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [selected, setSelected] = useState<ApiOffer | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/offer-letters')
      if (res.ok) {
        const data = await res.json()
        if (data.offer_letters?.length > 0) {
          setOffers(data.offer_letters)
          setIsPreview(false)
          return
        }
      }
    } catch { /* fall through */ }
    setOffers(MOCK_OFFERS)
    setIsPreview(true)
  }, [])

  useEffect(() => { fetchData().finally(() => setLoading(false)) }, [fetchData])

  const handleCreate = async () => {
    if (!form.candidate_name.trim()) { setFormError('Candidate name is required'); return }
    if (!form.candidate_email.trim()) { setFormError('Candidate email is required'); return }
    if (!form.position_title.trim()) { setFormError('Job title is required'); return }
    if (!form.ctc_monthly) { setFormError('CTC is required'); return }
    setSaving(true)
    setFormError('')
    try {
      const res = await fetch('/api/v1/offer-letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: form.candidate_name,
          candidate_email: form.candidate_email,
          position_title: form.position_title,
          department: form.department || undefined,
          ctc_monthly: Number(form.ctc_monthly),
          joining_date: form.joining_date || undefined,
          expiry_date: form.expiry_date || undefined,
        }),
      })
      if (res.ok) {
        setNewModal(false)
        setForm(INITIAL_FORM)
        fetchData()
        return
      }
      const err = await res.json()
      setFormError(err.error ?? 'Failed to create offer letter')
    } catch {
      // Optimistic
      const ctcMonthly = Number(form.ctc_monthly)
      setOffers(prev => [{
        id: `temp-${Date.now()}`,
        offer_number: `OL-${String(prev.length + 1).padStart(3, '0')}`,
        candidate_name: form.candidate_name,
        candidate_email: form.candidate_email,
        position_title: form.position_title,
        department: form.department,
        ctc_monthly: ctcMonthly,
        ctc_annual: ctcMonthly * 12,
        joining_date: form.joining_date,
        offer_date: new Date().toISOString().split('T')[0],
        expiry_date: form.expiry_date,
        status: 'draft',
        accepted_at: null,
        created_at: new Date().toISOString(),
      }, ...prev])
      setNewModal(false)
      setForm(INITIAL_FORM)
    } finally {
      setSaving(false)
    }
  }

  const sent = useMemo(() => offers.filter(o => o.status === 'sent').length, [offers])
  const accepted = useMemo(() => offers.filter(o => o.status === 'accepted').length, [offers])
  const acceptanceRate = offers.length > 0 ? Math.round(accepted / offers.length * 100) : 0

  const filtered = useMemo(() =>
    offers.filter(o => !search ||
      o.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
      o.position_title.toLowerCase().includes(search.toLowerCase())
    ), [offers, search]
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      {isPreview && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
          <span><strong>Preview mode</strong> — Offer letter data is illustrative. PDF generation and digital signature integrations are on the roadmap.</span>
        </div>
      )}

      <PageHeader
        title="Offer Letters"
        description="Generate, send, and track offer letters with digital signature support"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchData}>Refresh</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setNewModal(true); setFormError('') }}>Create Offer</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Offers" value={offers.length} icon={<FileText className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Sent / Pending" value={sent} icon={<Send className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Accepted" value={accepted} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Acceptance Rate" value={`${acceptanceRate}%`} icon={<Clock className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-4">
          <SearchInput placeholder="Search candidates or roles..." value={search} onChange={setSearch} className="w-80" />
        </div>
        {loading ? (
          <SkeletonTable rows={4} cols={7} />
        ) : filtered.length === 0 ? (
          <div className="py-10"><EmptyState icon={<FileText className="h-6 w-6" />} title="No offer letters found" /></div>
        ) : (
          <Table>
            <Thead>
              <tr><Th>Offer #</Th><Th>Candidate</Th><Th>Role</Th><Th align="right">CTC</Th><Th>Joining</Th><Th>Sent On</Th><Th>Status</Th><Th>Actions</Th></tr>
            </Thead>
            <Tbody>
              {filtered.map(o => (
                <Tr key={o.id} onClick={() => setSelected(o)}>
                  <Td><span className="font-mono text-xs font-medium text-blue-600">{o.offer_number}</span></Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Avatar name={o.candidate_name} size="xs" />
                      <span className="text-xs font-medium text-slate-700">{o.candidate_name}</span>
                    </div>
                  </Td>
                  <Td>
                    <div>
                      <p className="text-xs font-medium text-slate-700">{o.position_title}</p>
                      <p className="text-[11px] text-slate-400">{o.department}</p>
                    </div>
                  </Td>
                  <Td align="right"><span className="text-xs font-bold text-slate-800 tabular-nums">{fmt(o.ctc_annual)}/yr</span></Td>
                  <Td><span className="text-xs text-slate-600">{fmtDate(o.joining_date)}</span></Td>
                  <Td><span className="text-xs text-slate-500">{fmtDate(o.offer_date)}</span></Td>
                  <Td><Badge variant={STATUS_COLOR[o.status]} dot size="sm">{STATUS_LABEL[o.status]}</Badge></Td>
                  <Td>
                    <Button variant="ghost" size="sm" leftIcon={<Download className="h-3 w-3" />} onClick={e => e.stopPropagation()}>PDF</Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.offer_number ?? ''} size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          {selected?.status === 'draft' && (
            <Button size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>Send to Candidate</Button>
          )}
          <Button variant="secondary" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Download PDF</Button>
        </>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={selected.candidate_name} size="md" />
                <div>
                  <p className="font-semibold text-slate-900">{selected.candidate_name}</p>
                  <p className="text-sm text-slate-500">{selected.position_title} · {selected.department}</p>
                  <p className="text-xs text-slate-400">{selected.candidate_email}</p>
                </div>
              </div>
              <Badge variant={STATUS_COLOR[selected.status]} dot>{STATUS_LABEL[selected.status]}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Monthly CTC', value: fmt(selected.ctc_monthly) },
                { label: 'Annual CTC', value: `${fmt(selected.ctc_annual)}/yr` },
                { label: 'Joining Date', value: fmtDate(selected.joining_date) },
                { label: 'Offer Date', value: fmtDate(selected.offer_date) },
                { label: 'Expiry Date', value: fmtDate(selected.expiry_date) },
                ...(selected.accepted_at ? [{ label: 'Accepted On', value: fmtDate(selected.accepted_at) }] : []),
              ].map(r => (
                <div key={r.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{r.label}</p>
                  <p className="text-sm font-semibold text-slate-800">{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* New Offer Modal */}
      <Modal open={newModal} onClose={() => { setNewModal(false); setFormError('') }} title="Create Offer Letter" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleCreate}>Generate Offer</Button>
        </>}
      >
        <div className="space-y-4">
          {formError && <Alert variant="danger">{formError}</Alert>}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Candidate Name" placeholder="Full name" required value={form.candidate_name} onChange={e => setForm(f => ({ ...f, candidate_name: e.target.value }))} />
            <Input label="Candidate Email" type="email" placeholder="email@example.com" required value={form.candidate_email} onChange={e => setForm(f => ({ ...f, candidate_email: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Job Title / Role" placeholder="e.g. Senior Engineer" required value={form.position_title} onChange={e => setForm(f => ({ ...f, position_title: e.target.value }))} />
            <Input label="Department" placeholder="e.g. Engineering" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Monthly CTC (₹)" type="number" placeholder="150000" required value={form.ctc_monthly} onChange={e => setForm(f => ({ ...f, ctc_monthly: e.target.value }))} />
            <Input label="Joining Date" type="date" value={form.joining_date} onChange={e => setForm(f => ({ ...f, joining_date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Expiry Date" type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
            <Select label="Template" options={[
              { label: 'Standard Offer', value: 'standard' },
              { label: 'Senior / Leadership', value: 'senior' },
              { label: 'Internship', value: 'internship' },
              { label: 'Contract', value: 'contract' },
            ]} value={form.template} onChange={e => setForm(f => ({ ...f, template: (e.target as HTMLSelectElement).value }))} />
          </div>
          {form.ctc_monthly && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
              Annual CTC: <strong>{fmt(Number(form.ctc_monthly) * 12)}</strong>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
