import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { DEFAULT_CATEGORIES } from '@/lib/services/personal-assets'

const CategorySchema = z.object({
  category_name:            z.string().min(1).max(100),
  parent_id:                z.string().uuid().optional().nullable(),
  default_depreciation_rate: z.number().min(0).max(100).default(10),
  default_insurance_rate:   z.number().min(0).max(100).default(1),
  typical_lifespan_years:   z.number().int().min(0).optional().nullable(),
  accounting_code:          z.string().max(50).optional().nullable(),
})

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  // Auto-seed if empty
  const { count } = await supabase
    .from('zasset_categories')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', employee.company_id)

  if ((count ?? 0) === 0) {
    await supabase.from('zasset_categories').insert(
      DEFAULT_CATEGORIES.map(c => ({ ...c, company_id: employee.company_id }))
    )
  }

  const { data, error } = await supabase
    .from('zasset_categories')
    .select('*')
    .eq('company_id', employee.company_id)
    .order('category_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!['admin', 'hr'].includes(employee.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = CategorySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('zasset_categories')
    .insert({ ...parsed.data, company_id: employee.company_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
