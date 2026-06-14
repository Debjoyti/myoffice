'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  SearchInput, TabBar, StatCard, Modal, Input, Select, EmptyState, DetailGrid,
  Divider, ConfirmDialog, Alert
} from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  UserPlus, Users, UserCheck, UserX, MoreHorizontal,
  Briefcase, Calendar, RefreshCw, IndianRupee
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────────────────────── */
type Employee = {
  id: string
  employee_code: string
  full_name: string
  email: string
  phone: string | null
  designation: string
  department: string
  department_id: string | null
  employment_type: string
  status: string
  role: string
  date_of_joining: string
  avatar_url: string | null
  dept: { id: string; name: string; code: string } | null
  manager: { id: string; full_name: string; designation: string } | null
}

type Department = { id: string; name: string }

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  active:   'success',
  on_leave: 'warning',
  inactive: 'danger',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Active', on_leave: 'On Leave', inactive: 'Inactive',
}
const EMP_TYPE_LABEL: Record<string, string> = {
  full_time: 'Full-time', part_time: 'Part-time',
  contract: 'Contract', intern: 'Intern',
}
const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', hr: 'HR', manager: 'Manager', employee: 'Employee',
}

/* ── Add Employee Form ──────────────────────────────────────────────────────── */
const DEFAULT_FORM = {
  // Step 1 – Basic
  full_name: '', email: '', phone: '', date_of_birth: '', gender: '', blood_group: '',
  // Step 2 – Job
  designation: '', department: '', department_id: '', employment_type: 'full_time',
  role: 'employee', date_of_joining: new Date().toISOString().split('T')[0], work_location: '',
  // Step 3 – Compliance
  pan_number: '', aadhaar_number: '', uan_number: '',
  // Step 4 – Bank & Emergency
  bank_name: '', bank_account: '', bank_ifsc: '',
  emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
}

const ADD_EMP_STEPS = ['Basic Info', 'Job Details', 'Compliance', 'Bank & Emergency']

