import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED = new Set(['admin', 'hr', 'manager', 'accountant'])
type RouteParams = { params: Promise<{ id: string }> }

/** PATCH — complete/cancel a task or edit fields. */
export async function PATCH(req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const { id } = await params

  const body = await req.json() as Record<string, any>
  const update: Record<string, any> = {}
  for (const k of ['subject', 'body', 'status', 'outcome', 'due_at', 'duration_min']) if (k in body) update[k] = body[k]
  if (body.status === 'completed') update.completed_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('crm_activities').update(update).eq('id', id).eq('company_id', employee.company_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const { id } = await params

  const { error } = await supabase.from('crm_activities').delete().eq('id', id).eq('company_id', employee.company_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
