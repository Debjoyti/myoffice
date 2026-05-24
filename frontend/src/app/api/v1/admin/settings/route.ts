import { NextResponse } from 'next/server'
import { requireAdmin, requireHR } from '@/lib/supabase/employee'
import { logAudit } from '@/lib/services/audit'
import { z } from 'zod'

const updateSchema = z.object({
  company_name:          z.string().min(1).optional(),
  company_logo_url:      z.string().url().optional(),
  financial_year_start:  z.number().int().min(1).max(12).optional(),  // month (1-12)
  payroll_cutoff_day:    z.number().int().min(1).max(28).optional(),
  default_work_start:    z.string().optional(),  // e.g. "09:00"
  default_work_end:      z.string().optional(),  // e.g. "18:00"
  late_threshold_mins:   z.number().int().min(0).optional(),
  timezone:              z.string().optional(),
  currency:              z.string().length(3).optional(),
  pf_applicable:         z.boolean().optional(),
  esi_applicable:        z.boolean().optional(),
  pt_applicable:         z.boolean().optional(),
  gratuity_applicable:   z.boolean().optional(),
}).strict()

/**
 * GET /api/v1/admin/settings — HR/Admin reads system settings
 * PATCH /api/v1/admin/settings — Admin-only updates
 *
 * Settings are stored as a single row keyed by a well-known id.
 * Falls back to sensible defaults if the row doesn't exist yet.
 */

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

const DEFAULT_SETTINGS = {
  id: SETTINGS_ID,
  company_name:         'My Office',
  company_logo_url:     null,
  financial_year_start: 4,      // April
  payroll_cutoff_day:   25,
  default_work_start:   '09:00',
  default_work_end:     '18:00',
  late_threshold_mins:  15,
  timezone:             'Asia/Kolkata',
  currency:             'INR',
  pf_applicable:        true,
  esi_applicable:       true,
  pt_applicable:        true,
  gratuity_applicable:  true,
}

export async function GET() {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { supabase } = result

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', SETTINGS_ID)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return stored settings merged over defaults so new fields always have values
  return NextResponse.json({ settings: { ...DEFAULT_SETTINGS, ...(data ?? {}) } })
}

export async function PATCH(req: Request) {
  const result = await requireAdmin()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Upsert: create if missing, update if exists
  const { data, error } = await supabase
    .from('settings')
    .upsert({
      id: SETTINGS_ID,
      ...parsed.data,
      updated_at: new Date().toISOString(),
      updated_by: actor.id,
    }, { onConflict: 'id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAudit({
    supabase, actorId: actor.id, actorEmail: actor.email,
    action: 'update', resourceType: 'settings', resourceId: SETTINGS_ID,
    newValues: parsed.data,
  })

  return NextResponse.json({ settings: { ...DEFAULT_SETTINGS, ...data } })
}
