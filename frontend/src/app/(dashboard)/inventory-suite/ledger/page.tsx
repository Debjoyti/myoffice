'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { BookOpen, Download, RefreshCw, TrendingUp, TrendingDown, ArrowUpDown, FlaskConical } from 'lucide-react'

const MOV_DIRECTION: Record<string,string> = {
  GR:'in', GI:'out', STO_OUT:'out', STO_IN:'in', ADJ_PLUS:'in', ADJ_MINUS:'out',
  RETURN_IN:'in', RETURN_OUT:'out', SCRAP:'out', OPENING:'in', TRANSFER_IN:'in', TRANSFER_OUT:'out',
}
const MOV_LABEL: Record<string,string> = {
  GR:'Goods Receipt', GI:'Goods Issue', STO_OUT:'Transfer Out', STO_IN:'Transfer In',
  ADJ_PLUS:'Adj (+)', ADJ_MINUS:'Adj (-)', RETURN_IN:'Return In', RETURN_OUT:'Return Out',
  SCRAP:'Scrap', OPENING:'Opening Stock',
}
const MOV_VARIANT: Record<string,any> = { in:'success', out:'danger', transfer:'info' }

const MOCK_LEDGER = [
  { id:'1', movement_type:'GR', movement_date:'2026-05-30', inventory_items:{sku:'ELE-PCB-001',name:'PCB Assembly Board'}, warehouses:{code:'WH-01',name:'Main Warehouse'}, qty:200, uom:'PCS', rate:1250, amount:250000, balance_qty:450, reference_type:'GRN', reference_no:'GRN-2026-0021', narration:'GRN-2026-0021 from Shenzhen Tech' },
  { id:'2', movement_type:'GI', movement_date:'2026-05-30', inventory_items:{sku:'ELE-PCB-001',name:'PCB Assembly Board'}, warehouses:{code:'WH-01',name:'Main Warehouse'}, qty:50, uom:'PCS', rate:1250, amount:62500, balance_qty:400, reference_type:'GI', reference_no:'GI-2026-0018', narration:'Issued for WO-2026-012' },
  { id:'3', movement_type:'GR', movement_date:'2026-05-29', inventory_items:{sku:'RAW-STL-001',name:'Steel Sheet 2mm'}, warehouses:{code:'WH-02',name:'Raw Material Store'}, qty:200, uom:'KG', rate:85, amount:17000, balance_qty:280, reference_type:'GRN', reference_no:'GRN-2026-0020', narration:'GRN-2026-0020 from ABC Steel Traders' },
  { id:'4', movement_type:'STO_OUT', movement_date:'2026-05-28', inventory_items:{sku:'FIN-ASM-A1',name:'Finished Assembly Unit A1'}, warehouses:{code:'WH-01',name:'Main Warehouse'}, qty:30, uom:'PCS', rate:4800, amount:144000, balance_qty:190, reference_type:'STO', reference_no:'STO-2026-005', narration:'Transfer to WH-02 for dispatch' },
  { id:'5', movement_type:'STO_IN', movement_date:'2026-05-28', inventory_items:{sku:'FIN-ASM-A1',name:'Finished Assembly Unit A1'}, warehouses:{code:'WH-02',name:'Raw Material Store'}, qty:30, uom:'PCS', rate:4800, amount:144000, balance_qty:30, reference_type:'STO', reference_no:'STO-2026-005', narration:'Received from WH-01' },
  { id:'6', movement_type:'GI', movement_date:'2026-05-27', inventory_items:{sku:'ELE-CAP-100',name:'Capacitor 100µF'}, warehouses:{code:'WH-01',name:'Main Warehouse'}, qty:500, uom:'PCS', rate:8, amount:4000, balance_qty:4500, reference_type:'GI', reference_no:'GI-2026-0017', narration:'Issued for WO-2026-009' },
  { id:'7', movement_type:'ADJ_MINUS', movement_date:'2026-05-26', inventory_items:{sku:'CHM-SOL-001',name:'Flux Solution 500ml'}, warehouses:{code:'WH-03',name:'Chemical Store'}, qty:5, uom:'BTL', rate:320, amount:1600, balance_qty:15, reference_type:'ADJ', reference_no:'ADJ-2026-003', narration:'Negative adjustment — Physical count variance' },
  { id:'8', movement_type:'GR', movement_date:'2026-05-26', inventory_items:{sku:'CHM-SOL-001',name:'Flux Solution 500ml'}, warehouses:{code:'WH-03',name:'Chemical Store'}, qty:20, uom:'BTL', rate:320, amount:6400, balance_qty:20, reference_type:'GRN', reference_no:'GRN-2026-0019', narration:'GRN-2026-0019 from Heraeus Electronics (Import)' },
]

