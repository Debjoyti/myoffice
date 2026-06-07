import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { businessToday } from '@/lib/utils'

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const today = businessToday()

  const { data: session } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('date', today)
    .maybeSingle()

  return NextResponse.json({ session: session ?? null, date: today })
}
