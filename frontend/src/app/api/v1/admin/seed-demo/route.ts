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

type DemoUser = {
  email: string
  full_name: string
  designation: string
  department: string
  role: 'admin' | 'hr' | 'accountant' | 'employee'
  employee_code: string
  employment_type: string
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
  },
  {
    email: 'hradmin@prsk.demo',
    full_name: 'Priya Menon',
    designation: 'HR Manager',
    department: 'Human Resources',
    role: 'hr',
    employee_code: 'EMP002',
    employment_type: 'full_time',
  },
  {
    email: 'accountant@prsk.demo',
    full_name: 'Rahul Gupta',
    designation: 'Senior Accountant',
    department: 'Finance & Accounts',
    role: 'accountant',
    employee_code: 'EMP003',
    employment_type: 'full_time',
  },
  {
    email: 'employee@prsk.demo',
    full_name: 'Sneha Patel',
    designation: 'Software Engineer',
    department: 'Engineering',
    role: 'employee',
    employee_code: 'EMP004',
    employment_type: 'full_time',
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

      if (existingEmp) {
        await supabase.from('employees').update(employeePayload).eq('id', existingEmp.id)
        action = 'updated'
      } else {
        const { error: empError } = await supabase.from('employees').insert(employeePayload)
        if (empError) {
          results.push({ email: demo.email, status: 'error', error: empError.message })
          continue
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
