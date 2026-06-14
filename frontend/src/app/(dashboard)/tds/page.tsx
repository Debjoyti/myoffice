'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, Modal, Input, Select
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  Shield, Plus, Download, Eye, Send, CheckCircle2, AlertCircle, FileText
} from 'lucide-react'

const MOCK_TDS_DEDUCTIONS = [
  { id: 'TDS-001', payee: 'Accenture India Pvt Ltd', pan: 'AABCA1234A', section: '194J', nature: 'Professional Services', payment: 500000, rate: 10, tds: 50000, date: '2026-05-05', challan: 'CHN-001', status: 'deposited' },
  { id: 'TDS-002', payee: 'CBRE India', pan: 'AABCC5678B', section: '194I', nature: 'Rent', payment: 850000, rate: 10, tds: 85000, date: '2026-05-01', challan: 'CHN-002', status: 'deposited' },
  { id: 'TDS-003', payee: 'Freelance Dev — Rahul Gupta', pan: 'ABCPG1234D', section: '194J', nature: 'Technical Services', payment: 150000, rate: 10, tds: 15000, date: '2026-05-10', challan: null, status: 'pending' },
  { id: 'TDS-004', payee: 'Adani Electricity Mumbai', pan: 'AABCA9876C', section: '194A', nature: 'Interest', payment: 45000, rate: 10, tds: 4500, date: '2026-05-15', challan: null, status: 'pending' },
  { id: 'TDS-005', payee: 'Blue Dart Express', pan: 'AABCB1122D', section: '194C', nature: 'Contractor', payment: 280000, rate: 2, tds: 5600, date: '2026-05-08', challan: 'CHN-003', status: 'deposited' },
]

const MOCK_CHALLANS = [
  { id: 'CHN-001', challan_no: '08503211', period: 'Apr 2026', bsr_code: '0850321', date: '2026-05-07', tax_deposited: 135000, surcharge: 0, interest: 0, status: 'filed' },
  { id: 'CHN-002', challan_no: '08503212', period: 'Apr 2026', bsr_code: '0850321', date: '2026-05-07', tax_deposited: 90000, surcharge: 0, interest: 0, status: 'filed' },
  { id: 'CHN-003', challan_no: '08503215', period: 'May 2026', bsr_code: '0850321', date: '2026-05-09', tax_deposited: 5600, surcharge: 0, interest: 0, status: 'filed' },
]

const MOCK_FORM26Q = [
  { id: 'F26-001', quarter: 'Q4 FY2025-26', period: 'Jan–Mar 2026', due_date: '2026-05-31', filed_date: '2026-05-28', deductions: 18, tax: 320000, status: 'filed' },
  { id: 'F26-002', quarter: 'Q1 FY2026-27', period: 'Apr–Jun 2026', due_date: '2026-07-31', filed_date: null, deductions: 5, tax: 160100, status: 'pending' },
]

const MOCK_FORM16A = [
  { id: 'F16-001', payee: 'Accenture India Pvt Ltd', pan: 'AABCA1234A', fy: '2025-26', tds: 200000, status: 'issued' },
  { id: 'F16-002', payee: 'CBRE India', pan: 'AABCC5678B', fy: '2025-26', tds: 340000, status: 'issued' },
  { id: 'F16-003', payee: 'Freelance Dev — Rahul Gupta', pan: 'ABCPG1234D', fy: '2025-26', tds: 30000, status: 'pending' },
]

const TDS_SECTIONS = [
  { section: '192', nature: 'Salary', rate: 'Slab rate' },
  { section: '194A', nature: 'Interest (other than securities)', rate: '10%' },
  { section: '194C', nature: 'Contractors', rate: '1%/2%' },
  { section: '194H', nature: 'Commission / Brokerage', rate: '5%' },
  { section: '194I', nature: 'Rent', rate: '10%' },
  { section: '194J', nature: 'Professional / Technical Services', rate: '10%' },
  { section: '194Q', nature: 'Purchase of Goods', rate: '0.1%' },
  { section: '206C', nature: 'TCS — Sale of Goods', rate: '0.1%' },
]

const STATUS_VARIANT: Record<string, any> = { deposited: 'success', pending: 'warning', filed: 'success', issued: 'success' }

