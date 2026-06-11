// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, Button, Input, Select, Divider, EmptyState, Badge } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { computeOrderTotals } from '@/lib/services/marketplace'
import {
  ShoppingCart, Trash2, Minus, Plus, Package, ChevronLeft, CheckCircle2, Lock,
} from 'lucide-react'

const PAYMENTS = [
  { label: 'Cash on Delivery', value: 'cod' },
  { label: 'UPI', value: 'upi' },
  { label: 'Card', value: 'card' },
  { label: 'Net Banking', value: 'netbanking' },
  { label: 'Wallet', value: 'wallet' },
]

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState({ items: [] })
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(null)
  const [payment, setPayment] = useState('cod')
  const [addr, setAddr] = useState({ name: '', phone: '', line1: '', line2: '', city: '', state: '', pin: '' })

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/v1/marketplace/cart').then(r => r.ok && r.json()),
      fetch('/api/v1/marketplace/settings').then(r => r.ok && r.json()),
    ]).then(([c, s]) => { if (c) setCart(c); if (s) setSettings(s) }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const setQty = async (line, qty) => {
    const res = await fetch('/api/v1/marketplace/cart', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: line.product_id, variant_id: line.variant_id ?? null, qty }),
    })
    if (res.ok) setCart(await res.json())
  }
  const remove = (line) => setQty(line, 0)

  const items = cart.items ?? []
  const totals = computeOrderTotals(items, settings ?? {}, { paymentMethod: payment })

  const placeOrder = async () => {
    setPlacing(true)
    try {
      const res = await fetch('/api/v1/marketplace/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_cart: true, channel: 'storefront', payment_method: payment,
          customer_name: addr.name || 'Guest Customer', customer_phone: addr.phone,
          shipping_address: addr,
        }),
      })
      if (res.ok) { setPlaced(await res.json()); setCart({ items: [] }) }
      else { const e = await res.json(); alert(e.error || 'Could not place order') }
    } finally { setPlacing(false) }
  }

  if (placed) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4 animate-fadeIn">
        <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
        <h1 className="text-xl font-bold text-slate-900">Order placed!</h1>
        <p className="text-sm text-slate-500">Your order <span className="font-mono font-semibold text-slate-700">{placed.order_no}</span> has been received.</p>
        <Card className="p-4 text-left space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-bold">{formatCurrency(placed.grand_total)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Payment</span><Badge variant="warning">{placed.payment_status}</Badge></div>
        </Card>
        <div className="flex gap-2 justify-center">
          <Link href="/marketplace/storefront"><Button variant="outline" size="sm">Continue shopping</Button></Link>
          <Link href="/marketplace/orders"><Button size="sm">View orders</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <Link href="/marketplace/storefront" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
        <ChevronLeft className="h-3.5 w-3.5" /> Continue shopping
      </Link>
      <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Your Cart</h1>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState icon={<ShoppingCart className="h-7 w-7" />} title="Your cart is empty" description="Browse the storefront and add products to get started."
          action={<Link href="/marketplace/storefront"><Button size="sm">Go to storefront</Button></Link>} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Lines */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((l, i) => (
              <Card key={i} className="p-3 flex items-center gap-3">
                <div className="h-16 w-16 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {l.image ? <img src={l.image} alt="" className="h-full w-full object-cover" /> : <Package className="h-6 w-6 text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">{l.title}</p>
                  <p className="text-[11px] text-slate-400">{l.sku ?? ''}</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{formatCurrency(l.unit_price)}</p>
                </div>
                <div className="flex items-center border border-slate-200 rounded-lg">
                  <button onClick={() => setQty(l, Math.max(1, l.qty - 1))} className="px-2 py-1.5 text-slate-500 hover:bg-slate-50"><Minus className="h-3 w-3" /></button>
                  <span className="px-3 text-sm font-medium">{l.qty}</span>
                  <button onClick={() => setQty(l, l.qty + 1)} className="px-2 py-1.5 text-slate-500 hover:bg-slate-50"><Plus className="h-3 w-3" /></button>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(l)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
              </Card>
            ))}

            <Card className="p-4 space-y-3">
              <Divider label="Delivery address" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Full name" value={addr.name} onChange={e => setAddr(a => ({ ...a, name: e.target.value }))} />
                <Input label="Phone" value={addr.phone} onChange={e => setAddr(a => ({ ...a, phone: e.target.value }))} />
              </div>
              <Input label="Address line 1" value={addr.line1} onChange={e => setAddr(a => ({ ...a, line1: e.target.value }))} />
              <Input label="Address line 2" value={addr.line2} onChange={e => setAddr(a => ({ ...a, line2: e.target.value }))} />
              <div className="grid grid-cols-3 gap-3">
                <Input label="City" value={addr.city} onChange={e => setAddr(a => ({ ...a, city: e.target.value }))} />
                <Input label="State" value={addr.state} onChange={e => setAddr(a => ({ ...a, state: e.target.value }))} />
                <Input label="PIN" value={addr.pin} onChange={e => setAddr(a => ({ ...a, pin: e.target.value }))} />
              </div>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card className="p-4 space-y-3 sticky top-4">
              <h3 className="text-sm font-semibold text-slate-800">Order Summary</h3>
              <Select label="Payment method" value={payment} onChange={e => setPayment(e.target.value)}
                options={PAYMENTS.filter(p => p.value !== 'cod' || settings?.cod_enabled !== false)} />
              <div className="space-y-1.5 text-sm pt-1">
                <Row label={`Subtotal (${items.reduce((a, l) => a + l.qty, 0)} items)`} value={formatCurrency(totals.subtotal)} />
                <Row label="Tax (GST)" value={formatCurrency(totals.tax_total)} />
                <Row label="Shipping" value={totals.shipping_fee > 0 ? formatCurrency(totals.shipping_fee) : 'FREE'} />
                {totals.cod_deposit > 0 && <Row label="COD deposit (refundable)" value={formatCurrency(totals.cod_deposit)} />}
                <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900 text-base">
                  <span>Total</span><span>{formatCurrency(totals.grand_total)}</span>
                </div>
              </div>
              <Button className="w-full" loading={placing} onClick={placeOrder} leftIcon={<Lock className="h-3.5 w-3.5" />}>Place Order</Button>
              <p className="text-[10px] text-slate-400 text-center">Stock is reserved when the seller confirms your order.</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return <div className="flex justify-between text-slate-600"><span>{label}</span><span>{value}</span></div>
}
