'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, Modal, Input, Select, EmptyState
} from '@/components/ui'
import { FileText, Send, CheckCircle2, Clock, Plus, Download, FlaskConical } from 'lucide-react'

type OfferStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired'

type Offer = {
  id: string; candidate: string; role: string; department: string
  salary: number; joiningDate: string; status: OfferStatus; sentOn: string
}

const OFFERS: Offer[] = [
  { id: 'OL-001', candidate: 'Arjun Menon', role: 'Senior Software Engineer', department: 'Engineering', salary: 1800000, joiningDate: '01 Jul 2026', status: 'Accepted', sentOn: '20 May 2026' },
  { id: 'OL-002', candidate: 'Kavya Nair', role: 'Product Manager', department: 'Product', salary: 2200000, joiningDate: '15 Jul 2026', status: 'Sent', sentOn: '25 May 2026' },
  { id: 'OL-003', candidate: 'Rohit Gupta', role: 'DevOps Engineer', department: 'Engineering', salary: 1600000, joiningDate: '01 Aug 2026', status: 'Draft', sentOn: '—' },
  { id: 'OL-004', candidate: 'Meera Pillai', role: 'UX Designer', department: 'Design', salary: 1400000, joiningDate: '15 Jun 2026', status: 'Rejected', sentOn: '15 May 2026' },
]

const STATUS_COLOR: Record<OfferStatus, 'neutral' | 'info' | 'success' | 'danger' | 'warning'> = {
  Draft: 'neutral', Sent: 'info', Accepted: 'success', Rejected: 'danger', Expired: 'warning',
}

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export default function OfferLettersPage() {
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [selected, setSelected] = useState<Offer | null>(null)

  const sent = OFFERS.filter(o => o.status === 'Sent').length
  const accepted = OFFERS.filter(o => o.status === 'Accepted').length

  const filtered = useMemo(() =>
    OFFERS.filter(o => !search ||
      o.candidate.toLowerCase().includes(search.toLowerCase()) ||
      o.role.toLowerCase().includes(search.toLowerCase())
    ),
    [search]
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — Offer letter data is illustrative. PDF generation and digital signature integrations are on the roadmap.</span>
      </div>

      <PageHeader
        title="Offer Letters"
        description="Generate, send, and track offer letters with digital signature support"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewModal(true)}>Create Offer</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Offers" value={OFFERS.length} icon={<FileText className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Sent" value={sent} icon={<Send className="h-4 w-4" />} iconColor="bg-info-50 text-blue-600" />
        <StatCard label="Accepted" value={accepted} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Acceptance Rate" value={`${Math.round(accepted / OFFERS.length * 100)}%`} icon={<Clock className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-4">
          <SearchInput placeholder="Search candidates or roles..." value={search} onChange={setSearch} className="w-80" />
        </div>
        {filtered.length === 0 ? (
          <div className="py-10"><EmptyState icon={<FileText className="h-6 w-6" />} title="No offer letters found" /></div>
        ) : (
          <Table>
            <Thead><tr><Th>Offer ID</Th><Th>Candidate</Th><Th>Role</Th><Th>CTC</Th><Th>Joining Date</Th><Th>Sent On</Th><Th>Status</Th><Th>Actions</Th></tr></Thead>
            <Tbody>
              {filtered.map(o => (
                <Tr key={o.id} onClick={() => setSelected(o)}>
                  <Td><span className="font-mono text-xs font-medium text-blue-600">{o.id}</span></Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Avatar name={o.candidate} size="xs" />
                      <span className="text-xs font-medium text-slate-700">{o.candidate}</span>
                    </div>
                  </Td>
                  <Td>
                    <div>
                      <p className="text-xs font-medium text-slate-700">{o.role}</p>
                      <p className="text-[11px] text-slate-400">{o.department}</p>
                    </div>
                  </Td>
                  <Td align="right"><span className="text-xs font-bold text-slate-800 tabular-nums">{fmt(o.salary)}/yr</span></Td>
                  <Td><span className="text-xs text-slate-600">{o.joiningDate}</span></Td>
                  <Td><span className="text-xs text-slate-500">{o.sentOn}</span></Td>
                  <Td><Badge variant={STATUS_COLOR[o.status]} dot size="sm">{o.status}</Badge></Td>
                  <Td>
                    <Button variant="ghost" size="sm" leftIcon={<Download className="h-3 w-3" />} onClick={e => e.stopPropagation()}>
                      PDF
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.id ?? ''} size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          {selected?.status === 'Draft' && <Button size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>Send to Candidate</Button>}
          <Button variant="secondary" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Download PDF</Button>
        </>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={selected.candidate} size="md" />
                <div>
                  <p className="font-semibold text-slate-900">{selected.candidate}</p>
                  <p className="text-sm text-slate-500">{selected.role} · {selected.department}</p>
                </div>
              </div>
              <Badge variant={STATUS_COLOR[selected.status]} dot>{selected.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Annual CTC', value: `${fmt(selected.salary)}/yr` },
                { label: 'Joining Date', value: selected.joiningDate },
                { label: 'Offer Sent', value: selected.sentOn },
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
      <Modal open={newModal} onClose={() => setNewModal(false)} title="Create Offer Letter" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm">Generate Offer</Button>
        </>}
      >
        <div className="space-y-4">
          <Input label="Candidate Name" placeholder="Full name" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Job Title / Role" placeholder="e.g. Senior Engineer" required />
            <Input label="Department" placeholder="e.g. Engineering" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Annual CTC (₹)" type="number" placeholder="1500000" required />
            <Input label="Joining Date" type="date" required />
          </div>
          <Select label="Offer Letter Template" options={[
            { label: 'Standard Offer', value: 'standard' },
            { label: 'Senior / Leadership', value: 'senior' },
            { label: 'Internship', value: 'internship' },
            { label: 'Contract', value: 'contract' },
          ]} />
        </div>
      </Modal>
    </div>
  )
}
