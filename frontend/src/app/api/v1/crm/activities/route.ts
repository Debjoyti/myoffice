import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const ALLOWED = new Set(['admin', 'hr', 'manager', 'accountant'])

const ActivitySchema = z.object({
  type:        z.enum(['call', 'email', 'meeting', 'task', 'note']),
  subject:     z.string().min(1),
  body:        z.string().optional(),
  status:      z.enum(['planned', 'completed', 'cancelled']).default('completed'),
  direction:   z.enum(['inbound', 'outbound']).optional(),
  outcome:     z.string().optional(),
  due_at:      z.string().optional(),
  duration_min:z.number().int().optional(),
  contact_id:  z.string().uuid().nullable().optional(),
  account_id:  z.string().uuid().nullable().optional(),
  deal_id:     z.string().uuid().nullable().optional(),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const cid = employee.company_id

  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  const status = url.searchParams.get('status')
  const scope = url.searchParams.get('scope') // 'mine' | 'all'

  let query = supabase
    .from('crm_activities')
    .select('*, contact:crm_contacts(id, first_name, last_name), account:crm_accounts(id, name), deal:crm_deals(id, name)')
    .eq('company_id', cid)
  if (type && type !== 'all') query = query.eq('type', type)
  if (status && status !== 'all') query = query.eq('status', status)
  if (scope === 'mine') query = query.eq('owner_id', employee.id)
  const { data, error } = await query.order('created_at', { ascending: false }).limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const now = Date.now()
  const activities = (data ?? []).map(a => ({
    ...a,
    is_overdue: a.status === 'planned' && a.due_at && new Date(a.due_at).getTime() < now,
  }))
  const summary = {
    total: activities.length,
    open_tasks: activities.filter(a => a.status === 'planned').length,
    overdue: activities.filter(a => a.is_overdue).length,
    completed: activities.filter(a => a.status === 'completed').length,
  }
  return NextResponse.json({ activities, summary })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const parsed = ActivitySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  const a = parsed.data

  const { data, error } = await supabase
    .from('crm_activities')
    .insert({
      ...a,
      contact_id: a.contact_id ?? null, account_id: a.account_id ?? null, deal_id: a.deal_id ?? null,
      due_at: a.due_at || null,
      completed_at: a.status === 'completed' ? new Date().toISOString() : null,
      company_id: employee.company_id, owner_id: employee.id, created_by: employee.id,
    })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
