import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const cid = employee.company_id

  const [
    itemsRes, warehousesRes, stockRes, prRes, poRes, grnRes, importRes, ledgerRes
  ] = await Promise.allSettled([
    supabase.from('inventory_items').select('id, status, reorder_level', { count: 'exact' }).eq('company_id', cid).eq('status', 'active'),
    supabase.from('warehouses').select('id, name, type', { count: 'exact' }).eq('company_id', cid).eq('status', 'active'),
    supabase.from('stock_snapshot').select('qty_on_hand, stock_value, item_id').eq('company_id', cid),
    supabase.from('purchase_requests').select('id, status, total_estimated_value').eq('company_id', cid).in('status', ['submitted','under_review']),
    supabase.from('purchase_orders').select('id, status, total_amount, po_type').eq('company_id', cid).not('status', 'in', '("cancelled","closed")'),
    supabase.from('goods_receipts').select('id, status, inspection_status, total_received_value').eq('company_id', cid).not('status', 'in', '("posted","cancelled")'),
    supabase.from('import_shipments').select('id, status, total_landed_cost').eq('company_id', cid).not('status', 'in', '("delivered","cancelled")'),
    supabase.from('stock_ledger').select('id, movement_type, amount').eq('company_id', cid).gte('movement_date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]),
  ])

  const items     = itemsRes.status      === 'fulfilled' ? (itemsRes.value.data ?? [])      : []
  const warehouses= warehousesRes.status === 'fulfilled' ? (warehousesRes.value.data ?? []) : []
  const stock     = stockRes.status      === 'fulfilled' ? (stockRes.value.data ?? [])      : []
  const prs       = prRes.status         === 'fulfilled' ? (prRes.value.data ?? [])         : []
  const pos       = poRes.status         === 'fulfilled' ? (poRes.value.data ?? [])         : []
  const grns      = grnRes.status        === 'fulfilled' ? (grnRes.value.data ?? [])        : []
  const imports   = importRes.status     === 'fulfilled' ? (importRes.value.data ?? [])     : []
  const ledger    = ledgerRes.status     === 'fulfilled' ? (ledgerRes.value.data ?? [])     : []

  const totalInventoryValue = stock.reduce((s, r) => s + Number(r.stock_value || 0), 0)
  const totalItems          = new Set(stock.map(r => r.item_id)).size

  // 30-day inward/outward
  const inwardValue  = ledger.filter(l => ['GR','STO_IN','RETURN_IN','ADJ_PLUS'].includes(l.movement_type)).reduce((s, l) => s + Number(l.amount || 0), 0)
  const outwardValue = ledger.filter(l => ['GI','STO_OUT','SCRAP','RETURN_OUT'].includes(l.movement_type)).reduce((s, l) => s + Number(l.amount || 0), 0)

  return NextResponse.json({
    inventory: {
      total_items:            items.length,
      items_with_stock:       totalItems,
      total_value:            totalInventoryValue,
      warehouses:             warehouses.length,
    },
    alerts: {
      pending_prs:            prs.length,
      open_pos:               pos.length,
      import_pos:             pos.filter(p => p.po_type === 'import').length,
      grns_pending_qc:        grns.filter(g => g.inspection_status === 'pending').length,
      active_imports:         imports.filter(i => !['delivered','cancelled'].includes(i.status)).length,
      imports_at_customs:     imports.filter(i => i.status === 'at_customs').length,
    },
    movement_30d: {
      inward_value:  inwardValue,
      outward_value: outwardValue,
      net_change:    inwardValue - outwardValue,
      transactions:  ledger.length,
    },
    po_pipeline: {
      total:         pos.length,
      open_value:    pos.reduce((s, p) => s + Number(p.total_amount || 0), 0),
      by_status:     pos.reduce((acc: any, p) => {
        acc[p.status] = (acc[p.status] ?? 0) + 1
        return acc
      }, {}),
    },
  })
}
