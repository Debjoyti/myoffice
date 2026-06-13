import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const ALLOWED = new Set(['admin', 'hr', 'manager', 'accountant'])

const ContactSchema = z.object({
  first_name:      z.string().min(1),
  last_name:       z.string().optional(),
  email:           z.string().optional(),
  phone:           z.string().optional(),
  mobile:          z.string().optional(),
  job_title:       z.string().optional(),
  department:      z.string().optional(),
  account_id:      z.string().uuid().nullable().optional(),
  owner_id:        z.string().uuid().nullable().optional(),
  lifecycle_stage: z.enum(['subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist']).default('lead'),
  lead_status:     z.enum(['new', 'open', 'in_progress', 'qualified', 'unqualified', 'connected']).default('new'),
  source:          z.string().optional(),
  tags:            z.array(z.string()).default([]),
  linkedin:        z.string().optional(),
  notes:           z.string().optional(),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const cid = employee.company_id

  const url = new URL(req.url)
  const search = url.searchParams.get('q')
  const lifecycle = url.searchParams.get('lifecycle')
  const accountId = url.searchParams.get('account_id')

  let query = supabase
    .from('crm_contacts')
    .select('*, account:crm_accounts(id, name)')
    .eq('company_id', cid)
  if (lifecycle && lifecycle !== 'all') query = query.eq('lifecycle_stage', lifecycle)
  if (accountId) query = query.eq('account_id', accountId)
  if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,job_title.ilike.%${search}%`)
  const { data, error } = await query.order('updated_at', { ascending: false }).limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const contacts = (data ?? []).map(c => ({ ...c, full_name: [c.first_name, c.last_name].filter(Boolean).join(' ') }))
  const byStage: Record<string, number> = {}
  for (const c of contacts) byStage[c.lifecycle_stage] = (byStage[c.lifecycle_stage] ?? 0) + 1
  return NextResponse.json({ contacts, summary: { total: contacts.length, by_lifecycle: byStage } })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const parsed = ContactSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('crm_contacts')
    .insert({ ...parsed.data, account_id: parsed.data.account_id ?? null, owner_id: parsed.data.owner_id ?? employee.id, company_id: employee.company_id, created_by: employee.id })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
