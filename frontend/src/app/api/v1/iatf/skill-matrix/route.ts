import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const upsertSchema = z.object({
  employee_id: z.string().uuid(),
  skill_id: z.string().uuid(),
  current_level: z.number().int().min(0).max(4),
  target_level: z.number().int().min(0).max(4).optional(),
  assessed_at: z.string().optional(),
  next_review_date: z.string().optional(),
  training_required: z.boolean().optional(),
  notes: z.string().optional(),
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
    const employeeId = url.searchParams.get('employee_id')

    let query = supabase
      .from('skill_matrix_entries')
      .select('*, skill:skill_id(*), emp:employee_id(id, users(full_name))')
      .eq('company_id', userProfile.company_id)

    if (employeeId) query = query.eq('employee_id', employeeId)

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
    if (!['hr', 'company_admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = upsertSchema.parse(body)

    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', userProfile.company_id)
      .maybeSingle()

    const { data, error } = await supabase
      .from('skill_matrix_entries')
      .upsert(
        {
          company_id: userProfile.company_id,
          assessed_by: emp?.id ?? null,
          ...parsed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'employee_id,skill_id' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
