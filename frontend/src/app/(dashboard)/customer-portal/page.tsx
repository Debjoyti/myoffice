'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, Modal, Input, Select, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  Users, Plus, Eye, Settings, Globe, CheckCircle2, Clock, FileText,
  CreditCard, MessageSquare, Download, Link, Copy, Star, Shield
} from 'lucide-react'

const MOCK_PORTALS = [
  { id: 'cp1', customer: 'Tata Consultancy Services', gstin: '27AAACT2727Q1ZW', portal_url: 'portal.prsk.io/tcs', contacts: 5, open_invoices: 3, outstanding: 480000, tickets: 1, status: 'active', last_login: '2026-05-31 9:15 AM' },
  { id: 'cp2', customer: 'Infosys Ltd', gstin: '29AABCI1681G1ZF', portal_url: 'portal.prsk.io/infosys', contacts: 3, open_invoices: 2, outstanding: 320000, tickets: 0, status: 'active', last_login: '2026-05-30 2:00 PM' },
  { id: 'cp3', customer: 'Wipro Technologies', gstin: '29AAACW0867R1ZP', portal_url: 'portal.prsk.io/wipro', contacts: 2, open_invoices: 1, outstanding: 215000, tickets: 2, status: 'active', last_login: '2026-05-28 11:00 AM' },
  { id: 'cp4', customer: 'HCL Technologies', gstin: '09AAACH0135K2ZH', portal_url: 'portal.prsk.io/hcl', contacts: 4, open_invoices: 0, outstanding: 0, tickets: 0, status: 'invited', last_login: null },
]

const MOCK_PORTAL_ACTIVITY = [
  { customer: 'TCS', action: 'Invoice INV-2026-041 viewed', time: '2026-05-31 9:15 AM', type: 'invoice' },
  { customer: 'Infosys', action: 'Statement of Account downloaded', time: '2026-05-30 2:00 PM', type: 'statement' },
  { customer: 'Wipro', action: 'Support ticket #TKT-048 raised', time: '2026-05-29 4:00 PM', type: 'ticket' },
  { customer: 'TCS', action: 'Payment of ₹3,20,000 initiated', time: '2026-05-28 11:00 AM', type: 'payment' },
]

const PORTAL_FEATURES = [
  { icon: FileText, label: 'View Invoices & SOA', desc: 'Customers can view, download, and dispute invoices' },
  { icon: CreditCard, label: 'Online Payments', desc: 'Pay via UPI, NEFT, credit card directly from portal' },
  { icon: MessageSquare, label: 'Raise Support Tickets', desc: 'Customer support integrated with your helpdesk' },
  { icon: Download, label: 'Download Documents', desc: 'PO, contracts, delivery notes, certificates' },
  { icon: Shield, label: 'GST Compliance', desc: 'Auto-generate GSTR documents for customers' },
  { icon: Star, label: 'Rate & Feedback', desc: 'NPS and satisfaction surveys from the portal' },
]

