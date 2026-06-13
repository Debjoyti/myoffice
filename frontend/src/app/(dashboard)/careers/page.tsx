'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  PageHeader, Card, CardHeader, StatCard, Button, Badge, EmptyState, Alert,
  ProgressBar, Spinner,
} from '@/components/ui'
import {
  Rocket, Briefcase, Users, Sparkles, ClipboardCheck, Globe, TrendingUp,
  Award, Clock, RefreshCw, Database, ArrowRight, UsersRound,
} from 'lucide-react'

type Kpis = {
  open_jobs: number; total_applicants: number; active_pipeline: number; in_interview: number
  offers: number; hired: number; candidates: number; open_to_work: number; avg_match: number
  avg_interview: number; interviews_pending: number; time_to_hire_days: number
}
type Funnel = { stage: string; label: string; count: number }[]
type TopJob = { id: string; title: string; applicant_count: number; hired_count: number; openings: number }

const STAGE_COLOR: Record<string, string> = {
  applied: 'bg-slate-400', screening: 'bg-blue-400', interview: 'bg-violet-500',
  assessment: 'bg-amber-500', offer: 'bg-emerald-500', hired: 'bg-emerald-600',
}

export default function CareersCockpit() {
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [funnel, setFunnel] = useState<Funnel>([])
  const [topJobs, setTopJobs] = useState<TopJob[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/v1/careers/stats')
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load')
      const data = await res.json()
      setKpis(data.kpis); setFunnel(data.funnel); setTopJobs(data.topJobs)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const seed = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/v1/careers/seed', { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error || 'Seed failed')
      await load()
    } catch (e: any) { setError(e.message) }
    finally { setSeeding(false) }
  }

  const isEmpty = kpis && kpis.open_jobs === 0 && kpis.total_applicants === 0 && kpis.candidates === 0
  const maxFunnel = Math.max(1, ...funnel.map(f => f.count))

  const quickLinks = [
    { name: 'Job Postings', href: '/careers/jobs', icon: Briefcase, desc: 'Create & publish roles', accent: 'text-blue-600 bg-blue-50' },
    { name: 'ATS Pipeline', href: '/careers/pipeline', icon: ClipboardCheck, desc: 'Move candidates through stages', accent: 'text-violet-600 bg-violet-50' },
    { name: 'Talent Pool', href: '/careers/candidates', icon: UsersRound, desc: 'Reverse-match candidates to jobs', accent: 'text-emerald-600 bg-emerald-50' },
    { name: 'AI Interviews', href: '/careers/interviews', icon: Sparkles, desc: 'Generate & score interviews', accent: 'text-amber-600 bg-amber-50' },
    { name: 'Job Board', href: '/careers/board', icon: Globe, desc: 'Public storefront & apply flow', accent: 'text-sky-600 bg-sky-50' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hiring Cockpit"
        description="End-to-end career portal — from posting jobs to AI-scored interviews to hire."
        actions={
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={load} loading={loading}>
            Refresh
          </Button>
        }
      />

      {error && <Alert variant="danger" title="Could not load">{error}. The schema migration may not be applied yet — once it is, seed demo data below.</Alert>}

      {isEmpty && !loading && (
        <Card className="border-blue-200 bg-blue-50/40">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600"><Database className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Your career portal is empty</p>
                <p className="text-xs text-slate-500 mt-0.5">Seed 6 realistic open roles, 8 candidates, applications & AI interviews to explore the full flow.</p>
              </div>
            </div>
            <Button size="sm" leftIcon={<Sparkles className="h-3.5 w-3.5" />} onClick={seed} loading={seeding}>Seed demo data</Button>
          </div>
        </Card>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Open Jobs" value={kpis?.open_jobs ?? 0} icon={<Briefcase className="h-4 w-4" />} accent="blue" loading={loading} />
        <StatCard label="Applicants" value={kpis?.total_applicants ?? 0} icon={<Users className="h-4 w-4" />} accent="indigo" loading={loading} />
        <StatCard label="In Pipeline" value={kpis?.active_pipeline ?? 0} icon={<ClipboardCheck className="h-4 w-4" />} accent="violet" loading={loading} />
        <StatCard label="Offers" value={kpis?.offers ?? 0} icon={<Award className="h-4 w-4" />} accent="emerald" loading={loading} />
        <StatCard label="Hired" value={kpis?.hired ?? 0} icon={<TrendingUp className="h-4 w-4" />} accent="teal" loading={loading} />
        <StatCard label="Avg Time-to-Hire" value={`${kpis?.time_to_hire_days ?? 0}d`} icon={<Clock className="h-4 w-4" />} accent="amber" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Funnel */}
        <Card className="lg:col-span-2">
          <CardHeader title="Hiring Funnel" description="Active applications by stage" />
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : funnel.every(f => f.count === 0) ? (
            <EmptyState icon={<ClipboardCheck className="h-6 w-6" />} title="No applications yet" description="Publish a job and applications will flow in here." />
          ) : (
            <div className="space-y-3">
              {funnel.map(f => (
                <div key={f.stage} className="flex items-center gap-3">
                  <span className="w-24 text-xs font-medium text-slate-600 flex-shrink-0">{f.label}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden relative">
                    <div className={`h-full rounded-full ${STAGE_COLOR[f.stage] ?? 'bg-slate-400'} transition-all duration-500`} style={{ width: `${(f.count / maxFunnel) * 100}%` }} />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-700">{f.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* AI quality */}
        <Card>
          <CardHeader title="AI Signal" description="Quality across the funnel" />
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-600">Avg resume↔JD match</span>
                <span className="text-sm font-bold text-slate-800">{kpis?.avg_match ?? 0}%</span>
              </div>
              <ProgressBar value={kpis?.avg_match ?? 0} color="blue" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-600">Avg AI interview score</span>
                <span className="text-sm font-bold text-slate-800">{kpis?.avg_interview ?? 0}%</span>
              </div>
              <ProgressBar value={kpis?.avg_interview ?? 0} color="indigo" />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Talent pool</p>
                <p className="text-lg font-bold text-slate-800">{kpis?.candidates ?? 0}</p>
                <p className="text-[10px] text-emerald-600 font-medium">{kpis?.open_to_work ?? 0} open to work</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">Interviews</p>
                <p className="text-lg font-bold text-slate-800">{kpis?.interviews_pending ?? 0}</p>
                <p className="text-[10px] text-amber-600 font-medium">pending / in progress</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top jobs + quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Top Open Roles" description="By applicant volume"
            action={<Link href="/careers/jobs"><Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>All jobs</Button></Link>} />
          {topJobs.length === 0 ? (
            <EmptyState icon={<Briefcase className="h-6 w-6" />} title="No open jobs" />
          ) : (
            <div className="space-y-2">
              {topJobs.map(j => (
                <Link key={j.id} href={`/careers/jobs?job=${j.id}`} className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{j.title}</p>
                    <p className="text-xs text-slate-500">{j.openings} opening{j.openings > 1 ? 's' : ''} · {j.hired_count} hired</p>
                  </div>
                  <Badge variant="info">{j.applicant_count} applicants</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Jump to" />
          <div className="space-y-2">
            {quickLinks.map(l => (
              <Link key={l.href} href={l.href} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                <span className={`p-2 rounded-lg ${l.accent}`}><l.icon className="h-4 w-4" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{l.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{l.desc}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
