import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  plan_type: z.enum(['motivation', 'training_gap', 'compliance', 'kaizen', 'audit_finding']),
  title: z.string().min(1),
  department_id: z.string().uuid().optional(),
  employee_id: z.string().uuid().optional(),
  problem_statement: z.string().optional(),
  root_cause: z.string().optional(),
  action_description: z.string().min(1),
  responsible_person_id: z.string().uuid().optional(),
  target_date: z.string(),
  effectiveness_review_due: z.string().optional(),
})

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['open', 'in_progress', 'completed', 'overdue', 'cancelled']).optional(),
  actual_completion_date: z.string().optional(),
  effectiveness_score: z.number().int().min(1).max(5).optional(),
  effectiveness_notes: z.string().optional(),
  evidence: z.string().optional(),
  action_description: z.string().optional(),
  responsible_person_id: z.string().uuid().optional(),
  target_date: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userProfile } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 403 })

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')
    const departmentId = url.searchParams.get('department_id')

    let query = supabase
      .from('action_improvement_plans')
      .select('*, responsible:responsible_person_id(id, users(full_name)), dept:department_id(name), emp:employee_id(id, users(full_name))')
      .eq('company_id', userProfile.company_id)
      .order('target_date', { ascending: true })

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('plan_type', type)
    if (departmentId) query = query.eq('department_id', departmentId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userProfile } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single()
    if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 403 })

    const role = userProfile.role as string
    if (!['hr', 'company_admin', 'super_admin', 'manager'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', userProfile.company_id)
      .maybeSingle()

    const body = await req.json()
    const parsed = createSchema.parse(body)

    const { data, error } = await supabase
      .from('action_improvement_plans')
      .insert({
        company_id: userProfile.company_id,
        identified_by: emp?.id ?? null,
        ...parsed,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await supabase.from('audit_logs').insert({
      company_id: userProfile.company_id,
      user_id: user.id,
      action: 'CREATE',
      module: 'IATF_AIP',
      entity_id: data.id,
      after_state: parsed,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userProfile } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single()
    if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 403 })

    const role = userProfile.role as string
    if (!['hr', 'company_admin', 'super_admin', 'manager'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = patchSchema.parse(body)
    const { id, ...updates } = parsed

    const { data, error } = await supabase
      .from('action_improvement_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('company_id', userProfile.company_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
