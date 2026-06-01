'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  Video, Plus, Brain, Star, Eye, Send, Copy, CheckCircle2, Clock,
  AlertTriangle, Mic, Monitor, Users, BarChart3, Zap, Shield,
  PlayCircle, FileText, TrendingUp, Settings, Download
} from 'lucide-react'

// ── Mock data ──────────────────────────────────────────────────────────
const MOCK_INTERVIEWS = [
  {
    id: '1', title: 'Senior Backend Engineer — Round 1', job: 'Senior Backend Engineer',
    type: 'async_video', status: 'active', created: '2026-05-28',
    deadline: '2026-06-07', questions: 5, time_per_q: 3,
    invited: 12, submitted: 8, reviewed: 5, shortlisted: 3,
    avg_ai_score: 74,
  },
  {
    id: '2', title: 'Product Manager — Screening', job: 'Product Manager',
    type: 'async_video', status: 'active', created: '2026-05-25',
    deadline: '2026-06-05', questions: 4, time_per_q: 2,
    invited: 18, submitted: 14, reviewed: 14, shortlisted: 6,
    avg_ai_score: 68,
  },
  {
    id: '3', title: 'Sales Executive — Mass Hiring', job: 'Sales Executive',
    type: 'async_video', status: 'closed', created: '2026-05-10',
    deadline: '2026-05-24', questions: 3, time_per_q: 2,
    invited: 45, submitted: 38, reviewed: 38, shortlisted: 12,
    avg_ai_score: 71,
  },
]

const MOCK_RESPONSES = [
  {
    id: 'r1', candidate: 'Arjun Mehta', email: 'arjun.mehta@gmail.com',
    interview: 'Senior Backend Engineer — Round 1',
    submitted_at: '2026-05-30 10:24 AM', duration: '14m 32s',
    ai_score: 84, communication: 88, technical: 80, confidence: 82,
    proctoring_flags: 0, status: 'shortlisted',
    ai_summary: 'Strong technical foundation with clear articulation of system design concepts. Demonstrated hands-on experience with distributed systems. Communication is confident and structured.',
  },
  {
    id: 'r2', candidate: 'Priya Sharma', email: 'priya.s@outlook.com',
    interview: 'Senior Backend Engineer — Round 1',
    submitted_at: '2026-05-30 2:10 PM', duration: '12m 18s',
    ai_score: 71, communication: 75, technical: 68, confidence: 70,
    proctoring_flags: 1, status: 'under_review',
    ai_summary: 'Good communication skills and enthusiasm. Technical answers lacked depth in database optimization. 1 proctoring flag — brief tab switch detected.',
  },
  {
    id: 'r3', candidate: 'Rahul Gupta', email: 'rahul.g@yahoo.com',
    interview: 'Senior Backend Engineer — Round 1',
    submitted_at: '2026-05-29 4:45 PM', duration: '16m 02s',
    ai_score: 91, communication: 90, technical: 93, confidence: 88,
    proctoring_flags: 0, status: 'shortlisted',
    ai_summary: 'Exceptional candidate. Articulated complex microservices architecture fluently. Deep knowledge of Kafka, Redis, and Postgres. Highly recommend for next round.',
  },
  {
    id: 'r4', candidate: 'Sneha Patel', email: 'sneha.p@gmail.com',
    interview: 'Senior Backend Engineer — Round 1',
    submitted_at: '2026-05-29 9:00 AM', duration: '9m 44s',
    ai_score: 52, communication: 60, technical: 45, confidence: 55,
    proctoring_flags: 3, status: 'rejected',
    ai_summary: 'Answers were brief and lacked technical specificity. Multiple proctoring flags including 2 tab switches and 1 face-not-detected event. Recommend rejection.',
  },
]

const MOCK_QUESTIONS = [
  { id: 'q1', text: 'Tell me about yourself and why you want this role.', category: 'Intro', time: 2, ai_generated: false },
  { id: 'q2', text: 'Describe a complex backend system you designed. What were the key architectural decisions?', category: 'Technical', time: 3, ai_generated: true },
  { id: 'q3', text: 'How do you handle database performance issues at scale? Give a specific example.', category: 'Technical', time: 3, ai_generated: true },
  { id: 'q4', text: 'Describe a situation where you had to make a critical technical decision under time pressure.', category: 'Behavioral', time: 2, ai_generated: true },
  { id: 'q5', text: 'Where do you see yourself in 3 years, and how does this role fit?', category: 'Culture', time: 2, ai_generated: false },
]

