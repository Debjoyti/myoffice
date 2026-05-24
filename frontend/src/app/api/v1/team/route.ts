import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const today = new Date().toISOString().split('T')[0]

  // Get teammates: same manager, excluding self
  const { data: teammates } = await supabase
    .from('employees')
    .select('id, full_name, designation, department, avatar_url, status')
    .eq('manager_id', employee.manager_id ?? employee.id)
    .neq('id', employee.id)
    .eq('status', 'active')
    .limit(10)

  if (!teammates || teammates.length === 0) {
    return NextResponse.json({ team: [] })
  }

  // Get today's attendance for teammates
  const ids = teammates.map(t => t.id)
  const { data: sessions } = await supabase
    .from('attendance_sessions')
    .select('employee_id, status, check_in_at')
    .in('employee_id', ids)
    .eq('date', today)

  const sessionMap = new Map((sessions ?? []).map(s => [s.employee_id, s]))

  const team = teammates.map(t => ({
    ...t,
    today_session: sessionMap.get(t.id) ?? null,
    attendance_status: sessionMap.has(t.id)
      ? (sessionMap.get(t.id)!.status === 'active' ? 'checked_in' : 'checked_out')
      : 'not_checked_in',
  }))

  return NextResponse.json({ team })
}
