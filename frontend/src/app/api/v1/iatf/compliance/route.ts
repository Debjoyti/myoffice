import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const DEFAULT_SETTINGS = {
  esi_enabled: true,
  esi_wage_threshold: 22000,
  esi_employer_rate: 3.25,
  esi_employee_rate: 0.75,
  pf_enabled: true,
  pf_employer_rate: 12.0,
  pf_employee_rate: 12.0,
  vpf_allowed: true,
  pt_enabled: true,
  lwf_enabled: false,
  tds_enabled: true,
  gratuity_enabled: true,
  notes: null,
}

const patchSchema = z.object({
  esi_enabled: z.boolean().optional(),
  esi_wage_threshold: z.number().optional(),
  esi_employer_rate: z.number().optional(),
  esi_employee_rate: z.number().optional(),
  pf_enabled: z.boolean().optional(),
  pf_employer_rate: z.number().optional(),
  pf_employee_rate: z.number().optional(),
  vpf_allowed: z.boolean().optional(),
  pt_enabled: z.boolean().optional(),
  lwf_enabled: z.boolean().optional(),
  tds_enabled: z.boolean().optional(),
  gratuity_enabled: z.boolean().optional(),
  notes: z.string().nullable().optional(),
})

export async function GET() {
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

    const { data, error } = await supabase
      .from('compliance_settings')
      .select('*')
      .eq('company_id', userProfile.company_id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ data: data ?? { ...DEFAULT_SETTINGS, company_id: userProfile.company_id } })
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

    const role = userProfile.role as string
    if (!['hr', 'company_admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = patchSchema.parse(body)

    // Get employee ID for updated_by
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', userProfile.company_id)
      .maybeSingle()

    const { data, error } = await supabase
      .from('compliance_settings')
      .upsert(
        {
          company_id: userProfile.company_id,
          ...parsed,
          updated_by: employee?.id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'company_id' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Audit log
    await supabase.from('audit_logs').insert({
      company_id: userProfile.company_id,
      user_id: user.id,
      action: 'UPDATE',
      module: 'IATF_COMPLIANCE',
      entity_id: data.id,
      after_state: parsed,
    })

    return NextResponse.json({ data })
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
