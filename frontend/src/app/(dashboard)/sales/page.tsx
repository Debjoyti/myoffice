'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  ShoppingCart, Plus, Download, Eye, Edit2, TrendingUp, Users,
  FileText, CheckCircle2, Clock, AlertCircle, Send, Package
} from 'lucide-react'

const MOCK_QUOTATIONS = [
  { id: 'QT-2026-018', customer: 'Tata Motors Ltd', date: '2026-05-25', valid_until: '2026-06-25', items: 5, amount: 1250000, status: 'sent' },
  { id: 'QT-2026-017', customer: 'Mahindra & Mahindra', date: '2026-05-20', valid_until: '2026-06-20', items: 3, amount: 875000, status: 'accepted' },
  { id: 'QT-2026-016', customer: 'Bajaj Auto', date: '2026-05-15', valid_until: '2026-06-15', items: 8, amount: 2100000, status: 'draft' },
  { id: 'QT-2026-015', customer: 'Hero MotoCorp', date: '2026-05-10', valid_until: '2026-06-10', items: 4, amount: 640000, status: 'rejected' },
]

const MOCK_ORDERS = [
  { id: 'SO-2026-031', customer: 'Mahindra & Mahindra', order_date: '2026-05-22', delivery_date: '2026-06-10', items: 3, amount: 875000, delivered: 0, status: 'confirmed' },
  { id: 'SO-2026-030', customer: 'Tata Consultancy Services', order_date: '2026-05-18', delivery_date: '2026-05-30', items: 2, amount: 480000, delivered: 480000, status: 'delivered' },
  { id: 'SO-2026-029', customer: 'Infosys Ltd', order_date: '2026-05-15', delivery_date: '2026-05-28', items: 4, amount: 320000, delivered: 160000, status: 'partial' },
  { id: 'SO-2026-028', customer: 'Wipro Technologies', order_date: '2026-05-10', delivery_date: '2026-05-25', items: 3, amount: 215000, delivered: 215000, status: 'delivered' },
  { id: 'SO-2026-027', customer: 'HCL Technologies', order_date: '2026-05-08', delivery_date: '2026-06-08', items: 6, amount: 560000, delivered: 0, status: 'confirmed' },
]

const MOCK_DELIVERIES = [
  { id: 'DO-2026-021', so: 'SO-2026-030', customer: 'Tata Consultancy Services', date: '2026-05-30', items: 2, status: 'delivered', lr_no: 'LR12345' },
  { id: 'DO-2026-020', so: 'SO-2026-029', customer: 'Infosys Ltd', date: '2026-05-27', items: 2, status: 'in_transit', lr_no: 'LR12340' },
  { id: 'DO-2026-019', so: 'SO-2026-028', customer: 'Wipro Technologies', date: '2026-05-25', items: 3, status: 'delivered', lr_no: 'LR12338' },
]

const MOCK_CUSTOMERS = [
  { id: 'CUS-001', name: 'Tata Motors Ltd', gstin: '27AAACT2727Q1ZW', type: 'Enterprise', credit_limit: 5000000, outstanding: 1250000, orders: 8 },
  { id: 'CUS-002', name: 'Mahindra & Mahindra', gstin: '27AAACM3025F1ZO', type: 'Enterprise', credit_limit: 3000000, outstanding: 875000, orders: 12 },
  { id: 'CUS-003', name: 'Tata Consultancy Services', gstin: '27AAACT2727Q1ZW', type: 'Enterprise', credit_limit: 10000000, outstanding: 480000, orders: 25 },
  { id: 'CUS-004', name: 'Infosys Ltd', gstin: '29AABCI1681G1ZF', type: 'Enterprise', credit_limit: 8000000, outstanding: 320000, orders: 18 },
]

const STATUS_VARIANT: Record<string, any> = {
  draft: 'neutral', sent: 'info', accepted: 'success', rejected: 'danger',
  confirmed: 'info', delivered: 'success', partial: 'warning',
  in_transit: 'warning',
}

