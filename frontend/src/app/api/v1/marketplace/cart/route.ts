import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { effectivePrice } from '@/lib/services/marketplace'

/**
 * Server-side cart, keyed by the signed-in user (session_key = employee.id).
 * GET    → current open cart
 * POST   → add an item   { product_id, variant_id?, qty }
 * PATCH  → set line qty  { product_id, variant_id?, qty }   (qty 0 removes)
 * DELETE → clear cart  (or ?product_id=… to remove one line)
 */

type Line = {
  product_id: string; variant_id?: string | null; item_id?: string | null
  warehouse_id?: string | null; sku?: string | null; title: string; image?: string | null
  qty: number; unit_price: number; gst_rate: number; uom: string
}

async function getOrCreateCart(supabase: any, companyId: string, sessionKey: string) {
  const { data: existing } = await supabase
    .from('marketplace_carts')
    .select('*')
    .eq('company_id', companyId)
    .eq('session_key', sessionKey)
    .eq('status', 'open')
    .maybeSingle()
  if (existing) return existing
  const { data: created } = await supabase
    .from('marketplace_carts')
    .insert({ company_id: companyId, session_key: sessionKey, items: [] })
    .select()
    .single()
  return created
}

function summarize(items: Line[]) {
  const count = items.reduce((a, l) => a + Number(l.qty || 0), 0)
  const subtotal = items.reduce((a, l) => a + Number(l.unit_price || 0) * Number(l.qty || 0), 0)
  return { item_count: count, subtotal: Math.round(subtotal * 100) / 100 }
}

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const cart = await getOrCreateCart(supabase, employee.company_id, employee.id)
  return NextResponse.json({ ...cart, ...summarize(cart.items ?? []) })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const body = await req.json()
  const productId = body.product_id as string
  const qty = Math.max(1, Number(body.qty) || 1)
  if (!productId) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

  const { data: product } = await supabase
    .from('marketplace_products')
    .select('id, title, images, price, sale_price, gst_rate, item_id, warehouse_id, sku, status')
    .eq('id', productId)
    .eq('company_id', employee.company_id)
    .single()
  if (!product || product.status !== 'active') {
    return NextResponse.json({ error: 'Product unavailable' }, { status: 404 })
  }

  let variant: any = null
  if (body.variant_id) {
    const { data: v } = await supabase
      .from('marketplace_product_variants')
      .select('*').eq('id', body.variant_id).eq('product_id', productId).maybeSingle()
    variant = v
  }

  const cart = await getOrCreateCart(supabase, employee.company_id, employee.id)
  const items: Line[] = cart.items ?? []
  const key = (l: Line) => `${l.product_id}:${l.variant_id ?? ''}`
  const newLine: Line = {
    product_id: product.id,
    variant_id: variant?.id ?? null,
    item_id: variant?.item_id ?? product.item_id ?? null,
    warehouse_id: product.warehouse_id ?? null,
    sku: variant?.sku ?? product.sku ?? null,
    title: variant ? `${product.title} — ${variant.title}` : product.title,
    image: variant?.image_url ?? product.images?.[0]?.url ?? null,
    qty,
    unit_price: variant
      ? effectivePrice({ price: variant.price ?? product.price, sale_price: variant.sale_price })
      : effectivePrice(product),
    gst_rate: Number(product.gst_rate ?? 18),
    uom: 'PCS',
  }

  const idx = items.findIndex(l => key(l) === key(newLine))
  if (idx >= 0) items[idx].qty += qty
  else items.push(newLine)

  const { data, error } = await supabase
    .from('marketplace_carts')
    .update({ items, updated_at: new Date().toISOString() })
    .eq('id', cart.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ...data, ...summarize(data.items) })
}

export async function PATCH(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const body = await req.json()
  const qty = Math.max(0, Number(body.qty) || 0)
  const cart = await getOrCreateCart(supabase, employee.company_id, employee.id)
  let items: Line[] = cart.items ?? []
  const matches = (l: Line) => l.product_id === body.product_id && (l.variant_id ?? null) === (body.variant_id ?? null)
  if (qty === 0) items = items.filter(l => !matches(l))
  else items = items.map(l => matches(l) ? { ...l, qty } : l)

  const { data, error } = await supabase
    .from('marketplace_carts')
    .update({ items, updated_at: new Date().toISOString() })
    .eq('id', cart.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ...data, ...summarize(data.items) })
}

export async function DELETE(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const productId = new URL(req.url).searchParams.get('product_id')
  const cart = await getOrCreateCart(supabase, employee.company_id, employee.id)
  const items: Line[] = productId ? (cart.items ?? []).filter((l: Line) => l.product_id !== productId) : []

  const { data, error } = await supabase
    .from('marketplace_carts')
    .update({ items, updated_at: new Date().toISOString() })
    .eq('id', cart.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ...data, ...summarize(data.items) })
}
