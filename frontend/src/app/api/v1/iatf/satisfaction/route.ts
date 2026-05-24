import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  assessment_year: z.number().int(),
  assessment_period: z.enum(['H1', 'H2', 'Annual', 'Q1', 'Q2', 'Q3', 'Q4']),
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(z.object({ id: z.string(), text: z.string(), type: z.string() })).optional(),
  target_departments: z.array(z.string()).optional(),
  is_anonymous: z.boolean().optional(),
  response_deadline: z.string().optional(),
})

const submitResponseSchema = z.object({
  assessment_id: z.string().uuid(),
  responses: z.array(z.object({ question_id: z.string(), answer: z.unknown() })),
  overall_score: z.number().optional(),
})

const statusPatchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'open', 'closed']),
})

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userProfile } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 403 })

    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', userProfile.company_id)
      .maybeSingle()

    const { data: assessments, error } = await supabase
      .from('satisfaction_assessments')
      .select('*')
      .eq('company_id', userProfile.company_id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Check which ones the current employee has responded to
    let responseStatuses: Record<string, boolean> = {}
    if (emp) {
      const { data: responses } = await supabase
        .from('satisfaction_responses')
        .select('assessment_id')
        .eq('employee_id', emp.id)
        .eq('company_id', userProfile.company_id)

      responseStatuses = (responses ?? []).reduce((acc: Record<string, boolean>, r: { assessment_id: string }) => {
        acc[r.assessment_id] = true
        return acc
      }, {})
    }

    const enriched = (assessments ?? []).map((a: Record<string, unknown>) => ({
      ...a,
      has_responded: responseStatuses[a.id as string] ?? false,
    }))

    return NextResponse.json({ data: enriched })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userProfile } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single()
    if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 403 })

    const role = userProfile.role as string
    if (!['hr', 'company_admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', userProfile.company_id)
      .maybeSingle()

    const body = await req.json()
    const parsed = createSchema.parse(body)

    const { data, error } = await supabase
      .from('satisfaction_assessments')
      .insert({ company_id: userProfile.company_id, created_by: emp?.id ?? null, ...parsed })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ data }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userProfile } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single()
    if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 403 })

    const body = await req.json()

    // Determine if submitting response or updating status
    if ('assessment_id' in body && 'responses' in body) {
      // Employee submits response
      const parsed = submitResponseSchema.parse(body)

      const { data: emp } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', userProfile.company_id)
        .single()
      if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 403 })

      const { data, error } = await supabase
        .from('satisfaction_responses')
        .upsert(
          {
            company_id: userProfile.company_id,
            employee_id: emp.id,
            submitted_at: new Date().toISOString(),
            ...parsed,
          },
          { onConflict: 'assessment_id,employee_id' }
        )
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ data })
    }

    // HR updates status
    const role = userProfile.role as string
    if (!['hr', 'company_admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const parsed = statusPatchSchema.parse(body)

    const { data, error } = await supabase
      .from('satisfaction_assessments')
      .update({
        status: parsed.status,
        closed_at: parsed.status === 'closed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.id)
      .eq('company_id', userProfile.company_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
