'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  ArrowDown, Plus, Download, Eye, Edit2, CheckCircle2, XCircle,
  FlaskConical, RefreshCw, AlertTriangle, Ship, Truck
} from 'lucide-react'

const STATUS_VARIANT: Record<string, any> = {
  draft: 'neutral', received: 'info', under_inspection: 'warning',
  accepted: 'success', partially_rejected: 'warning', rejected: 'danger',
  posted: 'success', cancelled: 'neutral',
}
const QC_VARIANT: Record<string, any> = {
  pending: 'warning', in_progress: 'info', passed: 'success',
  failed: 'danger', conditional: 'warning',
}

const MOCK_GRNS = [
  {
    id: '1', grn_no: 'GRN-2026-0021', po_no: 'PO-2026-0029', vendor_name: 'ABC Steel Traders',
    receipt_date: '2026-05-29', vehicle_no: 'MH12AB1234', lr_no: 'LR99001',
    invoice_no: 'ABC-INV-2026-055', warehouse_id: 'WH-02', warehouse_name: 'Raw Material Store',
    items: [
      { name: 'Steel Sheet 2mm', po_qty: 500, received_qty: 500, accepted_qty: 498, rejected_qty: 2, uom: 'KG', rate: 85, amount: 42330, lot_no: 'LOT-SS-2605' },
    ],
    total_received_value: 42330, inspection_required: true, inspection_status: 'passed',
    status: 'posted', posted_at: '2026-05-29',
  },
  {
    id: '2', grn_no: 'GRN-2026-0022', po_no: 'PO-2026-0030', vendor_name: 'Shenzhen Tech Electronics',
    receipt_date: '2026-06-05', vehicle_no: null, lr_no: null, bl_no: 'COSU6789012345',
    invoice_no: 'STE-2026-INV-0041', warehouse_id: 'WH-01', warehouse_name: 'Main Warehouse',
    items: [
      { name: 'PCB Assembly Board', po_qty: 500, received_qty: 500, accepted_qty: 0, rejected_qty: 0, uom: 'PCS', rate: 1247, amount: 623500, lot_no: null },
    ],
    total_received_value: 623500, inspection_required: true, inspection_status: 'pending',
    status: 'under_inspection', posted_at: null,
  },
  {
    id: '3', grn_no: 'GRN-2026-0020', po_no: 'PO-2026-0028', vendor_name: 'Heraeus Electronics GmbH',
    receipt_date: '2026-05-26', vehicle_no: null, lr_no: null,
    invoice_no: 'HE-2026-04-0098', warehouse_id: 'WH-03', warehouse_name: 'Chemical Store',
    items: [
      { name: 'Flux Solution 500ml', po_qty: 100, received_qty: 20, accepted_qty: 20, rejected_qty: 0, uom: 'BTL', rate: 320, amount: 6400, batch_no: 'B-HE-0524' },
    ],
    total_received_value: 6400, inspection_required: true, inspection_status: 'passed',
    status: 'posted', posted_at: '2026-05-26',
  },
]

const EMPTY_LINE = { name: '', po_qty: '', received_qty: '', accepted_qty: '', rejected_qty: '0', uom: 'PCS', rate: '', gst_rate: '18', amount: '', bin_id: '', lot_no: '', batch_no: '', expiry_date: '', remarks: '' }

