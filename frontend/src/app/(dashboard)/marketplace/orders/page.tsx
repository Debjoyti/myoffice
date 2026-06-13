// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, EmptyState, Divider, KV,
} from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  ShoppingBag, RefreshCw, IndianRupee, Boxes, Truck, CheckCircle2,
  Package, MapPin, Clock, XCircle,
} from 'lucide-react'

const ORDER_BADGE = {
  pending: 'warning', confirmed: 'info', processing: 'info', shipped: 'info',
  delivered: 'success', completed: 'success', cancelled: 'danger', returned: 'neutral',
}
const PAY_BADGE = { paid: 'success', unpaid: 'neutral', cod_pending: 'warning', refunded: 'danger', partial: 'warning' }
const NEXT_ACTIONS = {
  pending:    [{ to: 'confirmed', label: 'Confirm & Reserve' }, { to: 'cancelled', label: 'Cancel', variant: 'outline' }],
  confirmed:  [{ to: 'processing', label: 'Mark Processing' }, { to: 'cancelled', label: 'Cancel', variant: 'outline' }],
  processing: [{ to: 'shipped', label: 'Ship (issue stock)' }, { to: 'cancelled', label: 'Cancel', variant: 'outline' }],
  shipped:    [{ to: 'delivered', label: 'Mark Delivered' }],
  delivered:  [{ to: 'completed', label: 'Complete' }],
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const [acting, setActing] = useState(false)
  const [ship, setShip] = useState({ carrier: '', tracking_no: '' })

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tab !== 'all') params.set('status', tab)
      const res = await fetch(`/api/v1/marketplace/orders?${params}`)
      if (res.ok) { const d = await res.json(); setOrders(d.orders ?? []); setSummary(d.summary ?? {}) }
    } finally { setLoading(false) }
  }, [tab])
  useEffect(() => { fetch_() }, [fetch_])

  const openDetail = async (o) => {
    setDetail({ ...o, events: [] })
    const res = await fetch(`/api/v1/marketplace/orders/${o.id}`)
    if (res.ok) setDetail(await res.json())
  }

  const transition = async (to) => {
    if (to === 'cancelled' && !confirm('Cancel this order? Reserved stock will be released.')) return
    setActing(true)
    try {
      const body = { to_status: to }
      if (to === 'shipped') { body.carrier = ship.carrier; body.tracking_no = ship.tracking_no }
      if (to === 'cancelled') body.cancel_reason = prompt('Cancellation reason (optional)') ?? ''
      const res = await fetch(`/api/v1/marketplace/orders/${detail.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (res.ok) { await openDetail(await res.json()); fetch_() }
      else { const e = await res.json(); alert(e.error || 'Action failed') }
    } finally { setActing(false) }
  }

  const markPaid = async () => {
    setActing(true)
    try {
      const res = await fetch(`/api/v1/marketplace/orders/${detail.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_status: 'paid' }),
      })
      if (res.ok) { await openDetail(await res.json()); fetch_() }
    } finally { setActing(false) }
  }

  const displayed = orders.filter(o =>
    !search || o.order_no?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader title="Orders" description="Fulfil orders end-to-end — stock is reserved on confirm and issued on ship" />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label="GMV" value={formatCurrency(summary.gmv ?? 0)} icon={<IndianRupee className="h-4 w-4" />} accent="emerald" />
        <StatCard label="Orders" value={(summary.total ?? 0).toString()} icon={<ShoppingBag className="h-4 w-4" />} accent="blue" />
        <StatCard label="Pending" value={(summary.pending ?? 0).toString()} icon={<Clock className="h-4 w-4" />} accent="amber" />
        <StatCard label="To Ship" value={(summary.to_ship ?? 0).toString()} icon={<Truck className="h-4 w-4" />} accent="violet" />
        <StatCard label="Delivered" value={(summary.delivered ?? 0).toString()} icon={<CheckCircle2 className="h-4 w-4" />} accent="emerald" />
      </div>

      <TabBar
        tabs={[
          { id: 'all', label: 'All' }, { id: 'pending', label: 'Pending' },
          { id: 'confirmed', label: 'Confirmed' }, { id: 'processing', label: 'Processing' },
          { id: 'shipped', label: 'Shipped' }, { id: 'delivered', label: 'Delivered' },
          { id: 'cancelled', label: 'Cancelled' },
        ]}
        active={tab} onChange={setTab} />

      <Card padding="none">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
          <SearchInput placeholder="Search order # or customer..." value={search} onChange={setSearch} className="w-72" />
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetch_} className="ml-auto">Refresh</Button>
        </div>
        {!loading && displayed.length === 0 ? (
          <EmptyState icon={<ShoppingBag className="h-7 w-7" />} title="No orders yet" description="Orders placed from the storefront will appear here." />
        ) : (
          <Table>
            <Thead><tr>
              <Th>Order #</Th><Th>Customer</Th><Th>Date</Th><Th align="right">Items</Th>
              <Th align="right">Total</Th><Th>Payment</Th><Th>Status</Th><Th></Th>
            </tr></Thead>
            <Tbody>
              {loading ? <Tr><td colSpan={8} className="py-12 text-center text-slate-400 text-sm">Loading…</td></Tr>
              : displayed.map(o => (
                <Tr key={o.id} onClick={() => openDetail(o)} className="cursor-pointer">
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{o.order_no}</span></Td>
                  <Td><div><p className="font-medium text-slate-800">{o.customer_name}</p><p className="text-[10px] text-slate-400">{o.channel}</p></div></Td>
                  <Td><span className="text-xs text-slate-500">{formatDate(o.placed_at)}</span></Td>
                  <Td align="right"><span className="text-slate-600">{(o.items ?? []).reduce((a, l) => a + Number(l.qty || 0), 0)}</span></Td>
                  <Td align="right"><span className="font-semibold">{formatCurrency(o.grand_total)}</span></Td>
                  <Td><Badge variant={PAY_BADGE[o.payment_status] ?? 'neutral'}>{o.payment_status}</Badge></Td>
                  <Td><Badge variant={ORDER_BADGE[o.order_status] ?? 'neutral'}>{o.order_status}</Badge></Td>
                  <Td><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDetail(o) }}>View</Button></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Order detail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} size="lg"
        title={detail ? `Order ${detail.order_no}` : ''}>
        {detail && (
          <div className="space-y-4 max-h-[74vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-2">
              <Badge variant={ORDER_BADGE[detail.order_status] ?? 'neutral'}>{detail.order_status}</Badge>
              <Badge variant={PAY_BADGE[detail.payment_status] ?? 'neutral'}>{detail.payment_status}</Badge>
              <span className="text-xs text-slate-400 ml-auto">{formatDate(detail.placed_at)}</span>
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg">
              {(NEXT_ACTIONS[detail.order_status] ?? []).map(a => (
                <Button key={a.to} size="sm" variant={a.variant ?? 'default'} loading={acting} onClick={() => transition(a.to)}>
                  {a.label}
                </Button>
              ))}
              {detail.payment_status !== 'paid' && detail.order_status !== 'cancelled' && (
                <Button size="sm" variant="outline" loading={acting} onClick={markPaid}>Mark Paid</Button>
              )}
              {(NEXT_ACTIONS[detail.order_status] ?? []).length === 0 && detail.payment_status === 'paid' && (
                <span className="text-xs text-slate-400 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> No further actions</span>
              )}
            </div>

            {/* Ship details input when processing */}
            {detail.order_status === 'processing' && (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Carrier" value={ship.carrier} onChange={e => setShip(s => ({ ...s, carrier: e.target.value }))} placeholder="e.g. Bluedart" />
                <Input label="Tracking #" value={ship.tracking_no} onChange={e => setShip(s => ({ ...s, tracking_no: e.target.value }))} />
              </div>
            )}

            <Divider label="Items" />
            <div className="space-y-2">
              {(detail.items ?? []).map((l, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="h-9 w-9 rounded bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {l.image ? <img src={l.image} alt="" className="h-full w-full object-cover" /> : <Package className="h-4 w-4 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{l.title}</p>
                    <p className="text-[10px] text-slate-400">{l.sku ?? ''} · {l.qty} × {formatCurrency(l.unit_price)}</p>
                  </div>
                  <span className="font-semibold text-slate-700">{formatCurrency(l.line_total ?? l.qty * l.unit_price)}</span>
                </div>
              ))}
            </div>

            <Divider label="Payment Summary" />
            <div className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatCurrency(detail.subtotal)} />
              {detail.discount_total > 0 && <Row label="Discount" value={`− ${formatCurrency(detail.discount_total)}`} />}
              <Row label="Tax (GST)" value={formatCurrency(detail.tax_total)} />
              <Row label="Shipping" value={detail.shipping_fee > 0 ? formatCurrency(detail.shipping_fee) : 'FREE'} />
              {detail.platform_fee > 0 && <Row label="Platform fee" value={formatCurrency(detail.platform_fee)} muted />}
              {detail.cod_deposit > 0 && <Row label="COD deposit (refundable)" value={formatCurrency(detail.cod_deposit)} />}
              <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900">
                <span>Grand Total</span><span>{formatCurrency(detail.grand_total)}</span>
              </div>
            </div>

            <Divider label="Customer & Shipping" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <KV label="Customer" value={detail.customer_name} />
              <KV label="Contact" value={detail.customer_phone || detail.customer_email || '—'} />
              <KV label="Payment" value={(detail.payment_method ?? '—').toUpperCase()} />
              <KV label="Channel" value={detail.channel} />
            </div>
            {detail.shipping_address?.line1 && (
              <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-3">
                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                <span>{[detail.shipping_address.line1, detail.shipping_address.line2, detail.shipping_address.city, detail.shipping_address.state, detail.shipping_address.pin].filter(Boolean).join(', ')}</span>
              </div>
            )}

            {detail.events?.length > 0 && (<>
              <Divider label="Timeline" />
              <div className="space-y-2">
                {detail.events.map(ev => (
                  <div key={ev.id} className="flex items-start gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <div><p className="text-slate-700">{ev.message}</p><p className="text-[10px] text-slate-400">{formatDate(ev.created_at)}</p></div>
                  </div>
                ))}
              </div>
            </>)}
          </div>
        )}
      </Modal>
    </div>
  )
}

function Row({ label, value, muted }) {
  return <div className={`flex justify-between ${muted ? 'text-slate-400' : 'text-slate-600'}`}><span>{label}</span><span>{value}</span></div>
}
