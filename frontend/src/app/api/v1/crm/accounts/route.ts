import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const ALLOWED = new Set(['admin', 'hr', 'manager', 'accountant'])

const AccountSchema = z.object({
  name:           z.string().min(1),
  legal_name:     z.string().optional(),
  domain:         z.string().optional(),
  website:        z.string().optional(),
  industry:       z.string().optional(),
  employee_count: z.number().int().optional(),
  annual_revenue: z.number().optional(),
  phone:          z.string().optional(),
  email:          z.string().optional(),
  city:           z.string().optional(),
  state:          z.string().optional(),
  country:        z.string().optional(),
  type:           z.enum(['prospect', 'customer', 'partner', 'vendor', 'other']).default('prospect'),
  owner_id:       z.string().uuid().nullable().optional(),
  tags:           z.array(z.string()).default([]),
  description:    z.string().optional(),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const cid = employee.company_id

  const url = new URL(req.url)
  const search = url.searchParams.get('q')
  const type = url.searchParams.get('type')

  let query = supabase.from('crm_accounts').select('*').eq('company_id', cid)
  if (type && type !== 'all') query = query.eq('type', type)
  if (search) query = query.or(`name.ilike.%${search}%,domain.ilike.%${search}%,industry.ilike.%${search}%`)
  const { data, error } = await query.order('updated_at', { ascending: false }).limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // attach counts
  const ids = (data ?? []).map(a => a.id)
  const cMap: Record<string, number> = {}, dMap: Record<string, number> = {}
  if (ids.length) {
    const [{ data: cs }, { data: ds }] = await Promise.all([
      supabase.from('crm_contacts').select('account_id').eq('company_id', cid).in('account_id', ids),
      supabase.from('crm_deals').select('account_id, amount, status').eq('company_id', cid).in('account_id', ids),
    ])
    for (const c of cs ?? []) if (c.account_id) cMap[c.account_id] = (cMap[c.account_id] ?? 0) + 1
    for (const d of ds ?? []) if (d.account_id) dMap[d.account_id] = (dMap[d.account_id] ?? 0) + 1
  }
  const accounts = (data ?? []).map(a => ({ ...a, contact_count: cMap[a.id] ?? 0, deal_count: dMap[a.id] ?? 0 }))
  return NextResponse.json({ accounts, summary: { total: accounts.length, customers: accounts.filter(a => a.type === 'customer').length } })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const parsed = AccountSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data, error } = await supabase
    .from('crm_accounts')
    .insert({ ...parsed.data, owner_id: parsed.data.owner_id ?? employee.id, company_id: employee.company_id, created_by: employee.id })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
