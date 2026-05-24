import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee, requireHR } from '@/lib/supabase/employee'
import { logAudit } from '@/lib/services/audit'
import { z } from 'zod'

const updateSchema = z.object({
  full_name:               z.string().min(2).optional(),
  phone:                   z.string().optional(),
  designation:             z.string().optional(),
  department:              z.string().optional(),
  department_id:           z.string().uuid().optional(),
  position_id:             z.string().uuid().optional(),
  manager_id:              z.string().uuid().nullish(),
  employment_type:         z.enum(['full_time','part_time','contract','intern']).optional(),
  status:                  z.enum(['active','inactive','on_leave']).optional(),
  role:                    z.enum(['admin','hr','manager','employee']).optional(),
  emergency_contact_name:  z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  date_of_birth:           z.string().optional(),
  pan_number:              z.string().optional(),
  bank_account:            z.string().optional(),
  bank_ifsc:               z.string().optional(),
  bank_name:               z.string().optional(),
})

/** GET /api/v1/employees/[id] */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  // Employees can only view their own profile unless HR/Admin
  if (employee.id !== id && !['admin', 'hr'].includes(employee.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      dept:department_id (id, name, code),
      position:position_id (id, title, level, min_ctc, max_ctc),
      manager:manager_id (id, full_name, designation, email)
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  return NextResponse.json({ employee: data })
}

/** PATCH /api/v1/employees/[id] */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result

  // Employees can update their own basic profile fields; HR can update everything
  const isHR = ['admin', 'hr'].includes(actor.role)
  if (actor.id !== id && !isHR) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Non-HR can only update personal info fields
  const safeFields = ['phone','emergency_contact_name','emergency_contact_phone','bank_account','bank_ifsc','bank_name','pan_number']
  const updates = isHR ? parsed.data : Object.fromEntries(
    Object.entries(parsed.data).filter(([k]) => safeFields.includes(k))
  )

  const { data: old } = await supabase.from('employees').select('*').eq('id', id).single()
  const { data, error } = await supabase
    .from('employees')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAudit({
    supabase, actorId: actor.id, actorEmail: actor.email,
    action: 'update', resourceType: 'employee', resourceId: id,
    oldValues: old ?? undefined, newValues: updates,
  })

  return NextResponse.json({ employee: data })
}

/** DELETE /api/v1/employees/[id] — soft delete (Admin only) */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result

  const { error } = await supabase
    .from('employees')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAudit({
    supabase, actorId: actor.id, actorEmail: actor.email,
    action: 'delete', resourceType: 'employee', resourceId: id,
    metadata: { soft_delete: true },
  })

  return NextResponse.json({ message: 'Employee deactivated' })
}
