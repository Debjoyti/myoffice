'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, DetailGrid, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  Target, TrendingUp, Users, Plus, Phone, Mail, Building2,
  Calendar, ArrowRight, DollarSign, FlaskConical, RefreshCw
} from 'lucide-react'

// ─── Stage config ────────────────────────────────────────────────────────────
type Stage = 'new' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost'
const STAGE_LABELS: Record<Stage, string> = {
  new: 'Discovery', contacted: 'Qualified', proposal: 'Proposal',
  negotiation: 'Negotiation', won: 'Closed Won', lost: 'Closed Lost',
}
const STAGE_COLORS: Record<Stage, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  new: 'neutral', contacted: 'info', proposal: 'warning',
  negotiation: 'info', won: 'success', lost: 'danger',
}
const PIPELINE_STAGES: Stage[] = ['new', 'contacted', 'proposal', 'negotiation', 'won']
const STAGE_OPTIONS = Object.entries(STAGE_LABELS).map(([value, label]) => ({ label, value }))

// ─── Fallback mock data ──────────────────────────────────────────────────────
const MOCK_LEADS = [
  { id: '1', name: 'Ravi Krishnan', company: 'Mahindra Group', value: 4800000, status: 'proposal', owner: { full_name: 'Karan Singh' }, email: 'ravi.k@mahindra.com', phone: '+91 98111 22233', updated_at: '2026-05-12T00:00:00Z' },
  { id: '2', name: 'Sunita Bajaj', company: 'Bajaj Auto', value: 2400000, status: 'new', owner: { full_name: 'Sneha Reddy' }, email: 'sunita.b@bajaj.com', phone: '+91 98222 33344', updated_at: '2026-05-11T00:00:00Z' },
  { id: '3', name: 'Ashok Verma', company: 'Reliance Industries', value: 8500000, status: 'negotiation', owner: { full_name: 'Karan Singh' }, email: 'ashok.v@ril.com', phone: '+91 98333 44455', updated_at: '2026-05-10T00:00:00Z' },
  { id: '4', name: 'Meena Pillai', company: 'HDFC Bank', value: 3200000, status: 'won', owner: { full_name: 'Sneha Reddy' }, email: 'meena.p@hdfc.com', phone: '+91 98444 55566', updated_at: '2026-05-08T00:00:00Z' },
  { id: '5', name: 'Deepak Nair', company: 'Airtel', value: 1800000, status: 'contacted', owner: { full_name: 'Karan Singh' }, email: 'deepak.n@airtel.com', phone: '+91 98555 66677', updated_at: '2026-05-07T00:00:00Z' },
  { id: '6', name: 'Preethi Kumar', company: 'Infosys', value: 6200000, status: 'proposal', owner: { full_name: 'Sneha Reddy' }, email: 'preethi.k@infosys.com', phone: '+91 98666 77788', updated_at: '2026-05-06T00:00:00Z' },
]

