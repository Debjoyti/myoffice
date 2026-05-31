import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const schema = z.object({
  equipment_number: z.string().optional(),
  notification_text: z.string().optional(),
  employee_code: z.string().optional(),
  malfunction_start_date: z.string().optional(),
  malfunction_start_time: z.string().optional(),
  malfunction_end_date: z.string().optional(),
  malfunction_end_time: z.string().optional(),
  is_breakdown: z.boolean().optional(),
  maint_work_center: z.string().optional(),
  maint_work_sub_center: z.string().optional(),
})

export async function GET() {
  const auth = await getAuthenticatedEmployee()
  if (auth instanceof NextResponse) return auth
  const { employee, supabase } = auth

  const { data, error } = await supabase
    .from('maint_breakdowns')
    .select('*, equipment:maint_equipment(equipment_number,description)')
    .eq('company_id', employee.company_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ breakdowns: data })
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedEmployee()
  if (auth instanceof NextResponse) return auth
  const { employee, supabase } = auth

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { malfunction_start_date, malfunction_start_time, malfunction_end_date, malfunction_end_time, ...rest } = parsed.data

  const malfunction_start = malfunction_start_date
    ? new Date(`${malfunction_start_date}T${malfunction_start_time || '00:00'}`).toISOString()
    : null
  const malfunction_end = malfunction_end_date
    ? new Date(`${malfunction_end_date}T${malfunction_end_time || '00:00'}`).toISOString()
    : null

  const { data, error } = await supabase
    .from('maint_breakdowns')
    .insert({ ...rest, malfunction_start, malfunction_end, company_id: employee.company_id, employee_id: employee.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
