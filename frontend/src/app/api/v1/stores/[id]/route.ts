import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!['admin', 'accountant'].includes(employee.role)) {
    return NextResponse.json({ error: 'Admin or Accountant access required' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const updates: Record<string, string | null> = { updated_at: new Date().toISOString() }

  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.location !== undefined) updates.location = body.location.trim()
  if (body.manager !== undefined) updates.manager = body.manager?.trim() || null
  if (body.contact !== undefined) updates.contact = body.contact?.trim() || null
  if (body.status !== undefined) updates.status = body.status

  const { data, error } = await supabase
    .from('stores')
    .update(updates)
    .eq('id', id)
    .eq('company_id', employee.company_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'Store not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!['admin', 'accountant'].includes(employee.role)) {
    return NextResponse.json({ error: 'Admin or Accountant access required' }, { status: 403 })
  }

  const { id } = await params

  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', id)
    .eq('company_id', employee.company_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
