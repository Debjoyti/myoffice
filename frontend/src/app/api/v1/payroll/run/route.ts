import { NextResponse } from 'next/server'
import { requireHR } from '@/lib/supabase/employee'
import { logAudit } from '@/lib/services/audit'
import { runPayroll } from '@/lib/services/payroll'
import { z } from 'zod'

const runSchema = z.object({
  payroll_month: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM'),
  notes:         z.string().optional(),
})

/**
 * POST /api/v1/payroll/run
 * Runs payroll for ALL active employees for the given month.
 * Business rules:
 * - Locked payrolls cannot be re-run
 * - Attendance-based LOP is auto-calculated from attendance_sessions
 * - PF, ESI, PT are computed by the DB calculate_payslip() function
 * - Reimbursements are fetched separately and excluded from CTC
 */
export async function POST(req: Request) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result

  const body = await req.json()
  const parsed = runSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { payroll_month, notes } = parsed.data

  // Guard: don't allow future months (allow current + past)
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  if (payroll_month > currentMonth) {
    return NextResponse.json({ error: 'Cannot run payroll for a future month' }, { status: 400 })
  }

  try {
    const runResult = await runPayroll(supabase, payroll_month, actor.id, notes)

    logAudit({
      supabase, actorId: actor.id, actorEmail: actor.email,
      action: 'run_payroll', resourceType: 'payroll', resourceId: runResult.payroll_id,
      newValues: {
        month: payroll_month,
        employees: runResult.total_employees,
        total_gross: runResult.total_gross,
      },
    })

    return NextResponse.json({
      message: `Payroll run complete for ${payroll_month}`,
      ...runResult,
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
