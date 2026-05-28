import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { validateAsset, calculateCurrentValue, calculateGainLoss } from '@/lib/services/personal-assets'

const UpdateSchema = z.object({
  asset_name:            z.string().min(1).max(200).optional(),
  category_id:           z.string().uuid().optional().nullable(),
  asset_subcategory:     z.string().max(100).optional().nullable(),
  serial_number:         z.string().max(100).optional().nullable(),
  model_number:          z.string().max(100).optional().nullable(),
  brand:                 z.string().max(100).optional().nullable(),
  purchase_date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  purchase_price:        z.number().positive().optional(),
  salvage_value:         z.number().min(0).optional(),
  depreciation_method:   z.enum(['straight_line','declining_balance','none']).optional(),
  depreciation_rate:     z.number().min(0).max(100).optional(),
  location_id:           z.string().uuid().optional().nullable(),
  condition:             z.enum(['new','excellent','good','fair','poor','damaged']).optional(),
  acquisition_source:    z.enum(['retail','online','auction','gift','inheritance','handmade','other']).optional(),
  warranty_expiry:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  insurance_policy_number: z.string().max(100).optional().nullable(),
  insurance_value:       z.number().min(0).optional().nullable(),
  notes:                 z.string().optional().nullable(),
  tags:                  z.array(z.string()).optional(),
  photos:                z.array(z.string()).optional(),
  documents:             z.array(z.any()).optional(),
  status:                z.enum(['active','sold','disposed','lost','stolen','in_repair']).optional(),
})

const SellSchema = z.object({
  sale_price:     z.number().min(0, 'Sale price must be non-negative'),
  buyer_name:     z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  notes:          z.string().optional().nullable(),
  sale_date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(() => new Date().toISOString().split('T')[0]),
})

const DisposeSchema = z.object({
  disposal_reason: z.enum(['discarded','donated','destroyed','lost','stolen']),
  recipient:       z.string().optional().nullable(),
  notes:           z.string().optional().nullable(),
  disposal_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(() => new Date().toISOString().split('T')[0]),
})

type Params = { params: Promise<{ id: string }> }

/** GET /api/v1/personal-assets/[id] */
export async function GET(_req: Request, { params }: Params) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { id } = await params

  const { data, error } = await supabase
    .from('zasset_master')
    .select(`
      *,
      category:zasset_categories(id, category_name, default_depreciation_rate),
      location:zasset_locations(id, location_name, location_type, security_level),
      movements:zasset_movements(*, from_loc:zasset_locations!from_location(location_name), to_loc:zasset_locations!to_location(location_name)),
      valuations:zasset_valuations(*),
      sales:zasset_sales(*),
      disposals:zasset_disposals(*)
    `)
    .eq('id', id)
    .eq('employee_id', employee.id)
    .single()

  if (error) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  return NextResponse.json(data)
}

/** PUT /api/v1/personal-assets/[id] — update */
export async function PUT(req: Request, { params }: Params) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { id } = await params
  const body = await req.json()

  // Handle special actions
  if (body._action === 'sell') return handleSell(supabase, employee, id, body)
  if (body._action === 'dispose') return handleDispose(supabase, employee, id, body)
  if (body._action === 'transfer') return handleTransfer(supabase, employee, id, body)
  if (body._action === 'recalculate') return handleRecalculate(supabase, employee, id)

  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Validation failed' }, { status: 400 })
  }
  const updates = parsed.data

  // Fetch existing asset (ensures ownership)
  const { data: existing, error: fetchErr } = await supabase
    .from('zasset_master')
    .select('*')
    .eq('id', id)
    .eq('employee_id', employee.id)
    .single()
  if (fetchErr || !existing) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

  // Business rules
  const errors = validateAsset({
    asset_name: updates.asset_name ?? existing.asset_name,
    purchase_price: updates.purchase_price ?? existing.purchase_price,
    depreciation_rate: updates.depreciation_rate ?? existing.depreciation_rate,
    purchase_date: updates.purchase_date ?? existing.purchase_date,
    warranty_expiry: updates.warranty_expiry ?? existing.warranty_expiry,
    salvage_value: updates.salvage_value ?? existing.salvage_value,
  })
  if (errors.length > 0) return NextResponse.json({ error: errors[0] }, { status: 422 })

  // Duplicate serial check
  if (updates.serial_number && updates.serial_number !== existing.serial_number) {
    const { data: dupe } = await supabase
      .from('zasset_master')
      .select('id')
      .eq('employee_id', employee.id)
      .eq('serial_number', updates.serial_number)
      .neq('id', id)
      .maybeSingle()
    if (dupe) return NextResponse.json({ error: 'Serial number already in use' }, { status: 409 })
  }

  // Recalculate current_value if financial fields changed
  const priceChanged   = updates.purchase_price !== undefined
  const methodChanged  = updates.depreciation_method !== undefined
  const rateChanged    = updates.depreciation_rate !== undefined
  const salvageChanged = updates.salvage_value !== undefined
  const dateChanged    = updates.purchase_date !== undefined

  let newCurrentValue = existing.current_value
  if (priceChanged || methodChanged || rateChanged || salvageChanged || dateChanged) {
    const { currentValue } = calculateCurrentValue({
      purchasePrice:      updates.purchase_price      ?? existing.purchase_price,
      purchaseDate:       updates.purchase_date        ?? existing.purchase_date,
      depreciationMethod: updates.depreciation_method ?? existing.depreciation_method,
      depreciationRate:   updates.depreciation_rate   ?? existing.depreciation_rate,
      salvageValue:       updates.salvage_value        ?? existing.salvage_value,
    })
    newCurrentValue = currentValue
  }

  // Location change requires movement record
  if (updates.location_id !== undefined && updates.location_id !== existing.location_id) {
    await supabase.from('zasset_movements').insert({
      asset_id: id,
      movement_type: 'transfer',
      from_location: existing.location_id,
      to_location: updates.location_id,
      notes: 'Location updated',
      recorded_by: employee.id,
    })
  }

  const { data: updated, error: upErr } = await supabase
    .from('zasset_master')
    .update({ ...updates, current_value: newCurrentValue })
    .eq('id', id)
    .eq('employee_id', employee.id)
    .select()
    .single()

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

  // Audit log
  await supabase.from('zasset_audit_log').insert({
    table_name: 'zasset_master',
    record_id: id,
    action: 'UPDATE',
    old_value: existing,
    new_value: updated,
    employee_id: employee.id,
  })

  return NextResponse.json(updated)
}

