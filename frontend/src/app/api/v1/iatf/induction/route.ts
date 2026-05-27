import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const programSchema = z.object({
  type: z.literal('program'),
  title: z.string().min(1),
  description: z.string().optional(),
  topics: z.array(z.object({ title: z.string(), duration_hours: z.number() })).optional(),
  total_duration_hours: z.number().optional(),
  effective_from: z.string().optional(),
})

const recordSchema = z.object({
  type: z.literal('record'),
  employee_id: z.string().uuid(),
  program_id: z.string().uuid(),
  scheduled_date: z.string().optional(),
  conducted_by: z.string().uuid().optional(),
  remarks: z.string().optional(),
})

const bodySchema = z.discriminatedUnion('type', [programSchema, recordSchema])

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
    const view = url.searchParams.get('view') ?? 'programs'

    if (view === 'records') {
      const employeeId = url.searchParams.get('employee_id')
      let query = supabase
        .from('induction_records')
        .select('*, emp:employee_id(id, users(full_name)), program:program_id(title)')
        .eq('company_id', userProfile.company_id)
        .order('created_at', { ascending: false })

      if (employeeId) query = query.eq('employee_id', employeeId)

      const { data, error } = await query
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ data })
    }

    const { data, error } = await supabase
      .from('induction_programs')
      .select('*')
      .eq('company_id', userProfile.company_id)
      .order('created_at', { ascending: false })

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
    if (!['hr', 'company_admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', userProfile.company_id)
      .maybeSingle()

    const body = await req.json()
    const parsed = bodySchema.parse(body)

    if (parsed.type === 'program') {
      const { type: _t, ...fields } = parsed
      const { data, error } = await supabase
        .from('induction_programs')
        .insert({ company_id: userProfile.company_id, created_by: emp?.id ?? null, ...fields })
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ data }, { status: 201 })
    } else {
      const { type: _t, ...fields } = parsed
      const { data, error } = await supabase
        .from('induction_records')
        .insert({ company_id: userProfile.company_id, ...fields })
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ data }, { status: 201 })
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
