/**
 * GET /api/v1/finance
 *
 * Returns a combined finance snapshot:
 *   - invoices (last 30, newest first)
 *   - expense_claims (last 30, newest first)
 *   - monthly P&L aggregates from payments & expense_claims
 *
 * Accessible by admin and accountant roles only.
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED_ROLES = new Set(['admin', 'accountant'])

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!ALLOWED_ROLES.has(employee.role)) {
    return NextResponse.json({ error: 'Finance access required' }, { status: 403 })
  }

  const companyId = employee.company_id

  const [invoicesResult, expensesResult, paymentsResult] = await Promise.allSettled([
    supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, due_date, issue_date, status, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50),

    supabase
      .from('expense_claims')
      .select(`
        id, amount, category, description, status, created_at,
        employee:employees(full_name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50),

    supabase
      .from('payments')
      .select('amount, payment_date, type')
      .eq('company_id', companyId)
      .gte('payment_date', new Date(new Date().setMonth(new Date().getMonth() - 8)).toISOString().split('T')[0]),
  ])

  const invoices = invoicesResult.status === 'fulfilled' ? (invoicesResult.value.data ?? []) : []
  const expenses = expensesResult.status === 'fulfilled' ? (expensesResult.value.data ?? []) : []
  const payments = paymentsResult.status === 'fulfilled' ? (paymentsResult.value.data ?? []) : []

  // Build monthly revenue from payments
  const monthlyMap: Record<string, { revenue: number; expenses: number }> = {}
  for (const p of payments as any[]) {
    const m = (p.payment_date as string).slice(0, 7)
    if (!monthlyMap[m]) monthlyMap[m] = { revenue: 0, expenses: 0 }
    if (p.type === 'received') monthlyMap[m].revenue += Number(p.amount)
  }

  const monthly = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
      revenue: v.revenue,
      expenses: v.expenses,
      profit: v.revenue - v.expenses,
    }))

  return NextResponse.json({ invoices, expenses, monthly })
}

/**
 * POST /api/v1/finance
 * Body: { type: 'invoice' | 'expense', ...fields }
 */
export async function POST(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  if (!ALLOWED_ROLES.has(employee.role)) {
    return NextResponse.json({ error: 'Finance access required' }, { status: 403 })
  }

  const body = await req.json()
  const companyId = employee.company_id

  if (body.type === 'invoice') {
    const { error, data } = await supabase
      .from('invoices')
      .insert({
        company_id: companyId,
        invoice_number: body.invoice_number,
        issue_date: body.issue_date,
        due_date: body.due_date,
        total_amount: Number(body.total_amount) || 0,
        subtotal: Number(body.total_amount) || 0,
        status: 'draft',
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  }

  if (body.type === 'expense') {
    const { error, data } = await supabase
      .from('expense_claims')
      .insert({
        company_id: companyId,
        employee_id: employee.id,
        amount: Number(body.amount),
        category: body.category,
        description: body.description ?? null,
        status: 'pending',
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  }

  return NextResponse.json({ error: 'type must be invoice or expense' }, { status: 400 })
}
