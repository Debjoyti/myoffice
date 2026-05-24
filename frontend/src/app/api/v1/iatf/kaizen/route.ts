import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1),
  problem_description: z.string().min(1),
  proposed_solution: z.string().min(1),
  expected_benefit: z.string().optional(),
  category: z.enum(['safety', 'quality', 'productivity', 'cost', 'environment', 'morale']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  department_id: z.string().uuid().optional(),
  target_date: z.string().optional(),
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
    const status = url.searchParams.get('status')
    const category = url.searchParams.get('category')
    const departmentId = url.searchParams.get('department_id')

    let query = supabase
      .from('kaizen_suggestions')
      .select('*, submitted_by_emp:submitted_by(id, users(full_name)), dept:department_id(name)')
      .eq('company_id', userProfile.company_id)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (category) query = query.eq('category', category)
    if (departmentId) query = query.eq('department_id', departmentId)

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
      .select('company_id')
      .eq('id', user.id)
      .single()
    if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 403 })

    // Get employee
    const { data: emp } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', userProfile.company_id)
      .single()
    if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 403 })

    const body = await req.json()
    const parsed = createSchema.parse(body)

    // Generate suggestion number
    const { count } = await supabase
      .from('kaizen_suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', userProfile.company_id)

    const suggestionNumber = `KZN-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(4, '0')}`

    const { data, error } = await supabase
      .from('kaizen_suggestions')
      .insert({
        company_id: userProfile.company_id,
        submitted_by: emp.id,
        suggestion_number: suggestionNumber,
        ...parsed,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ data }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
