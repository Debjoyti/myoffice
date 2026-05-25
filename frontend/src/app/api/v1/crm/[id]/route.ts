/**
 * PATCH /api/v1/crm/[id]  — update lead (status, value, owner, etc.)
 * DELETE /api/v1/crm/[id] — remove a lead
 *
 * Accessible by admin, hr, manager roles.
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED_ROLES = new Set(['admin', 'hr', 'manager'])
const VALID_STAGES  = new Set(['new', 'contacted', 'proposal', 'negotiation', 'won', 'lost'])

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!ALLOWED_ROLES.has(employee.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { id } = await params
  const body: Record<string, unknown> = await req.json()

  // Build a safe update payload — only allow known fields
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (typeof body.status === 'string' && VALID_STAGES.has(body.status)) {
    update.status = body.status
  }
  if (typeof body.value === 'number') {
    update.value = body.value
  }
  if (typeof body.name === 'string' && body.name.trim()) {
    update.name = body.name.trim()
  }
  if (typeof body.company === 'string') {
    update.company = body.company
  }
  if (typeof body.owner_id === 'string') {
    update.owner_id = body.owner_id
  }

  const { data, error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', id)
    .eq('company_id', employee.company_id)   // row-level company scoping
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  // Only admin/hr can delete leads
  if (!['admin', 'hr'].includes(employee.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { id } = await params

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id)
    .eq('company_id', employee.company_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
