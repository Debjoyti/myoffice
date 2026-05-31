'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  ShieldCheck, Plus, Download, Eye, Edit2, AlertTriangle, CheckCircle2,
  XCircle, BarChart3, TrendingDown, ClipboardList, RefreshCw
} from 'lucide-react'

const MOCK_INSPECTIONS = [
  { id: 'QI-001', lot: 'LOT-2026-018', item: 'PCB Assembly Board', type: 'Incoming', source: 'PO-2026-028', qty_inspected: 200, qty_accepted: 198, qty_rejected: 2, inspector: 'Sunil Nair', date: '2026-05-29', result: 'accepted' },
  { id: 'QI-002', lot: 'LOT-2026-017', item: 'Finished Assembly A1', type: 'Final', source: 'WO-2026-011', qty_inspected: 60, qty_accepted: 58, qty_rejected: 2, inspector: 'Priya Sharma', date: '2026-05-28', result: 'conditional' },
  { id: 'QI-003', lot: 'LOT-2026-016', item: 'Capacitor 100µF', type: 'Incoming', source: 'PO-2026-025', qty_inspected: 1000, qty_accepted: 1000, qty_rejected: 0, inspector: 'Sunil Nair', date: '2026-05-27', result: 'accepted' },
  { id: 'QI-004', lot: 'LOT-2026-019', item: 'WIP PCB Stage 2', type: 'In-Process', source: 'WO-2026-012', qty_inspected: 50, qty_accepted: 46, qty_rejected: 4, inspector: 'Priya Sharma', date: '2026-05-30', result: 'conditional' },
]

const MOCK_NCR = [
  { id: 'NCR-2026-008', description: 'Solder bridging on PCB pins', item: 'PCB Assembly Board', detected_at: 'Final Inspection', qty: 2, severity: 'major', raised_by: 'Priya Sharma', date: '2026-05-28', status: 'open', capa: null },
  { id: 'NCR-2026-007', description: 'Dimensional deviation in bracket', item: 'Steel Bracket Type A', detected_at: 'In-Process', qty: 5, severity: 'minor', raised_by: 'Sunil Nair', date: '2026-05-22', status: 'capa_initiated', capa: 'CAPA-2026-005' },
  { id: 'NCR-2026-006', description: 'Incorrect labeling on packaging', item: 'Finished Assembly A1', detected_at: 'Outgoing', qty: 10, severity: 'minor', raised_by: 'QA Team', date: '2026-05-18', status: 'closed', capa: 'CAPA-2026-004' },
]

const MOCK_CAPA = [
  { id: 'CAPA-2026-005', ncr: 'NCR-2026-007', type: 'Corrective', problem: 'Dimensional deviation in bracket', root_cause: 'Tool wear in CNC machine', action: 'Replace cutting tool, recalibrate CNC', owner: 'Rakesh Sharma', due: '2026-06-10', status: 'open' },
  { id: 'CAPA-2026-004', ncr: 'NCR-2026-006', type: 'Corrective', problem: 'Incorrect labeling', root_cause: 'Label template not updated after product revision', action: 'Updated label template, added QC checkpoint', owner: 'Priya Sharma', due: '2026-05-25', status: 'closed' },
  { id: 'CAPA-2026-003', ncr: null, type: 'Preventive', problem: 'Potential soldering defects in summer', root_cause: 'Temperature increase affects flux viscosity', action: 'Installed additional cooling, revised flux SOP', owner: 'QA Team', due: '2026-06-01', status: 'closed' },
]

const MOCK_METRICS = [
  { month: 'Jan', defect_rate: 1.2, scrap_rate: 0.8, first_pass_yield: 98.8 },
  { month: 'Feb', defect_rate: 1.5, scrap_rate: 1.0, first_pass_yield: 98.5 },
  { month: 'Mar', defect_rate: 0.9, scrap_rate: 0.5, first_pass_yield: 99.1 },
  { month: 'Apr', defect_rate: 1.1, scrap_rate: 0.7, first_pass_yield: 98.9 },
  { month: 'May', defect_rate: 1.3, scrap_rate: 0.9, first_pass_yield: 98.7 },
]

const SEVERITY_VARIANT: Record<string, any> = { critical: 'danger', major: 'warning', minor: 'neutral' }
const STATUS_VARIANT: Record<string, any> = {
  accepted: 'success', conditional: 'warning', rejected: 'danger',
  open: 'warning', capa_initiated: 'info', closed: 'success',
}

