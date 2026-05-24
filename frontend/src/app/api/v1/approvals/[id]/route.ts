import { NextResponse } from 'next/server'
import { requireManager } from '@/lib/supabase/employee'
import { logAudit } from '@/lib/services/audit'
import { z } from 'zod'

const actionSchema = z.object({
  action:  z.enum(['approve', 'reject', 'cancel']),
  reason:  z.string().optional(),
})

/**
 * GET /api/v1/approvals/[id] — get single approval request detail
 * PATCH /api/v1/approvals/[id] — approve / reject / cancel
 *
 * Works for both leave_requests AND reimbursements.
 * The request body must include `resource_type: 'leave' | 'reimbursement'`.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await requireManager()
  if (result instanceof NextResponse) return result
  const { supabase } = result

  // Try leave_requests first, then reimbursements
  const { data: leave } = await supabase
    .from('leave_requests')
    .select(`
      *, employee:employee_id (id, full_name, employee_code, designation, department),
      approver:approver_id (id, full_name)
    `)
    .eq('id', id)
    .maybeSingle()

  if (leave) return NextResponse.json({ request: leave, resource_type: 'leave' })

  const { data: reimb } = await supabase
    .from('reimbursements')
    .select(`*, employee:employee_id (id, full_name, employee_code), approver:approved_by (id, full_name)`)
    .eq('id', id)
    .maybeSingle()

  if (reimb) return NextResponse.json({ request: reimb, resource_type: 'reimbursement' })

  return NextResponse.json({ error: 'Approval request not found' }, { status: 404 })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await requireManager()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result

  const body = await req.json()
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { action, reason } = parsed.data
  const resourceType: string = body.resource_type ?? 'leave'
  const now = new Date().toISOString()

  if (resourceType === 'reimbursement') {
    const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'rejected'

    const { data: old } = await supabase.from('reimbursements').select('*').eq('id', id).single()
    if (!old) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (old.status !== 'pending') return NextResponse.json({ error: `Already ${old.status}` }, { status: 409 })

    const { data, error } = await supabase
      .from('reimbursements')
      .update({ status: newStatus, approved_by: actor.id, approved_at: now })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    logAudit({
      supabase, actorId: actor.id, actorEmail: actor.email,
      action: action as any, resourceType: 'reimbursement', resourceId: id,
      oldValues: { status: old.status }, newValues: { status: newStatus, reason },
    })

    // Notify the employee
    await supabase.from('notifications').insert({
      employee_id: old.employee_id,
      title: `Reimbursement ${newStatus}`,
      message: `Your ₹${Number(old.amount).toLocaleString('en-IN')} ${old.category} claim has been ${newStatus}.${reason ? ` Reason: ${reason}` : ''}`,
      type: action === 'approve' ? 'success' : 'warning',
      action_url: '/salary',
    })

    return NextResponse.json({ request: data, message: `Reimbursement ${newStatus}` })
  }

  // Default: leave_request
  const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'cancelled'

  const { data: old } = await supabase.from('leave_requests').select('*').eq('id', id).single()
  if (!old) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (old.status !== 'pending') return NextResponse.json({ error: `Already ${old.status}` }, { status: 409 })

  const { data, error } = await supabase
    .from('leave_requests')
    .update({ status: newStatus, approver_id: actor.id })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // When approved, deduct days from the employee's leave balance for this type
  if (action === 'approve' && old.days_count) {
    const { data: balance } = await supabase
      .from('leave_balances')
      .select('id, used_days, available_days')
      .eq('employee_id', old.employee_id)
      .eq('leave_type', old.type)
      .maybeSingle()

    if (balance) {
      const newUsed      = (Number(balance.used_days)      || 0) + Number(old.days_count)
      const newAvailable = Math.max(0, (Number(balance.available_days) || 0) - Number(old.days_count))
      await supabase
        .from('leave_balances')
        .update({
          used_days:      newUsed,
          available_days: newAvailable,
          updated_at:     new Date().toISOString(),
        })
        .eq('id', balance.id)
    }
  }

  logAudit({
    supabase, actorId: actor.id, actorEmail: actor.email,
    action: action as any, resourceType: 'leave_request', resourceId: id,
    oldValues: { status: old.status }, newValues: { status: newStatus, reason },
  })

  // Notify employee
  await supabase.from('notifications').insert({
    employee_id: old.employee_id,
    title: `Leave Request ${newStatus}`,
    message: `Your "${old.title}" leave request has been ${newStatus}.${reason ? ` Reason: ${reason}` : ''}`,
    type: action === 'approve' ? 'success' : 'warning',
    action_url: '/home',
  })

  return NextResponse.json({ request: data, message: `Leave ${newStatus}` })
}
