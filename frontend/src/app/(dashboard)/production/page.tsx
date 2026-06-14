'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea
} from '@/components/ui'
import {
  Factory, Plus, Download, Eye, Edit2, TrendingUp,
  CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react'

const MOCK_WORK_ORDERS = [
  { id: 'WO-2026-012', product: 'Finished Assembly Unit A1', qty_planned: 100, qty_produced: 78, bom: 'BOM-001', routing: 'RT-001', start: '2026-05-20', end: '2026-06-05', priority: 'high', status: 'in_progress' },
  { id: 'WO-2026-011', product: 'WIP PCB Stage 2', qty_planned: 60, qty_produced: 60, bom: 'BOM-002', routing: 'RT-002', start: '2026-05-15', end: '2026-05-28', priority: 'normal', status: 'completed' },
  { id: 'WO-2026-010', product: 'Finished Assembly Unit A1', qty_planned: 50, qty_produced: 50, bom: 'BOM-001', routing: 'RT-001', start: '2026-05-01', end: '2026-05-18', priority: 'normal', status: 'completed' },
  { id: 'WO-2026-013', product: 'Assembly Unit B2', qty_planned: 30, qty_produced: 0, bom: 'BOM-003', routing: 'RT-003', start: '2026-06-01', end: '2026-06-20', priority: 'low', status: 'planned' },
]

const MOCK_OPERATIONS = [
  { id: 'OP-001', wo: 'WO-2026-012', operation: 'PCB Soldering', work_center: 'SMT Line 1', planned_hrs: 40, actual_hrs: 35, status: 'completed', yield: 99.2 },
  { id: 'OP-002', wo: 'WO-2026-012', operation: 'Assembly', work_center: 'Assembly Line 2', planned_hrs: 30, actual_hrs: 28, status: 'in_progress', yield: null },
  { id: 'OP-003', wo: 'WO-2026-012', operation: 'Quality Inspection', work_center: 'QC Station', planned_hrs: 8, actual_hrs: 0, status: 'pending', yield: null },
  { id: 'OP-004', wo: 'WO-2026-012', operation: 'Packaging', work_center: 'Pack Line', planned_hrs: 5, actual_hrs: 0, status: 'pending', yield: null },
]

const MOCK_MRP = [
  { id: 'MRP-001', item: 'PCB Assembly Board', required: 200, available: 450, shortage: 0, planned_receipt: null, action: 'ok' },
  { id: 'MRP-002', item: 'Steel Sheet 2mm', required: 500, available: 80, shortage: 420, planned_receipt: '2026-06-02', action: 'place_po' },
  { id: 'MRP-003', item: 'Capacitor 100µF', required: 2000, available: 5000, shortage: 0, planned_receipt: null, action: 'ok' },
  { id: 'MRP-004', item: 'Flux Solution 500ml', required: 80, available: 15, shortage: 65, planned_receipt: '2026-06-03', action: 'expedite_po' },
]

const MOCK_WORK_CENTERS = [
  { id: 'WC-001', name: 'SMT Line 1', type: 'Machine', capacity_hrs: 200, utilized_hrs: 165, efficiency: 88, status: 'running' },
  { id: 'WC-002', name: 'Assembly Line 2', type: 'Mixed', capacity_hrs: 240, utilized_hrs: 190, efficiency: 79, status: 'running' },
  { id: 'WC-003', name: 'QC Station', type: 'Labour', capacity_hrs: 120, utilized_hrs: 60, efficiency: 100, status: 'idle' },
  { id: 'WC-004', name: 'Pack Line', type: 'Mixed', capacity_hrs: 160, utilized_hrs: 145, efficiency: 91, status: 'running' },
]

const STATUS_VARIANT: Record<string, any> = {
  planned: 'neutral', in_progress: 'info', completed: 'success', on_hold: 'warning', cancelled: 'danger',
  running: 'success', idle: 'neutral', maintenance: 'warning',
  ok: 'success', place_po: 'warning', expedite_po: 'danger',
  pending: 'neutral',
}
const PRIORITY_COLOR: Record<string, string> = { high: 'text-red-600 bg-red-50', normal: 'text-blue-600 bg-blue-50', low: 'text-slate-600 bg-slate-100' }

export default function ProductionPage() {
  const [tab, setTab] = useState('orders')
  const [search, setSearch] = useState('')
  const [newWO, setNewWO] = useState(false)

  const inProgress = MOCK_WORK_ORDERS.filter(w => w.status === 'in_progress').length
  const completed = MOCK_WORK_ORDERS.filter(w => w.status === 'completed').length
  const totalPlanned = MOCK_WORK_ORDERS.reduce((s, w) => s + w.qty_planned, 0)
  const totalProduced = MOCK_WORK_ORDERS.reduce((s, w) => s + w.qty_produced, 0)
  const shortages = MOCK_MRP.filter(m => m.shortage > 0).length

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Production Planning"
        description="Work orders, MRP, BOM explode, capacity planning, and shop-floor control"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>Run MRP</Button>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewWO(true)}>New Work Order</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="In Progress" value={inProgress.toString()} icon={<Factory className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Completed" value={completed.toString()} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Production Rate" value={`${Math.round((totalProduced / totalPlanned) * 100)}%`} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" delta={{ value: 'vs plan', positive: true }} />
        <StatCard label="MRP Shortages" value={shortages.toString()} icon={<AlertCircle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" delta={shortages > 0 ? { value: 'Action needed', positive: false } : undefined} />
      </div>

      <TabBar
        tabs={[
          { id: 'orders', label: 'Work Orders', count: MOCK_WORK_ORDERS.length },
          { id: 'operations', label: 'Operations' },
          { id: 'mrp', label: 'MRP' },
          { id: 'workcenters', label: 'Work Centers' },
          { id: 'capacity', label: 'Capacity' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'orders' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
            <SearchInput placeholder="Search work orders..." value={search} onChange={setSearch} className="w-72" />
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} className="ml-auto" onClick={() => setNewWO(true)}>New WO</Button>
          </div>
          <Table>
            <Thead>
              <tr><Th>Work Order</Th><Th>Product</Th><Th>BOM</Th><Th>Priority</Th><Th>Start</Th><Th>End</Th><Th>Progress</Th><Th>Status</Th><Th></Th></tr>
            </Thead>
            <Tbody>
              {MOCK_WORK_ORDERS.map(wo => {
                const pct = wo.qty_planned > 0 ? Math.round((wo.qty_produced / wo.qty_planned) * 100) : 0
                return (
                  <Tr key={wo.id}>
                    <Td><span className="font-mono text-xs font-bold text-blue-600">{wo.id}</span></Td>
                    <Td>
                      <p className="font-medium text-slate-800">{wo.product}</p>
                      <p className="text-[10px] text-slate-400">Qty: {wo.qty_produced}/{wo.qty_planned}</p>
                    </Td>
                    <Td><span className="font-mono text-xs text-slate-500">{wo.bom}</span></Td>
                    <Td><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[wo.priority]}`}>{wo.priority}</span></Td>
                    <Td><span className="text-xs text-slate-500">{wo.start}</span></Td>
                    <Td><span className="text-xs text-slate-500">{wo.end}</span></Td>
                    <Td>
                      <div className="w-24">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                          <span>{pct}%</span><span>{wo.qty_produced}/{wo.qty_planned}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </Td>
                    <Td><Badge variant={STATUS_VARIANT[wo.status]}>{wo.status.replace('_', ' ')}</Badge></Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon"><Edit2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'operations' && (
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Operations — WO-2026-012 (Finished Assembly Unit A1)</p>
          </div>
          <Table>
            <Thead><tr><Th>Operation</Th><Th>Work Center</Th><Th align="right">Planned Hrs</Th><Th align="right">Actual Hrs</Th><Th>Yield %</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {MOCK_OPERATIONS.map(op => (
                <Tr key={op.id}>
                  <Td><span className="font-medium text-slate-800">{op.operation}</span></Td>
                  <Td><span className="text-sm text-slate-600">{op.work_center}</span></Td>
                  <Td align="right"><span className="text-sm">{op.planned_hrs}h</span></Td>
                  <Td align="right"><span className={`font-semibold ${op.actual_hrs > op.planned_hrs ? 'text-red-600' : 'text-slate-700'}`}>{op.actual_hrs > 0 ? `${op.actual_hrs}h` : '—'}</span></Td>
                  <Td><span className={`font-semibold ${op.yield ? (op.yield >= 98 ? 'text-emerald-600' : 'text-amber-600') : 'text-slate-300'}`}>{op.yield ? `${op.yield}%` : '—'}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[op.status]}>{op.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'mrp' && (
        <div className="space-y-4">
          {shortages > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <strong>{shortages} material shortages</strong> detected. Create purchase orders to avoid production stoppage.
            </div>
          )}
          <Card padding="none">
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">MRP Results — Material Requirements Planning</p>
              <Button size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>Re-run MRP</Button>
            </div>
            <Table>
              <Thead><tr><Th>Material</Th><Th align="right">Required</Th><Th align="right">Available</Th><Th align="right">Shortage</Th><Th>Planned Receipt</Th><Th>Action</Th></tr></Thead>
              <Tbody>
                {MOCK_MRP.map(m => (
                  <Tr key={m.id}>
                    <Td><span className="font-medium text-slate-800">{m.item}</span></Td>
                    <Td align="right"><span className="text-sm">{m.required}</span></Td>
                    <Td align="right"><span className={`font-semibold ${m.available < m.required ? 'text-red-600' : 'text-emerald-600'}`}>{m.available}</span></Td>
                    <Td align="right"><span className={`font-bold ${m.shortage > 0 ? 'text-red-700' : 'text-slate-300'}`}>{m.shortage > 0 ? m.shortage : '—'}</span></Td>
                    <Td><span className="text-xs text-slate-500">{m.planned_receipt ?? '—'}</span></Td>
                    <Td>
                      <Badge variant={STATUS_VARIANT[m.action]}>
                        {m.action === 'ok' ? 'OK' : m.action === 'place_po' ? 'Place PO' : 'Expedite PO'}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}

      {tab === 'workcenters' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {MOCK_WORK_CENTERS.map(wc => {
            const pct = Math.round((wc.utilized_hrs / wc.capacity_hrs) * 100)
            return (
              <Card key={wc.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-800">{wc.name}</p>
                    <p className="text-xs text-slate-500">{wc.type} work center</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[wc.status]}>{wc.status}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Capacity</span>
                    <span>{wc.utilized_hrs}h / {wc.capacity_hrs}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Efficiency</span>
                    <span className={`font-semibold ${wc.efficiency >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>{wc.efficiency}%</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Utilization</span>
                      <span className={`font-semibold ${pct > 90 ? 'text-red-600' : pct > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'capacity' && (
        <Card>
          <CardHeader title="Capacity Overview" description="Current month capacity vs utilization" />
          <div className="space-y-4 mt-4">
            {MOCK_WORK_CENTERS.map(wc => {
              const pct = Math.round((wc.utilized_hrs / wc.capacity_hrs) * 100)
              return (
                <div key={wc.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700">{wc.name}</span>
                    <span className="text-slate-500">{wc.utilized_hrs}h / {wc.capacity_hrs}h ({pct}%)</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full flex items-center justify-end pr-2 text-[10px] text-white font-bold ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }}>
                      {pct > 20 ? `${pct}%` : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Modal open={newWO} onClose={() => setNewWO(false)} title="New Work Order" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewWO(false)}>Cancel</Button><Button variant="outline" size="sm">Save Draft</Button><Button size="sm">Release WO</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Product / FG Item" options={[{ label: 'Finished Assembly Unit A1', value: 'FIN-ASM-A1' }, { label: 'Assembly Unit B2', value: 'FIN-ASM-B2' }]} />
            <Select label="BOM" options={[{ label: 'BOM-001 (v2.3)', value: 'BOM-001' }, { label: 'BOM-003 (v1.0)', value: 'BOM-003' }]} />
            <Input label="Planned Quantity" type="number" placeholder="100" required />
            <Select label="Priority" options={[{ label: 'High', value: 'high' }, { label: 'Normal', value: 'normal' }, { label: 'Low', value: 'low' }]} />
            <Input label="Planned Start Date" type="date" required />
            <Input label="Planned End Date" type="date" required />
          </div>
          <Textarea label="Remarks / Instructions" rows={2} placeholder="Special instructions for shop floor..." />
        </div>
      </Modal>
    </div>
  )
}
