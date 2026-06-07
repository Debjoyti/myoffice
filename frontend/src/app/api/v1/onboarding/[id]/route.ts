import { NextResponse } from 'next/server'
import { requireHR } from '@/lib/supabase/employee'
import { z } from 'zod'

const updateSchema = z.object({
  stage:                 z.enum(['documents_pending','verification_in_progress','verified','onboarded','on_hold']).optional(),
  doc_id_proof:          z.boolean().optional(),
  doc_address_proof:     z.boolean().optional(),
  doc_education_certs:   z.boolean().optional(),
  doc_experience_letter: z.boolean().optional(),
  doc_pan_aadhaar:       z.boolean().optional(),
  doc_bank_details:      z.boolean().optional(),
  police_verification_status: z.enum(['not_started','submitted','in_progress','cleared','flagged']).optional(),
  police_verification_ref:    z.string().optional(),
  police_verification_notes:  z.string().optional(),
  notes:                 z.string().optional(),
})

/** PATCH /api/v1/onboarding/:id — update verification checklist / stage */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { supabase } = result
  const { id } = await params

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('onboarding_candidates')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ candidate: data })
}

/** DELETE /api/v1/onboarding/:id — remove a candidate from onboarding tracking */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { supabase } = result
  const { id } = await params

  const { error } = await supabase.from('onboarding_candidates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
