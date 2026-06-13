'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, Badge, Alert, Spinner, ProgressBar, Textarea } from '@/components/ui'
import {
  Sparkles, Clock, ArrowRight, CheckCircle2, Mic, Lightbulb, ShieldCheck,
  Award, ThumbsUp, ThumbsDown, AlertTriangle,
} from 'lucide-react'

type Question = { id: string; competency: string; prompt: string; prep_seconds: number; answer_seconds: number }
type Interview = {
  id: string; status: string; questions: Question[]; overall_score: number | null
  recommendation: string | null; scores: any; strengths: string[]; concerns: string[]; summary: string | null
  candidate: { full_name: string } | null
  job: { id: string; title: string } | null
}

const COMP_LABEL: Record<string, string> = {
  communication: 'Communication', problem_solving: 'Problem Solving', teamwork: 'Teamwork',
  ownership: 'Ownership', role_expertise: 'Role Expertise',
}
const REC_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  strong_yes: 'success', yes: 'info', maybe: 'warning', no: 'danger',
}

export default function InterviewRunner() {
  const { id } = useParams<{ id: string }>()
  const [interview, setInterview] = useState<Interview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'welcome' | 'prep' | 'answer' | 'submitting' | 'done'>('welcome')
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [result, setResult] = useState<Interview | null>(null)
  const startRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/careers/interviews/${id}`)
      if (!res.ok) throw new Error((await res.json()).error || 'Not found')
      const data = await res.json()
      setInterview(data)
      if (data.status === 'completed') { setResult(data); setPhase('done') }
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  useEffect(() => clearTimer, [])

  const questions = interview?.questions ?? []
  const current = questions[qIndex]

  const startAnswer = useCallback(() => {
    if (!current) return
    setPhase('answer')
    setSecondsLeft(current.answer_seconds)
    startRef.current = Date.now()
    clearTimer()
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearTimer(); setTimeout(() => next(), 0); return 0 }
        return s - 1
      })
    }, 1000)
  }, [current]) // eslint-disable-line react-hooks/exhaustive-deps

  const startPrep = useCallback((idx: number) => {
    const q = questions[idx]
    if (!q) return
    setQIndex(idx); setPhase('prep'); setSecondsLeft(q.prep_seconds)
    clearTimer()
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => { if (s <= 1) { clearTimer(); setTimeout(() => startAnswer(), 0); return 0 } return s - 1 })
    }, 1000)
  }, [questions, startAnswer])

  const begin = async () => {
    // flip to in_progress on the server
    await fetch(`/api/v1/careers/interviews/${id}?start=true`).catch(() => {})
    startPrep(0)
  }

  const next = useCallback(() => {
    clearTimer()
    if (qIndex < questions.length - 1) startPrep(qIndex + 1)
    else submit()
  }, [qIndex, questions.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    clearTimer(); setPhase('submitting')
    try {
      const responses = questions.map(q => ({
        question_id: q.id, answer: answers[q.id] ?? '',
        duration_seconds: q.answer_seconds,
      }))
      const res = await fetch(`/api/v1/careers/interviews/${id}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ responses }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Submit failed')
      await load()
      setPhase('done')
    } catch (e: any) { setError(e.message); setPhase('answer') }
  }

  if (loading) return <div className="flex justify-center py-32"><Spinner size="md" /></div>

  if (error && !interview) return <Alert variant="danger" title="Interview unavailable">{error}</Alert>

  if (interview?.status === 'expired') return (
    <Card className="max-w-lg mx-auto mt-10 text-center py-10">
      <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
      <p className="text-sm font-semibold text-slate-700">This interview link has expired</p>
      <p className="text-xs text-slate-500 mt-1">Please contact the recruiter for a new invitation.</p>
    </Card>
  )

  const r = result
  const mins = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="max-w-2xl mx-auto py-4">
      {error && phase !== 'done' && <div className="mb-4"><Alert variant="danger">{error}</Alert></div>}

      {/* WELCOME */}
      {phase === 'welcome' && (
        <Card className="text-center py-8 px-6">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center mb-4">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">AI Interview</h1>
          <p className="text-sm text-slate-500 mt-1">{interview?.job?.title}{interview?.candidate ? ` · ${interview.candidate.full_name}` : ''}</p>

          <div className="grid grid-cols-3 gap-3 mt-6 text-left">
            <div className="bg-slate-50 rounded-lg p-3">
              <Lightbulb className="h-4 w-4 text-amber-500 mb-1" />
              <p className="text-[11px] font-semibold text-slate-700">{questions.length} questions</p>
              <p className="text-[10px] text-slate-500">Behavioural, STAR-style</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <Clock className="h-4 w-4 text-blue-500 mb-1" />
              <p className="text-[11px] font-semibold text-slate-700">~{Math.ceil(questions.reduce((s, q) => s + q.prep_seconds + q.answer_seconds, 0) / 60)} min</p>
              <p className="text-[10px] text-slate-500">Prep + timed answers</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <ShieldCheck className="h-4 w-4 text-emerald-500 mb-1" />
              <p className="text-[11px] font-semibold text-slate-700">Scored on content</p>
              <p className="text-[10px] text-slate-500">Words, not looks</p>
            </div>
          </div>

          <Alert variant="info" title="How it works">
            Each question gives you a short prep window, then a timed answer. Use the <b>STAR</b> method —
            Situation, Task, Action, Result. Answers are auto-saved; the timer auto-advances.
          </Alert>

          <Button className="mt-5" onClick={begin} rightIcon={<ArrowRight className="h-4 w-4" />} disabled={!questions.length}>
            Start interview
          </Button>
          <p className="text-[10px] text-slate-400 mt-3">This employer uses AI to assess your responses. By continuing you consent to AI evaluation.</p>
        </Card>
      )}

      {/* PREP / ANSWER */}
      {(phase === 'prep' || phase === 'answer') && current && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Question {qIndex + 1} of {questions.length}</span>
            <Badge variant="default">{COMP_LABEL[current.competency] ?? current.competency}</Badge>
          </div>
          <ProgressBar value={qIndex + (phase === 'answer' ? 0.5 : 0)} max={questions.length} className="mb-4" />

          <Card className="mb-4">
            <p className="text-base font-semibold text-slate-900 leading-relaxed">{current.prompt}</p>
          </Card>

          {phase === 'prep' ? (
            <Card className="text-center py-6 bg-amber-50/40 border-amber-100">
              <p className="text-xs font-medium text-amber-700">Get ready — answer starts in</p>
              <p className="text-3xl font-bold text-amber-600 my-2 tabular-nums">{secondsLeft}s</p>
              <p className="text-[11px] text-slate-500">Jot down a Situation → Task → Action → Result.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { clearTimer(); startAnswer() }}>Skip prep, start now</Button>
            </Card>
          ) : (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600"><Mic className="h-3.5 w-3.5 text-red-500" />Recording your answer</span>
                <span className={`text-sm font-bold tabular-nums ${secondsLeft <= 20 ? 'text-red-500' : 'text-slate-700'}`}>{mins(secondsLeft)}</span>
              </div>
              <Textarea rows={7} autoFocus value={answers[current.id] ?? ''} placeholder="Type your answer here... (Situation, Task, Action, Result)"
                onChange={e => setAnswers(a => ({ ...a, [current.id]: e.target.value }))} />
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-slate-400">{(answers[current.id] ?? '').trim().split(/\s+/).filter(Boolean).length} words</span>
                <Button size="sm" onClick={next} rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  {qIndex < questions.length - 1 ? 'Next question' : 'Finish & submit'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* SUBMITTING */}
      {phase === 'submitting' && (
        <Card className="text-center py-12">
          <Spinner size="md" />
          <p className="text-sm font-medium text-slate-700 mt-4">Scoring your interview…</p>
          <p className="text-xs text-slate-500 mt-1">Evaluating relevancy, structure and communication.</p>
        </Card>
      )}

      {/* DONE — instant report */}
      {phase === 'done' && r && (
        <Card className="py-6">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3"><CheckCircle2 className="h-6 w-6 text-emerald-600" /></div>
            <h1 className="text-lg font-bold text-slate-900">Interview complete</h1>
            <p className="text-xs text-slate-500">Thanks{r.candidate ? `, ${r.candidate.full_name.split(' ')[0]}` : ''}! Here's your instant AI assessment.</p>
          </div>

          <div className="flex items-center justify-center gap-6 my-6">
            <div className="text-center">
              <p className={`text-4xl font-bold ${(r.overall_score ?? 0) >= 75 ? 'text-emerald-600' : (r.overall_score ?? 0) >= 55 ? 'text-amber-600' : 'text-red-500'}`}>{r.overall_score}</p>
              <p className="text-[10px] text-slate-400">overall / 100</p>
            </div>
            {r.recommendation && (
              <div className="text-center">
                <Badge variant={REC_VARIANT[r.recommendation]} className="text-sm px-3 py-1"><Award className="h-3.5 w-3.5 mr-1" />{r.recommendation.replace('_', ' ')}</Badge>
              </div>
            )}
          </div>

          {r.summary && <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 mb-4">{r.summary}</p>}

          <div className="space-y-2 mb-4">
            {['relevancy', 'communication', 'structure'].map(k => r.scores?.[k] != null && (
              <div key={k} className="flex items-center gap-2">
                <span className="w-28 text-[11px] text-slate-500 capitalize">{k}</span>
                <ProgressBar value={r.scores[k]} className="flex-1" />
                <span className="text-[11px] font-medium w-8 text-right">{r.scores[k]}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-700 mb-1.5 flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />Strengths</p>
              <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">{(r.strengths ?? []).map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1"><ThumbsDown className="h-3.5 w-3.5" />To improve</p>
              <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">{(r.concerns ?? []).length ? r.concerns.map((s, i) => <li key={i}>{s}</li>) : <li className="list-none text-slate-400">Nothing major</li>}</ul>
            </div>
          </div>

          {(r as any).integrity_flags?.length > 0 && (
            <div className="mt-4"><Alert variant="warning"><span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />Some answers looked unusually polished — a recruiter may follow up.</span></Alert></div>
          )}

          <div className="text-center mt-6">
            <Link href="/careers/board"><Button variant="outline" size="sm">Back to job board</Button></Link>
          </div>
        </Card>
      )}
    </div>
  )
}
