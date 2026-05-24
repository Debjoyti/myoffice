import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee, requireHR } from '@/lib/supabase/employee'
import { logAudit } from '@/lib/services/audit'
import { z } from 'zod'

const createSchema = z.object({
  name:        z.string().min(1),
  code:        z.string().min(1).max(10).optional(),
  description: z.string().optional(),
  head_id:     z.string().uuid().optional(),
  parent_id:   z.string().uuid().optional(),
})

/** GET /api/v1/departments — all authenticated */
export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { supabase } = result

  const { data, error } = await supabase
    .from('departments')
    .select(`
      id, name, code, description, is_active, created_at,
      head:head_id (id, full_name, designation, avatar_url),
      parent:parent_id (id, name)
    `)
    .eq('is_active', true)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with headcount
  const { data: empCounts } = await supabase
    .from('employees')
    .select('department_id')
    .eq('status', 'active')

  const counts: Record<string, number> = {}
  for (const e of empCounts ?? []) {
    if (e.department_id) counts[e.department_id] = (counts[e.department_id] ?? 0) + 1
  }

  const enriched = (data ?? []).map(d => ({ ...d, headcount: counts[d.id] ?? 0 }))
  return NextResponse.json({ departments: enriched })
}

/** POST /api/v1/departments — HR/Admin only */
export async function POST(req: Request) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('departments')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAudit({
    supabase, actorId: actor.id, actorEmail: actor.email,
    action: 'create', resourceType: 'department', resourceId: data.id,
    newValues: { name: data.name },
  })

  return NextResponse.json({ department: data }, { status: 201 })
}
