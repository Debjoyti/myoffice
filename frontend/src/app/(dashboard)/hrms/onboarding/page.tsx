'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  SearchInput, TabBar, StatCard, Modal, Input, Select, EmptyState,
  Divider, Textarea, PageLoader, Alert,
} from '@/components/ui'
import { formatDate } from '@/lib/utils'
import {
  UserPlus, ShieldCheck, FileCheck2, Clock3,
  RefreshCw, ClipboardCheck, ShieldAlert,
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────────────────────── */
type Candidate = {
  id: string
  full_name: string
  email: string
  phone: string | null
  designation: string | null
  date_of_joining: string | null
  stage: string
  doc_id_proof: boolean
  doc_address_proof: boolean
  doc_education_certs: boolean
  doc_experience_letter: boolean
  doc_pan_aadhaar: boolean
  doc_bank_details: boolean
  police_verification_status: string
  police_verification_ref: string | null
  police_verification_notes: string | null
  notes: string | null
  dept: { id: string; name: string } | null
  created_at: string
}

const STAGE_LABEL: Record<string, string> = {
  documents_pending:        'Documents Pending',
  verification_in_progress: 'Verification In Progress',
  verified:                 'Verified',
  onboarded:                'Onboarded',
  on_hold:                  'On Hold',
}
const STAGE_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  documents_pending: 'neutral',
  verification_in_progress: 'warning',
  verified: 'info',
  onboarded: 'success',
  on_hold: 'danger',
}
const POLICE_LABEL: Record<string, string> = {
  not_started: 'Not Started', submitted: 'Submitted', in_progress: 'In Progress',
  cleared: 'Cleared', flagged: 'Flagged',
}
const POLICE_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  not_started: 'neutral', submitted: 'info', in_progress: 'warning', cleared: 'success', flagged: 'danger',
}

const DOC_CHECKLIST: { key: keyof Candidate; label: string }[] = [
  { key: 'doc_id_proof',          label: 'Government ID Proof' },
  { key: 'doc_address_proof',     label: 'Address Proof' },
  { key: 'doc_education_certs',   label: 'Education Certificates' },
  { key: 'doc_experience_letter', label: 'Experience / Relieving Letter' },
  { key: 'doc_pan_aadhaar',       label: 'PAN & Aadhaar' },
  { key: 'doc_bank_details',      label: 'Bank Account Details' },
]

const DEFAULT_FORM = {
  full_name: '', email: '', phone: '', designation: '', date_of_joining: '', notes: '',
}

/* ── Add Candidate Modal ─────────────────────────────────────────────────────── */
function AddCandidateModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm]     = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => { if (!open) { setForm(DEFAULT_FORM); setError(null) } }, [open])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.full_name.trim() || !form.email.trim()) { setError('Full name and email are required'); return }
    setSaving(true)
    setError(null)
    try {
      const payload: Record<string, string> = {}
      Object.entries(form).forEach(([k, v]) => { if (v) payload[k] = v })
      const res = await fetch('/api/v1/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? data.error ?? 'Failed to add candidate')
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Candidate to Onboarding" size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving}>Add Candidate</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Full Name *" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
          <Input label="Work Email *" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} />
          <Input label="Designation" value={form.designation} onChange={e => set('designation', e.target.value)} />
          <Input label="Date of Joining" type="date" value={form.date_of_joining} onChange={e => set('date_of_joining', e.target.value)} />
        </div>
        <Textarea label="Notes" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>
    </Modal>
  )
}

