// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { TrendingDown, Plus, Download, Eye, RefreshCw, XCircle, FlaskConical } from 'lucide-react'

const STATUS_VARIANT: Record<string, any> = { draft: 'neutral', approved: 'info', posted: 'success', cancelled: 'neutral' }
const ISSUE_TYPE_LABEL: Record<string, string> = {
  production: 'Production', sales_delivery: 'Sales Delivery', project: 'Project',
  cost_center: 'Cost Center', sample: 'Sample', scrap: 'Scrap', return_to_vendor: 'Return to Vendor',
}

const MOCK_GIS = [
  { id: '1', gi_no: 'GI-2026-0018', issue_type: 'production', reference_no: 'WO-2026-012', issue_date: '2026-05-30', from_warehouse: 'WH-01', department: 'Production', items: [{ name: 'PCB Assembly Board', qty: 50, uom: 'PCS', rate: 1250, amount: 62500 }], total_value: 62500, status: 'posted' },
  { id: '2', gi_no: 'GI-2026-0017', issue_type: 'production', reference_no: 'WO-2026-009', issue_date: '2026-05-27', from_warehouse: 'WH-01', department: 'Production', items: [{ name: 'Capacitor 100µF', qty: 500, uom: 'PCS', rate: 8, amount: 4000 }], total_value: 4000, status: 'posted' },
  { id: '3', gi_no: 'GI-2026-0016', issue_type: 'sales_delivery', reference_no: 'SO-2026-030', issue_date: '2026-05-28', from_warehouse: 'WH-01', department: 'Sales', items: [{ name: 'Finished Assembly A1', qty: 10, uom: 'PCS', rate: 4800, amount: 48000 }], total_value: 48000, status: 'posted' },
  { id: '4', gi_no: 'GI-2026-0015', issue_type: 'cost_center', reference_no: 'ADM-2026-05', issue_date: '2026-05-25', from_warehouse: 'WH-03', department: 'Admin', items: [{ name: 'Flux Solution 500ml', qty: 5, uom: 'BTL', rate: 320, amount: 1600 }], total_value: 1600, status: 'posted' },
]

const EMPTY_LINE = { name: '', qty: '', uom: 'PCS', rate: '', amount: '', lot_no: '', batch_no: '' }

