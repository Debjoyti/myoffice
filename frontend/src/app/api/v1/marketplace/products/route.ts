import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { slugify } from '@/lib/services/marketplace'
import { z } from 'zod'

const ALLOWED = new Set(['admin', 'accountant', 'manager'])

const ImageSchema = z.object({ url: z.string(), alt: z.string().optional(), is_primary: z.boolean().optional() })

const ProductSchema = z.object({
  title:        z.string().min(1),
  brand:        z.string().optional(),
  short_desc:   z.string().optional(),
  description:  z.string().optional(),
  category_id:  z.string().uuid().nullable().optional(),
  // inventory linkage
  item_id:      z.string().uuid().nullable().optional(),
  warehouse_id: z.string().uuid().nullable().optional(),
  sku:          z.string().optional(),
  // when no item_id is given but create_item is true, spin up an inventory_item
  create_item:  z.boolean().optional(),
  // pricing
  currency:     z.string().default('INR'),
  mrp:          z.number().min(0).default(0),
  price:        z.number().min(0).default(0),
  sale_price:   z.number().min(0).nullable().optional(),
  gst_rate:     z.number().min(0).max(100).default(18),
  // content
  bullet_points:z.array(z.string()).default([]),
  images:       z.array(ImageSchema).default([]),
  attributes:   z.record(z.string(), z.any()).default({}),
  tags:         z.array(z.string()).default([]),
  // logistics
  weight_kg:        z.number().min(0).optional(),
  is_cod_available: z.boolean().default(true),
  is_returnable:    z.boolean().default(true),
  return_window_days: z.number().int().min(0).default(7),
  handling_days:    z.number().int().min(0).default(1),
  // merchandising
  is_featured:  z.boolean().default(false),
  is_prime:     z.boolean().default(false),
  status:       z.enum(['draft', 'active', 'inactive', 'archived']).default('draft'),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const url = new URL(req.url)
  const status   = url.searchParams.get('status') ?? 'all'
  const category = url.searchParams.get('category')
  const search   = url.searchParams.get('q')
  const featured = url.searchParams.get('featured') === 'true'

  let query = supabase
    .from('marketplace_products')
    .select('*')
    .eq('company_id', employee.company_id)

  if (status !== 'all') query = query.eq('status', status)
  if (category)         query = query.eq('category_id', category)
  if (featured)         query = query.eq('is_featured', true)
  if (search)           query = query.or(`title.ilike.%${search}%,brand.ilike.%${search}%,sku.ilike.%${search}%`)

  const { data, error } = await query.order('created_at', { ascending: false }).limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // enrich with live stock from snapshot
  const itemIds = (data ?? []).map(p => p.item_id).filter(Boolean) as string[]
  const stockMap: Record<string, { on_hand: number; reserved: number }> = {}
  if (itemIds.length) {
    const { data: snap } = await supabase
      .from('stock_snapshot')
      .select('item_id, qty_on_hand, qty_reserved')
      .eq('company_id', employee.company_id)
      .in('item_id', itemIds)
    for (const s of snap ?? []) {
      if (!stockMap[s.item_id]) stockMap[s.item_id] = { on_hand: 0, reserved: 0 }
      stockMap[s.item_id].on_hand  += Number(s.qty_on_hand) || 0
      stockMap[s.item_id].reserved += Number(s.qty_reserved) || 0
    }
  }

  const products = (data ?? []).map(p => {
    const st = p.item_id ? stockMap[p.item_id] : undefined
    const available = st ? st.on_hand - st.reserved : null
    return {
      ...p,
      qty_on_hand:  st?.on_hand ?? null,
      qty_reserved: st?.reserved ?? null,
      qty_available: available,
      in_stock: available == null ? true : available > 0,
    }
  })

  const summary = {
    total:     products.length,
    active:    products.filter(p => p.status === 'active').length,
    draft:     products.filter(p => p.status === 'draft').length,
    out_of_stock: products.filter(p => !p.in_stock).length,
    catalog_value: products.reduce((s, p) => s + (Number(p.price) || 0) * (p.qty_on_hand ?? 0), 0),
  }
  return NextResponse.json({ products, summary })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!ALLOWED.has(employee.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const parsed = ProductSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  const d = parsed.data

  let itemId = d.item_id ?? null
  let sku = d.sku ?? null

  // Optionally create a backing inventory item so stock is tracked end-to-end.
  if (!itemId && d.create_item) {
    const genSku = sku || `MKT-${slugify(d.title).toUpperCase().replace(/-/g, '').slice(0, 8)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`
    const { data: item, error: itemErr } = await supabase
      .from('inventory_items')
      .insert({
        company_id: employee.company_id,
        sku: genSku,
        name: d.title,
        description: d.short_desc ?? d.description ?? null,
        category: 'Finished Goods',
        item_type: 'domestic',
        uom: 'PCS',
        hsn_code: null,
        gst_rate: d.gst_rate,
        standard_cost: 0,
        status: 'active',
        image_url: d.images?.[0]?.url ?? null,
        created_by: employee.id,
      })
      .select('id, sku')
      .single()
    if (itemErr && itemErr.code !== '23505') {
      return NextResponse.json({ error: `Could not create inventory item: ${itemErr.message}` }, { status: 400 })
    }
    if (item) { itemId = item.id; sku = item.sku }
  }

  // mirror sku from the linked item when not provided
  if (itemId && !sku) {
    const { data: it } = await supabase.from('inventory_items').select('sku').eq('id', itemId).single()
    sku = it?.sku ?? null
  }

  const slug = slugify(d.title) + '-' + Math.random().toString(36).slice(2, 6)
  const { create_item, ...fields } = d

  const { data, error } = await supabase
    .from('marketplace_products')
    .insert({
      ...fields,
      slug,
      sku,
      item_id: itemId,
      company_id: employee.company_id,
      created_by: employee.id,
      published_at: d.status === 'active' ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data, { status: 201 })
}