/** DELETE /api/v1/personal-assets/[id] — soft delete only */
export async function DELETE(_req: Request, { params }: Params) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { id } = await params

  // Verify ownership
  const { data: existing } = await supabase
    .from('zasset_master')
    .select('id, status')
    .eq('id', id)
    .eq('employee_id', employee.id)
    .single()
  if (!existing) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

  // Business rule: cannot hard-delete — only soft delete via status
  const { error } = await supabase
    .from('zasset_master')
    .update({ status: 'disposed' })
    .eq('id', id)
    .eq('employee_id', employee.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await supabase.from('zasset_audit_log').insert({
    table_name: 'zasset_master',
    record_id: id,
    action: 'DELETE',
    old_value: existing,
    employee_id: employee.id,
  })

  return NextResponse.json({ success: true })
}

// ── Action handlers ──────────────────────────────────────────────────────────

async function handleSell(supabase: any, employee: any, id: string, body: any) {
  const parsed = SellSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })
  const { sale_price, buyer_name, payment_method, notes, sale_date } = parsed.data

  const { data: asset } = await supabase
    .from('zasset_master').select('*').eq('id', id).eq('employee_id', employee.id).single()
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  if (asset.status !== 'active') return NextResponse.json({ error: 'Only active assets can be sold' }, { status: 422 })

  const gain_loss = calculateGainLoss(asset.current_value, sale_price)

  await supabase.from('zasset_sales').insert({
    asset_id: id, sale_date, sale_price, buyer_name, payment_method, gain_loss, notes, recorded_by: employee.id,
  })
  await supabase.from('zasset_movements').insert({
    asset_id: id, movement_type: 'sale', from_location: asset.location_id,
    notes: `Sold for ₹${sale_price.toLocaleString('en-IN')}`, recorded_by: employee.id,
  })
  const { data: updated } = await supabase
    .from('zasset_master').update({ status: 'sold', current_value: sale_price }).eq('id', id).select().single()
  return NextResponse.json({ asset: updated, gain_loss })
}

async function handleDispose(supabase: any, employee: any, id: string, body: any) {
  const parsed = DisposeSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })
  const { disposal_reason, recipient, notes, disposal_date } = parsed.data

  const { data: asset } = await supabase
    .from('zasset_master').select('*').eq('id', id).eq('employee_id', employee.id).single()
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  if (asset.status !== 'active') return NextResponse.json({ error: 'Asset is not active' }, { status: 422 })

  await supabase.from('zasset_disposals').insert({
    asset_id: id, disposal_date, disposal_reason, loss_amount: asset.current_value,
    recipient, notes, recorded_by: employee.id,
  })
  await supabase.from('zasset_movements').insert({
    asset_id: id, movement_type: 'disposal', from_location: asset.location_id,
    notes: `Disposed: ${disposal_reason}`, recorded_by: employee.id,
  })
  const { data: updated } = await supabase
    .from('zasset_master').update({ status: 'disposed' }).eq('id', id).select().single()
  return NextResponse.json(updated)
}

async function handleTransfer(supabase: any, employee: any, id: string, body: any) {
  const { to_location, notes } = body
  if (!to_location) return NextResponse.json({ error: 'to_location is required' }, { status: 400 })

  const { data: asset } = await supabase
    .from('zasset_master').select('*').eq('id', id).eq('employee_id', employee.id).single()
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

  // Validate location belongs to employee
  const { data: loc } = await supabase
    .from('zasset_locations').select('id').eq('id', to_location).eq('employee_id', employee.id).single()
  if (!loc) return NextResponse.json({ error: 'Location not found' }, { status: 404 })

  await supabase.from('zasset_movements').insert({
    asset_id: id, movement_type: 'transfer',
    from_location: asset.location_id, to_location,
    notes, recorded_by: employee.id,
  })
  const { data: updated } = await supabase
    .from('zasset_master').update({ location_id: to_location }).eq('id', id).select().single()
  return NextResponse.json(updated)
}

async function handleRecalculate(supabase: any, employee: any, id: string) {
  const { data: asset } = await supabase
    .from('zasset_master').select('*').eq('id', id).eq('employee_id', employee.id).single()
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

  const { currentValue, depreciationAmount } = calculateCurrentValue({
    purchasePrice: asset.purchase_price,
    purchaseDate: asset.purchase_date,
    depreciationMethod: asset.depreciation_method,
    depreciationRate: asset.depreciation_rate,
    salvageValue: asset.salvage_value,
  })

  await supabase.from('zasset_valuations').insert({
    asset_id: id,
    valuation_date: new Date().toISOString().split('T')[0],
    old_value: asset.current_value,
    new_value: currentValue,
    depreciation_amount: depreciationAmount,
    valuation_method: asset.depreciation_method,
    notes: 'Manual recalculation',
    recorded_by: employee.id,
  })
  const { data: updated } = await supabase
    .from('zasset_master').update({ current_value: currentValue }).eq('id', id).select().single()
  return NextResponse.json(updated)
}
