'use client'

import { StatCard, Card, CardHeader, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td, PageHeader } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  Users, Clock, Banknote, TrendingUp, AlertCircle, CheckCircle2,
  ArrowRight, CalendarDays, UserPlus, FileText, ShieldCheck
} from 'lucide-react'

const kpis = [
  { label: 'Total Employees', value: '284', delta: { value: '3 new', positive: true }, icon: <Users className="h-4 w-4" /> },
  { label: 'Present Today', value: '241', delta: { value: '84.9%', positive: true }, icon: <Clock className="h-4 w-4" />, iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { label: 'Monthly Payroll', value: formatCurrency(42_80_000), delta: { value: '2.1%', positive: true }, icon: <Banknote className="h-4 w-4" />, iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  { label: 'Revenue MTD', value: formatCurrency(1_24_50_000), delta: { value: '8.3%', positive: true }, icon: <TrendingUp className="h-4 w-4" />, iconColor: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' },
]

const recentEmployees = [
  { name: 'Priya Sharma', dept: 'Engineering', role: 'Sr. Engineer', joined: '10 May 2026', status: 'Active' },
  { name: 'Rahul Mehta', dept: 'Finance', role: 'Analyst', joined: '08 May 2026', status: 'Active' },
  { name: 'Ananya Iyer', dept: 'HR', role: 'HRBP', joined: '05 May 2026', status: 'Onboarding' },
  { name: 'Karan Singh', dept: 'Sales', role: 'AE', joined: '01 May 2026', status: 'Active' },
]

const pendingActions = [
  { icon: <FileText className="h-4 w-4" />, title: '5 leave requests pending approval', urgency: 'warning' as const, link: '/hrms' },
  { icon: <AlertCircle className="h-4 w-4" />, title: '3 employees with expiring documents', urgency: 'danger' as const, link: '/hrms' },
  { icon: <UserPlus className="h-4 w-4" />, title: '2 onboarding tasks incomplete', urgency: 'warning' as const, link: '/hrms' },
  { icon: <ShieldCheck className="h-4 w-4" />, title: 'Payroll for May ready to process', urgency: 'info' as const, link: '/payroll' },
]

const upcomingEvents = [
  { title: 'All-Hands Meeting', date: 'Today, 3:00 PM', type: 'Meeting' },
  { title: 'Payroll Processing — May', date: 'Tomorrow', type: 'Payroll' },
  { title: 'Q2 Review', date: '16 May', type: 'Review' },
  { title: 'Compliance Filing Deadline', date: '20 May', type: 'Compliance' },
]

const modules = [
  { name: 'HRMS', desc: 'People & org management', href: '/hrms', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30', stat: '284 employees' },
  { name: 'Attendance', desc: 'Time & leave tracking', href: '/attendance', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30', stat: '84.9% present' },
  { name: 'Payroll', desc: 'Salary & compliance', href: '/payroll', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30', stat: 'May pending' },
  { name: 'Finance', desc: 'Accounting & expenses', href: '/finance', color: 'text-sky-600 bg-sky-50 dark:bg-sky-900/30', stat: '₹1.24Cr MTD' },
  { name: 'Procurement', desc: 'PO & vendor management', href: '/procurement', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30', stat: '12 open POs' },
  { name: 'CRM', desc: 'Leads & deals', href: '/crm', color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30', stat: '₹48L pipeline' },
]

export default function DashboardHome() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Good morning, Admin 👋"
        description="Tuesday, 13 May 2026 · PRSK Technologies Pvt. Ltd."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Hires */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <CardHeader
              title="Recent Hires"
              description="Employees who joined this month"
              className="px-5 pt-5"
              action={<Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>View all</Button>}
            />
            <Table>
              <Thead>
                <tr>
                  <Th>Employee</Th>
                  <Th>Department</Th>
                  <Th>Joined</Th>
                  <Th>Status</Th>
                </tr>
              </Thead>
              <Tbody>
                {recentEmployees.map(e => (
                  <Tr key={e.name}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={e.name} size="sm" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{e.name}</p>
                          <p className="text-xs text-slate-400">{e.role}</p>
                        </div>
                      </div>
                    </Td>
                    <Td><span className="text-slate-600 dark:text-slate-400">{e.dept}</span></Td>
                    <Td><span className="text-slate-500">{e.joined}</span></Td>
                    <Td>
                      <Badge variant={e.status === 'Active' ? 'success' : 'warning'} dot>
                        {e.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Action Items */}
          <Card padding="none">
            <CardHeader title="Action Required" description="Items needing attention" className="px-4 pt-4" />
            <div className="px-2 pb-2 space-y-0.5">
              {pendingActions.map(a => (
                <button key={a.title} className="w-full flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors group">
                  <span className={`mt-0.5 flex-shrink-0 ${a.urgency === 'danger' ? 'text-red-500' : a.urgency === 'warning' ? 'text-amber-500' : 'text-blue-500'}`}>
                    {a.icon}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 leading-snug">{a.title}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Upcoming */}
          <Card padding="none">
            <CardHeader title="Upcoming" className="px-4 pt-4" />
            <div className="px-2 pb-2 space-y-0.5">
              {upcomingEvents.map(e => (
                <div key={e.title} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{e.title}</p>
                    <p className="text-xs text-slate-400">{e.date}</p>
                  </div>
                  <Badge variant="neutral" size="sm">{e.type}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Module Quick Access */}
      <Card padding="none">
        <CardHeader title="Modules" description="Jump to any module" className="px-5 pt-5" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-slate-100 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800">
          {modules.map(m => (
            <a key={m.name} href={m.href} className="flex flex-col gap-2 p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
              <span className={`text-xs font-semibold px-2 py-1 rounded-md w-fit ${m.color}`}>{m.name}</span>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{m.desc}</p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{m.stat}</p>
              </div>
            </a>
          ))}
        </div>
      </Card>
    </div>
  )
}
