import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { data: approvals, error } = await supabase
    .from('leave_requests')
    .select(`
      id, type, status, title, description,
      from_date, to_date, days_count, created_at,
      approver:approver_id (full_name, designation)
    `)
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(10)

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
