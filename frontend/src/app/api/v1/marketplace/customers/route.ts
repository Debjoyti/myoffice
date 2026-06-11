import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const CustomerSchema = z.object({
  name:   z.string().min(1),
  email:  z.string().email().optional().or(z.literal('')),
  phone:  z.string().optional(),
  type:   z.enum(['b2c', 'b2b']).default('b2c'),
  gstin:  z.string().optional(),
  addresses: z.array(z.record(z.string(), z.any())).default([]),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const search = new URL(req.url).searchParams.get('q')
  let query = supabase.from('marketplace_customers').select('*').eq('company_id', employee.company_id)
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  const { data, error } = await query.order('created_at', { ascending: false }).limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const parsed = CustomerSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('marketplace_customers')
    .insert({ ...parsed.data, email: parsed.data.email || null, company_id: employee.company_id })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
