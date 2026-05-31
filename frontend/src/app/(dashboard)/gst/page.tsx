'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  FileText, Download, Plus, RefreshCw, CheckCircle2, Clock, AlertCircle,
  Send, Eye, Zap, Shield, TrendingUp, Receipt, Building2
} from 'lucide-react'

const MOCK_GSTR1 = [
  { id: 'G1-001', period: 'Apr 2026', b2b_invoices: 42, b2c_invoices: 18, total_taxable: 8450000, cgst: 507000, sgst: 507000, igst: 210000, status: 'filed' },
  { id: 'G1-002', period: 'Mar 2026', b2b_invoices: 38, b2c_invoices: 22, total_taxable: 7820000, cgst: 469200, sgst: 469200, igst: 180000, status: 'filed' },
  { id: 'G1-003', period: 'Feb 2026', b2b_invoices: 35, b2c_invoices: 15, total_taxable: 6950000, cgst: 417000, sgst: 417000, igst: 145000, status: 'filed' },
  { id: 'G1-004', period: 'May 2026', b2b_invoices: 28, b2c_invoices: 12, total_taxable: 5100000, cgst: 306000, sgst: 306000, igst: 92000, status: 'pending' },
]

const MOCK_GSTR3B = [
  { id: 'G3B-001', period: 'Apr 2026', outward_taxable: 8450000, outward_tax: 1224000, inward_itc: 680000, net_payable: 544000, status: 'filed', filed_date: '2026-05-20' },
  { id: 'G3B-002', period: 'Mar 2026', outward_taxable: 7820000, outward_tax: 1118400, inward_itc: 620000, net_payable: 498400, status: 'filed', filed_date: '2026-04-20' },
  { id: 'G3B-003', period: 'Feb 2026', outward_taxable: 6950000, outward_tax: 979000, inward_itc: 550000, net_payable: 429000, status: 'filed', filed_date: '2026-03-20' },
  { id: 'G3B-004', period: 'May 2026', outward_taxable: 5100000, outward_tax: 704000, inward_itc: 380000, net_payable: 324000, status: 'draft', filed_date: null },
]

const MOCK_EINVOICES = [
  { id: 'EI-001', invoice_no: 'INV-2026-041', irn: '4a9d7e2f8b3c1...', ack_no: '232610010001234', ack_date: '2026-05-15', buyer: 'Tata Consultancy Services', gstin: '27AAACT2727Q1ZW', amount: 480000, status: 'generated' },
  { id: 'EI-002', invoice_no: 'INV-2026-040', irn: '7c2e4a9b1d5f8...', ack_no: '232610010001198', ack_date: '2026-05-01', buyer: 'Infosys Ltd', gstin: '29AABCI1681G1ZF', amount: 320000, status: 'generated' },
  { id: 'EI-003', invoice_no: 'INV-2026-042', irn: null, ack_no: null, ack_date: null, buyer: 'Wipro Technologies', gstin: '29AAACW0867R1ZP', amount: 215000, status: 'pending' },
]

const MOCK_EWAYBILLS = [
  { id: 'EWB-001', ewb_no: '411004150008', doc_no: 'INV-2026-041', from: 'Pune', to: 'Mumbai', transporter: 'DTDC Logistics', vehicle_no: 'MH12AB1234', valid_until: '2026-05-17', status: 'active' },
  { id: 'EWB-002', ewb_no: '411004150009', doc_no: 'INV-2026-040', from: 'Pune', to: 'Bengaluru', transporter: 'Blue Dart', vehicle_no: 'KA05XY5678', valid_until: '2026-05-05', status: 'expired' },
]

