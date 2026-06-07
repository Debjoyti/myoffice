import { NextResponse } from 'next/server'
import { requireHR, getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const createSchema = z.object({
  full_name:       z.string().min(2),
  email:           z.string().email(),
  phone:           z.string().optional(),
  designation:     z.string().optional(),
  department_id:   z.string().uuid().optional(),
  date_of_joining: z.string().optional(),
  notes:           z.string().optional(),
})

/** GET /api/v1/onboarding — HR/Admin sees all candidates in their company */
export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { supabase } = result

  const { searchParams } = new URL(req.url)
  const stage  = searchParams.get('stage')
  const search = searchParams.get('q')

  let query = supabase
    .from('onboarding_candidates')
    .select(`
      id, full_name, email, phone, designation, department_id, date_of_joining,
      stage, doc_id_proof, doc_address_proof, doc_education_certs, doc_experience_letter,
      doc_pan_aadhaar, doc_bank_details, police_verification_status, police_verification_ref,
      police_verification_notes, notes, created_at, updated_at,
      dept:department_id (id, name, code)
    `)
    .order('created_at', { ascending: false })

  if (stage && stage !== 'all') query = query.eq('stage', stage)
  if (search) query = query.ilike('full_name', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ candidates: data ?? [], total: data?.length ?? 0 })
}

/** POST /api/v1/onboarding — HR/Admin adds a new candidate to onboarding */
export async function POST(req: Request) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('onboarding_candidates')
    .insert({
      ...parsed.data,
      company_id: actor.company_id,
      created_by: actor.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ candidate: data }, { status: 201 })
}
