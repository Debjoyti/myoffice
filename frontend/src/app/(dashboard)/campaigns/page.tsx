'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, Modal, Input, Select, Textarea, Divider
} from '@/components/ui'
import {
  Mail, Plus, Send, Eye, Edit2, BarChart3, Users, TrendingUp,
  CheckCircle2, Clock, AlertCircle, Zap, Target, MousePointerClick
} from 'lucide-react'

const MOCK_CAMPAIGNS = [
  { id: '1', name: 'May Newsletter — Product Updates', type: 'newsletter', subject: 'Exciting updates from PRSK this May 🚀', list: 'All Customers', recipients: 2840, sent: 2840, opens: 1138, clicks: 284, bounces: 12, unsubscribes: 3, status: 'sent', sent_at: '2026-05-15 10:00 AM' },
  { id: '2', name: 'New Feature Announcement — GST Module', type: 'product', subject: 'New: Automated GST filing is here!', list: 'Enterprise Customers', recipients: 480, sent: 480, opens: 312, clicks: 96, bounces: 4, unsubscribes: 1, status: 'sent', sent_at: '2026-05-20 9:00 AM' },
  { id: '3', name: 'Q2 2026 Product Webinar Invite', type: 'event', subject: 'Join us: PRSK Product Deep Dive — June 12', list: 'All Active Users', recipients: 1240, sent: 0, opens: 0, clicks: 0, bounces: 0, unsubscribes: 0, status: 'scheduled', sent_at: '2026-06-05 10:00 AM' },
  { id: '4', name: 'Win-Back — Inactive Trial Users', type: 'drip', subject: 'We miss you! Here\'s what\'s new...', list: 'Inactive 30d', recipients: 620, sent: 0, opens: 0, clicks: 0, bounces: 0, unsubscribes: 0, status: 'draft', sent_at: null },
]

const MOCK_LISTS = [
  { id: 'l1', name: 'All Customers', subscribers: 2840, active: 2784, created: '2026-01-01' },
  { id: 'l2', name: 'Enterprise Customers', subscribers: 480, active: 476, created: '2026-01-01' },
  { id: 'l3', name: 'All Active Users', subscribers: 1240, active: 1240, created: '2026-02-15' },
  { id: 'l4', name: 'Trial Users', subscribers: 380, active: 380, created: '2026-03-01' },
  { id: 'l5', name: 'Inactive 30d', subscribers: 620, active: 580, created: '2026-04-01' },
]

const STATUS_VARIANT: Record<string, any> = { sent: 'success', scheduled: 'info', draft: 'neutral', failed: 'danger', sending: 'warning' }
const TYPE_COLOR: Record<string, string> = { newsletter: 'bg-blue-50 text-blue-700', product: 'bg-violet-50 text-violet-700', event: 'bg-emerald-50 text-emerald-700', drip: 'bg-amber-50 text-amber-700' }

