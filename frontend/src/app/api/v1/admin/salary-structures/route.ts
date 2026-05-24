import { NextResponse } from 'next/server'
import { requireHR } from '@/lib/supabase/employee'
import { logAudit } from '@/lib/services/audit'
import { z } from 'zod'

const createSchema = z.object({
  employee_id:          z.string().uuid(),
  effective_from:       z.string(),
  ctc_monthly:          z.number().positive(),
  basic:                z.number().min(0),
  hra:                  z.number().min(0),
  special_allowance:    z.number().min(0),
  transport_allowance:  z.number().min(0).default(0),
  medical_allowance:    z.number().min(0).default(0),
  lta_monthly:          z.number().min(0).default(0),
  pf_employer:          z.number().min(0),
  gratuity_monthly:     z.number().min(0).default(0),
  insurance_monthly:    z.number().min(0).default(0),
  pf_employee:          z.number().min(0),
  esi_employee:         z.number().min(0).default(0),
  esi_employer:         z.number().min(0).default(0),
  professional_tax:     z.number().min(0).default(200),
  notes:                z.string().optional(),
})

/**
 * POST /api/v1/admin/salary-structures
 * HR creates a new salary structure for an employee.
 * Automatically deactivates the previous active structure.
 *
 * Business rule: HR override is final — no auto-calculation, HR defines each component.
 */
export async function POST(req: Request) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { employee_id, effective_from } = parsed.data

  // Validate: employee must exist and be active
  const { data: emp } = await supabase.from('employees').select('id, full_name, status').eq('id', employee_id).single()
  if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  if (emp.status !== 'active') return NextResponse.json({ error: 'Employee is not active' }, { status: 400 })

  // Validate: total earnings + benefits must equal CTC
  const totalEarnings = parsed.data.basic + parsed.data.hra + parsed.data.special_allowance +
    parsed.data.transport_allowance + parsed.data.medical_allowance + parsed.data.lta_monthly
  const totalBenefits = parsed.data.pf_employer + parsed.data.gratuity_monthly + parsed.data.insurance_monthly
  const computedCTC   = totalEarnings + totalBenefits
  const ctcDiff = Math.abs(computedCTC - parsed.data.ctc_monthly)

  if (ctcDiff > 1) {  // allow ±1 for rounding
    return NextResponse.json({
      error: `CTC mismatch: components sum to ₹${computedCTC.toLocaleString('en-IN')} but CTC is ₹${parsed.data.ctc_monthly.toLocaleString('en-IN')}. Difference: ₹${Math.round(ctcDiff)}`,
    }, { status: 400 })
  }

  // Deactivate existing active structure
  const { data: prevActive } = await supabase
    .from('salary_structures')
    .select('id')
    .eq('employee_id', employee_id)
    .eq('is_active', true)
    .is('effective_to', null)
    .maybeSingle()

  if (prevActive) {
    const effectiveToDate = new Date(effective_from)
    effectiveToDate.setDate(effectiveToDate.getDate() - 1)

    await supabase.from('salary_structures').update({
      is_active: false,
      effective_to: effectiveToDate.toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    }).eq('id', prevActive.id)
  }

  // Create new structure
  const { data, error } = await supabase
    .from('salary_structures')
    .insert({ ...parsed.data, is_active: true, created_by: actor.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-create salary revision record
  await supabase.from('salary_revisions').insert({
    employee_id,
    revision_date: effective_from,
    revision_type: prevActive ? 'increment' : 'joining',
    old_ctc_monthly: prevActive ? null : null,  // fetched above if needed
    new_ctc_monthly: parsed.data.ctc_monthly,
    old_structure_id: prevActive?.id ?? null,
    new_structure_id: data.id,
    approved_by: actor.id,
    notes: parsed.data.notes ?? null,
  })

  logAudit({
    supabase, actorId: actor.id, actorEmail: actor.email,
    action: 'create', resourceType: 'salary_structure', resourceId: data.id,
    newValues: { employee_id, ctc_monthly: parsed.data.ctc_monthly, effective_from },
  })

  return NextResponse.json({ salary_structure: data }, { status: 201 })
}

/** GET /api/v1/admin/salary-structures?employee_id=... */
export async function GET(req: Request) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { supabase } = result

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employee_id')

  if (!employeeId) {
    return NextResponse.json({ error: 'employee_id query param required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('salary_structures')
    .select('*')
    .eq('employee_id', employeeId)
    .order('effective_from', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ salary_structures: data ?? [] })
}
