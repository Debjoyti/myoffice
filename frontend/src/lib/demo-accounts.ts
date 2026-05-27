export const DEMO_PASSWORD = 'Demo@123456'
export const DEMO_COMPANY_NAME = 'PRSK Technologies Pvt Ltd'

type DemoUser = {
  email: string
  full_name: string
  designation: string
  department: string
  role: 'admin' | 'hr' | 'accountant' | 'employee'
  employee_code: string
  employment_type: string
}

export const DEMO_USERS: DemoUser[] = [
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

export function getDemoUser(email: string) {
  return DEMO_USERS.find((user) => user.email === email.trim().toLowerCase())
}

export function isDemoCredential(email: string, password: string) {
  return Boolean(getDemoUser(email) && password === DEMO_PASSWORD)
}
