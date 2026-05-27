import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  calendar_item_id: z.string().uuid().optional(),
  session_date: z.string(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  venue: z.string().optional(),
  trainer_name: z.string(),
  trainer_type: z.enum(['internal', 'external']).default('internal'),
  training_title: z.string(),
  training_type: z.string().optional(),
  objectives: z.string().optional(),
  topics_covered: z.array(z.string()).optional(),
  pre_test_conducted: z.boolean().optional(),
  post_test_conducted: z.boolean().optional(),
  max_participants: z.number().int().optional(),
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
    const month = url.searchParams.get('month')
    const status = url.searchParams.get('status')
    const calendarItemId = url.searchParams.get('calendar_item_id')

    let query = supabase
      .from('training_sessions')
      .select('*, conducted_by_emp:conducted_by(id, users(full_name))')
      .eq('company_id', userProfile.company_id)
      .order('session_date', { ascending: false })

    if (status) query = query.eq('status', status)
    if (calendarItemId) query = query.eq('calendar_item_id', calendarItemId)
    if (month) {
      const year = new Date().getFullYear()
      const start = `${year}-${month.padStart(2, '0')}-01`
      const end = new Date(parseInt(year.toString()), parseInt(month), 0).toISOString().split('T')[0]
      query = query.gte('session_date', start).lte('session_date', end)
    }

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
      .from('training_sessions')
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
