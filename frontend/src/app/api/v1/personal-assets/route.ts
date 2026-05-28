import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { validateAsset, calculateCurrentValue, generateAssetId, DEFAULT_CATEGORIES } from '@/lib/services/personal-assets'

const AssetSchema = z.object({
  asset_name:            z.string().min(1, 'Asset name required').max(200),
  category_id:           z.string().uuid().optional().nullable(),
  asset_subcategory:     z.string().max(100).optional().nullable(),
  serial_number:         z.string().max(100).optional().nullable(),
  model_number:          z.string().max(100).optional().nullable(),
  brand:                 z.string().max(100).optional().nullable(),
  purchase_date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  purchase_price:        z.number().positive('Purchase price must be positive'),
  salvage_value:         z.number().min(0).default(0),
  depreciation_method:   z.enum(['straight_line', 'declining_balance', 'none']).default('straight_line'),
  depreciation_rate:     z.number().min(0).max(100).default(10),
  location_id:           z.string().uuid().optional().nullable(),
  condition:             z.enum(['new','excellent','good','fair','poor','damaged']).default('good'),
  acquisition_source:    z.enum(['retail','online','auction','gift','inheritance','handmade','other']).default('retail'),
  warranty_expiry:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  insurance_policy_number: z.string().max(100).optional().nullable(),
  insurance_value:       z.number().min(0).optional().nullable(),
  notes:                 z.string().optional().nullable(),
  tags:                  z.array(z.string()).default([]),
})

/** GET /api/v1/personal-assets — list with filters */
export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { searchParams } = new URL(req.url)
  const status    = searchParams.get('status')
  const category  = searchParams.get('category')
  const location  = searchParams.get('location')
  const search    = searchParams.get('search')
  const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize  = 50
  const offset    = (page - 1) * pageSize

  // Ensure seed categories exist for this company
  await ensureSeedCategories(supabase, employee.company_id)

  let query = supabase
    .from('zasset_master')
    .select(`
      *,
      category:zasset_categories(id, category_name, default_depreciation_rate),
      location:zasset_locations(id, location_name, location_type)
    `, { count: 'exact' })
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (status)   query = query.eq('status', status)
  if (category) query = query.eq('category_id', category)
  if (location) query = query.eq('location_id', location)
  if (search) {
    query = query.or(
      `asset_name.ilike.%${search}%,brand.ilike.%${search}%,serial_number.ilike.%${search}%,model_number.ilike.%${search}%`
    )
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Portfolio summary
  const active = (data ?? []).filter(a => a.status === 'active')
  const portfolioValue = active.reduce((s, a) => s + Number(a.current_value), 0)

  return NextResponse.json({
    assets: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    portfolioValue,
  })
}

/** POST /api/v1/personal-assets — create new asset */
export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const body = await req.json()
  const parsed = AssetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Validation failed' }, { status: 400 })
  }
  const data = parsed.data

  // Business rule validations
  const errors = validateAsset({
    asset_name: data.asset_name,
    purchase_price: data.purchase_price,
    depreciation_rate: data.depreciation_rate,
    purchase_date: data.purchase_date,
    warranty_expiry: data.warranty_expiry ?? undefined,
    salvage_value: data.salvage_value,
  })
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0] }, { status: 422 })
  }

  // Duplicate serial check
  if (data.serial_number) {
    const { data: existing } = await supabase
      .from('zasset_master')
      .select('id')
      .eq('employee_id', employee.id)
      .eq('serial_number', data.serial_number)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'An asset with this serial number already exists' }, { status: 409 })
    }
  }

  // Generate human-readable asset_id
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('zasset_master')
    .select('*', { count: 'exact', head: true })
    .eq('employee_id', employee.id)
  const seq = (count ?? 0) + 1
  const assetId = generateAssetId(year, seq)

  // Calculate initial current value with depreciation
  const { currentValue } = calculateCurrentValue({
    purchasePrice: data.purchase_price,
    purchaseDate: data.purchase_date,
    depreciationMethod: data.depreciation_method,
    depreciationRate: data.depreciation_rate,
    salvageValue: data.salvage_value,
  })

  const { data: asset, error } = await supabase
    .from('zasset_master')
    .insert({
      asset_id: assetId,
      employee_id: employee.id,
      asset_name: data.asset_name,
      category_id: data.category_id ?? null,
      asset_subcategory: data.asset_subcategory ?? null,
      serial_number: data.serial_number ?? null,
      model_number: data.model_number ?? null,
      brand: data.brand ?? null,
      purchase_date: data.purchase_date,
      purchase_price: data.purchase_price,
      current_value: currentValue,
      salvage_value: data.salvage_value,
      depreciation_method: data.depreciation_method,
      depreciation_rate: data.depreciation_rate,
      location_id: data.location_id ?? null,
      condition: data.condition,
      acquisition_source: data.acquisition_source,
      warranty_expiry: data.warranty_expiry ?? null,
      insurance_policy_number: data.insurance_policy_number ?? null,
      insurance_value: data.insurance_value ?? null,
      notes: data.notes ?? null,
      tags: data.tags,
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Record acquisition movement
  await supabase.from('zasset_movements').insert({
    asset_id: asset.id,
    movement_type: 'acquisition',
    to_location: data.location_id ?? null,
    notes: `Asset acquired: ${data.acquisition_source}`,
    recorded_by: employee.id,
  })

  // Record initial valuation
  await supabase.from('zasset_valuations').insert({
    asset_id: asset.id,
    valuation_date: new Date().toISOString().split('T')[0],
    old_value: null,
    new_value: currentValue,
    depreciation_amount: data.purchase_price - currentValue,
    valuation_method: data.depreciation_method,
    notes: 'Initial valuation at acquisition',
    recorded_by: employee.id,
  })

  // Audit log
  await supabase.from('zasset_audit_log').insert({
    table_name: 'zasset_master',
    record_id: asset.id,
    action: 'INSERT',
    new_value: asset,
    employee_id: employee.id,
  })

  return NextResponse.json(asset, { status: 201 })
}

async function ensureSeedCategories(supabase: any, companyId: string) {
  const { count } = await supabase
    .from('zasset_categories')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
  if ((count ?? 0) === 0) {
    await supabase.from('zasset_categories').insert(
      DEFAULT_CATEGORIES.map(c => ({ ...c, company_id: companyId }))
    )
  }
}
