import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED = new Set(['admin', 'hr', 'manager', 'accountant'])
const STAGES = ['new', 'contacted', 'proposal', 'negotiation', 'won', 'lost']

function rangeStart(range: string): Date {
  const d = new Date()
  if (range === '7d') d.setDate(d.getDate() - 7)
  else if (range === '90d') d.setDate(d.getDate() - 90)
  else if (range === '12m') d.setMonth(d.getMonth() - 12)
  else d.setDate(d.getDate() - 30)
  return d
}

export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const range = new URL(req.url).searchParams.get('range') ?? '90d'
  const since = rangeStart(range).toISOString()
  const cid = employee.company_id

  const r = await supabase.from('leads')
    .select('id, name, company, status, value, created_at, owner:employees(full_name)')
    .eq('company_id', cid).order('created_at', { ascending: false }).limit(3000)
  const leads = r.data ?? []
  const inRange = leads.filter((l: any) => new Date(l.created_at).toISOString() >= since)

  // pipeline by stage (funnel)
  const byStage: Record<string, { count: number; value: number }> = {}
  for (const s of STAGES) byStage[s] = { count: 0, value: 0 }
  for (const l of leads) {
    const st = (l.status || 'new').toLowerCase()
    if (!byStage[st]) byStage[st] = { count: 0, value: 0 }
    byStage[st].count += 1; byStage[st].value += Number(l.value || 0)
  }
  const funnel = STAGES.map(s => ({ label: s, count: byStage[s].count, value: Math.round(byStage[s].value) }))

  const won = byStage['won']?.count ?? 0
  const lost = byStage['lost']?.count ?? 0
  const open = leads.length - won - lost
  const pipelineValue = leads.filter((l: any) => !['won', 'lost'].includes((l.status || '').toLowerCase()))
    .reduce((s: number, l: any) => s + Number(l.value || 0), 0)
  const wonValue = (byStage['won']?.value ?? 0)
  const closed = won + lost
  const winRate = closed > 0 ? Math.round((won / closed) * 100) : 0

  // new leads by day
  const byDay: Record<string, number> = {}
  for (const l of inRange) { const k = new Date(l.created_at).toISOString().slice(0, 10); byDay[k] = (byDay[k] ?? 0) + 1 }
  const leads_trend = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }))

  // by owner
  const byOwner: Record<string, number> = {}
  for (const l of leads) {
    const name = (l.owner as any)?.full_name || 'Unassigned'
    byOwner[name] = (byOwner[name] ?? 0) + Number(l.value || 0)
  }
  const top_owners = Object.entries(byOwner).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 6)
    .map(([label, value]) => ({ label, value: `₹${Math.round(value as number).toLocaleString('en-IN')}`, bar: value as number }))

  const recent = leads.slice(0, 12).map((l: any) => ({
    name: l.name, company: l.company, status: l.status, value: Number(l.value || 0),
    owner: (l.owner as any)?.full_name ?? '—', created_at: l.created_at,
  }))

  return NextResponse.json({
    range,
    kpis: {
      total_leads: leads.length, new_leads: inRange.length, open_leads: open,
      won, lost, win_rate: winRate,
      pipeline_value: Math.round(pipelineValue), won_value: Math.round(wonValue),
      avg_deal: won ? Math.round(wonValue / won) : 0,
    },
    funnel,
    leads_trend,
    top_owners,
    recent_leads: recent,
  })
}
