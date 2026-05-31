import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const POLineSchema = z.object({
  item_id:      z.string().uuid().optional(),
  sku:          z.string().optional(),
  name:         z.string().min(1),
  qty:          z.number().positive(),
  uom:          z.string().min(1),
  rate:         z.number().min(0),
  gst_rate:     z.number().min(0).max(100).default(18),
  amount:       z.number().min(0),
  received_qty: z.number().min(0).default(0),
  pending_qty:  z.number().min(0).optional(),
  remarks:      z.string().optional(),
  hsn_code:     z.string().optional(),
})

const POSchema = z.object({
  pr_id:          z.string().uuid().optional(),
  pr_no:          z.string().optional(),
  vendor_id:      z.string().uuid().optional(),
  vendor_name:    z.string().min(1),
  vendor_gstin:   z.string().optional(),
  vendor_pan:     z.string().optional(),
  po_type:        z.enum(['domestic', 'import']).default('domestic'),
  currency:       z.string().default('INR'),
  exchange_rate:  z.number().positive().default(1),
  incoterms:      z.string().optional(),
  port_of_loading:      z.string().optional(),
  port_of_discharge:    z.string().optional(),
  payment_terms:        z.string().optional(),
  delivery_terms:       z.string().optional(),
  delivery_date:        z.string().optional(),
  delivery_address:     z.string().optional(),
  delivery_warehouse_id:z.string().uuid().optional(),
  items:          z.array(POLineSchema).min(1),
  freight_charges:z.number().min(0).default(0),
  insurance:      z.number().min(0).default(0),
  other_charges:  z.number().min(0).default(0),
  notes:          z.string().optional(),
  terms_conditions:z.string().optional(),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const url = new URL(req.url)
  const status    = url.searchParams.get('status')
  const po_type   = url.searchParams.get('type')
  const vendor_id = url.searchParams.get('vendor_id')
  const pr_id     = url.searchParams.get('pr_id')

  let query = supabase
    .from('purchase_orders')
    .select(`
      id, po_no, pr_id, pr_no, vendor_id, vendor_name, vendor_gstin,
      po_type, currency, exchange_rate, incoterms,
      po_date, delivery_date, delivery_warehouse_id,
      items, subtotal_inr, tax_amount, freight_charges, insurance, other_charges,
      total_amount, landed_cost, status, approved_at, sent_to_vendor_at,
      created_at, created_by
    `)
    .eq('company_id', employee.company_id)

  if (status && status !== 'all') query = query.eq('status', status)
  if (po_type)   query = query.eq('po_type', po_type)
  if (vendor_id) query = query.eq('vendor_id', vendor_id)
  if (pr_id)     query = query.eq('pr_id', pr_id)

  const { data, error } = await query.order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const pos = data ?? []
  const summary = {
    total:             pos.length,
    draft:             pos.filter(p => p.status === 'draft').length,
    approved:          pos.filter(p => p.status === 'approved').length,
    sent:              pos.filter(p => p.status === 'sent_to_vendor').length,
    partially_received:pos.filter(p => p.status === 'partially_received').length,
    import_orders:     pos.filter(p => p.po_type === 'import').length,
    total_value:       pos.reduce((s, p) => s + Number(p.total_amount || 0), 0),
    pending_value:     pos.filter(p => !['received','closed','cancelled'].includes(p.status))
                         .reduce((s, p) => s + Number(p.total_amount || 0), 0),
  }

  return NextResponse.json({ purchase_orders: pos, summary })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!['admin', 'accountant', 'manager'].includes(employee.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const body = await req.json()

  // Handle status actions (approve, send, cancel, close)
  if (body.action && body.po_id) {
    const transitions: Record<string, { status: string; role?: string[] }> = {
      approve:      { status: 'approved',        role: ['admin', 'accountant'] },
      send_vendor:  { status: 'sent_to_vendor',  role: ['admin', 'accountant', 'manager'] },
      acknowledge:  { status: 'acknowledged' },
      close:        { status: 'closed',          role: ['admin', 'accountant'] },
      cancel:       { status: 'cancelled',       role: ['admin'] },
    }

    const t = transitions[body.action]
    if (!t) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    if (t.role && !t.role.includes(employee.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const update: any = { status: t.status, updated_at: new Date().toISOString() }
    if (body.action === 'approve')     { update.approved_by = employee.id; update.approved_at = new Date().toISOString() }
    if (body.action === 'send_vendor') { update.sent_to_vendor_at = new Date().toISOString() }
    if (body.action === 'close')       { update.closed_at = new Date().toISOString() }

    const { data, error } = await supabase
      .from('purchase_orders')
      .update(update)
      .eq('id', body.po_id)
      .eq('company_id', employee.company_id)
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  }

  // Create new PO
  const parsed = POSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data: seqRow } = await supabase.rpc('next_doc_no', {
    p_company: employee.company_id,
    p_entity:  'po',
    p_prefix:  'PO',
  })

  const d = parsed.data
  const subtotal    = d.items.reduce((s, i) => s + i.amount, 0)
  const taxAmount   = d.items.reduce((s, i) => s + (i.amount * (i.gst_rate / 100)), 0)
  const totalAmount = subtotal + taxAmount + d.freight_charges + d.insurance + d.other_charges

  const subtotalForeign = d.currency !== 'INR' ? subtotal : null
  const subtotalINR     = d.currency !== 'INR' ? subtotal * d.exchange_rate : subtotal

  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({
      company_id:           employee.company_id,
      po_no:                seqRow ?? `PO-${Date.now()}`,
      pr_id:                d.pr_id ?? null,
      pr_no:                d.pr_no ?? null,
      vendor_id:            d.vendor_id ?? null,
      vendor_name:          d.vendor_name,
      vendor_gstin:         d.vendor_gstin ?? null,
      vendor_pan:           d.vendor_pan ?? null,
      po_type:              d.po_type,
      currency:             d.currency,
      exchange_rate:        d.exchange_rate,
      incoterms:            d.incoterms ?? null,
      port_of_loading:      d.port_of_loading ?? null,
      port_of_discharge:    d.port_of_discharge ?? null,
      payment_terms:        d.payment_terms ?? null,
      delivery_terms:       d.delivery_terms ?? null,
      po_date:              new Date().toISOString().split('T')[0],
      delivery_date:        d.delivery_date ?? null,
      delivery_address:     d.delivery_address ?? null,
      delivery_warehouse_id:d.delivery_warehouse_id ?? null,
      items:                d.items.map(i => ({ ...i, pending_qty: i.qty - i.received_qty })),
      subtotal_foreign:     subtotalForeign,
      subtotal_inr:         subtotalINR,
      tax_amount:           taxAmount,
      freight_charges:      d.freight_charges,
      insurance:            d.insurance,
      other_charges:        d.other_charges,
      total_amount:         totalAmount,
      notes:                d.notes ?? null,
      terms_conditions:     d.terms_conditions ?? null,
      status:               body.submit ? 'approved' : 'draft',
      created_by:           employee.id,
      approved_by:          body.submit ? employee.id : null,
      approved_at:          body.submit ? new Date().toISOString() : null,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Update PR status to partially_ordered if pr_id given
  if (d.pr_id) {
    await supabase
      .from('purchase_requests')
      .update({ status: 'partially_ordered', updated_at: new Date().toISOString() })
      .eq('id', d.pr_id)
      .eq('company_id', employee.company_id)
  }

  return NextResponse.json(data, { status: 201 })
}
