import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED = new Set(['admin', 'accountant', 'manager'])
type RouteParams = { params: Promise<{ id: string }> }

const EDITABLE = new Set([
  'title', 'brand', 'short_desc', 'description', 'category_id', 'item_id', 'warehouse_id',
  'sku', 'currency', 'mrp', 'price', 'sale_price', 'gst_rate', 'bullet_points', 'images',
  'attributes', 'tags', 'weight_kg', 'is_cod_available', 'is_returnable', 'return_window_days',
  'handling_days', 'is_featured', 'is_prime', 'status',
])

export async function GET(_req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const { id } = await params

  const { data: product, error } = await supabase
    .from('marketplace_products')
    .select('*')
    .eq('id', id)
    .eq('company_id', employee.company_id)
    .single()
  if (error || !product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // live stock
  let stock = { qty_on_hand: 0, qty_reserved: 0, qty_available: 0 }
  if (product.item_id) {
    const { data: snap } = await supabase
      .from('stock_snapshot')
      .select('qty_on_hand, qty_reserved')
      .eq('company_id', employee.company_id)
      .eq('item_id', product.item_id)
    for (const s of snap ?? []) {
      stock.qty_on_hand  += Number(s.qty_on_hand) || 0
      stock.qty_reserved += Number(s.qty_reserved) || 0
    }
    stock.qty_available = stock.qty_on_hand - stock.qty_reserved
  }

  const [{ data: variants }, { data: reviews }, { data: category }] = await Promise.all([
    supabase.from('marketplace_product_variants').select('*').eq('product_id', id).order('sort_order'),
    supabase.from('marketplace_reviews').select('*').eq('product_id', id).eq('status', 'published').order('created_at', { ascending: false }).limit(50),
    product.category_id
      ? supabase.from('marketplace_categories').select('id, name, slug').eq('id', product.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return NextResponse.json({ ...product, ...stock, variants: variants ?? [], reviews: reviews ?? [], category: category ?? null })
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const { id } = await params

  const body = await req.json() as Record<string, unknown>
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of Object.keys(body)) if (EDITABLE.has(k)) update[k] = body[k]

  if (update.status === 'active') {
    const { data: existing } = await supabase
      .from('marketplace_products').select('published_at').eq('id', id).single()
    if (existing && !existing.published_at) update.published_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('marketplace_products')
    .update(update)
    .eq('id', id)
    .eq('company_id', employee.company_id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const { id } = await params

  // soft-delete: archive so order history stays intact
  const { error } = await supabase
    .from('marketplace_products')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', employee.company_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, archived: true })
}
