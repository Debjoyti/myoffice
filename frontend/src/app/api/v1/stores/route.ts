import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED = new Set(['admin', 'accountant', 'hr'])

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!ALLOWED.has(employee.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('company_id', employee.company_id)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!['admin', 'accountant'].includes(employee.role)) {
    return NextResponse.json({ error: 'Admin or Accountant access required' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.name?.trim() || !body.location?.trim()) {
    return NextResponse.json({ error: 'name and location are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('stores')
    .insert({
      company_id: employee.company_id,
      name: body.name.trim(),
      location: body.location.trim(),
      manager: body.manager?.trim() || null,
      contact: body.contact?.trim() || null,
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
