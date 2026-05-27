import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const feedbackSchema = z.object({
  session_id: z.string().uuid(),
  content_rating: z.number().int().min(1).max(5).optional(),
  trainer_rating: z.number().int().min(1).max(5).optional(),
  venue_rating: z.number().int().min(1).max(5).optional(),
  material_rating: z.number().int().min(1).max(5).optional(),
  overall_rating: z.number().int().min(1).max(5).optional(),
  what_did_you_learn: z.string().optional(),
  how_will_you_apply: z.string().optional(),
  suggestions: z.string().optional(),
  most_useful_aspect: z.string().optional(),
})

export async function GET(req: Request) {
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

    const url = new URL(req.url)
    const sessionId = url.searchParams.get('session_id')
    if (!sessionId) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

    const role = userProfile.role as string
    if (!['hr', 'company_admin', 'super_admin', 'manager'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('training_feedback')
      .select('*')
      .eq('session_id', sessionId)
      .eq('company_id', userProfile.company_id)

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
      .select('company_id')
      .eq('id', user.id)
      .single()
    if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 403 })

    const body = await req.json()
    const parsed = feedbackSchema.parse(body)

    // Get employee record
    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', userProfile.company_id)
      .single()
    if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 403 })

    const { data, error } = await supabase
      .from('training_feedback')
      .upsert(
        {
          company_id: userProfile.company_id,
          employee_id: emp.id,
          submitted_at: new Date().toISOString(),
          ...parsed,
        },
        { onConflict: 'session_id,employee_id' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ data }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
