import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['submitted', 'under_review', 'approved', 'rejected', 'implementing', 'implemented', 'verified']).optional(),
  rejection_reason: z.string().optional(),
  target_date: z.string().optional(),
  implementation_date: z.string().optional(),
  reward_points: z.number().int().optional(),
  review_date: z.string().optional(),
  kaizen_sheet: z.object({
    before_description: z.string().optional(),
    after_description: z.string().optional(),
    implementation_steps: z.array(z.string()).optional(),
    actual_benefit: z.string().optional(),
    cost_savings: z.number().optional(),
    time_savings_hours: z.number().optional(),
    defect_reduction_percent: z.number().optional(),
    lessons_learned: z.string().optional(),
    verification_status: z.enum(['pending', 'verified', 'closed']).optional(),
    verification_remarks: z.string().optional(),
    verification_date: z.string().optional(),
  }).optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userProfile } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 403 })

    const { data: suggestion, error } = await supabase
      .from('kaizen_suggestions')
      .select('*, submitted_by_emp:submitted_by(id, users(full_name)), dept:department_id(name)')
      .eq('id', id)
      .eq('company_id', userProfile.company_id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })

    const { data: sheet } = await supabase
      .from('kaizen_sheets')
      .select('*')
      .eq('suggestion_id', id)
      .eq('company_id', userProfile.company_id)
      .maybeSingle()

    return NextResponse.json({ data: { ...suggestion, kaizen_sheet: sheet } })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    if (!['hr', 'company_admin', 'super_admin', 'manager'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = patchSchema.parse(body)
    const { kaizen_sheet, ...suggestionUpdates } = parsed

    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', userProfile.company_id)
      .maybeSingle()

    if (Object.keys(suggestionUpdates).length > 0) {
      await supabase
        .from('kaizen_suggestions')
        .update({
          ...suggestionUpdates,
          reviewed_by: emp?.id ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('company_id', userProfile.company_id)
    }

    if (kaizen_sheet) {
      await supabase
        .from('kaizen_sheets')
        .upsert(
          {
            company_id: userProfile.company_id,
            suggestion_id: id,
            ...kaizen_sheet,
            verified_by: kaizen_sheet.verification_status === 'verified' ? (emp?.id ?? null) : undefined,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'suggestion_id' }
        )
    }

    const { data: suggestion } = await supabase
      .from('kaizen_suggestions')
      .select('*')
      .eq('id', id)
      .eq('company_id', userProfile.company_id)
      .single()

    return NextResponse.json({ data: suggestion })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
