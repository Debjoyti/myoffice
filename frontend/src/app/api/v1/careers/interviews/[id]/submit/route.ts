import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { evaluateInterview } from '@/lib/services/ai/careers'
import { z } from 'zod'

type RouteParams = { params: Promise<{ id: string }> }

const SubmitSchema = z.object({
  responses: z.array(z.object({
    question_id: z.string(),
    answer: z.string(),
    duration_seconds: z.number().optional(),
  })).min(1),
})

/**
 * Candidate submits their answers → we run the AI evaluation (LLM if a key is
 * configured, deterministic STAR rubric otherwise), persist the scored report,
 * push the interview score onto the application, and advance the pipeline.
 */
export async function POST(req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const { id } = await params

  const parsed = SubmitSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { data: interview, error } = await supabase
    .from('career_interviews')
    .select('*, job:career_jobs(id, title)')
    .eq('id', id).eq('company_id', employee.company_id).single()
  if (error || !interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
  if (interview.status === 'completed') return NextResponse.json({ error: 'Interview already submitted' }, { status: 409 })

  const responses = parsed.data.responses.map(r => ({
    ...r,
    word_count: r.answer.trim() ? r.answer.trim().split(/\s+/).length : 0,
  }))

  const evaluation = await evaluateInterview(interview.questions ?? [], responses, interview.job ?? undefined)

  const { error: upErr } = await supabase.from('career_interviews').update({
    responses,
    scores: evaluation.scores,
    overall_score: evaluation.overall_score,
    recommendation: evaluation.recommendation,
    strengths: evaluation.strengths,
    concerns: evaluation.concerns,
    summary: evaluation.summary,
    integrity_flags: evaluation.integrity_flags,
    evaluated_by: 'ai',
    status: 'completed',
    completed_at: new Date().toISOString(),
  }).eq('id', id)
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

  // Push score onto the application + advance to interview stage + timeline
  if (interview.application_id) {
    const { data: app } = await supabase.from('career_applications').select('stage')
      .eq('id', interview.application_id).single()
    const advance = app && ['applied', 'screening'].includes(app.stage)
    await supabase.from('career_applications').update({
      ai_interview_score: evaluation.overall_score,
      ...(advance ? { stage: 'interview' } : {}),
    }).eq('id', interview.application_id)

    await supabase.from('career_application_events').insert({
      company_id: employee.company_id,
      application_id: interview.application_id,
      event_type: 'interview_done',
      ...(advance ? { from_stage: app!.stage, to_stage: 'interview' } : {}),
      message: `AI interview completed · ${evaluation.overall_score}/100 · ${evaluation.recommendation.replace('_', ' ')}`,
      meta: { recommendation: evaluation.recommendation },
      actor_id: employee.id,
    })
  }

  return NextResponse.json({ ok: true, evaluation })
}
