/**
 * GET /api/v1/crm
 *
 * Returns leads for the current company.
 * Accessible by admin and hr roles.
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED_ROLES = new Set(['admin', 'hr', 'manager'])

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!ALLOWED_ROLES.has(employee.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const companyId = employee.company_id

  const { data: leads, error } = await supabase
    .from('leads')
    .select(`
      id, name, email, phone, company, status, value, created_at, updated_at,
      owner:employees(full_name)
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ leads: leads ?? [] })
}

/**
 * POST /api/v1/crm
 */
export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!ALLOWED_ROLES.has(employee.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const body = await req.json()
  const companyId = employee.company_id

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { error, data } = await supabase
    .from('leads')
    .insert({
      company_id: companyId,
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      company: body.company ?? null,
      status: body.status ?? 'new',
      value: Number(body.value) || 0,
      owner_id: employee.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
