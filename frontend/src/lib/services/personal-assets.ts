/**
 * Personal Asset Store — Business Logic Service
 * Implements SAP-inspired validation and computation rules.
 * All financial calculations use DECIMAL-safe number handling.
 */

export type DepreciationMethod = 'straight_line' | 'declining_balance' | 'none'

/**
 * Calculate depreciation and current value for an asset.
 * Guarantees: result never falls below salvage_value (= 0 by default).
 */
export function calculateCurrentValue(opts: {
  purchasePrice: number
  purchaseDate: string
  depreciationMethod: DepreciationMethod
  depreciationRate: number   // 0-100 (annual %)
  salvageValue?: number
  asOfDate?: string
}): { currentValue: number; depreciationAmount: number; yearsElapsed: number } {
  const {
    purchasePrice,
    purchaseDate,
    depreciationMethod,
    depreciationRate,
    salvageValue = 0,
    asOfDate = new Date().toISOString().split('T')[0],
  } = opts

  if (depreciationMethod === 'none' || depreciationRate === 0) {
    return { currentValue: purchasePrice, depreciationAmount: 0, yearsElapsed: 0 }
  }

  const purchased = new Date(purchaseDate)
  const asOf = new Date(asOfDate)
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000
  const yearsElapsed = Math.max(0, (asOf.getTime() - purchased.getTime()) / msPerYear)

  let currentValue: number
  const rate = depreciationRate / 100

  if (depreciationMethod === 'straight_line') {
    const annualDepr = (purchasePrice - salvageValue) * rate
    currentValue = purchasePrice - annualDepr * yearsElapsed
  } else {
    // Declining balance
    currentValue = purchasePrice * Math.pow(1 - rate, yearsElapsed)
  }

  currentValue = Math.max(salvageValue, currentValue)
  const depreciationAmount = purchasePrice - currentValue

  return {
    currentValue: Math.round(currentValue * 100) / 100,
    depreciationAmount: Math.round(depreciationAmount * 100) / 100,
    yearsElapsed: Math.round(yearsElapsed * 100) / 100,
  }
}

/**
 * Generate SAP-style asset ID: ASSET-YYYY-NNNNN
 */
export function generateAssetId(year: number, sequence: number): string {
  return `ASSET-${year}-${String(sequence).padStart(5, '0')}`
}

/**
 * Calculate gain/loss on asset sale.
 */
export function calculateGainLoss(currentValue: number, salePrice: number): number {
  return Math.round((salePrice - currentValue) * 100) / 100
}

/**
 * Validate asset data — mirrors PART 5 of the spec.
 * Returns array of error messages (empty = valid).
 */
export function validateAsset(data: {
  asset_name?: string
  purchase_price?: number
  current_value?: number
  depreciation_rate?: number
  purchase_date?: string
  warranty_expiry?: string
  salvage_value?: number
}): string[] {
  const errors: string[] = []

  if (!data.asset_name?.trim()) errors.push('Asset name is required')
  if (data.purchase_price !== undefined && data.purchase_price <= 0)
    errors.push('Purchase price must be positive')
  if (data.current_value !== undefined && data.current_value < 0)
    errors.push('Current value cannot be negative')
  if (
    data.depreciation_rate !== undefined &&
    (data.depreciation_rate < 0 || data.depreciation_rate > 100)
  )
    errors.push('Depreciation rate must be between 0 and 100%')
  if (data.purchase_date) {
    const pd = new Date(data.purchase_date)
    if (isNaN(pd.getTime())) errors.push('Invalid purchase date')
    else if (pd > new Date()) errors.push('Purchase date cannot be in the future')
  }
  if (data.warranty_expiry && data.purchase_date) {
    const wd = new Date(data.warranty_expiry)
    const pd = new Date(data.purchase_date)
    if (wd < pd) errors.push('Warranty expiry must be after purchase date')
  }
  if (
    data.salvage_value !== undefined &&
    data.purchase_price !== undefined &&
    data.salvage_value > data.purchase_price
  )
    errors.push('Salvage value cannot exceed purchase price')

  return errors
}

/**
 * Default category seed data for new companies.
 */
export const DEFAULT_CATEGORIES = [
  { category_name: 'Electronics',   default_depreciation_rate: 20, typical_lifespan_years: 5  },
  { category_name: 'Furniture',     default_depreciation_rate: 10, typical_lifespan_years: 10 },
  { category_name: 'Vehicle',       default_depreciation_rate: 15, typical_lifespan_years: 8  },
  { category_name: 'Jewelry',       default_depreciation_rate: 0,  typical_lifespan_years: 50 },
  { category_name: 'Art',           default_depreciation_rate: 0,  typical_lifespan_years: 100},
  { category_name: 'Collectibles',  default_depreciation_rate: 0,  typical_lifespan_years: 50 },
  { category_name: 'Real Estate',   default_depreciation_rate: 0,  typical_lifespan_years: 50 },
  { category_name: 'Investments',   default_depreciation_rate: 0,  typical_lifespan_years: 0  },
  { category_name: 'Digital Assets',default_depreciation_rate: 50, typical_lifespan_years: 2  },
  { category_name: 'Other',         default_depreciation_rate: 10, typical_lifespan_years: 5  },
] as const