export default function GRNPage() {
  const [grns, setGRNs] = useState(MOCK_GRNS)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [newGRN, setNewGRN] = useState(false)
  const [qcModal, setQcModal] = useState<any>(null)
  const [viewGRN, setViewGRN] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [lines, setLines] = useState([{ ...EMPTY_LINE }])
  const [header, setHeader] = useState({
    po_no: '', vendor_name: '', receipt_date: new Date().toISOString().split('T')[0],
    vehicle_no: '', lr_no: '', bl_no: '', invoice_no: '', invoice_date: '',
    invoice_amount: '', warehouse_id: '', notes: '',
  })
  const [qcForm, setQcForm] = useState({ result: 'passed', notes: '' })

  const fetchGRNs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/inventory/grn')
      if (res.ok) {
        const data = await res.json()
        if (data.goods_receipts?.length > 0) { setGRNs(data.goods_receipts); setIsPreview(false) }
      }
    } catch { /* keep mock */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchGRNs() }, [fetchGRNs])

  const filtered = grns.filter(g => {
    const matchSearch = !search || g.grn_no.toLowerCase().includes(search.toLowerCase()) || g.vendor_name.toLowerCase().includes(search.toLowerCase())
    const matchTab = tab === 'all' ? true : tab === 'pending_qc' ? g.inspection_status === 'pending' : g.status === tab
    return matchSearch && matchTab
  })

  const handleQC = async () => {
    if (!qcModal) return
    setSaving(true)
    try {
      await fetch('/api/v1/inventory/grn', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'qc_result', grn_id: qcModal.id, result: qcForm.result, notes: qcForm.notes }),
      })
      setQcModal(null); fetchGRNs()
    } finally { setSaving(false) }
  }

  const handlePost = async (grn_id: string) => {
    setSaving(true)
    try {
      await fetch('/api/v1/inventory/grn', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'post', grn_id }),
      })
      fetchGRNs(); setViewGRN(null)
    } finally { setSaving(false) }
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      const items = lines.filter(l => l.name && l.received_qty).map(l => ({
        name: l.name, po_qty: Number(l.po_qty) || 0, received_qty: Number(l.received_qty),
        accepted_qty: Number(l.accepted_qty) || Number(l.received_qty),
        rejected_qty: Number(l.rejected_qty) || 0,
        uom: l.uom, rate: Number(l.rate) || 0, gst_rate: Number(l.gst_rate),
        amount: Number(l.amount) || Number(l.received_qty) * Number(l.rate),
        lot_no: l.lot_no || null, batch_no: l.batch_no || null,
        expiry_date: l.expiry_date || null, remarks: l.remarks,
      }))
      const res = await fetch('/api/v1/inventory/grn', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...header, items, invoice_amount: Number(header.invoice_amount) || null }),
      })
      if (res.ok) { setNewGRN(false); setLines([{ ...EMPTY_LINE }]); fetchGRNs() }
    } finally { setSaving(false) }
  }

  const pendingQC = grns.filter(g => g.inspection_status === 'pending').length
  const posted = grns.filter(g => g.status === 'posted').length
  const totalValue = grns.reduce((s, g) => s + g.total_received_value, 0)

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Goods Receipt Notes (GRN)"
        description="Record inward stock from domestic suppliers and foreign shipments — with QC inspection workflow"
        actions={<>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewGRN(true)}>New GRN</Button>
        </>}
      />

      {isPreview && <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700"><FlaskConical className="h-3.5 w-3.5" /><strong>Preview mode</strong></div>}

      {pendingQC > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <strong>{pendingQC} GRN(s) pending quality inspection.</strong> Complete QC before posting to stock.
          <Button variant="ghost" size="sm" className="ml-auto text-amber-700" onClick={() => setTab('pending_qc')}>View</Button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total GRNs" value={grns.length.toString()} icon={<ArrowDown className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Pending QC" value={pendingQC.toString()} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" delta={pendingQC > 0 ? { value: 'Needs inspection', positive: false } : undefined} />
        <StatCard label="Posted to Stock" value={posted.toString()} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Total Received Value" value={formatCurrency(totalValue)} icon={<ArrowDown className="h-4 w-4" />} />
      </div>

      <TabBar tabs={[
        { id: 'all', label: 'All', count: grns.length },
        { id: 'pending_qc', label: '⚠ Pending QC', count: pendingQC },
        { id: 'posted', label: 'Posted', count: posted },
      ]} active={tab} onChange={setTab} />

      <Card padding="none">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
          <SearchInput placeholder="Search GRN no, vendor..." value={search} onChange={setSearch} className="w-64" />
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchGRNs} className="ml-auto">Refresh</Button>
        </div>
        <Table>
          <Thead>
            <tr><Th>GRN No</Th><Th>Vendor</Th><Th>Source</Th><Th>Date</Th><Th>Invoice</Th><Th>Warehouse</Th><Th>Items</Th><Th align="right">Value</Th><Th>QC</Th><Th>Status</Th><Th></Th></tr>
          </Thead>
          <Tbody>
            {loading ? <Tr><td colSpan={11} className="py-10 text-center text-slate-400 text-sm">Loading…</td></Tr>
            : filtered.map(g => (
              <Tr key={g.id}>
                <Td><span className="font-mono text-xs font-bold text-blue-600">{g.grn_no}</span></Td>
                <Td>
                  <p className="font-medium text-slate-800">{g.vendor_name}</p>
                  {g.po_no && <p className="font-mono text-[10px] text-slate-400">← {g.po_no}</p>}
                </Td>
                <Td>
                  {(g as any).bl_no ? <Badge variant="info"><span className="flex items-center gap-1"><Ship className="h-3 w-3" />Import</span></Badge>
                   : <Badge variant="neutral"><span className="flex items-center gap-1"><Truck className="h-3 w-3" />Domestic</span></Badge>}
                  {(g as any).vehicle_no && <p className="text-[10px] text-slate-400">{(g as any).vehicle_no}</p>}
                  {(g as any).lr_no && <p className="font-mono text-[10px] text-slate-400">LR: {(g as any).lr_no}</p>}
                </Td>
                <Td><span className="text-xs text-slate-500">{g.receipt_date}</span></Td>
                <Td><span className="font-mono text-xs text-slate-600">{g.invoice_no ?? '—'}</span></Td>
                <Td><span className="text-xs text-slate-500">{(g as any).warehouse_name ?? g.warehouse_id}</span></Td>
                <Td><span className="text-sm">{g.items.length}</span></Td>
                <Td align="right"><span className="data-value">{formatCurrency(g.total_received_value)}</span></Td>
                <Td><Badge variant={QC_VARIANT[g.inspection_status]}>{g.inspection_status}</Badge></Td>
                <Td><Badge variant={STATUS_VARIANT[g.status]}>{g.status.replace(/_/g,' ')}</Badge></Td>
                <Td>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setViewGRN(g)}><Eye className="h-3.5 w-3.5" /></Button>
                    {g.inspection_status === 'pending' && (
                      <Button variant="ghost" size="icon" title="Record QC" onClick={() => { setQcModal(g); setQcForm({ result: 'passed', notes: '' }) }}>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      </Button>
                    )}
                    {g.status === 'accepted' && g.inspection_status !== 'pending' && (
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => handlePost(g.id)}>Post</Button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      {/* View GRN Modal */}
      {viewGRN && (
        <Modal open={!!viewGRN} onClose={() => setViewGRN(null)} title={`${viewGRN.grn_no} — ${viewGRN.vendor_name}`} size="lg"
          footer={<>
            {viewGRN.inspection_status === 'pending' && <Button size="sm" onClick={() => { setQcModal(viewGRN); setViewGRN(null); setQcForm({ result:'passed', notes:'' }) }}>Record QC</Button>}
            {viewGRN.status === 'accepted' && <Button size="sm" loading={saving} onClick={() => handlePost(viewGRN.id)}>Post to Stock</Button>}
            <Button variant="ghost" size="sm" onClick={() => setViewGRN(null)}>Close</Button>
          </>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              {[['Vendor', viewGRN.vendor_name], ['Receipt Date', viewGRN.receipt_date], ['Invoice', viewGRN.invoice_no??'—'], ['PO Ref', viewGRN.po_no??'—'], ['QC Status', viewGRN.inspection_status], ['Status', viewGRN.status]].map(([l,v]) => (
                <div key={l}><p className="text-xs text-slate-400">{l}</p><p className="font-semibold text-slate-800">{v}</p></div>
              ))}
            </div>
            <Divider label="Items Received" />
            <Table>
              <Thead><tr><Th>Item</Th><Th align="right">PO Qty</Th><Th align="right">Received</Th><Th align="right">Accepted</Th><Th align="right">Rejected</Th><Th>Lot / Batch</Th><Th align="right">Amount</Th></tr></Thead>
              <Tbody>
                {viewGRN.items.map((item: any, i: number) => (
                  <Tr key={i}>
                    <Td><span className="font-medium">{item.name}</span></Td>
                    <Td align="right">{item.po_qty}</Td>
                    <Td align="right">{item.received_qty}</Td>
                    <Td align="right"><span className="text-emerald-600 font-semibold">{item.accepted_qty}</span></Td>
                    <Td align="right"><span className={item.rejected_qty > 0 ? 'text-red-600 font-semibold' : 'text-slate-300'}>{item.rejected_qty > 0 ? item.rejected_qty : '—'}</span></Td>
                    <Td><span className="font-mono text-xs text-slate-500">{item.lot_no ?? item.batch_no ?? '—'}</span></Td>
                    <Td align="right"><span className="font-semibold">{formatCurrency(item.amount)}</span></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <div className="flex justify-end text-sm font-bold text-slate-800 gap-2">
              <span>Total Received Value:</span>
              <span className="text-blue-700">{formatCurrency(viewGRN.total_received_value)}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* QC Modal */}
      {qcModal && (
        <Modal open={!!qcModal} onClose={() => setQcModal(null)} title={`Quality Inspection — ${qcModal.grn_no}`} size="md"
          footer={<><Button variant="ghost" size="sm" onClick={() => setQcModal(null)}>Cancel</Button><Button size="sm" loading={saving} onClick={handleQC}>Submit QC Result</Button></>}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="font-semibold text-slate-700">{qcModal.vendor_name}</p>
              <p className="text-slate-500 text-xs">{qcModal.items.length} line item(s) · {formatCurrency(qcModal.total_received_value)}</p>
            </div>
            <Select label="QC Result *" value={qcForm.result} onChange={e => setQcForm(f => ({ ...f, result: (e.target as any).value }))}
              options={[{ label: '✅ Passed — All items accepted', value: 'passed' }, { label: '⚠ Conditional — Accepted with remarks', value: 'conditional' }, { label: '❌ Failed — Goods rejected', value: 'failed' }]}
            />
            <Textarea label="QC Notes / Observations" rows={3} value={qcForm.notes} onChange={e => setQcForm(f => ({ ...f, notes: e.target.value }))} placeholder="Describe inspection findings, defects, or conditional acceptance criteria..." />
          </div>
        </Modal>
      )}

      {/* New GRN Modal */}
      <Modal open={newGRN} onClose={() => setNewGRN(false)} title="Create Goods Receipt Note" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewGRN(false)}>Cancel</Button><Button size="sm" loading={saving} onClick={handleCreate}>Create GRN</Button></>}
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <Divider label="Receipt Details" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="PO Reference" value={header.po_no} onChange={e => setHeader(h => ({ ...h, po_no: e.target.value }))} placeholder="PO-2026-XXXX" />
            <Input label="Vendor Name *" required value={header.vendor_name} onChange={e => setHeader(h => ({ ...h, vendor_name: e.target.value }))} />
            <Input label="Receipt Date *" type="date" required value={header.receipt_date} onChange={e => setHeader(h => ({ ...h, receipt_date: e.target.value }))} />
            <Input label="Warehouse ID *" required value={header.warehouse_id} onChange={e => setHeader(h => ({ ...h, warehouse_id: e.target.value }))} placeholder="WH-01" />
            <Input label="Vehicle / Truck No" value={header.vehicle_no} onChange={e => setHeader(h => ({ ...h, vehicle_no: e.target.value }))} placeholder="For road transport" />
            <Input label="LR / AWB No" value={header.lr_no} onChange={e => setHeader(h => ({ ...h, lr_no: e.target.value }))} />
            <Input label="BL No" value={header.bl_no} onChange={e => setHeader(h => ({ ...h, bl_no: e.target.value }))} placeholder="For import shipments" />
            <Input label="Vendor Invoice No" value={header.invoice_no} onChange={e => setHeader(h => ({ ...h, invoice_no: e.target.value }))} />
            <Input label="Invoice Date" type="date" value={header.invoice_date} onChange={e => setHeader(h => ({ ...h, invoice_date: e.target.value }))} />
            <Input label="Invoice Amount (₹)" type="number" value={header.invoice_amount} onChange={e => setHeader(h => ({ ...h, invoice_amount: e.target.value }))} />
          </div>
          <Divider label="Items Received" />
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={idx} className="border border-slate-100 rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5"><Input label={idx===0?'Item / Description':''} value={line.name} onChange={e => { const l=[...lines]; l[idx]={...l[idx],name:e.target.value}; setLines(l) }} placeholder="Item name" /></div>
                  <div className="col-span-2"><Input label={idx===0?'Received Qty':''} type="number" value={line.received_qty} onChange={e => { const l=[...lines]; l[idx]={...l[idx],received_qty:e.target.value,accepted_qty:e.target.value,amount:String(Number(e.target.value)*Number(l[idx].rate))}; setLines(l) }} /></div>
                  <div className="col-span-1"><Select label={idx===0?'UOM':''} value={line.uom} onChange={e => { const l=[...lines]; l[idx]={...l[idx],uom:(e.target as any).value}; setLines(l) }} options={['PCS','KG','MTR','LTR','BTL','BOX'].map(u=>({label:u,value:u}))} /></div>
                  <div className="col-span-2"><Input label={idx===0?'Rate (₹)':''} type="number" value={line.rate} onChange={e => { const l=[...lines]; l[idx]={...l[idx],rate:e.target.value,amount:String(Number(l[idx].received_qty)*Number(e.target.value))}; setLines(l) }} /></div>
                  <div className="col-span-1"><Input label={idx===0?'GST%':''} type="number" value={line.gst_rate} onChange={e => { const l=[...lines]; l[idx]={...l[idx],gst_rate:e.target.value}; setLines(l) }} /></div>
                  <div className="col-span-1 flex items-end pb-1">{lines.length>1 && <Button variant="ghost" size="icon" onClick={() => setLines(l => l.filter((_,i)=>i!==idx))}><XCircle className="h-3.5 w-3.5 text-slate-400" /></Button>}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input label="Lot No" value={line.lot_no} onChange={e => { const l=[...lines]; l[idx]={...l[idx],lot_no:e.target.value}; setLines(l) }} placeholder="If lot-controlled" />
                  <Input label="Batch No" value={line.batch_no} onChange={e => { const l=[...lines]; l[idx]={...l[idx],batch_no:e.target.value}; setLines(l) }} placeholder="If batch-controlled" />
                  <Input label="Expiry Date" type="date" value={line.expiry_date} onChange={e => { const l=[...lines]; l[idx]={...l[idx],expiry_date:e.target.value}; setLines(l) }} />
                </div>
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
