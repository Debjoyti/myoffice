import { NextResponse } from 'next/server'
import { getAuthenticatedEmployee } from '@/lib/supabase/employee'

export async function GET() {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  // Get this week's dates (Mon–Sun)
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))

  const weekDates: string[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  // Schedules (0=Sun…6=Sat)
  const { data: schedules } = await supabase
    .from('work_schedules')
    .select('day_of_week, shift_start, shift_end, is_working_day')
    .eq('employee_id', employee.id)

  // Attendance this week
  const { data: sessions } = await supabase
    .from('attendance_sessions')
    .select('date, check_in_at, check_out_at, status, duration_minutes')
    .eq('employee_id', employee.id)
    .in('date', weekDates)

  // Holidays this week
  const { data: holidays } = await supabase
    .from('holidays')
    .select('name, date, type')
    .in('date', weekDates)

  const scheduleMap = new Map((schedules ?? []).map(s => [s.day_of_week, s]))
  const sessionMap = new Map((sessions ?? []).map(s => [s.date, s]))
  const holidayMap = new Map((holidays ?? []).map(h => [h.date, h]))
  const todayStr = today.toISOString().split('T')[0]

  const week = weekDates.map((date, i) => {
    const jsDay = (i + 1) % 7 // Mon=1…Sun=0
    const schedule = scheduleMap.get(jsDay) ?? null
    const session = sessionMap.get(date) ?? null
    const holiday = holidayMap.get(date) ?? null
    const isPast = date < todayStr
    const isToday = date === todayStr

    let dayStatus: 'checked_in' | 'checked_out' | 'absent' | 'holiday' | 'weekend' | 'upcoming' | 'today'
    if (holiday) dayStatus = 'holiday'
    else if (!schedule?.is_working_day) dayStatus = 'weekend'
    else if (session?.status === 'active') dayStatus = 'checked_in'
    else if (session?.status === 'completed') dayStatus = 'checked_out'
    else if (isPast) dayStatus = 'absent'
    else if (isToday) dayStatus = 'today'
    else dayStatus = 'upcoming'

    return { date, schedule, session, holiday, dayStatus, isToday }
  })

  return NextResponse.json({ week })
}
