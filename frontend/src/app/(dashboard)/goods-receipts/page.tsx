'use client'

import { useState } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, Modal, EmptyState
} from '@/components/ui'
import { Truck, Package, CheckCircle2, Clock, FlaskConical } from 'lucide-react'

type GRNStatus = 'Complete' | 'Partial' | 'Pending Verification'

type GRN = {
  id: string; poRef: string; vendor: string; receivedBy: string
  receivedOn: string; items: string; status: GRNStatus; notes: string
}

const GRNS: GRN[] = [
  { id: 'GRN-001', poRef: 'PO-002', vendor: 'Office Depot', receivedBy: 'Rahul Mehta', receivedOn: '20 May 2026', items: 'A4 Paper × 50 bundles, Pens × 200', status: 'Complete', notes: 'All items received in good condition' },
  { id: 'GRN-002', poRef: 'PO-001', vendor: 'Dell India', receivedBy: 'Karan Singh', receivedOn: '27 May 2026', items: 'Dell XPS 15 × 1 of 2, Monitor × 3 of 3', status: 'Partial', notes: 'One laptop backordered — expected 5 Jun' },
  { id: 'GRN-003', poRef: 'PO-003', vendor: 'Apple India', receivedBy: 'Priya Sharma', receivedOn: '26 May 2026', items: 'MacBook Air M2 × 3 of 5', status: 'Pending Verification', notes: 'Waiting for serial number verification from IT' },
]

const STATUS_COLOR: Record<GRNStatus, 'success' | 'warning' | 'info'> = {
  Complete: 'success', Partial: 'warning', 'Pending Verification': 'info',
}

export default function GoodsReceiptsPage() {
  const [selected, setSelected] = useState<GRN | null>(null)

  const complete = GRNS.filter(g => g.status === 'Complete').length
  const partial = GRNS.filter(g => g.status === 'Partial').length

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — GRN data is illustrative. Full goods receipt flow ties to Purchase Orders and Inventory.</span>
      </div>

      <PageHeader
        title="Goods Receipt Notes"
        description="Record and verify goods received against purchase orders"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total GRNs" value={GRNS.length} icon={<Truck className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Complete" value={complete} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Partial" value={partial} icon={<Package className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Pending Verification" value={GRNS.filter(g => g.status === 'Pending Verification').length} icon={<Clock className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      <Card padding="none">
        {GRNS.length === 0 ? (
          <div className="py-10"><EmptyState icon={<Truck className="h-6 w-6" />} title="No GRNs recorded" /></div>
        ) : (
          <Table>
            <Thead><tr><Th>GRN No.</Th><Th>PO Ref</Th><Th>Vendor</Th><Th>Received By</Th><Th>Received On</Th><Th>Items</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {GRNS.map(g => (
                <Tr key={g.id} onClick={() => setSelected(g)}>
                  <Td><span className="font-mono text-xs font-medium text-blue-600">{g.id}</span></Td>
                  <Td><span className="font-mono text-xs text-slate-600">{g.poRef}</span></Td>
                  <Td><span className="text-xs font-medium text-slate-800">{g.vendor}</span></Td>
                  <Td><span className="text-xs text-slate-600">{g.receivedBy}</span></Td>
                  <Td><span className="text-xs text-slate-500">{g.receivedOn}</span></Td>
                  <Td><span className="text-xs text-slate-500 max-w-48 truncate block">{g.items}</span></Td>
                  <Td><Badge variant={STATUS_COLOR[g.status]} dot size="sm">{g.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.id ?? ''} size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          {selected?.status === 'Pending Verification' && <Button size="sm">Mark Verified</Button>}
        </>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">GRN against {selected.poRef}</p>
                <p className="text-sm text-slate-500">{selected.vendor}</p>
              </div>
              <Badge variant={STATUS_COLOR[selected.status]} dot>{selected.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Received By', value: selected.receivedBy },
                { label: 'Received On', value: selected.receivedOn },
              ].map(r => (
                <div key={r.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{r.label}</p>
                  <p className="text-sm font-semibold text-slate-800">{r.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Items Received</p>
              <p className="text-sm text-slate-700">{selected.items}</p>
            </div>
            {selected.notes && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-1">Notes</p>
                <p className="text-sm text-slate-700">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
