import { DEMO_COMPANY_NAME, DEMO_PASSWORD, getDemoUser } from '@/lib/demo-accounts'
import { createAdminClient } from '@/lib/supabase/admin'

export async function ensureDemoAccount(email: string) {
  const demo = getDemoUser(email)
  if (!demo) return null

  const supabase = createAdminClient()

  const { data: users, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw new Error(`Unable to check demo auth users: ${listError.message}`)

  const existingUser = users.users.find((user) => user.email?.toLowerCase() === demo.email)
  let userId = existingUser?.id

  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: demo.full_name },
    })
    if (error) throw new Error(`Unable to repair demo auth user: ${error.message}`)
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: demo.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: demo.full_name },
    })
    if (error || !data.user) {
      throw new Error(`Unable to create demo auth user: ${error?.message ?? 'unknown error'}`)
    }
    userId = data.user.id
  }

  const { data: existingCompany, error: companyLookupError } = await supabase
    .from('companies')
    .select('id')
    .eq('name', DEMO_COMPANY_NAME)
    .maybeSingle()
  if (companyLookupError) throw new Error(`Unable to find demo company: ${companyLookupError.message}`)

  let companyId = existingCompany?.id
  if (!companyId) {
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name: DEMO_COMPANY_NAME,
        organization_id: 'prsk-demo',
        currency: 'INR',
        status: 'active',
      })
      .select('id')
      .single()
    if (error || !company) throw new Error(`Unable to create demo company: ${error?.message ?? 'unknown error'}`)
    companyId = company.id
  }

  const { data: existingDept, error: deptLookupError } = await supabase
    .from('departments')
    .select('id')
    .eq('company_id', companyId)
    .eq('name', demo.department)
    .maybeSingle()
  if (deptLookupError) throw new Error(`Unable to find demo department: ${deptLookupError.message}`)

  let departmentId = existingDept?.id ?? null
  if (!departmentId) {
    const { data: department, error } = await supabase
      .from('departments')
      .insert({
        company_id: companyId,
        name: demo.department,
        code: demo.department.substring(0, 4).toUpperCase(),
        status: 'active',
      })
      .select('id')
      .single()
    if (error || !department) throw new Error(`Unable to create demo department: ${error?.message ?? 'unknown error'}`)
    departmentId = department.id
  }

  const employeePayload = {
    company_id: companyId,
    user_id: userId,
    employee_code: demo.employee_code,
    full_name: demo.full_name,
    email: demo.email,
    designation: demo.designation,
    department: demo.department,
    department_id: departmentId,
    role: demo.role,
    employment_type: demo.employment_type,
    status: 'active',
    date_of_joining: '2024-01-01',
  }

  const { data: existingEmployee, error: employeeLookupError } = await supabase
    .from('employees')
    .select('id')
    .or(`user_id.eq.${userId},email.eq.${demo.email}`)
    .limit(1)
    .maybeSingle()
  if (employeeLookupError) throw new Error(`Unable to find demo employee: ${employeeLookupError.message}`)

  if (existingEmployee) {
    const { error } = await supabase
      .from('employees')
      .update(employeePayload)
      .eq('id', existingEmployee.id)
    if (error) throw new Error(`Unable to update demo employee: ${error.message}`)
  } else {
    const { error } = await supabase.from('employees').insert(employeePayload)
    if (error) throw new Error(`Unable to create demo employee: ${error.message}`)
  }

  return { ...demo, user_id: userId, company_id: companyId }
}
