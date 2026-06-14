'use client'

import { useState } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, Modal, Input, Select, Textarea
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  FileText, Plus, Eye, Edit2, Download, AlertTriangle, CheckCircle2,
  TrendingUp, RefreshCw, PenTool
} from 'lucide-react'

const MOCK_CONTRACTS = [
  { id: 'c1', title: 'Enterprise License Agreement — TCS', party: 'Tata Consultancy Services', type: 'customer', value: 4800000, start: '2026-04-01', end: '2027-03-31', renewal: 'auto', status: 'active', signed: true, owners: ['Sales Team'] },
  { id: 'c2', title: 'Software Supply Agreement — BFW India', party: 'BFW India Ltd', type: 'vendor', value: 1200000, start: '2026-01-01', end: '2026-12-31', renewal: 'manual', status: 'active', signed: true, owners: ['Procurement'] },
  { id: 'c3', title: 'Office Lease — Embassy Business Hub', party: 'Embassy Business Hub', type: 'lease', value: 10200000, start: '2025-04-01', end: '2028-03-31', renewal: 'manual', status: 'active', signed: true, owners: ['Admin'] },
  { id: 'c4', title: 'SaaS Reseller Agreement — Wipro', party: 'Wipro Technologies', type: 'customer', value: 2400000, start: '2026-05-01', end: '2027-04-30', renewal: 'auto', status: 'review', signed: false, owners: ['Legal'] },
  { id: 'c5', title: 'Annual Maintenance — Dell Hardware', party: 'Dell India Pvt Ltd', type: 'vendor', value: 180000, start: '2026-06-01', end: '2027-05-31', renewal: 'manual', status: 'pending_sign', signed: false, owners: ['IT'] },
  { id: 'c6', title: 'Freelance Dev Agreement — Rahul Gupta', party: 'Rahul Gupta', type: 'contractor', value: 600000, start: '2026-03-01', end: '2026-08-31', renewal: 'none', status: 'expiring_soon', signed: true, owners: ['HR'] },
]

const STATUS_VARIANT: Record<string, any> = {
  active: 'success', review: 'info', pending_sign: 'warning',
  expired: 'neutral', expiring_soon: 'danger', terminated: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Active', review: 'Under Review', pending_sign: 'Pending Signature',
  expired: 'Expired', expiring_soon: 'Expiring Soon', terminated: 'Terminated',
}
const TYPE_COLOR: Record<string, string> = {
  customer: 'bg-emerald-50 text-emerald-700', vendor: 'bg-blue-50 text-blue-700',
  lease: 'bg-violet-50 text-violet-700', contractor: 'bg-amber-50 text-amber-700',
}

