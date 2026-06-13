import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { canTransition } from '@/lib/services/marketplace'

const ALLOWED = new Set(['admin', 'accountant', 'manager'])
type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const { id } = await params

  const { data: order, error } = await supabase
    .from('marketplace_orders').select('*')
    .eq('id', id).eq('company_id', employee.company_id).single()
  if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const { data: events } = await supabase
    .from('marketplace_order_events').select('*')
    .eq('order_id', id).order('created_at', { ascending: true })

  return NextResponse.json({ ...order, events: events ?? [] })
}

/**
 * PATCH — drive the order through its lifecycle.
 * body: { to_status?, payment_status?, payment_method?, tracking_no?, carrier?, cancel_reason?, note? }
 * Stock side-effects:
 *   → confirmed : reserve stock (mkt_reserve_order)
 *   → shipped   : issue stock via GI (mkt_fulfill_order) + release reservation
 *   → cancelled : release reservation (mkt_release_order)
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const { id } = await params
  const body = await req.json() as Record<string, any>

  const { data: order } = await supabase
    .from('marketplace_orders').select('*')
    .eq('id', id).eq('company_id', employee.company_id).single()
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const update: Record<string, any> = { updated_at: new Date().toISOString() }
  const events: { event_type: string; message: string }[] = []
  const now = new Date().toISOString()

  // --- status transition ---
  const to = body.to_status as string | undefined
  if (to && to !== order.order_status) {
    if (!canTransition(order.order_status, to)) {
      return NextResponse.json({ error: `Cannot move from ${order.order_status} to ${to}` }, { status: 409 })
    }
    update.order_status = to

    if (to === 'confirmed') {
      update.confirmed_at = now
      const { error: rErr } = await supabase.rpc('mkt_reserve_order', { p_order_id: id })
      if (rErr) return NextResponse.json({ error: `Reservation failed: ${rErr.message}` }, { status: 400 })
      events.push({ event_type: 'reserved', message: 'Order confirmed; stock reserved' })
    }
    if (to === 'shipped') {
      update.shipped_at = now
      update.fulfillment_status = 'fulfilled'
      if (body.tracking_no) update.tracking_no = body.tracking_no
      if (body.carrier) update.carrier = body.carrier
      const { error: fErr } = await supabase.rpc('mkt_fulfill_order', { p_order_id: id, p_actor: employee.id })
      if (fErr) return NextResponse.json({ error: `Fulfilment failed: ${fErr.message}` }, { status: 400 })
      events.push({ event_type: 'shipped', message: `Shipped${body.carrier ? ' via ' + body.carrier : ''}${body.tracking_no ? ' · ' + body.tracking_no : ''}; stock issued (GI)` })
    }
    if (to === 'delivered') {
      update.delivered_at = now
      if (order.payment_method === 'cod' && order.payment_status !== 'paid') update.payment_status = 'paid'
      events.push({ event_type: 'delivered', message: 'Order delivered' })
    }
    if (to === 'completed') events.push({ event_type: 'note', message: 'Order completed' })
    if (to === 'cancelled') {
      update.cancelled_at = now
      update.cancel_reason = body.cancel_reason ?? null
      if (order.stock_reserved && !order.stock_issued) {
        await supabase.rpc('mkt_release_order', { p_order_id: id })
      }
      events.push({ event_type: 'cancelled', message: `Order cancelled${body.cancel_reason ? ': ' + body.cancel_reason : ''}` })
    }
    if (to === 'returned') events.push({ event_type: 'note', message: 'Return initiated' })
  }

  // --- payment update (independent of status) ---
  if (body.payment_status && body.payment_status !== order.payment_status) {
    update.payment_status = body.payment_status
    events.push({ event_type: 'paid', message: `Payment marked ${body.payment_status}` })
  }
  if (body.payment_method) update.payment_method = body.payment_method
  if (body.note) events.push({ event_type: 'note', message: body.note })

  const { data, error } = await supabase
    .from('marketplace_orders').update(update)
    .eq('id', id).eq('company_id', employee.company_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (events.length) {
    await supabase.from('marketplace_order_events').insert(
      events.map(e => ({ company_id: employee.company_id, order_id: id, ...e, actor_id: employee.id }))
    )
  }
  return NextResponse.json(data)
}
