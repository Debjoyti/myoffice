import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee, requireHR } from '@/lib/supabase/employee'
import { logAudit } from '@/lib/services/audit'
import { z } from 'zod'

const createSchema = z.object({
  candidate_name:  z.string().min(1),
  candidate_email: z.string().email(),
  position_title:  z.string().min(1),
  department:      z.string().optional(),
  ctc_monthly:     z.number().positive(),
  joining_date:    z.string().optional(),
  expiry_date:     z.string().optional(),
  notes:           z.string().optional(),
})

/** GET /api/v1/offer-letters — HR sees all; employee sees own */
export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('offer_letters')
    .select(`
      id, offer_number, candidate_name, candidate_email, position_title,
      department, ctc_monthly, ctc_annual, joining_date, offer_date,
      expiry_date, status, accepted_at, created_at,
      creator:created_by (full_name, designation)
    `)
    .order('created_at', { ascending: false })

  if (!['admin', 'hr'].includes(employee.role)) {
    query = query.eq('employee_id', employee.id)
  }
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ offer_letters: data ?? [] })
}

/** POST /api/v1/offer-letters — HR/Admin generates offer letter */
export async function POST(req: Request) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const ctc_annual = Math.round(parsed.data.ctc_monthly * 12)

  // Build structured offer content
  const content = {
    greeting: `Dear ${parsed.data.candidate_name},`,
    intro: `We are pleased to extend an offer of employment for the position of ${parsed.data.position_title}${parsed.data.department ? ` in the ${parsed.data.department} department` : ''}.`,
    compensation: {
      monthly_ctc: parsed.data.ctc_monthly,
      annual_ctc: ctc_annual,
      components: ['Basic', 'HRA', 'Special Allowance', 'Transport Allowance', 'Medical Allowance', 'LTA'],
    },
    benefits: ['Group Health Insurance', 'Provident Fund (PF)', 'Gratuity', 'Performance Bonus'],
    joining_date: parsed.data.joining_date ?? 'As per mutual agreement',
    expiry: parsed.data.expiry_date ? `This offer expires on ${parsed.data.expiry_date}` : undefined,
  }

  const expiryDate = parsed.data.expiry_date ?? (() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]
  })()

  const { data, error } = await supabase
    .from('offer_letters')
    .insert({
      ...parsed.data,
      ctc_annual,
      expiry_date: expiryDate,
      content,
      status: 'draft',
      created_by: actor.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAudit({
    supabase, actorId: actor.id, actorEmail: actor.email,
    action: 'generate_offer', resourceType: 'offer_letter', resourceId: data.id,
    newValues: { candidate: data.candidate_name, position: data.position_title, ctc: ctc_annual },
  })

  return NextResponse.json({ offer_letter: data }, { status: 201 })
}
