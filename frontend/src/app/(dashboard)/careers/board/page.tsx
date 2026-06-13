'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card, Button, Badge, Modal, Input, Textarea, Select, EmptyState, Alert,
  Spinner,
} from '@/components/ui'
import { formatSalary, formatExperience } from '@/lib/services/careers'
import {
  Globe, MapPin, Briefcase, Sparkles, Search, Building2, Clock, Send,
  CheckCircle2, ArrowRight, Filter,
} from 'lucide-react'

type Job = {
  id: string; title: string; department_name: string | null; summary: string | null
  description: string | null; responsibilities: string[]; requirements: string[]; perks: string[]
  skills: string[]; employment_type: string; work_mode: string; experience_level: string
  min_experience: number; max_experience: number | null; location: string | null
  currency: string; salary_min: number | null; salary_max: number | null; salary_period: string
  show_salary: boolean; is_featured: boolean; is_urgent: boolean; ai_interview_enabled: boolean
}

const WORK_MODE_LABEL: Record<string, string> = { onsite: 'On-site', hybrid: 'Hybrid', remote: 'Remote' }
const TYPE_LABEL: Record<string, string> = { full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', internship: 'Internship', temporary: 'Temporary' }

const blankApply = {
  full_name: '', email: '', phone: '', headline: '', location: '', summary: '',
  skills: '', experience_years: '', current_company: '', expected_ctc: '', linkedin_url: '', cover_note: '',
}

export default function JobBoardPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState('all')
  const [detail, setDetail] = useState<Job | null>(null)
  const [applyJob, setApplyJob] = useState<Job | null>(null)
  const [form, setForm] = useState(blankApply)
  const [submitting, setSubmitting] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [result, setResult] = useState<{ match: any; interview: any } | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/v1/careers/jobs?status=open')
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load')
      setJobs((await res.json()).jobs)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => jobs.filter(j => {
    if (modeFilter !== 'all' && j.work_mode !== modeFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return j.title.toLowerCase().includes(q) || (j.location ?? '').toLowerCase().includes(q) ||
      j.skills.some(s => s.toLowerCase().includes(q)) || (j.department_name ?? '').toLowerCase().includes(q)
  }), [jobs, search, modeFilter])

  const openApply = (j: Job) => { setApplyJob(j); setForm(blankApply); setApplyError(null); setResult(null); setDetail(null) }

  const submit = async () => {
    if (!applyJob) return
    setSubmitting(true); setApplyError(null)
    try {
      const res = await fetch('/api/v1/careers/applications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: applyJob.id, source: 'portal', cover_note: form.cover_note.trim() || undefined,
          expected_ctc: form.expected_ctc ? Number(form.expected_ctc) : null,
          candidate: {
            full_name: form.full_name.trim(), email: form.email.trim(),
            phone: form.phone.trim() || undefined, headline: form.headline.trim() || undefined,
            location: form.location.trim() || undefined, summary: form.summary.trim() || undefined,
            skills: form.skills.split(/[,\n]/).map(s => s.trim()).filter(Boolean),
            experience_years: Number(form.experience_years) || 0,
            current_company: form.current_company.trim() || undefined,
            expected_ctc: form.expected_ctc ? Number(form.expected_ctc) : null,
            linkedin_url: form.linkedin_url.trim() || undefined,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Could not submit application')
      setResult({ match: data.match, interview: data.interview })
    } catch (e: any) { setApplyError(e.message) }
    finally { setSubmitting(false) }
  }

  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10"><Globe className="h-48 w-48 -mr-8 -mt-8" /></div>
        <div className="relative">
          <Badge className="bg-white/20 text-white ring-white/30 mb-3">We're hiring</Badge>
          <h1 className="text-2xl font-bold">Find your next role</h1>
          <p className="text-sm text-blue-100 mt-1 max-w-lg">Browse open positions, apply in one step, and complete an AI interview on your own time. Pay ranges shown upfront.</p>
          <div className="flex items-center gap-2 mt-4 max-w-md">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles, skills, locations..."
                className="w-full h-10 pl-10 pr-3 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-white/50" />
            </div>
          </div>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-500">{filtered.length} open position{filtered.length !== 1 ? 's' : ''}</p>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <Select value={modeFilter} onChange={e => setModeFilter(e.target.value)} options={[
            { value: 'all', label: 'All work modes' }, { value: 'remote', label: 'Remote' },
            { value: 'hybrid', label: 'Hybrid' }, { value: 'onsite', label: 'On-site' },
          ]} className="w-40" />
        </div>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size="md" /></div>
      : filtered.length === 0 ? (
        <Card><EmptyState icon={<Briefcase className="h-6 w-6" />} title="No open roles" description="Check back soon — or seed demo jobs from the Hiring Cockpit." /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(j => (
            <Card key={j.id} hover className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{j.title}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-3 w-3" />{j.department_name ?? 'Team'}
                  </p>
                </div>
                {j.is_urgent && <Badge variant="danger" size="sm">Urgent</Badge>}
                {!j.is_urgent && j.is_featured && <Badge variant="default" size="sm">Featured</Badge>}
              </div>

              {j.summary && <p className="text-xs text-slate-600 mt-2 line-clamp-2">{j.summary}</p>}

              <div className="flex flex-wrap gap-1.5 mt-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location ?? WORK_MODE_LABEL[j.work_mode]}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatExperience(j.min_experience, j.max_experience)}</span>
                <span>·</span><span>{TYPE_LABEL[j.employment_type]}</span>
              </div>

              <div className="flex flex-wrap gap-1 mt-3">
                {j.skills.slice(0, 4).map(s => <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{s}</span>)}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <span className="text-xs font-semibold text-emerald-700">{j.show_salary ? formatSalary(j.salary_min, j.salary_max, j.currency, j.salary_period) : 'Competitive'}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => setDetail(j)}>Details</Button>
                  <Button size="sm" onClick={() => openApply(j)} rightIcon={<ArrowRight className="h-3 w-3" />}>Apply</Button>
                </div>
              </div>
              {j.ai_interview_enabled && <p className="text-[10px] text-violet-600 flex items-center gap-1 mt-2"><Sparkles className="h-3 w-3" />Includes a short AI interview</p>}
            </Card>
          ))}
        </div>
      )}

      {/* Job detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title ?? 'Role'} size="lg"
        footer={detail && <Button size="sm" onClick={() => openApply(detail)} rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>Apply now</Button>}>
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{WORK_MODE_LABEL[detail.work_mode]}</Badge>
              <Badge variant="neutral">{TYPE_LABEL[detail.employment_type]}</Badge>
              <Badge variant="neutral">{formatExperience(detail.min_experience, detail.max_experience)}</Badge>
              {detail.show_salary && <Badge variant="success">{formatSalary(detail.salary_min, detail.salary_max, detail.currency, detail.salary_period)}</Badge>}
              {detail.location && <Badge variant="neutral">{detail.location}</Badge>}
            </div>
            {detail.description && <p className="text-xs text-slate-600 whitespace-pre-wrap">{detail.description}</p>}
            {detail.responsibilities?.length > 0 && (
              <div><p className="text-xs font-semibold text-slate-700 mb-1">What you'll do</p>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">{detail.responsibilities.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
            )}
            {detail.requirements?.length > 0 && (
              <div><p className="text-xs font-semibold text-slate-700 mb-1">What we're looking for</p>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">{detail.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
            )}
            {detail.perks?.length > 0 && (
              <div><p className="text-xs font-semibold text-slate-700 mb-1">Perks</p>
                <div className="flex flex-wrap gap-1.5">{detail.perks.map(p => <span key={p} className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">{p}</span>)}</div></div>
            )}
          </div>
        )}
      </Modal>

      {/* Apply */}
      <Modal open={!!applyJob} onClose={() => setApplyJob(null)} title={result ? 'Application submitted' : `Apply · ${applyJob?.title ?? ''}`} size="lg"
        footer={!result ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => setApplyJob(null)} disabled={submitting}>Cancel</Button>
            <Button size="sm" onClick={submit} loading={submitting} leftIcon={<Send className="h-3.5 w-3.5" />}>Submit application</Button>
          </>
        ) : <Button size="sm" onClick={() => setApplyJob(null)}>Done</Button>}>
        {result ? (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="h-7 w-7 text-emerald-600" /></div>
            <div>
              <p className="text-sm font-semibold text-slate-800">You're in! AI match score: {result.match?.score}%</p>
              <p className="text-xs text-slate-500 mt-1">Your application for {applyJob?.title} has been received.</p>
            </div>
            {result.match?.reasons?.length ? (
              <div className="text-left bg-slate-50 rounded-lg p-3 max-w-sm mx-auto">
                <p className="text-[11px] font-semibold text-slate-600 mb-1">Why you matched</p>
                <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc list-inside">{result.match.reasons.slice(0, 3).map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
              </div>
            ) : null}
            {result.interview && (
              <a href={`/careers/interview/${result.interview.id}`}>
                <Button leftIcon={<Sparkles className="h-3.5 w-3.5" />}>Start your AI interview now</Button>
              </a>
            )}
            <p className="text-[10px] text-slate-400 max-w-sm mx-auto">This employer uses AI to help assess applications. Your answers are scored on content and structure.</p>
          </div>
        ) : (
          <>
            {applyError && <div className="mb-4"><Alert variant="danger">{applyError}</Alert></div>}
            <div className="grid grid-cols-2 gap-4">
              <Input label="Full name" required value={form.full_name} onChange={e => set('full_name', e.target.value)} />
              <Input label="Email" required type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} />
              <Input label="Location" value={form.location} onChange={e => set('location', e.target.value)} />
              <Input label="Headline" value={form.headline} onChange={e => set('headline', e.target.value)} placeholder="Senior Engineer @ X" className="col-span-2" />
              <Input label="Current company" value={form.current_company} onChange={e => set('current_company', e.target.value)} />
              <Input label="Experience (yrs)" type="number" min="0" value={form.experience_years} onChange={e => set('experience_years', e.target.value)} />
              <Input label="Expected CTC (₹/yr)" type="number" value={form.expected_ctc} onChange={e => set('expected_ctc', e.target.value)} />
              <Input label="LinkedIn URL" value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} />
            </div>
            <div className="mt-4 space-y-4">
              <Input label="Skills (comma-separated — improves your match score)" value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="React, TypeScript, Node.js" />
              <Textarea label="Cover note (optional)" rows={3} value={form.cover_note} onChange={e => set('cover_note', e.target.value)} placeholder="Why you're a great fit..." />
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
