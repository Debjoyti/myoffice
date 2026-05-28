import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const LocationSchema = z.object({
  location_name:  z.string().min(1).max(200),
  location_type:  z.enum(['room','building','storage_unit','safe','vehicle','other']).default('room'),
  address:        z.string().optional().nullable(),
  security_level: z.enum(['low','medium','high','vault']).default('medium'),
  notes:          z.string().optional().nullable(),
})

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { data, error } = await supabase
    .from('zasset_locations')
    .select('*, asset_count:zasset_master(count)')
    .eq('employee_id', employee.id)
    .order('location_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const body = await req.json()
  const parsed = LocationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('zasset_locations')
    .insert({ ...parsed.data, employee_id: employee.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const parsed = LocationSchema.partial().safeParse(rest)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 })

  const { data, error } = await supabase
    .from('zasset_locations')
    .update(parsed.data)
    .eq('id', id)
    .eq('employee_id', employee.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Check if any active assets use this location
  const { count } = await supabase
    .from('zasset_master')
    .select('*', { count: 'exact', head: true })
    .eq('location_id', id)
    .eq('employee_id', employee.id)
    .eq('status', 'active')

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Cannot delete location with active assets. Move or deactivate assets first.' },
      { status: 422 }
    )
  }

  const { error } = await supabase
    .from('zasset_locations')
    .delete()
    .eq('id', id)
    .eq('employee_id', employee.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
