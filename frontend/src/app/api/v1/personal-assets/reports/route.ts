import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { calculateCurrentValue } from '@/lib/services/personal-assets'

/** GET /api/v1/personal-assets/reports?type=portfolio|depreciation|audit */
export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'portfolio'

  switch (type) {
    case 'portfolio':  return portfolioReport(supabase, employee)
    case 'depreciation': return depreciationReport(supabase, employee)
    case 'audit':      return auditReport(supabase, employee)
    case 'summary':    return summaryReport(supabase, employee)
    default:           return NextResponse.json({ error: 'Unknown report type' }, { status: 400 })
  }
}

async function portfolioReport(supabase: any, employee: any) {
  const { data: assets } = await supabase
    .from('zasset_master')
    .select('*, category:zasset_categories(category_name)')
    .eq('employee_id', employee.id)
    .order('current_value', { ascending: false })

  if (!assets) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

  const active    = assets.filter((a: any) => a.status === 'active')
  const sold      = assets.filter((a: any) => a.status === 'sold')
  const disposed  = assets.filter((a: any) => ['disposed','lost','stolen'].includes(a.status))

  const totalPurchase = active.reduce((s: number, a: any) => s + Number(a.purchase_price), 0)
  const totalCurrent  = active.reduce((s: number, a: any) => s + Number(a.current_value), 0)
  const totalDepr     = totalPurchase - totalCurrent

  // Category breakdown
  const byCategory: Record<string, { count: number; value: number; purchaseValue: number }> = {}
  for (const a of active) {
    const cat = a.category?.category_name ?? 'Uncategorized'
    if (!byCategory[cat]) byCategory[cat] = { count: 0, value: 0, purchaseValue: 0 }
    byCategory[cat].count++
    byCategory[cat].value      += Number(a.current_value)
    byCategory[cat].purchaseValue += Number(a.purchase_price)
  }

  // Status breakdown
  const byStatus = {
    active:   active.length,
    sold:     sold.length,
    disposed: disposed.length,
    in_repair: assets.filter((a: any) => a.status === 'in_repair').length,
  }

  return NextResponse.json({
    totalAssets:    assets.length,
    activeAssets:   active.length,
    totalPurchaseValue: totalPurchase,
    totalCurrentValue:  totalCurrent,
    totalDepreciation:  totalDepr,
    depreciationRate:   totalPurchase > 0 ? (totalDepr / totalPurchase) * 100 : 0,
    byCategory,
    byStatus,
    topAssets: active.slice(0, 10).map((a: any) => ({
      id: a.id,
      asset_id: a.asset_id,
      asset_name: a.asset_name,
      current_value: a.current_value,
      purchase_price: a.purchase_price,
      category: a.category?.category_name,
    })),
  })
}

async function depreciationReport(supabase: any, employee: any) {
  const { data: assets } = await supabase
    .from('zasset_master')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('status', 'active')
    .neq('depreciation_method', 'none')

  if (!assets) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

  const today = new Date().toISOString().split('T')[0]
  const rows = assets.map((a: any) => {
    const { currentValue, depreciationAmount, yearsElapsed } = calculateCurrentValue({
      purchasePrice:      Number(a.purchase_price),
      purchaseDate:       a.purchase_date,
      depreciationMethod: a.depreciation_method,
      depreciationRate:   Number(a.depreciation_rate),
      salvageValue:       Number(a.salvage_value),
      asOfDate:           today,
    })
    const annualDepr = depreciationAmount / Math.max(yearsElapsed, 1)
    const remainingLife = Number(a.depreciation_rate) > 0
      ? Math.max(0, (currentValue - Number(a.salvage_value)) / (annualDepr || 1))
      : null

    return {
      id: a.id,
      asset_id: a.asset_id,
      asset_name: a.asset_name,
      purchase_date: a.purchase_date,
      purchase_price: a.purchase_price,
      current_value: currentValue,
      salvage_value: a.salvage_value,
      total_depreciation: depreciationAmount,
      annual_depreciation: Math.round(annualDepr * 100) / 100,
      depreciation_method: a.depreciation_method,
      depreciation_rate: a.depreciation_rate,
      years_elapsed: yearsElapsed,
      estimated_remaining_life_years: remainingLife ? Math.round(remainingLife * 10) / 10 : null,
    }
  })

  return NextResponse.json({
    asOfDate: today,
    totalAssets: rows.length,
    totalDepreciation: rows.reduce((s: number, r: any) => s + r.total_depreciation, 0),
    assets: rows,
  })
}

async function auditReport(supabase: any, employee: any) {
  const { data } = await supabase
    .from('zasset_audit_log')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(200)

  return NextResponse.json(data ?? [])
}

async function summaryReport(supabase: any, employee: any) {
  const [assetsRes, movementsRes, locationsRes, categoriesRes] = await Promise.all([
    supabase.from('zasset_master').select('status, current_value, purchase_price').eq('employee_id', employee.id),
    supabase.from('zasset_movements').select('movement_type, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('zasset_locations').select('id, location_name').eq('employee_id', employee.id),
    supabase.from('zasset_categories').select('id, category_name').eq('company_id', employee.company_id),
  ])

  const assets = assetsRes.data ?? []
  const active = assets.filter((a: any) => a.status === 'active')

  return NextResponse.json({
    totalAssets:      assets.length,
    activeAssets:     active.length,
    portfolioValue:   active.reduce((s: number, a: any) => s + Number(a.current_value), 0),
    purchaseValue:    active.reduce((s: number, a: any) => s + Number(a.purchase_price), 0),
    totalLocations:   (locationsRes.data ?? []).length,
    totalCategories:  (categoriesRes.data ?? []).length,
    recentMovements:  movementsRes.data ?? [],
  })
}
