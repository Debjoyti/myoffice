import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function POST() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const today = new Date().toISOString().split('T')[0]

  // Check if already checked in today
  const { data: existing } = await supabase
    .from('attendance_sessions')
    .select('id, status')
    .eq('employee_id', employee.id)
    .eq('date', today)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'active') {
      return NextResponse.json({ error: 'Already checked in today' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Attendance already recorded for today' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('attendance_sessions')
    .insert({
      employee_id: employee.id,
      date: today,
      check_in_at: new Date().toISOString(),
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ session: data, message: 'Checked in successfully' })
}
