'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, DetailGrid, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Target, TrendingUp, Users, Plus, Phone, Mail, Building2, Calendar, ArrowRight, DollarSign, FlaskConical } from 'lucide-react'

type Stage = 'Discovery' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost'

type Lead = {
  id: string; name: string; company: string; value: number; stage: Stage; prob: number;
  owner: string; source: string; last: string; email: string; phone: string; notes: string
}

const LEADS: Lead[] = [
  { id: '1', name: 'Ravi Krishnan', company: 'Mahindra Group', value: 4800000, stage: 'Proposal', prob: 60, owner: 'Karan Singh', source: 'LinkedIn', last: '12 May', email: 'ravi.k@mahindra.com', phone: '+91 98111 22233', notes: 'Interested in HRMS + Payroll bundle. Procurement cycle ~6 weeks.' },
  { id: '2', name: 'Sunita Bajaj', company: 'Bajaj Auto', value: 2400000, stage: 'Discovery', prob: 30, owner: 'Sneha Reddy', source: 'Referral', last: '11 May', email: 'sunita.b@bajaj.com', phone: '+91 98222 33344', notes: 'Initial call done. Evaluating 3 vendors.' },
  { id: '3', name: 'Ashok Verma', company: 'Reliance Industries', value: 8500000, stage: 'Negotiation', prob: 80, owner: 'Karan Singh', source: 'Cold Outreach', last: '10 May', email: 'ashok.v@ril.com', phone: '+91 98333 44455', notes: 'Shortlisted to 2 vendors. Price negotiation in progress.' },
  { id: '4', name: 'Meena Pillai', company: 'HDFC Bank', value: 3200000, stage: 'Closed Won', prob: 100, owner: 'Sneha Reddy', source: 'Event', last: '08 May', email: 'meena.p@hdfc.com', phone: '+91 98444 55566', notes: 'Contract signed. Implementation starts June.' },
  { id: '5', name: 'Deepak Nair', company: 'Airtel', value: 1800000, stage: 'Qualified', prob: 45, owner: 'Karan Singh', source: 'Website', last: '07 May', email: 'deepak.n@airtel.com', phone: '+91 98555 66677', notes: 'Qualified via demo. Decision expected in 2 weeks.' },
  { id: '6', name: 'Preethi Kumar', company: 'Infosys', value: 6200000, stage: 'Proposal', prob: 55, owner: 'Sneha Reddy', source: 'Partner', last: '06 May', email: 'preethi.k@infosys.com', phone: '+91 98666 77788', notes: 'RFP submitted. Evaluation committee review pending.' },
]

const STAGE_COLORS: Record<Stage, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  Discovery: 'neutral', Qualified: 'info', Proposal: 'warning',
  Negotiation: 'info', 'Closed Won': 'success', 'Closed Lost': 'danger',
}

