'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, Modal, Input, Select, Textarea
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { ClipboardList, Plus, Download, Eye, CheckCircle2, AlertTriangle, FlaskConical } from 'lucide-react'

const STATUS_VARIANT: Record<string, any> = {
  planned: 'neutral', in_progress: 'info', counted: 'warning',
  under_review: 'warning', approved: 'success', posted: 'success', cancelled: 'neutral',
}

const MOCK_COUNTS = [
  { id: '1', count_no: 'PC-2026-003', count_type: 'cycle', warehouse: 'WH-01 (Main)', zone: 'Zone A', count_date: '2026-05-25', total_items: 12, items_matched: 10, items_variance: 2, total_variance_value: 3200, status: 'posted', counted_by: 'Rakesh Sharma' },
  { id: '2', count_no: 'PC-2026-002', count_type: 'full', warehouse: 'WH-02 (Raw Material)', zone: 'All', count_date: '2026-04-30', total_items: 8, items_matched: 8, items_variance: 0, total_variance_value: 0, status: 'posted', counted_by: 'Priya Patel' },
  { id: '3', count_no: 'PC-2026-004', count_type: 'spot', warehouse: 'WH-03 (Chemical)', zone: 'All', count_date: '2026-06-01', total_items: 3, items_matched: 0, items_variance: 0, total_variance_value: 0, status: 'planned', counted_by: null },
]

const MOCK_ITEMS_TO_COUNT = [
  { sku: 'ELE-PCB-001', name: 'PCB Assembly Board', system_qty: 450, bin: 'A-01-01-1', counted_qty_1: '', counted_qty_2: '', variance: null },
  { sku: 'ELE-CAP-100', name: 'Capacitor 100µF', system_qty: 5000, bin: 'A-01-02-1', counted_qty_1: '', counted_qty_2: '', variance: null },
  { sku: 'FIN-ASM-A1', name: 'Finished Assembly A1', system_qty: 220, bin: 'B-02-01-1', counted_qty_1: '', counted_qty_2: '', variance: null },
]

