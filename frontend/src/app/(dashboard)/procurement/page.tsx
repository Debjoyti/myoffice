'use client'

import { useState } from 'react'
import { PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td, StatCard, TabBar, SearchInput, Modal, Input, Select } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Package, ShoppingCart, Truck, CheckCircle2, Plus, Download, FileText } from 'lucide-react'

const PURCHASE_ORDERS = [
  { id: 'PO-2026-012', vendor: 'Dell Technologies India', items: 'Laptops × 10', amount: 980000, raised: '01 May', expected: '15 May', status: 'Delivered' },
  { id: 'PO-2026-013', vendor: 'Steelcase India', items: 'Office Chairs × 25', amount: 312500, raised: '05 May', expected: '20 May', status: 'In Transit' },
  { id: 'PO-2026-014', vendor: 'Zebronics', items: 'Monitors × 15', amount: 225000, raised: '08 May', expected: '22 May', status: 'Approved' },
  { id: 'PO-2026-015', vendor: 'HP India', items: 'Printers × 3', amount: 87000, raised: '10 May', expected: '25 May', status: 'Pending' },
  { id: 'PO-2026-016', vendor: 'Amazon Business', items: 'Stationery Bundle', amount: 34000, raised: '11 May', expected: '13 May', status: 'Draft' },
]

const VENDORS = [
  { name: 'Dell Technologies India', category: 'Hardware', contact: 'sales.india@dell.com', rating: 4.8, totalSpend: 4200000, status: 'Preferred' },
  { name: 'Steelcase India', category: 'Furniture', contact: 'info@steelcase.in', rating: 4.5, totalSpend: 1800000, status: 'Active' },
  { name: 'Zebronics', category: 'Peripherals', contact: 'b2b@zebronics.com', rating: 4.1, totalSpend: 650000, status: 'Active' },
  { name: 'HP India', category: 'Hardware', contact: 'business@hp.in', rating: 4.6, totalSpend: 2100000, status: 'Preferred' },
]

const PO_STATUS: Record<string, 'success' | 'info' | 'warning' | 'neutral' | 'danger'> = {
  Delivered: 'success', 'In Transit': 'info', Approved: 'info', Pending: 'warning', Draft: 'neutral',
}

export default function ProcurementPage() {
  const [tab, setTab] = useState('po')
  const [search, setSearch] = useState('')
  const [newPO, setNewPO] = useState(false)

  const totalSpend = PURCHASE_ORDERS.filter(p => p.status !== 'Draft').reduce((s, p) => s + p.amount, 0)

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
        <StatCard label="Open POs" value={PURCHASE_ORDERS.filter(p => ['Pending', 'Approved', 'In Transit'].includes(p.status)).length} icon={<Package className="h-4 w-4" />} iconColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" />
        <StatCard label="In Transit" value={PURCHASE_ORDERS.filter(p => p.status === 'In Transit').length} icon={<Truck className="h-4 w-4" />} iconColor="bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400" />
        <StatCard label="Delivered" value={PURCHASE_ORDERS.filter(p => p.status === 'Delivered').length} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-4 pb-3">
          <SearchInput placeholder={tab === 'po' ? 'Search purchase orders...' : 'Search vendors...'} value={search} onChange={setSearch} className="w-72" />
        </div>

        <TabBar
          tabs={[{ id: 'po', label: 'Purchase Orders', count: PURCHASE_ORDERS.length }, { id: 'vendors', label: 'Vendors', count: VENDORS.length }]}
          active={tab} onChange={setTab}
        />

        {tab === 'po' && (
          <Table>
            <Thead>
              <tr>
                <Th>PO Number</Th>
                <Th>Vendor</Th>
                <Th>Items</Th>
                <Th>Raised</Th>
                <Th>Expected</Th>
                <Th align="right">Amount</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {PURCHASE_ORDERS.filter(p => !search || p.vendor.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())).map(po => (
                <Tr key={po.id}>
                  <Td><span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">{po.id}</span></Td>
                  <Td><span className="font-medium text-slate-800 dark:text-slate-200">{po.vendor}</span></Td>
                  <Td><span className="text-slate-500 text-xs">{po.items}</span></Td>
                  <Td><span className="text-slate-500">{po.raised}</span></Td>
                  <Td><span className="text-slate-500">{po.expected}</span></Td>
                  <Td align="right"><span className="font-semibold data-value">{formatCurrency(po.amount)}</span></Td>
                  <Td><Badge variant={PO_STATUS[po.status]} dot>{po.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" leftIcon={<FileText className="h-3 w-3" />}>View</Button>
                      {po.status === 'Pending' && <Button variant="outline" size="sm">Approve</Button>}
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        {tab === 'vendors' && (
          <Table>
            <Thead>
              <tr>
                <Th>Vendor Name</Th>
                <Th>Category</Th>
                <Th>Contact</Th>
                <Th align="right">Rating</Th>
                <Th align="right">Total Spend</Th>
                <Th>Status</Th>
              </tr>
            </Thead>
            <Tbody>
              {VENDORS.filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase())).map(v => (
                <Tr key={v.name}>
                  <Td><span className="font-medium text-slate-800 dark:text-slate-200">{v.name}</span></Td>
                  <Td><Badge variant="neutral">{v.category}</Badge></Td>
                  <Td><span className="text-slate-500 text-xs">{v.contact}</span></Td>
                  <Td align="right">
                    <span className="font-medium text-amber-600">★ {v.rating}</span>
                  </Td>
                  <Td align="right"><span className="font-semibold data-value">{formatCurrency(v.totalSpend)}</span></Td>
                  <Td><Badge variant={v.status === 'Preferred' ? 'success' : 'neutral'} dot>{v.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500">{tab === 'po' ? `${PURCHASE_ORDERS.length} purchase orders` : `${VENDORS.length} vendors`}</p>
        </div>
      </Card>

      <Modal open={newPO} onClose={() => setNewPO(false)} title="Create Purchase Order">
        <form className="space-y-4">
          <Select label="Vendor" options={VENDORS.map(v => ({ label: v.name, value: v.name }))} />
          <Input label="Items / Description" placeholder="e.g. Laptops × 10, Dell XPS 15" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Expected Amount (₹)" type="number" placeholder="500000" />
            <Input label="Expected Delivery" type="date" />
          </div>
          <Input label="Notes" placeholder="Additional notes..." />
          <div className="flex gap-2 pt-1">
            <Button size="sm">Create PO</Button>
            <Button variant="ghost" size="sm" type="button" onClick={() => setNewPO(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