const STAGES: Stage[] = ['Discovery', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won']

const STAGE_OPTIONS = [
  { label: 'Discovery', value: 'Discovery' }, { label: 'Qualified', value: 'Qualified' },
  { label: 'Proposal', value: 'Proposal' }, { label: 'Negotiation', value: 'Negotiation' },
  { label: 'Closed Won', value: 'Closed Won' }, { label: 'Closed Lost', value: 'Closed Lost' },
]

export default function CRMPage() {
  const [tab, setTab] = useState('pipeline')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Lead | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const pipelineValue = useMemo(() =>
    LEADS.filter(l => !l.stage.includes('Closed')).reduce((s, l) => s + l.value * l.prob / 100, 0), [])
  const closedWon = useMemo(() =>
    LEADS.filter(l => l.stage === 'Closed Won').reduce((s, l) => s + l.value, 0), [])
  const activeLeads = LEADS.filter(l => !l.stage.includes('Closed')).length

  const filtered = useMemo(() =>
    LEADS.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.company.toLowerCase().includes(search.toLowerCase())), [search])

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Demo banner */}
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — CRM data is illustrative. Full CRM integration is on the roadmap.</span>
      </div>

      <PageHeader
        title="CRM"
        description="Leads, deals, and sales pipeline management"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAddOpen(true)}>Add Lead</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Weighted Pipeline" value={formatCurrency(pipelineValue)} icon={<Target className="h-4 w-4" />} delta={{ value: '18.2%', positive: true }} />
        <StatCard label="Active Leads" value={activeLeads} icon={<Users className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Closed Won MTD" value={formatCurrency(closedWon)} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Avg Deal Size" value={formatCurrency(LEADS.reduce((s, l) => s + l.value, 0) / LEADS.length)} icon={<DollarSign className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
      </div>

      <TabBar
        tabs={[
          { id: 'pipeline', label: 'Pipeline Board' },
          { id: 'list', label: 'All Leads', count: LEADS.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'pipeline' && (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {STAGES.map(stage => {
            const stageLeads = LEADS.filter(l => l.stage === stage)
            const stageValue = stageLeads.reduce((s, l) => s + l.value, 0)
            return (
              <div key={stage} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Badge variant={STAGE_COLORS[stage]} size="sm">{stage}</Badge>
                  <span className="text-xs font-semibold text-slate-400">{stageLeads.length}</span>
                </div>
                {stageValue > 0 && <p className="text-xs text-slate-400 px-1 tabular-nums">{formatCurrency(stageValue)}</p>}
                <div className="space-y-2 min-h-32">
                  {stageLeads.map(lead => (
                    <Card key={lead.id} padding="sm" hover onClick={() => setSelected(lead)}>
                      <p className="text-xs font-semibold text-slate-800 leading-tight">{lead.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Building2 className="h-2.5 w-2.5" />{lead.company}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold text-blue-600 tabular-nums">{formatCurrency(lead.value)}</span>
                        <span className="text-xs text-slate-400">{lead.prob}%</span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <Avatar name={lead.owner} size="xs" />
                        <span className="text-[10px] text-slate-400">{lead.last}</span>
                      </div>
                    </Card>
                  ))}
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
          <Table>
            <Thead><tr><Th>Lead</Th><Th>Company</Th><Th>Stage</Th><Th>Probability</Th><Th align="right">Value</Th><Th>Owner</Th><Th>Last Contact</Th></tr></Thead>
            <Tbody>
              {filtered.map(lead => (
                <Tr key={lead.id} onClick={() => setSelected(lead)}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar name={lead.name} size="sm" />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{lead.name}</p>
                        <p className="text-xs text-slate-400">{lead.source}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><span className="font-medium text-slate-700">{lead.company}</span></Td>
                  <Td><Badge variant={STAGE_COLORS[lead.stage]}>{lead.stage}</Badge></Td>
                  <Td>
                    <div className="flex items-center gap-2 w-20">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${lead.prob}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 tabular-nums w-7 text-right">{lead.prob}%</span>
                    </div>
                  </Td>
                  <Td align="right"><span className="data-value font-medium">{formatCurrency(lead.value)}</span></Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Avatar name={lead.owner} size="xs" />
                      <span className="text-xs text-slate-500">{lead.owner}</span>
                    </div>
                  </Td>
                  <Td><span className="text-xs text-slate-500">{lead.last}</span></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Lead Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Lead Details" size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          <Button variant="outline" size="sm">Log Activity</Button>
          <Button size="sm" leftIcon={<ArrowRight className="h-3.5 w-3.5" />}>Move Stage</Button>
        </>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar name={selected.name} size="lg" />
              <div>
                <p className="font-semibold text-slate-900">{selected.name}</p>
                <p className="text-sm text-slate-500 flex items-center gap-1"><Building2 className="h-3 w-3" />{selected.company}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={STAGE_COLORS[selected.stage]}>{selected.stage}</Badge>
                  <Badge variant="neutral" size="sm">{selected.source}</Badge>
                </div>
              </div>
            </div>
            <Divider />
            <DetailGrid items={[
              { label: 'Deal Value', value: <span className="text-blue-600 font-bold">{formatCurrency(selected.value)}</span> },
              { label: 'Probability', value: `${selected.prob}%` },
              { label: 'Weighted Value', value: formatCurrency(selected.value * selected.prob / 100) },
              { label: 'Owner', value: selected.owner },
              { label: 'Email', value: <a href={`mailto:${selected.email}`} className="text-blue-600 hover:underline flex items-center gap-1"><Mail className="h-3 w-3" />{selected.email}</a> },
              { label: 'Phone', value: <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selected.phone}</span> },
              { label: 'Last Contact', value: <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{selected.last}</span> },
            ]} />
            {selected.notes && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Notes</p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Lead Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Lead" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button size="sm">Add Lead</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Name" placeholder="Ravi Krishnan" required />
            <Input label="Company" placeholder="Mahindra Group" required />
            <Input label="Email" type="email" placeholder="ravi@company.com" />
            <Input label="Phone" placeholder="+91 98765 43210" />
            <Input label="Deal Value (₹)" type="number" placeholder="5000000" />
            <Select label="Stage" options={STAGE_OPTIONS} />
          </div>
          <Textarea label="Notes" placeholder="Context, requirements, next steps..." rows={3} />
        </div>
      </Modal>
    </div>
  )
}
