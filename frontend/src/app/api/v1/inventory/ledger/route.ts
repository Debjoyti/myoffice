import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const url       = new URL(req.url)
  const item_id   = url.searchParams.get('item_id')
  const wh_id     = url.searchParams.get('warehouse_id')
  const from_date = url.searchParams.get('from')
  const to_date   = url.searchParams.get('to')
  const mov_type  = url.searchParams.get('movement_type')
  const ref_type  = url.searchParams.get('reference_type')
  const limit     = Math.min(Number(url.searchParams.get('limit') ?? 200), 500)

  let query = supabase
    .from('stock_ledger')
    .select(`
      id, item_id, warehouse_id, bin_id, lot_no, batch_no,
      movement_type, movement_date, qty, uom, rate, amount, balance_qty,
      reference_type, reference_no, narration, posted_at, is_cancelled,
      inventory_items(sku, name),
      warehouses(code, name)
    `)
    .eq('company_id', employee.company_id)
    .eq('is_cancelled', false)

  if (item_id)   query = query.eq('item_id', item_id)
  if (wh_id)     query = query.eq('warehouse_id', wh_id)
  if (mov_type)  query = query.eq('movement_type', mov_type)
  if (ref_type)  query = query.eq('reference_type', ref_type)
  if (from_date) query = query.gte('movement_date', from_date)
  if (to_date)   query = query.lte('movement_date', to_date)

  const { data, error } = await query
    .order('posted_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const entries = data ?? []

  // Movement type summary
  const summary: Record<string, { count: number; total_qty: number; total_value: number }> = {}
  for (const e of entries) {
    if (!summary[e.movement_type]) summary[e.movement_type] = { count: 0, total_qty: 0, total_value: 0 }
    summary[e.movement_type].count++
    summary[e.movement_type].total_qty   += Number(e.qty || 0)
    summary[e.movement_type].total_value += Number(e.amount || 0)
  }

  return NextResponse.json({ ledger: entries, summary, count: entries.length })
}
