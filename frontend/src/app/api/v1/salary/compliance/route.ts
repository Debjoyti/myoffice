import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { data: records, error } = await supabase
    .from('compliance_records')
    .select('*')
    .eq('employee_id', employee.id)
    .order('record_month', { ascending: false })
    .limit(12)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const list = records ?? []

  // Aggregate YTD totals (current fiscal year: Apr–Mar)
  const now = new Date()
  const fiscalStart =
    now.getMonth() >= 3
      ? `${now.getFullYear()}-04`
      : `${now.getFullYear() - 1}-04`

  const ytd = list.filter(r => r.record_month >= fiscalStart)

  const ytd_totals = {
    pf_employee: ytd.reduce((s, r) => s + Number(r.pf_employee), 0),
    pf_employer: ytd.reduce((s, r) => s + Number(r.pf_employer), 0),
    esi_employee: ytd.reduce((s, r) => s + Number(r.esi_employee), 0),
    esi_employer: ytd.reduce((s, r) => s + Number(r.esi_employer), 0),
    professional_tax: ytd.reduce((s, r) => s + Number(r.professional_tax), 0),
  }

  // UAN from most recent record
  const uan_number = list[0]?.uan_number ?? null
  const esi_applicable = list[0]?.esi_applicable ?? false

  return NextResponse.json({
    records: list,
    uan_number,
    esi_applicable,
    ytd_totals,
  })
}
