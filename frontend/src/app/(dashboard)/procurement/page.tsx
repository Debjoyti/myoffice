'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td, StatCard,
  TabBar, SearchInput, Modal, Input, Select, Textarea, DetailGrid, Divider, ProgressBar
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Package, ShoppingCart, Truck, CheckCircle2, Plus, Download, Star, Building2 } from 'lucide-react'

type POStatus = 'Delivered' | 'In Transit' | 'Approved' | 'Pending' | 'Draft'

type PO = {
  id: string; vendor: string; items: string; amount: number; raised: string
  expected: string; status: POStatus; category: string; approver: string
}

const POS: PO[] = [
  { id: 'PO-2026-012', vendor: 'Dell Technologies India', items: 'Laptops × 10', amount: 980000, raised: '01 May', expected: '15 May', status: 'Delivered', category: 'Hardware', approver: 'Divya Nair' },
  { id: 'PO-2026-013', vendor: 'Steelcase India', items: 'Office Chairs × 25', amount: 312500, raised: '05 May', expected: '20 May', status: 'In Transit', category: 'Furniture', approver: 'Amit Patel' },
  { id: 'PO-2026-014', vendor: 'Zebronics', items: 'Monitors × 15', amount: 225000, raised: '08 May', expected: '22 May', status: 'Approved', category: 'Hardware', approver: 'Divya Nair' },
  { id: 'PO-2026-015', vendor: 'HP India', items: 'Printers × 3', amount: 87000, raised: '10 May', expected: '25 May', status: 'Pending', category: 'Hardware', approver: 'Amit Patel' },
  { id: 'PO-2026-016', vendor: 'Amazon Business', items: 'Stationery Bundle', amount: 34000, raised: '11 May', expected: '13 May', status: 'Draft', category: 'Supplies', approver: '—' },
]

const VENDORS = [
  { name: 'Dell Technologies India', category: 'Hardware', contact: 'sales.india@dell.com', rating: 4.8, totalSpend: 4200000, activePOs: 2, status: 'Preferred' },
  { name: 'Steelcase India', category: 'Furniture', contact: 'info@steelcase.in', rating: 4.5, totalSpend: 1800000, activePOs: 1, status: 'Active' },
  { name: 'Zebronics', category: 'Peripherals', contact: 'b2b@zebronics.com', rating: 4.1, totalSpend: 650000, activePOs: 1, status: 'Active' },
  { name: 'HP India', category: 'Hardware', contact: 'business@hp.in', rating: 4.6, totalSpend: 2100000, activePOs: 1, status: 'Preferred' },
  { name: 'Amazon Business', category: 'General', contact: 'b2b@amazon.in', rating: 4.3, totalSpend: 380000, activePOs: 1, status: 'Active' },
]

const PO_STATUS: Record<POStatus, 'success' | 'info' | 'warning' | 'neutral' | 'danger'> = {
  Delivered: 'success', 'In Transit': 'info', Approved: 'info', Pending: 'warning', Draft: 'neutral',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3 w-3 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
      ))}
      <span className="text-xs text-slate-500 ml-1">{rating}</span>
    </div>
  )
}

