import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1),
  department_id: z.string().uuid().optional(),
  purpose: z.string().optional(),
  key_responsibilities: z.array(z.string()).optional(),
  qualifications: z.array(z.string()).optional(),
  required_skills: z.array(z.string()).optional(),
  experience_years_min: z.number().int().optional(),
  experience_years_max: z.number().int().optional(),
  key_performance_indicators: z.array(z.string()).optional(),
  reporting_to: z.string().optional(),
  effective_date: z.string().optional(),
  document_number: z.string().optional(),
})

const patchSchema = createSchema.extend({
  id: z.string().uuid(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  approved_by: z.string().uuid().optional(),
  change_summary: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userProfile } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 403 })

    const url = new URL(req.url)
    const deptId = url.searchParams.get('department_id')
    const status = url.searchParams.get('status')

    let query = supabase
      .from('job_descriptions')
      .select('*, dept:department_id(name), creator:created_by(id, users(full_name))')
      .eq('company_id', userProfile.company_id)
      .order('title')

    if (deptId) query = query.eq('department_id', deptId)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userProfile } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single()
    if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 403 })

    const role = userProfile.role as string
    if (!['hr', 'company_admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', userProfile.company_id)
      .maybeSingle()

    const body = await req.json()
    const parsed = createSchema.parse(body)

    const { data, error } = await supabase
      .from('job_descriptions')
      .insert({
        company_id: userProfile.company_id,
        created_by: emp?.id ?? null,
        version: 1,
        status: 'draft',
        ...parsed,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Create initial document version
    await supabase.from('document_versions').insert({
      company_id: userProfile.company_id,
      module: 'job_descriptions',
      entity_id: data.id,
      version_number: 1,
      change_summary: 'Initial version',
      content_snapshot: parsed,
      created_by: emp?.id ?? null,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userProfile } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', user.id)
      .single()
    if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 403 })

    const role = userProfile.role as string
    if (!['hr', 'company_admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = patchSchema.parse(body)
    const { id, change_summary, ...updates } = parsed

    // Get current version
    const { data: current } = await supabase
      .from('job_descriptions')
      .select('version')
      .eq('id', id)
      .eq('company_id', userProfile.company_id)
      .single()

    const newVersion = (current?.version ?? 1) + 1

    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', userProfile.company_id)
      .maybeSingle()

    const approvalFields = updates.status === 'active'
      ? { approved_by: emp?.id ?? null, approved_at: new Date().toISOString() }
      : {}

    const { data, error } = await supabase
      .from('job_descriptions')
      .update({
        ...updates,
        ...approvalFields,
        version: newVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('company_id', userProfile.company_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Save version history
    await supabase.from('document_versions').insert({
      company_id: userProfile.company_id,
      module: 'job_descriptions',
      entity_id: id,
      version_number: newVersion,
      change_summary: change_summary ?? 'Updated',
      content_snapshot: updates,
      created_by: emp?.id ?? null,
    })

    return NextResponse.json({ data })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
