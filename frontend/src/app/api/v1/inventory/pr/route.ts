import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const LineItemSchema = z.object({
  item_id:          z.string().uuid().optional(),
  sku:              z.string().optional(),
  name:             z.string().min(1),
  qty:              z.number().positive(),
  uom:              z.string().min(1),
  estimated_rate:   z.number().min(0).default(0),
  estimated_amount: z.number().min(0).default(0),
  remarks:          z.string().optional(),
})

const PRSchema = z.object({
  department:       z.string().optional(),
  required_date:    z.string().optional(),
  priority:         z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
  request_type:     z.enum(['domestic', 'import']).default('domestic'),
  items:            z.array(LineItemSchema).min(1),
  remarks:          z.string().optional(),
  justification:    z.string().optional(),
})

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const myOnly = url.searchParams.get('mine') === 'true'

  let query = supabase
    .from('purchase_requests')
    .select(`
      id, pr_no, department, request_date, required_date, priority, request_type,
      items, total_estimated_value, remarks, status, submitted_at, approved_at,
      requested_by, approved_by
    `)
    .eq('company_id', employee.company_id)

  if (status && status !== 'all') query = query.eq('status', status)
  if (myOnly) query = query.eq('requested_by', employee.id)

  const { data, error } = await query.order('created_at', { ascending: false }).limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const summary = {
    total:        (data ?? []).length,
    draft:        (data ?? []).filter(r => r.status === 'draft').length,
    pending:      (data ?? []).filter(r => r.status === 'submitted').length,
    approved:     (data ?? []).filter(r => r.status === 'approved').length,
    ordered:      (data ?? []).filter(r => ['partially_ordered','fully_ordered'].includes(r.status)).length,
  }

  return NextResponse.json({ purchase_requests: data ?? [], summary })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const body = await req.json()

  // Handle status transitions
  if (body.action && body.pr_id) {
    const { data: pr } = await supabase
      .from('purchase_requests')
      .select('id, status, company_id')
      .eq('id', body.pr_id)
      .eq('company_id', employee.company_id)
      .single()

    if (!pr) return NextResponse.json({ error: 'PR not found' }, { status: 404 })

    const transitions: Record<string, { status: string; field?: string; role?: string[] }> = {
      submit:  { status: 'submitted', field: 'submitted_at' },
      approve: { status: 'approved',  field: 'approved_at',   role: ['admin', 'manager'] },
      reject:  { status: 'rejected',  field: 'rejected_at',   role: ['admin', 'manager'] },
      cancel:  { status: 'cancelled' },
    }

    const transition = transitions[body.action]
    if (!transition) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    if (transition.role && !transition.role.includes(employee.role)) {
      return NextResponse.json({ error: 'Insufficient permissions for this action' }, { status: 403 })
    }

    const update: any = { status: transition.status, updated_at: new Date().toISOString() }
    if (transition.field) update[transition.field] = new Date().toISOString()
    if (body.action === 'approve')  update.approved_by = employee.id
    if (body.action === 'reject') {
      update.rejected_by = employee.id
      update.rejection_reason = body.reason ?? ''
    }

    const { data, error } = await supabase
      .from('purchase_requests')
      .update(update)
      .eq('id', body.pr_id)
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  }

  // Create new PR
  const parsed = PRSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  // Generate PR number
  const { data: seqRow } = await supabase.rpc('next_doc_no', {
    p_company: employee.company_id,
    p_entity:  'pr',
    p_prefix:  'PR',
  })

  const totalValue = parsed.data.items.reduce((s, i) => s + (i.estimated_amount || i.qty * i.estimated_rate), 0)

  const { data, error } = await supabase
    .from('purchase_requests')
    .insert({
      company_id:          employee.company_id,
      pr_no:               seqRow ?? `PR-${Date.now()}`,
      requested_by:        employee.id,
      department:          parsed.data.department ?? employee.department,
      request_date:        new Date().toISOString().split('T')[0],
      required_date:       parsed.data.required_date ?? null,
      priority:            parsed.data.priority,
      request_type:        parsed.data.request_type,
      items:               parsed.data.items,
      total_estimated_value: totalValue,
      remarks:             parsed.data.remarks ?? null,
      justification:       parsed.data.justification ?? null,
      status:              body.submit ? 'submitted' : 'draft',
      submitted_at:        body.submit ? new Date().toISOString() : null,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
