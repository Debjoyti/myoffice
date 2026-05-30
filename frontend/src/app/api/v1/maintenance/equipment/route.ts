import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const schema = z.object({
  description: z.string().min(2),
  category_code: z.string().optional(),
  location: z.string().optional(),
  plant_section: z.string().optional(),
  function_location: z.string().optional(),
  room: z.string().optional(),
  abc_indicator: z.enum(['A','B','C']).optional(),
  plant_code: z.string().optional(),
  company_code: z.string().optional(),
  planning_plant: z.string().optional(),
  work_center: z.string().optional(),
  weight_kg: z.coerce.number().optional().nullable(),
  width: z.coerce.number().optional().nullable(),
  height: z.coerce.number().optional().nullable(),
  length: z.coerce.number().optional().nullable(),
  dimension_unit: z.string().optional(),
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional().nullable(),
  assets_number: z.string().optional(),
  valid_from: z.string().optional().nullable(),
  valid_to: z.string().optional().nullable(),
  install_date: z.string().optional().nullable(),
  electricity_meter_number: z.string().optional(),
  manufacturer_name: z.string().optional(),
  manufacturer_country: z.string().optional(),
  model_number: z.string().optional(),
  manufacture_date: z.string().optional(),
  manufacture_part_number: z.string().optional(),
  manufacture_serial_number: z.string().optional(),
  status: z.enum(['active','inactive','under_repair','retired']).optional(),
})

export async function GET() {
  const auth = await getAuthenticatedEmployee()
  if (auth instanceof NextResponse) return auth
  const { employee, supabase } = auth

  const { data, error } = await supabase
    .from('maint_equipment')
    .select('*, category:maint_categories(code,name)')
    .eq('company_id', employee.company_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ equipment: data })
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedEmployee()
  if (auth instanceof NextResponse) return auth
  const { employee, supabase } = auth

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('maint_equipment')
    .insert({ ...parsed.data, company_id: employee.company_id, created_by: employee.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
