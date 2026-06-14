// @ts-nocheck
'use client'

import { useState } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td, StatCard
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, Plus, ShoppingCart, Clock, Truck } from 'lucide-react'

const MOCK_REORDER = [
  { id:'1', sku:'RAW-STL-001', name:'Steel Sheet 2mm', category:'Raw Material', item_type:'domestic', warehouse:'WH-02', qty_on_hand:80, reorder_level:200, safety_stock:150, reorder_qty:500, lead_time_days:5, last_vendor:'ABC Steel Traders', last_rate:85, suggested_po_value:42500, status:'critical' },
  { id:'2', sku:'CHM-SOL-001', name:'Flux Solution 500ml', category:'Consumable', item_type:'imported', warehouse:'WH-03', qty_on_hand:15, reorder_level:50, safety_stock:30, reorder_qty:100, lead_time_days:21, last_vendor:'Heraeus Electronics GmbH', last_rate:320, suggested_po_value:32000, status:'critical' },
  { id:'3', sku:'ELE-RES-047', name:'Resistor 47Ω (1/4W)', category:'Raw Material', item_type:'imported', warehouse:'WH-01', qty_on_hand:850, reorder_level:1000, safety_stock:500, reorder_qty:5000, lead_time_days:14, last_vendor:'Taiwan Semiconductor Corp.', last_rate:1.2, suggested_po_value:6000, status:'low' },
  { id:'4', sku:'PKG-TAPE-48', name:'Packaging Tape 48mm', category:'Consumable', item_type:'domestic', warehouse:'WH-01', qty_on_hand:45, reorder_level:100, safety_stock:50, reorder_qty:200, lead_time_days:3, last_vendor:'Delhi Paper Mart', last_rate:85, suggested_po_value:17000, status:'low' },
  { id:'5', sku:'SPR-OIL-MOB', name:'Mobil Synthetic Oil 5L', category:'Spare Parts', item_type:'domestic', warehouse:'WH-02', qty_on_hand:8, reorder_level:15, safety_stock:10, reorder_qty:30, lead_time_days:2, last_vendor:'Bharat Petroleum Retail', last_rate:1850, suggested_po_value:55500, status:'low' },
]

const STATUS_VARIANT: Record<string,any> = { critical:'danger', low:'warning', ok:'success' }

export default function ReorderPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleAll = () => {
    if (selected.size === MOCK_REORDER.length) setSelected(new Set())
    else setSelected(new Set(MOCK_REORDER.map(r => r.id)))
  }

  const critical = MOCK_REORDER.filter(r => r.status === 'critical').length
  const totalSuggestedValue = MOCK_REORDER.reduce((s, r) => s + r.suggested_po_value, 0)
  const importItems = MOCK_REORDER.filter(r => r.item_type === 'imported').length

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Reorder Management"
        description="Items below reorder level — create PRs or POs directly"
        actions={<>
          {selected.size > 0 && <>
            <Button variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>Create PRs ({selected.size})</Button>
            <Button size="sm" leftIcon={<ShoppingCart className="h-3.5 w-3.5" />}>Create POs ({selected.size})</Button>
          </>}
        </>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Critical (Below Safety)" value={critical.toString()} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-red-50 text-red-600" delta={{ value: 'Immediate action', positive: false }} />
        <StatCard label="Low Stock Items" value={MOCK_REORDER.length.toString()} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Imported Items" value={importItems.toString()} icon={<Truck className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" delta={{ value: 'Longer lead time', positive: false }} />
        <StatCard label="Suggested PO Value" value={formatCurrency(totalSuggestedValue)} icon={<ShoppingCart className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
      </div>

      <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>{critical} item(s) are critically low</strong> — stock is below safety level. For imported items, lead times can be 14–30 days. Raise POs immediately to avoid production stoppage.
        </div>
      </div>

      <Card padding="none">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Items Requiring Reorder</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={toggleAll}>{selected.size === MOCK_REORDER.length ? 'Deselect All' : 'Select All'}</Button>
            {selected.size > 0 && <Button size="sm" leftIcon={<ShoppingCart className="h-3.5 w-3.5" />}>Create POs for Selected</Button>}
          </div>
        </div>

        <Table>
          <Thead>
            <tr>
              <Th><input type="checkbox" checked={selected.size === MOCK_REORDER.length} onChange={toggleAll} className="rounded" /></Th>
              <Th>SKU</Th><Th>Item</Th><Th>Source</Th><Th>Warehouse</Th>
              <Th align="right">On Hand</Th><Th align="right">Safety</Th><Th align="right">Reorder Qty</Th>
              <Th>Lead Time</Th><Th>Last Vendor</Th><Th align="right">Sugg. PO Value</Th>
              <Th>Status</Th><Th></Th>
            </tr>
          </Thead>
          <Tbody>
            {MOCK_REORDER.map(item => (
              <Tr key={item.id}>
                <Td><input type="checkbox" checked={selected.has(item.id)} onChange={() => { const s = new Set(selected); s.has(item.id) ? s.delete(item.id) : s.add(item.id); setSelected(s) }} className="rounded" /></Td>
                <Td><span className="font-mono text-xs font-bold text-blue-600">{item.sku}</span></Td>
                <Td>
                  <p className="font-medium text-slate-800">{item.name}</p>
                  <p className="text-[10px] text-slate-400">{item.category}</p>
                </Td>
                <Td><Badge variant={item.item_type === 'imported' ? 'info' : 'neutral'}>{item.item_type}</Badge></Td>
                <Td><span className="text-xs text-slate-500">{item.warehouse}</span></Td>
                <Td align="right">
                  <span className={`font-bold ${item.status === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>{item.qty_on_hand}</span>
                  <span className="text-[10px] text-slate-400 block">Min: {item.reorder_level}</span>
                </Td>
                <Td align="right"><span className="text-slate-600">{item.safety_stock}</span></Td>
                <Td align="right"><span className="font-semibold text-blue-600">{item.reorder_qty}</span></Td>
                <Td>
                  <span className={`text-xs font-medium ${item.lead_time_days > 14 ? 'text-red-600' : item.lead_time_days > 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {item.lead_time_days} days
                  </span>
                </Td>
                <Td>
                  <p className="text-xs text-slate-600">{item.last_vendor}</p>
                  <p className="text-[10px] text-slate-400">Last rate: {formatCurrency(item.last_rate)}</p>
                </Td>
                <Td align="right"><span className="font-semibold text-slate-800">{formatCurrency(item.suggested_po_value)}</span></Td>
                <Td><Badge variant={STATUS_VARIANT[item.status]}>{item.status}</Badge></Td>
                <Td>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" title="Create PR">PR</Button>
                    <Button variant="ghost" size="sm" title="Create PO">PO</Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-between text-xs text-slate-500">
          <span>{selected.size > 0 ? `${selected.size} items selected` : `${MOCK_REORDER.length} items needing reorder`}</span>
          <span>Total Suggested Value: <strong className="text-blue-700">{formatCurrency(totalSuggestedValue)}</strong></span>
        </div>
      </Card>
    </div>
  )
}
