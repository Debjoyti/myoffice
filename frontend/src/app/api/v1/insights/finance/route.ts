import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED = new Set(['admin', 'accountant'])

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Finance access required' }, { status: 403 })

  const cid = employee.company_id
  const since8m = new Date(new Date().setMonth(new Date().getMonth() - 7)).toISOString().slice(0, 10)

  const [invR, payR, expR] = await Promise.allSettled([
    supabase.from('invoices').select('invoice_number, total_amount, status, issue_date, due_date, created_at').eq('company_id', cid).order('created_at', { ascending: false }).limit(1000),
    supabase.from('payments').select('amount, payment_date').eq('company_id', cid).gte('payment_date', since8m).limit(5000),
    supabase.from('expense_claims').select('amount, status, created_at').eq('company_id', cid).gte('created_at', since8m).limit(5000),
  ])

  const invoices = invR.status === 'fulfilled' ? (invR.value.data ?? []) : []
  const payments = payR.status === 'fulfilled' ? (payR.value.data ?? []) : []
  const expenses = expR.status === 'fulfilled' ? (expR.value.data ?? []) : []

  const totalInvoiced = invoices.reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
  const collected = payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
  const outstanding = invoices.filter((i: any) => ['sent', 'partial', 'overdue'].includes(i.status)).reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
  const overdue = invoices.filter((i: any) => i.status === 'overdue').reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0)
  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0)

  // monthly revenue (payments) vs expenses
  const months: string[] = []
  for (let i = 7; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); months.push(d.toISOString().slice(0, 7)) }
  const revByMonth: Record<string, number> = {}, expByMonth: Record<string, number> = {}
  for (const p of payments) { const m = String(p.payment_date).slice(0, 7); revByMonth[m] = (revByMonth[m] ?? 0) + Number(p.amount || 0) }
  for (const e of expenses) { const m = String(e.created_at).slice(0, 7); expByMonth[m] = (expByMonth[m] ?? 0) + Number(e.amount || 0) }
  const pl_trend = months.map(m => ({ label: m.slice(5), revenue: Math.round(revByMonth[m] ?? 0), expense: Math.round(expByMonth[m] ?? 0) }))

  // invoice status donut
  const invStatus: Record<string, number> = {}
  for (const i of invoices) invStatus[i.status] = (invStatus[i.status] ?? 0) + 1

  const recent = invoices.slice(0, 12).map((i: any) => ({
    invoice: i.invoice_number, amount: Number(i.total_amount || 0), status: i.status, due_date: i.due_date,
  }))

  return NextResponse.json({
    kpis: {
      revenue_collected: Math.round(collected),
      total_invoiced: Math.round(totalInvoiced),
      outstanding: Math.round(outstanding),
      overdue: Math.round(overdue),
      expenses: Math.round(totalExpenses),
      net: Math.round(collected - totalExpenses),
      invoices: invoices.length,
      paid_invoices: invoices.filter((i: any) => i.status === 'paid').length,
      pending_expense_claims: expenses.filter((e: any) => ['pending', 'submitted'].includes(e.status)).length,
    },
    pl_trend,
    invoice_status: Object.entries(invStatus).map(([label, value]) => ({ label, value })),
    recent_invoices: recent,
  })
}