export default function LedgerPage() {
  const [ledger, setLedger] = useState(MOCK_LEDGER)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const fetchLedger = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') params.set('movement_type', filterType)
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)
      const res = await fetch(`/api/v1/inventory/ledger?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (data.ledger?.length > 0) { setLedger(data.ledger); setIsPreview(false) }
      }
    } catch { /* keep mock */ }
    finally { setLoading(false) }
  }, [filterType, fromDate, toDate])

  useEffect(() => { fetchLedger() }, [fetchLedger])

  const filtered = ledger.filter(e => {
    const name = e.inventory_items?.name ?? ''
    const sku  = e.inventory_items?.sku ?? ''
    return !search || name.toLowerCase().includes(search.toLowerCase()) || sku.toLowerCase().includes(search.toLowerCase()) || e.reference_no.toLowerCase().includes(search.toLowerCase())
  })

  const inwardValue  = ledger.filter(e => MOV_DIRECTION[e.movement_type] === 'in').reduce((s,e) => s + e.amount, 0)
  const outwardValue = ledger.filter(e => MOV_DIRECTION[e.movement_type] === 'out').reduce((s,e) => s + e.amount, 0)

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Stock Ledger"
        description="Immutable audit trail of every inventory movement — full traceability"
        actions={<>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchLedger}>Refresh</Button>
        </>}
      />

      {isPreview && <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700"><FlaskConical className="h-3.5 w-3.5" /><strong>Preview mode</strong> — Showing sample ledger entries.</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Entries" value={ledger.length.toString()} icon={<BookOpen className="h-4 w-4" />} />
        <StatCard label="Inward Value" value={formatCurrency(inwardValue)} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Outward Value" value={formatCurrency(outwardValue)} icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
        <StatCard label="Net Movement" value={formatCurrency(inwardValue - outwardValue)} icon={<ArrowUpDown className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" delta={{ value: inwardValue > outwardValue ? 'Net inward' : 'Net outward', positive: inwardValue > outwardValue }} />
      </div>

      <Card padding="none">
        <div className="px-5 py-4 flex flex-wrap items-center gap-3 border-b border-slate-100">
          <SearchInput placeholder="Search item, SKU, reference..." value={search} onChange={setSearch} className="w-64" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white">
            <option value="all">All Movements</option>
            {Object.entries(MOV_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <Input label="" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} placeholder="From" className="w-36" />
          <Input label="" type="date" value={toDate} onChange={e => setToDate(e.target.value)} placeholder="To" className="w-36" />
        </div>

        <Table>
          <Thead>
            <tr>
              <Th>Date</Th><Th>Movement</Th><Th>Item</Th><Th>Warehouse</Th>
              <Th>Reference</Th><Th>Lot/Batch</Th>
              <Th align="right">Qty</Th><Th align="right">Rate</Th><Th align="right">Amount</Th>
              <Th align="right">Balance</Th>
            </tr>
          </Thead>
          <Tbody>
            {loading ? <Tr><td colSpan={10} className="py-10 text-center text-slate-400 text-sm">Loading…</td></Tr>
            : filtered.map(e => {
              const dir = MOV_DIRECTION[e.movement_type] ?? 'transfer'
              return (
                <Tr key={e.id}>
                  <Td><span className="text-xs text-slate-500">{e.movement_date}</span></Td>
                  <Td>
                    <Badge variant={MOV_VARIANT[dir]}>{MOV_LABEL[e.movement_type] ?? e.movement_type}</Badge>
                  </Td>
                  <Td>
                    <p className="font-medium text-slate-800 text-sm">{e.inventory_items?.name}</p>
                    <p className="font-mono text-[10px] text-slate-400">{e.inventory_items?.sku}</p>
                  </Td>
                  <Td>
                    <p className="text-sm text-slate-600">{e.warehouses?.name}</p>
                    <p className="font-mono text-[10px] text-slate-400">{e.warehouses?.code}</p>
                  </Td>
                  <Td>
                    <p className="font-mono text-xs text-blue-600">{e.reference_no}</p>
                    <p className="text-[10px] text-slate-400">{e.reference_type}</p>
                  </Td>
                  <Td><span className="text-xs text-slate-400">{(e as any).lot_no ?? (e as any).batch_no ?? '—'}</span></Td>
                  <Td align="right">
                    <span className={`font-semibold ${dir === 'in' ? 'text-emerald-600' : dir === 'out' ? 'text-red-600' : 'text-blue-600'}`}>
                      {dir === 'in' ? '+' : dir === 'out' ? '-' : '⇄'}{e.qty} {e.uom}
                    </span>
                  </Td>
                  <Td align="right"><span className="text-sm">{e.rate ? formatCurrency(e.rate) : '—'}</span></Td>
                  <Td align="right"><span className="font-semibold">{formatCurrency(e.amount)}</span></Td>
                  <Td align="right">
                    <span className="font-bold text-slate-700">{e.balance_qty}</span>
                    <span className="text-[10px] text-slate-400 block">{e.uom}</span>
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex gap-6 text-xs text-slate-500">
          <span>Showing {filtered.length} entries</span>
          <span>Inward: <strong className="text-emerald-600">{formatCurrency(inwardValue)}</strong></span>
          <span>Outward: <strong className="text-red-600">{formatCurrency(outwardValue)}</strong></span>
        </div>
      </Card>
    </div>
  )
}
