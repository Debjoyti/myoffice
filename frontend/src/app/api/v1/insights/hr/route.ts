import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED = new Set(['admin', 'hr', 'manager'])

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const cid = employee.company_id
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = today.slice(0, 7) + '-01'
  const since14 = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10)

  const empR = await supabase.from('employees')
    .select('id, status, department, designation, date_of_joining, employment_type').eq('company_id', cid)
  const employees = empR.data ?? []
  const empIds = employees.map((e: any) => e.id)
  const active = employees.filter((e: any) => e.status === 'active')

  const [deptR, attR, leaveR, apprR, payR] = await Promise.allSettled([
    supabase.from('departments').select('id, name, status').eq('company_id', cid),
    empIds.length ? supabase.from('attendance_sessions').select('employee_id, date').in('employee_id', empIds).gte('date', since14) : Promise.resolve({ data: [] }),
    supabase.from('approvals').select('id', { count: 'exact', head: true }).eq('company_id', cid).eq('type', 'leave').eq('status', 'pending'),
    supabase.from('approvals').select('id', { count: 'exact', head: true }).eq('company_id', cid).eq('status', 'pending'),
    supabase.from('payrolls').select('payroll_month, total_gross, status').eq('company_id', cid).order('payroll_month', { ascending: false }).limit(6),
  ])

  const depts = deptR.status === 'fulfilled' ? (deptR.value.data ?? []) : []
  const att = attR.status === 'fulfilled' ? ((attR.value as any).data ?? []) : []
  const pendingLeaves = leaveR.status === 'fulfilled' ? (leaveR.value.count ?? 0) : 0
  const pendingApprovals = apprR.status === 'fulfilled' ? (apprR.value.count ?? 0) : 0
  const payrolls = payR.status === 'fulfilled' ? (payR.value.data ?? []) : []

  // headcount by department
  const byDept: Record<string, number> = {}
  for (const e of active) byDept[e.department || 'Unassigned'] = (byDept[e.department || 'Unassigned'] ?? 0) + 1
  const headcount_by_dept = Object.entries(byDept).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)

  // attendance trend (distinct employees present per day, last 14d)
  const presentByDay: Record<string, Set<string>> = {}
  for (const a of att) {
    if (!presentByDay[a.date]) presentByDay[a.date] = new Set()
    presentByDay[a.date].add(a.employee_id)
  }
  const days: string[] = []
  for (let i = 13; i >= 0; i--) days.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10))
  const attendance_trend = days.map(d => ({ date: d.slice(5), present: presentByDay[d]?.size ?? 0 }))
  const presentToday = presentByDay[today]?.size ?? 0

  // hires by month (last 6)
  const hiresByMonth: Record<string, number> = {}
  for (const e of employees) {
    if (!e.date_of_joining) continue
    const m = String(e.date_of_joining).slice(0, 7)
    hiresByMonth[m] = (hiresByMonth[m] ?? 0) + 1
  }
  const months: string[] = []
  for (let i = 5; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); months.push(d.toISOString().slice(0, 7)) }
  const hires_trend = months.map(m => ({ label: m.slice(5), value: hiresByMonth[m] ?? 0 }))

  // employment type donut
  const byType: Record<string, number> = {}
  for (const e of active) byType[e.employment_type || 'full_time'] = (byType[e.employment_type || 'full_time'] ?? 0) + 1

  const newHires = employees.filter((e: any) => e.status === 'active' && e.date_of_joining >= monthStart).length
  const attrition = employees.filter((e: any) => ['resigned', 'terminated', 'inactive'].includes(e.status)).length

  return NextResponse.json({
    kpis: {
      headcount: active.length, total_employees: employees.length,
      departments: depts.filter((d: any) => d.status !== 'inactive').length,
      present_today: presentToday, attendance_rate: active.length ? Math.round((presentToday / active.length) * 100) : 0,
      new_hires_month: newHires, attrition,
      pending_leaves: pendingLeaves, pending_approvals: pendingApprovals,
      latest_payroll_cost: payrolls[0] ? Math.round(Number(payrolls[0].total_gross || 0)) : 0,
      latest_payroll_month: payrolls[0]?.payroll_month ?? null,
    },
    headcount_by_dept,
    attendance_trend,
    hires_trend,
    employment_type: Object.entries(byType).map(([label, value]) => ({ label, value })),
    payroll_trend: payrolls.slice().reverse().map((p: any) => ({ label: String(p.payroll_month).slice(5), value: Math.round(Number(p.total_gross || 0)) })),
  })
}
