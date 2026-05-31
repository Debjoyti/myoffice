import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const ImportSchema = z.object({
  po_id:               z.string().uuid().optional(),
  po_no:               z.string().optional(),
  supplier_name:       z.string().min(1),
  supplier_country:    z.string().min(1),
  incoterms:           z.string().optional(),
  currency:            z.string().default('USD'),
  invoice_no_foreign:  z.string().optional(),
  invoice_value_foreign:z.number().min(0).optional(),
  exchange_rate:       z.number().positive().default(84),
  // Shipping
  vessel_name:         z.string().optional(),
  bl_no:               z.string().optional(),
  awb_no:              z.string().optional(),
  container_no:        z.string().optional(),
  container_size:      z.string().optional(),
  transport_mode:      z.enum(['sea','air','road','rail']).default('sea'),
  port_of_loading:     z.string().optional(),
  port_of_discharge:   z.string().default('INNSA'),
  etd:                 z.string().optional(),
  eta:                 z.string().optional(),
  // Customs
  customs_duty:        z.number().min(0).default(0),
  igst_on_import:      z.number().min(0).default(0),
  social_welfare_surcharge: z.number().min(0).default(0),
  custom_cess:         z.number().min(0).default(0),
  // Charges
  freight_charges:     z.number().min(0).default(0),
  insurance:           z.number().min(0).default(0),
  cha_charges:         z.number().min(0).default(0),
  port_charges:        z.number().min(0).default(0),
  other_charges:       z.number().min(0).default(0),
  delivery_warehouse_id: z.string().uuid().optional(),
  notes:               z.string().optional(),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const url    = new URL(req.url)
  const status = url.searchParams.get('status')

  let query = supabase
    .from('import_shipments')
    .select('*')
    .eq('company_id', employee.company_id)

  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query.order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const shipments = data ?? []

  // Compute total landed cost for those without it
  const enriched = shipments.map(s => ({
    ...s,
    total_landed_cost: s.total_landed_cost ?? (
      Number(s.invoice_value_foreign ?? 0) * Number(s.exchange_rate ?? 1) +
      Number(s.customs_duty ?? 0) +
      Number(s.igst_on_import ?? 0) +
      Number(s.social_welfare_surcharge ?? 0) +
      Number(s.freight_charges ?? 0) +
      Number(s.insurance ?? 0) +
      Number(s.cha_charges ?? 0) +
      Number(s.port_charges ?? 0) +
      Number(s.other_charges ?? 0)
    ),
  }))

  const summary = {
    total:          enriched.length,
    in_transit:     enriched.filter(s => s.status === 'shipped').length,
    at_customs:     enriched.filter(s => s.status === 'at_customs').length,
    cleared:        enriched.filter(s => s.status === 'customs_cleared').length,
    delivered:      enriched.filter(s => s.status === 'delivered').length,
    total_value_usd:enriched.reduce((s, imp) => s + Number(imp.invoice_value_foreign ?? 0), 0),
    total_duty:     enriched.reduce((s, imp) => s + Number(imp.customs_duty ?? 0) + Number(imp.igst_on_import ?? 0), 0),
  }

  return NextResponse.json({ shipments: enriched, summary })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!['admin', 'accountant', 'manager'].includes(employee.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const body = await req.json()

  // Status update
  if (body.action && body.shipment_id) {
    const validStatuses = ['shipped','at_port','at_customs','customs_cleared','in_transit','delivered','cancelled']
    if (!validStatuses.includes(body.action)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const update: any = {
      status:     body.action,
      updated_at: new Date().toISOString(),
    }
    if (body.action === 'delivered' && body.ata) update.ata = body.ata
    if (body.be_no) { update.be_no = body.be_no; update.be_date = body.be_date }

    const { data, error } = await supabase
      .from('import_shipments')
      .update(update)
      .eq('id', body.shipment_id)
      .eq('company_id', employee.company_id)
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  }

  const parsed = ImportSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data: seqRow } = await supabase.rpc('next_doc_no', {
    p_company: employee.company_id,
    p_entity:  'import',
    p_prefix:  'IMP',
  })

  const d = parsed.data
  const invoiceINR = (d.invoice_value_foreign ?? 0) * d.exchange_rate
  const totalLanded = invoiceINR + d.customs_duty + d.igst_on_import +
    d.social_welfare_surcharge + d.freight_charges + d.insurance +
    d.cha_charges + d.port_charges + d.other_charges

  const { data, error } = await supabase
    .from('import_shipments')
    .insert({
      company_id:            employee.company_id,
      shipment_no:           seqRow ?? `IMP-${Date.now()}`,
      po_id:                 d.po_id ?? null,
      po_no:                 d.po_no ?? null,
      supplier_name:         d.supplier_name,
      supplier_country:      d.supplier_country,
      incoterms:             d.incoterms ?? null,
      currency:              d.currency,
      invoice_no_foreign:    d.invoice_no_foreign ?? null,
      invoice_value_foreign: d.invoice_value_foreign ?? null,
      exchange_rate:         d.exchange_rate,
      invoice_value_inr:     invoiceINR,
      vessel_name:           d.vessel_name ?? null,
      bl_no:                 d.bl_no ?? null,
      awb_no:                d.awb_no ?? null,
      container_no:          d.container_no ?? null,
      container_size:        d.container_size ?? null,
      transport_mode:        d.transport_mode,
      port_of_loading:       d.port_of_loading ?? null,
      port_of_discharge:     d.port_of_discharge,
      etd:                   d.etd ?? null,
      eta:                   d.eta ?? null,
      customs_duty:          d.customs_duty,
      igst_on_import:        d.igst_on_import,
      social_welfare_surcharge: d.social_welfare_surcharge,
      freight_charges:       d.freight_charges,
      insurance:             d.insurance,
      cha_charges:           d.cha_charges,
      port_charges:          d.port_charges,
      other_charges:         d.other_charges,
      total_landed_cost:     totalLanded,
      delivery_warehouse_id: d.delivery_warehouse_id ?? null,
      notes:                 d.notes ?? null,
      status:                'ordered',
      created_by:            employee.id,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
