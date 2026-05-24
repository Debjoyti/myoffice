import { NextResponse } from 'next/server'
import { requireHR } from '@/lib/supabase/employee'

/**
 * GET /api/v1/admin/audit-logs
 * Returns paginated audit log entries. HR/Admin only.
 *
 * Query params:
 *   ?resource_type=employee
 *   ?actor_id=<uuid>
 *   ?action=create
 *   ?limit=50
 *   ?offset=0
 */
export async function GET(req: Request) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { supabase } = result

  const { searchParams } = new URL(req.url)
  const resourceType = searchParams.get('resource_type')
  const actorId      = searchParams.get('actor_id')
  const action       = searchParams.get('action')
  const limit        = Math.min(Number(searchParams.get('limit') ?? 50), 100)
  const offset       = Number(searchParams.get('offset') ?? 0)

  let query = supabase
    .from('audit_logs')
    .select(`
      id, action, resource_type, resource_id,
      old_values, new_values, metadata,
      ip_address, created_at,
      actor:actor_id (id, full_name, employee_code, role)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (resourceType) query = query.eq('resource_type', resourceType)
  if (actorId)      query = query.eq('actor_id', actorId)
  if (action)       query = query.eq('action', action)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    audit_logs: data ?? [],
    total:  count ?? 0,
    limit,
    offset,
  })
}
