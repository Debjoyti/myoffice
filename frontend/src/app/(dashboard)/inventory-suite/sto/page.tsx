// @ts-nocheck
'use client'

import { useState } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, Modal, Input, Select, Textarea, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { ArrowUpDown, Plus, Download, Eye, XCircle, FlaskConical } from 'lucide-react'

const STATUS_VARIANT: Record<string, any> = {
  draft: 'neutral', approved: 'info', dispatched: 'warning',
  in_transit: 'warning', received: 'success', cancelled: 'neutral',
}

const MOCK_STOS = [
  { id: '1', sto_no: 'STO-2026-005', from_warehouse: 'WH-01 (Main)', to_warehouse: 'WH-02 (Raw Material)', transfer_date: '2026-05-28', expected_arrival: '2026-05-28', items: [{ name: 'Finished Assembly A1', qty: 30, uom: 'PCS', rate: 4800, amount: 144000 }], total_value: 144000, transport_mode: 'road', vehicle_no: 'INTERNAL', status: 'received' },
  { id: '2', sto_no: 'STO-2026-004', from_warehouse: 'WH-01 (Main)', to_warehouse: 'WH-04 (Bonded)', transfer_date: '2026-05-15', expected_arrival: '2026-05-15', items: [{ name: 'PCB Assembly Board', qty: 100, uom: 'PCS', rate: 1250, amount: 125000 }], total_value: 125000, transport_mode: 'road', vehicle_no: 'MH12XY5678', status: 'in_transit' },
]

const EMPTY_LINE = { name: '', qty: '', uom: 'PCS', rate: '', amount: '' }

export default function STOPage() {
  const [stos] = useState(MOCK_STOS)
  const [newSTO, setNewSTO] = useState(false)
  const [isPreview] = useState(true)
  const [lines, setLines] = useState([{ ...EMPTY_LINE }])
  const [header, setHeader] = useState({ from_warehouse_id: '', to_warehouse_id: '', transfer_date: new Date().toISOString().split('T')[0], expected_arrival: '', transport_mode: 'road', vehicle_no: '', notes: '' })

  const inTransit = stos.filter(s => s.status === 'in_transit').length
  const totalValue = stos.reduce((s, t) => s + t.total_value, 0)

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Stock Transfer Orders (STO)"
        description="Move inventory between warehouses — track in-transit stock at all times"
        actions={<>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewSTO(true)}>New STO</Button>
        </>}
      />

      {isPreview && <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700"><FlaskConical className="h-3.5 w-3.5" /><strong>Preview mode</strong></div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Total STOs" value={stos.length.toString()} icon={<ArrowUpDown className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="In Transit" value={inTransit.toString()} icon={<ArrowUpDown className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Total Transfer Value" value={formatCurrency(totalValue)} icon={<ArrowUpDown className="h-4 w-4" />} />
      </div>

      <Card padding="none">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Stock Transfer Register</p>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewSTO(true)}>New STO</Button>
        </div>
        <Table>
          <Thead><tr><Th>STO No</Th><Th>From</Th><Th>To</Th><Th>Date</Th><Th>Mode</Th><Th>Vehicle</Th><Th>Items</Th><Th align="right">Value</Th><Th>Status</Th><Th></Th></tr></Thead>
          <Tbody>
            {stos.map(s => (
              <Tr key={s.id}>
                <Td><span className="font-mono text-xs font-bold text-blue-600">{s.sto_no}</span></Td>
                <Td><span className="text-sm text-slate-700">{s.from_warehouse}</span></Td>
                <Td><span className="text-sm text-slate-700">{s.to_warehouse}</span></Td>
                <Td><span className="text-xs text-slate-500">{s.transfer_date}</span></Td>
                <Td><span className="text-xs text-slate-500">{s.transport_mode}</span></Td>
                <Td><span className="font-mono text-xs text-slate-500">{s.vehicle_no}</span></Td>
                <Td><span className="text-sm">{s.items.length}</span></Td>
                <Td align="right"><span className="data-value">{formatCurrency(s.total_value)}</span></Td>
                <Td><Badge variant={STATUS_VARIANT[s.status]}>{s.status.replace(/_/g,' ')}</Badge></Td>
                <Td>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button>
                    {s.status === 'in_transit' && <Button variant="ghost" size="sm" className="text-xs text-emerald-600">Receive</Button>}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      <Modal open={newSTO} onClose={() => setNewSTO(false)} title="New Stock Transfer Order" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewSTO(false)}>Cancel</Button><Button variant="outline" size="sm">Save Draft</Button><Button size="sm">Dispatch</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="From Warehouse *" required value={header.from_warehouse_id} onChange={e => setHeader(h => ({ ...h, from_warehouse_id: e.target.value }))} placeholder="WH-01" />
            <Input label="To Warehouse *" required value={header.to_warehouse_id} onChange={e => setHeader(h => ({ ...h, to_warehouse_id: e.target.value }))} placeholder="WH-02" />
            <Input label="Transfer Date *" type="date" value={header.transfer_date} onChange={e => setHeader(h => ({ ...h, transfer_date: e.target.value }))} />
            <Input label="Expected Arrival" type="date" value={header.expected_arrival} onChange={e => setHeader(h => ({ ...h, expected_arrival: e.target.value }))} />
            <Select label="Transport Mode" value={header.transport_mode} onChange={e => setHeader(h => ({ ...h, transport_mode: (e.target as any).value }))} options={['road','rail','air','internal'].map(m => ({ label: m, value: m }))} />
            <Input label="Vehicle No" value={header.vehicle_no} onChange={e => setHeader(h => ({ ...h, vehicle_no: e.target.value }))} placeholder="MH12AB1234 or INTERNAL" />
          </div>
          <Divider label="Items to Transfer" />
          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5"><Input label={idx===0?'Item':''} value={line.name} onChange={e => { const l=[...lines]; l[idx]={...l[idx],name:e.target.value}; setLines(l) }} placeholder="Item name" /></div>
                <div className="col-span-2"><Input label={idx===0?'Qty':''} type="number" value={line.qty} onChange={e => { const l=[...lines]; l[idx]={...l[idx],qty:e.target.value}; setLines(l) }} /></div>
                <div className="col-span-2"><Select label={idx===0?'UOM':''} value={line.uom} onChange={e => { const l=[...lines]; l[idx]={...l[idx],uom:(e.target as any).value}; setLines(l) }} options={['PCS','KG','MTR','LTR','BTL','BOX'].map(u=>({label:u,value:u}))} /></div>
                <div className="col-span-2"><Input label={idx===0?'Rate (₹)':''} type="number" value={line.rate} onChange={e => { const l=[...lines]; l[idx]={...l[idx],rate:e.target.value}; setLines(l) }} /></div>
                <div className="col-span-1 flex items-end pb-1">{lines.length>1 && <Button variant="ghost" size="icon" onClick={() => setLines(l => l.filter((_,i)=>i!==idx))}><XCircle className="h-3.5 w-3.5 text-slate-400" /></Button>}</div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setLines(l => [...l, { ...EMPTY_LINE }])}>Add Item</Button>
          <Textarea label="Notes" rows={2} value={header.notes} onChange={e => setHeader(h => ({ ...h, notes: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
