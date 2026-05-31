'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  Package, Plus, Download, RefreshCw, Eye, Edit2, AlertTriangle,
  ArrowUpDown, BarChart3, Warehouse, TrendingDown, CheckCircle2
} from 'lucide-react'

const MOCK_ITEMS = [
  { id: 'ITM-001', sku: 'ELE-PCB-001', name: 'PCB Assembly Board', category: 'Electronics', uom: 'PCS', qty: 450, reorder: 100, cost: 1250, value: 562500, warehouse: 'WH-01', status: 'in_stock' },
  { id: 'ITM-002', sku: 'PKG-BOX-L', name: 'Packaging Box Large', category: 'Packaging', uom: 'PCS', qty: 1200, reorder: 500, cost: 45, value: 54000, warehouse: 'WH-01', status: 'in_stock' },
  { id: 'ITM-003', sku: 'RAW-STL-001', name: 'Steel Sheet 2mm', category: 'Raw Material', uom: 'KG', qty: 80, reorder: 200, cost: 85, value: 6800, warehouse: 'WH-02', status: 'low_stock' },
  { id: 'ITM-004', sku: 'ELE-CAP-100', name: 'Capacitor 100µF', category: 'Electronics', uom: 'PCS', qty: 5000, reorder: 1000, cost: 8, value: 40000, warehouse: 'WH-01', status: 'in_stock' },
  { id: 'ITM-005', sku: 'CHM-SOL-001', name: 'Flux Solution 500ml', category: 'Chemicals', uom: 'BTL', qty: 15, reorder: 50, cost: 320, value: 4800, warehouse: 'WH-03', status: 'critical' },
  { id: 'ITM-006', sku: 'FIN-ASM-A1', name: 'Finished Assembly Unit A1', category: 'Finished Goods', uom: 'PCS', qty: 220, reorder: 50, cost: 4800, value: 1056000, warehouse: 'WH-01', status: 'in_stock' },
  { id: 'ITM-007', sku: 'WIP-PCB-002', name: 'WIP PCB Stage 2', category: 'WIP', uom: 'PCS', qty: 60, reorder: 0, cost: 2100, value: 126000, warehouse: 'WH-01', status: 'in_stock' },
]

const MOCK_MOVEMENTS = [
  { id: 'MOV-001', date: '2026-05-30', item: 'PCB Assembly Board', movement: 'Goods Issue', qty: 50, reference: 'WO-2026-010', warehouse: 'WH-01', direction: 'out' },
  { id: 'MOV-002', date: '2026-05-29', item: 'Steel Sheet 2mm', movement: 'Goods Receipt', qty: 200, reference: 'PO-2026-028', warehouse: 'WH-02', direction: 'in' },
  { id: 'MOV-003', date: '2026-05-28', item: 'Finished Assembly Unit A1', movement: 'Stock Transfer', qty: 30, reference: 'STO-2026-005', warehouse: 'WH-01 → WH-02', direction: 'transfer' },
  { id: 'MOV-004', date: '2026-05-27', item: 'Capacitor 100µF', movement: 'Goods Issue', qty: 500, reference: 'WO-2026-009', warehouse: 'WH-01', direction: 'out' },
  { id: 'MOV-005', date: '2026-05-26', item: 'Flux Solution 500ml', movement: 'Goods Receipt', qty: 20, reference: 'PO-2026-027', warehouse: 'WH-03', direction: 'in' },
]

const MOCK_WAREHOUSES = [
  { id: 'WH-01', name: 'Main Warehouse', location: 'Pune — MIDC', capacity: 5000, used: 3200, items: 5, manager: 'Rakesh Sharma' },
  { id: 'WH-02', name: 'Raw Material Store', location: 'Pune — Plant 2', capacity: 2000, used: 800, items: 2, manager: 'Priya Patel' },
  { id: 'WH-03', name: 'Chemical Store', location: 'Pune — Plant 1', capacity: 500, used: 150, items: 1, manager: 'Amit Desai' },
]

const MOCK_BOM = [
  { id: 'BOM-001', product: 'Finished Assembly Unit A1', revision: 'v2.3', components: 8, status: 'active' },
  { id: 'BOM-002', product: 'WIP PCB Stage 2', revision: 'v1.1', components: 5, status: 'active' },
  { id: 'BOM-003', product: 'Assembly Unit B2', revision: 'v1.0', components: 12, status: 'draft' },
]

const STATUS_VARIANT: Record<string, any> = {
  in_stock: 'success', low_stock: 'warning', critical: 'danger',
  active: 'success', draft: 'neutral',
}
const STATUS_LABEL: Record<string, string> = { in_stock: 'In Stock', low_stock: 'Low Stock', critical: 'Critical' }

