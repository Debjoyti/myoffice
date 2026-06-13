import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED = new Set(['admin', 'hr', 'manager', 'accountant'])

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  const cid = employee.company_id

  await supabase.rpc('crm_seed_default_pipeline', { p_company: cid })

  const [dealsR, stagesR, contactsR, accountsR, actsR, ownersR] = await Promise.allSettled([
    supabase.from('crm_deals').select('amount, probability, status, stage_id, owner_id, created_at, won_at').eq('company_id', cid),
    supabase.from('crm_stages').select('id, name, color, sort_order, is_won, is_lost, pipeline_id').eq('company_id', cid).order('sort_order'),
    supabase.from('crm_contacts').select('lifecycle_stage, created_at').eq('company_id', cid),
    supabase.from('crm_accounts').select('id, type').eq('company_id', cid),
    supabase.from('crm_activities').select('type, status, due_at, completed_at, created_at').eq('company_id', cid),
    supabase.from('employees').select('id, full_name').eq('company_id', cid),
  ])

  const deals    = dealsR.status === 'fulfilled' ? (dealsR.value.data ?? []) : []
  const stages   = stagesR.status === 'fulfilled' ? (stagesR.value.data ?? []) : []
  const contacts = contactsR.status === 'fulfilled' ? (contactsR.value.data ?? []) : []
  const accounts = accountsR.status === 'fulfilled' ? (accountsR.value.data ?? []) : []
  const acts     = actsR.status === 'fulfilled' ? (actsR.value.data ?? []) : []
  const owners   = ownersR.status === 'fulfilled' ? (ownersR.value.data ?? []) : []
  const ownerName: Record<string, string> = {}
  for (const o of owners) ownerName[o.id] = o.full_name

  const open = deals.filter((d: any) => d.status === 'open')
  const won = deals.filter((d: any) => d.status === 'won')
  const lost = deals.filter((d: any) => d.status === 'lost')
  const openValue = open.reduce((s: number, d: any) => s + Number(d.amount || 0), 0)
  const weighted = open.reduce((s: number, d: any) => s + Number(d.amount || 0) * (Number(d.probability || 0) / 100), 0)
  const wonValue = won.reduce((s: number, d: any) => s + Number(d.amount || 0), 0)
  const closed = won.length + lost.length
  const winRate = closed ? Math.round((won.length / closed) * 100) : 0

  // deals by stage (open only) — uses default pipeline ordering
  const stageName: Record<string, any> = {}
  for (const s of stages) stageName[s.id] = s
  const byStage: Record<string, { name: string; color: string; count: number; value: number; order: number }> = {}
  for (const d of open) {
    const s = stageName[d.stage_id]; if (!s) continue
    if (!byStage[d.stage_id]) byStage[d.stage_id] = { name: s.name, color: s.color, count: 0, value: 0, order: s.sort_order }
    byStage[d.stage_id].count += 1; byStage[d.stage_id].value += Number(d.amount || 0)
  }
  const stage_funnel = Object.values(byStage).sort((a, b) => a.order - b.order)
    .map(s => ({ label: s.name, count: s.count, value: Math.round(s.value), color: s.color }))

  // lifecycle breakdown
  const byLifecycle: Record<string, number> = {}
  for (const c of contacts) byLifecycle[c.lifecycle_stage] = (byLifecycle[c.lifecycle_stage] ?? 0) + 1

  // won value last 6 months
  const months: string[] = []
  for (let i = 5; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); months.push(d.toISOString().slice(0, 7)) }
  const wonByMonth: Record<string, number> = {}
  for (const d of won) { if (!d.won_at) continue; const m = String(d.won_at).slice(0, 7); wonByMonth[m] = (wonByMonth[m] ?? 0) + Number(d.amount || 0) }
  const won_trend = months.map(m => ({ label: m.slice(5), value: Math.round(wonByMonth[m] ?? 0) }))

  // activity by type + tasks
  const now = Date.now()
  const byType: Record<string, number> = {}
  for (const a of acts) byType[a.type] = (byType[a.type] ?? 0) + 1
  const openTasks = acts.filter((a: any) => a.status === 'planned').length
  const overdue = acts.filter((a: any) => a.status === 'planned' && a.due_at && new Date(a.due_at).getTime() < now).length

  // owner leaderboard (open value)
  const ownerValue: Record<string, number> = {}
  for (const d of open) { const k = d.owner_id || 'unassigned'; ownerValue[k] = (ownerValue[k] ?? 0) + Number(d.amount || 0) }
  const leaderboard = Object.entries(ownerValue).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 6)
    .map(([oid, value]) => ({ label: ownerName[oid] || 'Unassigned', value: Math.round(value as number) }))

  const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString()

  return NextResponse.json({
    kpis: {
      open_deals: open.length, open_value: Math.round(openValue), weighted_value: Math.round(weighted),
      won_deals: won.length, won_value: Math.round(wonValue), win_rate: winRate,
      contacts: contacts.length, accounts: accounts.length,
      new_contacts_30d: contacts.filter((c: any) => new Date(c.created_at).toISOString() >= thirtyAgo).length,
      open_tasks: openTasks, overdue_tasks: overdue,
      avg_deal: won.length ? Math.round(wonValue / won.length) : 0,
    },
    stage_funnel, lifecycle: byLifecycle, won_trend,
    activity_by_type: Object.entries(byType).map(([label, value]) => ({ label, value })),
    leaderboard,
  })
}
