'use client'

import { useState } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  Building2, Plus, Download, Eye, Edit2, Star, TrendingUp, AlertTriangle,
  CheckCircle2
} from 'lucide-react'

const MOCK_VENDORS = [
  { id: 'VEN-001', name: 'BFW India Ltd', code: 'VEN-001', category: 'Machinery', gstin: '27AABCB1234F1ZK', pan: 'AABCB1234F', contact: 'Mr. Satish Patel', phone: '+91-98765-43210', email: 'satish@bfw.in', credit_days: 45, credit_limit: 5000000, outstanding: 1200000, rating: 4.5, status: 'active', msme: true },
  { id: 'VEN-002', name: 'Reliance Jio Infocomm', code: 'VEN-002', category: 'IT & Telecom', gstin: '27AABCR3888G1ZK', pan: 'AABCR3888G', contact: 'Account Manager', phone: '1800-888-9999', email: 'enterprise@jio.com', credit_days: 30, credit_limit: 500000, outstanding: 42000, rating: 4.0, status: 'active', msme: false },
  { id: 'VEN-003', name: 'Adani Electricity Mumbai', code: 'VEN-003', category: 'Utilities', gstin: '27AABCA9876C1Z5', pan: 'AABCA9876C', contact: 'Commercial Dept', phone: '19122', email: 'commercial@adanielectricity.com', credit_days: 15, credit_limit: 200000, outstanding: 0, rating: 3.5, status: 'active', msme: false },
  { id: 'VEN-004', name: 'ABC Steel Traders', code: 'VEN-004', category: 'Raw Material', gstin: '27AABCA5555D1Z1', pan: 'AABCA5555D', contact: 'Mr. Ravi Gupta', phone: '+91-99001-11222', email: 'ravi@abcsteel.com', credit_days: 60, credit_limit: 2000000, outstanding: 680000, rating: 3.8, status: 'on_hold', msme: true },
  { id: 'VEN-005', name: 'Adobe Systems India', code: 'VEN-005', category: 'Software', gstin: '29AABCA8268J1ZW', pan: 'AABCA8268J', contact: 'License Team', phone: '+91-80-1234-5678', email: 'india@adobe.com', credit_days: 30, credit_limit: 300000, outstanding: 95000, rating: 4.8, status: 'active', msme: false },
]

const MOCK_EVALUATIONS = [
  { id: 'EVL-001', vendor: 'BFW India Ltd', period: 'Q1 FY2026-27', quality: 90, delivery: 85, pricing: 80, responsiveness: 95, overall: 87.5, status: 'completed' },
  { id: 'EVL-002', vendor: 'ABC Steel Traders', period: 'Q1 FY2026-27', quality: 70, delivery: 65, pricing: 85, responsiveness: 60, overall: 70, status: 'completed' },
  { id: 'EVL-003', vendor: 'Reliance Jio Infocomm', period: 'Q1 FY2026-27', quality: 88, delivery: 92, pricing: 75, responsiveness: 85, overall: 85, status: 'completed' },
]

const MOCK_PAYMENTS = [
  { id: 'PAY-001', vendor: 'BFW India Ltd', invoice: 'BFW-INV-2026-18', amount: 450000, due_date: '2026-06-10', status: 'upcoming' },
  { id: 'PAY-002', vendor: 'ABC Steel Traders', invoice: 'ABC-2026-055', amount: 280000, due_date: '2026-06-05', status: 'upcoming' },
  { id: 'PAY-003', vendor: 'Reliance Jio Infocomm', invoice: 'JIO-2026-05', amount: 42000, due_date: '2026-05-31', status: 'overdue' },
  { id: 'PAY-004', vendor: 'Adobe Systems India', invoice: 'ADB-2026-05', amount: 95000, due_date: '2026-06-15', status: 'upcoming' },
]

