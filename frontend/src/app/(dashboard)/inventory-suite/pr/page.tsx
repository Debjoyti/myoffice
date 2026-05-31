'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { FileText, Plus, Download, Eye, CheckCircle2, XCircle, Send, RefreshCw, AlertTriangle, FlaskConical } from 'lucide-react'

const STATUS_VARIANT: Record<string,any> = {
  draft:'neutral', submitted:'info', under_review:'warning', approved:'success',
  partially_ordered:'warning', fully_ordered:'success', rejected:'danger', cancelled:'neutral',
}
const PRIORITY_COLOR: Record<string,string> = { urgent:'text-red-600 bg-red-50', high:'text-amber-600 bg-amber-50', normal:'text-blue-600 bg-blue-50', low:'text-slate-500 bg-slate-100' }

const MOCK_PRS = [
  { id:'1', pr_no:'PR-2026-0012', department:'Production', requested_by:'Rakesh Sharma', request_date:'2026-05-28', required_date:'2026-06-05', priority:'urgent', request_type:'domestic', items:[{name:'Steel Sheet 2mm',qty:500,uom:'KG',estimated_rate:85,estimated_amount:42500},{name:'Cutting Discs',qty:50,uom:'PCS',estimated_rate:180,estimated_amount:9000}], total_estimated_value:51500, status:'submitted', remarks:'Production line at risk if not received by June 5' },
  { id:'2', pr_no:'PR-2026-0011', department:'Maintenance', requested_by:'Suresh Reddy', request_date:'2026-05-25', required_date:'2026-06-15', priority:'high', request_type:'import', items:[{name:'Bearing 6204 SKF (Germany)',qty:20,uom:'PCS',estimated_rate:420,estimated_amount:8400}], total_estimated_value:8400, status:'approved', remarks:'Imported only — SKF brand specified' },
  { id:'3', pr_no:'PR-2026-0010', department:'IT', requested_by:'Priya Patel', request_date:'2026-05-22', required_date:'2026-06-10', priority:'normal', request_type:'domestic', items:[{name:'Laptop Dell XPS 15',qty:2,uom:'PCS',estimated_rate:120000,estimated_amount:240000}], total_estimated_value:240000, status:'approved', remarks:'' },
  { id:'4', pr_no:'PR-2026-0009', department:'R&D', requested_by:'Amit Desai', request_date:'2026-05-20', required_date:'2026-05-31', priority:'urgent', request_type:'import', items:[{name:'Flux Solution Heraeus (Germany)',qty:50,uom:'BTL',estimated_rate:450,estimated_amount:22500}], total_estimated_value:22500, status:'partially_ordered', remarks:'Imported item — longer lead time' },
  { id:'5', pr_no:'PR-2026-0008', department:'Admin', requested_by:'Neha Singh', request_date:'2026-05-18', required_date:'2026-05-28', priority:'low', request_type:'domestic', items:[{name:'Office Stationery Pack',qty:10,uom:'SET',estimated_rate:1500,estimated_amount:15000}], total_estimated_value:15000, status:'fully_ordered', remarks:'' },
]

const EMPTY_LINE = { name:'', qty:'', uom:'PCS', estimated_rate:'', estimated_amount:'', remarks:'' }

