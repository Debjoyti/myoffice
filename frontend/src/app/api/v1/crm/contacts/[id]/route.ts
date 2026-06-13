import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED = new Set(['admin', 'hr', 'manager', 'accountant'])
type RouteParams = { params: Promise<{ id: string }> }
const EDITABLE = new Set(['first_name', 'last_name', 'email', 'phone', 'mobile', 'job_title', 'department', 'account_id', 'owner_id', 'lifecycle_stage', 'lead_status', 'source', 'tags', 'address', 'linkedin', 'twitter', 'notes', 'do_not_contact'])

export async function GET(_req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const { id } = await params

  const { data: contact, error } = await supabase
    .from('crm_contacts').select('*, account:crm_accounts(id, name, industry)').eq('id', id).eq('company_id', employee.company_id).single()
  if (error || !contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

  const [{ data: deals }, { data: activities }] = await Promise.all([
    supabase.from('crm_deals').select('id, name, amount, status, stage_id, close_date').eq('primary_contact_id', id).order('created_at', { ascending: false }),
    supabase.from('crm_activities').select('*').eq('contact_id', id).order('created_at', { ascending: false }).limit(100),
  ])
  return NextResponse.json({ ...contact, full_name: [contact.first_name, contact.last_name].filter(Boolean).join(' '), deals: deals ?? [], activities: activities ?? [] })
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
    .from('crm_contacts').update(update).eq('id', id).eq('company_id', employee.company_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const { id } = await params

  const { error } = await supabase.from('crm_contacts').delete().eq('id', id).eq('company_id', employee.company_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
