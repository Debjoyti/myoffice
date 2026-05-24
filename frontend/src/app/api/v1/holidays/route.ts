import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: holidays, error } = await supabase
    .from('holidays')
    .select('id, name, date, type, description')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(8)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ holidays: holidays ?? [] })
}
