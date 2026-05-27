'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, TabBar, Modal, Input, Select, Textarea, EmptyState, Alert
} from '@/components/ui'
import { Package, ShoppingCart, Truck, Plus, FlaskConical } from 'lucide-react'

type InventoryItem = { id: string; name: string; category: string; qty: number; unit: string; price: number; location: string }
type PRStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected'
type POStatus = 'Draft' | 'Sent' | 'Partial' | 'Received' | 'Cancelled'

type PurchaseRequest = { id: string; requestedBy: string; store: string; items: string; reason: string; status: PRStatus; date: string }
type PurchaseOrder = { id: string; vendor: string; amount: number; status: POStatus; items: string; date: string; delivery: string }

const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'INV-001', name: 'MacBook Pro 14"', category: 'Hardware', qty: 5, unit: 'pcs', price: 145000, location: 'Warehouse A' },
  { id: 'INV-002', name: 'A4 Paper Bundle', category: 'Supplies', qty: 45, unit: 'bundle', price: 450, location: 'Warehouse B' },
  { id: 'INV-003', name: 'USB-C Hub', category: 'Hardware', qty: 12, unit: 'pcs', price: 3500, location: 'Warehouse A' },
  { id: 'INV-004', name: 'Office Chair', category: 'Furniture', qty: 8, unit: 'pcs', price: 18000, location: 'Store 1' },
  { id: 'INV-005', name: 'Printer Ink Cartridge', category: 'Supplies', qty: 3, unit: 'pcs', price: 1200, location: 'Warehouse B' },
]

const MOCK_PURCHASE_REQUESTS: PurchaseRequest[] = [
  { id: 'PR-001', requestedBy: 'Priya Sharma', store: 'HQ Store', items: 'MacBook Pro × 2, USB-C Hub × 5', reason: 'New onboarding batch', status: 'Submitted', date: '23 May 2026' },
  { id: 'PR-002', requestedBy: 'Rahul Mehta', store: 'Branch Store', items: 'Office Chair × 4', reason: 'WFH policy upgrade', status: 'Approved', date: '20 May 2026' },
  { id: 'PR-003', requestedBy: 'Karan Singh', store: 'HQ Store', items: 'A4 Paper × 20 bundles', reason: 'Q2 printing needs', status: 'Draft', date: '25 May 2026' },
]

const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
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

const INITIAL_INV = { name: '', category: '', location: '', qty: '', unit: 'pcs', price: '' }
const INITIAL_REQ = { store: 'hq', items: '', reason: '' }
const INITIAL_PO = { vendor: '', items: '', amount: '', delivery: '' }

