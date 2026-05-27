import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  // Fetch manager details
  let manager = null
  if (employee.manager_id) {
    const { data } = await supabase
      .from('employees')
      .select('id, full_name, designation, department, avatar_url, status')
      .eq('id', employee.manager_id)
      .single()
    manager = data
  }

  return NextResponse.json({ employee, manager })
}
