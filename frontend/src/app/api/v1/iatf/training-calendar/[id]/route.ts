import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const itemSchema = z.object({
  training_title: z.string(),
  training_type: z.enum(['technical', 'behavioural', 'safety', 'compliance', 'ojt', 'induction']),
  target_audience: z.string().optional(),
  target_departments: z.array(z.string()).optional(),
  scheduled_month: z.number().int().min(1).max(12),
  scheduled_date: z.string().optional(),
  duration_hours: z.number(),
  trainer_type: z.enum(['internal', 'external']),
  trainer_name: z.string().optional(),
  venue: z.string().optional(),
  max_participants: z.number().int().optional(),
  estimated_cost: z.number().optional(),
})

const patchSchema = z.object({
  status: z.enum(['draft', 'approved', 'active', 'closed']).optional(),
  notes: z.string().optional(),
  budget_allocated: z.number().optional(),
  add_item: itemSchema.optional(),
  update_item: z.object({ id: z.string().uuid(), status: z.enum(['planned', 'scheduled', 'completed', 'cancelled']).optional(), actual_date: z.string().optional(), completion_notes: z.string().optional() }).optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userProfile } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 403 })

    const { data, error } = await supabase
      .from('annual_training_calendars')
      .select('*, training_calendar_items(*)')
      .eq('id', id)
      .eq('company_id', userProfile.company_id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })

    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const { add_item, update_item, ...calendarUpdates } = parsed

    if (Object.keys(calendarUpdates).length > 0) {
      await supabase
        .from('annual_training_calendars')
        .update({ ...calendarUpdates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('company_id', userProfile.company_id)
    }

    if (add_item) {
      await supabase
        .from('training_calendar_items')
        .insert({ company_id: userProfile.company_id, calendar_id: id, ...add_item })
    }

    if (update_item) {
      const { id: itemId, ...itemUpdates } = update_item
      await supabase
        .from('training_calendar_items')
        .update({ ...itemUpdates, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('company_id', userProfile.company_id)
    }

    const { data, error } = await supabase
      .from('annual_training_calendars')
      .select('*, training_calendar_items(*)')
      .eq('id', id)
      .eq('company_id', userProfile.company_id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
