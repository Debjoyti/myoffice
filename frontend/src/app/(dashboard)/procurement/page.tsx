'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td, StatCard,
  TabBar, SearchInput, Modal, Input, Select, Textarea, DetailGrid, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  Package, ShoppingCart, Truck, CheckCircle2, Plus, Download,
  Star, Building2, FlaskConical, RefreshCw
} from 'lucide-react'

// ─── Fallback mock data ──────────────────────────────────────────────────────
const MOCK_POS = [
  { id: 'po-1', po_number: 'PO-2026-012', vendor: { name: 'Dell Technologies India', id: 'v1' }, total_amount: 980000, order_date: '2026-05-01', expected_delivery: '2026-05-15', status: 'received' },
  { id: 'po-2', po_number: 'PO-2026-013', vendor: { name: 'Steelcase India', id: 'v2' }, total_amount: 312500, order_date: '2026-05-05', expected_delivery: '2026-05-20', status: 'issued' },
  { id: 'po-3', po_number: 'PO-2026-014', vendor: { name: 'Zebronics', id: 'v3' }, total_amount: 225000, order_date: '2026-05-08', expected_delivery: '2026-05-22', status: 'issued' },
  { id: 'po-4', po_number: 'PO-2026-015', vendor: { name: 'HP India', id: 'v4' }, total_amount: 87000, order_date: '2026-05-10', expected_delivery: '2026-05-25', status: 'draft' },
  { id: 'po-5', po_number: 'PO-2026-016', vendor: { name: 'Amazon Business', id: 'v5' }, total_amount: 34000, order_date: '2026-05-11', expected_delivery: '2026-05-13', status: 'draft' },
]

const MOCK_VENDORS = [
  { id: 'v1', name: 'Dell Technologies India', contact_email: 'sales.india@dell.com', status: 'active', created_at: '2025-01-01' },
  { id: 'v2', name: 'Steelcase India', contact_email: 'info@steelcase.in', status: 'active', created_at: '2025-01-01' },
  { id: 'v3', name: 'Zebronics', contact_email: 'b2b@zebronics.com', status: 'active', created_at: '2025-01-01' },
  { id: 'v4', name: 'HP India', contact_email: 'business@hp.in', status: 'active', created_at: '2025-01-01' },
  { id: 'v5', name: 'Amazon Business', contact_email: 'b2b@amazon.in', status: 'active', created_at: '2025-01-01' },
]

// ─── Types ──────────────────────────────────────────────────────────────────
type PO = {
  id: string; po_number: string
  vendor: { id: string; name: string } | null
  total_amount: number; order_date: string; expected_delivery?: string; status: string
}
type Vendor = { id: string; name: string; contact_email?: string; contact_phone?: string; status: string; created_at: string }

