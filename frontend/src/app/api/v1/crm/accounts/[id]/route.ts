import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED = new Set(['admin', 'hr', 'manager', 'accountant'])
type RouteParams = { params: Promise<{ id: string }> }
const EDITABLE = new Set(['name', 'legal_name', 'domain', 'website', 'industry', 'employee_count', 'annual_revenue', 'phone', 'email', 'city', 'state', 'country', 'type', 'status', 'owner_id', 'tags', 'description', 'address'])

export async function GET(_req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const { id } = await params
  const cid = employee.company_id

  const { data: account, error } = await supabase
    .from('crm_accounts').select('*').eq('id', id).eq('company_id', cid).single()
  if (error || !account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const [{ data: contacts }, { data: deals }, { data: activities }] = await Promise.all([
    supabase.from('crm_contacts').select('*').eq('account_id', id).order('created_at', { ascending: false }),
    supabase.from('crm_deals').select('*').eq('account_id', id).order('created_at', { ascending: false }),
    supabase.from('crm_activities').select('*').eq('account_id', id).order('created_at', { ascending: false }).limit(50),
  ])
  return NextResponse.json({ ...account, contacts: contacts ?? [], deals: deals ?? [], activities: activities ?? [] })
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const { id } = await params

  const body = await req.json() as Record<string, unknown>
  const update: Record<string, unknown> = {}
  for (const k of Object.keys(body)) if (EDITABLE.has(k)) update[k] = body[k]

  const { data, error } = await supabase
    .from('crm_accounts').update(update).eq('id', id).eq('company_id', employee.company_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const { id } = await params

  const { error } = await supabase.from('crm_accounts').delete().eq('id', id).eq('company_id', employee.company_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
