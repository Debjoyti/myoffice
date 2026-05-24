import { NextResponse } from 'next/server'
import { requirePayrollAccess } from '@/lib/supabase/employee'

/** GET /api/v1/payroll — list all payroll runs (HR/Admin/Accountant) */
export async function GET() {
  const result = await requirePayrollAccess()
  if (result instanceof NextResponse) return result
  const { supabase } = result

  const { data, error } = await supabase
    .from('payrolls')
    .select(`
      id, payroll_month, status,
      total_employees, total_gross, total_net, total_deductions, total_reimbursements,
      processed_at, locked_at, notes, created_at,
      processor:processed_by (full_name, designation)
    `)
    .order('payroll_month', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ payrolls: data ?? [] })
}
