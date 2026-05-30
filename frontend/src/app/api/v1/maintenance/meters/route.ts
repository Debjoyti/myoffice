import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const schema = z.object({ meter_number: z.string().min(1), meter_name: z.string().min(1) })

export async function GET() {
  const auth = await getAuthenticatedEmployee()
  if (auth instanceof NextResponse) return auth
  const { employee, supabase } = auth
  const { data, error } = await supabase
    .from('maint_electricity_meters')
    .select('*')
    .eq('company_id', employee.company_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ meters: data })
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedEmployee()
  if (auth instanceof NextResponse) return auth
  const { employee, supabase } = auth
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { data, error } = await supabase
    .from('maint_electricity_meters')
    .insert({ ...parsed.data, company_id: employee.company_id })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