// ─── Types ──────────────────────────────────────────────────────────────────
type Lead = {
  id: string; name: string; company?: string; value: number; status: string
  owner?: { full_name: string } | null; email?: string; phone?: string
  updated_at: string
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function CRMPage() {
  const [tab, setTab] = useState('pipeline')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Lead | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', value: '', status: 'new' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/crm')
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (data.leads?.length > 0) {
        setLeads(data.leads)
        setIsPreview(false)
      } else {
        setLeads(MOCK_LEADS as any)
        setIsPreview(true)
      }
    } catch {
      setLeads(MOCK_LEADS as any)
      setIsPreview(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddLead = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/v1/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, value: Number(form.value) || 0 }),
      })
      if (res.ok) {
        setAddOpen(false)
        setForm({ name: '', company: '', email: '', phone: '', value: '', status: 'new' })
        fetchData()
      }
    } finally {
      setSaving(false)
    }
  }

  const pipelineValue = useMemo(() =>
    leads.filter(l => !['won', 'lost'].includes(l.status)).reduce((s, l) => s + Number(l.value), 0), [leads])
  const closedWon = useMemo(() =>
    leads.filter(l => l.status === 'won').reduce((s, l) => s + Number(l.value), 0), [leads])
  const activeLeads = useMemo(() =>
    leads.filter(l => !['won', 'lost'].includes(l.status)).length, [leads])
  const avgDeal = leads.length > 0 ? leads.reduce((s, l) => s + Number(l.value), 0) / leads.length : 0

  const filtered = useMemo(() =>
    leads.filter(l => !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.company ?? '').toLowerCase().includes(search.toLowerCase())
    ), [leads, search])

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  const stageLabel = (s: string) => STAGE_LABELS[s as Stage] ?? s

  return (
    <div className="space-y-6 animate-fadeIn">
      {isPreview && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
          <span><strong>Preview mode</strong> — CRM data is illustrative. Add your first lead to see live data.</span>
        </div>
      )}

      <PageHeader
        title="CRM"
        description="Leads, deals, and sales pipeline management"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchData}>Refresh</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAddOpen(true)}>Add Lead</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Weighted Pipeline" value={formatCurrency(pipelineValue)} icon={<Target className="h-4 w-4" />} />
        <StatCard label="Active Leads" value={activeLeads} icon={<Users className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Closed Won" value={formatCurrency(closedWon)} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Avg Deal Size" value={formatCurrency(avgDeal)} icon={<DollarSign className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
      </div>

      <TabBar
        tabs={[
          { id: 'pipeline', label: 'Pipeline Board' },
          { id: 'list', label: 'All Leads', count: leads.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'pipeline' && (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {PIPELINE_STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.status === stage)
            const stageValue = stageLeads.reduce((s, l) => s + Number(l.value), 0)
            return (
              <div key={stage} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Badge variant={STAGE_COLORS[stage]} size="sm">{STAGE_LABELS[stage]}</Badge>
                  <span className="text-xs font-semibold text-slate-400">{stageLeads.length}</span>
                </div>
                {stageValue > 0 && <p className="text-xs text-slate-400 px-1 tabular-nums">{formatCurrency(stageValue)}</p>}
                <div className="space-y-2 min-h-32">
                  {stageLeads.map(lead => (
                    <Card key={lead.id} padding="sm" hover onClick={() => setSelected(lead)}>
                      <p className="text-xs font-semibold text-slate-800 leading-tight">{lead.name}</p>
                      {lead.company && (
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Building2 className="h-2.5 w-2.5" />{lead.company}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold text-blue-600 tabular-nums">{formatCurrency(Number(lead.value))}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <Avatar name={(lead.owner as any)?.full_name ?? lead.name} size="xs" />
                        <span className="text-[10px] text-slate-400">{fmtDate(lead.updated_at)}</span>
                      </div>
                    </Card>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="h-16 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg">
                      <span className="text-xs text-slate-300">Empty</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'list' && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-4">
            <SearchInput placeholder="Search leads or companies..." value={search} onChange={setSearch} className="w-72" />
          </div>
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading leads…</div>
          ) : (
            <Table>
              <Thead><tr><Th>Lead</Th><Th>Company</Th><Th>Stage</Th><Th align="right">Value</Th><Th>Owner</Th><Th>Last Update</Th></tr></Thead>
              <Tbody>
                {filtered.length === 0 ? (
                  <Tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No leads yet</td></Tr>
                ) : filtered.map(lead => (
                  <Tr key={lead.id} onClick={() => setSelected(lead)}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar name={lead.name} size="sm" />
                        <span className="font-medium text-slate-800 text-sm">{lead.name}</span>
                      </div>
                    </Td>
                    <Td><span className="font-medium text-slate-700">{lead.company ?? '—'}</span></Td>
                    <Td><Badge variant={STAGE_COLORS[lead.status as Stage] ?? 'neutral'}>{stageLabel(lead.status)}</Badge></Td>
                    <Td align="right"><span className="data-value font-medium">{formatCurrency(Number(lead.value))}</span></Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <Avatar name={(lead.owner as any)?.full_name ?? '?'} size="xs" />
                        <span className="text-xs text-slate-500">{(lead.owner as any)?.full_name ?? '—'}</span>
                      </div>
                    </Td>
                    <Td><span className="text-xs text-slate-500">{fmtDate(lead.updated_at)}</span></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {/* Lead Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Lead Details" size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          <Button size="sm" leftIcon={<ArrowRight className="h-3.5 w-3.5" />}>Move Stage</Button>
        </>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar name={selected.name} size="lg" />
              <div>
                <p className="font-semibold text-slate-900">{selected.name}</p>
                {selected.company && (
                  <p className="text-sm text-slate-500 flex items-center gap-1"><Building2 className="h-3 w-3" />{selected.company}</p>
                )}
                <div className="mt-1.5">
                  <Badge variant={STAGE_COLORS[selected.status as Stage] ?? 'neutral'}>{stageLabel(selected.status)}</Badge>
                </div>
              </div>
            </div>
            <Divider />
            <DetailGrid items={[
              { label: 'Deal Value', value: <span className="text-blue-600 font-bold">{formatCurrency(Number(selected.value))}</span> },
              { label: 'Owner', value: (selected.owner as any)?.full_name ?? '—' },
              ...(selected.email ? [{ label: 'Email', value: <a href={`mailto:${selected.email}`} className="text-blue-600 hover:underline flex items-center gap-1"><Mail className="h-3 w-3" />{selected.email}</a> }] : []),
              ...(selected.phone ? [{ label: 'Phone', value: <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selected.phone}</span> }] : []),
              { label: 'Last Update', value: <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(selected.updated_at)}</span> },
            ]} />
          </div>
        )}
      </Modal>

      {/* Add Lead Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Lead" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleAddLead}>Add Lead</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Name" placeholder="Ravi Krishnan" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Company" placeholder="Mahindra Group" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            <Input label="Email" type="email" placeholder="ravi@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Phone" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="Deal Value (₹)" type="number" placeholder="5000000" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            <Select label="Stage" options={STAGE_OPTIONS} value={form.status} onChange={e => setForm(f => ({ ...f, status: (e.target as HTMLSelectElement).value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