/* ── Verification Detail Modal ───────────────────────────────────────────────── */
function VerificationModal({
  candidate, onClose, onUpdated,
}: { candidate: Candidate | null; onClose: () => void; onUpdated: () => void }) {
  const [saving, setSaving]   = useState(false)
  const [local, setLocal]     = useState<Candidate | null>(candidate)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => { setLocal(candidate); setError(null) }, [candidate])

  if (!local) return null

  const patch = async (fields: Record<string, any>) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/onboarding/${local.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? data.error ?? 'Update failed')
      setLocal(l => l ? { ...l, ...fields } as Candidate : l)
      onUpdated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleDoc = (key: keyof Candidate) => patch({ [key]: !local[key] })

  const docsComplete = DOC_CHECKLIST.every(d => Boolean(local[d.key]))

  return (
    <Modal open={!!candidate} onClose={onClose} title={local.full_name} size="lg"
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-5">
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={STAGE_VARIANT[local.stage] ?? 'neutral'}>{STAGE_LABEL[local.stage] ?? local.stage}</Badge>
          {local.designation && <span className="text-xs text-slate-500">{local.designation}</span>}
          {local.dept?.name && <span className="text-xs text-slate-400">· {local.dept.name}</span>}
          {local.date_of_joining && <span className="text-xs text-slate-400">· Joining {formatDate(local.date_of_joining)}</span>}
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-700 mb-1">Onboarding Stage</p>
          <Select
            value={local.stage}
            onChange={e => patch({ stage: e.target.value })}
            disabled={saving}
            options={Object.entries(STAGE_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </div>

        <Divider />

        {/* Document verification checklist */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4 text-blue-600" /> Document Verification
            </p>
            <Badge variant={docsComplete ? 'success' : 'neutral'}>
              {DOC_CHECKLIST.filter(d => local[d.key]).length}/{DOC_CHECKLIST.length} complete
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DOC_CHECKLIST.map(d => (
              <label key={String(d.key)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(local[d.key])}
                  disabled={saving}
                  onChange={() => toggleDoc(d.key)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                />
                <span className="text-sm text-slate-700">{d.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Divider />

        {/* Police / background verification */}
        <div>
          <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
            <ShieldCheck className="h-4 w-4 text-violet-600" /> Police / Background Verification
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Status</p>
              <Select
                value={local.police_verification_status}
                onChange={e => patch({ police_verification_status: e.target.value })}
                disabled={saving}
                options={Object.entries(POLICE_LABEL).map(([value, label]) => ({ value, label }))}
              />
            </div>
            <Input
              label="Reference / Agency Ref No."
              value={local.police_verification_ref ?? ''}
              onChange={e => setLocal(l => l ? { ...l, police_verification_ref: e.target.value } : l)}
              onBlur={() => patch({ police_verification_ref: local.police_verification_ref ?? '' })}
            />
          </div>
          <Textarea
            label="Verification Notes"
            rows={2}
            value={local.police_verification_notes ?? ''}
            onChange={e => setLocal(l => l ? { ...l, police_verification_notes: e.target.value } : l)}
            onBlur={() => patch({ police_verification_notes: local.police_verification_notes ?? '' })}
          />
        </div>
      </div>
    </Modal>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────────────── */
export default function OnboardingVerificationPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [tab, setTab]           = useState('all')
  const [addOpen, setAddOpen]   = useState(false)
  const [selected, setSelected] = useState<Candidate | null>(null)

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/onboarding')
      if (res.ok) {
        const data = await res.json()
        setCandidates(data.candidates ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCandidates() }, [fetchCandidates])

  const total       = candidates.length
  const docsPending = candidates.filter(c => DOC_CHECKLIST.some(d => !c[d.key])).length
  const policePending = candidates.filter(c => !['cleared', 'flagged'].includes(c.police_verification_status)).length
  const onboarded   = candidates.filter(c => c.stage === 'onboarded').length

  const filtered = useMemo(() =>
    candidates.filter(c => {
      if (tab !== 'all' && c.stage !== tab) return false
      if (search) {
        const q = search.toLowerCase()
        return c.full_name.toLowerCase().includes(q)
          || c.email.toLowerCase().includes(q)
          || (c.designation ?? '').toLowerCase().includes(q)
      }
      return true
    }),
    [candidates, tab, search]
  )

  if (loading && candidates.length === 0) return <PageLoader />

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Candidate Onboarding & Verification"
        description="Track document checks and police / background verification for newly onboarded candidates"
        actions={
          <Button leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setAddOpen(true)}>
            Add Candidate
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="In Onboarding" value={total} accent="blue"
          icon={<ClipboardCheck className="h-4 w-4" />} loading={loading} />
        <StatCard label="Docs Pending" value={docsPending} accent="amber"
          icon={<Clock3 className="h-4 w-4" />} loading={loading} />
        <StatCard label="Police Verification Pending" value={policePending} accent="rose"
          icon={<ShieldAlert className="h-4 w-4" />} loading={loading} />
        <StatCard label="Onboarded" value={onboarded} accent="emerald"
          icon={<ShieldCheck className="h-4 w-4" />} loading={loading} />
      </div>

      <Card padding="none">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <SearchInput placeholder="Search by name, email, designation…" value={search} onChange={setSearch} className="w-64" />
            <TabBar
              tabs={[
                { id: 'all', label: 'All' },
                { id: 'documents_pending', label: 'Docs Pending' },
                { id: 'verification_in_progress', label: 'Verifying' },
                { id: 'verified', label: 'Verified' },
                { id: 'onboarded', label: 'Onboarded' },
              ]}
              active={tab} onChange={setTab}
            />
          </div>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3 w-3" />} onClick={() => fetchCandidates()}>
            Refresh
          </Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck className="h-8 w-8" />}
            title="No candidates found"
            description="Add a newly onboarded candidate to start tracking their document and police verification."
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Candidate</Th>
                <Th>Designation</Th>
                <Th>Stage</Th>
                <Th>Documents</Th>
                <Th>Police Verification</Th>
                <Th>Joining</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map(c => {
                const docsDone = DOC_CHECKLIST.filter(d => c[d.key]).length
                return (
                  <Tr key={c.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelected(c)}>
                    <Td>
                      <p className="font-medium text-slate-800">{c.full_name}</p>
                      <p className="text-xs text-slate-400">{c.email}</p>
                    </Td>
                    <Td>{c.designation || '—'}</Td>
                    <Td><Badge variant={STAGE_VARIANT[c.stage] ?? 'neutral'}>{STAGE_LABEL[c.stage] ?? c.stage}</Badge></Td>
                    <Td>
                      <span className={docsDone === DOC_CHECKLIST.length ? 'text-emerald-600 font-medium' : 'text-slate-500'}>
                        {docsDone}/{DOC_CHECKLIST.length}
                      </span>
                    </Td>
                    <Td><Badge variant={POLICE_VARIANT[c.police_verification_status] ?? 'neutral'}>
                      {POLICE_LABEL[c.police_verification_status] ?? c.police_verification_status}
                    </Badge></Td>
                    <Td>{c.date_of_joining ? formatDate(c.date_of_joining) : '—'}</Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        )}
      </Card>

      <AddCandidateModal open={addOpen} onClose={() => setAddOpen(false)} onSuccess={fetchCandidates} />
      <VerificationModal candidate={selected} onClose={() => setSelected(null)} onUpdated={fetchCandidates} />
    </div>
  )
}
