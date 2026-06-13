import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { slugify, DEFAULT_COMPETENCIES } from '@/lib/services/careers'
import { z } from 'zod'

const ALLOWED = new Set(['admin', 'hr', 'manager'])

const JobSchema = z.object({
  title:            z.string().min(2),
  code:             z.string().optional(),
  department_id:    z.string().uuid().nullable().optional(),
  position_id:      z.string().uuid().nullable().optional(),
  department_name:  z.string().optional(),
  summary:          z.string().optional(),
  description:      z.string().optional(),
  responsibilities: z.array(z.string()).default([]),
  requirements:     z.array(z.string()).default([]),
  perks:            z.array(z.string()).default([]),
  skills:           z.array(z.string()).default([]),
  employment_type:  z.enum(['full_time', 'part_time', 'contract', 'internship', 'temporary']).default('full_time'),
  work_mode:        z.enum(['onsite', 'hybrid', 'remote']).default('onsite'),
  experience_level: z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'director']).default('mid'),
  min_experience:   z.number().min(0).default(0),
  max_experience:   z.number().min(0).nullable().optional(),
  location:         z.string().optional(),
  currency:         z.string().default('INR'),
  salary_min:       z.number().min(0).nullable().optional(),
  salary_max:       z.number().min(0).nullable().optional(),
  salary_period:    z.enum(['year', 'month', 'hour']).default('year'),
  show_salary:      z.boolean().default(true),
  openings:         z.number().int().min(1).default(1),
  ai_interview_enabled: z.boolean().default(true),
  ai_competencies:  z.array(z.string()).default([...DEFAULT_COMPETENCIES]),
  ai_question_count: z.number().int().min(3).max(8).default(5),
  is_featured:      z.boolean().default(false),
  is_urgent:        z.boolean().default(false),
  status:           z.enum(['draft', 'open', 'paused', 'closed', 'filled']).default('draft'),
  closes_at:        z.string().nullable().optional(),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const url = new URL(req.url)
  const status = url.searchParams.get('status') ?? 'all'
  const search = url.searchParams.get('q')
  const dept   = url.searchParams.get('department')

  let query = supabase.from('career_jobs').select('*').eq('company_id', employee.company_id)
  if (status !== 'all') query = query.eq('status', status)
  if (dept)             query = query.eq('department_id', dept)
  if (search)           query = query.or(`title.ilike.%${search}%,code.ilike.%${search}%,location.ilike.%${search}%`)

  const { data, error } = await query.order('created_at', { ascending: false }).limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const jobs = data ?? []
  const summary = {
    total:     jobs.length,
    open:      jobs.filter(j => j.status === 'open').length,
    draft:     jobs.filter(j => j.status === 'draft').length,
    applicants: jobs.reduce((s, j) => s + (j.applicant_count || 0), 0),
    openings:  jobs.filter(j => j.status === 'open').reduce((s, j) => s + (j.openings || 0), 0),
  }
  return NextResponse.json({ jobs, summary })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const parsed = JobSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  const d = parsed.data

  const slug = slugify(d.title) + '-' + Math.random().toString(36).slice(2, 6)
  const { data, error } = await supabase
    .from('career_jobs')
    .insert({
      ...d,
      slug,
      company_id: employee.company_id,
      posted_by: employee.id,
      hiring_manager_id: employee.id,
      published_at: d.status === 'open' ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A job with this slug already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data, { status: 201 })
}
