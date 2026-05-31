import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const ALLOWED = new Set(['admin', 'accountant', 'manager'])

const WarehouseSchema = z.object({
  code:           z.string().min(1),
  name:           z.string().min(1),
  type:           z.enum(['general','raw_material','finished_goods','bonded','transit','quarantine']).default('general'),
  address:        z.string().optional(),
  city:           z.string().optional(),
  state:          z.string().optional(),
  pin_code:       z.string().optional(),
  country:        z.string().default('India'),
  gstin:          z.string().optional(),
  area_sqft:      z.number().min(0).optional(),
  has_bin_mgmt:   z.boolean().default(false),
  is_bonded:      z.boolean().default(false),
  temp_controlled:z.boolean().default(false),
  temp_min_c:     z.number().optional(),
  temp_max_c:     z.number().optional(),
})

const BinSchema = z.object({
  warehouse_id: z.string().uuid(),
  bin_code:     z.string().min(1),
  zone:         z.string().optional(),
  aisle:        z.string().optional(),
  rack:         z.string().optional(),
  level:        z.string().optional(),
  bin_type:     z.enum(['storage','receiving','dispatch','staging','quarantine','rejection']).default('storage'),
  capacity_units: z.number().int().optional(),
  max_weight_kg:  z.number().optional(),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const url = new URL(req.url)
  const include_bins = url.searchParams.get('include_bins') === 'true'
  const warehouse_id = url.searchParams.get('warehouse_id')

  if (warehouse_id && include_bins) {
    // Return bins for a specific warehouse
    const { data, error } = await supabase
      .from('warehouse_bins')
      .select('*')
      .eq('warehouse_id', warehouse_id)
      .eq('company_id', employee.company_id)
      .order('bin_code')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ bins: data ?? [] })
  }

  const { data: warehouses, error } = await supabase
    .from('warehouses')
    .select('*')
    .eq('company_id', employee.company_id)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with stock totals per warehouse
  const warehouseIds = (warehouses ?? []).map(w => w.id)
  let stockTotals: any[] = []
  if (warehouseIds.length > 0) {
    const { data: snap } = await supabase
      .from('stock_snapshot')
      .select('warehouse_id, qty_on_hand, stock_value')
      .eq('company_id', employee.company_id)
      .in('warehouse_id', warehouseIds)
    stockTotals = snap ?? []
  }

  const stockMap: Record<string, { items: Set<string>; value: number; qty: number }> = {}
  for (const s of stockTotals) {
    if (!stockMap[s.warehouse_id]) stockMap[s.warehouse_id] = { items: new Set(), value: 0, qty: 0 }
    stockMap[s.warehouse_id].value += Number(s.stock_value) || 0
    stockMap[s.warehouse_id].qty   += Number(s.qty_on_hand) || 0
  }

  const enriched = (warehouses ?? []).map(w => ({
    ...w,
    stock_value:  stockMap[w.id]?.value ?? 0,
    total_qty:    stockMap[w.id]?.qty ?? 0,
  }))

  return NextResponse.json({ warehouses: enriched })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!ALLOWED.has(employee.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const body = await req.json()

  if (body.type === 'bin') {
    const parsed = BinSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

    const { data, error } = await supabase
      .from('warehouse_bins')
      .insert({ ...parsed.data, company_id: employee.company_id })
      .select().single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Bin code already exists in this warehouse' }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(data, { status: 201 })
  }

  const parsed = WarehouseSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('warehouses')
    .insert({ ...parsed.data, company_id: employee.company_id })
    .select().single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Warehouse code already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data, { status: 201 })
}
