import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const ALLOWED = new Set(['admin', 'hr', 'manager', 'accountant'])

const DealSchema = z.object({
  name:               z.string().min(1),
  pipeline_id:        z.string().uuid().optional(),
  stage_id:           z.string().uuid().optional(),
  account_id:         z.string().uuid().nullable().optional(),
  primary_contact_id: z.string().uuid().nullable().optional(),
  owner_id:           z.string().uuid().nullable().optional(),
  amount:             z.number().min(0).default(0),
  close_date:         z.string().optional(),
  source:             z.string().optional(),
  priority:           z.enum(['low', 'medium', 'high']).default('medium'),
  description:        z.string().optional(),
  tags:               z.array(z.string()).default([]),
})

/** GET — deals for a pipeline, grouped by stage (Kanban board). */
export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const cid = employee.company_id

  await supabase.rpc('crm_seed_default_pipeline', { p_company: cid })

  const url = new URL(req.url)
  let pipelineId = url.searchParams.get('pipeline_id')
  const search = url.searchParams.get('q')
  const owner = url.searchParams.get('owner_id')

  if (!pipelineId) {
    const { data: def } = await supabase.from('crm_pipelines').select('id').eq('company_id', cid).eq('is_default', true).maybeSingle()
    pipelineId = def?.id ?? null
  }

  const { data: stages } = await supabase
    .from('crm_stages').select('*').eq('company_id', cid).eq('pipeline_id', pipelineId).order('sort_order')

  let query = supabase
    .from('crm_deals')
    .select('*, account:crm_accounts(id, name), contact:crm_contacts(id, first_name, last_name)')
    .eq('company_id', cid).eq('pipeline_id', pipelineId)
  if (owner) query = query.eq('owner_id', owner)
  if (search) query = query.ilike('name', `%${search}%`)
  const { data: deals, error } = await query.order('sort_order').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const board: Record<string, any[]> = {}
  for (const s of stages ?? []) board[s.id] = []
  let openValue = 0, weightedValue = 0, wonValue = 0
  for (const d of deals ?? []) {
    if (!board[d.stage_id]) board[d.stage_id] = []
    board[d.stage_id].push(d)
    if (d.status === 'open') { openValue += Number(d.amount || 0); weightedValue += Number(d.amount || 0) * (Number(d.probability || 0) / 100) }
    if (d.status === 'won') wonValue += Number(d.amount || 0)
  }

  return NextResponse.json({
    pipeline_id: pipelineId,
    stages: stages ?? [],
    board,
    deals: deals ?? [],
    summary: {
      total: (deals ?? []).length,
      open: (deals ?? []).filter(d => d.status === 'open').length,
      won: (deals ?? []).filter(d => d.status === 'won').length,
      open_value: Math.round(openValue),
      weighted_value: Math.round(weightedValue),
      won_value: Math.round(wonValue),
    },
  })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const cid = employee.company_id

  const parsed = DealSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  const d = parsed.data

  // resolve pipeline + opening stage
  let pipelineId = d.pipeline_id
  if (!pipelineId) {
    const { data: seeded } = await supabase.rpc('crm_seed_default_pipeline', { p_company: cid })
    pipelineId = seeded as unknown as string
  }
  let stageId = d.stage_id
  if (!stageId) {
    const { data: first } = await supabase
      .from('crm_stages').select('id').eq('company_id', cid).eq('pipeline_id', pipelineId)
      .eq('is_won', false).eq('is_lost', false).order('sort_order').limit(1).maybeSingle()
    stageId = first?.id
  }
  if (!pipelineId || !stageId) return NextResponse.json({ error: 'No pipeline/stage available' }, { status: 400 })

  const { data, error } = await supabase
    .from('crm_deals')
    .insert({
      company_id: cid, pipeline_id: pipelineId, stage_id: stageId,
      name: d.name, account_id: d.account_id ?? null, primary_contact_id: d.primary_contact_id ?? null,
      owner_id: d.owner_id ?? employee.id, amount: d.amount, close_date: d.close_date || null,
      source: d.source ?? null, priority: d.priority, description: d.description ?? null, tags: d.tags,
      created_by: employee.id,
    })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
