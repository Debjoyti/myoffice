'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  PageHeader, Card, Button, Badge, Avatar, Modal, Select, EmptyState, Alert,
  Spinner, Textarea, DetailGrid, ProgressBar,
} from '@/components/ui'
import { ACTIVE_STAGES, STAGE_LABEL, STAGE_TRANSITIONS, type Stage } from '@/lib/services/careers'
import {
  ClipboardCheck, RefreshCw, Sparkles, ChevronRight, ChevronLeft, Star,
  Clock, Award, MessageSquare,
} from 'lucide-react'

type App = {
  id: string; stage: Stage; status: string; reference_no: string; source: string
  ai_match_score: number | null; ai_interview_score: number | null; recruiter_rating: number | null
  applied_at: string; expected_ctc: number | null; cover_note: string | null
  candidate: { id: string; full_name: string; email: string; headline: string | null; avatar_url: string | null; experience_years: number; skills: string[]; current_company: string | null; expected_ctc: number | null; profile_score: number } | null
  job: { id: string; title: string; location: string | null; work_mode: string } | null
}

const STAGE_ACCENT: Record<string, string> = {
  applied: 'border-t-slate-400', screening: 'border-t-blue-400', interview: 'border-t-violet-500',
  assessment: 'border-t-amber-500', offer: 'border-t-emerald-500', hired: 'border-t-emerald-600',
}

function scoreColor(s: number | null) {
  if (s == null) return 'text-slate-400'
  if (s >= 75) return 'text-emerald-600'
  if (s >= 55) return 'text-amber-600'
  return 'text-red-500'
}