export default function CampaignsPage() {
  const [tab, setTab] = useState('campaigns')
  const [newCampaign, setNewCampaign] = useState(false)
  const [viewCampaign, setViewCampaign] = useState<any>(null)

  const totalSent  = MOCK_CAMPAIGNS.filter(c => c.status === 'sent').reduce((s, c) => s + c.sent, 0)
  const avgOpen    = Math.round(MOCK_CAMPAIGNS.filter(c => c.status === 'sent').reduce((s, c) => s + (c.opens / c.sent * 100), 0) / MOCK_CAMPAIGNS.filter(c => c.status === 'sent').length)
  const avgClick   = Math.round(MOCK_CAMPAIGNS.filter(c => c.status === 'sent').reduce((s, c) => s + (c.clicks / c.sent * 100), 0) / MOCK_CAMPAIGNS.filter(c => c.status === 'sent').length)
  const totalSubs  = MOCK_LISTS.reduce((s, l) => s + l.subscribers, 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Email Campaigns"
        description="Create, schedule, and track email marketing campaigns with audience segmentation"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Users className="h-3.5 w-3.5" />}>Manage Lists</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewCampaign(true)}>New Campaign</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Emails Sent (All Time)" value={totalSent.toLocaleString()} icon={<Mail className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Total Subscribers" value={totalSubs.toLocaleString()} icon={<Users className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="Avg Open Rate" value={`${avgOpen}%`} icon={<Eye className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" delta={{ value: 'Industry avg: 22%', positive: avgOpen > 22 }} />
        <StatCard label="Avg Click Rate" value={`${avgClick}%`} icon={<MousePointerClick className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" delta={{ value: 'Industry avg: 3%', positive: avgClick > 3 }} />
      </div>

      <TabBar tabs={[
        { id: 'campaigns', label: 'Campaigns', count: MOCK_CAMPAIGNS.length },
        { id: 'lists', label: 'Subscriber Lists', count: MOCK_LISTS.length },
        { id: 'templates', label: 'Templates' },
        { id: 'automations', label: 'Automations' },
      ]} active={tab} onChange={setTab} />

      {tab === 'campaigns' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">All Campaigns</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewCampaign(true)}>New Campaign</Button>
          </div>
          <Table>
            <Thead><tr><Th>Campaign</Th><Th>Type</Th><Th>List</Th><Th align="right">Recipients</Th><Th align="right">Open Rate</Th><Th align="right">Click Rate</Th><Th align="right">Bounces</Th><Th>Status</Th><Th></Th></tr></Thead>
            <Tbody>
              {MOCK_CAMPAIGNS.map(c => {
                const openRate  = c.sent > 0 ? ((c.opens / c.sent) * 100).toFixed(1) : '—'
                const clickRate = c.sent > 0 ? ((c.clicks / c.sent) * 100).toFixed(1) : '—'
                return (
                  <Tr key={c.id}>
                    <Td>
                      <p className="font-medium text-slate-800">{c.name}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{c.subject}</p>
                    </Td>
                    <Td><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[c.type]}`}>{c.type}</span></Td>
                    <Td><span className="text-xs text-slate-500">{c.list}</span></Td>
                    <Td align="right"><span className="font-semibold">{c.recipients.toLocaleString()}</span></Td>
                    <Td align="right"><span className={`font-semibold ${Number(openRate) >= 25 ? 'text-emerald-600' : Number(openRate) > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{openRate}{openRate !== '—' ? '%' : ''}</span></Td>
                    <Td align="right"><span className={`font-semibold ${Number(clickRate) >= 5 ? 'text-emerald-600' : Number(clickRate) > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{clickRate}{clickRate !== '—' ? '%' : ''}</span></Td>
                    <Td align="right"><span className={`text-sm ${c.bounces > 0 ? 'text-amber-600' : 'text-slate-300'}`}>{c.bounces > 0 ? c.bounces : '—'}</span></Td>
                    <Td><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewCampaign(c)}><BarChart3 className="h-3.5 w-3.5" /></Button>
                        {c.status === 'draft' && <Button variant="ghost" size="icon"><Send className="h-3.5 w-3.5 text-blue-600" /></Button>}
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'lists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_LISTS.map(list => (
            <Card key={list.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-slate-800">{list.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Created {list.created}</p>
                </div>
                <Badge variant="success">{((list.active / list.subscribers) * 100).toFixed(0)}% active</Badge>
              </div>
              <div className="flex gap-4 mt-3 text-sm">
                <div><p className="text-xs text-slate-400">Total</p><p className="font-bold text-slate-800">{list.subscribers.toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-400">Active</p><p className="font-bold text-emerald-600">{list.active.toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-400">Unsubscribed</p><p className="font-bold text-red-500">{list.subscribers - list.active}</p></div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1">View Contacts</Button>
                <Button variant="ghost" size="sm">Import</Button>
              </div>
            </Card>
          ))}
          <Card className="border-dashed border-2 border-slate-200 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors min-h-[120px]">
            <div className="text-center">
              <Plus className="h-6 w-6 text-slate-400 mx-auto mb-1" />
              <p className="text-sm font-medium text-slate-500">New List</p>
            </div>
          </Card>
        </div>
      )}

      {tab === 'templates' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {['Product Newsletter', 'Feature Announcement', 'Event Invitation', 'Welcome Email', 'Re-engagement', 'Promotional Offer'].map(t => (
            <Card key={t} className="cursor-pointer hover:shadow-md transition-shadow text-center p-4">
              <div className="h-24 bg-gradient-to-br from-blue-50 to-violet-50 rounded-lg mb-3 flex items-center justify-center">
                <Mail className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">{t}</p>
              <Button variant="ghost" size="sm" className="mt-2 w-full">Use Template</Button>
            </Card>
          ))}
        </div>
      )}

      {tab === 'automations' && (
        <div className="space-y-3">
          {[
            { name: 'Welcome Series', trigger: 'New subscriber added', emails: 3, active: true, enrolled: 48 },
            { name: 'Trial Onboarding', trigger: 'Trial started', emails: 5, active: true, enrolled: 24 },
            { name: 'Win-Back Flow', trigger: 'Inactive for 30 days', emails: 3, active: false, enrolled: 0 },
            { name: 'Feature Adoption', trigger: 'Module not used in 7 days', emails: 2, active: true, enrolled: 120 },
          ].map(auto => (
            <Card key={auto.name}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${auto.active ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                    <Zap className={`h-4 w-4 ${auto.active ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{auto.name}</p>
                    <p className="text-xs text-slate-500">Trigger: {auto.trigger} · {auto.emails} emails</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500">{auto.enrolled} enrolled</span>
                  <Badge variant={auto.active ? 'success' : 'neutral'}>{auto.active ? 'Active' : 'Paused'}</Badge>
                  <Button variant="ghost" size="icon"><Edit2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {viewCampaign && (
        <Modal open={!!viewCampaign} onClose={() => setViewCampaign(null)} title={`Campaign Report — ${viewCampaign.name}`} size="lg"
          footer={<Button variant="ghost" size="sm" onClick={() => setViewCampaign(null)}>Close</Button>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Sent', value: viewCampaign.sent.toLocaleString(), color: 'text-slate-700' },
                { label: 'Opened', value: `${viewCampaign.opens} (${((viewCampaign.opens/viewCampaign.sent)*100).toFixed(1)}%)`, color: 'text-blue-600' },
                { label: 'Clicked', value: `${viewCampaign.clicks} (${((viewCampaign.clicks/viewCampaign.sent)*100).toFixed(1)}%)`, color: 'text-emerald-600' },
                { label: 'Bounced', value: viewCampaign.bounces.toString(), color: 'text-amber-600' },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400">{s.label}</p>
                  <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="font-semibold text-slate-700 mb-1">Subject Line</p>
              <p className="text-slate-600">{viewCampaign.subject}</p>
            </div>
          </div>
        </Modal>
      )}

      <Modal open={newCampaign} onClose={() => setNewCampaign(false)} title="Create Email Campaign" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewCampaign(false)}>Cancel</Button><Button variant="outline" size="sm">Save Draft</Button><Button size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>Schedule / Send</Button></>}
      >
        <div className="space-y-4">
          <Input label="Campaign Name *" required placeholder="e.g. June 2026 Newsletter" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Campaign Type" options={['newsletter','product','event','drip','promotional'].map(t => ({ label: t.charAt(0).toUpperCase()+t.slice(1), value: t }))} />
            <Select label="Subscriber List" options={MOCK_LISTS.map(l => ({ label: `${l.name} (${l.subscribers})`, value: l.id }))} />
          </div>
          <Input label="Subject Line *" required placeholder="Engaging subject line..." />
          <Input label="Preview Text" placeholder="Short preview shown in inbox..." />
          <Input label="From Name" placeholder="PRSK Enterprise" />
          <Input label="Schedule (leave blank to send now)" type="datetime-local" />
          <Divider label="Email Content" />
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
            <Mail className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Design your email using the drag-and-drop builder</p>
            <Button variant="outline" size="sm" className="mt-3">Open Email Builder</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
