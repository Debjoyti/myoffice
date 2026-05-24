import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { data: payslips, error } = await supabase
    .from('payslips')
    .select('*')
    .eq('employee_id', employee.id)
    .order('payroll_month', { ascending: false })
    .limit(24)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payslips: payslips ?? [] })
}
