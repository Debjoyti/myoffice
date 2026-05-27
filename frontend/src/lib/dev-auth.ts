/**
 * Dev-only hardcoded auth bypass.
 * Active when DEV_BYPASS_AUTH=true in .env.local.
 * Never runs in production (env var is not set there).
 */

export const DEV_SESSION_COOKIE = 'prsk_dev_session'

export type DevEmployee = {
  id: string
  user_id: string
  company_id: string
  employee_code: string
  full_name: string
  email: string
  phone: null
  designation: string
  department: string
  department_id: null
  position_id: null
  manager_id: null
  avatar_url: null
  date_of_joining: string
  date_of_birth: null
  employment_type: string
  status: string
  role: 'admin' | 'hr' | 'manager' | 'employee' | 'accountant'
  pan_number: null
  bank_account: null
  bank_ifsc: null
  bank_name: null
  emergency_contact_name: null
  emergency_contact_phone: null
}

const BASE = {
  company_id: 'demo-company-id',
  phone: null,
  department_id: null,
  position_id: null,
  manager_id: null,
  avatar_url: null,
  date_of_joining: '2023-01-01',
  date_of_birth: null,
  employment_type: 'full_time',
  status: 'active',
  pan_number: null,
  bank_account: null,
  bank_ifsc: null,
  bank_name: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
} as const

export const DEV_DEMO_USERS: Record<string, DevEmployee> = {
  'superadmin@prsk.demo': {
    ...BASE,
    id: 'dev-emp-001',
    user_id: 'dev-user-001',
    employee_code: 'EMP001',
    full_name: 'Priya Sharma',
    email: 'superadmin@prsk.demo',
    designation: 'HR Director',
    department: 'Human Resources',
    role: 'admin',
  },
  'hradmin@prsk.demo': {
    ...BASE,
    id: 'dev-emp-002',
    user_id: 'dev-user-002',
    employee_code: 'EMP002',
    full_name: 'Ravi Kumar',
    email: 'hradmin@prsk.demo',
    designation: 'HR Manager',
    department: 'Human Resources',
    role: 'hr',
  },
  'accountant@prsk.demo': {
    ...BASE,
    id: 'dev-emp-003',
    user_id: 'dev-user-003',
    employee_code: 'EMP003',
    full_name: 'Anita Patel',
    email: 'accountant@prsk.demo',
    designation: 'Senior Accountant',
    department: 'Finance',
    role: 'accountant',
  },
  'employee@prsk.demo': {
    ...BASE,
    id: 'dev-emp-004',
    user_id: 'dev-user-004',
    employee_code: 'EMP004',
    full_name: 'Arjun Singh',
    email: 'employee@prsk.demo',
    designation: 'Software Engineer',
    department: 'Engineering',
    role: 'employee',
  },
}

export function isDevBypass(): boolean {
  return process.env.DEV_BYPASS_AUTH === 'true'
}

export function getDevUserByEmail(email: string): DevEmployee | null {
  return DEV_DEMO_USERS[email] ?? null
}
