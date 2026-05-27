import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const attendanceEntrySchema = z.object({
  employee_id: z.string().uuid(),
  attendance_status: z.enum(['present', 'absent', 'partial']).default('present'),
  arrival_time: z.string().optional(),
  departure_time: z.string().optional(),
  signature_obtained: z.boolean().optional(),
  pre_test_score: z.number().optional(),
  post_test_score: z.number().optional(),
  remarks: z.string().optional(),
})

const bulkSchema = z.object({
  session_id: z.string().uuid(),
  entries: z.array(attendanceEntrySchema),
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
    if (!sessionId) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

    const { data, error } = await supabase
      .from('training_attendance')
      .select('*, emp:employee_id(id, users(full_name, email))')
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
      .select('company_id, role')
      .eq('id', user.id)
      .single()
    if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 403 })

    const role = userProfile.role as string
    if (!['hr', 'company_admin', 'super_admin', 'manager'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = bulkSchema.parse(body)

    const rows = parsed.entries.map(e => ({
      company_id: userProfile.company_id,
      session_id: parsed.session_id,
      ...e,
    }))

    const { data, error } = await supabase
      .from('training_attendance')
      .upsert(rows, { onConflict: 'session_id,employee_id' })
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