const STATUS_VARIANT: Record<string, any> = {
  active: 'success', on_hold: 'warning', blacklisted: 'danger',
  completed: 'success', overdue: 'danger', upcoming: 'info',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`h-3 w-3 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
      ))}
      <span className="text-xs text-slate-500 ml-1">{rating}</span>
    </div>
  )
}

export default function VendorPage() {
  const [tab, setTab] = useState('master')
  const [search, setSearch] = useState('')
  const [newVendor, setNewVendor] = useState(false)

  const totalOutstanding = MOCK_VENDORS.reduce((s, v) => s + v.outstanding, 0)
  const activeVendors = MOCK_VENDORS.filter(v => v.status === 'active').length
  const msmeVendors = MOCK_VENDORS.filter(v => v.msme).length
  const overduePayments = MOCK_PAYMENTS.filter(p => p.status === 'overdue').length

  const filtered = MOCK_VENDORS.filter(v =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Vendor Management"
        description="Vendor master, evaluations, payment schedule, and MSME tracking"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewVendor(true)}>Add Vendor</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Vendors" value={activeVendors.toString()} icon={<Building2 className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Total Outstanding" value={formatCurrency(totalOutstanding)} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="MSME Vendors" value={msmeVendors.toString()} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Overdue Payments" value={overduePayments.toString()} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" delta={overduePayments > 0 ? { value: 'Immediate action', positive: false } : undefined} />
      </div>

      <TabBar
        tabs={[
          { id: 'master', label: 'Vendor Master', count: MOCK_VENDORS.length },
          { id: 'evaluation', label: 'Evaluations' },
          { id: 'payments', label: 'Payment Schedule' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'master' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
            <SearchInput placeholder="Search vendors..." value={search} onChange={setSearch} className="w-72" />
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} className="ml-auto" onClick={() => setNewVendor(true)}>Add Vendor</Button>
          </div>
          <Table>
            <Thead>
              <tr><Th>Code</Th><Th>Vendor Name</Th><Th>Category</Th><Th>GSTIN</Th><Th>Credit Days</Th><Th align="right">Outstanding</Th><Th>Rating</Th><Th>MSME</Th><Th>Status</Th><Th></Th></tr>
            </Thead>
            <Tbody>
              {filtered.map(v => (
                <Tr key={v.id}>
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{v.code}</span></Td>
                  <Td>
                    <p className="font-medium text-slate-800">{v.name}</p>
                    <p className="text-[10px] text-slate-400">{v.contact}</p>
                  </Td>
                  <Td><span className="text-xs text-slate-500">{v.category}</span></Td>
                  <Td><span className="font-mono text-[10px] text-slate-500">{v.gstin}</span></Td>
                  <Td><span className="text-sm">{v.credit_days} days</span></Td>
                  <Td align="right"><span className={`font-semibold ${v.outstanding > v.credit_limit * 0.8 ? 'text-red-600' : 'text-slate-700'}`}>{formatCurrency(v.outstanding)}</span></Td>
                  <Td><StarRating rating={v.rating} /></Td>
                  <Td>{v.msme ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="text-slate-300 text-xs">—</span>}</Td>
                  <Td><Badge variant={STATUS_VARIANT[v.status]}>{v.status.replace('_', ' ')}</Badge></Td>
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

      {tab === 'evaluation' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Vendor Performance Evaluation</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>New Evaluation</Button>
          </div>
          <Table>
            <Thead><tr><Th>Vendor</Th><Th>Period</Th><Th align="right">Quality</Th><Th align="right">Delivery</Th><Th align="right">Pricing</Th><Th align="right">Responsiveness</Th><Th align="right">Overall</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {MOCK_EVALUATIONS.map(e => (
                <Tr key={e.id}>
                  <Td><span className="font-medium text-slate-800">{e.vendor}</span></Td>
                  <Td><span className="text-sm text-slate-600">{e.period}</span></Td>
                  {[e.quality, e.delivery, e.pricing, e.responsiveness].map((score, i) => (
                    <Td key={i} align="right">
                      <span className={`font-semibold ${score >= 85 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                        {score}%
                      </span>
                    </Td>
                  ))}
                  <Td align="right">
                    <span className={`font-bold text-base ${e.overall >= 85 ? 'text-emerald-600' : e.overall >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                      {e.overall}%
                    </span>
                  </Td>
                  <Td><Badge variant={STATUS_VARIANT[e.status]}>{e.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'payments' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Upcoming Vendor Payments</p>
            <Button size="sm" leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}>Record Payment</Button>
          </div>
          {overduePayments > 0 && (
            <div className="px-5 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2 text-xs text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              <strong>{overduePayments} payment(s) overdue.</strong> MSME vendors must be paid within 45 days (MSMED Act). Risk of interest @ 3x RBI rate.
            </div>
          )}
          <Table>
            <Thead><tr><Th>Vendor</Th><Th>Invoice</Th><Th align="right">Amount</Th><Th>Due Date</Th><Th>Status</Th><Th></Th></tr></Thead>
            <Tbody>
              {MOCK_PAYMENTS.map(p => (
                <Tr key={p.id}>
                  <Td><span className="font-medium text-slate-800">{p.vendor}</span></Td>
                  <Td><span className="font-mono text-xs text-blue-600">{p.invoice}</span></Td>
                  <Td align="right"><span className="data-value font-semibold">{formatCurrency(p.amount)}</span></Td>
                  <Td><span className={`text-xs ${p.status === 'overdue' ? 'text-red-600 font-bold' : 'text-slate-500'}`}>{p.due_date}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge></Td>
                  <Td><Button variant="ghost" size="sm">Pay</Button></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      <Modal open={newVendor} onClose={() => setNewVendor(false)} title="Add Vendor" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewVendor(false)}>Cancel</Button><Button size="sm">Save Vendor</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Vendor Name" required placeholder="Company name" />
            <Select label="Category" options={['Raw Material','Machinery','IT & Telecom','Utilities','Software','Services','Logistics','Other'].map(c => ({ label: c, value: c }))} />
            <Input label="GSTIN" placeholder="27AABCA1234A1Z5" />
            <Input label="PAN" placeholder="AABCA1234A" />
            <Input label="Contact Person" placeholder="Name" />
            <Input label="Phone" placeholder="+91-XXXXX-XXXXX" />
            <Input label="Email" type="email" placeholder="vendor@email.com" />
            <Input label="Credit Period (days)" type="number" placeholder="30" />
            <Input label="Credit Limit (₹)" type="number" placeholder="500000" />
            <Select label="MSME Registered?" options={[{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }]} />
          </div>
          <Input label="MSME Registration Number" placeholder="Udyam Registration No (if MSME)" />
          <Textarea label="Registered Address" rows={2} placeholder="Full address with PIN code" />
        </div>
      </Modal>
    </div>
  )
}
