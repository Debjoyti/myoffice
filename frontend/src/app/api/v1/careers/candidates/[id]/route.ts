import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { profileScore } from '@/lib/services/careers'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const { id } = await params

  const { data: candidate, error } = await supabase
    .from('career_candidates').select('*')
    .eq('id', id).eq('company_id', employee.company_id).single()
  if (error || !candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

  const { data: applications } = await supabase
    .from('career_applications')
    .select('id, stage, status, ai_match_score, ai_interview_score, applied_at, job:career_jobs(id, title, location, work_mode)')
    .eq('candidate_id', id).order('applied_at', { ascending: false })

  return NextResponse.json({ ...candidate, applications: applications ?? [] })
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const { id } = await params
  const body = await req.json() as Record<string, any>

  const allowed = [
    'full_name', 'phone', 'avatar_url', 'location', 'headline', 'summary', 'skills',
    'experience_years', 'current_company', 'current_title', 'current_ctc', 'expected_ctc',
    'notice_period_days', 'experience', 'education', 'resume_url', 'linkedin_url', 'github_url',
    'portfolio_url', 'preferred_roles', 'preferred_locations', 'open_to_remote', 'open_to_work',
    'tags', 'status',
  ]
  const patch: Record<string, any> = {}
  for (const k of allowed) if (k in body) patch[k] = body[k]

  // recompute completeness from the merged record
  const { data: existing } = await supabase
    .from('career_candidates').select('*').eq('id', id).eq('company_id', employee.company_id).single()
  if (!existing) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  patch.profile_score = profileScore({ ...existing, ...patch })

  const { data, error } = await supabase
    .from('career_candidates').update(patch)
    .eq('id', id).eq('company_id', employee.company_id)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
