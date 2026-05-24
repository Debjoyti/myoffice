import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function POST() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const today = new Date().toISOString().split('T')[0]
  const now = new Date()

  const { data: session } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('date', today)
    .eq('status', 'active')
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ error: 'No active check-in found for today' }, { status: 404 })
  }

  const checkInTime = new Date(session.check_in_at)
  const durationMinutes = Math.floor((now.getTime() - checkInTime.getTime()) / 60_000)

  const { data, error } = await supabase
    .from('attendance_sessions')
    .update({
      check_out_at: now.toISOString(),
      status: 'completed',
      duration_minutes: durationMinutes,
    })
    .eq('id', session.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ session: data, message: 'Checked out successfully' })
}