export default function PRPage() {
  const [prs, setPRs] = useState(MOCK_PRS)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [newPR, setNewPR] = useState(false)
  const [viewPR, setViewPR] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [lines, setLines] = useState([{ ...EMPTY_LINE }])
  const [header, setHeader] = useState({ department:'', required_date:'', priority:'normal', request_type:'domestic', remarks:'', justification:'' })

  const fetchPRs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/inventory/pr')
      if (res.ok) {
        const data = await res.json()
        if (data.purchase_requests?.length > 0) { setPRs(data.purchase_requests); setIsPreview(false) }
      }
    } catch { /* keep mock */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPRs() }, [fetchPRs])

  const filtered = prs.filter(pr => {
    const matchSearch = !search || pr.pr_no.toLowerCase().includes(search.toLowerCase()) || pr.department.toLowerCase().includes(search.toLowerCase())
    const matchTab = tab === 'all' ? true : tab === 'pending' ? ['submitted','under_review'].includes(pr.status) : pr.status === tab
    return matchSearch && matchTab
  })

  const handleAction = async (pr_id: string, action: string, reason?: string) => {
    setSaving(true)
    try {
      await fetch('/api/v1/inventory/pr', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, pr_id, reason }) })
      fetchPRs()
      setViewPR(null)
    } finally { setSaving(false) }
  }

  const handleCreate = async (submit: boolean) => {
    setSaving(true)
    try {
      const items = lines.filter(l => l.name && l.qty).map(l => ({
        name: l.name, qty: Number(l.qty), uom: l.uom,
        estimated_rate: Number(l.estimated_rate) || 0,
        estimated_amount: Number(l.estimated_amount) || Number(l.qty) * Number(l.estimated_rate),
        remarks: l.remarks,
      }))
      const res = await fetch('/api/v1/inventory/pr', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ ...header, items, submit }),
      })
      if (res.ok) { setNewPR(false); setLines([{ ...EMPTY_LINE }]); fetchPRs() }
    } finally { setSaving(false) }
  }

  const pending = prs.filter(p => ['submitted','under_review'].includes(p.status)).length
  const approved = prs.filter(p => p.status === 'approved').length
  const importPRs = prs.filter(p => p.request_type === 'import').length

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Purchase Requests"
        description="Initiate, approve, and track material/service requirements"
        actions={<>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewPR(true)}>New PR</Button>
        </>}
      />
      {isPreview && <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700"><FlaskConical className="h-3.5 w-3.5" /><strong>Preview mode</strong></div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Pending Approval" value={pending.toString()} icon={<FileText className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" delta={pending > 0 ? { value: 'Action needed', positive: false } : undefined} />
        <StatCard label="Approved (Unconverted)" value={approved.toString()} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Import PRs" value={importPRs.toString()} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="Total This Month" value={prs.length.toString()} icon={<FileText className="h-4 w-4" />} />
      </div>

      <TabBar tabs={[
        { id:'all', label:'All', count: prs.length },
        { id:'pending', label:'⏳ Pending', count: pending },
        { id:'approved', label:'✅ Approved', count: approved },
        { id:'rejected', label:'❌ Rejected', count: prs.filter(p => p.status === 'rejected').length },
      ]} active={tab} onChange={setTab} />

      <Card padding="none">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
          <SearchInput placeholder="Search PR no, department..." value={search} onChange={setSearch} className="w-64" />
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchPRs} className="ml-auto">Refresh</Button>
        </div>
        <Table>
          <Thead><tr><Th>PR No</Th><Th>Department</Th><Th>Type</Th><Th>Priority</Th><Th>Required By</Th><Th>Items</Th><Th align="right">Est. Value</Th><Th>Status</Th><Th></Th></tr></Thead>
          <Tbody>
            {loading ? <Tr><td colSpan={9} className="py-10 text-center text-slate-400 text-sm">Loading…</td></Tr>
            : filtered.map(pr => (
              <Tr key={pr.id}>
                <Td><span className="font-mono text-xs font-bold text-blue-600">{pr.pr_no}</span></Td>
                <Td><span className="font-medium text-slate-800">{pr.department}</span><br/><span className="text-[10px] text-slate-400">{pr.requested_by}</span></Td>
                <Td><Badge variant={pr.request_type === 'import' ? 'info' : 'neutral'}>{pr.request_type}</Badge></Td>
                <Td><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[pr.priority]}`}>{pr.priority}</span></Td>
                <Td><span className="text-xs text-slate-500">{pr.required_date ?? '—'}</span></Td>
                <Td><span className="text-sm">{pr.items.length}</span></Td>
                <Td align="right"><span className="data-value">{formatCurrency(pr.total_estimated_value)}</span></Td>
                <Td><Badge variant={STATUS_VARIANT[pr.status]}>{pr.status.replace(/_/g,' ')}</Badge></Td>
                <Td>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setViewPR(pr)}><Eye className="h-3.5 w-3.5" /></Button>
                    {pr.status === 'submitted' && (
                      <>
                        <Button variant="ghost" size="icon" title="Approve" onClick={() => handleAction(pr.id, 'approve')}><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /></Button>
                        <Button variant="ghost" size="icon" title="Reject" onClick={() => handleAction(pr.id, 'reject', 'Rejected by manager')}><XCircle className="h-3.5 w-3.5 text-red-500" /></Button>
                      </>
                    )}
                    {pr.status === 'draft' && <Button variant="ghost" size="icon" title="Submit" onClick={() => handleAction(pr.id, 'submit')}><Send className="h-3.5 w-3.5 text-blue-600" /></Button>}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      {/* View PR Modal */}
      {viewPR && (
        <Modal open={!!viewPR} onClose={() => setViewPR(null)} title={`${viewPR.pr_no} — ${viewPR.department}`} size="lg"
          footer={<>
            {viewPR.status === 'submitted' && <>
              <Button size="sm" variant="outline" className="text-red-600 border-red-300" loading={saving} onClick={() => handleAction(viewPR.id, 'reject', 'Rejected')}>Reject</Button>
              <Button size="sm" loading={saving} onClick={() => handleAction(viewPR.id, 'approve')}>Approve PR</Button>
            </>}
            {viewPR.status === 'approved' && <Button size="sm">Convert to PO</Button>}
            <Button variant="ghost" size="sm" onClick={() => setViewPR(null)}>Close</Button>
          </>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              {[['Requested By', viewPR.requested_by], ['Department', viewPR.department], ['Date', viewPR.request_date], ['Required By', viewPR.required_date ?? '—'], ['Priority', viewPR.priority], ['Type', viewPR.request_type]].map(([l,v]) => (
                <div key={l}><p className="text-xs text-slate-400">{l}</p><p className="font-semibold text-slate-800">{v}</p></div>
              ))}
            </div>
            {viewPR.remarks && <div className="px-3 py-2 bg-amber-50 rounded text-sm text-amber-800"><strong>Remarks:</strong> {viewPR.remarks}</div>}
            <Divider label="Line Items" />
            <Table>
              <Thead><tr><Th>Item</Th><Th align="right">Qty</Th><Th>UOM</Th><Th align="right">Rate (Est.)</Th><Th align="right">Amount</Th></tr></Thead>
              <Tbody>
                {viewPR.items.map((item: any, i: number) => (
                  <Tr key={i}>
                    <Td><span className="font-medium text-slate-800">{item.name}</span>{item.remarks && <p className="text-[10px] text-slate-400">{item.remarks}</p>}</Td>
                    <Td align="right">{item.qty}</Td>
                    <Td>{item.uom}</Td>
                    <Td align="right">{item.estimated_rate ? formatCurrency(item.estimated_rate) : '—'}</Td>
                    <Td align="right"><span className="font-semibold">{formatCurrency(item.estimated_amount)}</span></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <div className="flex justify-end text-sm font-bold text-slate-800 gap-2">
              <span>Total Estimated Value:</span>
              <span className="text-blue-700">{formatCurrency(viewPR.total_estimated_value)}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* New PR Modal */}
      <Modal open={newPR} onClose={() => setNewPR(false)} title="New Purchase Request" size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewPR(false)}>Cancel</Button>
          <Button variant="outline" size="sm" loading={saving} onClick={() => handleCreate(false)}>Save Draft</Button>
          <Button size="sm" loading={saving} onClick={() => handleCreate(true)}>Submit for Approval</Button>
        </>}
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Department" value={header.department} onChange={e => setHeader(h => ({ ...h, department: e.target.value }))} placeholder="Your department" />
            <Input label="Required By Date" type="date" value={header.required_date} onChange={e => setHeader(h => ({ ...h, required_date: e.target.value }))} />
            <Select label="Priority" value={header.priority} onChange={e => setHeader(h => ({ ...h, priority: (e.target as any).value }))}
              options={[{label:'Urgent',value:'urgent'},{label:'High',value:'high'},{label:'Normal',value:'normal'},{label:'Low',value:'low'}]} />
            <Select label="Type" value={header.request_type} onChange={e => setHeader(h => ({ ...h, request_type: (e.target as any).value }))}
              options={[{label:'Domestic',value:'domestic'},{label:'Import (Foreign)',value:'import'}]} />
          </div>
          <Textarea label="Business Justification" rows={2} value={header.justification} onChange={e => setHeader(h => ({ ...h, justification: e.target.value }))} placeholder="Why is this needed?" />
          <Divider label="Line Items" />
          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4"><Input label={idx === 0 ? 'Item / Description' : ''} value={line.name} onChange={e => { const l=[...lines]; l[idx]={...l[idx],name:e.target.value}; setLines(l) }} placeholder="Item name" /></div>
                <div className="col-span-2"><Input label={idx === 0 ? 'Qty' : ''} type="number" value={line.qty} onChange={e => { const l=[...lines]; l[idx]={...l[idx],qty:e.target.value,estimated_amount:String(Number(e.target.value)*Number(l[idx].estimated_rate))}; setLines(l) }} placeholder="0" /></div>
                <div className="col-span-1"><Select label={idx === 0 ? 'UOM' : ''} value={line.uom} onChange={e => { const l=[...lines]; l[idx]={...l[idx],uom:(e.target as any).value}; setLines(l) }} options={['PCS','KG','MTR','LTR','BTL','BOX','SET'].map(u=>({label:u,value:u}))} /></div>
                <div className="col-span-2"><Input label={idx === 0 ? 'Rate (est.)' : ''} type="number" value={line.estimated_rate} onChange={e => { const l=[...lines]; l[idx]={...l[idx],estimated_rate:e.target.value,estimated_amount:String(Number(l[idx].qty)*Number(e.target.value))}; setLines(l) }} placeholder="₹" /></div>
                <div className="col-span-2"><Input label={idx === 0 ? 'Amount' : ''} type="number" value={line.estimated_amount} readOnly className="bg-slate-50" /></div>
                <div className="col-span-1 flex items-end pb-1">{lines.length > 1 && <Button variant="ghost" size="icon" onClick={() => setLines(l => l.filter((_,i) => i!==idx))}><XCircle className="h-3.5 w-3.5 text-slate-400" /></Button>}</div>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setLines(l => [...l, { ...EMPTY_LINE }])}>Add Line</Button>
          <div className="flex justify-end text-sm font-bold text-slate-700 gap-2 pt-2 border-t border-slate-100">
            <span>Total Estimate:</span>
            <span className="text-blue-700">{formatCurrency(lines.reduce((s,l) => s + (Number(l.estimated_amount)||0), 0))}</span>
          </div>
          <Textarea label="Remarks" rows={2} value={header.remarks} onChange={e => setHeader(h => ({ ...h, remarks: e.target.value }))} placeholder="Any additional notes..." />
        </div>
      </Modal>
    </div>
  )
}
