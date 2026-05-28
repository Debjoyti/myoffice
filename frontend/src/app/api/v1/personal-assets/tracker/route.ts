import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { searchParams } = new URL(req.url)
  const assetId = searchParams.get('asset_id')

  // All locations for this employee with active asset counts
  const { data: rawLocations } = await supabase
    .from('zasset_locations')
    .select('id, location_name, location_type, security_level, lat, lng, city, address')
    .eq('employee_id', employee.id)
    .order('location_name')

  const locations = rawLocations ?? []

  // Get asset counts per location
  const { data: assetCountRows } = await supabase
    .from('zasset_master')
    .select('location_id, status')
    .eq('employee_id', employee.id)

  const countMap: Record<string, { total: number; active: number }> = {}
  for (const row of assetCountRows ?? []) {
    if (!row.location_id) continue
    if (!countMap[row.location_id]) countMap[row.location_id] = { total: 0, active: 0 }
    countMap[row.location_id].total++
    if (row.status === 'active') countMap[row.location_id].active++
  }
  const locationsWithCounts = locations.map(l => ({
    ...l,
    asset_count: countMap[l.id]?.total ?? 0,
    active_count: countMap[l.id]?.active ?? 0,
  }))

  // All assets for sidebar (exclude fully disposed/sold to keep it clean)
  const { data: assets } = await supabase
    .from('zasset_master')
    .select(`
      id, asset_id, asset_name, status, condition, current_value, purchase_price, purchase_date,
      category:zasset_categories(category_name),
      location:zasset_locations(location_name, location_type)
    `)
    .eq('employee_id', employee.id)
    .order('asset_name')

  // If an asset is selected, fetch its full detail + movement journey
  let asset = null
  let journey = null

  if (assetId) {
    const { data: assetData } = await supabase
      .from('zasset_master')
      .select(`
        id, asset_id, asset_name, brand, status, condition,
        purchase_price, current_value, salvage_value, purchase_date,
        depreciation_method, depreciation_rate,
        warranty_expiry, insurance_policy_number, insurance_value,
        notes, tags, created_at, updated_at,
        category:zasset_categories(category_name),
        location:zasset_locations(id, location_name, location_type, security_level, lat, lng, city)
      `)
      .eq('id', assetId)
      .eq('employee_id', employee.id)
      .single()

    asset = assetData

    const { data: movements } = await supabase
      .from('zasset_movements')
      .select(`
        id, movement_type, notes, reference_doc, created_at,
        from_loc:from_location(id, location_name, location_type, lat, lng),
        to_loc:to_location(id, location_name, location_type, lat, lng)
      `)
      .eq('asset_id', assetId)
      .order('created_at', { ascending: true })

    journey = movements ?? []
  }

  return NextResponse.json({
    locations: locationsWithCounts,
    assets: assets ?? [],
    asset,
    journey,
  })
}
