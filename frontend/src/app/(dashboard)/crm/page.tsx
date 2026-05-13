'use client'

import { useState } from 'react'
import { PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td, StatCard, TabBar, SearchInput } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Target, TrendingUp, Users, DollarSign, Plus } from 'lucide-react'

const LEADS = [
  { name: 'Ravi Krishnan', company: 'Mahindra Group', value: 4800000, stage: 'Proposal', prob: 60, owner: 'Karan Singh', source: 'LinkedIn', last: '12 May' },
  { name: 'Sunita Bajaj', company: 'Bajaj Auto', value: 2400000, stage: 'Discovery', prob: 30, owner: 'Sneha Reddy', source: 'Referral', last: '11 May' },
  { name: 'Ashok Verma', company: 'Reliance Industries', value: 8500000, stage: 'Negotiation', prob: 80, owner: 'Karan Singh', source: 'Cold Outreach', last: '10 May' },
  { name: 'Meena Pillai', company: 'HDFC Bank', value: 3200000, stage: 'Closed Won', prob: 100, owner: 'Sneha Reddy', source: 'Event', last: '08 May' },
  { name: 'Deepak Nair', company: 'Airtel', value: 1800000, stage: 'Qualified', prob: 45, owner: 'Karan Singh', source: 'Website', last: '07 May' },
]

const STAGE_COLOR: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  Discovery: 'neutral', Qualified: 'info', Proposal: 'warning', Negotiation: 'info', 'Closed Won': 'success', 'Closed Lost': 'danger',
}

const pipelineValue = LEADS.filter(l => l.stage !== 'Closed Won').reduce((s, l) => s + l.value * l.prob / 100, 0)

export default function CRMPage() {
  const [tab, setTab] = useState('pipeline')
  const [search, setSearch] = useState('')

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="CRM"
        description="Leads, deals, and sales pipeline management"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>Add Lead</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Pipeline Value" value={formatCurrency(pipelineValue)} icon={<Target className="h-4 w-4" />} delta={{ value: '18.2%', positive: true }} />
        <StatCard label="Active Leads" value={LEADS.filter(l => !l.stage.includes('Closed')).length} icon={<Users className="h-4 w-4" />} iconColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
        <StatCard label="Closed Won MTD" value={formatCurrency(LEADS.filter(l => l.stage === 'Closed Won').reduce((s, l) => s + l.value, 0))} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard label="Avg Deal Size" value={formatCurrency(LEADS.reduce((s, l) => s + l.value, 0) / LEADS.length)} icon={<DollarSign className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {['Discovery', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won'].map(stage => {
          const stageLeads = LEADS.filter(l => l.stage === stage)
          return (
            <Card key={stage} padding="sm">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={STAGE_COLOR[stage]} size="sm">{stage}</Badge>
                <span className="text-xs font-semibold text-slate-500">{stageLeads.length}</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(stageLeads.reduce((s, l) => s + l.value, 0))}
              </p>
            </Card>
          )
        })}
      </div>

      <Card padding="none">
        <div className="px-5 pt-4 pb-3">
          <SearchInput placeholder="Search leads, companies..." value={search} onChange={setSearch} className="w-72" />
        </div>
        <TabBar tabs={[{ id: 'pipeline', label: 'All Leads' }, { id: 'activities', label: 'Recent Activities' }]} active={tab} onChange={setTab} />

        <Table>
          <Thead>
            <tr>
              <Th>Contact</Th>
              <Th>Company</Th>
              <Th>Deal Value</Th>
              <Th>Stage</Th>
              <Th align="right">Probability</Th>
              <Th>Owner</Th>
              <Th>Source</Th>
              <Th>Last Activity</Th>
            </tr>
          </Thead>
          <Tbody>
            {LEADS.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.company.toLowerCase().includes(search.toLowerCase())).map(lead => (
              <Tr key={lead.name}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={lead.name} size="sm" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{lead.name}</span>
                  </div>
                </Td>
                <Td><span className="text-slate-600 dark:text-slate-400">{lead.company}</span></Td>
                <Td><span className="font-semibold data-value">{formatCurrency(lead.value)}</span></Td>
                <Td><Badge variant={STAGE_COLOR[lead.stage]} dot>{lead.stage}</Badge></Td>
                <Td align="right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${lead.prob}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-8 text-right">{lead.prob}%</span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <Avatar name={lead.owner} size="xs" />
                    <span className="text-xs text-slate-500">{lead.owner}</span>
                  </div>
                </Td>
                <Td><Badge variant="neutral" size="sm">{lead.source}</Badge></Td>
                <Td><span className="text-slate-400 text-xs">{lead.last}</span></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </div>
  )
}
