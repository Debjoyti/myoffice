// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  SearchInput, Modal, Input, Select, Textarea, Divider, KV, EmptyState, Avatar, TabBar,
} from '@/components/ui'
import { formatDate } from '@/lib/utils'
import {
  Plus, RefreshCw, Mail, Phone, Building2, User, StickyNote, Users as UsersIcon, CheckCircle2,
} from 'lucide-react'

const LIFECYCLE = ['subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist']
const LIFECYCLE_BADGE = { lead: 'neutral', mql: 'info', sql: 'info', opportunity: 'warning', customer: 'success', evangelist: 'success', subscriber: 'neutral' }
const ACT_ICON = { call: Phone, email: Mail, meeting: UsersIcon, task: CheckCircle2, note: StickyNote }
const blank = () => ({ first_name: '', last_name: '', email: '', phone: '', job_title: '', account_id: '', lifecycle_stage: 'lead', source: '', notes: '' })

export default function ContactsPage() {
  const [contacts, setContacts] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(blank())
  const [detail, setDetail] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (tab !== 'all') params.set('lifecycle', tab)
      const res = await fetch(`/api/v1/crm/contacts?${params}`)
      if (res.ok) { const d = await res.json(); setContacts(d.contacts ?? []) }
    } finally { setLoading(false) }
  }, [search, tab])
  useEffect(() => { load() }, [load])
  useEffect(() => { fetch('/api/v1/crm/accounts').then(r => r.ok && r.json()).then(d => d && setAccounts(d.accounts ?? [])).catch(() => {}) }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/crm/contacts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, account_id: form.account_id || null }),
      })
      if (res.ok) { setAdding(false); setForm(blank()); load() }
      else { const e = await res.json(); alert(e.error?.formErrors?.join(', ') || e.error || 'Failed') }
    } finally { setSaving(false) }
  }

  const openDetail = async (c) => {
    setDetail({ ...c, activities: [], deals: [] })
    const res = await fetch(`/api/v1/crm/contacts/${c.id}`)
    if (res.ok) setDetail(await res.json())
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader title="Contacts" description="Every person you do business with"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setForm(blank()); setAdding(true) }}>Add Contact</Button>} />

      <TabBar tabs={[{ id: 'all', label: 'All' }, ...LIFECYCLE.map(l => ({ id: l, label: l.toUpperCase() }))]} active={tab} onChange={setTab} />

      <Card padding="none">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
          <SearchInput placeholder="Search name, email, title..." value={search} onChange={setSearch} className="w-72" />
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={load} className="ml-auto">Refresh</Button>
        </div>
        {!loading && contacts.length === 0 ? (
          <EmptyState icon={<User className="h-7 w-7" />} title="No contacts yet" description="Add the people behind your deals."
            action={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAdding(true)}>Add Contact</Button>} />
        ) : (
          <Table>
            <Thead><tr><Th>Name</Th><Th>Title</Th><Th>Account</Th><Th>Email</Th><Th>Phone</Th><Th>Lifecycle</Th><Th>Last activity</Th></tr></Thead>
            <Tbody>
              {loading ? <Tr><td colSpan={7} className="py-12 text-center text-slate-400 text-sm">Loading…</td></Tr>
              : contacts.map(c => (
                <Tr key={c.id} onClick={() => openDetail(c)} className="cursor-pointer">
                  <Td><div className="flex items-center gap-2.5"><Avatar name={c.full_name || c.first_name} size="sm" /><span className="font-medium text-slate-800">{c.full_name || c.first_name}</span></div></Td>
                  <Td><span className="text-xs text-slate-500">{c.job_title ?? '—'}</span></Td>
                  <Td><span className="text-xs text-slate-600">{c.account?.name ?? '—'}</span></Td>
                  <Td><span className="text-xs text-slate-500">{c.email ?? '—'}</span></Td>
                  <Td><span className="text-xs text-slate-500">{c.phone ?? '—'}</span></Td>
                  <Td><Badge variant={LIFECYCLE_BADGE[c.lifecycle_stage] ?? 'neutral'}>{c.lifecycle_stage}</Badge></Td>
                  <Td><span className="text-xs text-slate-400">{c.last_activity_at ? formatDate(c.last_activity_at) : '—'}</span></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Add */}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add Contact" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={save} disabled={!form.first_name}>Save</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First name *" required value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
            <Input label="Last name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
            <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="Job title" value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} />
            <Select label="Account" value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
              options={[{ label: '— None —', value: '' }, ...accounts.map(a => ({ label: a.name, value: a.id }))]} />
            <Select label="Lifecycle stage" value={form.lifecycle_stage} onChange={e => setForm(f => ({ ...f, lifecycle_stage: e.target.value }))}
              options={LIFECYCLE.map(l => ({ label: l, value: l }))} />
            <Input label="Source" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="web, referral, event…" />
          </div>
          <Textarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </Modal>

      {/* Detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.full_name ?? ''} size="lg">
        {detail && <ContactDetail c={detail} onChanged={() => openDetail(detail)} />}
      </Modal>
    </div>
  )
}

function ContactDetail({ c, onChanged }) {
  const [logType, setLogType] = useState('note')
  const [subject, setSubject] = useState('')
  const [busy, setBusy] = useState(false)

  const log = async () => {
    if (!subject.trim()) return
    setBusy(true)
    try {
      await fetch('/api/v1/crm/activities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: logType, subject, status: 'completed', contact_id: c.id, account_id: c.account_id ?? null }),
      })
      setSubject(''); onChanged()
    } finally { setBusy(false) }
  }
  const setLifecycle = async (v) => {
    await fetch(`/api/v1/crm/contacts/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lifecycle_stage: v }) })
    onChanged()
  }

  return (
    <div className="space-y-4 max-h-[74vh] overflow-y-auto pr-1">
      <div className="flex items-center gap-3">
        <Avatar name={c.full_name || c.first_name} size="lg" />
        <div className="flex-1">
          <p className="font-bold text-slate-900">{c.full_name}</p>
          <p className="text-xs text-slate-500">{c.job_title} {c.account?.name ? `· ${c.account.name}` : ''}</p>
        </div>
        <select value={c.lifecycle_stage} onChange={e => setLifecycle(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white">
          {LIFECYCLE.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <KV label="Email" value={c.email ?? '—'} />
        <KV label="Phone" value={c.phone ?? '—'} />
        <KV label="Source" value={c.source ?? '—'} />
        <KV label="Lead status" value={c.lead_status ?? '—'} />
      </div>
      {c.notes && <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{c.notes}</p>}

      {(c.deals ?? []).length > 0 && (<>
        <Divider label="Deals" />
        {c.deals.map(d => <div key={d.id} className="flex justify-between text-sm py-1"><span className="text-slate-700">{d.name}</span><Badge variant={d.status === 'won' ? 'success' : d.status === 'lost' ? 'danger' : 'info'}>{d.status}</Badge></div>)}
      </>)}

      <Divider label="Log activity" />
      <div className="flex gap-2">
        <select value={logType} onChange={e => setLogType(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 bg-white">
          {['note', 'call', 'email', 'meeting', 'task'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What happened?" className="flex-1 h-8 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
        <Button size="sm" loading={busy} onClick={log} disabled={!subject.trim()}>Log</Button>
      </div>

      <Divider label="Timeline" />
      <div className="space-y-2">
        {(c.activities ?? []).length === 0 ? <p className="text-sm text-slate-400">No activity yet.</p> : c.activities.map(a => {
          const Icon = ACT_ICON[a.type] ?? StickyNote
          return (
            <div key={a.id} className="flex items-start gap-2.5">
              <span className="p-1.5 rounded-lg bg-slate-100 flex-shrink-0"><Icon className="h-3 w-3 text-slate-500" /></span>
              <div className="min-w-0"><p className="text-sm text-slate-700">{a.subject}</p><p className="text-[10px] text-slate-400">{a.type} · {formatDate(a.created_at)}</p></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