export default function ProcurementPage() {
  const [tab, setTab] = useState('po')
  const [search, setSearch] = useState('')
  const [newPO, setNewPO] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PO | null>(null)

  const totalSpend = POS.filter(p => p.status !== 'Draft').reduce((s, p) => s + p.amount, 0)
  const openPOs = POS.filter(p => ['Pending', 'Approved', 'In Transit'].includes(p.status)).length
  const inTransit = POS.filter(p => p.status === 'In Transit').length
  const delivered = POS.filter(p => p.status === 'Delivered').length

  const filteredPOs = useMemo(() =>
    POS.filter(p => !search || p.vendor.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())), [search])

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Procurement"
        description="Purchase orders, vendor management, and spend analytics"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewPO(true)}>New PO</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Spend MTD" value={formatCurrency(totalSpend)} delta={{ value: '12.4%', positive: false }} icon={<ShoppingCart className="h-4 w-4" />} />
        <StatCard label="Open POs" value={openPOs} icon={<Package className="h-4 w-4" />} iconColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
        <StatCard label="In Transit" value={inTransit} icon={<Truck className="h-4 w-4" />} iconColor="bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400" />
        <StatCard label="Delivered" value={delivered} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
      </div>

      <TabBar
        tabs={[
          { id: 'po', label: 'Purchase Orders', count: POS.length },
          { id: 'vendors', label: 'Vendors', count: VENDORS.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'po' && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-4">
            <SearchInput placeholder="Search POs or vendors..." value={search} onChange={setSearch} className="w-72" />
          </div>
          <Table>
            <Thead>
              <tr><Th>PO Number</Th><Th>Vendor</Th><Th>Items</Th><Th>Raised</Th><Th>Expected</Th><Th align="right">Amount</Th><Th>Approver</Th><Th>Status</Th></tr>
            </Thead>
            <Tbody>
              {filteredPOs.map(po => (
                <Tr key={po.id} onClick={() => setSelectedPO(po)}>
                  <Td><span className="font-mono text-xs font-medium text-indigo-600">{po.id}</span></Td>
                  <Td><span className="font-medium text-slate-800 dark:text-slate-200">{po.vendor}</span></Td>
                  <Td><span className="text-xs text-slate-500">{po.items}</span></Td>
                  <Td><span className="text-xs text-slate-500">{po.raised}</span></Td>
                  <Td><span className="text-xs text-slate-500">{po.expected}</span></Td>
                  <Td align="right"><span className="data-value font-medium">{formatCurrency(po.amount)}</span></Td>
                  <Td><span className="text-xs text-slate-500">{po.approver}</span></Td>
                  <Td><Badge variant={PO_STATUS[po.status]}>{po.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500">Total committed spend: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(totalSpend)}</span></p>
          </div>
        </Card>
      )}

      {tab === 'vendors' && (
        <Card padding="none">
          <Table>
            <Thead>
              <tr><Th>Vendor</Th><Th>Category</Th><Th>Rating</Th><Th>Active POs</Th><Th align="right">Total Spend</Th><Th>Status</Th></tr>
            </Thead>
            <Tbody>
              {VENDORS.map(v => (
                <Tr key={v.name}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{v.name}</p>
                        <p className="text-xs text-slate-400">{v.contact}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><Badge variant="neutral" size="sm">{v.category}</Badge></Td>
                  <Td><StarRating rating={v.rating} /></Td>
                  <Td><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{v.activePOs}</span></Td>
                  <Td align="right"><span className="data-value font-medium">{formatCurrency(v.totalSpend)}</span></Td>
                  <Td>
                    <Badge variant={v.status === 'Preferred' ? 'default' : 'neutral'} dot>
                      {v.status}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* PO Detail Modal */}
      <Modal open={!!selectedPO} onClose={() => setSelectedPO(null)} title="Purchase Order" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelectedPO(null)}>Close</Button>
          {selectedPO?.status === 'Pending' && <Button size="sm">Approve PO</Button>}
          {selectedPO?.status === 'Approved' && <Button size="sm">Confirm Receipt (GRN)</Button>}
        </>}
      >
        {selectedPO && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-indigo-600">{selectedPO.id}</span>
              <Badge variant={PO_STATUS[selectedPO.status]}>{selectedPO.status}</Badge>
            </div>
            <Divider />
            <DetailGrid items={[
              { label: 'Vendor', value: selectedPO.vendor },
              { label: 'Category', value: selectedPO.category },
              { label: 'Items', value: selectedPO.items },
              { label: 'Amount', value: <span className="font-bold text-indigo-600">{formatCurrency(selectedPO.amount)}</span> },
              { label: 'Raised On', value: selectedPO.raised },
              { label: 'Expected', value: selectedPO.expected },
              { label: 'Approver', value: selectedPO.approver },
            ]} />
          </div>
        )}
      </Modal>

      {/* New PO Modal */}
      <Modal open={newPO} onClose={() => setNewPO(false)} title="Create Purchase Order" size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewPO(false)}>Cancel</Button>
          <Button variant="secondary" size="sm">Save Draft</Button>
          <Button size="sm">Submit for Approval</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Vendor" options={VENDORS.map(v => ({ label: v.name, value: v.name }))} />
            <Select label="Category" options={['Hardware', 'Software', 'Furniture', 'Supplies', 'Services'].map(c => ({ label: c, value: c }))} />
            <Input label="Expected Delivery" type="date" />
            <Input label="Total Amount (₹)" type="number" placeholder="500000" />
          </div>
          <Textarea label="Items Description" placeholder="e.g. 10 × Dell Latitude 5540 Laptops (16GB RAM, 512GB SSD)" rows={3} required />
          <Textarea label="Justification" placeholder="Business justification for this purchase..." rows={2} />
        </div>
      </Modal>
    </div>
  )
}
