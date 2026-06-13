'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, StatCard, Button, Badge, Avatar, Modal, EmptyState, Alert,
  Spinner, ProgressBar, TabBar,
} from '@/components/ui'
import {
  Sparkles, RefreshCw, Video, CheckCircle2, Clock, Award, ThumbsUp, ThumbsDown,
  AlertTriangle, ExternalLink, Copy,
} from 'lucide-react'

type Interview = {
  id: string; status: string; overall_score: number | null; recommendation: string | null
  access_token: string; created_at: string; completed_at: string | null
  scores: any; strengths: string[]; concerns: string[]; summary: string | null
  integrity_flags: string[]; questions: any[]; responses: any[]
  candidate: { id: string; full_name: string; avatar_url: string | null; headline: string | null } | null
  job: { id: string; title: string } | null
}

const REC_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  strong_yes: 'success', yes: 'info', maybe: 'warning', no: 'danger',
}
const STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  pending: 'neutral', invited: 'info', in_progress: 'warning', completed: 'success', expired: 'danger', abandoned: 'danger',
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [summary, setSummary] = useState({ total: 0, pending: 0, completed: 0, avg_score: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState('all')
  const [report, setReport] = useState<Interview | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/v1/careers/interviews')
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load')
      const data = await res.json()
      setInterviews(data.interviews); setSummary(data.summary)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = interviews.filter(i =>
    tab === 'all' ? true : tab === 'completed' ? i.status === 'completed' : ['pending', 'invited', 'in_progress'].includes(i.status))

  const copyLink = (iv: Interview) => {
    navigator.clipboard.writeText(`${location.origin}/careers/interview/${iv.id}`)
    setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Interviews"
        description="Structured, competency-based async interviews — auto-generated and AI-scored on the words that matter."
        actions={<Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={load} loading={loading}>Refresh</Button>}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={summary.total} icon={<Video className="h-4 w-4" />} accent="blue" loading={loading} />
        <StatCard label="Pending" value={summary.pending} icon={<Clock className="h-4 w-4" />} accent="amber" loading={loading} />
        <StatCard label="Completed" value={summary.completed} icon={<CheckCircle2 className="h-4 w-4" />} accent="emerald" loading={loading} />
        <StatCard label="Avg Score" value={`${summary.avg_score}`} icon={<Award className="h-4 w-4" />} accent="violet" loading={loading} />
      </div>

      <Card padding="none">
        <div className="px-4 pt-2">
          <TabBar active={tab} onChange={setTab} tabs={[
            { id: 'all', label: 'All', count: interviews.length },
            { id: 'active', label: 'Pending', count: interviews.filter(i => ['pending', 'invited', 'in_progress'].includes(i.status)).length },
            { id: 'completed', label: 'Completed', count: interviews.filter(i => i.status === 'completed').length },
          ]} />
        </div>

        {loading ? <div className="flex justify-center py-16"><Spinner /></div>
        : filtered.length === 0 ? (
          <EmptyState icon={<Sparkles className="h-6 w-6" />} title="No interviews" description="Generate AI interviews from the ATS pipeline." />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(iv => (
              <div key={iv.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
                <Avatar name={iv.candidate?.full_name ?? '?'} src={iv.candidate?.avatar_url ?? undefined} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{iv.candidate?.full_name ?? 'Candidate'}</p>
                  <p className="text-xs text-slate-500 truncate">{iv.job?.title} · {iv.questions?.length ?? 0} questions</p>
                </div>
                {iv.overall_score != null && (
                  <div className="text-center w-14">
                    <p className={`text-lg font-bold ${iv.overall_score >= 75 ? 'text-emerald-600' : iv.overall_score >= 55 ? 'text-amber-600' : 'text-red-500'}`}>{iv.overall_score}</p>
                    <p className="text-[9px] text-slate-400 -mt-1">/100</p>
                  </div>
                )}
                {iv.recommendation && <Badge variant={REC_VARIANT[iv.recommendation]}>{iv.recommendation.replace('_', ' ')}</Badge>}
                <Badge variant={STATUS_VARIANT[iv.status]} dot>{iv.status}</Badge>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" title="Copy interview link" onClick={() => copyLink(iv)}><Copy className="h-3.5 w-3.5" /></Button>
                  {iv.status === 'completed'
                    ? <Button variant="outline" size="sm" onClick={() => setReport(iv)}>Report</Button>
                    : <a href={`/careers/interview/${iv.id}`}><Button variant="outline" size="sm" rightIcon={<ExternalLink className="h-3 w-3" />}>Open</Button></a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {copied && <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">Interview link copied</div>}

      {/* Report */}
      <Modal open={!!report} onClose={() => setReport(null)} title="Interview Report" size="lg"
        footer={<Button variant="ghost" size="sm" onClick={() => setReport(null)}>Close</Button>}>
        {report && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={report.candidate?.full_name ?? '?'} src={report.candidate?.avatar_url ?? undefined} size="xl" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{report.candidate?.full_name}</p>
                <p className="text-xs text-slate-500">{report.job?.title}</p>
              </div>
              <div className="text-center">
                <p className={`text-3xl font-bold ${(report.overall_score ?? 0) >= 75 ? 'text-emerald-600' : (report.overall_score ?? 0) >= 55 ? 'text-amber-600' : 'text-red-500'}`}>{report.overall_score}</p>
                <p className="text-[10px] text-slate-400 -mt-1">overall / 100</p>
                {report.recommendation && <Badge variant={REC_VARIANT[report.recommendation]} className="mt-1">{report.recommendation.replace('_', ' ')}</Badge>}
              </div>
            </div>

            {report.summary && <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3">{report.summary}</p>}

            {/* competency bars */}
            <div className="space-y-2">
              {['relevancy', 'communication', 'structure', 'role_expertise'].map(k => report.scores?.[k] != null && (
                <div key={k} className="flex items-center gap-2">
                  <span className="w-28 text-[11px] text-slate-500 capitalize">{k.replace('_', ' ')}</span>
                  <ProgressBar value={report.scores[k]} className="flex-1" color={k === 'communication' ? 'indigo' : 'blue'} />
                  <span className="text-[11px] font-medium w-8 text-right">{report.scores[k]}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-emerald-700 mb-1.5 flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />Strengths</p>
                <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">{(report.strengths ?? []).map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1"><ThumbsDown className="h-3.5 w-3.5" />Concerns</p>
                <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">{(report.concerns ?? []).length ? report.concerns.map((s, i) => <li key={i}>{s}</li>) : <li className="list-none text-slate-400">None flagged</li>}</ul>
              </div>
            </div>

            {report.integrity_flags?.length > 0 && (
              <Alert variant="warning" title="Integrity signals">
                <span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />{report.integrity_flags.join(', ')} — review with a follow-up question.</span>
              </Alert>
            )}

            {/* transcript */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Transcript</p>
              <div className="space-y-3">
                {(report.questions ?? []).map((q: any, i: number) => {
                  const r = (report.responses ?? []).find((x: any) => x.question_id === q.id)
                  const pq = report.scores?.per_question?.find((x: any) => x.question_id === q.id)
                  return (
                    <div key={q.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-medium text-slate-700">Q{i + 1}. {q.prompt}</p>
                        {pq && <Badge variant="neutral" size="sm">{pq.score}</Badge>}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1.5 whitespace-pre-wrap">{r?.answer || <span className="text-slate-400 italic">No answer</span>}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
