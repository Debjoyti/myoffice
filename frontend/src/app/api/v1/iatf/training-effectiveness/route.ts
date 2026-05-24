import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const reviewSchema = z.object({
  session_id: z.string().uuid(),
  employee_id: z.string().uuid(),
  review_type: z.enum(['management', 'general']),
  review_period_days: z.number().int().optional(),
  review_date: z.string().optional(),
  objectives_achieved: z.boolean().optional(),
  knowledge_applied: z.string().optional(),
  behavior_change_observed: z.string().optional(),
  business_impact: z.string().optional(),
  effectiveness_score: z.number().int().min(1).max(5).optional(),
  overall_effective: z.boolean().optional(),
  comments: z.string().optional(),
  status: z.enum(['pending', 'completed']).optional(),
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
    const sessionId = url.searchParams.get('session_id')
    const employeeId = url.searchParams.get('employee_id')

    let query = supabase
      .from('training_effectiveness_reviews')
      .select('*, reviewer:reviewer_id(id, users(full_name))')
      .eq('company_id', userProfile.company_id)

    if (sessionId) query = query.eq('session_id', sessionId)
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
    if (!['hr', 'company_admin', 'super_admin', 'manager'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = reviewSchema.parse(body)

    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', userProfile.company_id)
      .maybeSingle()

    const { data, error } = await supabase
      .from('training_effectiveness_reviews')
      .upsert(
        {
          company_id: userProfile.company_id,
          reviewer_id: emp?.id ?? null,
          ...parsed,
        },
        { onConflict: 'session_id,employee_id,review_type' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

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
    const { id, ...updates } = body

    const { data, error } = await supabase
      .from('training_effectiveness_reviews')
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
