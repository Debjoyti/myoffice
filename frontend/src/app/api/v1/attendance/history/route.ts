import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

/**
 * GET /api/v1/attendance/history
 * Returns paginated attendance sessions for an employee.
 *
 * Query params:
 *   ?employee_id=<uuid>   — HR/Admin can query anyone; others get their own
 *   ?from=YYYY-MM-DD      — start date (inclusive)
 *   ?to=YYYY-MM-DD        — end date (inclusive)
 *   ?limit=30
 *   ?offset=0
 */
export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { searchParams } = new URL(req.url)
  const requestedId = searchParams.get('employee_id')
  const from        = searchParams.get('from')
  const to          = searchParams.get('to')
  const limit       = Math.min(Number(searchParams.get('limit')  ?? 30), 100)
  const offset      = Number(searchParams.get('offset') ?? 0)

  // Access control: non-HR can only query their own history
  const isHR      = ['admin', 'hr'].includes(employee.role)
  const targetId  = isHR && requestedId ? requestedId : employee.id

  if (!isHR && requestedId && requestedId !== employee.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let query = supabase
    .from('attendance_sessions')
    .select('*', { count: 'exact' })
    .eq('employee_id', targetId)
    .order('date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (from) query = query.gte('date', from)
  if (to)   query = query.lte('date', to)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rawSessions = data ?? []

  // `is_late` isn't stored on the session — derive it from the employee's
  // per-weekday work schedule (start_time + a 10-minute grace window).
  const { data: schedules } = await supabase
    .from('work_schedules')
    .select('day_of_week, start_time')
    .eq('employee_id', targetId)

  const startTimeByDay = new Map<number, string>(
    (schedules ?? []).map(s => [s.day_of_week, s.start_time ?? '09:00'])
  )
  const GRACE_MINUTES = 10

  const isLate = (session: { date: string; check_in_at: string | null }): boolean => {
    if (!session.check_in_at) return false
    const checkIn  = new Date(session.check_in_at)
    const dayOfWk  = new Date(`${session.date}T00:00:00`).getDay()
    const startStr = startTimeByDay.get(dayOfWk) ?? '09:00'
    const [h, m]   = startStr.split(':').map(Number)
    const scheduled = new Date(checkIn)
    scheduled.setHours(h, (m || 0) + GRACE_MINUTES, 0, 0)
    return checkIn > scheduled
  }

  const sessions = rawSessions.map(s => ({ ...s, is_late: isLate(s) }))

  // Compute summary stats for the returned window
  const present    = sessions.filter(s => s.check_in_at).length
  const late       = sessions.filter(s => s.is_late).length
  const totalMins  = sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)

  return NextResponse.json({
    sessions,
    total:   count ?? 0,
    limit,
    offset,
    summary: {
      present_days:       present,
      late_arrivals:      late,
      total_hours_worked: Math.round(totalMins / 60 * 10) / 10,
    },
  })
}
