import { SupabaseClient } from '@supabase/supabase-js'

export type EmployeeCtx = {
  employee: {
    id: string
    company_id: string
    user_id: string
    designation: string
    department_id: string | null
    manager_id: string | null
  }
  company_id: string
  isHR: boolean
  isManager: boolean
  userId: string
}

/**
 * Returns the employee context for the currently authenticated user.
 * Throws if user is not authenticated or has no employee record.
 */
export async function getEmployeeCtx(supabase: SupabaseClient): Promise<EmployeeCtx> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('id, company_id, role, email, full_name')
    .eq('id', user.id)
    .single()

  if (profileError || !userProfile) throw new Error('User profile not found')

  // Get employee record
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, company_id, user_id, designation, department_id, manager_id')
    .eq('user_id', user.id)
    .eq('company_id', userProfile.company_id)
    .single()

  if (empError || !employee) throw new Error('Employee record not found')

  const role = userProfile.role as string
  const isHR = ['hr', 'company_admin', 'super_admin'].includes(role)
  const isManager = isHR || role === 'manager'

  return {
    employee,
    company_id: userProfile.company_id,
    isHR,
    isManager,
    userId: user.id,
  }
}
