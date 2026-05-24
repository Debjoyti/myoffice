import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  notification_type: z.enum(['ESI', 'PF', 'PT', 'TDS', 'LWF']),
  period_month: z.number().int().min(1).max(12).optional(),
  period_year: z.number().int().optional(),
  due_date: z.string(),
  amount_due: z.number().optional(),
  remarks: z.string().optional(),
})

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'filed', 'overdue', 'waived']).optional(),
  filed_date: z.string().optional(),
  reference_number: z.string().optional(),
  amount_paid: z.number().optional(),
  remarks: z.string().optional(),
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
    const year = url.searchParams.get('year')
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')

    let query = supabase
      .from('govt_notifications')
      .select('*, filed_by_emp:filed_by(id, users(full_name))')
      .eq('company_id', userProfile.company_id)
      .order('due_date', { ascending: true })

    if (year) query = query.eq('period_year', parseInt(year))
    if (status) query = query.eq('status', status)
    if (type) query = query.eq('notification_type', type)

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
    const parsed = createSchema.parse(body)

    const { data, error } = await supabase
      .from('govt_notifications')
      .insert({ company_id: userProfile.company_id, ...parsed })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await supabase.from('audit_logs').insert({
      company_id: userProfile.company_id,
      user_id: user.id,
      action: 'CREATE',
      module: 'IATF_COMPLIANCE',
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
    if (!['hr', 'company_admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = patchSchema.parse(body)
    const { id, ...updates } = parsed

    // Get employee ID
    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', userProfile.company_id)
      .maybeSingle()

    const { data, error } = await supabase
      .from('govt_notifications')
      .update({
        ...updates,
        filed_by: updates.status === 'filed' ? (emp?.id ?? null) : undefined,
        updated_at: new Date().toISOString(),
      })
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
