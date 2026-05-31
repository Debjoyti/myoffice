import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const GRNLineSchema = z.object({
  item_id:       z.string().uuid().optional(),
  sku:           z.string().optional(),
  name:          z.string().min(1),
  po_qty:        z.number().min(0).default(0),
  received_qty:  z.number().positive(),
  accepted_qty:  z.number().min(0),
  rejected_qty:  z.number().min(0).default(0),
  uom:           z.string().min(1),
  rate:          z.number().min(0),
  gst_rate:      z.number().min(0).max(100).default(18),
  amount:        z.number().min(0),
  bin_id:        z.string().uuid().optional(),
  lot_no:        z.string().optional(),
  batch_no:      z.string().optional(),
  expiry_date:   z.string().optional(),
  remarks:       z.string().optional(),
})

const GRNSchema = z.object({
  po_id:               z.string().uuid().optional(),
  po_no:               z.string().optional(),
  vendor_id:           z.string().uuid().optional(),
  vendor_name:         z.string().optional(),
  receipt_date:        z.string().optional(),
  vehicle_no:          z.string().optional(),
  lr_no:               z.string().optional(),
  bl_no:               z.string().optional(),
  invoice_no:          z.string().optional(),
  invoice_date:        z.string().optional(),
  invoice_amount:      z.number().min(0).optional(),
  warehouse_id:        z.string().uuid(),
  items:               z.array(GRNLineSchema).min(1),
  inspection_required: z.boolean().default(true),
  notes:               z.string().optional(),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const po_id  = url.searchParams.get('po_id')

  let query = supabase
    .from('goods_receipts')
    .select(`
      id, grn_no, po_id, po_no, vendor_name, receipt_date, vehicle_no,
      lr_no, invoice_no, warehouse_id, items, total_received_value,
      inspection_required, inspection_status, qc_done_at,
      status, posted_at, created_at
    `)
    .eq('company_id', employee.company_id)

  if (status && status !== 'all') query = query.eq('status', status)
  if (po_id)  query = query.eq('po_id', po_id)

  const { data, error } = await query.order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const grns = data ?? []
  const summary = {
    total:               grns.length,
    pending_inspection:  grns.filter(g => g.inspection_status === 'pending').length,
    posted:              grns.filter(g => g.status === 'posted').length,
    total_value:         grns.reduce((s, g) => s + Number(g.total_received_value || 0), 0),
  }

  return NextResponse.json({ goods_receipts: grns, summary })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!['admin', 'accountant', 'manager'].includes(employee.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const body = await req.json()

  // Handle QC pass/fail
  if (body.action === 'qc_result' && body.grn_id) {
    const update: any = {
      inspection_status: body.result, // passed|failed|conditional
      qc_notes:          body.notes ?? null,
      qc_done_by:        employee.id,
      qc_done_at:        new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    }
    // If QC passed, automatically post to stock
    if (body.result === 'passed' || body.result === 'conditional') {
      update.status = 'accepted'
    } else {
      update.status = 'partially_rejected'
    }

    const { data, error } = await supabase
      .from('goods_receipts')
      .update(update)
      .eq('id', body.grn_id)
      .eq('company_id', employee.company_id)
      .select('*').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  }

  // Handle post to stock ledger
  if (body.action === 'post' && body.grn_id) {
    const { data: grn } = await supabase
      .from('goods_receipts')
      .select('*')
      .eq('id', body.grn_id)
      .eq('company_id', employee.company_id)
      .single()

    if (!grn) return NextResponse.json({ error: 'GRN not found' }, { status: 404 })
    if (grn.status === 'posted') return NextResponse.json({ error: 'Already posted' }, { status: 409 })

    // Post each accepted line to stock ledger via DB function
    const lines = grn.items as any[]
    for (const line of lines) {
      const qty = Number(line.accepted_qty || line.received_qty)
      if (qty <= 0 || !line.item_id) continue

      await supabase.rpc('post_stock_movement', {
        p_company_id:     employee.company_id,
        p_item_id:        line.item_id,
        p_warehouse_id:   grn.warehouse_id,
        p_bin_id:         line.bin_id ?? null,
        p_lot_no:         line.lot_no ?? null,
        p_batch_no:       line.batch_no ?? null,
        p_movement_type:  'GR',
        p_movement_date:  grn.receipt_date,
        p_qty:            qty,
        p_uom:            line.uom,
        p_rate:           Number(line.rate || 0),
        p_reference_type: 'GRN',
        p_reference_id:   grn.id,
        p_reference_no:   grn.grn_no,
        p_narration:      `GRN ${grn.grn_no} from ${grn.vendor_name ?? 'Vendor'}`,
        p_posted_by:      employee.id,
      })
    }

    // Update PO received qty
    if (grn.po_id) {
      const { data: po } = await supabase
        .from('purchase_orders')
        .select('items, status')
        .eq('id', grn.po_id).single()

      if (po) {
        const poItems = (po.items as any[]).map(pi => {
          const grnLine = lines.find(l => l.item_id === pi.item_id)
          if (grnLine) {
            const newReceived = Number(pi.received_qty || 0) + Number(grnLine.accepted_qty || grnLine.received_qty)
            return { ...pi, received_qty: newReceived, pending_qty: Math.max(0, Number(pi.qty) - newReceived) }
          }
          return pi
        })

        const allReceived = poItems.every(pi => Number(pi.pending_qty || 0) === 0)
        await supabase
          .from('purchase_orders')
          .update({
            items:  poItems,
            status: allReceived ? 'received' : 'partially_received',
            updated_at: new Date().toISOString(),
          })
          .eq('id', grn.po_id)
      }
    }

    const { data, error } = await supabase
      .from('goods_receipts')
      .update({ status: 'posted', posted_by: employee.id, posted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', body.grn_id)
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  }

  // Create new GRN
  const parsed = GRNSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data: seqRow } = await supabase.rpc('next_doc_no', {
    p_company: employee.company_id,
    p_entity:  'grn',
    p_prefix:  'GRN',
  })

  const d = parsed.data
  const totalValue = d.items.reduce((s, i) => s + i.amount, 0)

  const { data, error } = await supabase
    .from('goods_receipts')
    .insert({
      company_id:          employee.company_id,
      grn_no:              seqRow ?? `GRN-${Date.now()}`,
      po_id:               d.po_id ?? null,
      po_no:               d.po_no ?? null,
      vendor_id:           d.vendor_id ?? null,
      vendor_name:         d.vendor_name ?? null,
      receipt_date:        d.receipt_date ?? new Date().toISOString().split('T')[0],
      vehicle_no:          d.vehicle_no ?? null,
      lr_no:               d.lr_no ?? null,
      bl_no:               d.bl_no ?? null,
      invoice_no:          d.invoice_no ?? null,
      invoice_date:        d.invoice_date ?? null,
      invoice_amount:      d.invoice_amount ?? null,
      warehouse_id:        d.warehouse_id,
      items:               d.items,
      total_received_value:totalValue,
      inspection_required: d.inspection_required,
      inspection_status:   d.inspection_required ? 'pending' : 'passed',
      status:              d.inspection_required ? 'under_inspection' : 'accepted',
      notes:               d.notes ?? null,
      created_by:          employee.id,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
