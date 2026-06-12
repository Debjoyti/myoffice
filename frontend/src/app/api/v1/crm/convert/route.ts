import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const ALLOWED = new Set(['admin', 'hr', 'manager', 'accountant'])

/**
 * One-shot capture: create an account + primary contact + opening deal
 * together (the classic "new lead" / convert flow). Any sub-object can be
 * omitted; existing ids can be passed to reuse records.
 */
const ConvertSchema = z.object({
  account: z.object({
    id: z.string().uuid().optional(),
    name: z.string().optional(), industry: z.string().optional(), website: z.string().optional(),
    type: z.string().optional(),
  }).optional(),
  contact: z.object({
    id: z.string().uuid().optional(),
    first_name: z.string().optional(), last_name: z.string().optional(),
    email: z.string().optional(), phone: z.string().optional(), job_title: z.string().optional(),
    source: z.string().optional(),
  }).optional(),
  deal: z.object({
    name: z.string().optional(), amount: z.number().optional(), close_date: z.string().optional(),
  }).optional(),
})

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const cid = employee.company_id

  const parsed = ConvertSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  const { account, contact, deal } = parsed.data

  let accountId = account?.id ?? null
  if (!accountId && account?.name) {
    const { data } = await supabase.from('crm_accounts').insert({
      company_id: cid, name: account.name, industry: account.industry ?? null, website: account.website ?? null,
      type: account.type ?? 'prospect', owner_id: employee.id, created_by: employee.id,
    }).select('id').single()
    accountId = data?.id ?? null
  }

  let contactId = contact?.id ?? null
  if (!contactId && contact?.first_name) {
    const { data } = await supabase.from('crm_contacts').insert({
      company_id: cid, account_id: accountId, first_name: contact.first_name, last_name: contact.last_name ?? null,
      email: contact.email ?? null, phone: contact.phone ?? null, job_title: contact.job_title ?? null,
      source: contact.source ?? null, lifecycle_stage: 'lead', owner_id: employee.id, created_by: employee.id,
    }).select('id').single()
    contactId = data?.id ?? null
  }

  let dealId: string | null = null
  if (deal?.name) {
    const { data: pipelineId } = await supabase.rpc('crm_seed_default_pipeline', { p_company: cid })
    const { data: firstStage } = await supabase.from('crm_stages')
      .select('id').eq('company_id', cid).eq('pipeline_id', pipelineId as any)
      .eq('is_won', false).eq('is_lost', false).order('sort_order').limit(1).maybeSingle()
    if (firstStage) {
      const { data } = await supabase.from('crm_deals').insert({
        company_id: cid, pipeline_id: pipelineId, stage_id: firstStage.id, name: deal.name,
        account_id: accountId, primary_contact_id: contactId, owner_id: employee.id,
        amount: deal.amount ?? 0, close_date: deal.close_date || null, created_by: employee.id,
      }).select('id').single()
      dealId = data?.id ?? null
    }
  }

  return NextResponse.json({ account_id: accountId, contact_id: contactId, deal_id: dealId }, { status: 201 })
}
