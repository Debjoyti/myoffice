import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { computeMatch } from '@/lib/services/careers'

/**
 * Reverse-matching (Cutshort / Instahyre style):
 *   ?candidate_id=…  → rank OPEN jobs for this candidate
 *   ?job_id=…        → rank candidates in the talent pool for this job
 * Uses the deterministic matcher so it's instant and free; the per-application
 * AI screen runs on apply.
 */
export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const url = new URL(req.url)
  const candidateId = url.searchParams.get('candidate_id')
  const jobId = url.searchParams.get('job_id')
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 12), 50)

  if (candidateId) {
    const { data: cand } = await supabase.from('career_candidates').select('*')
      .eq('id', candidateId).eq('company_id', employee.company_id).single()
    if (!cand) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    const { data: jobs } = await supabase.from('career_jobs').select('*')
      .eq('company_id', employee.company_id).eq('status', 'open')

    const matches = (jobs ?? []).map(job => {
      const m = computeMatch({
        jobSkills: job.skills, candidateSkills: cand.skills,
        jobMinExp: job.min_experience, jobMaxExp: job.max_experience, candidateExp: cand.experience_years,
        jobWorkMode: job.work_mode, candidateOpenToRemote: cand.open_to_remote,
        jobLocation: job.location, candidateLocation: cand.location,
      })
      return { job, ...m }
    }).sort((a, b) => b.score - a.score).slice(0, limit)
    return NextResponse.json({ for: 'candidate', candidate: cand, matches })
  }

  if (jobId) {
    const { data: job } = await supabase.from('career_jobs').select('*')
      .eq('id', jobId).eq('company_id', employee.company_id).single()
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    const { data: cands } = await supabase.from('career_candidates').select('*')
      .eq('company_id', employee.company_id).eq('status', 'active')

    const matches = (cands ?? []).map(cand => {
      const m = computeMatch({
        jobSkills: job.skills, candidateSkills: cand.skills,
        jobMinExp: job.min_experience, jobMaxExp: job.max_experience, candidateExp: cand.experience_years,
        jobWorkMode: job.work_mode, candidateOpenToRemote: cand.open_to_remote,
        jobLocation: job.location, candidateLocation: cand.location,
      })
      return { candidate: cand, ...m }
    }).sort((a, b) => b.score - a.score).slice(0, limit)
    return NextResponse.json({ for: 'job', job, matches })
  }

  return NextResponse.json({ error: 'Provide candidate_id or job_id' }, { status: 422 })
}
