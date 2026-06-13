/**
 * Marketplace service layer — pure business logic shared by the commerce
 * API routes. Keeps money math in one tested place (CLAUDE.md rule #5).
 *
 * Pricing model:
 *   line.unit_price   = sale_price ?? price   (per unit, tax-exclusive)
 *   line.line_subtotal= unit_price * qty
 *   line.line_tax     = line_subtotal * gst_rate/100
 *   order.subtotal    = Σ line_subtotal
 *   order.tax_total   = Σ line_tax
 *   shipping_fee      = 0 when subtotal >= free_shipping_threshold else flat
 *   platform_fee      = subtotal * platform_fee_pct/100   (seller commission)
 *   cod_deposit       = (subtotal+tax) * cod_deposit_pct/100  (COD only, refundable)
 *   grand_total       = subtotal + tax_total + shipping_fee + cod_deposit - discount_total
 */

export type MarketplaceSettings = {
  platform_fee_pct: number
  payment_gateway_fee_pct: number
  shipping_flat_fee: number
  free_shipping_threshold: number
  cod_deposit_pct: number
  cod_enabled: boolean
}

export const DEFAULT_SETTINGS: MarketplaceSettings = {
  platform_fee_pct: 0,
  payment_gateway_fee_pct: 2,
  shipping_flat_fee: 49,
  free_shipping_threshold: 999,
  cod_deposit_pct: 0,
  cod_enabled: true,
}

export type CartLineInput = {
  product_id: string
  variant_id?: string | null
  item_id?: string | null
  warehouse_id?: string | null
  sku?: string | null
  title: string
  image?: string | null
  qty: number
  unit_price: number
  uom?: string
  gst_rate?: number
}

export type PricedLine = CartLineInput & {
  uom: string
  gst_rate: number
  line_subtotal: number
  line_tax: number
  line_total: number
  fulfilled_qty: number
}

export type OrderTotals = {
  items: PricedLine[]
  subtotal: number
  tax_total: number
  shipping_fee: number
  platform_fee: number
  cod_deposit: number
  discount_total: number
  grand_total: number
}

const round2 = (n: number) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

/** Price a single cart line (tax-exclusive unit price → line totals). */
export function priceLine(line: CartLineInput): PricedLine {
  const qty = Math.max(0, Number(line.qty) || 0)
  const unit = Math.max(0, Number(line.unit_price) || 0)
  const gst = Number(line.gst_rate ?? 18)
  const subtotal = round2(unit * qty)
  const tax = round2(subtotal * (gst / 100))
  return {
    ...line,
    uom: line.uom || 'PCS',
    gst_rate: gst,
    qty,
    unit_price: unit,
    line_subtotal: subtotal,
    line_tax: tax,
    line_total: round2(subtotal + tax),
    fulfilled_qty: 0,
  }
}

/**
 * Compute the full order money breakdown from cart lines + settings.
 * `paymentMethod` drives the COD deposit; `discount` is an absolute amount.
 */
export function computeOrderTotals(
  lines: CartLineInput[],
  settings: Partial<MarketplaceSettings> = {},
  opts: { paymentMethod?: string; discount?: number } = {}
): OrderTotals {
  const s = { ...DEFAULT_SETTINGS, ...settings }
  const items = lines.map(priceLine).filter(l => l.qty > 0)

  const subtotal = round2(items.reduce((a, l) => a + l.line_subtotal, 0))
  const tax_total = round2(items.reduce((a, l) => a + l.line_tax, 0))
  const discount_total = round2(Math.min(Number(opts.discount) || 0, subtotal))

  const shipping_fee =
    subtotal <= 0 || subtotal >= s.free_shipping_threshold ? 0 : round2(s.shipping_flat_fee)

  const platform_fee = round2(subtotal * (s.platform_fee_pct / 100))

  const isCod = opts.paymentMethod === 'cod'
  const cod_deposit = isCod ? round2((subtotal + tax_total) * (s.cod_deposit_pct / 100)) : 0

  const grand_total = round2(
    subtotal + tax_total + shipping_fee + cod_deposit - discount_total
  )

  return { items, subtotal, tax_total, shipping_fee, platform_fee, cod_deposit, discount_total, grand_total }
}

/** A URL-safe slug from arbitrary text (title / category name). */
export function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || `item-${Date.now()}`
}

/** Effective sell price for a product/variant (sale overrides regular). */
export function effectivePrice(p: { price?: number; sale_price?: number | null }): number {
  const sale = p.sale_price
  return sale != null && Number(sale) > 0 ? Number(sale) : Number(p.price ?? 0)
}

/** Allowed order-status transitions for the seller console. */
export const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered', 'returned'],
  delivered:  ['completed', 'returned'],
  completed:  ['returned'],
  cancelled:  [],
  returned:   [],
}

export function canTransition(from: string, to: string): boolean {
  return (ORDER_TRANSITIONS[from] ?? []).includes(to)
}
