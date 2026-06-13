// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  SearchInput, Modal, Input, Select, Textarea, Divider, KV, EmptyState, TabBar,
} from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, RefreshCw, Building2, Globe, Users, Briefcase } from 'lucide-react'

const TYPES = ['prospect', 'customer', 'partner', 'vendor', 'other']
const TYPE_BADGE = { customer: 'success', prospect: 'info', partner: 'warning', vendor: 'neutral', other: 'neutral' }
const blank = () => ({ name: '', industry: '', website: '', domain: '', type: 'prospect', employee_count: '', annual_revenue: '', city: '', phone: '', email: '', description: '' })

export default function AccountsPage() {
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
      if (tab !== 'all') params.set('type', tab)
      const res = await fetch(`/api/v1/crm/accounts?${params}`)
      if (res.ok) { const d = await res.json(); setAccounts(d.accounts ?? []) }
    } finally { setLoading(false) }
  }, [search, tab])
  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/crm/accounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          employee_count: form.employee_count ? Number(form.employee_count) : undefined,
          annual_revenue: form.annual_revenue ? Number(form.annual_revenue) : undefined,
        }),
      })
      if (res.ok) { setAdding(false); setForm(blank()); load() }
      else { const e = await res.json(); alert(e.error?.formErrors?.join(', ') || e.error || 'Failed') }
    } finally { setSaving(false) }
  }

  const openDetail = async (a) => {
    setDetail({ ...a, contacts: [], deals: [], activities: [] })
    const res = await fetch(`/api/v1/crm/accounts/${a.id}`)
    if (res.ok) setDetail(await res.json())
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader title="Accounts" description="The companies in your book of business"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setForm(blank()); setAdding(true) }}>Add Account</Button>} />

      <TabBar tabs={[{ id: 'all', label: 'All' }, ...TYPES.map(t => ({ id: t, label: t[0].toUpperCase() + t.slice(1) }))]} active={tab} onChange={setTab} />

      <Card padding="none">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
          <SearchInput placeholder="Search by name, domain, industry..." value={search} onChange={setSearch} className="w-72" />
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={load} className="ml-auto">Refresh</Button>
        </div>
        {!loading && accounts.length === 0 ? (
          <EmptyState icon={<Building2 className="h-7 w-7" />} title="No accounts yet" description="Add the companies you're selling to."
            action={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAdding(true)}>Add Account</Button>} />
        ) : (
          <Table>
            <Thead><tr><Th>Company</Th><Th>Industry</Th><Th>Type</Th><Th align="right">Contacts</Th><Th align="right">Deals</Th><Th align="right">Revenue</Th><Th>Last activity</Th></tr></Thead>
            <Tbody>
              {loading ? <Tr><td colSpan={7} className="py-12 text-center text-slate-400 text-sm">Loading…</td></Tr>
              : accounts.map(a => (
                <Tr key={a.id} onClick={() => openDetail(a)} className="cursor-pointer">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <span className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{a.name?.[0]?.toUpperCase()}</span>
                      <div><p className="font-medium text-slate-800">{a.name}</p>{a.domain && <p className="text-[10px] text-slate-400">{a.domain}</p>}</div>
                    </div>
                  </Td>
                  <Td><span className="text-xs text-slate-500">{a.industry ?? '—'}</span></Td>
                  <Td><Badge variant={TYPE_BADGE[a.type] ?? 'neutral'}>{a.type}</Badge></Td>
                  <Td align="right"><span className="text-slate-600">{a.contact_count ?? 0}</span></Td>
                  <Td align="right"><span className="text-slate-600">{a.deal_count ?? 0}</span></Td>
                  <Td align="right"><span className="text-xs text-slate-500">{a.annual_revenue ? formatCurrency(a.annual_revenue) : '—'}</span></Td>
                  <Td><span className="text-xs text-slate-400">{a.last_activity_at ? formatDate(a.last_activity_at) : '—'}</span></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add Account" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={save} disabled={!form.name}>Save</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Company name *" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Industry" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
            <Input label="Website" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://" />
            <Input label="Domain" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} placeholder="acme.com" />
            <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} options={TYPES.map(t => ({ label: t, value: t }))} />
            <Input label="Employees" type="number" value={form.employee_count} onChange={e => setForm(f => ({ ...f, employee_count: e.target.value }))} />
            <Input label="Annual revenue (₹)" type="number" value={form.annual_revenue} onChange={e => setForm(f => ({ ...f, annual_revenue: e.target.value }))} />
            <Input label="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <Textarea label="Description" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''} size="lg">
        {detail && (
          <div className="space-y-4 max-h-[74vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-2">
              <Badge variant={TYPE_BADGE[detail.type] ?? 'neutral'}>{detail.type}</Badge>
              {detail.website && <a href={detail.website} target="_blank" rel="noreferrer" className="text-xs text-blue-600 inline-flex items-center gap-1"><Globe className="h-3 w-3" />{detail.domain || detail.website}</a>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <KV label="Industry" value={detail.industry ?? '—'} />
              <KV label="Employees" value={detail.employee_count ?? '—'} />
              <KV label="Annual revenue" value={detail.annual_revenue ? formatCurrency(detail.annual_revenue) : '—'} />
              <KV label="Location" value={[detail.city, detail.state].filter(Boolean).join(', ') || '—'} />
            </div>
            {detail.description && <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{detail.description}</p>}

            <Divider label={`Contacts (${detail.contacts?.length ?? 0})`} />
            {(detail.contacts ?? []).length === 0 ? <p className="text-sm text-slate-400">No contacts linked.</p> :
              detail.contacts.map(c => <div key={c.id} className="flex items-center justify-between text-sm py-1"><span className="text-slate-700">{c.first_name} {c.last_name}</span><span className="text-xs text-slate-400">{c.job_title}</span></div>)}

            <Divider label={`Deals (${detail.deals?.length ?? 0})`} />
            {(detail.deals ?? []).length === 0 ? <p className="text-sm text-slate-400">No deals yet.</p> :
              detail.deals.map(d => <div key={d.id} className="flex items-center justify-between text-sm py-1"><span className="text-slate-700">{d.name}</span><span className="font-semibold">{formatCurrency(d.amount)}</span></div>)}
          </div>
        )}
      </Modal>
    </div>
  )
}
