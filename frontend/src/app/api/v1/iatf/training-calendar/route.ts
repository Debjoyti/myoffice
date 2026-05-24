import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  year: z.number().int(),
  title: z.string().optional(),
  notes: z.string().optional(),
  budget_allocated: z.number().optional(),
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

    let query = supabase
      .from('annual_training_calendars')
      .select('*, training_calendar_items(*)')
      .eq('company_id', userProfile.company_id)
      .order('year', { ascending: false })

    if (year) query = query.eq('year', parseInt(year))

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
      .from('annual_training_calendars')
      .insert({ company_id: userProfile.company_id, ...parsed })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await supabase.from('audit_logs').insert({
      company_id: userProfile.company_id,
      user_id: user.id,
      action: 'CREATE',
      module: 'IATF_TRAINING',
      entity_id: data.id,
      after_state: parsed,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
