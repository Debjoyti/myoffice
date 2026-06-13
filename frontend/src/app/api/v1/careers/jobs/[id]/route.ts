import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED = new Set(['admin', 'hr', 'manager'])
type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const { id } = await params

  const { data: job, error } = await supabase
    .from('career_jobs').select('*')
    .eq('id', id).eq('company_id', employee.company_id).single()
  if (error || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  // bump view count (best-effort)
  void supabase.from('career_jobs').update({ view_count: (job.view_count || 0) + 1 }).eq('id', id)

  const { data: applications } = await supabase
    .from('career_applications')
    .select('id, stage, status, ai_match_score, ai_interview_score, applied_at, candidate:career_candidates(id, full_name, headline, avatar_url, experience_years, skills)')
    .eq('job_id', id).order('ai_match_score', { ascending: false, nullsFirst: false })

  return NextResponse.json({ ...job, applications: applications ?? [] })
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const { id } = await params
  const body = await req.json() as Record<string, any>

  // whitelist editable fields
  const allowed = [
    'title', 'code', 'department_id', 'position_id', 'department_name', 'summary', 'description',
    'responsibilities', 'requirements', 'perks', 'skills', 'employment_type', 'work_mode',
    'experience_level', 'min_experience', 'max_experience', 'location', 'currency', 'salary_min',
    'salary_max', 'salary_period', 'show_salary', 'openings', 'ai_interview_enabled',
    'ai_competencies', 'ai_question_count', 'is_featured', 'is_urgent', 'status', 'closes_at',
  ]
  const patch: Record<string, any> = {}
  for (const k of allowed) if (k in body) patch[k] = body[k]
  if (patch.status === 'open' && !body.published_at) patch.published_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('career_jobs').update(patch)
    .eq('id', id).eq('company_id', employee.company_id)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const { id } = await params

  const { error } = await supabase
    .from('career_jobs').delete()
    .eq('id', id).eq('company_id', employee.company_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