export default function CustomerPortalPage() {
  const [tab, setTab] = useState('portals')
  const [newPortal, setNewPortal] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const active = MOCK_PORTALS.filter(p => p.status === 'active').length
  const totalOutstanding = MOCK_PORTALS.reduce((s, p) => s + p.outstanding, 0)
  const openTickets = MOCK_PORTALS.reduce((s, p) => s + p.tickets, 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Customer Portal"
        description="Give customers a branded self-service portal — invoices, payments, support, and documents in one place"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Settings className="h-3.5 w-3.5" />} onClick={() => setSettingsOpen(true)}>Portal Settings</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewPortal(true)}>Invite Customer</Button>
          </>
        }
      />

      {/* Portal URL Banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
        <Globe className="h-5 w-5 text-blue-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-blue-800">Your Portal URL</p>
          <p className="font-mono text-sm text-blue-700">portal.prsk.io</p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<Copy className="h-3.5 w-3.5" />}>Copy Link</Button>
        <Button variant="outline" size="sm" leftIcon={<Eye className="h-3.5 w-3.5" />}>Preview Portal</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Portals" value={active.toString()} icon={<Users className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Outstanding (All Customers)" value={formatCurrency(totalOutstanding)} icon={<CreditCard className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Open Tickets" value={openTickets.toString()} icon={<MessageSquare className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" delta={openTickets > 0 ? { value: 'Needs response', positive: false } : undefined} />
        <StatCard label="Invited (Pending Login)" value={MOCK_PORTALS.filter(p => p.status === 'invited').length.toString()} icon={<Clock className="h-4 w-4" />} />
      </div>

      <TabBar tabs={[
        { id: 'portals', label: 'Customer Portals', count: MOCK_PORTALS.length },
        { id: 'activity', label: 'Recent Activity' },
        { id: 'features', label: 'Portal Features' },
      ]} active={tab} onChange={setTab} />

      {tab === 'portals' && (
        <Card padding="none">
          <Table>
            <Thead>
              <tr><Th>Customer</Th><Th>Portal URL</Th><Th>Contacts</Th><Th align="right">Outstanding</Th><Th>Open Invoices</Th><Th>Tickets</Th><Th>Last Login</Th><Th>Status</Th><Th></Th></tr>
            </Thead>
            <Tbody>
              {MOCK_PORTALS.map(p => (
                <Tr key={p.id}>
                  <Td>
                    <p className="font-medium text-slate-800">{p.customer}</p>
                    <p className="font-mono text-[10px] text-slate-400">{p.gstin}</p>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-blue-600">{p.portal_url}</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5"><Copy className="h-3 w-3" /></Button>
                    </div>
                  </Td>
                  <Td><span className="text-sm">{p.contacts}</span></Td>
                  <Td align="right"><span className={`font-semibold ${p.outstanding > 0 ? 'text-amber-600' : 'text-slate-300'}`}>{p.outstanding > 0 ? formatCurrency(p.outstanding) : '—'}</span></Td>
                  <Td><span className="text-sm">{p.open_invoices || '—'}</span></Td>
                  <Td>
                    {p.tickets > 0 ? (
                      <Badge variant="danger">{p.tickets} open</Badge>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </Td>
                  <Td><span className="text-xs text-slate-500">{p.last_login ?? 'Never'}</span></Td>
                  <Td><Badge variant={p.status === 'active' ? 'success' : 'info'}>{p.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon"><Settings className="h-3.5 w-3.5" /></Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'activity' && (
        <Card>
          <CardHeader title="Recent Portal Activity" />
          <div className="space-y-3 mt-3">
            {MOCK_PORTAL_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${a.type === 'payment' ? 'bg-emerald-50' : a.type === 'ticket' ? 'bg-red-50' : 'bg-blue-50'}`}>
                  {a.type === 'payment' ? <CreditCard className="h-3.5 w-3.5 text-emerald-600" /> : a.type === 'ticket' ? <MessageSquare className="h-3.5 w-3.5 text-red-600" /> : <FileText className="h-3.5 w-3.5 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800"><span className="text-blue-600">{a.customer}</span> — {a.action}</p>
                  <p className="text-xs text-slate-400">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'features' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {PORTAL_FEATURES.map(f => (
            <Card key={f.label}>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <f.icon className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{f.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">Enabled</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={newPortal} onClose={() => setNewPortal(false)} title="Invite Customer to Portal" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewPortal(false)}>Cancel</Button><Button size="sm" leftIcon={<Link className="h-3.5 w-3.5" />}>Send Invite</Button></>}
      >
        <div className="space-y-4">
          <Select label="Customer" options={MOCK_PORTALS.map(p => ({ label: p.customer, value: p.id }))} />
          <Divider label="Primary Contact" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Name *" required placeholder="Full name" />
            <Input label="Email *" type="email" required placeholder="contact@company.com" />
            <Input label="Designation" placeholder="e.g. Finance Manager" />
            <Input label="Phone" placeholder="+91-XXXXX-XXXXX" />
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            An email invitation with a one-time setup link will be sent to the contact. They can set their password and access the portal within 48 hours.
          </div>
        </div>
      </Modal>
    </div>
  )
}
