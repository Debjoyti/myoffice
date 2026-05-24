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

  // Compute summary stats for the returned window
  const sessions   = data ?? []
  const present    = sessions.filter(s => s.check_in_time).length
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
