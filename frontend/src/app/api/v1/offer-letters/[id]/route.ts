import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee, requireHR } from '@/lib/supabase/employee'
import { logAudit } from '@/lib/services/audit'
import { z } from 'zod'

const updateSchema = z.object({
  status:      z.enum(['draft','sent','accepted','rejected','expired','revoked']).optional(),
  joining_date: z.string().optional(),
  expiry_date:  z.string().optional(),
  notes:        z.string().optional(),
  employee_id:  z.string().uuid().optional(),  // link to employee on acceptance
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { data, error } = await supabase
    .from('offer_letters')
    .select(`*, creator:created_by (full_name, designation)`)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'Offer letter not found' }, { status: 404 })

  // Access control: employee can only see letters linked to them
  if (!['admin', 'hr'].includes(employee.role) && data.employee_id !== employee.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ offer_letter: data })
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

  const updates: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() }
  if (parsed.data.status === 'accepted') updates.accepted_at = new Date().toISOString()

  const { data: old } = await supabase.from('offer_letters').select('*').eq('id', id).single()
  const { data, error } = await supabase
    .from('offer_letters')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAudit({
    supabase, actorId: actor.id, actorEmail: actor.email,
    action: 'update', resourceType: 'offer_letter', resourceId: id,
    oldValues: { status: old?.status }, newValues: { status: parsed.data.status },
  })

  return NextResponse.json({ offer_letter: data })
}
