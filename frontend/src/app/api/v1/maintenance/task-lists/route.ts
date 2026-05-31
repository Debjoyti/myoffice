import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const schema = z.object({
  equipment_number: z.string().optional(),
  operation: z.string().min(1),
  sub_operation: z.string().optional(),
  group: z.string().optional(),
  work_center: z.string().optional(),
  description: z.string().min(2),
  control_key: z.string().optional(),
  work_hours: z.coerce.number().optional(),
  number_of_workers: z.coerce.number().int().optional(),
  normal_duration: z.coerce.number().optional(),
  percentage: z.coerce.number().optional(),
  preventive_months: z.coerce.number().optional(),
  predictive_schedule: z.string().optional(),
})

export async function GET() {
  const auth = await getAuthenticatedEmployee()
  if (auth instanceof NextResponse) return auth
  const { employee, supabase } = auth
  const { data, error } = await supabase
    .from('maint_task_lists')
    .select('*')
    .eq('company_id', employee.company_id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tasks: data })
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedEmployee()
  if (auth instanceof NextResponse) return auth
  const { employee, supabase } = auth
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const { data, error } = await supabase
    .from('maint_task_lists')
    .insert({ ...parsed.data, company_id: employee.company_id })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