export default function ContractsPage() {
  const [search, setSearch] = useState('')
  const [newContract, setNewContract] = useState(false)
  const [viewContract, setViewContract] = useState<any>(null)

  const active = MOCK_CONTRACTS.filter(c => c.status === 'active').length
  const expiringSoon = MOCK_CONTRACTS.filter(c => c.status === 'expiring_soon').length
  const totalValue = MOCK_CONTRACTS.filter(c => c.status === 'active').reduce((s, c) => s + c.value, 0)
  const pendingSign = MOCK_CONTRACTS.filter(c => c.status === 'pending_sign').length

  const filtered = MOCK_CONTRACTS.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.party.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Contract Management"
        description="Manage, track, and auto-renew all business contracts — customer, vendor, lease, and contractor"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewContract(true)}>New Contract</Button>
          </>
        }
      />

      {expiringSoon > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <strong>{expiringSoon} contract(s) expiring within 30 days.</strong> Review and initiate renewal.
        </div>
      )}
      {pendingSign > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <PenTool className="h-3.5 w-3.5 flex-shrink-0" />
          <strong>{pendingSign} contract(s) pending signature.</strong> Send for e-sign.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Contracts" value={active.toString()} icon={<FileText className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Total Contract Value" value={formatCurrency(totalValue)} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Expiring Soon" value={expiringSoon.toString()} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" delta={expiringSoon > 0 ? { value: 'Within 30 days', positive: false } : undefined} />
        <StatCard label="Pending Signature" value={pendingSign.toString()} icon={<PenTool className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
      </div>

      <div className="flex items-center gap-3">
        <SearchInput placeholder="Search by title or party..." value={search} onChange={setSearch} className="w-72" />
        <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white">
          <option>All Types</option>
          {['customer','vendor','lease','contractor'].map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white">
          <option>All Statuses</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <Card padding="none">
        <Table>
          <Thead>
            <tr><Th>Contract Title</Th><Th>Party</Th><Th>Type</Th><Th align="right">Value</Th><Th>Start</Th><Th>End</Th><Th>Renewal</Th><Th>Status</Th><Th>Signed</Th><Th></Th></tr>
          </Thead>
          <Tbody>
            {filtered.map(c => {
              const daysLeft = Math.round((new Date(c.end).getTime() - Date.now()) / 86400000)
              return (
                <Tr key={c.id}>
                  <Td>
                    <p className="font-medium text-slate-800 max-w-[220px] truncate">{c.title}</p>
                    <p className="text-[10px] text-slate-400">{c.owners.join(', ')}</p>
                  </Td>
                  <Td><span className="text-sm text-slate-600">{c.party}</span></Td>
                  <Td><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[c.type]}`}>{c.type}</span></Td>
                  <Td align="right"><span className="data-value">{formatCurrency(c.value)}</span></Td>
                  <Td><span className="text-xs text-slate-500">{c.start}</span></Td>
                  <Td>
                    <span className={`text-xs ${daysLeft < 60 ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                      {c.end}
                      {daysLeft < 60 && daysLeft > 0 && <span className="block text-[10px]">{daysLeft}d left</span>}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <RefreshCw className={`h-3 w-3 ${c.renewal === 'auto' ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <span className="text-xs text-slate-500">{c.renewal}</span>
                    </div>
                  </Td>
                  <Td><Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge></Td>
                  <Td>
                    {c.signed
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      : <Button variant="ghost" size="sm" className="text-xs text-amber-600" leftIcon={<PenTool className="h-3 w-3" />}>e-Sign</Button>
                    }
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewContract(c)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon"><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon"><Download className="h-3.5 w-3.5" /></Button>
                    </div>
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </Card>

      {viewContract && (
        <Modal open={!!viewContract} onClose={() => setViewContract(null)} title={viewContract.title} size="lg"
          footer={<>
            {!viewContract.signed && <Button size="sm" leftIcon={<PenTool className="h-3.5 w-3.5" />}>Send for e-Sign</Button>}
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Download</Button>
            <Button variant="ghost" size="sm" onClick={() => setViewContract(null)}>Close</Button>
          </>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              {[
                ['Party', viewContract.party], ['Type', viewContract.type],
                ['Contract Value', formatCurrency(viewContract.value)],
                ['Start Date', viewContract.start], ['End Date', viewContract.end],
                ['Auto-Renewal', viewContract.renewal],
              ].map(([l, v]) => (
                <div key={l}><p className="text-xs text-slate-400">{l}</p><p className="font-semibold text-slate-800">{v}</p></div>
              ))}
            </div>
            <div className="p-4 bg-slate-900 rounded-xl flex items-center justify-center h-40">
              <div className="text-center text-white">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium opacity-70">Contract Document Preview</p>
                <p className="text-xs opacity-40">PDF viewer</p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      <Modal open={newContract} onClose={() => setNewContract(false)} title="New Contract" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewContract(false)}>Cancel</Button><Button variant="outline" size="sm">Save Draft</Button><Button size="sm">Create Contract</Button></>}
      >
        <div className="space-y-4">
          <Input label="Contract Title *" required placeholder="e.g. Enterprise Agreement — Infosys" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contracting Party *" required placeholder="Company or person name" />
            <Select label="Contract Type" options={['customer','vendor','lease','contractor','partnership','nda'].map(t => ({ label: t.charAt(0).toUpperCase()+t.slice(1), value: t }))} />
            <Input label="Contract Value (₹)" type="number" />
            <Select label="Auto-Renewal" options={[{label:'Auto-renew',value:'auto'},{label:'Manual renewal',value:'manual'},{label:'No renewal',value:'none'}]} />
            <Input label="Start Date *" type="date" required />
            <Input label="End Date *" type="date" required />
          </div>
          <Textarea label="Description / Scope" rows={3} placeholder="Brief description of contract scope and key terms..." />
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="rounded" defaultChecked /><span>Alert 60 days before expiry</span></label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="rounded" defaultChecked /><span>Send for e-signature</span></label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
