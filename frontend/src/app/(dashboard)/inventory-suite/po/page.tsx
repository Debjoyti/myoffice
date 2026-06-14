// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { ShoppingCart, Plus, Download, Eye, Send, Ship, RefreshCw, XCircle, FlaskConical } from 'lucide-react'

const STATUS_VARIANT: Record<string,any> = {
  draft:'neutral', approved:'info', sent_to_vendor:'info', acknowledged:'info',
  partially_received:'warning', received:'success', closed:'success', cancelled:'danger',
}
const EMPTY_LINE = { name:'', qty:'', uom:'PCS', rate:'', gst_rate:'18', amount:'', hsn_code:'' }

const MOCK_POS = [
  { id:'1', po_no:'PO-2026-0031', pr_no:'PR-2026-0012', vendor_name:'ABC Steel Traders', vendor_gstin:'27AABCA5555D1Z1', po_type:'domestic', currency:'INR', exchange_rate:1, po_date:'2026-05-28', delivery_date:'2026-06-05', items:[{name:'Steel Sheet 2mm',qty:500,uom:'KG',rate:85,gst_rate:18,amount:42500},{name:'Cutting Discs',qty:50,uom:'PCS',rate:180,gst_rate:18,amount:9000}], subtotal_inr:51500, tax_amount:9270, freight_charges:2500, total_amount:63270, status:'approved', approved_at:'2026-05-28' },
  { id:'2', po_no:'PO-2026-0030', pr_no:'PR-2026-0011', vendor_name:'Shenzhen Tech Electronics Co. Ltd', vendor_gstin:null, po_type:'import', currency:'USD', exchange_rate:84.25, po_date:'2026-05-25', delivery_date:'2026-06-25', items:[{name:'PCB Assembly Board',qty:500,uom:'PCS',rate:14.8,gst_rate:18,amount:7400}], subtotal_inr:623450, tax_amount:112221, freight_charges:45000, total_amount:780671, status:'sent_to_vendor', approved_at:'2026-05-25' },
  { id:'3', po_no:'PO-2026-0029', pr_no:null, vendor_name:'Delhi Paper Mart', vendor_gstin:'07AABCD4321G1Z3', po_type:'domestic', currency:'INR', exchange_rate:1, po_date:'2026-05-20', delivery_date:'2026-05-28', items:[{name:'Packaging Tape 48mm',qty:200,uom:'PCS',rate:85,gst_rate:12,amount:17000}], subtotal_inr:17000, tax_amount:2040, freight_charges:500, total_amount:19540, status:'partially_received', approved_at:'2026-05-20' },
]

