// @ts-nocheck
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  PageHeader, Card, Badge, Button, Modal, Input, Select, Textarea, Divider, KV, EmptyState,
} from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Plus, RefreshCw, Target, Trophy, IndianRupee, TrendingUp, GripVertical,
  Building2, Calendar, CheckCircle2, Phone, Mail, Users, StickyNote,
} from 'lucide-react'

const PRIORITY = { high: 'danger', medium: 'warning', low: 'neutral' }
const ACT_ICON = { call: Phone, email: Mail, meeting: Users, task: CheckCircle2, note: StickyNote }

export default function DealsBoard() {
  const [board, setBoard] = useState({})
  const [stages, setStages] = useState([])
  const [summary, setSummary] = useState({})
  const [pipelineId, setPipelineId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState([])
  const [contacts, setContacts] = useState([])
  const [dragId, setDragId] = useState(null)
  const dragging = useRef(false)

  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(null)
  const [detail, setDetail] = useState(null)

  const fetchBoard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/v1/crm/deals')
      if (res.ok) { const d = await res.json(); setBoard(d.board ?? {}); setStages(d.stages ?? []); setSummary(d.summary ?? {}); setPipelineId(d.pipeline_id) }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchBoard() }, [fetchBoard])
  useEffect(() => {
    const t = setInterval(() => { if (!dragging.current && !detail && !adding) fetchBoard(true) }, 20000)
    return () => clearInterval(t)
  }, [fetchBoard, detail, adding])
  useEffect(() => {
    fetch('/api/v1/crm/accounts').then(r => r.ok && r.json()).then(d => d && setAccounts(d.accounts ?? [])).catch(() => {})
    fetch('/api/v1/crm/contacts').then(r => r.ok && r.json()).then(d => d && setContacts(d.contacts ?? [])).catch(() => {})
  }, [])

  // drag & drop
  const onDrop = async (stageId) => {
    dragging.current = false
    const id = dragId; setDragId(null)
    if (!id) return
    // find current stage
    let from = null, deal = null
    for (const sid of Object.keys(board)) { const f = (board[sid] || []).find(d => d.id === id); if (f) { from = sid; deal = f } }
    if (!from || from === stageId) return
    // optimistic move
    setBoard(b => {
      const next = { ...b }
      next[from] = next[from].filter(d => d.id !== id)
      const st = stages.find(s => s.id === stageId)
      next[stageId] = [{ ...deal, stage_id: stageId, status: st?.is_won ? 'won' : st?.is_lost ? 'lost' : 'open' }, ...(next[stageId] || [])]
      return next
    })
    const res = await fetch(`/api/v1/crm/deals/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_stage_id: stageId }) })
    if (!res.ok) fetchBoard(true)
    else fetchBoard(true)
  }

  const openAdd = (stageId) => setForm({
    name: '', account_id: '', primary_contact_id: '', amount: '', close_date: '', priority: 'medium', stage_id: stageId || '', description: '',
  }) || setAdding(true)

  const saveDeal = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/crm/deals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, account_id: form.account_id || null, primary_contact_id: form.primary_contact_id || null,
          amount: Number(form.amount) || 0, close_date: form.close_date || undefined,
          priority: form.priority, stage_id: form.stage_id || undefined, description: form.description || undefined,
        }),
      })
      if (res.ok) { setAdding(false); fetchBoard(true) }
      else { const e = await res.json(); alert(e.error?.formErrors?.join(', ') || e.error || 'Failed') }
    } finally { setSaving(false) }
  }

  const openDetail = async (deal) => {
    setDetail({ ...deal, activities: [], history: [] })
    const res = await fetch(`/api/v1/crm/deals/${deal.id}`)
    if (res.ok) setDetail(await res.json())
  }

  const moveDealTo = async (stageId, lost_reason) => {
    const body = { to_stage_id: stageId }
    if (lost_reason) body.lost_reason = lost_reason
    const res = await fetch(`/api/v1/crm/deals/${detail.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { const d = await res.json(); openDetail(d); fetchBoard(true) }
  }

  const wonStage = stages.find(s => s.is_won)
  const lostStage = stages.find(s => s.is_lost)

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader title="Deals Pipeline" description="Drag deals across stages — win probability and forecast update automatically"
        actions={<>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={() => fetchBoard()}>Refresh</Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => openAdd('')}>Add Deal</Button>
        </>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<IndianRupee className="h-4 w-4" />} label="Open pipeline" value={formatCurrency(summary.open_value ?? 0)} color="text-indigo-600 bg-indigo-50" />
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="Weighted forecast" value={formatCurrency(summary.weighted_value ?? 0)} color="text-violet-600 bg-violet-50" />
        <Stat icon={<Trophy className="h-4 w-4" />} label="Won value" value={formatCurrency(summary.won_value ?? 0)} color="text-emerald-600 bg-emerald-50" />
        <Stat icon={<Target className="h-4 w-4" />} label="Open deals" value={summary.open ?? 0} color="text-amber-600 bg-amber-50" />
      </div>

      {/* Kanban */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {stages.map(stage => {
            const list = board[stage.id] ?? []
            const sum = list.reduce((s, d) => s + Number(d.amount || 0), 0)
            return (
              <div key={stage.id} className="w-72 flex-shrink-0"
                onDragOver={e => e.preventDefault()} onDrop={() => onDrop(stage.id)}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
                    <span className="text-xs font-semibold text-slate-700">{stage.name}</span>
                    <span className="text-[10px] text-slate-400">{list.length}</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">{formatCurrency(sum)}</span>
                </div>
                <div className="space-y-2 min-h-[120px] bg-slate-50/60 rounded-xl p-2">
                  {list.map(deal => (
                    <div key={deal.id} draggable
                      onDragStart={() => { setDragId(deal.id); dragging.current = true }}
                      onDragEnd={() => { dragging.current = false }}
                      onClick={() => openDetail(deal)}
                      className="group bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md cursor-pointer transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2">{deal.name}</p>
                        <GripVertical className="h-3.5 w-3.5 text-slate-300 flex-shrink-0 opacity-0 group-hover:opacity-100" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-1">{formatCurrency(deal.amount)}</p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {deal.account?.name && <span className="inline-flex items-center gap-1 text-[10px] text-slate-500"><Building2 className="h-2.5 w-2.5" />{deal.account.name}</span>}
                        {deal.priority && <Badge variant={PRIORITY[deal.priority]} size="sm">{deal.priority}</Badge>}
                      </div>
                      {deal.close_date && <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{formatDate(deal.close_date)}</p>}
                    </div>
                  ))}
                  <button onClick={() => openAdd(stage.id)} className="w-full text-[11px] text-slate-400 hover:text-slate-600 py-1.5 rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-1">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
              </div>
            )
          })}
          {!loading && stages.length === 0 && (
            <EmptyState icon={<Target className="h-7 w-7" />} title="Pipeline initializing…" description="Refresh to load your default sales pipeline." />
          )}
        </div>
      </div>

      {/* Add deal */}
      <Modal open={adding} onClose={() => setAdding(false)} title="New Deal" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={saveDeal} disabled={!form?.name}>Create Deal</Button></>}>
        {form && (
          <div className="space-y-4">
            <Input label="Deal name *" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Acme Corp — Annual License" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Amount (₹)" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              <Input label="Expected close" type="date" value={form.close_date} onChange={e => setForm(f => ({ ...f, close_date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Account" value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
                options={[{ label: '— None —', value: '' }, ...accounts.map(a => ({ label: a.name, value: a.id }))]} />
              <Select label="Primary contact" value={form.primary_contact_id} onChange={e => setForm(f => ({ ...f, primary_contact_id: e.target.value }))}
                options={[{ label: '— None —', value: '' }, ...contacts.map(c => ({ label: c.full_name || c.first_name, value: c.id }))]} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Stage" value={form.stage_id} onChange={e => setForm(f => ({ ...f, stage_id: e.target.value }))}
                options={[{ label: 'First stage', value: '' }, ...stages.map(s => ({ label: s.name, value: s.id }))]} />
              <Select label="Priority" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                options={[{ label: 'High', value: 'high' }, { label: 'Medium', value: 'medium' }, { label: 'Low', value: 'low' }]} />
            </div>
            <Textarea label="Notes" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        )}
      </Modal>

      {/* Deal detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''} size="lg">
        {detail && <DealDetail deal={detail} stages={stages} wonStage={wonStage} lostStage={lostStage} onMove={moveDealTo} onChanged={() => { fetchBoard(true); openDetail(detail) }} />}
      </Modal>
    </div>
  )
}

function Stat({ icon, label, value, color }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <span className={`p-2 rounded-lg ${color}`}>{icon}</span>
      <div><p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p><p className="text-lg font-bold text-slate-800">{value}</p></div>
    </Card>
  )
}

function DealDetail({ deal, stages, onMove, onChanged }) {
  const [logType, setLogType] = useState('note')
  const [logSubject, setLogSubject] = useState('')
  const [logBusy, setLogBusy] = useState(false)

  const log = async () => {
    if (!logSubject.trim()) return
    setLogBusy(true)
    try {
      await fetch('/api/v1/crm/activities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: logType, subject: logSubject, status: 'completed', deal_id: deal.id, account_id: deal.account_id ?? null, contact_id: deal.primary_contact_id ?? null }),
      })
      setLogSubject(''); onChanged()
    } finally { setLogBusy(false) }
  }

  const isClosed = deal.status !== 'open'
  return (
    <div className="space-y-4 max-h-[74vh] overflow-y-auto pr-1">
      <div className="flex items-center gap-2">
        <Badge variant={deal.status === 'won' ? 'success' : deal.status === 'lost' ? 'danger' : 'info'}>{deal.status}</Badge>
        <span className="text-2xl font-bold text-slate-900 ml-auto">{formatCurrency(deal.amount)}</span>
      </div>

      {!isClosed && (
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg">
          <span className="text-xs text-slate-500 self-center">Move to:</span>
          {stages.filter(s => s.id !== deal.stage_id).map(s => (
            <button key={s.id} onClick={() => s.is_lost ? onMove(s.id, prompt('Lost reason (optional)') ?? '') : onMove(s.id)}
              className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 transition-colors flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <KV label="Account" value={deal.account?.name ?? '—'} />
        <KV label="Contact" value={deal.contact ? `${deal.contact.first_name ?? ''} ${deal.contact.last_name ?? ''}`.trim() : '—'} />
        <KV label="Stage" value={deal.stage?.name ?? '—'} />
        <KV label="Probability" value={`${deal.probability ?? 0}%`} />
        <KV label="Close date" value={deal.close_date ? formatDate(deal.close_date) : '—'} />
        <KV label="Priority" value={deal.priority} />
      </div>
      {deal.description && <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{deal.description}</p>}

      <Divider label="Log activity" />
      <div className="flex gap-2">
        <select value={logType} onChange={e => setLogType(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 bg-white">
          {['note', 'call', 'email', 'meeting', 'task'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={logSubject} onChange={e => setLogSubject(e.target.value)} placeholder="What happened?" className="flex-1 h-8 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
        <Button size="sm" loading={logBusy} onClick={log} disabled={!logSubject.trim()}>Log</Button>
      </div>

      <Divider label="Timeline" />
      <div className="space-y-2">
        {(deal.activities ?? []).length === 0 ? <p className="text-sm text-slate-400">No activity yet.</p> : deal.activities.map(a => {
          const Icon = ACT_ICON[a.type] ?? StickyNote
          return (
            <div key={a.id} className="flex items-start gap-2.5">
              <span className="p-1.5 rounded-lg bg-slate-100 flex-shrink-0"><Icon className="h-3 w-3 text-slate-500" /></span>
              <div className="min-w-0">
                <p className="text-sm text-slate-700">{a.subject}</p>
                <p className="text-[10px] text-slate-400">{a.type} · {formatDate(a.created_at)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
