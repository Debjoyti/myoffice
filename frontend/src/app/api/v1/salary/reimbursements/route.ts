import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { z } from 'zod'

const createSchema = z.object({
  category: z.enum(['internet', 'travel', 'fuel', 'petty_cash', 'food', 'other']),
  amount: z.number().positive(),
  claim_month: z.string().regex(/^\d{4}-\d{2}$/),
  description: z.string().optional(),
})

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { data: reimbursements, error } = await supabase
    .from('reimbursements')
    .select('*')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const list = reimbursements ?? []

  // Category summary (approved + paid only)
  const approved = list.filter(r => r.status === 'approved' || r.status === 'paid')
  const categoryMap: Record<string, number> = {}
  for (const r of approved) {
    categoryMap[r.category] = (categoryMap[r.category] ?? 0) + Number(r.amount)
  }

  const monthly_total = list
    .filter(r => r.status === 'paid' && r.claim_month === new Date().toISOString().slice(0, 7))
    .reduce((s, r) => s + Number(r.amount), 0)

  return NextResponse.json({
    reimbursements: list,
    category_totals: categoryMap,
    monthly_total,
    pending_count: list.filter(r => r.status === 'pending').length,
  })
}

export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { category, amount, claim_month, description } = parsed.data

  const { data, error } = await supabase
    .from('reimbursements')
    .insert({
      employee_id: employee.id,
      category, amount, claim_month,
      description: description ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reimbursement: data }, { status: 201 })
}
