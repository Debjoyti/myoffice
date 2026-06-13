import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED = new Set(['admin', 'hr', 'manager', 'accountant'])
type RouteParams = { params: Promise<{ id: string }> }
// stage_id changes drive status/probability via DB trigger
const EDITABLE = new Set(['name', 'stage_id', 'account_id', 'primary_contact_id', 'owner_id', 'amount', 'close_date', 'source', 'priority', 'description', 'tags', 'lost_reason', 'sort_order', 'pipeline_id'])

export async function GET(_req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const { id } = await params

  const { data: deal, error } = await supabase
    .from('crm_deals')
    .select('*, account:crm_accounts(id, name), contact:crm_contacts(id, first_name, last_name, email, phone), stage:crm_stages(id, name, color, probability)')
    .eq('id', id).eq('company_id', employee.company_id).single()
  if (error || !deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

  const [{ data: activities }, { data: history }] = await Promise.all([
    supabase.from('crm_activities').select('*').eq('deal_id', id).order('created_at', { ascending: false }).limit(100),
    supabase.from('crm_deal_stage_history').select('*').eq('deal_id', id).order('changed_at', { ascending: false }),
  ])
  return NextResponse.json({ ...deal, activities: activities ?? [], history: history ?? [] })
}

/** PATCH — move stage, mark won/lost, or edit fields.
 *  body may include { to_stage_id } shortcut or any EDITABLE field. */
export async function PATCH(req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const { id } = await params

  const body = await req.json() as Record<string, any>
  const update: Record<string, any> = {}
  if (body.to_stage_id) update.stage_id = body.to_stage_id
  for (const k of Object.keys(body)) if (EDITABLE.has(k)) update[k] = body[k]
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No editable fields' }, { status: 400 })

  const { data, error } = await supabase
    .from('crm_deals').update(update).eq('id', id).eq('company_id', employee.company_id)
    .select('*, account:crm_accounts(id, name), contact:crm_contacts(id, first_name, last_name)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // auto-log a note when a deal is closed
  if (data.status === 'won' || data.status === 'lost') {
    await supabase.from('crm_activities').insert({
      company_id: employee.company_id, type: 'note',
      subject: data.status === 'won' ? 'Deal won 🎉' : `Deal lost${data.lost_reason ? ' — ' + data.lost_reason : ''}`,
      status: 'completed', deal_id: id, account_id: data.account_id ?? null,
      owner_id: employee.id, created_by: employee.id,
    })
  }
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const { id } = await params

  const { error } = await supabase.from('crm_deals').delete().eq('id', id).eq('company_id', employee.company_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