const STATUS_VARIANT: Record<string, any> = {
  active: 'success', closed: 'neutral', draft: 'neutral',
  shortlisted: 'success', under_review: 'warning', rejected: 'danger', submitted: 'info',
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">{label}</span>
        <span className={`font-bold ${color}`}>{score}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 65 ? 'bg-blue-500' : 'bg-amber-400'}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function AIScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 65 ? 'bg-blue-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className={`${color} text-white text-sm font-black w-10 h-10 rounded-xl flex items-center justify-center`}>
      {score}
    </div>
  )
}

export default function AIInterviewsPage() {
  const [tab, setTab] = useState('interviews')
  const [search, setSearch] = useState('')
  const [newInterview, setNewInterview] = useState(false)
  const [viewResponse, setViewResponse] = useState<any>(null)
  const [selectedInterview, setSelectedInterview] = useState<any>(MOCK_INTERVIEWS[0])
  const [genQuestions, setGenQuestions] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [generatedQs, setGeneratedQs] = useState<string[]>([])

  const [form, setForm] = useState({
    title: '', job_title: '', type: 'async_video', deadline: '',
    time_per_q: '3', max_retakes: '1', proctoring: true,
    ai_scoring: true, require_webcam: true,
  })

  const totalInvited    = MOCK_INTERVIEWS.reduce((s, i) => s + i.invited, 0)
  const totalSubmitted  = MOCK_INTERVIEWS.reduce((s, i) => s + i.submitted, 0)
  const totalShortlisted= MOCK_INTERVIEWS.reduce((s, i) => s + i.shortlisted, 0)
  const avgScore        = Math.round(MOCK_INTERVIEWS.reduce((s, i) => s + i.avg_ai_score, 0) / MOCK_INTERVIEWS.length)

  const handleGenerateQuestions = async () => {
    setAiGenerating(true)
    await new Promise(r => setTimeout(r, 1800))
    setGeneratedQs([
      `Describe a time you optimized a slow API endpoint. What tools and techniques did you use?`,
      `Walk me through how you'd design a real-time notification system for 1 million users.`,
      `How do you approach technical debt in a fast-moving startup environment?`,
      `Explain the difference between eventual consistency and strong consistency. When would you use each?`,
      `Tell me about a production incident you resolved. What was the root cause and your fix?`,
    ])
    setAiGenerating(false)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="AI Interview Suite"
        description="Async video interviews with AI scoring, proctoring, and candidate intelligence — powered by Zia AI"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Brain className="h-3.5 w-3.5" />} onClick={() => setGenQuestions(true)}>
              AI Question Generator
            </Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewInterview(true)}>
              New Interview
            </Button>
          </>
        }
      />

      {/* AI Banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white">
        <Brain className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold">Zia AI is scoring all responses in real-time</p>
          <p className="text-xs opacity-80">Communication · Technical depth · Confidence · Relevance · Proctoring alerts</p>
        </div>
        <Badge variant="success" className="bg-white/20 text-white border-0 text-xs">Active</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Invited" value={totalInvited.toString()} icon={<Send className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Responses Received" value={totalSubmitted.toString()} icon={<Video className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" delta={{ value: `${Math.round(totalSubmitted/totalInvited*100)}% completion`, positive: true }} />
        <StatCard label="Shortlisted" value={totalShortlisted.toString()} icon={<Star className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Avg AI Score" value={`${avgScore}/100`} icon={<Brain className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
      </div>

      <TabBar
        tabs={[
          { id: 'interviews', label: 'Interviews', count: MOCK_INTERVIEWS.length },
          { id: 'responses', label: 'Responses', count: MOCK_RESPONSES.length },
          { id: 'questions', label: 'Question Bank' },
          { id: 'settings', label: 'AI Settings' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ── Interviews Tab ─────────────────────────────────────────── */}
      {tab === 'interviews' && (
        <div className="space-y-4">
          {MOCK_INTERVIEWS.map(iv => {
            const completion = Math.round((iv.submitted / iv.invited) * 100)
            return (
              <Card key={iv.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800">{iv.title}</h3>
                      <Badge variant={STATUS_VARIANT[iv.status]}>{iv.status}</Badge>
                      <Badge variant="info"><span className="flex items-center gap-1"><Video className="h-3 w-3" />Async Video</span></Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{iv.questions} questions · {iv.time_per_q} min/answer · Deadline: {iv.deadline}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" leftIcon={<Copy className="h-3.5 w-3.5" />} title="Copy invite link">Copy Link</Button>
                    <Button variant="outline" size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>Invite Candidates</Button>
                    <Button size="sm" leftIcon={<Eye className="h-3.5 w-3.5" />} onClick={() => { setSelectedInterview(iv); setTab('responses') }}>View Responses</Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                  {[
                    { label: 'Invited', value: iv.invited, color: 'text-slate-700' },
                    { label: 'Submitted', value: iv.submitted, color: 'text-blue-600' },
                    { label: 'Reviewed', value: iv.reviewed, color: 'text-violet-600' },
                    { label: 'Shortlisted', value: iv.shortlisted, color: 'text-emerald-600' },
                    { label: 'Avg AI Score', value: iv.avg_ai_score, color: iv.avg_ai_score >= 70 ? 'text-emerald-600' : 'text-amber-600', suffix: '/100' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-slate-400">{s.label}</p>
                      <p className={`text-xl font-black ${s.color}`}>{s.value}{s.suffix ?? ''}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Completion rate</span>
                    <span className="font-semibold text-slate-600">{completion}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${completion >= 70 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${completion}%` }} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Responses Tab ──────────────────────────────────────────── */}
      {tab === 'responses' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <SearchInput placeholder="Search candidates..." value={search} onChange={setSearch} className="w-64" />
            <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white">
              <option>All Interviews</option>
              {MOCK_INTERVIEWS.map(i => <option key={i.id}>{i.title}</option>)}
            </select>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />} className="ml-auto">Export Report</Button>
          </div>

          {MOCK_RESPONSES.filter(r => !search || r.candidate.toLowerCase().includes(search.toLowerCase())).map(resp => (
            <Card key={resp.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewResponse(resp)}>
              <div className="flex items-start gap-4">
                <AIScoreBadge score={resp.ai_score} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800">{resp.candidate}</p>
                    <Badge variant={STATUS_VARIANT[resp.status]}>{resp.status.replace('_',' ')}</Badge>
                    {resp.proctoring_flags > 0 && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="h-3 w-3" />{resp.proctoring_flags} flag{resp.proctoring_flags > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{resp.email} · Submitted {resp.submitted_at} · Duration: {resp.duration}</p>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 italic">"{resp.ai_summary}"</p>
                </div>
                <div className="hidden sm:flex gap-4 flex-shrink-0">
                  {[
                    { label: 'Communication', score: resp.communication },
                    { label: 'Technical', score: resp.technical },
                    { label: 'Confidence', score: resp.confidence },
                  ].map(s => (
                    <div key={s.label} className="text-center w-20">
                      <p className="text-[10px] text-slate-400">{s.label}</p>
                      <p className={`text-lg font-black ${s.score >= 80 ? 'text-emerald-600' : s.score >= 65 ? 'text-blue-600' : 'text-amber-600'}`}>{s.score}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Question Bank ──────────────────────────────────────────── */}
      {tab === 'questions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{MOCK_QUESTIONS.length} questions in bank</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" leftIcon={<Brain className="h-3.5 w-3.5" />} onClick={() => setGenQuestions(true)}>AI Generate</Button>
              <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>Add Question</Button>
            </div>
          </div>
          <div className="space-y-2">
            {MOCK_QUESTIONS.map((q, i) => (
              <Card key={q.id}>
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">Q{i+1}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{q.text}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{q.category}</span>
                      <span className="text-[10px] text-slate-400">{q.time} min</span>
                      {q.ai_generated && (
                        <span className="text-[10px] flex items-center gap-1 text-violet-600 bg-violet-50 px-2 py-0.5 rounded"><Brain className="h-2.5 w-2.5" />AI Generated</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Settings ────────────────────────────────────────────── */}
      {tab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { icon: Brain, title: 'AI Scoring Dimensions', desc: 'Configure what Zia AI evaluates', items: ['Communication clarity (NLP)', 'Technical keyword relevance', 'Answer confidence (tone analysis)', 'Response completeness', 'Body language signals (video)'] },
            { icon: Shield, title: 'Proctoring Controls', desc: 'Anti-cheating & integrity settings', items: ['Tab/window switch detection', 'Face presence detection', 'Multiple faces alert', 'Unusual audio detection', 'Screen recording prevention'] },
            { icon: Settings, title: 'Candidate Experience', desc: 'Interview flow settings', items: ['Webcam & mic check', 'Practice question before start', 'Allow retakes (1 per question)', 'Progress indicator', 'Auto-save on disconnect'] },
            { icon: Zap, title: 'Automation', desc: 'Post-interview actions', items: ['Auto-email shortlisted candidates', 'Auto-reject below score threshold', 'Sync scores to recruitment ATS', 'Calendar invite for next round', 'Slack/Teams notification to HR'] },
          ].map(section => (
            <Card key={section.title}>
              <CardHeader title={section.title} description={section.desc} />
              <ul className="mt-3 space-y-2">
                {section.items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {/* ── Candidate Detail Modal ─────────────────────────────────── */}
      {viewResponse && (
        <Modal open={!!viewResponse} onClose={() => setViewResponse(null)}
          title={`Interview Response — ${viewResponse.candidate}`} size="lg"
          footer={
            <>
              <Button variant="outline" size="sm" className="text-red-600 border-red-300" onClick={() => setViewResponse(null)}>Reject</Button>
              <Button size="sm" leftIcon={<Star className="h-3.5 w-3.5" />} onClick={() => setViewResponse(null)}>Shortlist</Button>
              <Button variant="ghost" size="sm" onClick={() => setViewResponse(null)}>Close</Button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <AIScoreBadge score={viewResponse.ai_score} />
              <div>
                <p className="font-bold text-slate-800 text-lg">{viewResponse.candidate}</p>
                <p className="text-sm text-slate-500">{viewResponse.email} · {viewResponse.submitted_at}</p>
                <p className="text-xs text-slate-400">Duration: {viewResponse.duration}</p>
              </div>
              <Badge variant={STATUS_VARIANT[viewResponse.status]} className="ml-auto">{viewResponse.status.replace('_',' ')}</Badge>
            </div>

            {/* AI Summary */}
            <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl">
              <p className="text-xs font-bold text-violet-700 flex items-center gap-1.5 mb-1.5"><Brain className="h-3.5 w-3.5" />Zia AI Summary</p>
              <p className="text-sm text-violet-800">{viewResponse.ai_summary}</p>
            </div>

            {/* Proctoring */}
            {viewResponse.proctoring_flags > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-1"><AlertTriangle className="h-3.5 w-3.5" />Proctoring Alerts ({viewResponse.proctoring_flags})</p>
                <p className="text-xs text-amber-700">1 tab switch detected at 04:12 — brief duration, likely accidental.</p>
              </div>
            )}

            {/* Score breakdown */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AI Score Breakdown</p>
              <div className="grid grid-cols-2 gap-4">
                <ScoreBar label="Communication" score={viewResponse.communication} color={viewResponse.communication >= 80 ? 'text-emerald-600' : 'text-blue-600'} />
                <ScoreBar label="Technical Depth" score={viewResponse.technical} color={viewResponse.technical >= 80 ? 'text-emerald-600' : 'text-blue-600'} />
                <ScoreBar label="Confidence" score={viewResponse.confidence} color={viewResponse.confidence >= 80 ? 'text-emerald-600' : 'text-blue-600'} />
                <ScoreBar label="Overall AI Score" score={viewResponse.ai_score} color={viewResponse.ai_score >= 80 ? 'text-emerald-600' : 'text-amber-600'} />
              </div>
            </div>

            {/* Video placeholder */}
            <div className="rounded-xl bg-slate-900 flex items-center justify-center h-40 cursor-pointer hover:bg-slate-800 transition-colors">
              <div className="text-center text-white">
                <PlayCircle className="h-10 w-10 mx-auto mb-2 opacity-70" />
                <p className="text-sm font-semibold">Play Interview Recording</p>
                <p className="text-xs opacity-50">5 responses · {viewResponse.duration} total</p>
              </div>
            </div>

            {/* Transcript toggle */}
            <div className="border border-slate-100 rounded-xl p-3">
              <p className="text-xs font-bold text-slate-500 mb-2">AI Transcript (Q1 — Tell me about yourself)</p>
              <p className="text-sm text-slate-700 italic">
                "Sure, I have about 6 years of backend experience, primarily in Node.js and Go. I've worked at two startups where I was responsible for designing the core API infrastructure from scratch. My most recent project involved building a real-time data pipeline handling about 50,000 events per second using Kafka and ClickHouse..."
              </p>
              <p className="text-[10px] text-slate-400 mt-2">Auto-transcribed by Zia AI · 98.2% confidence</p>
            </div>
          </div>
        </Modal>
      )}

      {/* ── New Interview Modal ─────────────────────────────────────── */}
      <Modal open={newInterview} onClose={() => setNewInterview(false)} title="Create AI Interview" size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setNewInterview(false)}>Cancel</Button>
            <Button variant="outline" size="sm">Save Draft</Button>
            <Button size="sm" leftIcon={<Zap className="h-3.5 w-3.5" />}>Launch Interview</Button>
          </>
        }
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <Divider label="Interview Setup" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Interview Title *" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Senior Engineer — Round 1" />
            <Input label="Job Title" value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} placeholder="e.g. Senior Backend Engineer" />
            <Select label="Interview Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: (e.target as any).value }))}
              options={[
                { label: '📹 Async Video (candidates record anytime)', value: 'async_video' },
                { label: '🤖 AI-Driven (Zia conducts live AI interview)', value: 'ai_driven' },
                { label: '📝 Written Assessment', value: 'written' },
              ]} />
            <Input label="Response Deadline" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            <Input label="Time per Question (min)" type="number" value={form.time_per_q} onChange={e => setForm(f => ({ ...f, time_per_q: e.target.value }))} />
            <Select label="Max Retakes per Question" value={form.max_retakes} onChange={e => setForm(f => ({ ...f, max_retakes: (e.target as any).value }))}
              options={[{ label: 'No retakes', value: '0' }, { label: '1 retake', value: '1' }, { label: '2 retakes', value: '2' }]} />
          </div>
          <Divider label="AI & Proctoring" />
          <div className="space-y-3">
            {[
              { key: 'ai_scoring', label: 'Enable Zia AI Scoring', desc: 'Auto-score communication, technical depth, and confidence' },
              { key: 'proctoring', label: 'Enable Proctoring', desc: 'Detect tab switches, multiple faces, unusual audio' },
              { key: 'require_webcam', label: 'Require Webcam', desc: 'Candidates must have webcam enabled throughout' },
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg cursor-pointer hover:bg-slate-50">
                <input type="checkbox" checked={(form as any)[opt.key]} onChange={e => setForm(f => ({ ...f, [opt.key]: e.target.checked }))} className="rounded h-4 w-4" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                  <p className="text-xs text-slate-400">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <Divider label="Questions" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Brain className="h-3.5 w-3.5" />} onClick={() => { setNewInterview(false); setGenQuestions(true) }}>
              AI Generate Questions
            </Button>
            <Button variant="ghost" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>Add Manually</Button>
          </div>
          <p className="text-xs text-slate-400">Add questions from the AI generator or question bank after saving the interview draft.</p>
        </div>
      </Modal>

      {/* ── AI Question Generator ──────────────────────────────────── */}
      <Modal open={genQuestions} onClose={() => setGenQuestions(false)} title="Zia AI — Question Generator" size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setGenQuestions(false)}>Cancel</Button>
            <Button size="sm" disabled={generatedQs.length === 0}>Add All to Bank</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Job Role *" placeholder="e.g. Senior Backend Engineer" />
            <Select label="Question Type" options={[
              { label: 'Technical Questions', value: 'technical' },
              { label: 'Behavioral (STAR format)', value: 'behavioral' },
              { label: 'Situational', value: 'situational' },
              { label: 'Culture Fit', value: 'culture' },
              { label: 'Mixed (recommended)', value: 'mixed' },
            ]} />
            <Input label="Experience Level" placeholder="e.g. 5+ years" />
            <Input label="Number of Questions" type="number" placeholder="5" />
          </div>
          <Textarea label="Additional Context (optional)" rows={2} placeholder="Skills to focus on, company culture, specific technologies..." />
          <Button size="sm" leftIcon={<Brain className="h-3.5 w-3.5" />} loading={aiGenerating} onClick={handleGenerateQuestions} className="w-full">
            {aiGenerating ? 'Generating with Zia AI...' : 'Generate Questions'}
          </Button>
          {generatedQs.length > 0 && (
            <div className="space-y-2 mt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Brain className="h-3.5 w-3.5 text-violet-500" />Generated Questions</p>
              {generatedQs.map((q, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-violet-50 border border-violet-100 rounded-lg">
                  <span className="text-xs font-bold text-violet-600 bg-violet-100 w-5 h-5 rounded flex items-center justify-center flex-shrink-0">{i+1}</span>
                  <p className="text-sm text-slate-800 flex-1">{q}</p>
                  <Button variant="ghost" size="icon"><Plus className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
