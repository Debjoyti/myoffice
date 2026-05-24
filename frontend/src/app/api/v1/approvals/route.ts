import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { searchParams } = new URL(req.url)
  const mode   = searchParams.get('mode')   // 'pending_for_me' | null
  const status = searchParams.get('status') // filter by status
  const limit  = Math.min(Number(searchParams.get('limit') ?? 20), 100)

  /**
   * mode=pending_for_me → manager/HR inbox: all pending requests where
   * this employee is the designated approver.
   * Default → employee's own request history.
   */
  if (mode === 'pending_for_me') {
    // Only managers/HR make sense as approvers, but we allow any authenticated user to query
    const leaveQuery = supabase
      .from('leave_requests')
      .select(`
        id, type, status, title, description,
        from_date, to_date, days_count, created_at,
        employee:employee_id (id, full_name, employee_code, designation, department, avatar_url)
      `)
      .eq('approver_id', employee.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    const reimbQuery = supabase
      .from('reimbursements')
      .select(`
        id, category, amount, status, description, receipt_url, created_at,
        employee:employee_id (id, full_name, employee_code, designation, department, avatar_url)
      `)
      .is('approved_by', null)    // not yet acted on
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit)

    // HR/Admin see all pending; managers see only their direct reports' requests
    if (!['admin', 'hr'].includes(employee.role)) {
      leaveQuery.eq('approver_id', employee.id)
      // for reimbursements, managers' team is identified via leave approver linkage
      // filter reimbursements submitted by direct reports
      const { data: directReports } = await supabase
        .from('employees')
        .select('id')
        .eq('manager_id', employee.id)
        .eq('status', 'active')
      const directIds = (directReports ?? []).map(e => e.id)
      if (directIds.length > 0) {
        reimbQuery.in('employee_id', directIds)
      } else {
        // No direct reports — return empty reimbursement list
        reimbQuery.eq('employee_id', 'no-match-uuid')
      }
    }

    if (status) {
      leaveQuery.eq('status', status)
    } else {
      leaveQuery.eq('status', 'pending')
    }

    const [{ data: leaves, error: lErr }, { data: reimbs, error: rErr }] =
      await Promise.all([leaveQuery, reimbQuery])

    if (lErr || rErr) {
      return NextResponse.json({ error: lErr?.message ?? rErr?.message }, { status: 500 })
    }

    return NextResponse.json({
      leave_requests:   leaves  ?? [],
      reimbursements:   reimbs  ?? [],
      total_pending:    (leaves?.length ?? 0) + (reimbs?.length ?? 0),
    })
  }

  // Default: own request history
  let leaveQuery = supabase
    .from('leave_requests')
    .select(`
      id, type, status, title, description,
      from_date, to_date, days_count, created_at,
      approver:approver_id (full_name, designation)
    `)
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) leaveQuery = leaveQuery.eq('status', status)

  const { data: approvals, error } = await leaveQuery

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ approvals: approvals ?? [] })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const body = await req.json()
  const { type, title, description, from_date, to_date, days_count } = body

  if (!type || !title || !from_date) {
    return NextResponse.json({ error: 'type, title, and from_date are required' }, { status: 400 })
  }

  // Find approver (manager)
  const approverId = employee.manager_id ?? null

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      employee_id: employee.id,
      type, title, description,
      from_date, to_date: to_date ?? from_date,
      days_count: days_count ?? 1,
      approver_id: approverId,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ approval: data, message: 'Request submitted successfully' }, { status: 201 })
}
