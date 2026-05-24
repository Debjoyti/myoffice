import { createClient } from './server'
import { NextResponse } from 'next/server'

export type Employee = {
  id: string
  employee_code: string
  full_name: string
  email: string
  phone: string | null
  designation: string
  department: string
  manager_id: string | null
  avatar_url: string | null
  date_of_joining: string
  employment_type: string
  status: string
  user_id: string | null
}

/** Returns the authenticated employee row, or a 401/404 NextResponse. */
export async function getAuthenticatedEmployee(): Promise<
  { employee: Employee; supabase: Awaited<ReturnType<typeof createClient>> } | NextResponse
> {
  const supabase = await createClient()
  const { data: { session }, error: authError } = await supabase.auth.getSession()

  if (authError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  if (empError || !employee) {
    return NextResponse.json(
      { error: 'Employee record not found. Contact HR to link your account.' },
      { status: 404 }
    )
  }

  return { employee: employee as Employee, supabase }
}
