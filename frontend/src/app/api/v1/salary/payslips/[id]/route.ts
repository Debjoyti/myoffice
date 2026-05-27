import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { data: payslip, error } = await supabase
    .from('payslips')
    .select('*')
    .eq('id', id)
    .eq('employee_id', employee.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!payslip) return NextResponse.json({ error: 'Payslip not found' }, { status: 404 })

  // Build detailed line items for PDF-style view
  const earningsLines = [
    { label: 'Basic', amount: payslip.basic_paid },
    { label: 'House Rent Allowance (HRA)', amount: payslip.hra_paid },
    { label: 'Special Allowance', amount: payslip.special_allowance_paid },
    { label: 'Transport Allowance', amount: payslip.transport_allowance_paid },
    { label: 'Medical Allowance', amount: payslip.medical_allowance_paid },
    { label: 'Leave Travel Allowance (LTA)', amount: payslip.lta_paid },
    ...(payslip.bonus_paid > 0 ? [{ label: 'Performance Bonus', amount: payslip.bonus_paid }] : []),
    ...(payslip.other_earnings > 0 ? [{ label: 'Other Earnings', amount: payslip.other_earnings }] : []),
  ].filter(l => l.amount > 0)

  const deductionLines = [
    { label: 'Provident Fund (Employee)', amount: payslip.pf_employee_deduction },
    { label: 'ESI (Employee)', amount: payslip.esi_employee_deduction },
    { label: 'Professional Tax', amount: payslip.professional_tax_deduction },
    ...(payslip.tds_deduction > 0 ? [{ label: 'TDS', amount: payslip.tds_deduction }] : []),
    ...(payslip.advance_deduction > 0 ? [{ label: 'Advance Recovery', amount: payslip.advance_deduction }] : []),
    ...(payslip.other_deductions > 0 ? [{ label: 'Other Deductions', amount: payslip.other_deductions }] : []),
  ].filter(l => l.amount > 0)

  return NextResponse.json({
    payslip: {
      ...payslip,
      earnings_lines: earningsLines,
      deduction_lines: deductionLines,
    },
  })
}