export default function PipelinePage() {
  const [apps, setApps] = useState<App[]>([])
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([])
  const [jobFilter, setJobFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<App | null>(null)
  const [detailData, setDetailData] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams()
      if (jobFilter !== 'all') params.set('job_id', jobFilter)
      const res = await fetch(`/api/v1/careers/applications?${params}`)
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load')
      setApps((await res.json()).applications)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [jobFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/v1/careers/jobs').then(r => r.ok ? r.json() : { jobs: [] })
      .then(d => setJobs((d.jobs || []).map((j: any) => ({ id: j.id, title: j.title })))).catch(() => {})
  }, [])

  const byStage = useMemo(() => {
    const map = Object.fromEntries(ACTIVE_STAGES.map(s => [s, [] as App[]])) as Record<Stage, App[]>
    for (const a of apps) if (map[a.stage]) map[a.stage].push(a)
    return map
  }, [apps])

  const move = async (app: App, to: Stage) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/v1/careers/applications/${app.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_stage: to, ...(to === 'rejected' ? { rejection_reason: 'Moved to rejected from pipeline' } : {}) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await load()
      if (detail?.id === app.id) openDetail({ ...app, stage: to })
    } catch (e: any) { setError(e.message) }
    finally { setBusy(false) }
  }

  const openDetail = async (app: App) => {
    setDetail(app); setDetailData(null); setNote('')
    const res = await fetch(`/api/v1/careers/applications/${app.id}`)
    if (res.ok) setDetailData(await res.json())
  }

  const rate = async (r: number) => {
    if (!detail) return
    await fetch(`/api/v1/careers/applications/${detail.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recruiter_rating: r }),
    })
    openDetail(detail); load()
  }

  const addNote = async () => {
    if (!detail || !note.trim()) return
    setBusy(true)
    await fetch(`/api/v1/careers/applications/${detail.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: note.trim() }),
    })
    setNote(''); openDetail(detail); setBusy(false)
  }

  const generateInterview = async () => {
    if (!detail) return
    setBusy(true)
    try {
      const res = await fetch('/api/v1/careers/interviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: detail.id }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      openDetail(detail)
    } catch (e: any) { setError(e.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="ATS Pipeline"
        description="Drag candidates through the hiring funnel — AI match & interview scores at a glance."
        actions={<>
          <Select value={jobFilter} onChange={e => setJobFilter(e.target.value)} options={[{ value: 'all', label: 'All jobs' }, ...jobs.map(j => ({ value: j.id, label: j.title }))]} className="w-52" />
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={load} loading={loading}>Refresh</Button>
        </>}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="md" /></div>
      ) : apps.length === 0 ? (
        <Card><EmptyState icon={<ClipboardCheck className="h-6 w-6" />} title="No applications" description="Applications will appear here as candidates apply via the job board." /></Card>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {ACTIVE_STAGES.map(stage => (
            <div key={stage} className="flex-shrink-0 w-72">
              <div className={`bg-slate-50 rounded-xl border-t-[3px] ${STAGE_ACCENT[stage]} border border-slate-200 h-full flex flex-col`}>
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">{STAGE_LABEL[stage]}</span>
                  <Badge variant="neutral" size="sm">{byStage[stage].length}</Badge>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                  {byStage[stage].length === 0 && <p className="text-[11px] text-slate-400 text-center py-6">Empty</p>}
                  {byStage[stage].map(app => {
                    const nexts = STAGE_TRANSITIONS[stage].filter(s => s !== 'rejected')
                    return (
                      <div key={app.id} className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-2 cursor-pointer" onClick={() => openDetail(app)}>
                          <Avatar name={app.candidate?.full_name ?? '?'} src={app.candidate?.avatar_url ?? undefined} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-slate-800 truncate">{app.candidate?.full_name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{app.candidate?.headline ?? app.job?.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-[11px]">
                          <span className={`font-bold ${scoreColor(app.ai_match_score)}`}>Match {app.ai_match_score ?? '—'}%</span>
                          <span className={`font-bold flex items-center gap-0.5 ${scoreColor(app.ai_interview_score)}`}><Sparkles className="h-3 w-3" />{app.ai_interview_score ?? '—'}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                          <Button variant="ghost" size="icon" disabled={busy || stage === 'applied'} title="Move back"
                            onClick={() => { const prev = ACTIVE_STAGES[ACTIVE_STAGES.indexOf(stage) - 1]; if (prev) move(app, prev) }}>
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                          <button onClick={() => move(app, 'rejected')} disabled={busy} className="text-[10px] text-red-400 hover:text-red-600 font-medium">Reject</button>
                          {nexts[0] ? (
                            <Button variant="ghost" size="icon" disabled={busy} title={`Move to ${STAGE_LABEL[nexts[0]]}`} onClick={() => move(app, nexts[0])}>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          ) : <span className="w-8" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.candidate?.full_name ?? 'Candidate'} size="lg"
        footer={detail && (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => rate(n)} title={`Rate ${n}`}>
                  <Star className={`h-4 w-4 ${(detailData?.recruiter_rating ?? 0) >= n ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setDetail(null)}>Close</Button>
          </div>
        )}>
        {!detail ? null : !detailData ? <div className="flex justify-center py-8"><Spinner /></div> : (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <Avatar name={detail.candidate?.full_name ?? '?'} src={detail.candidate?.avatar_url ?? undefined} size="xl" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{detail.candidate?.headline}</p>
                <p className="text-xs text-slate-500">{detail.candidate?.email} · {detail.candidate?.current_company} · {detail.candidate?.experience_years}y exp</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="info">Match {detail.ai_match_score ?? '—'}%</Badge>
                  {detail.ai_interview_score != null && <Badge variant="default">AI interview {detail.ai_interview_score}</Badge>}
                  <Badge variant="neutral">{STAGE_LABEL[detail.stage]}</Badge>
                </div>
              </div>
            </div>

            {detail.candidate?.skills?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {detail.candidate.skills.map(s => <span key={s} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{s}</span>)}
              </div>
            ) : null}

            <DetailGrid cols={3} items={[
              { label: 'Applied for', value: detail.job?.title },
              { label: 'Reference', value: detail.reference_no },
              { label: 'Source', value: detail.source },
              { label: 'Expected CTC', value: detail.expected_ctc ? `₹${(detail.expected_ctc / 1e5).toFixed(1)}L` : '—' },
              { label: 'Profile score', value: `${detail.candidate?.profile_score ?? 0}%` },
              { label: 'Applied', value: new Date(detail.applied_at).toLocaleDateString() },
            ]} />

            {detailData.ai_match_reasons?.length ? (
              <Card padding="sm" className="bg-blue-50/40 border-blue-100">
                <p className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-blue-600" />AI match reasoning</p>
                <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                  {detailData.ai_match_reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                </ul>
              </Card>
            ) : null}

            {/* Interview block */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1"><Award className="h-3.5 w-3.5" />AI Interview</p>
                <Button variant="outline" size="sm" loading={busy} onClick={generateInterview} leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
                  {detailData.interviews?.length ? 'Regenerate' : 'Generate interview'}
                </Button>
              </div>
              {detailData.interviews?.length ? detailData.interviews.map((iv: any) => (
                <Card key={iv.id} padding="sm" className="mb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant={iv.status === 'completed' ? 'success' : 'warning'} dot>{iv.status}</Badge>
                      {iv.overall_score != null && <span className="ml-2 text-sm font-bold text-slate-800">{iv.overall_score}/100</span>}
                    </div>
                    <a href={`/careers/interview/${iv.id}`} className="text-xs text-blue-600 hover:underline">Open runner →</a>
                  </div>
                  {iv.status === 'completed' && (
                    <div className="mt-2 space-y-1.5">
                      {['relevancy', 'communication', 'structure'].map(k => iv.scores?.[k] != null && (
                        <div key={k} className="flex items-center gap-2">
                          <span className="w-24 text-[11px] text-slate-500 capitalize">{k}</span>
                          <ProgressBar value={iv.scores[k]} className="flex-1" />
                          <span className="text-[11px] font-medium w-8 text-right">{iv.scores[k]}</span>
                        </div>
                      ))}
                      {iv.summary && <p className="text-[11px] text-slate-600 mt-1">{iv.summary}</p>}
                    </div>
                  )}
                </Card>
              )) : <p className="text-[11px] text-slate-400">No interview yet. Generate one to send a one-way AI interview.</p>}
            </div>

            {/* Timeline */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Timeline</p>
              <div className="space-y-2 border-l border-slate-200 pl-3">
                {(detailData.events ?? []).map((e: any) => (
                  <div key={e.id} className="relative">
                    <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-slate-300" />
                    <p className="text-[11px] text-slate-700">{e.message}</p>
                    <p className="text-[10px] text-slate-400">{new Date(e.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Add note */}
            <div className="flex items-end gap-2">
              <Textarea label="Add a note" rows={2} value={note} onChange={e => setNote(e.target.value)} className="flex-1" placeholder="Strong systems-design answer..." />
              <Button size="sm" onClick={addNote} loading={busy} disabled={!note.trim()} leftIcon={<MessageSquare className="h-3.5 w-3.5" />}>Add</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
