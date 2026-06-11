import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { computeOrderTotals, DEFAULT_SETTINGS, type CartLineInput } from '@/lib/services/marketplace'
import { z } from 'zod'

const AddressSchema = z.object({
  name: z.string().optional(), line1: z.string().optional(), line2: z.string().optional(),
  city: z.string().optional(), state: z.string().optional(), pin: z.string().optional(),
  phone: z.string().optional(),
}).partial()

const CheckoutSchema = z.object({
  // either check out the server cart, or pass explicit lines (POS / B2B)
  from_cart:       z.boolean().default(true),
  items:           z.array(z.record(z.string(), z.any())).optional(),
  customer_id:     z.string().uuid().nullable().optional(),
  customer_name:   z.string().min(1),
  customer_email:  z.string().email().optional().or(z.literal('')),
  customer_phone:  z.string().optional(),
  channel:         z.enum(['storefront', 'pos', 'b2b', 'api']).default('storefront'),
  payment_method:  z.enum(['card', 'upi', 'netbanking', 'cod', 'wallet']).default('cod'),
  shipping_address:z.any().optional(),
  billing_address: z.any().optional(),
  discount:        z.number().min(0).default(0),
  coupon_code:     z.string().optional(),
  notes:           z.string().optional(),
})

async function loadSettings(supabase: any, companyId: string) {
  const { data } = await supabase.from('marketplace_settings').select('*').eq('company_id', companyId).maybeSingle()
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) }
}

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const payment = url.searchParams.get('payment_status')

  let query = supabase.from('marketplace_orders').select('*').eq('company_id', employee.company_id)
  if (status && status !== 'all') query = query.eq('order_status', status)
  if (payment) query = query.eq('payment_status', payment)
  const { data, error } = await query.order('placed_at', { ascending: false }).limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const orders = data ?? []
  const revenue = orders.filter(o => !['cancelled'].includes(o.order_status)).reduce((s, o) => s + Number(o.grand_total || 0), 0)
  const summary = {
    total:     orders.length,
    pending:   orders.filter(o => o.order_status === 'pending').length,
    to_ship:   orders.filter(o => ['confirmed', 'processing'].includes(o.order_status)).length,
    delivered: orders.filter(o => ['delivered', 'completed'].includes(o.order_status)).length,
    gmv:       Math.round(revenue * 100) / 100,
    units:     orders.reduce((s, o) => s + (o.items ?? []).reduce((a: number, l: any) => a + Number(l.qty || 0), 0), 0),
  }
  return NextResponse.json({ orders, summary })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const parsed = CheckoutSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  const d = parsed.data

  // 1. Resolve line items — from server cart or explicit payload
  let rawLines: CartLineInput[] = []
  let cartId: string | null = null
  if (d.from_cart) {
    const { data: cart } = await supabase
      .from('marketplace_carts').select('*')
      .eq('company_id', employee.company_id).eq('session_key', employee.id).eq('status', 'open')
      .maybeSingle()
    rawLines = (cart?.items ?? []) as CartLineInput[]
    cartId = cart?.id ?? null
  } else {
    rawLines = (d.items ?? []) as CartLineInput[]
  }
  if (!rawLines.length) return NextResponse.json({ error: 'No items to order' }, { status: 400 })

  // 2. Settings + money math
  const settings = await loadSettings(supabase, employee.company_id)
  if (d.payment_method === 'cod' && !settings.cod_enabled) {
    return NextResponse.json({ error: 'Cash on delivery is disabled for this store' }, { status: 400 })
  }
  const totals = computeOrderTotals(rawLines, settings, { paymentMethod: d.payment_method, discount: d.discount })

  // 3. Resolve / create customer
  let customerId = d.customer_id ?? null
  if (!customerId) {
    if (d.customer_email) {
      const { data: existing } = await supabase
        .from('marketplace_customers').select('id')
        .eq('company_id', employee.company_id).eq('email', d.customer_email).maybeSingle()
      customerId = existing?.id ?? null
    }
    if (!customerId) {
      const { data: created } = await supabase
        .from('marketplace_customers')
        .insert({
          company_id: employee.company_id, name: d.customer_name,
          email: d.customer_email || null, phone: d.customer_phone || null,
          type: d.channel === 'b2b' ? 'b2b' : 'b2c',
          addresses: d.shipping_address ? [d.shipping_address] : [],
        })
        .select('id').single()
      customerId = created?.id ?? null
    }
  }

  // 4. Doc number + primary warehouse
  const { data: orderNo } = await supabase.rpc('next_doc_no', { p_company: employee.company_id, p_entity: 'mkt_order', p_prefix: 'ORD' })
  const warehouseId = totals.items.find(i => i.warehouse_id)?.warehouse_id ?? null

  const paymentStatus = d.payment_method === 'cod' ? 'cod_pending' : 'unpaid'

  const { data: order, error } = await supabase
    .from('marketplace_orders')
    .insert({
      company_id: employee.company_id,
      order_no: orderNo ?? `ORD-${Date.now()}`,
      customer_id: customerId,
      customer_name: d.customer_name,
      customer_email: d.customer_email || null,
      customer_phone: d.customer_phone || null,
      channel: d.channel,
      items: totals.items,
      warehouse_id: warehouseId,
      currency: settings.currency ?? 'INR',
      subtotal: totals.subtotal,
      discount_total: totals.discount_total,
      tax_total: totals.tax_total,
      shipping_fee: totals.shipping_fee,
      platform_fee: totals.platform_fee,
      cod_deposit: totals.cod_deposit,
      grand_total: totals.grand_total,
      coupon_code: d.coupon_code ?? null,
      shipping_address: d.shipping_address ?? {},
      billing_address: d.billing_address ?? d.shipping_address ?? {},
      order_status: 'pending',
      payment_status: paymentStatus,
      payment_method: d.payment_method,
      notes: d.notes ?? null,
      created_by: employee.id,
    })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // 5. Timeline + roll up customer + close the cart
  await supabase.from('marketplace_order_events').insert({
    company_id: employee.company_id, order_id: order.id, event_type: 'placed',
    message: `Order placed via ${d.channel} · ${d.payment_method.toUpperCase()}`, actor_id: employee.id,
  })
  if (customerId) {
    const { data: cust } = await supabase
      .from('marketplace_customers').select('total_orders, total_spent').eq('id', customerId).single()
    await supabase.from('marketplace_customers').update({
      total_orders: (cust?.total_orders ?? 0) + 1,
      total_spent: Number(cust?.total_spent ?? 0) + totals.grand_total,
      updated_at: new Date().toISOString(),
    }).eq('id', customerId)
  }
  if (cartId) {
    await supabase.from('marketplace_carts').update({ status: 'converted', updated_at: new Date().toISOString() }).eq('id', cartId)
  }

  return NextResponse.json(order, { status: 201 })
}