export default function GIPage() {
  const [gis, setGIs] = useState(MOCK_GIS)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(true)
  const [tab, setTab] = useState('all')
  const [newGI, setNewGI] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lines, setLines] = useState([{ ...EMPTY_LINE }])
  const [header, setHeader] = useState({
    issue_type: 'production', reference_no: '', issue_date: new Date().toISOString().split('T')[0],
    from_warehouse_id: '', department: '', issued_to: '', notes: '',
  })

  const fetchGIs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/inventory/gi')
      if (res.ok) {
        const data = await res.json()
        if (data.goods_issues?.length > 0) { setGIs(data.goods_issues); setIsPreview(false) }
      }
    } catch { /* keep mock */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchGIs() }, [fetchGIs])

  const posted = gis.filter(g => g.status === 'posted').length
  const totalValue = gis.reduce((s, g) => s + g.total_value, 0)

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Goods Issue (GI)"
        description="Issue stock from warehouse for production, sales delivery, projects, and cost centers"
        actions={<>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewGI(true)}>New GI</Button>
        </>}
      />

      {isPreview && <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700"><FlaskConical className="h-3.5 w-3.5" /><strong>Preview mode</strong></div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total GIs" value={gis.length.toString()} icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
        <StatCard label="Posted" value={posted.toString()} icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Total Issued Value" value={formatCurrency(totalValue)} icon={<TrendingDown className="h-4 w-4" />} />
        <StatCard label="For Production" value={gis.filter(g => g.issue_type === 'production').length.toString()} icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      <Card padding="none">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Goods Issue Register</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchGIs}>Refresh</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewGI(true)}>New GI</Button>
          </div>
        </div>
        <Table>
          <Thead><tr><Th>GI No</Th><Th>Issue Type</Th><Th>Reference</Th><Th>Date</Th><Th>From Warehouse</Th><Th>Dept.</Th><Th>Items</Th><Th align="right">Value</Th><Th>Status</Th><Th></Th></tr></Thead>
          <Tbody>
            {loading ? <Tr><td colSpan={10} className="py-10 text-center text-slate-400 text-sm">Loading…</td></Tr>
            : gis.map(g => (
              <Tr key={g.id}>
                <Td><span className="font-mono text-xs font-bold text-blue-600">{g.gi_no}</span></Td>
                <Td><Badge variant="neutral">{ISSUE_TYPE_LABEL[g.issue_type] ?? g.issue_type}</Badge></Td>
                <Td><span className="font-mono text-xs text-slate-500">{g.reference_no ?? '—'}</span></Td>
                <Td><span className="text-xs text-slate-500">{g.issue_date}</span></Td>
                <Td><span className="text-xs text-slate-500">{g.from_warehouse}</span></Td>
                <Td><span className="text-sm text-slate-600">{g.department ?? '—'}</span></Td>
                <Td><span className="text-sm">{g.items.length}</span></Td>
                <Td align="right"><span className="data-value font-semibold text-red-600">{formatCurrency(g.total_value)}</span></Td>
                <Td><Badge variant={STATUS_VARIANT[g.status]}>{g.status}</Badge></Td>
                <Td><Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      <Modal open={newGI} onClose={() => setNewGI(false)} title="New Goods Issue" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewGI(false)}>Cancel</Button><Button variant="outline" size="sm" loading={saving}>Save Draft</Button><Button size="sm" loading={saving}>Post GI</Button></>}
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <Divider label="Issue Details" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Issue Type *" value={header.issue_type} onChange={e => setHeader(h => ({ ...h, issue_type: (e.target as any).value }))}
              options={Object.entries(ISSUE_TYPE_LABEL).map(([v, l]) => ({ label: l, value: v }))} />
            <Input label="Reference No" value={header.reference_no} onChange={e => setHeader(h => ({ ...h, reference_no: e.target.value }))} placeholder="WO / SO / Project No" />
            <Input label="Issue Date *" type="date" value={header.issue_date} onChange={e => setHeader(h => ({ ...h, issue_date: e.target.value }))} />
            <Input label="From Warehouse *" required value={header.from_warehouse_id} onChange={e => setHeader(h => ({ ...h, from_warehouse_id: e.target.value }))} placeholder="WH-01" />
            <Input label="Department" value={header.department} onChange={e => setHeader(h => ({ ...h, department: e.target.value }))} />
            <Input label="Issued To" value={header.issued_to} onChange={e => setHeader(h => ({ ...h, issued_to: e.target.value }))} placeholder="Person / cost center" />
          </div>
          <Divider label="Items to Issue" />
          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4"><Input label={idx===0?'Item':''}  value={line.name} onChange={e => { const l=[...lines]; l[idx]={...l[idx],name:e.target.value}; setLines(l) }} placeholder="Item name" /></div>
                <div className="col-span-2"><Input label={idx===0?'Qty':''} type="number" value={line.qty} onChange={e => { const l=[...lines]; l[idx]={...l[idx],qty:e.target.value,amount:String(Number(e.target.value)*Number(l[idx].rate))}; setLines(l) }} /></div>
                <div className="col-span-1"><Select label={idx===0?'UOM':''} value={line.uom} onChange={e => { const l=[...lines]; l[idx]={...l[idx],uom:(e.target as any).value}; setLines(l) }} options={['PCS','KG','MTR','LTR','BTL','BOX'].map(u=>({label:u,value:u}))} /></div>
                <div className="col-span-2"><Input label={idx===0?'Lot No':''} value={line.lot_no} onChange={e => { const l=[...lines]; l[idx]={...l[idx],lot_no:e.target.value}; setLines(l) }} /></div>
                <div className="col-span-2"><Input label={idx===0?'Batch No':''} value={line.batch_no} onChange={e => { const l=[...lines]; l[idx]={...l[idx],batch_no:e.target.value}; setLines(l) }} /></div>
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
