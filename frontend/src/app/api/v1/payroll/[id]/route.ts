import { NextResponse } from 'next/server'
import { requireHR } from '@/lib/supabase/employee'
import { logAudit } from '@/lib/services/audit'
import { lockPayroll } from '@/lib/services/payroll'

/** GET /api/v1/payroll/[id] — payroll run detail with all payslips */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { supabase } = result

  const { data: payroll, error } = await supabase
    .from('payrolls')
    .select(`
      *,
      processor:processed_by (full_name, designation)
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'Payroll not found' }, { status: 404 })

  const { data: payslips } = await supabase
    .from('payslips')
    .select(`
      id, payroll_month, paid_days, working_days, loss_of_pay_days,
      gross_earnings, total_deductions, net_salary, reimbursements_paid,
      status, generated_at, paid_at,
      employee:employee_id (id, full_name, employee_code, designation, department)
    `)
    .eq('payroll_id', id)
    .order('created_at')

  return NextResponse.json({ payroll, payslips: payslips ?? [] })
}

/**
 * PATCH /api/v1/payroll/[id]
 * action=lock  → locks payroll and finalizes all payslips
 * action=mark_paid → marks all payslips as paid
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result

  const body = await req.json()
  const { action } = body

  if (action === 'lock') {
    try {
      await lockPayroll(supabase, id)
      logAudit({
        supabase, actorId: actor.id, actorEmail: actor.email,
        action: 'lock_payroll', resourceType: 'payroll', resourceId: id,
      })
      return NextResponse.json({ message: 'Payroll locked and payslips finalized' })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
  }

  if (action === 'mark_paid') {
    const { error } = await supabase
      .from('payslips')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('payroll_id', id)
      .eq('status', 'finalized')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    logAudit({
      supabase, actorId: actor.id, actorEmail: actor.email,
      action: 'update', resourceType: 'payroll', resourceId: id,
      newValues: { action: 'mark_paid' },
    })

    return NextResponse.json({ message: 'All payslips marked as paid' })
  }

  return NextResponse.json({ error: 'Invalid action. Use: lock | mark_paid' }, { status: 400 })
}
