'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, StatCard, Button, Badge, Avatar, Modal, Input, Textarea,
  EmptyState, Alert, SearchInput, Spinner, ProgressBar, DetailGrid,
} from '@/components/ui'
import {
  UsersRound, Plus, RefreshCw, Sparkles, Target, Mail, Phone,
  Briefcase, CheckCircle2, Link2,
} from 'lucide-react'

type Candidate = {
  id: string; full_name: string; email: string; phone: string | null; headline: string | null
  summary: string | null; location: string | null; skills: string[]; experience_years: number
  current_company: string | null; current_title: string | null; expected_ctc: number | null
  notice_period_days: number | null; linkedin_url: string | null; profile_score: number
  open_to_work: boolean; open_to_remote: boolean; status: string; source: string
}

const blankForm = {
  full_name: '', email: '', phone: '', headline: '', location: '', summary: '',
  skills: '', experience_years: '3', current_company: '', current_title: '',
  expected_ctc: '', linkedin_url: '', source: 'direct',
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [summary, setSummary] = useState({ total: 0, open_to_work: 0, placed: 0, avg_score: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<Candidate | null>(null)
  const [detailData, setDetailData] = useState<any>(null)
  const [matches, setMatches] = useState<any[] | null>(null)
  const [matching, setMatching] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(blankForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      const res = await fetch(`/api/v1/careers/candidates?${params}`)
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load')
      const data = await res.json()
      setCandidates(data.candidates); setSummary(data.summary)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { const t = setTimeout(load, search ? 300 : 0); return () => clearTimeout(t) }, [load, search])

  const openDetail = async (c: Candidate) => {
    setDetail(c); setDetailData(null); setMatches(null)
    const res = await fetch(`/api/v1/careers/candidates/${c.id}`)
    if (res.ok) setDetailData(await res.json())
  }

  const findMatches = async () => {
    if (!detail) return
    setMatching(true)
    try {
      const res = await fetch(`/api/v1/careers/match?candidate_id=${detail.id}`)
      if (res.ok) setMatches((await res.json()).matches)
    } finally { setMatching(false) }
  }

  const apply = async (jobId: string) => {
    if (!detail) return
    const res = await fetch('/api/v1/careers/applications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, candidate_id: detail.id, source: 'recruiter' }),
    })
    if (res.ok || res.status === 409) { openDetail(detail); load() }
  }

  const save = async () => {
    setSaving(true); setFormError(null)
    try {
      const res = await fetch('/api/v1/careers/candidates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name.trim(), email: form.email.trim(),
          phone: form.phone.trim() || undefined, headline: form.headline.trim() || undefined,
          location: form.location.trim() || undefined, summary: form.summary.trim() || undefined,
          skills: form.skills.split(/[,\n]/).map(s => s.trim()).filter(Boolean),
          experience_years: Number(form.experience_years) || 0,
          current_company: form.current_company.trim() || undefined,
          current_title: form.current_title.trim() || undefined,
          expected_ctc: form.expected_ctc ? Number(form.expected_ctc) : null,
          linkedin_url: form.linkedin_url.trim() || undefined, source: form.source,
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(typeof e.error === 'string' ? e.error : 'Check required fields') }
      setAddOpen(false); setForm(blankForm); await load()
    } catch (e: any) { setFormError(e.message) }
    finally { setSaving(false) }
  }

  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Talent Pool"
        description="Your searchable candidate database with AI reverse-matching to open roles."
        actions={<>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={load} loading={loading}>Refresh</Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setForm(blankForm); setFormError(null); setAddOpen(true) }}>Add Candidate</Button>
        </>}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Candidates" value={summary.total} icon={<UsersRound className="h-4 w-4" />} accent="blue" loading={loading} />
        <StatCard label="Open to Work" value={summary.open_to_work} icon={<CheckCircle2 className="h-4 w-4" />} accent="emerald" loading={loading} />
        <StatCard label="Placed" value={summary.placed} icon={<Briefcase className="h-4 w-4" />} accent="violet" loading={loading} />
        <StatCard label="Avg Profile Score" value={`${summary.avg_score}%`} icon={<Target className="h-4 w-4" />} accent="amber" loading={loading} />
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-slate-100">
          <SearchInput placeholder="Search by name, skills, company..." value={search} onChange={setSearch} className="w-80" />
        </div>
        {loading ? <div className="flex justify-center py-16"><Spinner /></div>
        : candidates.length === 0 ? (
          <EmptyState icon={<UsersRound className="h-6 w-6" />} title="No candidates yet" description="Add candidates or let them apply via the job board."
            action={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAddOpen(true)}>Add Candidate</Button>} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
            {candidates.map(c => (
              <Card key={c.id} hover onClick={() => openDetail(c)} className="cursor-pointer">
                <div className="flex items-start gap-3">
                  <Avatar name={c.full_name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.headline ?? c.current_title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {c.open_to_work && <Badge variant="success" size="sm">Open to work</Badge>}
                      <span className="text-[11px] text-slate-400">{c.experience_years}y</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {c.skills.slice(0, 4).map(s => <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{s}</span>)}
                  {c.skills.length > 4 && <span className="text-[10px] text-slate-400">+{c.skills.length - 4}</span>}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 w-16">Profile</span>
                  <ProgressBar value={c.profile_score} className="flex-1" />
                  <span className="text-[10px] font-medium text-slate-500">{c.profile_score}%</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Candidate detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.full_name ?? 'Candidate'} size="lg"
        footer={<Button variant="ghost" size="sm" onClick={() => setDetail(null)}>Close</Button>}>
        {!detail ? null : !detailData ? <div className="flex justify-center py-8"><Spinner /></div> : (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <Avatar name={detail.full_name} size="xl" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{detail.headline ?? detail.current_title}</p>
                <p className="text-xs text-slate-500 flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{detail.email}</span>
                  {detail.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{detail.phone}</span>}
                  {detail.linkedin_url && <a href={detail.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600"><Link2 className="h-3 w-3" />LinkedIn</a>}
                </p>
              </div>
            </div>

            {detail.summary && <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3">{detail.summary}</p>}

            <DetailGrid cols={3} items={[
              { label: 'Experience', value: `${detail.experience_years} yrs` },
              { label: 'Current', value: detail.current_company ?? '—' },
              { label: 'Expected CTC', value: detail.expected_ctc ? `₹${(detail.expected_ctc / 1e5).toFixed(1)}L` : '—' },
              { label: 'Notice', value: detail.notice_period_days != null ? `${detail.notice_period_days} days` : '—' },
              { label: 'Location', value: detail.location ?? '—' },
              { label: 'Source', value: detail.source },
            ]} />

            <div className="flex flex-wrap gap-1.5">
              {detail.skills.map(s => <span key={s} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{s}</span>)}
            </div>

            {detailData.applications?.length ? (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Applications</p>
                <div className="space-y-1.5">
                  {detailData.applications.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between text-xs bg-slate-50 rounded px-3 py-2">
                      <span className="text-slate-700">{a.job?.title}</span>
                      <Badge variant="neutral" size="sm">{a.stage}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Reverse matching */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-violet-600" />Matching open roles</p>
                <Button variant="outline" size="sm" loading={matching} onClick={findMatches} leftIcon={<Target className="h-3.5 w-3.5" />}>Find matches</Button>
              </div>
              {matches === null ? <p className="text-[11px] text-slate-400">Click "Find matches" to rank open jobs for this candidate.</p>
              : matches.length === 0 ? <p className="text-[11px] text-slate-400">No open jobs to match against.</p>
              : (
                <div className="space-y-2">
                  {matches.map((m: any) => (
                    <div key={m.job.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-2.5">
                      <div className="text-center w-12 flex-shrink-0">
                        <p className={`text-lg font-bold ${m.score >= 75 ? 'text-emerald-600' : m.score >= 55 ? 'text-amber-600' : 'text-slate-400'}`}>{m.score}</p>
                        <p className="text-[9px] text-slate-400 -mt-1">match</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-800 truncate">{m.job.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">{m.matchedSkills.slice(0, 4).join(', ') || 'No overlapping skills'}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => apply(m.job.id)}>Apply</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add candidate */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Candidate" size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={save} loading={saving}>Add candidate</Button>
        </>}>
        {formError && <div className="mb-4"><Alert variant="danger">{formError}</Alert></div>}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full name" required value={form.full_name} onChange={e => set('full_name', e.target.value)} />
          <Input label="Email" required type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} />
          <Input label="Location" value={form.location} onChange={e => set('location', e.target.value)} />
          <Input label="Headline" value={form.headline} onChange={e => set('headline', e.target.value)} placeholder="Senior Backend Engineer @ X" className="col-span-2" />
          <Input label="Current company" value={form.current_company} onChange={e => set('current_company', e.target.value)} />
          <Input label="Current title" value={form.current_title} onChange={e => set('current_title', e.target.value)} />
          <Input label="Experience (yrs)" type="number" min="0" value={form.experience_years} onChange={e => set('experience_years', e.target.value)} />
          <Input label="Expected CTC (₹/yr)" type="number" value={form.expected_ctc} onChange={e => set('expected_ctc', e.target.value)} />
          <Input label="LinkedIn URL" value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} className="col-span-2" />
        </div>
        <div className="mt-4 space-y-4">
          <Input label="Skills (comma-separated)" value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="React, TypeScript, Node.js" />
          <Textarea label="Summary" rows={3} value={form.summary} onChange={e => set('summary', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
