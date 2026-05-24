import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee, requireHR } from '@/lib/supabase/employee'
import { logAudit } from '@/lib/services/audit'
import { z } from 'zod'

const updateSchema = z.object({
  name:        z.string().min(1).optional(),
  code:        z.string().optional(),
  description: z.string().optional(),
  head_id:     z.string().uuid().nullish(),
  parent_id:   z.string().uuid().nullish(),
  is_active:   z.boolean().optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { supabase } = result

  const { data, error } = await supabase
    .from('departments')
    .select(`
      *,
      head:head_id (id, full_name, designation, avatar_url),
      parent:parent_id (id, name)
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'Department not found' }, { status: 404 })

  // Fetch department members separately — embedded !foreign-key joins are unreliable via REST
  const { data: members } = await supabase
    .from('employees')
    .select('id, full_name, designation, status, avatar_url')
    .eq('department_id', id)
    .eq('status', 'active')
    .order('full_name')

  return NextResponse.json({ department: { ...data, employees: members ?? [] } })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data: old } = await supabase.from('departments').select('*').eq('id', id).single()
  const { data, error } = await supabase
    .from('departments')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAudit({
    supabase, actorId: actor.id, actorEmail: actor.email,
    action: 'update', resourceType: 'department', resourceId: id,
    oldValues: old ?? undefined, newValues: parsed.data,
  })

  return NextResponse.json({ department: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result

  // Check for active employees
  const { count } = await supabase
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('department_id', id)
    .eq('status', 'active')

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: `Cannot delete — ${count} active employee(s) in this department` }, { status: 409 })
  }

  const { error } = await supabase
    .from('departments')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAudit({
    supabase, actorId: actor.id, actorEmail: actor.email,
    action: 'delete', resourceType: 'department', resourceId: id,
  })

  return NextResponse.json({ message: 'Department deactivated' })
}