const PO_STATUS: Record<string, 'success' | 'info' | 'warning' | 'neutral' | 'danger'> = {
  received: 'success', issued: 'info', partially_received: 'info', draft: 'neutral', cancelled: 'danger', closed: 'neutral',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusLabel(status: string) {
  const map: Record<string, string> = {
    received: 'Delivered', issued: 'Issued', partially_received: 'Partial', draft: 'Draft', cancelled: 'Cancelled', closed: 'Closed',
  }
  return map[status] ?? status
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function ProcurementPage() {
  const [tab, setTab] = useState('po')
  const [search, setSearch] = useState('')
  const [newPO, setNewPO] = useState(false)
  const [newVendor, setNewVendor] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PO | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(false)
  const [orders, setOrders] = useState<PO[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [vendorForm, setVendorForm] = useState({ name: '', contact_email: '', contact_phone: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/procurement')
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      const hasData = data.orders?.length > 0 || data.vendors?.length > 0
      if (hasData) {
        setOrders(data.orders ?? [])
        setVendors(data.vendors ?? [])
        setIsPreview(false)
      } else {
        setOrders(MOCK_POS as any)
        setVendors(MOCK_VENDORS)
        setIsPreview(true)
      }
    } catch {
      setOrders(MOCK_POS as any)
      setVendors(MOCK_VENDORS)
      setIsPreview(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddVendor = async () => {
    if (!vendorForm.name) return
    setSaving(true)
    try {
      const res = await fetch('/api/v1/procurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'vendor', ...vendorForm }),
      })
      if (res.ok) {
        setNewVendor(false)
        setVendorForm({ name: '', contact_email: '', contact_phone: '' })
        fetchData()
      }
    } finally {
      setSaving(false)
    }
  }

  const totalSpend = useMemo(() => orders.filter(p => p.status !== 'draft').reduce((s, p) => s + Number(p.total_amount), 0), [orders])
  const openPOs = useMemo(() => orders.filter(p => ['draft', 'issued'].includes(p.status)).length, [orders])
  const inTransit = useMemo(() => orders.filter(p => p.status === 'issued').length, [orders])
  const delivered = useMemo(() => orders.filter(p => ['received', 'closed'].includes(p.status)).length, [orders])

  const filteredPOs = useMemo(() =>
    orders.filter(p => !search ||
      (p.vendor?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      p.po_number.toLowerCase().includes(search.toLowerCase())
    ), [orders, search])

  return (
    <div className="space-y-6 animate-fadeIn">
      {isPreview && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
          <span><strong>Preview mode</strong> — Procurement data is illustrative. Create your first PO to see live data.</span>
        </div>
      )}

      <PageHeader
        title="Procurement"
        description="Purchase orders, vendor management, and spend analytics"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchData}>Refresh</Button>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewPO(true)}>New PO</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Spend MTD" value={formatCurrency(totalSpend)} icon={<ShoppingCart className="h-4 w-4" />} />
        <StatCard label="Open POs" value={openPOs} icon={<Package className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="In Transit" value={inTransit} icon={<Truck className="h-4 w-4" />} iconColor="bg-sky-50 text-sky-600" />
        <StatCard label="Delivered" value={delivered} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
      </div>

      <TabBar
        tabs={[
          { id: 'po', label: 'Purchase Orders', count: orders.length },
          { id: 'vendors', label: 'Vendors', count: vendors.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'po' && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-4">
            <SearchInput placeholder="Search POs or vendors..." value={search} onChange={setSearch} className="w-72" />
          </div>
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading purchase orders…</div>
          ) : (
            <>
              <Table>
                <Thead>
                  <tr><Th>PO Number</Th><Th>Vendor</Th><Th>Raised</Th><Th>Expected</Th><Th align="right">Amount</Th><Th>Status</Th></tr>
                </Thead>
                <Tbody>
                  {filteredPOs.length === 0 ? (
                    <Tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No purchase orders yet</td></Tr>
                  ) : filteredPOs.map(po => (
                    <Tr key={po.id} onClick={() => setSelectedPO(po)}>
                      <Td><span className="font-mono text-xs font-medium text-blue-600">{po.po_number}</span></Td>
                      <Td><span className="font-medium text-slate-800">{po.vendor?.name ?? '—'}</span></Td>
                      <Td><span className="text-xs text-slate-500">{fmtDate(po.order_date)}</span></Td>
                      <Td><span className="text-xs text-slate-500">{po.expected_delivery ? fmtDate(po.expected_delivery) : '—'}</span></Td>
                      <Td align="right"><span className="data-value font-medium">{formatCurrency(Number(po.total_amount))}</span></Td>
                      <Td><Badge variant={PO_STATUS[po.status] ?? 'neutral'}>{StatusLabel(po.status)}</Badge></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">Total committed spend: <span className="font-semibold text-slate-700">{formatCurrency(totalSpend)}</span></p>
              </div>
            </>
          )}
        </Card>
      )}

      {tab === 'vendors' && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Registered Vendors</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewVendor(true)}>Add Vendor</Button>
          </div>
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading vendors…</div>
          ) : (
            <Table>
              <Thead>
                <tr><Th>Vendor</Th><Th>Contact</Th><Th>Active POs</Th><Th>Status</Th></tr>
              </Thead>
              <Tbody>
                {vendors.length === 0 ? (
                  <Tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">No vendors yet</td></Tr>
                ) : vendors.map(v => (
                  <Tr key={v.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        <span className="font-medium text-slate-800 text-sm">{v.name}</span>
                      </div>
                    </Td>
                    <Td><span className="text-xs text-slate-500">{v.contact_email ?? '—'}</span></Td>
                    <Td>
                      <span className="text-sm font-medium text-slate-700">
                        {orders.filter(o => o.vendor?.id === v.id && ['draft', 'issued'].includes(o.status)).length}
                      </span>
                    </Td>
                    <Td>
                      <Badge variant={v.status === 'active' ? 'success' : 'neutral'} dot>
                        {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {/* PO Detail Modal */}
      <Modal open={!!selectedPO} onClose={() => setSelectedPO(null)} title="Purchase Order" size="md"
        footer={<Button variant="ghost" size="sm" onClick={() => setSelectedPO(null)}>Close</Button>}
      >
        {selectedPO && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-blue-600">{selectedPO.po_number}</span>
              <Badge variant={PO_STATUS[selectedPO.status] ?? 'neutral'}>{StatusLabel(selectedPO.status)}</Badge>
            </div>
            <Divider />
            <DetailGrid items={[
              { label: 'Vendor', value: selectedPO.vendor?.name ?? '—' },
              { label: 'Amount', value: <span className="font-bold text-blue-600">{formatCurrency(Number(selectedPO.total_amount))}</span> },
              { label: 'Order Date', value: fmtDate(selectedPO.order_date) },
              { label: 'Expected', value: selectedPO.expected_delivery ? fmtDate(selectedPO.expected_delivery) : '—' },
            ]} />
          </div>
        )}
      </Modal>

      {/* Add Vendor Modal */}
      <Modal open={newVendor} onClose={() => setNewVendor(false)} title="Add Vendor" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewVendor(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleAddVendor}>Save Vendor</Button>
        </>}
      >
        <div className="space-y-4">
          <Input label="Vendor Name" placeholder="e.g. Dell Technologies India" required value={vendorForm.name} onChange={e => setVendorForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Contact Email" type="email" placeholder="sales@vendor.com" value={vendorForm.contact_email} onChange={e => setVendorForm(f => ({ ...f, contact_email: e.target.value }))} />
          <Input label="Contact Phone" placeholder="+91 98765 43210" value={vendorForm.contact_phone} onChange={e => setVendorForm(f => ({ ...f, contact_phone: e.target.value }))} />
        </div>
      </Modal>

      {/* New PO Modal */}
      <Modal open={newPO} onClose={() => setNewPO(false)} title="Create Purchase Order" size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewPO(false)}>Cancel</Button>
          <Button size="sm">Save Draft</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Vendor" options={[{ label: 'Select vendor', value: '' }, ...vendors.map(v => ({ label: v.name, value: v.id }))]} />
            <Input label="PO Number" placeholder="PO-2026-001" />
            <Input label="Expected Delivery" type="date" />
            <Input label="Total Amount (₹)" type="number" placeholder="500000" />
          </div>
          <Textarea label="Items Description" placeholder="e.g. 10 × Dell Latitude 5540 Laptops (16GB RAM, 512GB SSD)" rows={3} />
        </div>
      </Modal>
    </div>
  )
}
