import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const GILineSchema = z.object({
  item_id:  z.string().uuid().optional(),
  name:     z.string().min(1),
  qty:      z.number().positive(),
  uom:      z.string().min(1),
  rate:     z.number().min(0).default(0),
  amount:   z.number().min(0).default(0),
  bin_id:   z.string().uuid().optional(),
  lot_no:   z.string().optional(),
  batch_no: z.string().optional(),
})

const GISchema = z.object({
  issue_type:        z.enum(['production','sales_delivery','project','cost_center','sample','scrap','return_to_vendor']),
  reference_type:    z.string().optional(),
  reference_no:      z.string().optional(),
  issue_date:        z.string().optional(),
  from_warehouse_id: z.string().uuid(),
  from_bin_id:       z.string().uuid().optional(),
  department:        z.string().optional(),
  issued_to:         z.string().optional(),
  items:             z.array(GILineSchema).min(1),
  notes:             z.string().optional(),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  let query = supabase
    .from('goods_issues')
    .select('id, gi_no, issue_type, reference_no, issue_date, from_warehouse_id, department, issued_to, items, total_value, status, posted_at, created_at')
    .eq('company_id', employee.company_id)

  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query.order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ goods_issues: data ?? [] })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!['admin', 'accountant', 'manager'].includes(employee.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const body = await req.json()

  if (body.action === 'post' && body.gi_id) {
    const { data: gi } = await supabase.from('goods_issues').select('*').eq('id', body.gi_id).eq('company_id', employee.company_id).single()
    if (!gi) return NextResponse.json({ error: 'GI not found' }, { status: 404 })
    if (gi.status === 'posted') return NextResponse.json({ error: 'Already posted' }, { status: 409 })

    for (const line of gi.items as any[]) {
      const qty = Number(line.qty)
      if (qty <= 0 || !line.item_id) continue
      await supabase.rpc('post_stock_movement', {
        p_company_id: employee.company_id, p_item_id: line.item_id,
        p_warehouse_id: gi.from_warehouse_id, p_bin_id: line.bin_id ?? null,
        p_lot_no: line.lot_no ?? null, p_batch_no: line.batch_no ?? null,
        p_movement_type: 'GI', p_movement_date: gi.issue_date,
        p_qty: qty, p_uom: line.uom, p_rate: Number(line.rate || 0),
        p_reference_type: 'GI', p_reference_id: gi.id, p_reference_no: gi.gi_no,
        p_narration: `GI ${gi.gi_no} for ${gi.issue_type} ${gi.reference_no ?? ''}`,
        p_posted_by: employee.id,
      })
    }

    const { data, error } = await supabase.from('goods_issues')
      .update({ status: 'posted', posted_by: employee.id, posted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', body.gi_id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  }

  const parsed = GISchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data: seqRow } = await supabase.rpc('next_doc_no', { p_company: employee.company_id, p_entity: 'gi', p_prefix: 'GI' })
  const d = parsed.data
  const totalValue = d.items.reduce((s, i) => s + (i.amount || i.qty * i.rate), 0)

  const { data, error } = await supabase.from('goods_issues').insert({
    company_id: employee.company_id,
    gi_no: seqRow ?? `GI-${Date.now()}`,
    issue_type: d.issue_type, reference_no: d.reference_no ?? null,
    issue_date: d.issue_date ?? new Date().toISOString().split('T')[0],
    from_warehouse_id: d.from_warehouse_id,
    department: d.department ?? employee.department,
    issued_to: d.issued_to ?? null,
    items: d.items, total_value: totalValue,
    notes: d.notes ?? null,
    status: body.post ? 'approved' : 'draft',
    created_by: employee.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
