import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const ReviewSchema = z.object({
  product_id:  z.string().uuid(),
  rating:      z.number().int().min(1).max(5),
  title:       z.string().optional(),
  body:        z.string().optional(),
  author_name: z.string().min(1),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const productId = new URL(req.url).searchParams.get('product_id')
  let query = supabase.from('marketplace_reviews').select('*').eq('company_id', employee.company_id).eq('status', 'published')
  if (productId) query = query.eq('product_id', productId)
  const { data, error } = await query.order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const parsed = ReviewSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('marketplace_reviews')
    .insert({ ...parsed.data, company_id: employee.company_id, is_verified: false })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  // rating aggregate is refreshed by DB trigger
  return NextResponse.json(data, { status: 201 })
}
