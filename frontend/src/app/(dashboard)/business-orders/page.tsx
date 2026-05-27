'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, TabBar, Modal, Input, Select, Textarea, EmptyState
} from '@/components/ui'
import { Package, ShoppingCart, ClipboardList, Truck, Plus, FlaskConical } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type InventoryItem = { id: string; name: string; category: string; qty: number; unit: string; price: number; location: string }
type PRStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected'
type POStatus = 'Draft' | 'Sent' | 'Partial' | 'Received' | 'Cancelled'

type PurchaseRequest = { id: string; requestedBy: string; store: string; items: string; reason: string; status: PRStatus; date: string }
type PurchaseOrder = { id: string; vendor: string; amount: number; status: POStatus; items: string; date: string; delivery: string }

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INVENTORY: InventoryItem[] = [
  { id: 'INV-001', name: 'MacBook Pro 14"', category: 'Hardware', qty: 5, unit: 'pcs', price: 145000, location: 'Warehouse A' },
  { id: 'INV-002', name: 'A4 Paper Bundle', category: 'Supplies', qty: 45, unit: 'bundle', price: 450, location: 'Warehouse B' },
  { id: 'INV-003', name: 'USB-C Hub', category: 'Hardware', qty: 12, unit: 'pcs', price: 3500, location: 'Warehouse A' },
  { id: 'INV-004', name: 'Office Chair', category: 'Furniture', qty: 8, unit: 'pcs', price: 18000, location: 'Store 1' },
  { id: 'INV-005', name: 'Printer Ink Cartridge', category: 'Supplies', qty: 3, unit: 'pcs', price: 1200, location: 'Warehouse B' },
]

const PURCHASE_REQUESTS: PurchaseRequest[] = [
  { id: 'PR-001', requestedBy: 'Priya Sharma', store: 'HQ Store', items: 'MacBook Pro × 2, USB-C Hub × 5', reason: 'New onboarding batch', status: 'Submitted', date: '23 May 2026' },
  { id: 'PR-002', requestedBy: 'Rahul Mehta', store: 'Branch Store', items: 'Office Chair × 4', reason: 'WFH policy upgrade', status: 'Approved', date: '20 May 2026' },
  { id: 'PR-003', requestedBy: 'Karan Singh', store: 'HQ Store', items: 'A4 Paper × 20 bundles', reason: 'Q2 printing needs', status: 'Draft', date: '25 May 2026' },
]

const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: 'PO-001', vendor: 'Dell India', amount: 320000, status: 'Sent', items: 'Dell XPS 15 × 2, Monitor × 3', date: '22 May 2026', delivery: '28 May 2026' },
  { id: 'PO-002', vendor: 'Office Depot', amount: 45000, status: 'Received', items: 'Office Supplies Bundle', date: '15 May 2026', delivery: '20 May 2026' },
  { id: 'PO-003', vendor: 'Apple India', amount: 580000, status: 'Partial', items: 'MacBook Air M2 × 5', date: '18 May 2026', delivery: '30 May 2026' },
]

