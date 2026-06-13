import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { canMoveStage, STAGE_LABEL, type Stage } from '@/lib/services/careers'

const ALLOWED = new Set(['admin', 'hr', 'manager'])
type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const { id } = await params

  const { data: app, error } = await supabase
    .from('career_applications')
    .select('*, candidate:career_candidates(*), job:career_jobs(*)')
    .eq('id', id).eq('company_id', employee.company_id).single()
  if (error || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const { data: events } = await supabase
    .from('career_application_events').select('*')
    .eq('application_id', id).order('created_at', { ascending: true })

  const { data: interviews } = await supabase
    .from('career_interviews').select('*')
    .eq('application_id', id).order('created_at', { ascending: false })

  return NextResponse.json({ ...app, events: events ?? [], interviews: interviews ?? [] })
}

/**
 * PATCH — move stage / rate / note. Validates the stage machine and writes
 * a timeline event for every meaningful change.
 * body: { to_stage?, recruiter_rating?, note?, rejection_reason?, assigned_to? }
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const { id } = await params
  const body = await req.json() as Record<string, any>

  const { data: app, error } = await supabase
    .from('career_applications').select('*')
    .eq('id', id).eq('company_id', employee.company_id).single()
  if (error || !app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const patch: Record<string, any> = {}
  const events: any[] = []

  if (body.to_stage && body.to_stage !== app.stage) {
    const from = app.stage as Stage
    const to = body.to_stage as Stage
    if (!canMoveStage(from, to)) {
      return NextResponse.json({ error: `Cannot move from ${STAGE_LABEL[from]} to ${STAGE_LABEL[to] ?? to}` }, { status: 400 })
    }
    patch.stage = to
    if (to === 'rejected') {
      patch.status = 'closed'
      patch.rejection_reason = body.rejection_reason ?? null
    }
    events.push({
      event_type: to === 'rejected' ? 'rejected' : to === 'hired' ? 'hired' : 'stage_change',
      from_stage: from, to_stage: to,
      message: `Moved ${STAGE_LABEL[from]} → ${STAGE_LABEL[to]}${body.rejection_reason ? ` (${body.rejection_reason})` : ''}`,
    })
  }

  if (typeof body.recruiter_rating === 'number') {
    patch.recruiter_rating = Math.max(1, Math.min(5, body.recruiter_rating))
    events.push({ event_type: 'rating', message: `Rated ${patch.recruiter_rating}/5` })
  }
  if (body.assigned_to !== undefined) patch.assigned_to = body.assigned_to
  if (typeof body.notes === 'string') patch.notes = body.notes
  if (body.note) events.push({ event_type: 'note', message: body.note })

  if (Object.keys(patch).length) {
    const { error: upErr } = await supabase.from('career_applications')
      .update(patch).eq('id', id).eq('company_id', employee.company_id)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })
  }

  if (events.length) {
    await supabase.from('career_application_events').insert(
      events.map(e => ({ ...e, company_id: employee.company_id, application_id: id, actor_id: employee.id, actor_name: employee.full_name }))
    )
  }

  const { data: updated } = await supabase
    .from('career_applications')
    .select('*, candidate:career_candidates(id, full_name, headline, avatar_url), job:career_jobs(id, title)')
    .eq('id', id).single()
  return NextResponse.json(updated)
}