export default function InventoryPage() {
  const [tab, setTab] = useState('items')
  const [search, setSearch] = useState('')
  const [newItem, setNewItem] = useState(false)
  const [newMovement, setNewMovement] = useState(false)

  const totalValue = MOCK_ITEMS.reduce((s, i) => s + i.value, 0)
  const lowStockCount = MOCK_ITEMS.filter(i => i.status === 'low_stock' || i.status === 'critical').length
  const totalItems = MOCK_ITEMS.reduce((s, i) => s + i.qty, 0)

  const filtered = MOCK_ITEMS.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Inventory Management"
        description="Stock items, goods movements, warehouses, and bill of materials (BOM)"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button variant="outline" size="sm" leftIcon={<ArrowUpDown className="h-3.5 w-3.5" />} onClick={() => setNewMovement(true)}>Stock Movement</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewItem(true)}>Add Item</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Inventory Value" value={formatCurrency(totalValue)} icon={<Package className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Total SKUs" value={MOCK_ITEMS.length.toString()} icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label="Total Qty (all items)" value={totalItems.toLocaleString()} icon={<Warehouse className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="Low / Critical Stock" value={lowStockCount.toString()} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" delta={lowStockCount > 0 ? { value: 'Needs reorder', positive: false } : undefined} />
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span><strong>{lowStockCount} items</strong> are below reorder level. Review and raise purchase orders.</span>
          <Button variant="ghost" size="sm" className="ml-auto text-amber-700">Create PO</Button>
        </div>
      )}

      <TabBar
        tabs={[
          { id: 'items', label: 'Stock Items', count: MOCK_ITEMS.length },
          { id: 'movements', label: 'Stock Movements' },
          { id: 'warehouses', label: 'Warehouses' },
          { id: 'bom', label: 'Bill of Materials' },
          { id: 'valuation', label: 'Valuation' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'items' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
            <SearchInput placeholder="Search by name or SKU..." value={search} onChange={setSearch} className="w-72" />
            <div className="flex gap-2 ml-auto">
              {['All','Raw Material','WIP','Finished Goods','Electronics','Packaging'].map(c => (
                <Button key={c} variant="ghost" size="sm" onClick={() => setSearch(c === 'All' ? '' : c)}>{c}</Button>
              ))}
            </div>
          </div>
          <Table>
            <Thead>
              <tr><Th>SKU</Th><Th>Item Name</Th><Th>Category</Th><Th>Warehouse</Th><Th align="right">Qty</Th><Th>UOM</Th><Th align="right">Unit Cost</Th><Th align="right">Stock Value</Th><Th>Status</Th><Th></Th></tr>
            </Thead>
            <Tbody>
              {filtered.map(item => (
                <Tr key={item.id}>
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{item.sku}</span></Td>
                  <Td><span className="font-medium text-slate-800">{item.name}</span></Td>
                  <Td><span className="text-xs text-slate-500">{item.category}</span></Td>
                  <Td><span className="text-xs text-slate-500">{item.warehouse}</span></Td>
                  <Td align="right">
                    <span className={`font-semibold ${item.status === 'critical' ? 'text-red-600' : item.status === 'low_stock' ? 'text-amber-600' : 'text-slate-800'}`}>
                      {item.qty.toLocaleString()}
                    </span>
                    {item.qty <= item.reorder && item.reorder > 0 && <AlertTriangle className="h-3 w-3 text-amber-500 inline ml-1" />}
                  </Td>
                  <Td><span className="text-xs text-slate-400">{item.uom}</span></Td>
                  <Td align="right"><span className="text-sm">{formatCurrency(item.cost)}</span></Td>
                  <Td align="right"><span className="data-value font-semibold">{formatCurrency(item.value)}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon"><Edit2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500">Total Inventory Value: <span className="font-bold text-slate-700">{formatCurrency(totalValue)}</span></p>
          </div>
        </Card>
      )}

      {tab === 'movements' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Stock Movement Log</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewMovement(true)}>New Movement</Button>
          </div>
          <Table>
            <Thead><tr><Th>Date</Th><Th>Item</Th><Th>Movement Type</Th><Th>Reference</Th><Th align="right">Qty</Th><Th>Warehouse</Th></Tr></Thead>
            <Tbody>
              {MOCK_MOVEMENTS.map(m => (
                <Tr key={m.id}>
                  <Td><span className="text-xs text-slate-500">{m.date}</span></Td>
                  <Td><span className="font-medium text-slate-800">{m.item}</span></Td>
                  <Td>
                    <Badge variant={m.direction === 'in' ? 'success' : m.direction === 'out' ? 'danger' : 'info'}>
                      {m.movement}
                    </Badge>
                  </Td>
                  <Td><span className="font-mono text-xs text-blue-600">{m.reference}</span></Td>
                  <Td align="right">
                    <span className={`font-semibold ${m.direction === 'in' ? 'text-emerald-600' : m.direction === 'out' ? 'text-red-600' : 'text-blue-600'}`}>
                      {m.direction === 'in' ? '+' : m.direction === 'out' ? '-' : '⇄'}{m.qty}
                    </span>
                  </Td>
                  <Td><span className="text-xs text-slate-500">{m.warehouse}</span></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'warehouses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {MOCK_WAREHOUSES.map(wh => {
            const pct = Math.round((wh.used / wh.capacity) * 100)
            return (
              <Card key={wh.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-800">{wh.name}</p>
                    <p className="text-xs text-slate-500">{wh.location}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{wh.id}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Manager</span>
                    <span className="font-medium">{wh.manager}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SKUs Stored</span>
                    <span className="font-medium">{wh.items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Capacity Used</span>
                    <span className="font-medium">{wh.used} / {wh.capacity} sqft</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Utilization</span>
                      <span className={`font-semibold ${pct > 80 ? 'text-red-600' : pct > 60 ? 'text-amber-600' : 'text-emerald-600'}`}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'bom' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Bill of Materials</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>New BOM</Button>
          </div>
          <Table>
            <Thead><tr><Th>BOM ID</Th><Th>Product</Th><Th>Revision</Th><Th>Components</Th><Th>Status</Th><Th></Th></tr></Thead>
            <Tbody>
              {MOCK_BOM.map(b => (
                <Tr key={b.id}>
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{b.id}</span></Td>
                  <Td><span className="font-medium text-slate-800">{b.product}</span></Td>
                  <Td><span className="text-xs text-slate-500">{b.revision}</span></Td>
                  <Td><span className="text-sm">{b.components} components</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon"><Edit2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'valuation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Inventory by Category" />
            <div className="space-y-3 mt-3">
              {['Raw Material','Electronics','Packaging','WIP','Finished Goods','Chemicals'].map(cat => {
                const catItems = MOCK_ITEMS.filter(i => i.category === cat)
                const catValue = catItems.reduce((s, i) => s + i.value, 0)
                const pct = totalValue ? Math.round((catValue / totalValue) * 100) : 0
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{cat}</span>
                      <span className="font-semibold">{formatCurrency(catValue)} <span className="text-slate-400 text-xs">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
          <Card>
            <CardHeader title="Valuation Summary" description="FIFO method" />
            <div className="space-y-2 mt-3 text-sm">
              {[
                { label: 'Raw Materials', value: MOCK_ITEMS.filter(i => i.category === 'Raw Material').reduce((s,i) => s + i.value, 0) },
                { label: 'Work In Progress', value: MOCK_ITEMS.filter(i => i.category === 'WIP').reduce((s,i) => s + i.value, 0) },
                { label: 'Finished Goods', value: MOCK_ITEMS.filter(i => i.category === 'Finished Goods').reduce((s,i) => s + i.value, 0) },
                { label: 'Electronics / Components', value: MOCK_ITEMS.filter(i => i.category === 'Electronics').reduce((s,i) => s + i.value, 0) },
                { label: 'Packaging', value: MOCK_ITEMS.filter(i => i.category === 'Packaging').reduce((s,i) => s + i.value, 0) },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">{r.label}</span>
                  <span className="font-semibold">{formatCurrency(r.value)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 bg-blue-50 px-2 rounded-lg font-bold">
                <span className="text-blue-900">Total Inventory</span>
                <span className="text-blue-700">{formatCurrency(totalValue)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Modal open={newItem} onClose={() => setNewItem(false)} title="Add Stock Item" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewItem(false)}>Cancel</Button><Button size="sm">Save Item</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU / Item Code" placeholder="ELE-PCB-001" required />
            <Input label="Item Name" placeholder="Full descriptive name" required />
            <Select label="Category" options={['Raw Material','WIP','Finished Goods','Electronics','Packaging','Chemicals','Tools','Other'].map(c => ({ label: c, value: c }))} />
            <Select label="Unit of Measure" options={['PCS','KG','MTR','LTR','BTL','BOX','SET','NOS'].map(u => ({ label: u, value: u }))} />
            <Input label="Opening Stock Qty" type="number" placeholder="0" />
            <Input label="Unit Cost (₹)" type="number" placeholder="0" />
            <Input label="Reorder Level" type="number" placeholder="0" />
            <Select label="Primary Warehouse" options={MOCK_WAREHOUSES.map(w => ({ label: w.name, value: w.id }))} />
          </div>
          <Input label="HSN / SAC Code" placeholder="e.g. 85340000" />
          <Textarea label="Description" rows={2} placeholder="Optional item description" />
        </div>
      </Modal>

      <Modal open={newMovement} onClose={() => setNewMovement(false)} title="Stock Movement" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewMovement(false)}>Cancel</Button><Button size="sm">Post Movement</Button></>}
      >
        <div className="space-y-4">
          <Select label="Movement Type" options={[
            { label: 'Goods Receipt (Inward)', value: 'GR' },
            { label: 'Goods Issue (Outward)', value: 'GI' },
            { label: 'Stock Transfer', value: 'ST' },
            { label: 'Adjustment (Physical count)', value: 'ADJ' },
            { label: 'Return to Supplier', value: 'RTS' },
          ]} />
          <Select label="Item" options={MOCK_ITEMS.map(i => ({ label: `${i.sku} — ${i.name}`, value: i.id }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity" type="number" placeholder="0" required />
            <Input label="Reference No" placeholder="PO / WO / Invoice" />
          </div>
          <Input label="Date" type="date" />
          <Textarea label="Remarks" rows={2} placeholder="Optional notes" />
        </div>
      </Modal>
    </div>
  )
}