const MOCK_ITC = [
  { id: 'ITC-001', supplier: 'Amazon Web Services India', gstin: '29AAECA0241D1ZZ', invoice_no: 'AWS-2026-05', invoice_date: '2026-05-01', taxable: 115000, igst: 20700, cgst: 0, sgst: 0, total_itc: 20700, status: 'matched' },
  { id: 'ITC-002', supplier: 'Adobe Systems India', gstin: '29AABCA8268J1ZW', invoice_no: 'ADO-2026-05', invoice_date: '2026-05-03', taxable: 85000, igst: 15300, cgst: 0, sgst: 0, total_itc: 15300, status: 'matched' },
  { id: 'ITC-003', supplier: 'Reliance Jio', gstin: '27AABCR3888G1ZK', invoice_no: 'JIO-2026-05', invoice_date: '2026-05-05', taxable: 12000, igst: 0, cgst: 900, sgst: 900, total_itc: 1800, status: 'pending' },
  { id: 'ITC-004', supplier: 'Zomato Business', gstin: '27AABCZ0305A1ZB', invoice_no: 'ZOM-2026-05', invoice_date: '2026-05-10', taxable: 8500, igst: 0, cgst: 765, sgst: 765, total_itc: 1530, status: 'mismatch' },
]

const STATUS_VARIANT: Record<string, any> = {
  filed: 'success', pending: 'warning', draft: 'neutral', generated: 'success',
  active: 'success', expired: 'danger', matched: 'success', mismatch: 'danger',
}

