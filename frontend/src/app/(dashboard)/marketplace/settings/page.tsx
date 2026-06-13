// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { PageHeader, Card, Button, Input, Divider, Alert } from '@/components/ui'
import { Store, Save, Percent, Truck, Banknote } from 'lucide-react'

export default function MarketplaceSettingsPage() {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/v1/marketplace/settings').then(r => r.ok && r.json()).then(d => d && setForm(d)).catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const num = (k) => Number(form?.[k] ?? 0)

  const save = async () => {
    setSaving(true); setSaved(false)
    try {
      const res = await fetch('/api/v1/marketplace/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_name: form.store_name || undefined, store_tagline: form.store_tagline || undefined,
          currency: form.currency || 'INR',
          platform_fee_pct: num('platform_fee_pct'), payment_gateway_fee_pct: num('payment_gateway_fee_pct'),
          shipping_flat_fee: num('shipping_flat_fee'), free_shipping_threshold: num('free_shipping_threshold'),
          cod_deposit_pct: num('cod_deposit_pct'), cod_enabled: !!form.cod_enabled,
          auto_reserve_on_confirm: form.auto_reserve_on_confirm !== false,
          low_stock_hide: !!form.low_stock_hide,
        }),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    } finally { setSaving(false) }
  }

  if (!form) return <div className="py-20 text-center text-slate-400 text-sm">Loading settings…</div>

  return (
    <div className="space-y-5 animate-fadeIn max-w-3xl">
      <PageHeader title="Store Settings" description="Fees, deposits, shipping and fulfilment rules for your marketplace"
        actions={<Button size="sm" leftIcon={<Save className="h-3.5 w-3.5" />} loading={saving} onClick={save}>Save</Button>} />

      {saved && <Alert variant="success" title="Saved">Your store settings have been updated.</Alert>}

      <Card className="p-5 space-y-4">
        <Divider label="Storefront" />
        <div className="flex items-center gap-2 text-slate-400 text-xs"><Store className="h-3.5 w-3.5" /> Branding shown to buyers</div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Store name" value={form.store_name ?? ''} onChange={e => set('store_name', e.target.value)} placeholder="e.g. PRSK Marketplace" />
          <Input label="Currency" value={form.currency ?? 'INR'} onChange={e => set('currency', e.target.value)} />
        </div>
        <Input label="Tagline" value={form.store_tagline ?? ''} onChange={e => set('store_tagline', e.target.value)} placeholder="Everything your business needs, in one place" />
      </Card>

      <Card className="p-5 space-y-4">
        <Divider label="Fees & Commission" />
        <div className="flex items-center gap-2 text-slate-400 text-xs"><Percent className="h-3.5 w-3.5" /> Applied automatically at checkout</div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Platform fee / commission (%)" type="number" value={form.platform_fee_pct ?? 0} onChange={e => set('platform_fee_pct', e.target.value)} hint="Seller commission on subtotal" />
          <Input label="Payment gateway fee (%)" type="number" value={form.payment_gateway_fee_pct ?? 0} onChange={e => set('payment_gateway_fee_pct', e.target.value)} hint="For online payments" />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <Divider label="Shipping" />
        <div className="flex items-center gap-2 text-slate-400 text-xs"><Truck className="h-3.5 w-3.5" /> Buyer-facing delivery charges</div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Flat shipping fee (₹)" type="number" value={form.shipping_flat_fee ?? 0} onChange={e => set('shipping_flat_fee', e.target.value)} />
          <Input label="Free shipping above (₹)" type="number" value={form.free_shipping_threshold ?? 0} onChange={e => set('free_shipping_threshold', e.target.value)} hint="Orders over this ship free" />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <Divider label="Cash on Delivery & Deposits" />
        <div className="flex items-center gap-2 text-slate-400 text-xs"><Banknote className="h-3.5 w-3.5" /> Refundable deposit reduces COD risk</div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="COD deposit (%)" type="number" value={form.cod_deposit_pct ?? 0} onChange={e => set('cod_deposit_pct', e.target.value)} hint="Refundable, collected upfront on COD" />
        </div>
        <div className="space-y-2 pt-1">
          {[
            ['cod_enabled', 'Enable Cash on Delivery'],
            ['auto_reserve_on_confirm', 'Auto-reserve stock when an order is confirmed'],
            ['low_stock_hide', 'Hide listings automatically when out of stock'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form[key] !== false && (form[key] ?? (key !== 'low_stock_hide'))} onChange={e => set(key, e.target.checked)} className="rounded" />
              <span className="text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </Card>
    </div>
  )
}
