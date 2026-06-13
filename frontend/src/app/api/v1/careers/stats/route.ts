import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { funnelCounts, STAGE_LABEL, ACTIVE_STAGES } from '@/lib/services/careers'

/** Recruiter cockpit aggregates: KPIs, hiring funnel, time-to-hire, top jobs. */
export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const company_id = employee.company_id

  const [jobsRes, appsRes, candsRes, ivRes] = await Promise.all([
    supabase.from('career_jobs').select('id, title, status, applicant_count, hired_count, openings').eq('company_id', company_id),
    supabase.from('career_applications').select('id, stage, status, ai_match_score, ai_interview_score, applied_at, stage_changed_at, job_id').eq('company_id', company_id),
    supabase.from('career_candidates').select('id, status, open_to_work, profile_score').eq('company_id', company_id),
    supabase.from('career_interviews').select('id, status, overall_score, recommendation').eq('company_id', company_id),
  ])

  const jobs = jobsRes.data ?? []
  const apps = appsRes.data ?? []
  const cands = candsRes.data ?? []
  const ivs = ivRes.data ?? []

  const fc = funnelCounts(apps)
  const funnel = ACTIVE_STAGES.map(s => ({ stage: s, label: STAGE_LABEL[s], count: fc[s] }))

  const hired = apps.filter(a => a.stage === 'hired')
  // crude time-to-hire (days between applied_at and stage_changed_at for hired)
  const tth = hired.length
    ? Math.round(hired.reduce((s, a) => s + Math.max(0, (new Date(a.stage_changed_at).getTime() - new Date(a.applied_at).getTime()) / 864e5), 0) / hired.length)
    : 0

  const completedIvs = ivs.filter(i => i.status === 'completed' && i.overall_score != null)

  const topJobs = [...jobs]
    .filter(j => j.status === 'open')
    .sort((a, b) => (b.applicant_count || 0) - (a.applicant_count || 0))
    .slice(0, 5)

  const kpis = {
    open_jobs: jobs.filter(j => j.status === 'open').length,
    total_applicants: apps.length,
    active_pipeline: apps.filter(a => a.status === 'active' && !['hired', 'rejected', 'withdrawn'].includes(a.stage)).length,
    in_interview: fc.interview + fc.assessment,
    offers: fc.offer,
    hired: fc.hired,
    candidates: cands.length,
    open_to_work: cands.filter(c => c.open_to_work).length,
    avg_match: apps.length ? Math.round(apps.reduce((s, a) => s + (a.ai_match_score || 0), 0) / apps.length) : 0,
    avg_interview: completedIvs.length ? Math.round(completedIvs.reduce((s, i) => s + i.overall_score, 0) / completedIvs.length) : 0,
    interviews_pending: ivs.filter(i => ['pending', 'invited', 'in_progress'].includes(i.status)).length,
    time_to_hire_days: tth,
  }

  return NextResponse.json({ kpis, funnel, topJobs })
}
