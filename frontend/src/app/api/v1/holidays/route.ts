import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { businessToday } from '@/lib/utils'

/**
 * GET /api/v1/holidays
 *   (default)            → next 8 upcoming holidays
 *   ?from=&to=YYYY-MM-DD → every holiday in the inclusive range (for the calendar)
 *
 * Company scoping is enforced by RLS (tenant_holidays policy).
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  let query = supabase
    .from('holidays')
    .select('id, name, date, type, description')
    .order('date', { ascending: true })

  if (from || to) {
    if (from) query = query.gte('date', from)
    if (to)   query = query.lte('date', to)
  } else {
    query = query.gte('date', businessToday()).limit(8)
  }

  const { data: holidays, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ holidays: holidays ?? [] })
}