export default function SalesPage() {
  const [tab, setTab] = useState('orders')
  const [search, setSearch] = useState('')
  const [newQuote, setNewQuote] = useState(false)
  const [newOrder, setNewOrder] = useState(false)

  const totalOrders = MOCK_ORDERS.reduce((s, o) => s + o.amount, 0)
  const totalDelivered = MOCK_ORDERS.reduce((s, o) => s + o.delivered, 0)
  const pendingDelivery = MOCK_ORDERS.filter(o => o.status !== 'delivered').length

  const filteredOrders = MOCK_ORDERS.filter(o =>
    !search || o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Sales & Distribution"
        description="Quotations, sales orders, deliveries, and customer management"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewQuote(true)}>New Quotation</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewOrder(true)}>New Sales Order</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Orders Value" value={formatCurrency(totalOrders)} icon={<ShoppingCart className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Delivered Value" value={formatCurrency(totalDelivered)} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Pending Delivery" value={pendingDelivery.toString()} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Active Customers" value={MOCK_CUSTOMERS.length.toString()} icon={<Users className="h-4 w-4" />} />
      </div>

      <TabBar
        tabs={[
          { id: 'orders', label: 'Sales Orders', count: MOCK_ORDERS.length },
          { id: 'quotations', label: 'Quotations', count: MOCK_QUOTATIONS.length },
          { id: 'deliveries', label: 'Deliveries' },
          { id: 'customers', label: 'Customers' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'orders' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
            <SearchInput placeholder="Search orders..." value={search} onChange={setSearch} className="w-72" />
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} className="ml-auto" onClick={() => setNewOrder(true)}>New Order</Button>
          </div>
          <Table>
            <Thead>
              <tr><Th>Order No</Th><Th>Customer</Th><Th>Order Date</Th><Th>Delivery Date</Th><Th>Items</Th><Th align="right">Amount</Th><Th>Progress</Th><Th>Status</Th><Th></Th></tr>
            </Thead>
            <Tbody>
              {filteredOrders.map(o => {
                const pct = o.amount > 0 ? Math.round((o.delivered / o.amount) * 100) : 0
                return (
                  <Tr key={o.id}>
                    <Td><span className="font-mono text-xs font-bold text-blue-600">{o.id}</span></Td>
                    <Td><span className="font-medium text-slate-800">{o.customer}</span></Td>
                    <Td><span className="text-xs text-slate-500">{o.order_date}</span></Td>
                    <Td><span className="text-xs text-slate-500">{o.delivery_date}</span></Td>
                    <Td><span className="text-sm">{o.items}</span></Td>
                    <Td align="right"><span className="data-value font-semibold">{formatCurrency(o.amount)}</span></Td>
                    <Td>
                      <div className="w-20">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{pct}%</p>
                      </div>
                    </Td>
                    <Td><Badge variant={STATUS_VARIANT[o.status]}>{o.status}</Badge></Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon"><Edit2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'quotations' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Customer Quotations</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewQuote(true)}>New Quotation</Button>
          </div>
          <Table>
            <Thead><tr><Th>Quote No</Th><Th>Customer</Th><Th>Date</Th><Th>Valid Until</Th><Th>Items</Th><Th align="right">Amount</Th><Th>Status</Th><Th></Th></tr></Thead>
            <Tbody>
              {MOCK_QUOTATIONS.map(q => (
                <Tr key={q.id}>
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{q.id}</span></Td>
                  <Td><span className="font-medium text-slate-800">{q.customer}</span></Td>
                  <Td><span className="text-xs text-slate-500">{q.date}</span></Td>
                  <Td><span className="text-xs text-slate-500">{q.valid_until}</span></Td>
                  <Td><span className="text-sm">{q.items}</span></Td>
                  <Td align="right"><span className="data-value font-semibold">{formatCurrency(q.amount)}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[q.status]}>{q.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Convert to SO"><Send className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon"><Download className="h-3.5 w-3.5" /></Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'deliveries' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Delivery Orders</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>Create Delivery</Button>
          </div>
          <Table>
            <Thead><tr><Th>DO No</Th><Th>Sales Order</Th><Th>Customer</Th><Th>Date</Th><Th>LR No</Th><Th>Items</Th><Th>Status</Th><Th></Th></tr></Thead>
            <Tbody>
              {MOCK_DELIVERIES.map(d => (
                <Tr key={d.id}>
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{d.id}</span></Td>
                  <Td><span className="font-mono text-xs text-slate-600">{d.so}</span></Td>
                  <Td><span className="font-medium text-slate-800">{d.customer}</span></Td>
                  <Td><span className="text-xs text-slate-500">{d.date}</span></Td>
                  <Td><span className="font-mono text-xs text-slate-500">{d.lr_no}</span></Td>
                  <Td><span className="text-sm">{d.items}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[d.status]}>{d.status}</Badge></Td>
                  <Td><Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'customers' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Customer Master</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>Add Customer</Button>
          </div>
          <Table>
            <Thead><tr><Th>Customer</Th><Th>GSTIN</Th><Th>Type</Th><Th align="right">Credit Limit</Th><Th align="right">Outstanding</Th><Th>Orders</Th><Th></Th></tr></Thead>
            <Tbody>
              {MOCK_CUSTOMERS.map(c => {
                const utilization = Math.round((c.outstanding / c.credit_limit) * 100)
                return (
                  <Tr key={c.id}>
                    <Td><span className="font-medium text-slate-800">{c.name}</span></Td>
                    <Td><span className="font-mono text-[10px] text-slate-500">{c.gstin}</span></Td>
                    <Td><Badge variant="info">{c.type}</Badge></Td>
                    <Td align="right"><span className="data-value">{formatCurrency(c.credit_limit)}</span></Td>
                    <Td align="right">
                      <span className={`font-semibold ${utilization > 80 ? 'text-red-600' : 'text-slate-700'}`}>
                        {formatCurrency(c.outstanding)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">({utilization}%)</span>
                    </Td>
                    <Td><span className="text-sm font-medium">{c.orders}</span></Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon"><Edit2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Card>
      )}

      <Modal open={newOrder} onClose={() => setNewOrder(false)} title="New Sales Order" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewOrder(false)}>Cancel</Button><Button variant="outline" size="sm">Save Draft</Button><Button size="sm">Confirm Order</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Customer" options={MOCK_CUSTOMERS.map(c => ({ label: c.name, value: c.id }))} />
            <Input label="Customer PO Number" placeholder="Their PO ref" />
            <Input label="Order Date" type="date" required />
            <Input label="Expected Delivery Date" type="date" required />
          </div>
          <Divider label="Line Items" />
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 px-1">
            <span className="col-span-5">Item</span><span className="col-span-2">Qty</span><span className="col-span-2">Rate</span><span className="col-span-2">GST%</span><span className="col-span-1">Total</span>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-5"><Input placeholder="Item description" /></div>
            <div className="col-span-2"><Input type="number" placeholder="1" /></div>
            <div className="col-span-2"><Input type="number" placeholder="0" /></div>
            <div className="col-span-2"><Select options={[{label:'18%',value:'18'},{label:'12%',value:'12'},{label:'5%',value:'5'},{label:'0%',value:'0'}]} /></div>
            <div className="col-span-1 flex items-end pb-1"><span className="text-sm text-slate-400">₹0</span></div>
          </div>
          <Button variant="ghost" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>Add Line Item</Button>
          <Textarea label="Terms & Conditions" rows={2} placeholder="Payment terms, delivery terms..." />
        </div>
      </Modal>

      <Modal open={newQuote} onClose={() => setNewQuote(false)} title="New Quotation" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewQuote(false)}>Cancel</Button><Button variant="outline" size="sm">Save Draft</Button><Button size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>Send to Customer</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Customer" options={MOCK_CUSTOMERS.map(c => ({ label: c.name, value: c.id }))} />
            <Input label="Valid Until" type="date" required />
            <Input label="Quotation Date" type="date" required />
            <Select label="Payment Terms" options={[{label:'Net 30',value:'30'},{label:'Net 45',value:'45'},{label:'Net 60',value:'60'},{label:'Advance',value:'advance'}]} />
          </div>
          <Textarea label="Notes / Special Terms" rows={2} placeholder="Delivery terms, payment terms, discounts..." />
        </div>
      </Modal>
    </div>
  )
}
