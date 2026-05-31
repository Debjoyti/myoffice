import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const ALLOWED = new Set(['admin', 'accountant', 'manager'])

const ItemSchema = z.object({
  sku:              z.string().min(1),
  name:             z.string().min(1),
  description:      z.string().optional(),
  category:         z.string().min(1),
  sub_category:     z.string().optional(),
  item_type:        z.enum(['domestic', 'imported', 'both']).default('domestic'),
  uom:              z.string().min(1),
  secondary_uom:    z.string().optional(),
  uom_conversion:   z.number().positive().default(1),
  hsn_code:         z.string().optional(),
  gst_rate:         z.number().min(0).max(100).default(18),
  valuation_method: z.enum(['fifo', 'moving_avg', 'standard_cost']).default('moving_avg'),
  standard_cost:    z.number().min(0).default(0),
  reorder_level:    z.number().min(0).default(0),
  reorder_qty:      z.number().min(0).default(0),
  safety_stock:     z.number().min(0).default(0),
  max_stock:        z.number().min(0).default(0),
  lead_time_days:   z.number().int().min(0).default(7),
  lot_controlled:   z.boolean().default(false),
  batch_controlled: z.boolean().default(false),
  shelf_life_days:  z.number().int().optional(),
  weight_kg:        z.number().min(0).optional(),
  country_of_origin:z.string().optional(),
  customs_tariff:   z.string().optional(),
  status:           z.enum(['active', 'inactive', 'obsolete', 'under_review']).default('active'),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const url = new URL(req.url)
  const category = url.searchParams.get('category')
  const type = url.searchParams.get('type')
  const status = url.searchParams.get('status') ?? 'active'
  const search = url.searchParams.get('q')
  const low_stock = url.searchParams.get('low_stock') === 'true'

  let query = supabase
    .from('inventory_items')
    .select(`
      id, sku, name, description, category, sub_category, item_type,
      uom, hsn_code, gst_rate, valuation_method, standard_cost, current_cost,
      reorder_level, reorder_qty, safety_stock, lead_time_days,
      lot_controlled, batch_controlled, status, country_of_origin, customs_tariff,
      created_at
    `)
    .eq('company_id', employee.company_id)

  if (status !== 'all') query = query.eq('status', status)
  if (category)         query = query.eq('category', category)
  if (type)             query = query.eq('item_type', type)
  if (search)           query = query.ilike('name', `%${search}%`)
  if (low_stock)        query = query.lt('reorder_level', 0)  // placeholder — join with snapshot

  const { data, error } = await query.order('name').limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with stock snapshot totals
  const itemIds = (data ?? []).map(i => i.id)
  let snapshots: any[] = []
  if (itemIds.length > 0) {
    const { data: snap } = await supabase
      .from('stock_snapshot')
      .select('item_id, qty_on_hand, qty_reserved, stock_value, warehouse_id')
      .eq('company_id', employee.company_id)
      .in('item_id', itemIds)
    snapshots = snap ?? []
  }

  const stockMap: Record<string, { qty: number; value: number; reserved: number }> = {}
  for (const s of snapshots) {
    if (!stockMap[s.item_id]) stockMap[s.item_id] = { qty: 0, value: 0, reserved: 0 }
    stockMap[s.item_id].qty     += Number(s.qty_on_hand) || 0
    stockMap[s.item_id].value   += Number(s.stock_value) || 0
    stockMap[s.item_id].reserved+= Number(s.qty_reserved) || 0
  }

  const items = (data ?? []).map(item => ({
    ...item,
    qty_on_hand:    stockMap[item.id]?.qty ?? 0,
    qty_reserved:   stockMap[item.id]?.reserved ?? 0,
    qty_available:  (stockMap[item.id]?.qty ?? 0) - (stockMap[item.id]?.reserved ?? 0),
    stock_value:    stockMap[item.id]?.value ?? 0,
    is_low_stock:   stockMap[item.id] ? (stockMap[item.id].qty <= Number(item.reorder_level)) : false,
  }))

  const summary = {
    total_items:   items.length,
    total_value:   items.reduce((s, i) => s + i.stock_value, 0),
    low_stock:     items.filter(i => i.is_low_stock && Number(i.reorder_level) > 0).length,
    out_of_stock:  items.filter(i => i.qty_on_hand === 0).length,
    imported_items:items.filter(i => i.item_type !== 'domestic').length,
  }

  return NextResponse.json({ items, summary })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!ALLOWED.has(employee.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = ItemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({ ...parsed.data, company_id: employee.company_id, created_by: employee.id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'SKU already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
