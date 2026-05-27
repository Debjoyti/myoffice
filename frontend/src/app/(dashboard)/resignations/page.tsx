'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, Modal, EmptyState
} from '@/components/ui'
import { LogOut, Calculator, Clock, CheckCircle2, FlaskConical } from 'lucide-react'

type ResignStatus = 'Submitted' | 'Under Notice' | 'Relieved' | 'Revoked'

type Resignation = {
  id: string; employee: string; department: string; designation: string
  submittedOn: string; lastWorkingDay: string; noticePeriod: string
  reason: string; status: ResignStatus; settlement: number
}

const MOCK_RESIGNATIONS: Resignation[] = [
  { id: 'RES-001', employee: 'Divya Nair', department: 'Product', designation: 'Product Analyst', submittedOn: '20 May 2026', lastWorkingDay: '19 Jun 2026', noticePeriod: '30 days', reason: 'Better opportunity', status: 'Under Notice', settlement: 42000 },
  { id: 'RES-002', employee: 'Amit Singh', department: 'Engineering', designation: 'Backend Developer', submittedOn: '15 May 2026', lastWorkingDay: '14 Jun 2026', noticePeriod: '30 days', reason: 'Personal relocation', status: 'Relieved', settlement: 55000 },
  { id: 'RES-003', employee: 'Neha Gupta', department: 'Finance', designation: 'Finance Analyst', submittedOn: '25 May 2026', lastWorkingDay: '24 Jun 2026', noticePeriod: '30 days', reason: 'Higher studies', status: 'Submitted', settlement: 38000 },
]

const STATUS_COLOR: Record<ResignStatus, 'warning' | 'info' | 'neutral' | 'success'> = {
  Submitted: 'warning', 'Under Notice': 'info', Relieved: 'neutral', Revoked: 'success',
}

export default function ResignationsPage() {
  const [resignations, setResignations] = useState<Resignation[]>(MOCK_RESIGNATIONS)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Resignation | null>(null)

  const underNotice = resignations.filter(r => r.status === 'Under Notice').length
  const pending = resignations.filter(r => r.status === 'Submitted').length
  const totalSettlement = resignations.filter(r => r.status !== 'Revoked').reduce((s, r) => s + r.settlement, 0)

  const filtered = useMemo(() =>
    resignations.filter(r => !search ||
      r.employee.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase())
    ),
    [resignations, search]
  )

  const updateStatus = (id: string, status: ResignStatus) => {
    setResignations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev)
  }

  const handleAcknowledge = () => {
    if (!selected) return
    updateStatus(selected.id, 'Under Notice')
  }

  const handleRelieve = () => {
    if (!selected) return
    updateStatus(selected.id, 'Relieved')
    setSelected(null)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — Resignation data is illustrative. Full offboarding workflow is on the roadmap.</span>
      </div>

      <PageHeader
        title="Resignations"
        description="Manage employee exits, notice periods, and full-and-final settlements"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Resignations" value={resignations.length} icon={<LogOut className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
        <StatCard label="Under Notice" value={underNotice} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Pending Review" value={pending} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Pending Settlement" value={`₹${totalSettlement.toLocaleString('en-IN')}`} icon={<Calculator className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-4">
          <SearchInput placeholder="Search by employee or department..." value={search} onChange={setSearch} className="w-72" />
        </div>
        {filtered.length === 0 ? (
          <div className="py-10"><EmptyState icon={<LogOut className="h-6 w-6" />} title="No resignations found" /></div>
        ) : (
          <Table>
            <Thead><tr><Th>Employee</Th><Th>Designation</Th><Th>Submitted</Th><Th>Last Working Day</Th><Th>Notice Period</Th><Th align="right">Settlement</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {filtered.map(r => (
                <Tr key={r.id} onClick={() => setSelected(r)}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar name={r.employee} size="xs" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{r.employee}</p>
                        <p className="text-[11px] text-slate-400">{r.department}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><span className="text-xs text-slate-600">{r.designation}</span></Td>
                  <Td><span className="text-xs text-slate-500">{r.submittedOn}</span></Td>
                  <Td><span className="text-xs font-medium text-slate-700">{r.lastWorkingDay}</span></Td>
                  <Td><Badge variant="neutral" size="sm">{r.noticePeriod}</Badge></Td>
                  <Td align="right"><span className="text-xs font-bold text-slate-800 tabular-nums">₹{r.settlement.toLocaleString('en-IN')}</span></Td>
                  <Td><Badge variant={STATUS_COLOR[r.status]} dot size="sm">{r.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Resignation — ${selected?.employee}`}
        size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          {selected?.status === 'Submitted' && (
            <Button size="sm" onClick={handleAcknowledge}>Acknowledge & Start Notice</Button>
          )}
          {selected?.status === 'Under Notice' && (
            <Button size="sm" onClick={handleRelieve}>Process Relieving</Button>
          )}
        </>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={selected.employee} size="md" />
              <div>
                <p className="font-semibold text-slate-900">{selected.employee}</p>
                <p className="text-sm text-slate-500">{selected.designation} · {selected.department}</p>
              </div>
              <div className="ml-auto"><Badge variant={STATUS_COLOR[selected.status]} dot>{selected.status}</Badge></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Submitted On', value: selected.submittedOn },
                { label: 'Last Working Day', value: selected.lastWorkingDay },
                { label: 'Notice Period', value: selected.noticePeriod },
                { label: 'F&F Settlement', value: `₹${selected.settlement.toLocaleString('en-IN')}` },
              ].map(r => (
                <div key={r.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{r.label}</p>
                  <p className="text-sm font-semibold text-slate-800">{r.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Reason for Leaving</p>
              <p className="text-sm text-slate-700">{selected.reason}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
