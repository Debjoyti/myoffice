import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const today = new Date().toISOString().split('T')[0]

  const { data: session } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('date', today)
    .maybeSingle()

  return NextResponse.json({ session: session ?? null, date: today })
}
