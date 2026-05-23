'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  SearchInput, TabBar, StatCard, Modal, Input, Select, EmptyState, DetailGrid,
  Divider, ProgressBar, Textarea, ConfirmDialog
} from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { UserPlus, Download, Users, UserCheck, UserX, Clock, MoreHorizontal, Mail, Phone, MapPin, Briefcase, Calendar, DollarSign, Edit2, Trash2 } from 'lucide-react'

type Status = 'Active' | 'On Leave' | 'Terminated'
type Employee = {
  id: string; name: string; empId: string; dept: string; role: string;
  email: string; phone: string; status: Status; joined: string;
  salary: number; location: string; manager: string; reportees: number
}

const EMPLOYEES: Employee[] = [
  { id: '1', name: 'Priya Sharma', empId: 'EMP-001', dept: 'Engineering', role: 'Senior Software Engineer', email: 'priya.sharma@prsk.in', phone: '+91 98765 43210', status: 'Active', joined: '15 Jan 2023', salary: 1800000, location: 'Bengaluru', manager: 'Divya Nair', reportees: 3 },
  { id: '2', name: 'Rahul Mehta', empId: 'EMP-002', dept: 'Finance', role: 'Financial Analyst', email: 'rahul.mehta@prsk.in', phone: '+91 98765 43211', status: 'Active', joined: '03 Mar 2022', salary: 1200000, location: 'Mumbai', manager: 'Amit Patel', reportees: 0 },
  { id: '3', name: 'Ananya Iyer', empId: 'EMP-003', dept: 'HR', role: 'HR Business Partner', email: 'ananya.iyer@prsk.in', phone: '+91 98765 43212', status: 'Active', joined: '20 Jun 2023', salary: 1400000, location: 'Chennai', manager: 'Admin', reportees: 2 },
  { id: '4', name: 'Karan Singh', empId: 'EMP-004', dept: 'Sales', role: 'Account Executive', email: 'karan.singh@prsk.in', phone: '+91 98765 43213', status: 'On Leave', joined: '11 Sep 2021', salary: 1000000, location: 'Delhi', manager: 'Sneha Reddy', reportees: 0 },
  { id: '5', name: 'Divya Nair', empId: 'EMP-005', dept: 'Engineering', role: 'Engineering Manager', email: 'divya.nair@prsk.in', phone: '+91 98765 43214', status: 'Active', joined: '05 Feb 2024', salary: 2800000, location: 'Bengaluru', manager: 'Admin', reportees: 12 },
  { id: '6', name: 'Amit Patel', empId: 'EMP-006', dept: 'Operations', role: 'Operations Lead', email: 'amit.patel@prsk.in', phone: '+91 98765 43215', status: 'Active', joined: '18 Apr 2022', salary: 1600000, location: 'Ahmedabad', manager: 'Admin', reportees: 8 },
  { id: '7', name: 'Sneha Reddy', empId: 'EMP-007', dept: 'Sales', role: 'Sales Manager', email: 'sneha.reddy@prsk.in', phone: '+91 98765 43216', status: 'Active', joined: '22 Aug 2023', salary: 1800000, location: 'Hyderabad', manager: 'Admin', reportees: 6 },
  { id: '8', name: 'Vikram Joshi', empId: 'EMP-008', dept: 'Engineering', role: 'DevOps Engineer', email: 'vikram.joshi@prsk.in', phone: '+91 98765 43217', status: 'Terminated', joined: '01 Jan 2021', salary: 0, location: 'Bengaluru', manager: 'Divya Nair', reportees: 0 },
]

const DEPT_OPTIONS = [
  { label: 'All Departments', value: '' },
  ...['Engineering', 'Finance', 'HR', 'Sales', 'Operations', 'Marketing'].map(d => ({ label: d, value: d }))
]
const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'Active' },
  { label: 'On Leave', value: 'On Leave' },
  { label: 'Terminated', value: 'Terminated' },
]
const LOC_OPTIONS = [
  { label: 'Bengaluru', value: 'Bengaluru' }, { label: 'Mumbai', value: 'Mumbai' },
  { label: 'Delhi', value: 'Delhi' }, { label: 'Chennai', value: 'Chennai' },
  { label: 'Hyderabad', value: 'Hyderabad' }, { label: 'Ahmedabad', value: 'Ahmedabad' },
]

