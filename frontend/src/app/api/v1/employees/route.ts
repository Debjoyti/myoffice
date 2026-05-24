import { NextResponse } from 'next/server'
import { requireHR, getAuthenticatedEmployee } from '@/lib/supabase/employee'
import { logAudit } from '@/lib/services/audit'
import { z } from 'zod'

const createSchema = z.object({
  full_name:       z.string().min(2),
  email:           z.string().email(),
  phone:           z.string().optional(),
  designation:     z.string().min(1),
  department:      z.string().min(1),
  department_id:   z.string().uuid().optional(),
  position_id:     z.string().uuid().optional(),
  manager_id:      z.string().uuid().optional(),
  employment_type: z.enum(['full_time','part_time','contract','intern']).default('full_time'),
  date_of_joining: z.string().optional(),
  role:            z.enum(['admin','hr','manager','employee']).default('employee'),
})

/** GET /api/v1/employees — HR/Admin sees all employees */
export async function GET(req: Request) {
  const result = await getAuthenticatedEmployee()
  if (result instanceof NextResponse) return result
  const { employee, supabase } = result

  // Build query based on role
  const { searchParams } = new URL(req.url)
  const dept   = searchParams.get('department_id')
  const status = searchParams.get('status') ?? 'active'
  const search = searchParams.get('q')

  let query = supabase
    .from('employees')
    .select(`
      id, employee_code, full_name, email, phone, designation, department,
      department_id, position_id, manager_id, employment_type, status, role,
      date_of_joining, avatar_url, created_at,
      dept:department_id (id, name, code),
      position:position_id (id, title, level),
      manager:manager_id (id, full_name, designation)
    `)
    .order('full_name')

  // Non-HR employees can only see teammates in their department.
  // If the employee has no department_id, restrict to their own record to avoid returning everyone.
  if (!['admin', 'hr'].includes(employee.role)) {
    if (employee.department_id) {
      query = query.eq('department_id', employee.department_id)
    } else {
      query = query.eq('id', employee.id)
    }
  }

  if (status !== 'all') query = query.eq('status', status)
  if (dept)    query = query.eq('department_id', dept)
  if (search)  query = query.ilike('full_name', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ employees: data ?? [], total: data?.length ?? 0 })
}

/** POST /api/v1/employees — HR/Admin creates employee */
export async function POST(req: Request) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // Auto-generate employee code
  const { data: lastEmp } = await supabase
    .from('employees')
    .select('employee_code')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lastNum = lastEmp ? parseInt(lastEmp.employee_code.replace('EMP', ''), 10) : 0
  const empCode = `EMP${String(lastNum + 1).padStart(3, '0')}`

  const { data, error } = await supabase
    .from('employees')
    .insert({ ...parsed.data, employee_code: empCode })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-create default Mon–Fri work schedule so attendance tracking starts immediately
  const defaultSchedule = [1, 2, 3, 4, 5].map(day => ({
    employee_id: data.id,
    day_of_week: day,  // 1=Mon … 5=Fri
    start_time: '09:00',
    end_time:   '18:00',
    is_working_day: true,
  }))
  await supabase.from('work_schedules').insert(defaultSchedule)

  logAudit({
    supabase, actorId: actor.id, actorEmail: actor.email,
    action: 'create', resourceType: 'employee', resourceId: data.id,
    newValues: { full_name: data.full_name, email: data.email, designation: data.designation },
  })

  return NextResponse.json({ employee: data, message: 'Employee created' }, { status: 201 })
}
