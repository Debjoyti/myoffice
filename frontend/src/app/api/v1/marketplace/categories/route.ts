import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { slugify } from '@/lib/services/marketplace'
import { z } from 'zod'

const ALLOWED = new Set(['admin', 'accountant', 'manager'])

const CategorySchema = z.object({
  name:        z.string().min(1),
  parent_id:   z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  image_url:   z.string().optional(),
  icon:        z.string().optional(),
  sort_order:  z.number().int().default(0),
  is_featured: z.boolean().default(false),
})

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { data, error } = await supabase
    .from('marketplace_categories')
    .select('*')
    .eq('company_id', employee.company_id)
    .order('sort_order')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // attach product counts
  const ids = (data ?? []).map(c => c.id)
  const counts: Record<string, number> = {}
  if (ids.length) {
    const { data: prods } = await supabase
      .from('marketplace_products')
      .select('category_id')
      .eq('company_id', employee.company_id)
      .in('category_id', ids)
    for (const p of prods ?? []) if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1
  }
  return NextResponse.json((data ?? []).map(c => ({ ...c, product_count: counts[c.id] ?? 0 })))
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!ALLOWED.has(employee.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const parsed = CategorySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const slug = slugify(parsed.data.name) + '-' + Math.random().toString(36).slice(2, 6)
  const { data, error } = await supabase
    .from('marketplace_categories')
    .insert({ ...parsed.data, slug, company_id: employee.company_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