export default function HRMSPage() {
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('')
  const [status, setStatus] = useState('')
  const [tab, setTab] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [selected, setSelected] = useState<Employee | null>(null)
  const [confirmTerminate, setConfirmTerminate] = useState<Employee | null>(null)

  const active = EMPLOYEES.filter(e => e.status === 'Active').length
  const onLeave = EMPLOYEES.filter(e => e.status === 'On Leave').length
  const terminated = EMPLOYEES.filter(e => e.status === 'Terminated').length
  const totalPayroll = EMPLOYEES.filter(e => e.salary > 0).reduce((s, e) => s + e.salary, 0) / 12

  const filtered = useMemo(() => EMPLOYEES.filter(e => {
    const matchTab = tab === 'all' || (tab === 'active' && e.status === 'Active') || (tab === 'leave' && e.status === 'On Leave') || (tab === 'terminated' && e.status === 'Terminated')
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.empId.toLowerCase().includes(search.toLowerCase()) || e.dept.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase())
    const matchDept = !dept || e.dept === dept
    const matchStatus = !status || e.status === status
    return matchTab && matchSearch && matchDept && matchStatus
  }), [search, dept, status, tab])

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="HR Management"
        description="Manage employees, departments, and workforce data"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button size="sm" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setAddOpen(true)}>Add Employee</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={EMPLOYEES.length} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Active" value={active} icon={<UserCheck className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard label="On Leave" value={onLeave} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <StatCard label="Monthly Cost" value={formatCurrency(totalPayroll)} icon={<DollarSign className="h-4 w-4" />} iconColor="bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <SearchInput placeholder="Search by name, ID, role, department..." value={search} onChange={setSearch} className="w-full sm:w-80" />
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            <Select options={DEPT_OPTIONS} value={dept} onChange={e => setDept(e.target.value)} className="w-44 h-8 text-xs" />
            <Select options={STATUS_OPTIONS} value={status} onChange={e => setStatus(e.target.value)} className="w-36 h-8 text-xs" />
          </div>
        </div>

        <TabBar
          tabs={[
            { id: 'all', label: 'All Employees', count: EMPLOYEES.length },
            { id: 'active', label: 'Active', count: active },
            { id: 'leave', label: 'On Leave', count: onLeave },
            { id: 'terminated', label: 'Terminated', count: terminated },
          ]}
          active={tab}
          onChange={setTab}
          className="px-5"
        />

        {filtered.length === 0 ? (
          <EmptyState icon={<Users className="h-6 w-6" />} title="No employees found" description="Try adjusting your search or filters" />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Employee</Th><Th>Emp ID</Th><Th>Department</Th><Th>Location</Th>
                <Th>Joined</Th><Th align="right">Salary/yr</Th><Th>Status</Th><Th></Th>
              </tr>
            </Thead>
            <Tbody>
              {filtered.map(e => (
                <Tr key={e.id} onClick={() => setSelected(e)}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={e.name} size="sm" />
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{e.name}</p>
                        <p className="text-xs text-slate-400">{e.role}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><span className="font-mono text-xs text-slate-500">{e.empId}</span></Td>
                  <Td><Badge variant="neutral">{e.dept}</Badge></Td>
                  <Td>
                    <div className="flex items-center gap-1 text-slate-500">
                      <MapPin className="h-3 w-3" /><span className="text-xs">{e.location}</span>
                    </div>
                  </Td>
                  <Td><span className="text-xs text-slate-500">{e.joined}</span></Td>
                  <Td align="right">
                    <span className="data-value font-medium text-sm">{e.salary > 0 ? formatCurrency(e.salary) : '—'}</span>
                  </Td>
                  <Td>
                    <Badge variant={e.status === 'Active' ? 'success' : e.status === 'On Leave' ? 'warning' : 'neutral'} dot>
                      {e.status}
                    </Badge>
                  </Td>
                  <Td>
                    <button
                      onClick={ev => { ev.stopPropagation(); setSelected(e) }}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing <span className="font-medium">{filtered.length}</span> of <span className="font-medium">{EMPLOYEES.length}</span> employees</p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </Card>

      {/* Employee Detail Modal */}
      <Modal
        open={!!selected} onClose={() => setSelected(null)} title="Employee Profile" size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => { setConfirmTerminate(selected); setSelected(null) }}>
              Terminate
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" leftIcon={<Edit2 className="h-3.5 w-3.5" />}>Edit Profile</Button>
            <Button size="sm">View Payslips</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <Avatar name={selected.name} size="xl" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selected.name}</h3>
                <p className="text-sm text-slate-500">{selected.role}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={selected.status === 'Active' ? 'success' : selected.status === 'On Leave' ? 'warning' : 'neutral'} dot>
                    {selected.status}
                  </Badge>
                  <Badge variant="neutral">{selected.dept}</Badge>
                </div>
              </div>
            </div>
            <Divider />
            <DetailGrid items={[
              { label: 'Employee ID', value: <span className="font-mono">{selected.empId}</span> },
              { label: 'Email', value: <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{selected.email}</span> },
              { label: 'Phone', value: <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selected.phone}</span> },
              { label: 'Location', value: <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selected.location}</span> },
              { label: 'Date of Joining', value: <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{selected.joined}</span> },
              { label: 'Annual CTC', value: <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{selected.salary > 0 ? formatCurrency(selected.salary) : 'N/A'}</span> },
              { label: 'Reports To', value: <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{selected.manager}</span> },
              { label: 'Direct Reports', value: selected.reportees },
            ]} />
          </div>
        )}
      </Modal>

      {/* Add Employee Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Employee" size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button size="sm">Add Employee</Button>
        </>}
      >
        <form className="space-y-4" onSubmit={e => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" placeholder="e.g. Rahul Sharma" required />
            <Input label="Email" type="email" placeholder="rahul@company.com" required />
            <Input label="Phone" placeholder="+91 98765 43210" />
            <Select label="Department" options={DEPT_OPTIONS.slice(1)} />
            <Input label="Designation" placeholder="e.g. Software Engineer" required />
            <Input label="Date of Joining" type="date" />
            <Input label="Annual CTC (₹)" type="number" placeholder="1200000" />
            <Select label="Location" options={LOC_OPTIONS} />
          </div>
        </form>
      </Modal>

      {/* Terminate Confirm */}
      <ConfirmDialog
        open={!!confirmTerminate} onClose={() => setConfirmTerminate(null)}
        onConfirm={() => setConfirmTerminate(null)}
        title={`Terminate ${confirmTerminate?.name}?`}
        description="This will mark the employee as terminated. All active sessions and access will be revoked. This action can only be undone by HR Admins."
        confirmLabel="Terminate Employee"
      />
    </div>
  )
}
