import { NextResponse } from 'next/server'
import { requireHR } from '@/lib/supabase/employee'
import { z } from 'zod'

const schema = z.object({
  is_active: z.boolean(),
  type: z.enum(['scheduled', 'active', 'partial']),
  start_time: z.string().datetime().optional().nullable(),
  end_time: z.string().datetime().optional().nullable(),
  duration: z.string().min(1).max(50).optional().nullable(),
  description: z.string().min(10).max(500).optional().nullable(),
  affected_features: z.array(z.string()).optional(),
  contact_email: z.string().email().optional(),
  alternate_url: z.string().url().optional().nullable(),
  redirect_url: z.string().url().optional().nullable(),
}).refine(
  d => !d.start_time || !d.end_time || new Date(d.end_time) > new Date(d.start_time),
  { message: 'end_time must be after start_time' }
).refine(
  d => d.type !== 'partial' || (d.affected_features && d.affected_features.length > 0),
  { message: 'Partial maintenance requires at least one affected feature' }
)

/** POST /api/v1/maintenance/update — admin creates/updates maintenance state */
export async function POST(req: Request) {
  const auth = await requireHR()
  if (auth instanceof NextResponse) return auth
  const { employee, supabase } = auth

  if (!['admin', 'hr'].includes(employee.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const payload = {
      ...parsed.data,
      company_id: employee.company_id,
      created_by: employee.id,
    }

    // Upsert: deactivate any existing active record for company, then insert/update
    if (parsed.data.is_active) {
      await supabase
        .from('maintenance_state')
        .update({ is_active: false })
        .eq('company_id', employee.company_id)
        .eq('is_active', true)
    }

    const { data, error } = await supabase
      .from('maintenance_state')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ maintenance: data }, { status: 201 })
  } catch (err) {
    console.error('POST /api/v1/maintenance/update error:', err)
    return NextResponse.json({ error: 'Failed to update maintenance' }, { status: 500 })
  }
}