function AddEmployeeModal({
  open, onClose, departments, onSuccess,
}: {
  open: boolean; onClose: () => void
  departments: Department[]; onSuccess: () => void
}) {
  const [step, setStep]     = useState(0)
  const [form, setForm]     = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => { if (!open) { setForm(DEFAULT_FORM); setError(null); setStep(0) } }, [open])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!form.full_name.trim()) return 'Full Name is required'
      if (!form.email.trim()) return 'Work Email is required'
    }
    if (step === 1) {
      if (!form.designation.trim()) return 'Designation is required'
    }
    return null
  }

  const handleNext = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError(null)
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload: Record<string, string> = {}
      // Only send non-empty fields
      Object.entries(form).forEach(([k, v]) => { if (v) payload[k] = v })

      const res = await fetch('/api/v1/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? data.error ?? 'Failed to create employee')
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deptOptions = [
    { label: 'Select department', value: '' },
    ...departments.map(d => ({ label: d.name, value: d.id })),
  ]

  const stepContent = [
    /* Step 0 – Basic Info */
    <div key="basic" className="space-y-4">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Personal Details</p>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name *" required value={form.full_name}
          onChange={e => set('full_name', e.target.value)} placeholder="e.g. Rahul Sharma" />
        <Input label="Work Email *" type="email" required value={form.email}
          onChange={e => set('email', e.target.value)} placeholder="rahul@company.com" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Phone Number" value={form.phone}
          onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
        <Input label="Date of Birth" type="date" value={form.date_of_birth}
          onChange={e => set('date_of_birth', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Gender" value={form.gender} onChange={e => set('gender', (e.target as HTMLSelectElement).value)}
          options={[
            { label: 'Select…', value: '' },
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
            { label: 'Non-binary', value: 'non_binary' },
            { label: 'Prefer not to say', value: 'prefer_not_to_say' },
          ]}
        />
        <Select label="Blood Group" value={form.blood_group} onChange={e => set('blood_group', (e.target as HTMLSelectElement).value)}
          options={[
            { label: 'Select…', value: '' },
            ...['A+','A−','B+','B−','AB+','AB−','O+','O−'].map(g => ({ label: g, value: g })),
          ]}
        />
      </div>
    </div>,

    /* Step 1 – Job Details */
    <div key="job" className="space-y-4">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Job & Role</p>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Designation *" required value={form.designation}
          onChange={e => set('designation', e.target.value)} placeholder="e.g. Software Engineer" />
        <Select label="Department" value={form.department_id}
          onChange={e => {
            const dept = departments.find(d => d.id === e.target.value)
            set('department_id', e.target.value)
            set('department', dept?.name ?? '')
          }}
          options={deptOptions}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Employment Type" value={form.employment_type}
          onChange={e => set('employment_type', (e.target as HTMLSelectElement).value)}
          options={[
            { label: 'Full-time', value: 'full_time' },
            { label: 'Part-time', value: 'part_time' },
            { label: 'Contract', value: 'contract' },
            { label: 'Intern', value: 'intern' },
          ]}
        />
        <Select label="System Role" value={form.role}
          onChange={e => set('role', (e.target as HTMLSelectElement).value)}
          options={[
            { label: 'Employee', value: 'employee' },
            { label: 'Manager', value: 'manager' },
            { label: 'HR', value: 'hr' },
            { label: 'Accountant', value: 'accountant' },
            { label: 'Admin', value: 'admin' },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date of Joining" type="date" value={form.date_of_joining}
          onChange={e => set('date_of_joining', e.target.value)} />
        <Input label="Work Location / Office" value={form.work_location}
          onChange={e => set('work_location', e.target.value)} placeholder="e.g. Kolkata HQ / Remote" />
      </div>
    </div>,

    /* Step 2 – Compliance */
    <div key="compliance" className="space-y-4">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Statutory & Compliance</p>
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <p className="text-xs text-blue-700">These details are used for PF, ESI, TDS, and payslip generation. They can also be added later from the employee profile.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="PAN Number" value={form.pan_number}
          onChange={e => set('pan_number', e.target.value.toUpperCase())} placeholder="e.g. ABCDE1234F"
          maxLength={10} />
        <Input label="Aadhaar Number" value={form.aadhaar_number}
          onChange={e => set('aadhaar_number', e.target.value)} placeholder="12-digit Aadhaar"
          maxLength={12} />
      </div>
      <Input label="UAN (Universal Account Number)" value={form.uan_number}
        onChange={e => set('uan_number', e.target.value)} placeholder="12-digit UAN for PF" maxLength={12} />
    </div>,

    /* Step 3 – Bank & Emergency */
    <div key="bank" className="space-y-4">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bank Account</p>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Bank Name" value={form.bank_name}
          onChange={e => set('bank_name', e.target.value)} placeholder="e.g. State Bank of India" />
        <Input label="Account Number" value={form.bank_account}
          onChange={e => set('bank_account', e.target.value)} placeholder="Account number" />
      </div>
      <Input label="IFSC Code" value={form.bank_ifsc}
        onChange={e => set('bank_ifsc', e.target.value.toUpperCase())} placeholder="e.g. SBIN0001234" maxLength={11} />

      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-2">Emergency Contact</p>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Contact Name" value={form.emergency_contact_name}
          onChange={e => set('emergency_contact_name', e.target.value)} placeholder="e.g. Sunita Sharma" />
        <Input label="Relation" value={form.emergency_contact_relation}
          onChange={e => set('emergency_contact_relation', e.target.value)} placeholder="e.g. Spouse / Parent" />
      </div>
      <Input label="Contact Phone" value={form.emergency_contact_phone}
        onChange={e => set('emergency_contact_phone', e.target.value)} placeholder="+91 98765 43210" />
    </div>,
  ]

  return (
    <Modal open={open} onClose={onClose} title="Add New Employee" size="lg"
      footer={<>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
        {step > 0 && (
          <Button variant="outline" size="sm" onClick={() => { setError(null); setStep(s => s - 1) }} disabled={saving}>← Back</Button>
        )}
        {step < ADD_EMP_STEPS.length - 1
          ? <Button size="sm" onClick={handleNext}>Next →</Button>
          : <Button size="sm" loading={saving} onClick={handleSubmit}>Create Employee</Button>
        }
      </>}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6">
        {ADD_EMP_STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium whitespace-nowrap
                ${i === step ? 'text-blue-600' : i < step ? 'text-emerald-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < ADD_EMP_STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-1 mb-3 transition-colors ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {error && <div className="mb-4"><Alert variant="danger">{error}</Alert></div>}
      {stepContent[step]}
    </Modal>
  )
}

/* ── Employee Detail Drawer ─────────────────────────────────────────────────── */
function EmployeeDetailModal({
  employee, onClose, onDeactivate, canManage, onSetSalary,
}: {
  employee: Employee | null; onClose: () => void; onDeactivate: (id: string) => void
  canManage: boolean; onSetSalary: (emp: Employee) => void
}) {
  const [activeCTC, setActiveCTC] = useState<number | null>(null)

  useEffect(() => {
    if (employee && canManage) {
      fetch(`/api/v1/admin/salary-structures?employee_id=${employee.id}`)
        .then(r => r.json())
        .then(d => {
          const active = d.salary_structures?.find((s: any) => s.is_active)
          setActiveCTC(active?.ctc_monthly ?? null)
        })
        .catch(() => setActiveCTC(null))
    } else {
      setActiveCTC(null)
    }
  }, [employee, canManage])

  if (!employee) return null
  return (
    <Modal open={!!employee} onClose={onClose} title="Employee Profile" size="lg">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Avatar name={employee.full_name} src={employee.avatar_url ?? undefined} size="xl" />
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">{employee.full_name}</h3>
            <p className="text-sm text-slate-500">{employee.designation}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant={STATUS_VARIANT[employee.status] ?? 'neutral'} dot>
                {STATUS_LABEL[employee.status] ?? employee.status}
              </Badge>
              <Badge variant="neutral">{EMP_TYPE_LABEL[employee.employment_type] ?? employee.employment_type}</Badge>
              <Badge variant="info">{ROLE_LABEL[employee.role] ?? employee.role}</Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Employee Code</p>
            <p className="font-mono text-sm font-semibold text-slate-700">{employee.employee_code}</p>
          </div>
        </div>

        <Divider />

        <DetailGrid cols={2} items={[
          { label: 'Email',           value: employee.email },
          { label: 'Phone',           value: employee.phone ?? '—' },
          { label: 'Department',      value: employee.dept?.name ?? employee.department ?? '—' },
          { label: 'Manager',         value: employee.manager?.full_name ?? '—' },
          { label: 'Date of Joining', value: formatDate(employee.date_of_joining) },
          { label: 'Status',          value: STATUS_LABEL[employee.status] ?? employee.status },
        ]} />

        {/* Salary row — visible only to HR/Admin */}
        {canManage && (
          <>
            <Divider label="Compensation" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Current CTC (Monthly)</p>
                {activeCTC !== null ? (
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(activeCTC)}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">Not set — salary structure pending</p>
                )}
              </div>
              {employee.status === 'active' && (
                <Button size="sm" variant="outline" leftIcon={<IndianRupee className="h-3.5 w-3.5" />}
                  onClick={() => onSetSalary(employee)}>
                  {activeCTC ? 'Revise Salary' : 'Set Salary'}
                </Button>
              )}
            </div>
          </>
        )}

        {employee.status === 'active' && (
          <div className="flex justify-end pt-2">
            <Button variant="danger" size="sm" onClick={() => { onDeactivate(employee.id); onClose() }}>
              Deactivate Employee
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ── Salary Breakdown Calc (Indian Payroll) ─────────────────────────────────── */
function calcSalaryComponents(ctcMonthly: number) {
  const basic              = Math.round(ctcMonthly * 0.40)
  const hra                = Math.round(basic * 0.50)
  const transport          = 1600
  const medical            = 1250
  const lta                = Math.round(basic * 0.05 / 12)
  const pfEmployee         = Math.min(Math.round(basic * 0.12), 1800)
  const pfEmployer         = Math.min(Math.round(basic * 0.12), 1800)
  const gratuity           = Math.round(basic * 0.0481)
  const insurance          = Math.round(ctcMonthly * 0.005)
  const grossEarnings      = basic + hra + transport + medical + lta
  const esiEmployee        = grossEarnings <= 21000 ? Math.round(grossEarnings * 0.0075) : 0
  const esiEmployer        = grossEarnings <= 21000 ? Math.round(grossEarnings * 0.0325) : 0
  const pt                 = grossEarnings > 10000 ? 200 : 0
  const totalBenefits      = pfEmployer + gratuity + insurance
  const special            = Math.max(0, ctcMonthly - basic - hra - transport - medical - lta - totalBenefits)
  return {
    basic, hra, special_allowance: special, transport_allowance: transport,
    medical_allowance: medical, lta_monthly: lta,
    pf_employee: pfEmployee, pf_employer: pfEmployer,
    esi_employee: esiEmployee, esi_employer: esiEmployer,
    professional_tax: pt, gratuity_monthly: gratuity, insurance_monthly: insurance,
  }
}

/* ── Manage Departments Modal ─────────────────────────────────────────────────── */
function ManageDepartmentsModal({
  open, onClose, departments, onChanged,
}: {
  open: boolean; onClose: () => void
  departments: (Department & { code?: string | null; headcount?: number })[]
  onChanged: () => void
}) {
  const [name, setName]       = useState('')
  const [code, setCode]       = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => { if (!open) { setName(''); setCode(''); setError(null) } }, [open])

  const handleAdd = async () => {
    if (!name.trim()) { setError('Department name is required'); return }
    setSaving(true)
    setError(null)
    try {
      const payload: Record<string, string> = { name: name.trim() }
      if (code.trim()) payload.code = code.trim().toUpperCase()
      const res = await fetch('/api/v1/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? data.error?.fieldErrors?.name?.[0] ?? data.error ?? 'Failed to create department')
      setName(''); setCode('')
      onChanged()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Manage Departments" size="md"
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4">
        {error && <Alert variant="danger">{error}</Alert>}

        <div>
          <p className="text-xs font-semibold text-slate-700 mb-2">Add a new department</p>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input label="Department Name" placeholder="e.g. Engineering" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="w-28">
              <Input label="Code (optional)" placeholder="ENG" value={code} onChange={e => setCode(e.target.value)} />
            </div>
            <Button onClick={handleAdd} loading={saving}>Add</Button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Departments power segregation across HRMS — filtering employees, org chart grouping, and reporting.
          </p>
        </div>

        <Divider />

        <div>
          <p className="text-xs font-semibold text-slate-700 mb-2">Existing departments ({departments.length})</p>
          {departments.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-8 w-8" />}
              title="No departments yet"
              description="Add your first department above to start segregating employees by team."
            />
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {departments.map(d => (
                <div key={d.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-slate-800 truncate">{d.name}</span>
                    {d.code && <Badge variant="neutral" size="sm">{d.code}</Badge>}
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{d.headcount ?? 0} employees</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

/* ── Set Salary Modal ────────────────────────────────────────────────────────── */
function SetSalaryModal({ employee, open, onClose, onSuccess }: {
  employee: Employee | null; open: boolean; onClose: () => void; onSuccess: () => void
}) {
  const [ctc, setCtc]           = useState('')
  const [effective, setEffective] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [existingCTC, setExistingCTC] = useState<number | null>(null)

  useEffect(() => {
    if (open && employee) {
      setCtc('')
      setError(null)
      // Load existing structure
      fetch(`/api/v1/admin/salary-structures?employee_id=${employee.id}`)
        .then(r => r.json())
        .then(d => {
          const active = d.salary_structures?.find((s: any) => s.is_active)
          setExistingCTC(active?.ctc_monthly ?? null)
        })
        .catch(() => {})
    }
  }, [open, employee])

  const ctcNum = parseFloat(ctc) || 0
  const comps  = ctcNum > 0 ? calcSalaryComponents(ctcNum) : null

  const handleSave = async () => {
    if (!employee || ctcNum <= 0) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/admin/salary-structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employee.id,
          effective_from: effective,
          ctc_monthly: ctcNum,
          ...(comps ?? {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to save salary structure')
        return
      }
      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!employee) return null
  return (
    <Modal open={open} onClose={onClose} title="Set Salary Structure" size="lg"
      footer={<>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={handleSave} disabled={ctcNum <= 0}>
          Save Structure
        </Button>
      </>}
    >
      <div className="space-y-4">
        {existingCTC !== null && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            <IndianRupee className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Current CTC: <strong>{formatCurrency(existingCTC)}/month</strong>. Saving will create a new revision.</span>
          </div>
        )}
        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="CTC Monthly (₹)"
            type="number"
            placeholder="e.g. 100000"
            value={ctc}
            onChange={e => setCtc(e.target.value)}
            required
          />
          <Input
            label="Effective From"
            type="date"
            value={effective}
            onChange={e => setEffective(e.target.value)}
          />
        </div>

        {comps && (
          <>
            <Divider label="Auto-calculated components (Indian Payroll)" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              {[
                ['Basic', comps.basic],
                ['HRA', comps.hra],
                ['Special Allowance', comps.special_allowance],
                ['Transport', comps.transport_allowance],
                ['Medical', comps.medical_allowance],
                ['LTA', comps.lta_monthly],
                ['PF (Employee)', comps.pf_employee],
                ['PF (Employer)', comps.pf_employer],
                ['ESI (Employee)', comps.esi_employee],
                ['ESI (Employer)', comps.esi_employer],
                ['Professional Tax', comps.professional_tax],
                ['Gratuity', comps.gratuity_monthly],
                ['Insurance', comps.insurance_monthly],
              ].map(([label, val]) => (
                <div key={label as string} className="flex justify-between border-b border-slate-50 pb-1">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-700 tabular-nums">{formatCurrency(val as number)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center py-2 bg-blue-50 rounded-lg px-3 mt-1">
              <span className="text-sm font-semibold text-blue-800">Total CTC Monthly</span>
              <span className="text-sm font-bold text-blue-700 tabular-nums">{formatCurrency(ctcNum)}</span>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function HRMSPage() {
  const [employees,    setEmployees]    = useState<Employee[]>([])
  const [departments,  setDepartments]  = useState<Department[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [search,       setSearch]       = useState('')
  const [deptFilter,   setDeptFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [tab,          setTab]          = useState('all')
  const [addOpen,        setAddOpen]        = useState(false)
  const [selected,       setSelected]       = useState<Employee | null>(null)
  const [confirmDeact,   setConfirmDeact]   = useState<string | null>(null)
  const [deacting,       setDeacting]       = useState(false)
  const [canCreate,      setCanCreate]      = useState(false)
  const [salaryTarget,   setSalaryTarget]   = useState<Employee | null>(null)
  const [deptManageOpen, setDeptManageOpen] = useState(false)

  /* Fetch employees + check role */
  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ status: statusFilter || 'all' })
      if (deptFilter) params.set('department_id', deptFilter)
      const [res, meRes] = await Promise.all([
        fetch(`/api/v1/employees?${params}`),
        fetch('/api/v1/me'),
      ])
      if (!res.ok) {
        const d = await res.json()
        if (res.status === 403) { setCanCreate(false); setEmployees([]); setLoading(false); return }
        throw new Error(d.error ?? 'Failed to load employees')
      }
      const data = await res.json()
      setEmployees(data.employees ?? [])
      // Only admin/hr can add employees; accountant can only view
      if (meRes.ok) {
        const meData = await meRes.json()
        setCanCreate(['admin', 'hr'].includes(meData.employee?.role ?? ''))
      } else {
        setCanCreate(false)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, deptFilter])

  /* Fetch departments for filter + add form */
  const fetchDepartments = useCallback(() => {
    fetch('/api/v1/departments')
      .then(r => r.json())
      .then(d => setDepartments(d.departments ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchDepartments()
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  /* Stats */
  const active   = employees.filter(e => e.status === 'active').length
  const onLeave  = employees.filter(e => e.status === 'on_leave').length
  const inactive = employees.filter(e => e.status === 'inactive').length

  /* Filter */
  const filtered = useMemo(() =>
    employees.filter(e => {
      if (tab === 'active'   && e.status !== 'active')   return false
      if (tab === 'on_leave' && e.status !== 'on_leave') return false
      if (tab === 'inactive' && e.status !== 'inactive') return false
      if (search) {
        const q = search.toLowerCase()
        return e.full_name.toLowerCase().includes(q)
          || e.email.toLowerCase().includes(q)
          || e.designation.toLowerCase().includes(q)
          || (e.dept?.name ?? e.department ?? '').toLowerCase().includes(q)
          || e.employee_code.toLowerCase().includes(q)
      }
      return true
    }),
    [employees, tab, search]
  )

  /* Deactivate */
  const handleDeactivate = async (id: string) => {
    setDeacting(true)
    try {
      await fetch(`/api/v1/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'inactive' }),
      })
      fetchEmployees()
    } finally {
      setDeacting(false)
      setConfirmDeact(null)
    }
  }

  const deptOptions = [
    { label: 'All Departments', value: '' },
    ...departments.map(d => ({ label: d.name, value: d.id })),
  ]

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="HRMS"
        description="Manage employees, departments, and organisational structure"
        actions={
          canCreate && (
            <Button leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setAddOpen(true)}>
              Add Employee
            </Button>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={employees.length} accent="blue"
          icon={<Users className="h-4 w-4" />} loading={loading} />
        <StatCard label="Active" value={active} accent="emerald"
          icon={<UserCheck className="h-4 w-4" />} loading={loading} />
        <StatCard label="On Leave" value={onLeave} accent="amber"
          icon={<Calendar className="h-4 w-4" />} loading={loading} />
        <StatCard label="Inactive" value={inactive} accent="rose"
          icon={<UserX className="h-4 w-4" />} loading={loading} />
      </div>

      {/* Table */}
      <Card padding="none">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <SearchInput
              placeholder="Search by name, email, role…"
              value={search} onChange={setSearch}
              className="w-64"
            />
            <select
              value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white text-sm text-slate-700 px-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {deptOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white text-sm text-slate-700 px-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="inactive">Inactive</option>
              <option value="all">All Status</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {canCreate && (
              <Button variant="outline" size="sm" leftIcon={<Briefcase className="h-3 w-3" />} onClick={() => setDeptManageOpen(true)}>
                Manage Departments
              </Button>
            )}
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3 w-3" />} onClick={() => fetchEmployees()}>
              Refresh
            </Button>
          </div>
        </div>

        <TabBar
          className="px-4"
          tabs={[
            { id: 'all',      label: 'All',       count: employees.length },
            { id: 'active',   label: 'Active',    count: active },
            { id: 'on_leave', label: 'On Leave',  count: onLeave },
            { id: 'inactive', label: 'Inactive',  count: inactive },
          ]}
          active={tab} onChange={setTab}
        />

        {error && <div className="p-4"><Alert variant="danger">{error}</Alert></div>}

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
              Loading employees…
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No employees found"
            description={search ? 'Try adjusting your search or filters' : 'Add your first employee to get started'}
            action={canCreate ? (
              <Button size="sm" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setAddOpen(true)}>
                Add Employee
              </Button>
            ) : undefined}
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Employee</Th>
                <Th>Department</Th>
                <Th>Type</Th>
                <Th>Manager</Th>
                <Th>Joined</Th>
                <Th>Status</Th>
                <Th align="center">Action</Th>
              </tr>
            </Thead>
            <Tbody>
              {filtered.map(emp => (
                <Tr key={emp.id} onClick={() => setSelected(emp)}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={emp.full_name} src={emp.avatar_url ?? undefined} size="sm" />
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{emp.full_name}</p>
                        <p className="text-xs text-slate-400">{emp.designation}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-sm text-slate-600">{emp.dept?.name ?? emp.department ?? '—'}</span>
                  </Td>
                  <Td>
                    <Badge variant="neutral" size="sm">
                      {EMP_TYPE_LABEL[emp.employment_type] ?? emp.employment_type}
                    </Badge>
                  </Td>
                  <Td>
                    <span className="text-sm text-slate-500">{emp.manager?.full_name ?? '—'}</span>
                  </Td>
                  <Td>
                    <span className="text-sm text-slate-500">
                      {formatDate(emp.date_of_joining)}
                    </span>
                  </Td>
                  <Td>
                    <Badge variant={STATUS_VARIANT[emp.status] ?? 'neutral'} dot size="sm">
                      {STATUS_LABEL[emp.status] ?? emp.status}
                    </Badge>
                  </Td>
                  <Td align="center">
                    <button
                      onClick={e => { e.stopPropagation(); setSelected(emp) }}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {employees.length} employees
          </div>
        )}
      </Card>

      {/* Modals */}
      <AddEmployeeModal
        open={addOpen} onClose={() => setAddOpen(false)}
        departments={departments} onSuccess={fetchEmployees}
      />
      <EmployeeDetailModal
        employee={selected} onClose={() => setSelected(null)}
        onDeactivate={id => setConfirmDeact(id)}
        canManage={canCreate}
        onSetSalary={emp => { setSelected(null); setSalaryTarget(emp) }}
      />
      <SetSalaryModal
        employee={salaryTarget}
        open={!!salaryTarget}
        onClose={() => setSalaryTarget(null)}
        onSuccess={fetchEmployees}
      />
      <ManageDepartmentsModal
        open={deptManageOpen}
        onClose={() => setDeptManageOpen(false)}
        departments={departments}
        onChanged={fetchDepartments}
      />
      <ConfirmDialog
        open={!!confirmDeact} onClose={() => setConfirmDeact(null)}
        onConfirm={() => confirmDeact && handleDeactivate(confirmDeact)}
        title="Deactivate Employee"
        description="This will mark the employee as inactive. They will lose system access. This action can be reversed later."
        confirmLabel="Deactivate"
        variant="danger"
        loading={deacting}
      />
    </div>
  )
}
