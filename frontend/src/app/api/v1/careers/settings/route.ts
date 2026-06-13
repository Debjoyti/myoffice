import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

const ALLOWED = new Set(['admin', 'hr'])

const DEFAULTS = {
  brand_name: null, tagline: null, about: null, logo_url: null, hero_image_url: null,
  primary_color: '#2563eb', perks: [], ai_interview_default: true, auto_screen: true,
  auto_reject_threshold: 0, allow_ai_disclosure: true,
}

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { data } = await supabase.from('career_settings').select('*')
    .eq('company_id', employee.company_id).maybeSingle()
  return NextResponse.json(data ?? { company_id: employee.company_id, ...DEFAULTS })
}

export async function PUT(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result
  if (!ALLOWED.has(employee.role)) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const body = await req.json() as Record<string, any>
  const allowed = Object.keys(DEFAULTS)
  const patch: Record<string, any> = { company_id: employee.company_id, updated_at: new Date().toISOString() }
  for (const k of allowed) if (k in body) patch[k] = body[k]

  const { data, error } = await supabase.from('career_settings')
    .upsert(patch, { onConflict: 'company_id' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