export default function QualityPage() {
  const [tab, setTab] = useState('inspections')
  const [search, setSearch] = useState('')
  const [newNCR, setNewNCR] = useState(false)
  const [newInspection, setNewInspection] = useState(false)

  const totalInspected = MOCK_INSPECTIONS.reduce((s, i) => s + i.qty_inspected, 0)
  const totalRejected = MOCK_INSPECTIONS.reduce((s, i) => s + i.qty_rejected, 0)
  const defectRate = totalInspected > 0 ? ((totalRejected / totalInspected) * 100).toFixed(2) : '0'
  const openNCRs = MOCK_NCR.filter(n => n.status !== 'closed').length
  const openCAPAs = MOCK_CAPA.filter(c => c.status !== 'closed').length

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Quality Management"
        description="Incoming / in-process inspections, NCR, CAPA, and quality KPIs"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewNCR(true)}>Raise NCR</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewInspection(true)}>New Inspection</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="First Pass Yield" value={`${MOCK_METRICS[MOCK_METRICS.length - 1].first_pass_yield}%`} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" delta={{ value: '0.2% improvement', positive: true }} />
        <StatCard label="Defect Rate" value={`${defectRate}%`} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Open NCRs" value={openNCRs.toString()} icon={<XCircle className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
        <StatCard label="Open CAPAs" value={openCAPAs.toString()} icon={<ClipboardList className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      <TabBar
        tabs={[
          { id: 'inspections', label: 'Inspections', count: MOCK_INSPECTIONS.length },
          { id: 'ncr', label: 'NCR', count: MOCK_NCR.length },
          { id: 'capa', label: 'CAPA', count: MOCK_CAPA.length },
          { id: 'metrics', label: 'Quality KPIs' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'inspections' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Inspection Results</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewInspection(true)}>New Inspection</Button>
          </div>
          <Table>
            <Thead>
              <tr><Th>Lot No</Th><Th>Item</Th><Th>Type</Th><Th>Source</Th><Th align="right">Inspected</Th><Th align="right">Accepted</Th><Th align="right">Rejected</Th><Th>Inspector</Th><Th>Date</Th><Th>Result</Th></tr>
            </Thead>
            <Tbody>
              {MOCK_INSPECTIONS.map(i => (
                <Tr key={i.id}>
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{i.lot}</span></Td>
                  <Td><span className="font-medium text-slate-800">{i.item}</span></Td>
                  <Td><Badge variant="info">{i.type}</Badge></Td>
                  <Td><span className="font-mono text-xs text-slate-500">{i.source}</span></Td>
                  <Td align="right"><span className="text-sm">{i.qty_inspected}</span></Td>
                  <Td align="right"><span className="font-semibold text-emerald-600">{i.qty_accepted}</span></Td>
                  <Td align="right"><span className={`font-semibold ${i.qty_rejected > 0 ? 'text-red-600' : 'text-slate-300'}`}>{i.qty_rejected > 0 ? i.qty_rejected : '—'}</span></Td>
                  <Td><span className="text-sm text-slate-600">{i.inspector}</span></Td>
                  <Td><span className="text-xs text-slate-500">{i.date}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[i.result]}>{i.result}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'ncr' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Non-Conformance Reports (NCR)</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewNCR(true)}>Raise NCR</Button>
          </div>
          <Table>
            <Thead><tr><Th>NCR No</Th><Th>Description</Th><Th>Item</Th><Th>Detected At</Th><Th>Qty</Th><Th>Severity</Th><Th>Raised By</Th><Th>Date</Th><Th>Status</Th><Th>CAPA</Th></tr></Thead>
            <Tbody>
              {MOCK_NCR.map(n => (
                <Tr key={n.id}>
                  <Td><span className="font-mono text-xs font-bold text-red-600">{n.id}</span></Td>
                  <Td><span className="font-medium text-slate-800 max-w-[180px] truncate block">{n.description}</span></Td>
                  <Td><span className="text-sm text-slate-600">{n.item}</span></Td>
                  <Td><span className="text-xs text-slate-500">{n.detected_at}</span></Td>
                  <Td><span className="text-sm">{n.qty}</span></Td>
                  <Td><Badge variant={SEVERITY_VARIANT[n.severity]}>{n.severity}</Badge></Td>
                  <Td><span className="text-sm text-slate-600">{n.raised_by}</span></Td>
                  <Td><span className="text-xs text-slate-500">{n.date}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[n.status]}>{n.status.replace('_', ' ')}</Badge></Td>
                  <Td>{n.capa ? <span className="font-mono text-xs text-blue-600">{n.capa}</span> : <span className="text-slate-300">—</span>}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'capa' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Corrective & Preventive Actions (CAPA)</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>New CAPA</Button>
          </div>
          <Table>
            <Thead><tr><Th>CAPA No</Th><Th>Type</Th><Th>Problem</Th><Th>Root Cause</Th><Th>Action</Th><Th>Owner</Th><Th>Due Date</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {MOCK_CAPA.map(c => (
                <Tr key={c.id}>
                  <Td><span className="font-mono text-xs font-bold text-violet-600">{c.id}</span></Td>
                  <Td><Badge variant={c.type === 'Corrective' ? 'warning' : 'info'}>{c.type}</Badge></Td>
                  <Td><span className="font-medium text-slate-800 max-w-[140px] truncate block">{c.problem}</span></Td>
                  <Td><span className="text-xs text-slate-500 max-w-[140px] truncate block">{c.root_cause}</span></Td>
                  <Td><span className="text-xs text-slate-600 max-w-[150px] truncate block">{c.action}</span></Td>
                  <Td><span className="text-sm text-slate-600">{c.owner}</span></Td>
                  <Td><span className="text-xs text-slate-500">{c.due}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'metrics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Quality KPIs — Monthly Trend" />
            <div className="space-y-3 mt-4">
              <Table>
                <Thead><tr><Th>Month</Th><Th align="right">Defect Rate</Th><Th align="right">Scrap Rate</Th><Th align="right">First Pass Yield</Th></tr></Thead>
                <Tbody>
                  {MOCK_METRICS.map(m => (
                    <Tr key={m.month}>
                      <Td><span className="font-medium">{m.month}</span></Td>
                      <Td align="right"><span className={`font-semibold ${m.defect_rate > 1.5 ? 'text-red-600' : 'text-amber-600'}`}>{m.defect_rate}%</span></Td>
                      <Td align="right"><span className="text-slate-600">{m.scrap_rate}%</span></Td>
                      <Td align="right"><span className={`font-semibold ${m.first_pass_yield >= 99 ? 'text-emerald-600' : 'text-amber-600'}`}>{m.first_pass_yield}%</span></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          </Card>
          <Card>
            <CardHeader title="Quality Targets" description="FY 2026-27" />
            <div className="space-y-4 mt-3">
              {[
                { kpi: 'First Pass Yield', target: 99.5, actual: 98.7, unit: '%' },
                { kpi: 'Defect Rate', target: 0.5, actual: 1.3, unit: '%', lower_is_better: true },
                { kpi: 'Scrap Rate', target: 0.5, actual: 0.9, unit: '%', lower_is_better: true },
                { kpi: 'Customer Returns (PPM)', target: 200, actual: 450, unit: 'PPM', lower_is_better: true },
              ].map(k => {
                const met = k.lower_is_better ? k.actual <= k.target : k.actual >= k.target
                return (
                  <div key={k.kpi}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{k.kpi}</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${met ? 'text-emerald-600' : 'text-red-600'}`}>{k.actual}{k.unit}</span>
                        <span className="text-slate-400 text-xs">Target: {k.target}{k.unit}</span>
                        {met ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      <Modal open={newNCR} onClose={() => setNewNCR(false)} title="Raise Non-Conformance Report" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewNCR(false)}>Cancel</Button><Button size="sm">Raise NCR</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Item / Product" placeholder="Item name" required />
            <Select label="Detection Stage" options={['Incoming','In-Process','Final','Outgoing','Customer Return'].map(s => ({ label: s, value: s }))} />
            <Input label="Lot / Batch Number" placeholder="LOT-2026-XXX" />
            <Input label="Non-Conforming Quantity" type="number" required />
            <Select label="Severity" options={[{ label: 'Critical', value: 'critical' }, { label: 'Major', value: 'major' }, { label: 'Minor', value: 'minor' }]} />
            <Input label="Reference (WO / PO)" placeholder="WO / PO number" />
          </div>
          <Textarea label="Description of Non-Conformance" required rows={3} placeholder="Describe the defect / non-conformance in detail..." />
          <Textarea label="Immediate Containment Action" rows={2} placeholder="What immediate action was taken to contain?" />
        </div>
      </Modal>

      <Modal open={newInspection} onClose={() => setNewInspection(false)} title="New Inspection Lot" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewInspection(false)}>Cancel</Button><Button size="sm">Record Inspection</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Item" placeholder="Item name" required />
            <Select label="Inspection Type" options={['Incoming','In-Process','Final','Outgoing'].map(s => ({ label: s, value: s }))} />
            <Input label="Source (WO / PO)" placeholder="Reference" required />
            <Input label="Lot Number" placeholder="LOT-2026-XXX" />
            <Input label="Quantity Inspected" type="number" required />
            <Input label="Quantity Accepted" type="number" required />
            <Input label="Quantity Rejected" type="number" placeholder="0" />
            <Input label="Inspection Date" type="date" required />
          </div>
          <Textarea label="Observations / Remarks" rows={2} placeholder="Inspection notes..." />
        </div>
      </Modal>
    </div>
  )
}
