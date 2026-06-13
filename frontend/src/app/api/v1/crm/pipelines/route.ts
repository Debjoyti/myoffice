import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED = new Set(['admin', 'hr', 'manager', 'accountant'])

/** GET — all pipelines with their stages (auto-seeds a default pipeline). */
export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const cid = employee.company_id

  await supabase.rpc('crm_seed_default_pipeline', { p_company: cid })

  const [{ data: pipelines }, { data: stages }] = await Promise.all([
    supabase.from('crm_pipelines').select('*').eq('company_id', cid).order('sort_order'),
    supabase.from('crm_stages').select('*').eq('company_id', cid).order('sort_order'),
  ])

  const withStages = (pipelines ?? []).map(p => ({
    ...p,
    stages: (stages ?? []).filter(s => s.pipeline_id === p.id),
  }))
  return NextResponse.json(withStages)
}

/** POST — create a pipeline with stages. */
export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const cid = employee.company_id

  const body = await req.json()
  if (!body.name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const { data: pipeline, error } = await supabase
    .from('crm_pipelines').insert({ company_id: cid, name: body.name.trim(), is_default: !!body.is_default }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const stages = Array.isArray(body.stages) && body.stages.length ? body.stages : [
    { name: 'New', probability: 10 }, { name: 'Qualified', probability: 30 },
    { name: 'Proposal', probability: 60 }, { name: 'Won', probability: 100, is_won: true },
    { name: 'Lost', probability: 0, is_lost: true },
  ]
  await supabase.from('crm_stages').insert(stages.map((s: any, i: number) => ({
    company_id: cid, pipeline_id: pipeline.id, name: s.name, sort_order: i,
    probability: s.probability ?? 0, is_won: !!s.is_won, is_lost: !!s.is_lost, color: s.color ?? '#3b82f6',
  })))

  return NextResponse.json(pipeline, { status: 201 })
}
