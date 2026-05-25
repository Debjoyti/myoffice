/**
 * GET /api/v1/dashboard/stats
 *
 * Company-wide KPI snapshot for the Dashboard page.
 * Accessible by admin, hr, manager, and accountant roles.
 * Returns a single object so the dashboard can make ONE API call instead of five.
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED_ROLES = new Set(['admin', 'hr', 'manager', 'accountant'])

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!ALLOWED_ROLES.has(employee.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const companyId = employee.company_id
  const today = new Date().toISOString().split('T')[0]
  const thisMonthStart = today.slice(0, 7) + '-01'

  // Step 1: get all employee IDs for this company (needed for attendance sub-query)
  const { data: empList } = await supabase
    .from('employees')
    .select('id, status, date_of_joining')
    .eq('company_id', companyId)

  const allEmpIds      = (empList ?? []).map((e: any) => e.id)
  const activeEmpIds   = (empList ?? []).filter((e: any) => e.status === 'active').map((e: any) => e.id)
  const activeCount    = activeEmpIds.length
  const newHiresCount  = (empList ?? []).filter((e: any) =>
    e.status === 'active' && e.date_of_joining >= thisMonthStart
  ).length

  // Step 2: run the remaining queries in parallel
  const [
    deptResult,
    presentResult,
    pendingLeavesResult,
    payrollResult,
    pendingApprovalResult,
  ] = await Promise.allSettled([
    // Department count
    supabase
      .from('departments')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'active'),

    // Present today — employees with any attendance session today
    allEmpIds.length > 0
      ? supabase
          .from('attendance_sessions')
          .select('employee_id', { count: 'exact', head: true })
          .eq('date', today)
          .in('employee_id', allEmpIds)
      : Promise.resolve({ count: 0 }),

    // Pending leave requests
    supabase
      .from('approvals')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('type', 'leave')
      .eq('status', 'pending'),

    // Latest payroll run
    supabase
      .from('payrolls')
      .select('id, payroll_month, total_gross, status')
      .eq('company_id', companyId)
      .order('payroll_month', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // All pending approvals
    supabase
      .from('approvals')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'pending'),
  ])

  // Safely extract values
  const departments      = deptResult.status === 'fulfilled'           ? (deptResult.value.count ?? 0)           : 0
  const presentToday     = presentResult.status === 'fulfilled'        ? ((presentResult.value as any).count ?? 0) : 0
  const pendingLeaves    = pendingLeavesResult.status === 'fulfilled'  ? (pendingLeavesResult.value.count ?? 0)   : 0
  const latestPayroll    = payrollResult.status === 'fulfilled'        ? payrollResult.value.data                 : null
  const pendingApprovals = pendingApprovalResult.status === 'fulfilled'? (pendingApprovalResult.value.count ?? 0) : 0

  return NextResponse.json({
    active_employees:   activeCount,
    departments,
    present_today:      presentToday,
    absent_today:       Math.max(0, activeCount - presentToday),
    attendance_rate:    activeCount > 0 ? Math.round((presentToday / activeCount) * 100) : 0,
    new_hires_month:    newHiresCount,
    pending_leaves:     pendingLeaves,
    pending_approvals:  pendingApprovals,
    latest_payroll: latestPayroll
      ? {
          id:          (latestPayroll as any).id,
          month:       (latestPayroll as any).payroll_month,
          total_gross: (latestPayroll as any).total_gross,
          status:      (latestPayroll as any).status,
        }
      : null,
  })
}
