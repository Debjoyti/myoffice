import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { data: revisions, error } = await supabase
    .from('salary_revisions')
    .select(`
      id, revision_date, revision_type,
      old_ctc_monthly, new_ctc_monthly, percentage_change, notes,
      approved_by:approved_by (full_name, designation)
    `)
    .eq('employee_id', employee.id)
    .order('revision_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ revisions: revisions ?? [] })
}
