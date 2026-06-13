import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { DEFAULT_SETTINGS } from '@/lib/services/marketplace'
import { z } from 'zod'

const ALLOWED = new Set(['admin', 'accountant'])

const SettingsSchema = z.object({
  store_name:              z.string().optional(),
  store_tagline:           z.string().optional(),
  currency:                z.string().default('INR'),
  platform_fee_pct:        z.number().min(0).max(100).default(0),
  payment_gateway_fee_pct: z.number().min(0).max(100).default(2),
  shipping_flat_fee:       z.number().min(0).default(49),
  free_shipping_threshold: z.number().min(0).default(999),
  cod_deposit_pct:         z.number().min(0).max(100).default(0),
  cod_enabled:             z.boolean().default(true),
  auto_reserve_on_confirm: z.boolean().default(true),
  low_stock_hide:          z.boolean().default(false),
}).partial()

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { data } = await supabase
    .from('marketplace_settings')
    .select('*')
    .eq('company_id', employee.company_id)
    .maybeSingle()

  return NextResponse.json(data ?? { company_id: employee.company_id, ...DEFAULT_SETTINGS, currency: 'INR' })
}

export async function PUT(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!ALLOWED.has(employee.role)) {
    return NextResponse.json({ error: 'Admin or Accountant access required' }, { status: 403 })
  }

  const parsed = SettingsSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('marketplace_settings')
    .upsert({ company_id: employee.company_id, ...parsed.data, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
