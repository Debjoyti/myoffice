/**
 * POST /api/v1/admin/seed-demo
 *
 * One-shot endpoint: creates demo company + 4 test accounts.
 * Protected by a secret token — pass ?token=SEED_DEMO_SECRET in query.
 * Only usable when NODE_ENV !== 'production' OR when ALLOW_SEED_IN_PROD=true.
 *
 * Test accounts created:
 *   superadmin@prsk.demo   — Admin (full system access)
 *   hradmin@prsk.demo      — HR Admin (people & payroll)
 *   accountant@prsk.demo   — Accountant (finance & payroll)
 *   employee@prsk.demo     — Employee (self-service)
 *
 * All passwords: Demo@123456
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DEMO_PASSWORD = 'Demo@123456'
const DEMO_COMPANY_NAME = 'PRSK Technologies Pvt Ltd'

type SalaryComponents = {
  ctc_monthly: number
  basic: number; hra: number; special_allowance: number
  transport_allowance: number; medical_allowance: number; lta_monthly: number
  pf_employer: number; gratuity_monthly: number; insurance_monthly: number
  pf_employee: number; esi_employee: number; esi_employer: number; professional_tax: number
}

type DemoUser = {
  email: string
  full_name: string
  designation: string
  department: string
  role: 'admin' | 'hr' | 'accountant' | 'employee'
  employee_code: string
  employment_type: string
  salary: SalaryComponents
}

const DEMO_USERS: DemoUser[] = [
  {
    email: 'superadmin@prsk.demo',
    full_name: 'Arjun Sharma',
    designation: 'Chief Executive Officer',
    department: 'Executive',
    role: 'admin',
    employee_code: 'EMP001',
    employment_type: 'full_time',
    salary: {
      ctc_monthly: 250000,
      basic: 100000, hra: 50000, special_allowance: 74673,
      transport_allowance: 1600, medical_allowance: 1250, lta_monthly: 4167,
      pf_employer: 12000, gratuity_monthly: 4810, insurance_monthly: 1500,
      pf_employee: 12000, esi_employee: 0, esi_employer: 0, professional_tax: 200,
    },
  },
  {
    email: 'hradmin@prsk.demo',
    full_name: 'Priya Menon',
    designation: 'HR Manager',
    department: 'Human Resources',
    role: 'hr',
    employee_code: 'EMP002',
    employment_type: 'full_time',
    salary: {
      ctc_monthly: 80000,
      basic: 32000, hra: 16000, special_allowance: 21938,
      transport_allowance: 1600, medical_allowance: 1250, lta_monthly: 1333,
      pf_employer: 3840, gratuity_monthly: 1539, insurance_monthly: 500,
      pf_employee: 3840, esi_employee: 0, esi_employer: 0, professional_tax: 200,
    },
  },
  {
    email: 'accountant@prsk.demo',
    full_name: 'Rahul Gupta',
    designation: 'Senior Accountant',
    department: 'Finance & Accounts',
    role: 'accountant',
    employee_code: 'EMP003',
    employment_type: 'full_time',
    salary: {
      ctc_monthly: 65000,
      basic: 26000, hra: 13000, special_allowance: 17296,
      transport_allowance: 1600, medical_allowance: 1250, lta_monthly: 1083,
      pf_employer: 3120, gratuity_monthly: 1251, insurance_monthly: 400,
      pf_employee: 3120, esi_employee: 0, esi_employer: 0, professional_tax: 200,
    },
  },
  {
    email: 'employee@prsk.demo',
    full_name: 'Sneha Patel',
    designation: 'Software Engineer',
    department: 'Engineering',
    role: 'employee',
    employee_code: 'EMP004',
    employment_type: 'full_time',
    salary: {
      ctc_monthly: 60000,
      basic: 24000, hra: 12000, special_allowance: 15716,
      transport_allowance: 1600, medical_allowance: 1250, lta_monthly: 1000,
      pf_employer: 2880, gratuity_monthly: 1154, insurance_monthly: 400,
      pf_employee: 2880, esi_employee: 0, esi_employer: 0, professional_tax: 200,
    },
  },
]

export async function POST(req: NextRequest) {
  /* ── Guards ── */
  const isProd = process.env.NODE_ENV === 'production'
  const allowInProd = process.env.ALLOW_SEED_IN_PROD === 'true'
  if (isProd && !allowInProd) {
    return NextResponse.json({ error: 'Seed endpoint disabled in production' }, { status: 403 })
  }

  const token = req.nextUrl.searchParams.get('token')
  const secret = process.env.SEED_DEMO_SECRET
  if (secret && token !== secret) {
    return NextResponse.json({ error: 'Invalid seed token' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    /* ── 1. Ensure demo company exists ── */
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('name', DEMO_COMPANY_NAME)
      .maybeSingle()

    let companyId: string

    if (existingCompany) {
      companyId = existingCompany.id
    } else {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: DEMO_COMPANY_NAME,
          organization_id: 'prsk-demo',
          currency: 'INR',
          status: 'active',
        })
        .select('id')
        .single()
      if (companyError || !newCompany) {
        throw new Error(`Failed to create company: ${companyError?.message}`)
      }
      companyId = newCompany.id
    }

    /* ── 2. Create departments ── */
    const deptNames = [...new Set(DEMO_USERS.map(u => u.department))]
    const deptMap: Record<string, string> = {}

    for (const deptName of deptNames) {
      const { data: existingDept } = await supabase
        .from('departments')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', deptName)
        .maybeSingle()

      if (existingDept) {
        deptMap[deptName] = existingDept.id
      } else {
        const { data: dept, error: deptError } = await supabase
          .from('departments')
          .insert({ company_id: companyId, name: deptName, code: deptName.substring(0, 4).toUpperCase(), status: 'active' })
          .select('id')
          .single()
        if (!deptError && dept) deptMap[deptName] = dept.id
      }
    }

    /* ── 3. Create auth users + employee records ── */
    const results = []

    for (const demo of DEMO_USERS) {
      let authUserId: string | null = null
      let action = 'created'

      // Check if auth user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingAuthUser = existingUsers?.users?.find(u => u.email === demo.email)

      if (existingAuthUser) {
        authUserId = existingAuthUser.id
        action = 'existing'
        // Update password to known value
        await supabase.auth.admin.updateUserById(authUserId, { password: DEMO_PASSWORD })
      } else {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: demo.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: demo.full_name },
        })
        if (authError || !authData.user) {
          results.push({ email: demo.email, status: 'error', error: authError?.message })
          continue
        }
        authUserId = authData.user.id
      }

      // Upsert employee record
      const { data: existingEmp } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', authUserId)
        .maybeSingle()

      const employeePayload = {
        company_id: companyId,
        user_id: authUserId,
        employee_code: demo.employee_code,
        full_name: demo.full_name,
        email: demo.email,
        designation: demo.designation,
        department: demo.department,
        department_id: deptMap[demo.department] ?? null,
        role: demo.role,
        employment_type: demo.employment_type,
        status: 'active',
        date_of_joining: '2024-01-01',
      }

      let employeeId: string | null = null

      if (existingEmp) {
        await supabase.from('employees').update(employeePayload).eq('id', existingEmp.id)
        employeeId = existingEmp.id
        action = 'updated'
      } else {
        const { data: newEmp, error: empError } = await supabase
          .from('employees')
          .insert(employeePayload)
          .select('id')
          .single()
        if (empError || !newEmp) {
          results.push({ email: demo.email, status: 'error', error: empError?.message ?? 'Failed to insert employee' })
          continue
        }
        employeeId = newEmp.id
      }

      // Create default work schedule (Mon–Fri, 9–6) if not exists
      if (employeeId) {
        const { data: existingSchedule } = await supabase
          .from('work_schedules')
          .select('id')
          .eq('employee_id', employeeId)
          .limit(1)
          .maybeSingle()

        if (!existingSchedule) {
          const schedule = [1, 2, 3, 4, 5].map(day => ({
            employee_id: employeeId,
            day_of_week: day,
            start_time: '09:00',
            end_time: '18:00',
            is_working_day: true,
          }))
          await supabase.from('work_schedules').insert(schedule)
        }

        // Upsert salary structure
        const { data: existingSalary } = await supabase
          .from('salary_structures')
          .select('id')
          .eq('employee_id', employeeId)
          .eq('is_active', true)
          .maybeSingle()

        if (!existingSalary) {
          await supabase.from('salary_structures').insert({
            employee_id: employeeId,
            ...demo.salary,
            effective_from: '2024-01-01',
            is_active: true,
          })
        }

        // Upsert leave balances (standard Indian: 12 casual, 12 sick, 24 earned)
        const leaveTypes = [
          { leave_type: 'casual', total_days: 12 },
          { leave_type: 'sick',   total_days: 12 },
          { leave_type: 'earned', total_days: 24 },
        ]
        for (const lt of leaveTypes) {
          const { data: existingBalance } = await supabase
            .from('leave_balances')
            .select('id')
            .eq('employee_id', employeeId)
            .eq('leave_type', lt.leave_type)
            .maybeSingle()

          if (!existingBalance) {
            await supabase.from('leave_balances').insert({
              employee_id: employeeId,
              leave_type: lt.leave_type,
              total_days: lt.total_days,
              used_days: 0,
              available_days: lt.total_days,
              year: new Date().getFullYear(),
            })
          }
        }
      }

      results.push({
        email: demo.email,
        password: DEMO_PASSWORD,
        full_name: demo.full_name,
        role: demo.role,
        designation: demo.designation,
        status: action,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Demo seed complete. ${results.filter(r => r.status !== 'error').length}/${DEMO_USERS.length} accounts ready.`,
      company: DEMO_COMPANY_NAME,
      accounts: results,
    })
  } catch (err: any) {
    console.error('[seed-demo]', err)
    return NextResponse.json({ error: err.message ?? 'Seed failed' }, { status: 500 })
  }
}

/** GET — returns current seed status without creating anything */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const secret = process.env.SEED_DEMO_SECRET
  if (secret && token !== secret) {
    return NextResponse.json({ error: 'Invalid seed token' }, { status: 401 })
  }

  return NextResponse.json({
    accounts: DEMO_USERS.map(u => ({
      email: u.email,
      password: DEMO_PASSWORD,
      role: u.role,
      full_name: u.full_name,
      designation: u.designation,
    })),
    instructions: [
      '1. Call POST /api/v1/admin/seed-demo to create accounts',
      '2. Log in at /login with any of the accounts above',
      '3. Each role sees a different sidebar and dashboard',
    ],
  })
}