export default function GSTPage() {
  const [tab, setTab] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [newEwb, setNewEwb] = useState(false)
  const [newInvoice, setNewInvoice] = useState(false)

  const totalLiability = MOCK_GSTR3B.reduce((s, r) => s + r.net_payable, 0)
  const totalITC = MOCK_ITC.reduce((s, r) => s + r.total_itc, 0)
  const pendingEinvoices = MOCK_EINVOICES.filter(e => e.status === 'pending').length
  const activeEwb = MOCK_EWAYBILLS.filter(e => e.status === 'active').length

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="GST Management"
        description="GSTR-1, GSTR-3B, e-invoicing, e-way bills, and ITC reconciliation"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>Sync from GSTN</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewInvoice(true)}>Generate e-Invoice</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Net Tax Payable (FY)" value={formatCurrency(totalLiability)} icon={<Receipt className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
        <StatCard label="ITC Available" value={formatCurrency(totalITC)} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="e-Invoices Pending" value={pendingEinvoices.toString()} icon={<AlertCircle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Active e-Way Bills" value={activeEwb.toString()} icon={<Zap className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
      </div>

      <TabBar
        tabs={[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'gstr1', label: 'GSTR-1' },
          { id: 'gstr3b', label: 'GSTR-3B' },
          { id: 'einvoice', label: 'e-Invoice' },
          { id: 'ewaybill', label: 'e-Way Bill' },
          { id: 'itc', label: 'ITC Ledger' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Filing Calendar" description="Upcoming GST compliance deadlines" />
            <div className="space-y-3 mt-2">
              {[
                { form: 'GSTR-1', period: 'May 2026', due: '11 Jun 2026', status: 'upcoming' },
                { form: 'GSTR-3B', period: 'May 2026', due: '20 Jun 2026', status: 'upcoming' },
                { form: 'GSTR-2B', period: 'May 2026', due: '14 Jun 2026', status: 'upcoming' },
                { form: 'GSTR-9', period: 'FY 2025-26', due: '31 Dec 2026', status: 'annual' },
              ].map(item => (
                <div key={item.form} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.form} — {item.period}</p>
                    <p className="text-xs text-slate-500">Due: {item.due}</p>
                  </div>
                  <Badge variant={item.status === 'annual' ? 'info' : 'warning'}>{item.status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="GSTIN Details" description="Your registered GSTINs" />
            <div className="space-y-3 mt-2">
              {[
                { gstin: '27AABCP1234A1Z5', state: 'Maharashtra', type: 'Regular', status: 'active' },
                { gstin: '29AABCP1234A1Z3', state: 'Karnataka', type: 'Regular', status: 'active' },
                { gstin: '07AABCP1234A1Z9', state: 'Delhi', type: 'Regular', status: 'active' },
              ].map(g => (
                <div key={g.gstin} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="font-mono text-xs font-semibold text-blue-600">{g.gstin}</p>
                    <p className="text-xs text-slate-500">{g.state} · {g.type}</p>
                  </div>
                  <Badge variant="success" dot>Active</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Tax Liability Summary — FY 2026-27" />
            <div className="space-y-2 mt-3">
              {[
                { label: 'CGST', amount: MOCK_GSTR3B.reduce((s, r) => s + r.outward_tax * 0.3, 0) },
                { label: 'SGST', amount: MOCK_GSTR3B.reduce((s, r) => s + r.outward_tax * 0.3, 0) },
                { label: 'IGST', amount: MOCK_GSTR3B.reduce((s, r) => s + r.outward_tax * 0.4, 0) },
                { label: 'Cess', amount: 0 },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">{row.label}</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(row.amount)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm py-2 bg-slate-50 px-2 rounded-lg mt-2">
                <span className="font-bold text-slate-800">Total Liability</span>
                <span className="font-bold text-red-600">{formatCurrency(MOCK_GSTR3B.reduce((s, r) => s + r.outward_tax, 0))}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2">
                <span className="text-slate-600">Less: ITC</span>
                <span className="font-semibold text-emerald-600">- {formatCurrency(totalITC)}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 bg-blue-50 px-2 rounded-lg">
                <span className="font-bold text-slate-800">Net Payable</span>
                <span className="font-bold text-blue-700">{formatCurrency(totalLiability)}</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="ITC Reconciliation" description="GSTR-2A vs Books" />
            <div className="space-y-3 mt-2">
              {[
                { label: 'Matched', count: MOCK_ITC.filter(i => i.status === 'matched').length, color: 'bg-emerald-100 text-emerald-700' },
                { label: 'Pending Confirmation', count: MOCK_ITC.filter(i => i.status === 'pending').length, color: 'bg-amber-100 text-amber-700' },
                { label: 'Mismatched', count: MOCK_ITC.filter(i => i.status === 'mismatch').length, color: 'bg-red-100 text-red-700' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{s.label}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.color}`}>{s.count}</span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <Button size="sm" variant="outline" className="w-full">Run Reconciliation</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'gstr1' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">GSTR-1 Returns — Outward Supplies</p>
            <Button size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>File GSTR-1</Button>
          </div>
          <Table>
            <Thead>
              <tr>
                <Th>Period</Th><Th>B2B Invoices</Th><Th>B2C Invoices</Th>
                <Th align="right">Taxable Value</Th><Th align="right">CGST</Th>
                <Th align="right">SGST</Th><Th align="right">IGST</Th><Th>Status</Th><Th></Th>
              </tr>
            </Thead>
            <Tbody>
              {MOCK_GSTR1.map(r => (
                <Tr key={r.id}>
                  <Td><span className="font-medium text-slate-800">{r.period}</span></Td>
                  <Td><span className="text-slate-600">{r.b2b_invoices}</span></Td>
                  <Td><span className="text-slate-600">{r.b2c_invoices}</span></Td>
                  <Td align="right"><span className="data-value">{formatCurrency(r.total_taxable)}</span></Td>
                  <Td align="right"><span className="text-slate-600">{formatCurrency(r.cgst)}</span></Td>
                  <Td align="right"><span className="text-slate-600">{formatCurrency(r.sgst)}</span></Td>
                  <Td align="right"><span className="text-slate-600">{formatCurrency(r.igst)}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
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

      {tab === 'gstr3b' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">GSTR-3B — Summary Returns</p>
            <Button size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>File GSTR-3B</Button>
          </div>
          <Table>
            <Thead>
              <tr>
                <Th>Period</Th><Th align="right">Outward Taxable</Th><Th align="right">Output Tax</Th>
                <Th align="right">Input Tax Credit</Th><Th align="right">Net Payable</Th>
                <Th>Filed On</Th><Th>Status</Th><Th></Th>
              </tr>
            </Thead>
            <Tbody>
              {MOCK_GSTR3B.map(r => (
                <Tr key={r.id}>
                  <Td><span className="font-medium text-slate-800">{r.period}</span></Td>
                  <Td align="right"><span className="data-value">{formatCurrency(r.outward_taxable)}</span></Td>
                  <Td align="right"><span className="text-red-600 font-medium">{formatCurrency(r.outward_tax)}</span></Td>
                  <Td align="right"><span className="text-emerald-600 font-medium">{formatCurrency(r.inward_itc)}</span></Td>
                  <Td align="right"><span className="font-bold text-blue-700">{formatCurrency(r.net_payable)}</span></Td>
                  <Td><span className="text-xs text-slate-500">{r.filed_date ?? '—'}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge></Td>
                  <Td><Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'einvoice' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">e-Invoice — IRN Generation</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Bulk Generate</Button>
              <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewInvoice(true)}>New e-Invoice</Button>
            </div>
          </div>
          <Table>
            <Thead>
              <tr>
                <Th>Invoice No</Th><Th>Buyer / GSTIN</Th><Th>IRN</Th><Th>Ack No</Th>
                <Th>Ack Date</Th><Th align="right">Amount</Th><Th>Status</Th><Th></Th>
              </tr>
            </Thead>
            <Tbody>
              {MOCK_EINVOICES.map(e => (
                <Tr key={e.id}>
                  <Td><span className="font-mono text-xs font-medium text-blue-600">{e.invoice_no}</span></Td>
                  <Td>
                    <p className="text-sm font-medium text-slate-800">{e.buyer}</p>
                    <p className="font-mono text-[10px] text-slate-400">{e.gstin}</p>
                  </Td>
                  <Td><span className="font-mono text-xs text-slate-500">{e.irn ? e.irn + '...' : '—'}</span></Td>
                  <Td><span className="font-mono text-xs text-slate-600">{e.ack_no ?? '—'}</span></Td>
                  <Td><span className="text-xs text-slate-500">{e.ack_date ?? '—'}</span></Td>
                  <Td align="right"><span className="data-value">{formatCurrency(e.amount)}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[e.status]}>{e.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="View QR"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" title="Download PDF"><Download className="h-3.5 w-3.5" /></Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'ewaybill' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">e-Way Bills</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewEwb(true)}>Generate e-Way Bill</Button>
          </div>
          <Table>
            <Thead>
              <tr>
                <Th>EWB No</Th><Th>Document</Th><Th>From → To</Th><Th>Transporter</Th>
                <Th>Vehicle</Th><Th>Valid Until</Th><Th>Status</Th><Th></Th>
              </tr>
            </Thead>
            <Tbody>
              {MOCK_EWAYBILLS.map(e => (
                <Tr key={e.id}>
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{e.ewb_no}</span></Td>
                  <Td><span className="font-mono text-xs text-slate-600">{e.doc_no}</span></Td>
                  <Td><span className="text-sm text-slate-700">{e.from} → {e.to}</span></Td>
                  <Td><span className="text-sm text-slate-600">{e.transporter}</span></Td>
                  <Td><span className="font-mono text-xs text-slate-600">{e.vehicle_no}</span></Td>
                  <Td><span className={`text-xs ${e.status === 'expired' ? 'text-red-600 font-medium' : 'text-slate-500'}`}>{e.valid_until}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[e.status]}>{e.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" title="Extend validity"><RefreshCw className="h-3.5 w-3.5" /></Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'itc' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Input Tax Credit Ledger</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>Reconcile with GSTR-2B</Button>
              <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            </div>
          </div>
          <Table>
            <Thead>
              <tr>
                <Th>Supplier</Th><Th>GSTIN</Th><Th>Invoice</Th><Th>Date</Th>
                <Th align="right">Taxable</Th><Th align="right">IGST</Th>
                <Th align="right">CGST</Th><Th align="right">SGST</Th>
                <Th align="right">Total ITC</Th><Th>Status</Th>
              </tr>
            </Thead>
            <Tbody>
              {MOCK_ITC.map(i => (
                <Tr key={i.id}>
                  <Td><span className="font-medium text-slate-800">{i.supplier}</span></Td>
                  <Td><span className="font-mono text-[10px] text-slate-500">{i.gstin}</span></Td>
                  <Td><span className="font-mono text-xs text-blue-600">{i.invoice_no}</span></Td>
                  <Td><span className="text-xs text-slate-500">{i.invoice_date}</span></Td>
                  <Td align="right"><span className="data-value">{formatCurrency(i.taxable)}</span></Td>
                  <Td align="right"><span className="text-slate-600">{i.igst ? formatCurrency(i.igst) : '—'}</span></Td>
                  <Td align="right"><span className="text-slate-600">{i.cgst ? formatCurrency(i.cgst) : '—'}</span></Td>
                  <Td align="right"><span className="text-slate-600">{i.sgst ? formatCurrency(i.sgst) : '—'}</span></Td>
                  <Td align="right"><span className="font-bold text-emerald-700">{formatCurrency(i.total_itc)}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[i.status]}>{i.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex gap-6">
            <p className="text-xs text-slate-500">Total ITC Available: <span className="font-bold text-emerald-700">{formatCurrency(totalITC)}</span></p>
            <p className="text-xs text-slate-500">Matched: <span className="font-semibold text-emerald-600">{MOCK_ITC.filter(i => i.status === 'matched').length}</span></p>
            <p className="text-xs text-slate-500">Mismatched: <span className="font-semibold text-red-600">{MOCK_ITC.filter(i => i.status === 'mismatch').length}</span></p>
          </div>
        </Card>
      )}

      {/* Generate e-Invoice Modal */}
      <Modal open={newInvoice} onClose={() => setNewInvoice(false)} title="Generate e-Invoice (IRN)" size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewInvoice(false)}>Cancel</Button>
          <Button size="sm" leftIcon={<Zap className="h-3.5 w-3.5" />}>Generate IRN</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Invoice Number" placeholder="INV-2026-001" required />
            <Input label="Invoice Date" type="date" required />
            <Input label="Buyer Name" placeholder="Company name" required />
            <Input label="Buyer GSTIN" placeholder="27AAACT2727Q1ZW" required />
            <Input label="Place of Supply" placeholder="e.g. Maharashtra (27)" required />
            <Select label="Supply Type" options={[
              { label: 'B2B', value: 'B2B' }, { label: 'B2C', value: 'B2C' },
              { label: 'Export', value: 'EXPORT' }, { label: 'SEZ', value: 'SEZ' },
            ]} />
          </div>
          <Divider label="Invoice Amount" />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Taxable Value (₹)" type="number" placeholder="100000" />
            <Input label="GST Rate (%)" type="number" placeholder="18" />
            <Input label="Total with GST (₹)" type="number" placeholder="118000" />
          </div>
        </div>
      </Modal>

      {/* e-Way Bill Modal */}
      <Modal open={newEwb} onClose={() => setNewEwb(false)} title="Generate e-Way Bill" size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewEwb(false)}>Cancel</Button>
          <Button size="sm">Generate EWB</Button>
        </>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Document Number" placeholder="INV-2026-001" required />
            <Select label="Document Type" options={[
              { label: 'Tax Invoice', value: 'INV' }, { label: 'Bill of Supply', value: 'BOS' },
              { label: 'Delivery Challan', value: 'DC' },
            ]} />
            <Input label="From (Consignor)" placeholder="City / PIN" required />
            <Input label="To (Consignee)" placeholder="City / PIN" required />
            <Input label="Transporter Name" placeholder="Logistics company" />
            <Input label="Vehicle Number" placeholder="MH12AB1234" />
            <Input label="Approximate Distance (km)" type="number" placeholder="500" />
            <Select label="Transport Mode" options={[
              { label: 'Road', value: '1' }, { label: 'Rail', value: '2' },
              { label: 'Air', value: '3' }, { label: 'Ship', value: '4' },
            ]} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
