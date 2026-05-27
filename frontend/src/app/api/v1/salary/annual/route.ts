import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year') ?? new Date().getFullYear().toString()

  // Fiscal year Apr–Mar
  const fiscalMonths = Array.from({ length: 12 }, (_, i) => {
    const month = ((3 + i) % 12) + 1  // Apr=4, May=5, ... Mar=3
    const y = i < 9 ? Number(year) : Number(year) + 1
    return `${y}-${String(month).padStart(2, '0')}`
  })

  const { data: payslips, error } = await supabase
    .from('payslips')
    .select('payroll_month, gross_earnings, total_deductions, net_salary, bonus_paid, reimbursements_paid, status')
    .eq('employee_id', employee.id)
    .in('payroll_month', fiscalMonths)
    .order('payroll_month', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const list = payslips ?? []

  const monthly_chart = fiscalMonths.map(month => {
    const p = list.find(x => x.payroll_month === month)
    return {
      month,
      gross: p ? Number(p.gross_earnings) : 0,
      net: p ? Number(p.net_salary) : 0,
      bonus: p ? Number(p.bonus_paid) : 0,
      status: p?.status ?? null,
    }
  })

  const ytd = {
    gross_total: list.reduce((s, p) => s + Number(p.gross_earnings), 0),
    net_total: list.reduce((s, p) => s + Number(p.net_salary), 0),
    deductions_total: list.reduce((s, p) => s + Number(p.total_deductions), 0),
    bonus_total: list.reduce((s, p) => s + Number(p.bonus_paid), 0),
    reimbursements_total: list.reduce((s, p) => s + Number(p.reimbursements_paid), 0),
    months_paid: list.filter(p => p.status === 'paid').length,
  }

  return NextResponse.json({ fiscal_year: year, monthly_chart, ytd })
}
