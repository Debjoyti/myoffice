import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

/**
 * Buyer-facing catalog feed for the storefront. Returns only ACTIVE,
 * in-stock-aware listings plus the category nav. Read-only for any role.
 */
export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const url = new URL(req.url)
  const category = url.searchParams.get('category')   // category id
  const search   = url.searchParams.get('q')
  const sort     = url.searchParams.get('sort') ?? 'relevance'

  let query = supabase
    .from('marketplace_products')
    .select('id, title, slug, brand, short_desc, images, category_id, sku, item_id, mrp, price, sale_price, gst_rate, is_prime, is_featured, rating_avg, rating_count, units_sold')
    .eq('company_id', employee.company_id)
    .eq('status', 'active')

  if (category) query = query.eq('category_id', category)
  if (search)   query = query.or(`title.ilike.%${search}%,brand.ilike.%${search}%,short_desc.ilike.%${search}%`)

  if (sort === 'price_asc')  query = query.order('price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('price', { ascending: false })
  else if (sort === 'rating') query = query.order('rating_avg', { ascending: false })
  else if (sort === 'newest') query = query.order('published_at', { ascending: false })
  else query = query.order('is_featured', { ascending: false }).order('units_sold', { ascending: false })

  const { data, error } = await query.limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // live availability
  const itemIds = (data ?? []).map(p => p.item_id).filter(Boolean) as string[]
  const stockMap: Record<string, number> = {}
  if (itemIds.length) {
    const { data: snap } = await supabase
      .from('stock_snapshot')
      .select('item_id, qty_on_hand, qty_reserved')
      .eq('company_id', employee.company_id)
      .in('item_id', itemIds)
    for (const s of snap ?? []) {
      stockMap[s.item_id] = (stockMap[s.item_id] ?? 0) + ((Number(s.qty_on_hand) || 0) - (Number(s.qty_reserved) || 0))
    }
  }

  const products = (data ?? []).map(p => {
    const avail = p.item_id ? (stockMap[p.item_id] ?? 0) : null
    const sale = p.sale_price != null && Number(p.sale_price) > 0
    const sell = sale ? Number(p.sale_price) : Number(p.price)
    const discount_pct = Number(p.mrp) > 0 && sell < Number(p.mrp)
      ? Math.round((1 - sell / Number(p.mrp)) * 100) : 0
    return { ...p, sell_price: sell, discount_pct, qty_available: avail, in_stock: avail == null ? true : avail > 0 }
  })

  const { data: categories } = await supabase
    .from('marketplace_categories')
    .select('id, name, slug, icon, image_url, is_featured')
    .eq('company_id', employee.company_id)
    .eq('status', 'active')
    .order('sort_order')

  const { data: settings } = await supabase
    .from('marketplace_settings').select('store_name, store_tagline, free_shipping_threshold, cod_enabled, currency')
    .eq('company_id', employee.company_id).maybeSingle()

  return NextResponse.json({ products, categories: categories ?? [], settings: settings ?? null })
}
