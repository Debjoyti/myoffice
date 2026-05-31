import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const STOSchema = z.object({
  from_warehouse_id: z.string().uuid(),
  to_warehouse_id:   z.string().uuid(),
  from_bin_id:       z.string().uuid().optional(),
  to_bin_id:         z.string().uuid().optional(),
  transfer_date:     z.string().optional(),
  expected_arrival:  z.string().optional(),
  transport_mode:    z.string().default('road'),
  vehicle_no:        z.string().optional(),
  lr_no:             z.string().optional(),
  items:             z.array(z.object({
    item_id: z.string().uuid().optional(),
    name:    z.string().min(1),
    qty:     z.number().positive(),
    uom:     z.string().min(1),
    rate:    z.number().min(0).default(0),
    amount:  z.number().min(0).default(0),
    lot_no:  z.string().optional(),
    batch_no:z.string().optional(),
  })).min(1),
  notes: z.string().optional(),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  let query = supabase.from('stock_transfers')
    .select('*').eq('company_id', employee.company_id)
  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query.order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ stock_transfers: data ?? [] })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const body = await req.json()

  if (body.action && body.sto_id) {
    const update: any = { status: body.action, updated_at: new Date().toISOString() }
    if (body.action === 'dispatched') { update.dispatched_by = employee.id; update.dispatched_at = new Date().toISOString() }
    if (body.action === 'received')   { update.received_by = employee.id; update.received_at = new Date().toISOString() }

    if (body.action === 'received') {
      const { data: sto } = await supabase.from('stock_transfers').select('*').eq('id', body.sto_id).eq('company_id', employee.company_id).single()
      if (sto) {
        for (const line of sto.items as any[]) {
          if (!line.item_id) continue
          await supabase.rpc('post_stock_movement', {
            p_company_id: employee.company_id, p_item_id: line.item_id,
            p_warehouse_id: sto.from_warehouse_id, p_bin_id: sto.from_bin_id ?? null,
            p_lot_no: line.lot_no ?? null, p_batch_no: line.batch_no ?? null,
            p_movement_type: 'STO_OUT', p_movement_date: sto.transfer_date,
            p_qty: Number(line.qty), p_uom: line.uom, p_rate: Number(line.rate || 0),
            p_reference_type: 'STO', p_reference_id: sto.id, p_reference_no: sto.sto_no,
            p_narration: `STO ${sto.sto_no} — Transfer out`, p_posted_by: employee.id,
          })
          await supabase.rpc('post_stock_movement', {
            p_company_id: employee.company_id, p_item_id: line.item_id,
            p_warehouse_id: sto.to_warehouse_id, p_bin_id: sto.to_bin_id ?? null,
            p_lot_no: line.lot_no ?? null, p_batch_no: line.batch_no ?? null,
            p_movement_type: 'STO_IN', p_movement_date: sto.transfer_date,
            p_qty: Number(line.qty), p_uom: line.uom, p_rate: Number(line.rate || 0),
            p_reference_type: 'STO', p_reference_id: sto.id, p_reference_no: sto.sto_no,
            p_narration: `STO ${sto.sto_no} — Transfer in`, p_posted_by: employee.id,
          })
        }
      }
    }

    const { data, error } = await supabase.from('stock_transfers').update(update).eq('id', body.sto_id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  }

  const parsed = STOSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data: seqRow } = await supabase.rpc('next_doc_no', { p_company: employee.company_id, p_entity: 'sto', p_prefix: 'STO' })
  const d = parsed.data
  const totalValue = d.items.reduce((s, i) => s + (i.amount || i.qty * i.rate), 0)

  const { data, error } = await supabase.from('stock_transfers').insert({
    company_id: employee.company_id,
    sto_no: seqRow ?? `STO-${Date.now()}`,
    from_warehouse_id: d.from_warehouse_id, to_warehouse_id: d.to_warehouse_id,
    from_bin_id: d.from_bin_id ?? null, to_bin_id: d.to_bin_id ?? null,
    transfer_date: d.transfer_date ?? new Date().toISOString().split('T')[0],
    expected_arrival: d.expected_arrival ?? null,
    transport_mode: d.transport_mode, vehicle_no: d.vehicle_no ?? null,
    lr_no: d.lr_no ?? null, items: d.items, total_value: totalValue,
    notes: d.notes ?? null, status: 'draft', created_by: employee.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
