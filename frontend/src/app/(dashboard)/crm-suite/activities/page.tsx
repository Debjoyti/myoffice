// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, Badge, Button, StatCard, TabBar, Modal, Input, Select, Textarea, EmptyState,
} from '@/components/ui'
import { formatDate } from '@/lib/utils'
import {
  Plus, RefreshCw, Phone, Mail, Users, CheckCircle2, StickyNote, Clock, AlertCircle, Check, CalendarClock,
} from 'lucide-react'

const ACT_ICON = { call: Phone, email: Mail, meeting: Users, task: CheckCircle2, note: StickyNote }
const TYPE_COLOR = { call: 'bg-blue-50 text-blue-600', email: 'bg-violet-50 text-violet-600', meeting: 'bg-amber-50 text-amber-600', task: 'bg-emerald-50 text-emerald-600', note: 'bg-slate-100 text-slate-500' }
const blank = () => ({ type: 'task', subject: '', body: '', status: 'planned', due_at: '' })

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [scope, setScope] = useState('all')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(blank())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tab === 'tasks') params.set('status', 'planned')
      else if (tab !== 'all') params.set('type', tab)
      if (scope === 'mine') params.set('scope', 'mine')
      const res = await fetch(`/api/v1/crm/activities?${params}`)
      if (res.ok) { const d = await res.json(); setActivities(d.activities ?? []); setSummary(d.summary ?? {}) }
    } finally { setLoading(false) }
  }, [tab, scope])
  useEffect(() => { load() }, [load])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/crm/activities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, due_at: form.due_at || undefined }),
      })
      if (res.ok) { setAdding(false); setForm(blank()); load() }
      else { const e = await res.json(); alert(e.error?.formErrors?.join(', ') || e.error || 'Failed') }
    } finally { setSaving(false) }
  }

  const complete = async (a) => {
    await fetch(`/api/v1/crm/activities/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) })
    load()
  }

  const subtitle = (a) => {
    const who = a.contact ? `${a.contact.first_name ?? ''} ${a.contact.last_name ?? ''}`.trim() : a.account?.name
    return [who, a.deal?.name].filter(Boolean).join(' · ')
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader title="Activities & Tasks" description="Calls, emails, meetings, notes and to-dos across your CRM"
        actions={<>
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            {['all', 'mine'].map(s => <button key={s} onClick={() => setScope(s)} className={`px-2.5 py-1 text-xs font-medium rounded-md ${scope === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>{s === 'all' ? 'Everyone' : 'Mine'}</button>)}
          </div>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setForm(blank()); setAdding(true) }}>Log / Schedule</Button>
        </>} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total" value={(summary.total ?? 0).toString()} icon={<StickyNote className="h-4 w-4" />} accent="blue" />
        <StatCard label="Open Tasks" value={(summary.open_tasks ?? 0).toString()} icon={<Clock className="h-4 w-4" />} accent="amber" />
        <StatCard label="Overdue" value={(summary.overdue ?? 0).toString()} icon={<AlertCircle className="h-4 w-4" />} accent="red" />
        <StatCard label="Completed" value={(summary.completed ?? 0).toString()} icon={<CheckCircle2 className="h-4 w-4" />} accent="emerald" />
      </div>

      <TabBar tabs={[
        { id: 'all', label: 'All' }, { id: 'tasks', label: 'Open Tasks' },
        { id: 'call', label: 'Calls' }, { id: 'email', label: 'Emails' }, { id: 'meeting', label: 'Meetings' }, { id: 'note', label: 'Notes' },
      ]} active={tab} onChange={setTab} />

      <Card padding="none">
        <div className="px-5 py-3 flex items-center border-b border-slate-100">
          <span className="text-xs text-slate-400">{loading ? 'Loading…' : `${activities.length} activities`}</span>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={load} className="ml-auto">Refresh</Button>
        </div>
        {!loading && activities.length === 0 ? (
          <EmptyState icon={<CalendarClock className="h-7 w-7" />} title="Nothing here yet" description="Log a call or schedule a follow-up task." />
        ) : (
          <div className="divide-y divide-slate-50">
            {activities.map(a => {
              const Icon = ACT_ICON[a.type] ?? StickyNote
              return (
                <div key={a.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50/50">
                  <span className={`p-2 rounded-lg flex-shrink-0 ${TYPE_COLOR[a.type]}`}><Icon className="h-4 w-4" /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{a.subject}</p>
                      {a.status === 'planned' && <Badge variant={a.is_overdue ? 'danger' : 'warning'} size="sm">{a.is_overdue ? 'overdue' : 'planned'}</Badge>}
                    </div>
                    {subtitle(a) && <p className="text-xs text-slate-500 mt-0.5">{subtitle(a)}</p>}
                    {a.body && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{a.body}</p>}
                    <p className="text-[10px] text-slate-400 mt-1">
                      {a.due_at ? `Due ${formatDate(a.due_at)}` : formatDate(a.created_at)}
                    </p>
                  </div>
                  {a.status === 'planned' && (
                    <Button variant="outline" size="sm" leftIcon={<Check className="h-3.5 w-3.5" />} onClick={() => complete(a)}>Done</Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Modal open={adding} onClose={() => setAdding(false)} title="Log / Schedule Activity" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={save} disabled={!form.subject}>Save</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              options={['task', 'call', 'email', 'meeting', 'note'].map(t => ({ label: t, value: t }))} />
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              options={[{ label: 'Planned (to-do)', value: 'planned' }, { label: 'Completed (log)', value: 'completed' }]} />
          </div>
          <Input label="Subject *" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Follow-up call with Acme" />
          {form.status === 'planned' && <Input label="Due" type="datetime-local" value={form.due_at} onChange={e => setForm(f => ({ ...f, due_at: e.target.value }))} />}
          <Textarea label="Details" rows={3} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
