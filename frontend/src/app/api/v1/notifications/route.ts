import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('id, title, message, type, is_read, action_url, created_at')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const unread = (notifications ?? []).filter(n => !n.is_read).length
  return NextResponse.json({ notifications: notifications ?? [], unread_count: unread })
}

export async function PATCH() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('employee_id', employee.id)
    .eq('is_read', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'All notifications marked as read' })
}
