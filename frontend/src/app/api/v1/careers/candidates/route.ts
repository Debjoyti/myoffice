import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { profileScore } from '@/lib/services/careers'
import { z } from 'zod'

const ExpSchema = z.object({ company: z.string().optional(), title: z.string().optional(), start: z.string().optional(), end: z.string().optional(), summary: z.string().optional() })
const EduSchema = z.object({ school: z.string().optional(), degree: z.string().optional(), year: z.string().optional() })

const CandidateSchema = z.object({
  full_name:        z.string().min(2),
  email:            z.string().email(),
  phone:            z.string().optional(),
  avatar_url:       z.string().optional(),
  location:         z.string().optional(),
  headline:         z.string().optional(),
  summary:          z.string().optional(),
  skills:           z.array(z.string()).default([]),
  experience_years: z.number().min(0).default(0),
  current_company:  z.string().optional(),
  current_title:    z.string().optional(),
  current_ctc:      z.number().min(0).nullable().optional(),
  expected_ctc:     z.number().min(0).nullable().optional(),
  notice_period_days: z.number().int().min(0).nullable().optional(),
  experience:       z.array(ExpSchema).default([]),
  education:        z.array(EduSchema).default([]),
  resume_url:       z.string().optional(),
  linkedin_url:     z.string().optional(),
  github_url:       z.string().optional(),
  portfolio_url:    z.string().optional(),
  preferred_roles:  z.array(z.string()).default([]),
  preferred_locations: z.array(z.string()).default([]),
  open_to_remote:   z.boolean().default(true),
  open_to_work:     z.boolean().default(true),
  source:           z.string().default('portal'),
  tags:             z.array(z.string()).default([]),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const url = new URL(req.url)
  const status = url.searchParams.get('status') ?? 'active'
  const search = url.searchParams.get('q')
  const openToWork = url.searchParams.get('open_to_work')

  let query = supabase.from('career_candidates').select('*').eq('company_id', employee.company_id)
  if (status !== 'all') query = query.eq('status', status)
  if (openToWork === 'true') query = query.eq('open_to_work', true)
  if (search) query = query.or(`full_name.ilike.%${search}%,headline.ilike.%${search}%,current_company.ilike.%${search}%,email.ilike.%${search}%`)

  const { data, error } = await query.order('profile_score', { ascending: false }).limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const candidates = data ?? []
  const summary = {
    total:        candidates.length,
    open_to_work: candidates.filter(c => c.open_to_work).length,
    placed:       candidates.filter(c => c.status === 'placed').length,
    avg_score:    candidates.length ? Math.round(candidates.reduce((s, c) => s + (c.profile_score || 0), 0) / candidates.length) : 0,
  }
  return NextResponse.json({ candidates, summary })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const parsed = CandidateSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  const d = parsed.data

  const { data, error } = await supabase
    .from('career_candidates')
    .insert({ ...d, company_id: employee.company_id, profile_score: profileScore(d) })
    .select().single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A candidate with this email already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data, { status: 201 })
}
