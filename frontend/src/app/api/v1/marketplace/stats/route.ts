import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

/** Seller-center dashboard metrics: GMV, orders, units, top products, sales trend. */
export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const companyId = employee.company_id

  const [{ data: orders }, { data: products }] = await Promise.all([
    supabase.from('marketplace_orders')
      .select('order_status, payment_status, grand_total, subtotal, platform_fee, items, placed_at')
      .eq('company_id', companyId).order('placed_at', { ascending: false }).limit(1000),
    supabase.from('marketplace_products')
      .select('id, title, price, sale_price, units_sold, rating_avg, status, images, item_id')
      .eq('company_id', companyId),
  ])

  const valid = (orders ?? []).filter(o => o.order_status !== 'cancelled')
  const gmv = valid.reduce((s, o) => s + Number(o.grand_total || 0), 0)
  const commission = valid.reduce((s, o) => s + Number(o.platform_fee || 0), 0)
  const units = valid.reduce((s, o) => s + (o.items ?? []).reduce((a: number, l: any) => a + Number(l.qty || 0), 0), 0)

  // last-30-day sales trend (by day)
  const trend: Record<string, number> = {}
  const cutoff = Date.now() - 30 * 86400000
  for (const o of valid) {
    const t = new Date(o.placed_at).getTime()
    if (t < cutoff) continue
    const day = new Date(o.placed_at).toISOString().slice(0, 10)
    trend[day] = (trend[day] ?? 0) + Number(o.grand_total || 0)
  }
  const sales_trend = Object.entries(trend).sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({ date, total: Math.round(total * 100) / 100 }))

  const top_products = (products ?? [])
    .slice()
    .sort((a, b) => Number(b.units_sold) - Number(a.units_sold))
    .slice(0, 5)
    .map(p => ({ id: p.id, title: p.title, units_sold: p.units_sold, rating_avg: p.rating_avg, image: p.images?.[0]?.url ?? null }))

  // low-stock listings (linked items at/below reorder)
  const itemIds = (products ?? []).map(p => p.item_id).filter(Boolean) as string[]
  let low_stock = 0
  if (itemIds.length) {
    const { data: snap } = await supabase
      .from('stock_snapshot').select('item_id, qty_on_hand, qty_reserved')
      .eq('company_id', companyId).in('item_id', itemIds)
    const avail: Record<string, number> = {}
    for (const s of snap ?? []) avail[s.item_id] = (avail[s.item_id] ?? 0) + ((Number(s.qty_on_hand) || 0) - (Number(s.qty_reserved) || 0))
    low_stock = itemIds.filter(id => (avail[id] ?? 0) <= 0).length
  }

  return NextResponse.json({
    kpis: {
      gmv: Math.round(gmv * 100) / 100,
      orders: (orders ?? []).length,
      valid_orders: valid.length,
      units_sold: units,
      commission: Math.round(commission * 100) / 100,
      avg_order_value: valid.length ? Math.round((gmv / valid.length) * 100) / 100 : 0,
      active_listings: (products ?? []).filter(p => p.status === 'active').length,
      pending_orders: (orders ?? []).filter(o => o.order_status === 'pending').length,
      to_ship: (orders ?? []).filter(o => ['confirmed', 'processing'].includes(o.order_status)).length,
      low_stock,
    },
    sales_trend,
    top_products,
  })
}