export default function POPage() {
  const [pos, setPOs] = useState(MOCK_POS)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [newPO, setNewPO] = useState(false)
  const [viewPO, setViewPO] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [lines, setLines] = useState([{ ...EMPTY_LINE }])
  const [header, setHeader] = useState({ vendor_name:'', vendor_gstin:'', po_type:'domestic', currency:'INR', exchange_rate:'1', delivery_date:'', delivery_address:'', incoterms:'FOB', payment_terms:'Net 30', notes:'' })

  const fetchPOs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/inventory/po')
      if (res.ok) {
        const data = await res.json()
        if (data.purchase_orders?.length > 0) { setPOs(data.purchase_orders); setIsPreview(false) }
      }
    } catch { /* keep mock */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPOs() }, [fetchPOs])

  const filtered = pos.filter(p => {
    const matchSearch = !search || p.po_no.toLowerCase().includes(search.toLowerCase()) || p.vendor_name.toLowerCase().includes(search.toLowerCase())
    const matchTab = tab === 'all' ? true : tab === 'import' ? p.po_type === 'import' : tab === 'open' ? !['received','closed','cancelled'].includes(p.status) : p.status === tab
    return matchSearch && matchTab
  })

  const handleAction = async (po_id: string, action: string) => {
    setSaving(true)
    try {
      await fetch('/api/v1/inventory/po', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, po_id }) })
      fetchPOs(); setViewPO(null)
    } finally { setSaving(false) }
  }

  const handleCreate = async (submit: boolean) => {
    setSaving(true)
    try {
      const items = lines.filter(l => l.name && l.qty && l.rate).map(l => ({
        name: l.name, qty: Number(l.qty), uom: l.uom, rate: Number(l.rate),
        gst_rate: Number(l.gst_rate), amount: Number(l.amount) || Number(l.qty)*Number(l.rate), hsn_code: l.hsn_code,
      }))
      const res = await fetch('/api/v1/inventory/po', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...header, items, exchange_rate: Number(header.exchange_rate)||1, submit }),
      })
      if (res.ok) { setNewPO(false); setLines([{ ...EMPTY_LINE }]); fetchPOs() }
    } finally { setSaving(false) }
  }

  const openCount = pos.filter(p => !['received','closed','cancelled'].includes(p.status)).length
  const openValue = pos.filter(p => !['received','closed','cancelled'].includes(p.status)).reduce((s, p) => s + p.total_amount, 0)
  const importCount = pos.filter(p => p.po_type === 'import').length

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Purchase Orders"
        description="Domestic and import POs — full lifecycle from draft to receipt"
        actions={<>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewPO(true)}>New PO</Button>
        </>}
      />
      {isPreview && <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700"><FlaskConical className="h-3.5 w-3.5" /><strong>Preview mode</strong></div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Open POs" value={openCount.toString()} icon={<ShoppingCart className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Open PO Value" value={formatCurrency(openValue)} icon={<ShoppingCart className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Import POs" value={importCount.toString()} icon={<Ship className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="Total POs" value={pos.length.toString()} icon={<ShoppingCart className="h-4 w-4" />} />
      </div>

      <TabBar tabs={[
        { id:'all', label:'All', count: pos.length },
        { id:'open', label:'Open', count: openCount },
        { id:'import', label:'🚢 Import', count: importCount },
        { id:'partially_received', label:'Partial', count: pos.filter(p => p.status === 'partially_received').length },
      ]} active={tab} onChange={setTab} />

      <Card padding="none">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
          <SearchInput placeholder="Search PO no, vendor..." value={search} onChange={setSearch} className="w-64" />
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchPOs} className="ml-auto">Refresh</Button>
        </div>
        <Table>
          <Thead><tr><Th>PO No</Th><Th>Vendor</Th><Th>Type</Th><Th>PR Ref</Th><Th>PO Date</Th><Th>Delivery</Th><Th>Items</Th><Th align="right">Total</Th><Th>Status</Th><Th></Th></tr></Thead>
          <Tbody>
            {loading ? <Tr><td colSpan={10} className="py-10 text-center text-slate-400 text-sm">Loading…</td></Tr>
            : filtered.map(po => (
              <Tr key={po.id}>
                <Td><span className="font-mono text-xs font-bold text-blue-600">{po.po_no}</span></Td>
                <Td>
                  <p className="font-medium text-slate-800">{po.vendor_name}</p>
                  {po.vendor_gstin && <p className="font-mono text-[10px] text-slate-400">{po.vendor_gstin}</p>}
                </Td>
                <Td>
                  <Badge variant={po.po_type === 'import' ? 'info' : 'neutral'}>
                    <span className="flex items-center gap-1">{po.po_type === 'import' && <Ship className="h-3 w-3" />}{po.po_type}</span>
                  </Badge>
                  {po.currency !== 'INR' && <span className="text-[10px] text-slate-400 block">{po.currency} @ {po.exchange_rate}</span>}
                </Td>
                <Td><span className="font-mono text-xs text-slate-500">{po.pr_no ?? '—'}</span></Td>
                <Td><span className="text-xs text-slate-500">{po.po_date}</span></Td>
                <Td><span className="text-xs text-slate-500">{po.delivery_date ?? '—'}</span></Td>
                <Td><span className="text-sm">{po.items.length}</span></Td>
                <Td align="right"><span className="data-value font-bold">{formatCurrency(po.total_amount)}</span></Td>
                <Td><Badge variant={STATUS_VARIANT[po.status]}>{po.status.replace(/_/g,' ')}</Badge></Td>
                <Td>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setViewPO(po)}><Eye className="h-3.5 w-3.5" /></Button>
                    {po.status === 'approved' && <Button variant="ghost" size="icon" title="Send to Vendor" onClick={() => handleAction(po.id,'send_vendor')}><Send className="h-3.5 w-3.5 text-blue-600" /></Button>}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      {viewPO && (
        <Modal open={!!viewPO} onClose={() => setViewPO(null)} title={`${viewPO.po_no} — ${viewPO.vendor_name}`} size="lg"
          footer={<>
            {viewPO.status === 'draft' && <Button size="sm" loading={saving} onClick={() => handleAction(viewPO.id, 'approve')}>Approve PO</Button>}
            {viewPO.status === 'approved' && <Button size="sm" loading={saving} onClick={() => handleAction(viewPO.id, 'send_vendor')} leftIcon={<Send className="h-3.5 w-3.5" />}>Send to Vendor</Button>}
            {!['received','closed','cancelled'].includes(viewPO.status) && <Button variant="outline" size="sm" onClick={() => handleAction(viewPO.id, 'cancel')} className="text-red-600 border-red-300">Cancel</Button>}
            <Button variant="ghost" size="sm" onClick={() => setViewPO(null)}>Close</Button>
          </>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              {[['Vendor', viewPO.vendor_name], ['Type', viewPO.po_type], ['Currency', `${viewPO.currency} @ ${viewPO.exchange_rate}`], ['PO Date', viewPO.po_date], ['Delivery', viewPO.delivery_date??'—'], ['Status', viewPO.status]].map(([l,v]) => (
                <div key={l}><p className="text-xs text-slate-400">{l}</p><p className="font-semibold text-slate-800">{v}</p></div>
              ))}
            </div>
            <Divider label="Line Items" />
            <Table>
              <Thead><tr><Th>Item</Th><Th align="right">Qty</Th><Th>UOM</Th><Th align="right">Rate</Th><Th>GST</Th><Th align="right">Amount</Th></tr></Thead>
              <Tbody>
                {viewPO.items.map((item: any, i: number) => (
                  <Tr key={i}>
                    <Td>{item.name}</Td>
                    <Td align="right">{item.qty}</Td>
                    <Td>{item.uom}</Td>
                    <Td align="right">{formatCurrency(item.rate)}</Td>
                    <Td>{item.gst_rate}%</Td>
                    <Td align="right"><span className="font-semibold">{formatCurrency(item.amount)}</span></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <div className="space-y-1 text-sm text-right">
              <p>Subtotal: <strong>{formatCurrency(viewPO.subtotal_inr)}</strong></p>
              <p>GST: <strong>{formatCurrency(viewPO.tax_amount)}</strong></p>
              <p>Freight: <strong>{formatCurrency(viewPO.freight_charges)}</strong></p>
              <p className="text-base font-bold text-blue-700">Total: {formatCurrency(viewPO.total_amount)}</p>
            </div>
          </div>
        </Modal>
      )}

      <Modal open={newPO} onClose={() => setNewPO(false)} title="New Purchase Order" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewPO(false)}>Cancel</Button><Button variant="outline" size="sm" loading={saving} onClick={() => handleCreate(false)}>Save Draft</Button><Button size="sm" loading={saving} onClick={() => handleCreate(true)}>Approve &amp; Create</Button></>}
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <Divider label="Vendor & PO Details" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Vendor Name *" required value={header.vendor_name} onChange={e => setHeader(h => ({ ...h, vendor_name: e.target.value }))} />
            <Input label="Vendor GSTIN" value={header.vendor_gstin} onChange={e => setHeader(h => ({ ...h, vendor_gstin: e.target.value }))} placeholder="Leave blank for import" />
            <Select label="PO Type" value={header.po_type} onChange={e => setHeader(h => ({ ...h, po_type: (e.target as any).value, currency: (e.target as any).value === 'import' ? 'USD' : 'INR' }))} options={[{label:'Domestic',value:'domestic'},{label:'Import (Foreign)',value:'import'}]} />
            <Select label="Currency" value={header.currency} onChange={e => setHeader(h => ({ ...h, currency: (e.target as any).value }))} options={['INR','USD','EUR','GBP','CNY','JPY','SGD'].map(c => ({ label:c, value:c }))} />
            {header.po_type === 'import' && <Input label="Exchange Rate (₹)" type="number" value={header.exchange_rate} onChange={e => setHeader(h => ({ ...h, exchange_rate: e.target.value }))} />}
            {header.po_type === 'import' && <Select label="Incoterms" value={header.incoterms} onChange={e => setHeader(h => ({ ...h, incoterms: (e.target as any).value }))} options={['EXW','FCA','FOB','CIF','CFR','DAP','DDP'].map(i => ({ label:i, value:i }))} />}
            <Input label="Expected Delivery Date" type="date" value={header.delivery_date} onChange={e => setHeader(h => ({ ...h, delivery_date: e.target.value }))} />
            <Select label="Payment Terms" value={header.payment_terms} onChange={e => setHeader(h => ({ ...h, payment_terms: (e.target as any).value }))} options={['Advance','Net 15','Net 30','Net 45','Net 60','LC at Sight','LC 90 days'].map(p => ({ label:p, value:p }))} />
          </div>
          <Divider label="Line Items" />
          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3"><Input label={idx===0?'Item':''}  value={line.name} onChange={e => { const l=[...lines]; l[idx]={...l[idx],name:e.target.value}; setLines(l) }} placeholder="Description" /></div>
                <div className="col-span-1"><Input label={idx===0?'HSN':''} value={line.hsn_code} onChange={e => { const l=[...lines]; l[idx]={...l[idx],hsn_code:e.target.value}; setLines(l) }} placeholder="HSN" /></div>
                <div className="col-span-2"><Input label={idx===0?'Qty':''} type="number" value={line.qty} onChange={e => { const l=[...lines]; l[idx]={...l[idx],qty:e.target.value,amount:String(Number(e.target.value)*Number(l[idx].rate))}; setLines(l) }} /></div>
                <div className="col-span-1"><Select label={idx===0?'UOM':''} value={line.uom} onChange={e => { const l=[...lines]; l[idx]={...l[idx],uom:(e.target as any).value}; setLines(l) }} options={['PCS','KG','MTR','LTR','BOX','SET'].map(u=>({label:u,value:u}))} /></div>
                <div className="col-span-2"><Input label={idx===0?'Rate':''} type="number" value={line.rate} onChange={e => { const l=[...lines]; l[idx]={...l[idx],rate:e.target.value,amount:String(Number(l[idx].qty)*Number(e.target.value))}; setLines(l) }} /></div>
                <div className="col-span-1"><Select label={idx===0?'GST%':''} value={line.gst_rate} onChange={e => { const l=[...lines]; l[idx]={...l[idx],gst_rate:(e.target as any).value}; setLines(l) }} options={['0','5','12','18','28'].map(r=>({label:`${r}%`,value:r}))} /></div>
                <div className="col-span-1"><Input label={idx===0?'Amt':''} type="number" value={line.amount} readOnly className="bg-slate-50 text-xs" /></div>
                <div className="col-span-1 flex items-end pb-1">{lines.length>1 && <Button variant="ghost" size="icon" onClick={() => setLines(l => l.filter((_,i) => i!==idx))}><XCircle className="h-3.5 w-3.5 text-slate-400" /></Button>}</div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setLines(l => [...l, { ...EMPTY_LINE }])}>Add Line</Button>
          <div className="flex justify-end text-sm font-bold text-slate-700 gap-2 pt-2 border-t border-slate-100">
            <span>Subtotal:</span><span>{formatCurrency(lines.reduce((s,l) => s+(Number(l.amount)||0), 0))}</span>
          </div>
          <Textarea label="Notes / Terms" rows={2} value={header.notes} onChange={e => setHeader(h => ({ ...h, notes: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
