import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled']).optional(),
  actual_duration_hours: z.number().optional(),
  cancellation_reason: z.string().optional(),
  topics_covered: z.array(z.string()).optional(),
  pre_test_conducted: z.boolean().optional(),
  post_test_conducted: z.boolean().optional(),
  venue: z.string().optional(),
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

    const { data: session, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', id)
      .eq('company_id', userProfile.company_id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })

    const [attendanceResult, feedbackResult] = await Promise.all([
      supabase
        .from('training_attendance')
        .select('*, emp:employee_id(id, users(full_name, email))')
        .eq('session_id', id)
        .eq('company_id', userProfile.company_id),
      supabase
        .from('training_feedback')
        .select('content_rating, trainer_rating, venue_rating, material_rating, overall_rating')
        .eq('session_id', id)
        .eq('company_id', userProfile.company_id),
    ])

    const feedback = feedbackResult.data ?? []
    const feedbackSummary = feedback.length > 0
      ? {
          count: feedback.length,
          avg_content: feedback.reduce((s, f) => s + (f.content_rating ?? 0), 0) / feedback.length,
          avg_trainer: feedback.reduce((s, f) => s + (f.trainer_rating ?? 0), 0) / feedback.length,
          avg_venue: feedback.reduce((s, f) => s + (f.venue_rating ?? 0), 0) / feedback.length,
          avg_overall: feedback.reduce((s, f) => s + (f.overall_rating ?? 0), 0) / feedback.length,
        }
      : null

    return NextResponse.json({
      data: {
        ...session,
        attendance: attendanceResult.data ?? [],
        feedback_summary: feedbackSummary,
      },
    })
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

    const { data, error } = await supabase
      .from('training_sessions')
      .update({ ...parsed, updated_at: new Date().toISOString() })
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