export default function StockCountPage() {
  const [counts] = useState(MOCK_COUNTS)
  const [newCount, setNewCount] = useState(false)
  const [countSession, setCountSession] = useState<any>(null)
  const [countItems, setCountItems] = useState(MOCK_ITEMS_TO_COUNT)

  const withVariance = counts.filter(c => c.items_variance > 0).length

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Physical Inventory Count"
        description="Cycle counting, full physical inventory, and variance adjustment with full audit trail"
        actions={<>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewCount(true)}>New Count</Button>
        </>}
      />

      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
        <strong>Audit-compliant:</strong> All count entries are timestamped and attributed. Variances create reversing stock adjustment entries in the ledger. Posted counts cannot be reversed — only a counter-count can correct.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Counts" value={counts.length.toString()} icon={<ClipboardList className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="With Variance" value={withVariance.toString()} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Variance Value" value={formatCurrency(counts.reduce((s,c) => s+c.total_variance_value,0))} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
        <StatCard label="Planned" value={counts.filter(c => c.status==='planned').length.toString()} icon={<ClipboardList className="h-4 w-4" />} />
      </div>

      <Card padding="none">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Physical Count History</p>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewCount(true)}>New Count</Button>
        </div>
        <Table>
          <Thead><tr><Th>Count No</Th><Th>Type</Th><Th>Warehouse</Th><Th>Zone</Th><Th>Date</Th><Th>Items</Th><Th align="right">Variance Items</Th><Th align="right">Variance Value</Th><Th>Counted By</Th><Th>Status</Th><Th></Th></tr></Thead>
          <Tbody>
            {counts.map(c => (
              <Tr key={c.id}>
                <Td><span className="font-mono text-xs font-bold text-blue-600">{c.count_no}</span></Td>
                <Td><Badge variant={c.count_type==='full'?'warning':c.count_type==='cycle'?'info':'neutral'}>{c.count_type}</Badge></Td>
                <Td><span className="text-sm text-slate-700">{c.warehouse}</span></Td>
                <Td><span className="text-xs text-slate-500">{c.zone}</span></Td>
                <Td><span className="text-xs text-slate-500">{c.count_date}</span></Td>
                <Td><span className="text-sm">{c.total_items}</span></Td>
                <Td align="right"><span className={`font-semibold ${c.items_variance > 0 ? 'text-red-600' : 'text-slate-300'}`}>{c.items_variance > 0 ? c.items_variance : '—'}</span></Td>
                <Td align="right"><span className={`font-semibold ${c.total_variance_value > 0 ? 'text-red-600' : 'text-slate-300'}`}>{c.total_variance_value > 0 ? formatCurrency(c.total_variance_value) : '—'}</span></Td>
                <Td><span className="text-sm text-slate-600">{c.counted_by ?? '—'}</span></Td>
                <Td><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></Td>
                <Td>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button>
                    {c.status === 'planned' && <Button variant="ghost" size="sm" className="text-xs text-blue-600" onClick={() => setCountSession(c)}>Start Count</Button>}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      {/* Count Session Modal */}
      {countSession && (
        <Modal open={!!countSession} onClose={() => setCountSession(null)} title={`Count Session — ${countSession.count_no}`} size="lg"
          footer={<><Button variant="ghost" size="sm" onClick={() => setCountSession(null)}>Save & Continue Later</Button><Button size="sm">Submit Count</Button></>}
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <strong>Count in progress:</strong> Enter the physical counted quantity for each item. System quantity is shown for reference — do NOT adjust to match. Count independently.
            </div>
            <Table>
              <Thead><tr><Th>SKU</Th><Th>Item</Th><Th>Bin</Th><Th align="right">System Qty</Th><Th align="right">Count 1</Th><Th align="right">Count 2</Th><Th align="right">Variance</Th></tr></Thead>
              <Tbody>
                {countItems.map((item, idx) => {
                  const c1 = Number(item.counted_qty_1) || null
                  const c2 = Number(item.counted_qty_2) || null
                  const final = c2 ?? c1 ?? null
                  const variance = final !== null ? final - item.system_qty : null
                  return (
                    <Tr key={item.sku}>
                      <Td><span className="font-mono text-xs text-blue-600">{item.sku}</span></Td>
                      <Td><span className="font-medium text-slate-800">{item.name}</span></Td>
                      <Td><span className="font-mono text-xs text-slate-500">{item.bin}</span></Td>
                      <Td align="right"><span className="font-semibold text-slate-600">{item.system_qty}</span></Td>
                      <Td align="right">
                        <input type="number" value={item.counted_qty_1} onChange={e => { const i=[...countItems]; i[idx]={...i[idx],counted_qty_1:e.target.value}; setCountItems(i) }}
                          className="w-20 text-right text-sm border border-slate-200 rounded px-2 py-1 focus:border-blue-400 focus:outline-none" placeholder="—" />
                      </Td>
                      <Td align="right">
                        <input type="number" value={item.counted_qty_2} onChange={e => { const i=[...countItems]; i[idx]={...i[idx],counted_qty_2:e.target.value}; setCountItems(i) }}
                          className="w-20 text-right text-sm border border-slate-200 rounded px-2 py-1 focus:border-blue-400 focus:outline-none" placeholder="—" />
                      </Td>
                      <Td align="right">
                        {variance !== null ? (
                          <span className={`font-bold ${variance === 0 ? 'text-emerald-600' : variance > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {variance > 0 ? '+' : ''}{variance}
                          </span>
                        ) : <span className="text-slate-300">—</span>}
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </div>
        </Modal>
      )}

      {/* New Count Modal */}
      <Modal open={newCount} onClose={() => setNewCount(false)} title="Schedule Physical Count" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewCount(false)}>Cancel</Button><Button size="sm">Schedule Count</Button></>}
      >
        <div className="space-y-4">
          <Select label="Count Type" options={[{ label: 'Cycle Count (partial — by zone/category)', value: 'cycle' }, { label: 'Full Physical Inventory', value: 'full' }, { label: 'Spot Check (specific items)', value: 'spot' }]} />
          <Select label="Warehouse" options={[{ label: 'WH-01 — Main Warehouse', value: 'WH-01' }, { label: 'WH-02 — Raw Material Store', value: 'WH-02' }, { label: 'WH-03 — Chemical Store', value: 'WH-03' }]} />
          <Input label="Zone / Area (for cycle count)" placeholder="Zone A, Zone B, or All" />
          <Input label="Count Date *" type="date" required />
          <Input label="Freeze Date (stock frozen for count)" type="date" />
          <Textarea label="Instructions for counting team" rows={2} placeholder="What to count, how to handle discrepancies..." />
        </div>
      </Modal>
    </div>
  )
}