const PR_COLOR: Record<PRStatus, 'neutral' | 'info' | 'success' | 'danger'> = {
  Draft: 'neutral', Submitted: 'info', Approved: 'success', Rejected: 'danger',
}
const PO_COLOR: Record<POStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  Draft: 'neutral', Sent: 'info', Partial: 'warning', Received: 'success', Cancelled: 'danger',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BusinessOrdersPage() {
  const [tab, setTab] = useState('inventory')
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)

  const totalInventoryValue = INVENTORY.reduce((s, i) => s + i.qty * i.price, 0)
  const lowStock = INVENTORY.filter(i => i.qty <= 5).length
  const pendingPOs = PURCHASE_ORDERS.filter(o => o.status !== 'Received' && o.status !== 'Cancelled').length

  const filteredInventory = useMemo(() =>
    INVENTORY.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase())),
    [search]
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — Business order data is illustrative. Full procurement integration is on the roadmap.</span>
      </div>

      <PageHeader
        title="Business Orders"
        description="Inventory, purchase requests, purchase orders, and goods receipts"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewModal(true)}>New</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Inventory Items" value={INVENTORY.length} icon={<Package className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Low Stock" value={lowStock} icon={<Package className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
        <StatCard label="Pending POs" value={pendingPOs} icon={<Truck className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Inventory Value" value={`₹${(totalInventoryValue / 100000).toFixed(1)}L`} icon={<ShoppingCart className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
      </div>

      <TabBar
        tabs={[
          { id: 'inventory', label: 'Inventory', count: INVENTORY.length },
          { id: 'requests', label: 'Purchase Requests', count: PURCHASE_REQUESTS.length },
          { id: 'orders', label: 'Purchase Orders', count: PURCHASE_ORDERS.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* Inventory */}
      {tab === 'inventory' && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-4">
            <SearchInput placeholder="Search inventory items..." value={search} onChange={setSearch} className="w-72" />
          </div>
          <Table>
            <Thead><tr><Th>Item</Th><Th>Category</Th><Th>Qty</Th><Th>Unit</Th><Th align="right">Unit Price</Th><Th align="right">Total Value</Th><Th>Location</Th></tr></Thead>
            <Tbody>
              {filteredInventory.map(i => (
                <Tr key={i.id}>
                  <Td>
                    <p className="text-xs font-semibold text-slate-800">{i.name}</p>
                    <p className="text-[11px] text-slate-400">{i.id}</p>
                  </Td>
                  <Td><Badge variant="neutral" size="sm">{i.category}</Badge></Td>
                  <Td>
                    <span className={`text-xs font-bold ${i.qty <= 5 ? 'text-red-600' : 'text-slate-800'}`}>{i.qty}</span>
                    {i.qty <= 5 && <span className="ml-1 text-[10px] text-red-500 font-medium">Low</span>}
                  </Td>
                  <Td><span className="text-xs text-slate-500">{i.unit}</span></Td>
                  <Td align="right"><span className="text-xs tabular-nums text-slate-700">₹{i.price.toLocaleString('en-IN')}</span></Td>
                  <Td align="right"><span className="text-xs font-semibold tabular-nums text-slate-800">₹{(i.qty * i.price).toLocaleString('en-IN')}</span></Td>
                  <Td><Badge variant="neutral" size="sm">{i.location}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Purchase Requests */}
      {tab === 'requests' && (
        <Card padding="none">
          <Table>
            <Thead><tr><Th>PR No.</Th><Th>Requested By</Th><Th>Store</Th><Th>Items</Th><Th>Reason</Th><Th>Date</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {PURCHASE_REQUESTS.map(r => (
                <Tr key={r.id}>
                  <Td><span className="font-mono text-xs font-medium text-blue-600">{r.id}</span></Td>
                  <Td><span className="text-xs font-medium text-slate-700">{r.requestedBy}</span></Td>
                  <Td><Badge variant="neutral" size="sm">{r.store}</Badge></Td>
                  <Td><span className="text-xs text-slate-500 max-w-48 truncate block">{r.items}</span></Td>
                  <Td><span className="text-xs text-slate-500 max-w-36 truncate block">{r.reason}</span></Td>
                  <Td><span className="text-xs text-slate-500">{r.date}</span></Td>
                  <Td><Badge variant={PR_COLOR[r.status]} dot size="sm">{r.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Purchase Orders */}
      {tab === 'orders' && (
        <Card padding="none">
          <Table>
            <Thead><tr><Th>PO No.</Th><Th>Vendor</Th><Th>Items</Th><Th align="right">Amount</Th><Th>Ordered</Th><Th>Expected</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {PURCHASE_ORDERS.map(o => (
                <Tr key={o.id}>
                  <Td><span className="font-mono text-xs font-medium text-blue-600">{o.id}</span></Td>
                  <Td><span className="text-xs font-semibold text-slate-800">{o.vendor}</span></Td>
                  <Td><span className="text-xs text-slate-500 max-w-48 truncate block">{o.items}</span></Td>
                  <Td align="right"><span className="text-xs font-bold tabular-nums text-slate-800">₹{o.amount.toLocaleString('en-IN')}</span></Td>
                  <Td><span className="text-xs text-slate-500">{o.date}</span></Td>
                  <Td><span className="text-xs text-slate-500">{o.delivery}</span></Td>
                  <Td><Badge variant={PO_COLOR[o.status]} dot size="sm">{o.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* New Modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title={tab === 'inventory' ? 'Add Inventory Item' : tab === 'requests' ? 'Create Purchase Request' : 'Create Purchase Order'} size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm">Create</Button>
        </>}
      >
        {tab === 'inventory' && (
          <div className="space-y-4">
            <Input label="Item Name" placeholder="e.g. MacBook Pro 14 inch" required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Category" placeholder="Hardware / Supplies / Furniture" />
              <Input label="Location" placeholder="Warehouse A / Store 1" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Quantity" type="number" min="0" />
              <Input label="Unit" placeholder="pcs / bundle" />
              <Input label="Unit Price (₹)" type="number" min="0" />
            </div>
          </div>
        )}
        {tab === 'requests' && (
          <div className="space-y-4">
            <Select label="Store" options={[{ label: 'HQ Store', value: 'hq' }, { label: 'Branch Store', value: 'branch' }]} />
            <Textarea label="Items Requested" placeholder="List items and quantities..." rows={3} required />
            <Textarea label="Reason" placeholder="Justification for the request..." rows={2} required />
          </div>
        )}
        {tab === 'orders' && (
          <div className="space-y-4">
            <Input label="Vendor Name" placeholder="e.g. Dell India" required />
            <Textarea label="Items" placeholder="List items and quantities..." rows={3} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Total Amount (₹)" type="number" min="0" />
              <Input label="Expected Delivery" type="date" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
