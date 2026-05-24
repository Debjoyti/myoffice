import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee, requireHR } from '@/lib/supabase/employee'
import { logAudit } from '@/lib/services/audit'
import { z } from 'zod'

const createSchema = z.object({
  title:         z.string().min(1),
  code:          z.string().optional(),
  level:         z.string().optional(),
  department_id: z.string().uuid().optional(),
  min_ctc:       z.number().positive().optional(),
  max_ctc:       z.number().positive().optional(),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { supabase } = result

  const { searchParams } = new URL(req.url)
  const deptId = searchParams.get('department_id')

  let query = supabase
    .from('positions')
    .select(`id, title, code, level, min_ctc, max_ctc, is_active, created_at, dept:department_id (id, name, code)`)
    .eq('is_active', true)
    .order('title')

  if (deptId) query = query.eq('department_id', deptId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ positions: data ?? [] })
}

export async function POST(req: Request) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('positions')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAudit({
    supabase, actorId: actor.id, actorEmail: actor.email,
    action: 'create', resourceType: 'position', resourceId: data.id,
    newValues: { title: data.title, level: data.level },
  })

  return NextResponse.json({ position: data }, { status: 201 })
}
