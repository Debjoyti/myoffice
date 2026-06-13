import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { generateInterview } from '@/lib/services/ai/careers'
import { z } from 'zod'

const ALLOWED = new Set(['admin', 'hr', 'manager'])

const CreateSchema = z.object({
  application_id: z.string().uuid().optional(),
  job_id: z.string().uuid().optional(),
  candidate_id: z.string().uuid().optional(),
  regenerate: z.boolean().optional(),
})

function token() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const url = new URL(req.url)
  const status = url.searchParams.get('status') ?? 'all'

  let query = supabase
    .from('career_interviews')
    .select('*, candidate:career_candidates(id, full_name, avatar_url, headline), job:career_jobs(id, title)')
    .eq('company_id', employee.company_id)
  if (status !== 'all') query = query.eq('status', status)

  const { data, error } = await query.order('created_at', { ascending: false }).limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const interviews = data ?? []
  const summary = {
    total:     interviews.length,
    pending:   interviews.filter(i => ['pending', 'invited'].includes(i.status)).length,
    completed: interviews.filter(i => i.status === 'completed').length,
    avg_score: (() => {
      const done = interviews.filter(i => i.status === 'completed' && i.overall_score != null)
      return done.length ? Math.round(done.reduce((s, i) => s + i.overall_score, 0) / done.length) : 0
    })(),
  }
  return NextResponse.json({ interviews, summary })
}

/** Create (or regenerate) an AI interview for an application or ad-hoc job+candidate. */
export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const parsed = CreateSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  const d = parsed.data

  // Resolve job + candidate (via application if given)
  let jobId = d.job_id ?? null
  let candidateId = d.candidate_id ?? null
  let applicationId = d.application_id ?? null

  if (applicationId) {
    const { data: app } = await supabase.from('career_applications')
      .select('id, job_id, candidate_id').eq('id', applicationId).eq('company_id', employee.company_id).single()
    if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    jobId = app.job_id; candidateId = app.candidate_id
  }
  if (!jobId) return NextResponse.json({ error: 'job_id or application_id required' }, { status: 422 })

  const { data: job } = await supabase.from('career_jobs').select('*')
    .eq('id', jobId).eq('company_id', employee.company_id).single()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  // Reuse an existing pending interview for this application unless regenerating
  if (applicationId && !d.regenerate) {
    const { data: existing } = await supabase.from('career_interviews').select('*')
      .eq('application_id', applicationId).in('status', ['pending', 'invited', 'in_progress'])
      .order('created_at', { ascending: false }).maybeSingle()
    if (existing) return NextResponse.json(existing)
  }

  const questions = await generateInterview(job)

  const { data: interview, error } = await supabase.from('career_interviews').insert({
    company_id: employee.company_id,
    application_id: applicationId,
    job_id: jobId,
    candidate_id: candidateId,
    access_token: token(),
    questions,
    status: 'invited',
    invited_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (applicationId) {
    await supabase.from('career_application_events').insert({
      company_id: employee.company_id, application_id: applicationId,
      event_type: 'interview_sent', message: `AI interview generated (${questions.length} questions)`,
      actor_id: employee.id, actor_name: employee.full_name,
    })
  }
  return NextResponse.json(interview, { status: 201 })
}
