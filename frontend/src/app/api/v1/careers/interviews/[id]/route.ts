import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { generateInterview } from '@/lib/services/ai/careers'

type RouteParams = { params: Promise<{ id: string }> }

/** Load an interview. Lazily generates questions + flips to in_progress when the candidate opens it. */
export async function GET(req: Request, { params }: RouteParams) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  const { id } = await params
  const start = new URL(req.url).searchParams.get('start') === 'true'

  const { data: interview, error } = await supabase
    .from('career_interviews')
    .select('*, candidate:career_candidates(id, full_name, avatar_url, headline), job:career_jobs(id, title, location, work_mode, ai_competencies, ai_question_count, description, skills, experience_level)')
    .eq('id', id).eq('company_id', employee.company_id).single()
  if (error || !interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 })

  if (interview.expires_at && new Date(interview.expires_at) < new Date() && interview.status !== 'completed') {
    await supabase.from('career_interviews').update({ status: 'expired' }).eq('id', id)
    return NextResponse.json({ ...interview, status: 'expired' })
  }

  let patch: Record<string, any> | null = null

  // Generate questions on first open if empty
  if ((!interview.questions || interview.questions.length === 0) && interview.job) {
    const questions = await generateInterview(interview.job)
    patch = { questions }
    interview.questions = questions
  }

  if (start && ['pending', 'invited'].includes(interview.status)) {
    patch = { ...(patch ?? {}), status: 'in_progress', started_at: new Date().toISOString() }
    interview.status = 'in_progress'
  }

  if (patch) await supabase.from('career_interviews').update(patch).eq('id', id)

  return NextResponse.json(interview)
}
