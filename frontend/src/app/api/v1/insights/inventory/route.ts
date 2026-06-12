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

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const range = new URL(req.url).searchParams.get('range') ?? '30d'
  const sinceDate = rangeStart(range).toISOString().slice(0, 10)
  const cid = employee.company_id

  const [itemsR, snapR, ledgerR, poR, prR, grnR, whR] = await Promise.allSettled([
    supabase.from('inventory_items').select('id, sku, name, category, status, current_cost, reorder_level').eq('company_id', cid),
    supabase.from('stock_snapshot').select('item_id, warehouse_id, qty_on_hand, qty_reserved, stock_value').eq('company_id', cid),
    supabase.from('stock_ledger').select('movement_type, movement_date, qty, amount').eq('company_id', cid).gte('movement_date', sinceDate).limit(5000),
    supabase.from('purchase_orders').select('status, total_amount, po_date').eq('company_id', cid),
    supabase.from('purchase_requests').select('status').eq('company_id', cid),
    supabase.from('goods_receipts').select('status, receipt_date, total_received_value').eq('company_id', cid),
    supabase.from('warehouses').select('id, name, code').eq('company_id', cid),
  ])

  const items  = itemsR.status === 'fulfilled' ? (itemsR.value.data ?? []) : []
  const snaps  = snapR.status === 'fulfilled' ? (snapR.value.data ?? []) : []
  const ledger = ledgerR.status === 'fulfilled' ? (ledgerR.value.data ?? []) : []
  const pos    = poR.status === 'fulfilled' ? (poR.value.data ?? []) : []
  const prs    = prR.status === 'fulfilled' ? (prR.value.data ?? []) : []
  const grns   = grnR.status === 'fulfilled' ? (grnR.value.data ?? []) : []
  const whs    = whR.status === 'fulfilled' ? (whR.value.data ?? []) : []

  // stock rollups
  const onHandByItem: Record<string, number> = {}
  const valueByItem: Record<string, number> = {}
  const valueByWh: Record<string, number> = {}
  let totalValue = 0
  for (const s of snaps) {
    onHandByItem[s.item_id] = (onHandByItem[s.item_id] ?? 0) + (Number(s.qty_on_hand) || 0)
    valueByItem[s.item_id] = (valueByItem[s.item_id] ?? 0) + (Number(s.stock_value) || 0)
    valueByWh[s.warehouse_id] = (valueByWh[s.warehouse_id] ?? 0) + (Number(s.stock_value) || 0)
    totalValue += Number(s.stock_value) || 0
  }

  const lowStock = items.filter((i: any) => Number(i.reorder_level) > 0 && (onHandByItem[i.id] ?? 0) <= Number(i.reorder_level)).length
  const outOfStock = items.filter((i: any) => (onHandByItem[i.id] ?? 0) <= 0).length

  // category value donut
  const catValue: Record<string, number> = {}
  for (const i of items) catValue[i.category || 'Other'] = (catValue[i.category || 'Other'] ?? 0) + (valueByItem[i.id] ?? 0)

  // movement (in vs out) by day + totals
  const IN = new Set(['GR', 'STO_IN', 'ADJ_PLUS', 'RETURN_IN', 'OPENING', 'TRANSFER_IN'])
  const moveByDay: Record<string, { in: number; out: number }> = {}
  let inflowQty = 0, outflowQty = 0, inflowVal = 0, outflowVal = 0
  for (const m of ledger) {
    const k = m.movement_date
    if (!moveByDay[k]) moveByDay[k] = { in: 0, out: 0 }
    const q = Number(m.qty || 0), amt = Number(m.amount || 0)
    if (IN.has(m.movement_type)) { moveByDay[k].in += q; inflowQty += q; inflowVal += amt }
    else { moveByDay[k].out += q; outflowQty += q; outflowVal += amt }
  }
  const movement = Object.entries(moveByDay).sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, inbound: Math.round(v.in), outbound: Math.round(v.out) }))

  // warehouse value bars
  const whBars = whs.map((w: any) => ({ label: w.code || w.name, value: Math.round(valueByWh[w.id] ?? 0) }))
    .sort((a, b) => b.value - a.value).slice(0, 8)

  // top items by stock value
  const topItems = items.slice().map((i: any) => ({ name: i.name, sku: i.sku, value: valueByItem[i.id] ?? 0, qty: onHandByItem[i.id] ?? 0 }))
    .sort((a, b) => b.value - a.value).slice(0, 6)
    .map(i => ({ label: i.name, value: `₹${Math.round(i.value).toLocaleString('en-IN')}`, bar: i.value, sub: `${i.sku} · ${i.qty} on hand` }))

  return NextResponse.json({
    range,
    kpis: {
      total_skus: items.length, stock_value: Math.round(totalValue),
      low_stock: lowStock, out_of_stock: outOfStock,
      warehouses: whs.length,
      inflow_qty: Math.round(inflowQty), outflow_qty: Math.round(outflowQty),
      inflow_value: Math.round(inflowVal), outflow_value: Math.round(outflowVal),
      open_pos: pos.filter((p: any) => ['approved', 'sent_to_vendor', 'acknowledged', 'partially_received'].includes(p.status)).length,
      po_value: Math.round(pos.reduce((s: number, p: any) => s + Number(p.total_amount || 0), 0)),
      pending_prs: prs.filter((p: any) => ['submitted', 'under_review', 'approved'].includes(p.status)).length,
      grns_received: grns.length,
    },
    movement,
    category_value: Object.entries(catValue).filter(([, v]) => v > 0).map(([label, value]) => ({ label, value: Math.round(value as number) })),
    warehouse_value: whBars,
    top_items: topItems,
  })
}
