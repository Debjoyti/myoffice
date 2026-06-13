import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { screenCandidate } from '@/lib/services/ai/careers'
import { profileScore } from '@/lib/services/careers'
import { z } from 'zod'

/**
 * The application is the heart of the funnel. POST handles BOTH:
 *  - a recruiter attaching an existing candidate (pass candidate_id), and
 *  - a fresh portal application (pass candidate {} — we upsert by email).
 * On create we auto-screen (AI match score) and, if the job has AI interview
 * enabled, mint a one-way interview link so the pipeline is ready to go.
 */

const InlineCandidate = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).default([]),
  experience_years: z.number().min(0).default(0),
  current_company: z.string().optional(),
  expected_ctc: z.number().min(0).nullable().optional(),
  resume_url: z.string().optional(),
  linkedin_url: z.string().optional(),
  open_to_remote: z.boolean().optional(),
})

const ApplySchema = z.object({
  job_id: z.string().uuid(),
  candidate_id: z.string().uuid().optional(),
  candidate: InlineCandidate.optional(),
  cover_note: z.string().optional(),
  answers: z.array(z.any()).default([]),
  expected_ctc: z.number().min(0).nullable().optional(),
  available_from: z.string().nullable().optional(),
  source: z.string().default('portal'),
})

function token() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const url = new URL(req.url)
  const jobId = url.searchParams.get('job_id')
  const stage = url.searchParams.get('stage')

  let query = supabase
    .from('career_applications')
    .select('*, candidate:career_candidates(id, full_name, email, headline, avatar_url, experience_years, skills, current_company, expected_ctc, profile_score), job:career_jobs(id, title, location, work_mode)')
    .eq('company_id', employee.company_id)
  if (jobId) query = query.eq('job_id', jobId)
  if (stage && stage !== 'all') query = query.eq('stage', stage)

  const { data, error } = await query.order('applied_at', { ascending: false }).limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ applications: data ?? [] })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const parsed = ApplySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  const d = parsed.data

  // 1. Load the job (must belong to tenant)
  const { data: job, error: jobErr } = await supabase
    .from('career_jobs').select('*')
    .eq('id', d.job_id).eq('company_id', employee.company_id).single()
  if (jobErr || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  // 2. Resolve / upsert the candidate
  let candidateId = d.candidate_id ?? null
  let candidateRow: any = null
  if (candidateId) {
    const { data: c } = await supabase.from('career_candidates').select('*')
      .eq('id', candidateId).eq('company_id', employee.company_id).single()
    if (!c) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    candidateRow = c
  } else if (d.candidate) {
    // upsert by (company_id, email)
    const { data: existing } = await supabase.from('career_candidates').select('*')
      .eq('company_id', employee.company_id).eq('email', d.candidate.email).maybeSingle()
    if (existing) {
      candidateRow = existing
      candidateId = existing.id
    } else {
      const cand = { ...d.candidate, source: d.source }
      const { data: created, error: cErr } = await supabase.from('career_candidates')
        .insert({ ...cand, company_id: employee.company_id, profile_score: profileScore(cand) })
        .select().single()
      if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 })
      candidateRow = created
      candidateId = created.id
    }
  } else {
    return NextResponse.json({ error: 'Provide candidate_id or candidate details' }, { status: 422 })
  }

  // 3. Guard against duplicate application
  const { data: dupe } = await supabase.from('career_applications').select('id')
    .eq('job_id', d.job_id).eq('candidate_id', candidateId).maybeSingle()
  if (dupe) return NextResponse.json({ error: 'Already applied to this job', application_id: dupe.id }, { status: 409 })

  // 4. AI screen (deterministic floor + optional LLM)
  const match = await screenCandidate(job, candidateRow)

  // 5. Reference no
  const { data: refData } = await supabase.rpc('career_next_reference', { p_company: employee.company_id })
  const reference_no = (refData as string) || `APP-${Date.now()}`

  // 6. Create application
  const { data: app, error: appErr } = await supabase.from('career_applications')
    .insert({
      company_id: employee.company_id,
      job_id: d.job_id,
      candidate_id: candidateId,
      reference_no,
      stage: 'applied',
      source: d.source,
      cover_note: d.cover_note ?? null,
      answers: d.answers,
      expected_ctc: d.expected_ctc ?? candidateRow.expected_ctc ?? null,
      available_from: d.available_from ?? null,
      ai_match_score: match.score,
      ai_match_reasons: match.reasons,
    })
    .select().single()
  if (appErr) return NextResponse.json({ error: appErr.message }, { status: 400 })

  // 7. Timeline event
  await supabase.from('career_application_events').insert({
    company_id: employee.company_id,
    application_id: app.id,
    event_type: 'applied',
    to_stage: 'applied',
    message: `Applied to ${job.title} · AI match ${match.score}%`,
    actor_id: employee.id,
    actor_name: candidateRow.full_name,
  })

  // 8. Mint an AI interview link if enabled on the job
  let interview = null
  if (job.ai_interview_enabled) {
    const { data: iv } = await supabase.from('career_interviews').insert({
      company_id: employee.company_id,
      application_id: app.id,
      job_id: job.id,
      candidate_id: candidateId,
      access_token: token(),
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
    }).select('id, access_token').single()
    interview = iv
  }

  return NextResponse.json({ ...app, match, interview }, { status: 201 })
}