function todayStr() {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function BusinessOrdersPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY)
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(MOCK_PURCHASE_REQUESTS)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(MOCK_PURCHASE_ORDERS)

  const [tab, setTab] = useState('inventory')
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [invForm, setInvForm] = useState(INITIAL_INV)
  const [reqForm, setReqForm] = useState(INITIAL_REQ)
  const [poForm, setPoForm] = useState(INITIAL_PO)

  const totalInventoryValue = inventory.reduce((s, i) => s + i.qty * i.price, 0)
  const lowStock = inventory.filter(i => i.qty <= 5).length
  const pendingPOs = purchaseOrders.filter(o => o.status !== 'Received' && o.status !== 'Cancelled').length

  const filteredInventory = useMemo(() =>
    inventory.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase())),
    [inventory, search]
  )

  const handleCreate = async () => {
    setSaving(true)
    setFormError('')
    try {
      if (tab === 'inventory') {
        if (!invForm.name.trim()) { setFormError('Item name is required'); setSaving(false); return }
        await new Promise(r => setTimeout(r, 400))
        setInventory(prev => [...prev, {
          id: `INV-${String(prev.length + 1).padStart(3, '0')}`,
          name: invForm.name.trim(),
          category: invForm.category.trim() || 'Other',
          qty: Number(invForm.qty) || 0,
          unit: invForm.unit.trim() || 'pcs',
          price: Number(invForm.price) || 0,
          location: invForm.location.trim() || 'Warehouse A',
        }])
        setInvForm(INITIAL_INV)
      } else if (tab === 'requests') {
        if (!reqForm.items.trim()) { setFormError('Items are required'); setSaving(false); return }
        if (!reqForm.reason.trim()) { setFormError('Reason is required'); setSaving(false); return }
        await new Promise(r => setTimeout(r, 400))
        const storeLabel = reqForm.store === 'hq' ? 'HQ Store' : 'Branch Store'
        setPurchaseRequests(prev => [...prev, {
          id: `PR-${String(prev.length + 1).padStart(3, '0')}`,
          requestedBy: 'You',
          store: storeLabel,
          items: reqForm.items.trim(),
          reason: reqForm.reason.trim(),
          status: 'Draft',
          date: todayStr(),
        }])
        setReqForm(INITIAL_REQ)
      } else {
        if (!poForm.vendor.trim()) { setFormError('Vendor name is required'); setSaving(false); return }
        if (!poForm.items.trim()) { setFormError('Items are required'); setSaving(false); return }
        await new Promise(r => setTimeout(r, 400))
        let delivery = poForm.delivery
        try { if (delivery) delivery = new Date(delivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
        catch { /* keep raw */ }
        setPurchaseOrders(prev => [...prev, {
          id: `PO-${String(prev.length + 1).padStart(3, '0')}`,
          vendor: poForm.vendor.trim(),
          amount: Number(poForm.amount) || 0,
          status: 'Draft',
          items: poForm.items.trim(),
          date: todayStr(),
          delivery: delivery || '—',
        }])
        setPoForm(INITIAL_PO)
      }
      setNewModal(false)
    } finally {
      setSaving(false)
    }
  }

  const modalTitle = tab === 'inventory' ? 'Add Inventory Item' : tab === 'requests' ? 'Create Purchase Request' : 'Create Purchase Order'

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — Business order data is illustrative. Full procurement integration is on the roadmap.</span>
      </div>

      <PageHeader
        title="Business Orders"
        description="Inventory, purchase requests, purchase orders, and goods receipts"
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setNewModal(true); setFormError('') }}>
            New
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Inventory Items" value={inventory.length} icon={<Package className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Low Stock" value={lowStock} icon={<Package className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
        <StatCard label="Pending POs" value={pendingPOs} icon={<Truck className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Inventory Value" value={`₹${(totalInventoryValue / 100000).toFixed(1)}L`} icon={<ShoppingCart className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
      </div>

      <TabBar
        tabs={[
          { id: 'inventory', label: 'Inventory', count: inventory.length },
          { id: 'requests', label: 'Purchase Requests', count: purchaseRequests.length },
          { id: 'orders', label: 'Purchase Orders', count: purchaseOrders.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'inventory' && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-4">
            <SearchInput placeholder="Search inventory items..." value={search} onChange={setSearch} className="w-72" />
          </div>
          {filteredInventory.length === 0 ? (
            <div className="py-10"><EmptyState icon={<Package className="h-6 w-6" />} title="No inventory items found" /></div>
          ) : (
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
          )}
        </Card>
      )}

      {tab === 'requests' && (
        <Card padding="none">
          {purchaseRequests.length === 0 ? (
            <div className="py-10"><EmptyState icon={<Package className="h-6 w-6" />} title="No purchase requests" /></div>
          ) : (
            <Table>
              <Thead><tr><Th>PR No.</Th><Th>Requested By</Th><Th>Store</Th><Th>Items</Th><Th>Reason</Th><Th>Date</Th><Th>Status</Th></tr></Thead>
              <Tbody>
                {purchaseRequests.map(r => (
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
          )}
        </Card>
      )}

      {tab === 'orders' && (
        <Card padding="none">
          {purchaseOrders.length === 0 ? (
            <div className="py-10"><EmptyState icon={<Truck className="h-6 w-6" />} title="No purchase orders" /></div>
          ) : (
            <Table>
              <Thead><tr><Th>PO No.</Th><Th>Vendor</Th><Th>Items</Th><Th align="right">Amount</Th><Th>Ordered</Th><Th>Expected</Th><Th>Status</Th></tr></Thead>
              <Tbody>
                {purchaseOrders.map(o => (
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
          )}
        </Card>
      )}

      <Modal
        open={newModal}
        onClose={() => { setNewModal(false); setFormError('') }}
        title={modalTitle}
        size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleCreate}>Create</Button>
        </>}
      >
        {tab === 'inventory' && (
          <div className="space-y-4">
            {formError && <Alert variant="danger">{formError}</Alert>}
            <Input
              label="Item Name"
              placeholder="e.g. MacBook Pro 14 inch"
              required
              value={invForm.name}
              onChange={e => setInvForm(f => ({ ...f, name: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Category"
                placeholder="Hardware / Supplies / Furniture"
                value={invForm.category}
                onChange={e => setInvForm(f => ({ ...f, category: e.target.value }))}
              />
              <Input
                label="Location"
                placeholder="Warehouse A / Store 1"
                value={invForm.location}
                onChange={e => setInvForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Quantity"
                type="number"
                min="0"
                value={invForm.qty}
                onChange={e => setInvForm(f => ({ ...f, qty: e.target.value }))}
              />
              <Input
                label="Unit"
                placeholder="pcs / bundle"
                value={invForm.unit}
                onChange={e => setInvForm(f => ({ ...f, unit: e.target.value }))}
              />
              <Input
                label="Unit Price (₹)"
                type="number"
                min="0"
                value={invForm.price}
                onChange={e => setInvForm(f => ({ ...f, price: e.target.value }))}
              />
            </div>
          </div>
        )}
        {tab === 'requests' && (
          <div className="space-y-4">
            {formError && <Alert variant="danger">{formError}</Alert>}
            <Select
              label="Store"
              options={[{ label: 'HQ Store', value: 'hq' }, { label: 'Branch Store', value: 'branch' }]}
              value={reqForm.store}
              onChange={e => setReqForm(f => ({ ...f, store: (e.target as HTMLSelectElement).value }))}
            />
            <Textarea
              label="Items Requested"
              placeholder="List items and quantities..."
              rows={3}
              required
              value={reqForm.items}
              onChange={e => setReqForm(f => ({ ...f, items: e.target.value }))}
            />
            <Textarea
              label="Reason"
              placeholder="Justification for the request..."
              rows={2}
              required
              value={reqForm.reason}
              onChange={e => setReqForm(f => ({ ...f, reason: e.target.value }))}
            />
          </div>
        )}
        {tab === 'orders' && (
          <div className="space-y-4">
            {formError && <Alert variant="danger">{formError}</Alert>}
            <Input
              label="Vendor Name"
              placeholder="e.g. Dell India"
              required
              value={poForm.vendor}
              onChange={e => setPoForm(f => ({ ...f, vendor: e.target.value }))}
            />
            <Textarea
              label="Items"
              placeholder="List items and quantities..."
              rows={3}
              required
              value={poForm.items}
              onChange={e => setPoForm(f => ({ ...f, items: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Total Amount (₹)"
                type="number"
                min="0"
                value={poForm.amount}
                onChange={e => setPoForm(f => ({ ...f, amount: e.target.value }))}
              />
              <Input
                label="Expected Delivery"
                type="date"
                value={poForm.delivery}
                onChange={e => setPoForm(f => ({ ...f, delivery: e.target.value }))}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
