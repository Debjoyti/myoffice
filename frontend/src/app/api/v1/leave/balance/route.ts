import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

/** GET /api/v1/leave/balance — employee's leave balance for current year */
export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { searchParams } = new URL(req.url)
  const year = Number(searchParams.get('year') ?? new Date().getFullYear())
  const targetEmployee = searchParams.get('employee_id') ?? employee.id

  // HR can view any employee's balance; others only their own
  if (targetEmployee !== employee.id && !['admin', 'hr'].includes(employee.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: balances, error } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('employee_id', targetEmployee)
    .eq('year', year)
    .order('leave_type')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also return pending/approved leave requests for the year
  const { data: requests } = await supabase
    .from('leave_requests')
    .select('id, type, status, title, from_date, to_date, days_count, created_at')
    .eq('employee_id', targetEmployee)
    .in('status', ['pending', 'approved'])
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    balances: balances ?? [],
    year,
    recent_requests: requests ?? [],
  })
}
