import { createClient } from './server'
import { NextResponse } from 'next/server'

export type Employee = {
  id: string
  company_id: string
  employee_code: string
  full_name: string
  email: string
  phone: string | null
  designation: string
  department: string
  department_id: string | null
  position_id: string | null
  manager_id: string | null
  avatar_url: string | null
  date_of_joining: string
  date_of_birth: string | null
  employment_type: string
  status: string
  role: 'admin' | 'hr' | 'manager' | 'employee' | 'accountant'
  user_id: string | null
  pan_number: string | null
  bank_account: string | null
  bank_ifsc: string | null
  bank_name: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
}

type AuthResult = { employee: Employee; supabase: Awaited<ReturnType<typeof createClient>> }

/** Returns the authenticated employee, or a 401/404 NextResponse. */
export async function getAuthenticatedEmployee(): Promise<AuthResult | NextResponse> {
  const supabase = await createClient()
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (authError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', session.user.id)
    .single()
  if (empError || !employee) {
    return NextResponse.json(
      { error: 'Employee record not found. Contact HR to link your account.' },
      { status: 404 }
    )
  }
  return { employee: employee as Employee, supabase }
}

/** Requires HR or Admin role. Returns 403 otherwise. */
export async function requireHR(): Promise<AuthResult | NextResponse> {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  if (!['admin', 'hr'].includes(result.employee.role)) {
    return NextResponse.json({ error: 'HR or Admin access required' }, { status: 403 })
  }
  return result
}

/** Requires Admin role only. Returns 403 otherwise. */
export async function requireAdmin(): Promise<AuthResult | NextResponse> {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  if (result.employee.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  return result
}

/** Requires manager, HR, or Admin. Returns 403 otherwise. */
export async function requireManager(): Promise<AuthResult | NextResponse> {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  if (!['admin', 'hr', 'manager'].includes(result.employee.role)) {
    return NextResponse.json({ error: 'Manager or above access required' }, { status: 403 })
  }
  return result
}

/** Requires accountant, HR, or Admin. Returns 403 otherwise.
 *  Use for finance-related endpoints (payroll view, salary, procurement). */
export async function requireFinance(): Promise<AuthResult | NextResponse> {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  if (!['admin', 'hr', 'accountant'].includes(result.employee.role)) {
    return NextResponse.json({ error: 'Finance access required' }, { status: 403 })
  }
  return result
}

/** Requires HR, Admin, or Accountant — for payroll-related endpoints. */
export async function requirePayrollAccess(): Promise<AuthResult | NextResponse> {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  if (!['admin', 'hr', 'accountant'].includes(result.employee.role)) {
    return NextResponse.json({ error: 'HR, Admin, or Accountant access required' }, { status: 403 })
  }
  return result
}
