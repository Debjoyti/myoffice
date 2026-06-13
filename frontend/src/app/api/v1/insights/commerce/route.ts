import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED = new Set(['admin', 'accountant', 'manager', 'hr'])

function rangeStart(range: string): Date {
  const d = new Date()
  if (range === '7d') d.setDate(d.getDate() - 7)
  else if (range === '90d') d.setDate(d.getDate() - 90)
  else if (range === '12m') d.setMonth(d.getMonth() - 12)
  else d.setDate(d.getDate() - 30)
  return d
}
const dayKey = (s: string) => new Date(s).toISOString().slice(0, 10)

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const range = new URL(req.url).searchParams.get('range') ?? '30d'
  const since = rangeStart(range).toISOString()
  const cid = employee.company_id

  const [ordersR, productsR, customersR] = await Promise.allSettled([
    supabase.from('marketplace_orders')
      .select('order_no, order_status, payment_status, payment_method, grand_total, subtotal, platform_fee, items, placed_at, customer_name, channel')
      .eq('company_id', cid).gte('placed_at', since).order('placed_at', { ascending: false }).limit(2000),
    supabase.from('marketplace_products')
      .select('id, title, status, units_sold, rating_avg, price, sale_price, images, created_at, item_id')
      .eq('company_id', cid),
    supabase.from('marketplace_customers')
      .select('id, name, total_orders, total_spent, created_at').eq('company_id', cid),
  ])

  const orders   = ordersR.status === 'fulfilled' ? (ordersR.value.data ?? []) : []
  const products = productsR.status === 'fulfilled' ? (productsR.value.data ?? []) : []
  const customers= customersR.status === 'fulfilled' ? (customersR.value.data ?? []) : []

  const valid = orders.filter((o: any) => o.order_status !== 'cancelled')
  const gmv = valid.reduce((s: number, o: any) => s + Number(o.grand_total || 0), 0)
  const units = valid.reduce((s: number, o: any) => s + (o.items ?? []).reduce((a: number, l: any) => a + Number(l.qty || 0), 0), 0)
  const commission = valid.reduce((s: number, o: any) => s + Number(o.platform_fee || 0), 0)

  // revenue + orders by day
  const byDay: Record<string, { rev: number; cnt: number }> = {}
  for (const o of valid) {
    const k = dayKey(o.placed_at)
    if (!byDay[k]) byDay[k] = { rev: 0, cnt: 0 }
    byDay[k].rev += Number(o.grand_total || 0); byDay[k].cnt += 1
  }
  const trend = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, revenue: Math.round(v.rev), orders: v.cnt }))

  // status + payment breakdown
  const statusCount: Record<string, number> = {}
  const payCount: Record<string, number> = {}
  for (const o of orders) {
    statusCount[o.order_status] = (statusCount[o.order_status] ?? 0) + 1
    payCount[o.payment_method || 'unknown'] = (payCount[o.payment_method || 'unknown'] ?? 0) + 1
  }

  const newCustomers = customers.filter((c: any) => new Date(c.created_at).toISOString() >= since).length
  const newListings = products.filter((p: any) => new Date(p.created_at).toISOString() >= since).length

  const topProducts = products.slice().sort((a: any, b: any) => Number(b.units_sold) - Number(a.units_sold)).slice(0, 6)
    .map((p: any) => ({ label: p.title, value: `${p.units_sold} sold`, bar: Number(p.units_sold), img: p.images?.[0]?.url ?? null }))

  const recent = orders.slice(0, 12).map((o: any) => ({
    order_no: o.order_no, customer: o.customer_name, status: o.order_status,
    payment: o.payment_status, total: Number(o.grand_total || 0), placed_at: o.placed_at,
  }))

  return NextResponse.json({
    range,
    kpis: {
      gmv: Math.round(gmv), orders: orders.length, valid_orders: valid.length, units,
      aov: valid.length ? Math.round(gmv / valid.length) : 0, commission: Math.round(commission),
      active_listings: products.filter((p: any) => p.status === 'active').length,
      new_listings: newListings, new_customers: newCustomers,
      total_customers: customers.length,
      pending: orders.filter((o: any) => o.order_status === 'pending').length,
      to_ship: orders.filter((o: any) => ['confirmed', 'processing'].includes(o.order_status)).length,
    },
    trend,
    status_breakdown: Object.entries(statusCount).map(([label, value]) => ({ label, value })),
    payment_breakdown: Object.entries(payCount).map(([label, value]) => ({ label, value })),
    top_products: topProducts,
    recent_orders: recent,
  })
}