export default function TDSPage() {
  const [tab, setTab] = useState('deductions')
  const [newTDS, setNewTDS] = useState(false)
  const [newChallan, setNewChallan] = useState(false)

  const totalDeducted = MOCK_TDS_DEDUCTIONS.reduce((s, t) => s + t.tds, 0)
  const totalDeposited = MOCK_TDS_DEDUCTIONS.filter(t => t.status === 'deposited').reduce((s, t) => s + t.tds, 0)
  const totalPending = totalDeducted - totalDeposited

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="TDS / TCS Management"
        description="Tax deducted at source, challans, Form 26Q, and Form 16A issuance"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewChallan(true)}>Pay Challan</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewTDS(true)}>Add Deduction</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total TDS Deducted" value={formatCurrency(totalDeducted)} icon={<Shield className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Deposited to Govt." value={formatCurrency(totalDeposited)} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Pending Deposit" value={formatCurrency(totalPending)} icon={<AlertCircle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" delta={totalPending > 0 ? { value: 'Action needed', positive: false } : undefined} />
        <StatCard label="Form 16A Pending" value={MOCK_FORM16A.filter(f => f.status === 'pending').length.toString()} icon={<FileText className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      {totalPending > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span><strong>{formatCurrency(totalPending)}</strong> TDS pending deposit. Due by 7th of next month to avoid interest @ 1.5% p.m.</span>
          <Button variant="ghost" size="sm" className="ml-auto text-amber-700" onClick={() => setNewChallan(true)}>Pay Now</Button>
        </div>
      )}

      <TabBar
        tabs={[
          { id: 'deductions', label: 'TDS Deductions', count: MOCK_TDS_DEDUCTIONS.length },
          { id: 'challans', label: 'Challans' },
          { id: 'returns', label: 'TDS Returns (26Q)' },
          { id: 'form16a', label: 'Form 16A' },
          { id: 'sections', label: 'TDS Rate Chart' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'deductions' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">TDS Deduction Register</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewTDS(true)}>Add Deduction</Button>
          </div>
          <Table>
            <Thead>
              <tr><Th>Payee</Th><Th>PAN</Th><Th>Section</Th><Th>Nature</Th><Th align="right">Payment</Th><Th>Rate</Th><Th align="right">TDS</Th><Th>Date</Th><Th>Status</Th><Th></Th></tr>
            </Thead>
            <Tbody>
              {MOCK_TDS_DEDUCTIONS.map(t => (
                <Tr key={t.id}>
                  <Td><span className="font-medium text-slate-800">{t.payee}</span></Td>
                  <Td><span className="font-mono text-xs text-slate-600">{t.pan}</span></Td>
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{t.section}</span></Td>
                  <Td><span className="text-xs text-slate-500">{t.nature}</span></Td>
                  <Td align="right"><span className="data-value">{formatCurrency(t.payment)}</span></Td>
                  <Td><span className="text-sm">{t.rate}%</span></Td>
                  <Td align="right"><span className="font-bold text-red-600">{formatCurrency(t.tds)}</span></Td>
                  <Td><span className="text-xs text-slate-500">{t.date}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge></Td>
                  <Td><Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex gap-6">
            <p className="text-xs text-slate-500">Total Deducted: <span className="font-bold text-red-600">{formatCurrency(totalDeducted)}</span></p>
            <p className="text-xs text-slate-500">Deposited: <span className="font-bold text-emerald-600">{formatCurrency(totalDeposited)}</span></p>
            <p className="text-xs text-slate-500">Pending: <span className="font-bold text-amber-600">{formatCurrency(totalPending)}</span></p>
          </div>
        </Card>
      )}

      {tab === 'challans' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">TDS Challans (ITNS 281)</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewChallan(true)}>New Challan</Button>
          </div>
          <Table>
            <Thead><tr><Th>Challan No</Th><Th>BSR Code</Th><Th>Period</Th><Th>Date of Deposit</Th><Th align="right">Tax</Th><Th align="right">Surcharge</Th><Th align="right">Interest</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {MOCK_CHALLANS.map(c => (
                <Tr key={c.id}>
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{c.challan_no}</span></Td>
                  <Td><span className="font-mono text-xs text-slate-600">{c.bsr_code}</span></Td>
                  <Td><span className="text-sm">{c.period}</span></Td>
                  <Td><span className="text-xs text-slate-500">{c.date}</span></Td>
                  <Td align="right"><span className="font-semibold text-slate-800">{formatCurrency(c.tax_deposited)}</span></Td>
                  <Td align="right"><span className="text-slate-400">{c.surcharge ? formatCurrency(c.surcharge) : '—'}</span></Td>
                  <Td align="right"><span className="text-slate-400">{c.interest ? formatCurrency(c.interest) : '—'}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'returns' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">TDS Returns — Form 26Q (Non-Salary)</p>
            <Button size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>File Return</Button>
          </div>
          <Table>
            <Thead><tr><Th>Quarter</Th><Th>Period</Th><Th>Due Date</Th><Th>Filed On</Th><Th align="right">Deductions</Th><Th align="right">Tax Deposited</Th><Th>Status</Th><Th></Th></tr></Thead>
            <Tbody>
              {MOCK_FORM26Q.map(r => (
                <Tr key={r.id}>
                  <Td><span className="font-bold text-slate-800">{r.quarter}</span></Td>
                  <Td><span className="text-sm text-slate-600">{r.period}</span></Td>
                  <Td><span className="text-xs text-slate-500">{r.due_date}</span></Td>
                  <Td><span className="text-xs text-slate-500">{r.filed_date ?? '—'}</span></Td>
                  <Td align="right"><span className="text-sm">{r.deductions}</span></Td>
                  <Td align="right"><span className="font-semibold">{formatCurrency(r.tax)}</span></Td>
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

      {tab === 'form16a' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Form 16A — TDS Certificates</p>
            <Button size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>Generate All</Button>
          </div>
          <Table>
            <Thead><tr><Th>Payee</Th><Th>PAN</Th><Th>Financial Year</Th><Th align="right">Total TDS</Th><Th>Status</Th><Th></Th></tr></Thead>
            <Tbody>
              {MOCK_FORM16A.map(f => (
                <Tr key={f.id}>
                  <Td><span className="font-medium text-slate-800">{f.payee}</span></Td>
                  <Td><span className="font-mono text-xs text-slate-600">{f.pan}</span></Td>
                  <Td><span className="text-sm">FY {f.fy}</span></Td>
                  <Td align="right"><span className="font-semibold">{formatCurrency(f.tds)}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[f.status]}>{f.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon"><Download className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon"><Send className="h-3.5 w-3.5" /></Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'sections' && (
        <Card>
          <CardHeader title="TDS Rate Chart — Common Sections" description="As per Income Tax Act, 1961" />
          <Table>
            <Thead><tr><Th>Section</Th><Th>Nature of Payment</Th><Th>TDS Rate</Th><Th>Threshold</Th></tr></Thead>
            <Tbody>
              {TDS_SECTIONS.map(s => (
                <Tr key={s.section}>
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{s.section}</span></Td>
                  <Td><span className="font-medium text-slate-800">{s.nature}</span></Td>
                  <Td><span className="font-semibold text-slate-700">{s.rate}</span></Td>
                  <Td><span className="text-xs text-slate-400">As prescribed</span></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      <Modal open={newTDS} onClose={() => setNewTDS(false)} title="Add TDS Deduction" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewTDS(false)}>Cancel</Button><Button size="sm">Save Deduction</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Payee Name" placeholder="Vendor / service provider" required />
            <Input label="PAN" placeholder="AABCA1234A" required />
            <Select label="TDS Section" options={TDS_SECTIONS.map(s => ({ label: `${s.section} — ${s.nature}`, value: s.section }))} />
            <Input label="Nature of Payment" placeholder="Auto-filled from section" />
            <Input label="Gross Payment Amount (₹)" type="number" required />
            <Input label="TDS Rate (%)" type="number" placeholder="10" />
            <Input label="TDS Amount (₹)" type="number" placeholder="Auto-calculated" />
            <Input label="Date of Deduction" type="date" required />
          </div>
          <Input label="Reference (Invoice / Contract No)" placeholder="INV-2026-001" />
        </div>
      </Modal>

      <Modal open={newChallan} onClose={() => setNewChallan(false)} title="Deposit TDS Challan (ITNS 281)" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewChallan(false)}>Cancel</Button><Button size="sm">Record Payment</Button></>}
      >
        <div className="space-y-4">
          <Input label="BSR Code of Bank" placeholder="0850321" required />
          <Input label="Challan Serial Number" placeholder="08503221" required />
          <Input label="Date of Deposit" type="date" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tax Amount (₹)" type="number" required />
            <Input label="Interest (₹)" type="number" placeholder="0" />
            <Input label="Late Fee (₹)" type="number" placeholder="0" />
            <Select label="Period" options={['Apr 2026','May 2026','Jun 2026','Jul 2026'].map(p => ({ label: p, value: p }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
