import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

/** Cross-domain executive summary — one headline metric set per system. */
export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const cid = employee.company_id
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString()
  const today = new Date().toISOString().slice(0, 10)

  const val = (r: PromiseSettledResult<any>) => (r.status === 'fulfilled' ? r.value : null)

  const empR = await supabase.from('employees').select('id, status').eq('company_id', cid)
  const employees = empR.data ?? []
  const empIds = employees.map((e: any) => e.id)
  const activeEmp = employees.filter((e: any) => e.status === 'active').length

  const [ordersR, snapR, itemsR, leadsR, payR, invR, attR, prodR] = await Promise.allSettled([
    supabase.from('marketplace_orders').select('grand_total, order_status, placed_at').eq('company_id', cid).gte('placed_at', since30),
    supabase.from('stock_snapshot').select('stock_value').eq('company_id', cid),
    supabase.from('inventory_items').select('id', { count: 'exact', head: true }).eq('company_id', cid).eq('status', 'active'),
    supabase.from('leads').select('status, value').eq('company_id', cid),
    supabase.from('payments').select('amount, payment_date').eq('company_id', cid).gte('payment_date', since30.slice(0, 10)),
    supabase.from('invoices').select('total_amount, status').eq('company_id', cid),
    empIds.length ? supabase.from('attendance_sessions').select('employee_id', { count: 'exact', head: true }).eq('date', today).in('employee_id', empIds) : Promise.resolve({ count: 0 }),
    supabase.from('marketplace_products').select('id', { count: 'exact', head: true }).eq('company_id', cid).eq('status', 'active'),
  ])

  const orders = val(ordersR)?.data ?? []
  const validOrders = orders.filter((o: any) => o.order_status !== 'cancelled')
  const gmv = validOrders.reduce((s: number, o: any) => s + Number(o.grand_total || 0), 0)

  const snaps = val(snapR)?.data ?? []
  const stockValue = snaps.reduce((s: number, x: any) => s + Number(x.stock_value || 0), 0)

  const leads = val(leadsR)?.data ?? []
  const openLeads = leads.filter((l: any) => !['won', 'lost'].includes((l.status || '').toLowerCase()))
  const pipeline = openLeads.reduce((s: number, l: any) => s + Number(l.value || 0), 0)

  const payments = val(payR)?.data ?? []
  const collected = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)

  const invoices = val(invR)?.data ?? []
  const outstanding = invoices.filter((i: any) => ['sent', 'partial', 'overdue'].includes(i.status)).reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)

  const presentToday = (val(attR) as any)?.count ?? 0
  const activeListings = (val(prodR) as any)?.count ?? 0
  const activeItems = (val(itemsR) as any)?.count ?? 0

  // revenue sparkline (last 30d daily, commerce + collections)
  const byDay: Record<string, number> = {}
  for (const o of validOrders) { const k = new Date(o.placed_at).toISOString().slice(0, 10); byDay[k] = (byDay[k] ?? 0) + Number(o.grand_total || 0) }
  for (const p of payments) { const k = String(p.payment_date).slice(0, 10); byDay[k] = (byDay[k] ?? 0) + Number(p.amount || 0) }
  const days: string[] = []
  for (let i = 29; i >= 0; i--) days.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10))
  const revenue_spark = days.map(d => Math.round(byDay[d] ?? 0))

  return NextResponse.json({
    headline: {
      total_revenue_30d: Math.round(gmv + collected),
      gmv_30d: Math.round(gmv),
      collected_30d: Math.round(collected),
      headcount: activeEmp,
      stock_value: Math.round(stockValue),
      open_orders: orders.filter((o: any) => ['pending', 'confirmed', 'processing'].includes(o.order_status)).length,
    },
    revenue_spark,
    systems: {
      commerce:  { gmv_30d: Math.round(gmv), orders_30d: orders.length, active_listings: activeListings },
      inventory: { stock_value: Math.round(stockValue), active_items: activeItems },
      hr:        { headcount: activeEmp, present_today: presentToday, attendance_rate: activeEmp ? Math.round((presentToday / activeEmp) * 100) : 0 },
      crm:       { open_leads: openLeads.length, pipeline_value: Math.round(pipeline) },
      finance:   { collected_30d: Math.round(collected), outstanding: Math.round(outstanding) },
    },
  })
}
