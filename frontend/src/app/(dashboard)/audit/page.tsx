'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, Select, EmptyState
} from '@/components/ui'
import { ShieldCheck, History, AlertTriangle, Activity, Download } from 'lucide-react'

type Module = 'Auth' | 'HRMS' | 'Finance' | 'Payroll' | 'CRM' | 'Settings' | 'Procurement'
type Action = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT'

type AuditLog = {
  id: string; user: string; action: Action; module: Module
  description: string; ip: string; timestamp: string; risk: 'Low' | 'Medium' | 'High'
}

const LOGS: AuditLog[] = [
  { id: 'AL-001', user: 'admin@prsk.ai', action: 'LOGIN', module: 'Auth', description: 'Successful admin login from Chrome/Windows', ip: '103.24.51.12', timestamp: '27 May 2026, 09:12', risk: 'Low' },
  { id: 'AL-002', user: 'priya@prsk.ai', action: 'UPDATE', module: 'HRMS', description: 'Updated salary structure for 5 employees', ip: '103.24.51.15', timestamp: '27 May 2026, 09:45', risk: 'Medium' },
  { id: 'AL-003', user: 'admin@prsk.ai', action: 'DELETE', module: 'Finance', description: 'Deleted expense claim EXP-008 (duplicate entry)', ip: '103.24.51.12', timestamp: '27 May 2026, 10:02', risk: 'High' },
  { id: 'AL-004', user: 'rahul@prsk.ai', action: 'EXPORT', module: 'Payroll', description: 'Exported May 2026 payroll report as CSV', ip: '203.88.12.44', timestamp: '27 May 2026, 10:30', risk: 'Medium' },
  { id: 'AL-005', user: 'karan@prsk.ai', action: 'CREATE', module: 'CRM', description: 'Created new lead: Vertex Global Pvt Ltd', ip: '103.24.51.20', timestamp: '27 May 2026, 11:00', risk: 'Low' },
  { id: 'AL-006', user: 'admin@prsk.ai', action: 'UPDATE', module: 'Settings', description: 'Changed password policy: min length 12 → 14', ip: '103.24.51.12', timestamp: '27 May 2026, 11:30', risk: 'High' },
  { id: 'AL-007', user: 'ananya@prsk.ai', action: 'CREATE', module: 'Finance', description: 'Raised invoice INV-042 for ₹85,000', ip: '115.99.23.7', timestamp: '26 May 2026, 15:20', risk: 'Low' },
  { id: 'AL-008', user: 'divya@prsk.ai', action: 'LOGOUT', module: 'Auth', description: 'User session ended after 8h of inactivity', ip: '103.24.51.25', timestamp: '26 May 2026, 18:00', risk: 'Low' },
]

const ACTION_COLOR: Record<Action, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700', UPDATE: 'bg-blue-50 text-blue-700',
  DELETE: 'bg-red-50 text-red-700', LOGIN: 'bg-slate-100 text-slate-700',
  LOGOUT: 'bg-slate-100 text-slate-500', EXPORT: 'bg-amber-50 text-amber-700',
}

const RISK_COLOR: Record<'Low' | 'Medium' | 'High', 'neutral' | 'warning' | 'danger'> = {
  Low: 'neutral', Medium: 'warning', High: 'danger',
}

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('All')
  const [riskFilter, setRiskFilter] = useState('All')

  const highRisk = LOGS.filter(l => l.risk === 'High').length
  const deletions = LOGS.filter(l => l.action === 'DELETE').length
  const exports = LOGS.filter(l => l.action === 'EXPORT').length

  const filtered = useMemo(() => {
    return LOGS.filter(l => {
      const ms = moduleFilter === 'All' || l.module === moduleFilter
      const rs = riskFilter === 'All' || l.risk === riskFilter
      const ss = !search || l.user.toLowerCase().includes(search.toLowerCase()) ||
        l.description.toLowerCase().includes(search.toLowerCase())
      return ms && rs && ss
    })
  }, [search, moduleFilter, riskFilter])

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Audit Logs"
        description="Complete trail of all user actions, data changes, and system events"
        actions={
          <Button variant="secondary" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Events" value={LOGS.length} icon={<History className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="High Risk Events" value={highRisk} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
        <StatCard label="Data Deletions" value={deletions} icon={<ShieldCheck className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Data Exports" value={exports} icon={<Activity className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-4 flex items-center gap-3 flex-wrap">
          <SearchInput placeholder="Search by user or action..." value={search} onChange={setSearch} className="w-72" />
          <Select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            options={[
              { label: 'All Modules', value: 'All' },
              ...['Auth', 'HRMS', 'Finance', 'Payroll', 'CRM', 'Settings', 'Procurement'].map(m => ({ label: m, value: m }))
            ]}
            className="w-40"
          />
          <Select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            options={[
              { label: 'All Risk', value: 'All' },
              { label: 'High Risk', value: 'High' },
              { label: 'Medium Risk', value: 'Medium' },
              { label: 'Low Risk', value: 'Low' },
            ]}
            className="w-36"
          />
        </div>
        {filtered.length === 0 ? (
          <div className="py-10"><EmptyState icon={<History className="h-6 w-6" />} title="No audit logs match your filters" /></div>
        ) : (
          <Table>
            <Thead><tr><Th>User</Th><Th>Action</Th><Th>Module</Th><Th>Description</Th><Th>IP Address</Th><Th>Timestamp</Th><Th>Risk</Th></tr></Thead>
            <Tbody>
              {filtered.map(l => (
                <Tr key={l.id}>
                  <Td><span className="text-xs font-medium text-slate-700">{l.user}</span></Td>
                  <Td>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ACTION_COLOR[l.action]}`}>{l.action}</span>
                  </Td>
                  <Td><Badge variant="neutral" size="sm">{l.module}</Badge></Td>
                  <Td><span className="text-xs text-slate-600 max-w-56 truncate block">{l.description}</span></Td>
                  <Td><span className="font-mono text-[11px] text-slate-500">{l.ip}</span></Td>
                  <Td><span className="text-xs text-slate-500">{l.timestamp}</span></Td>
                  <Td><Badge variant={RISK_COLOR[l.risk]} dot size="sm">{l.risk}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">{filtered.length} events shown</p>
        </div>
      </Card>
    </div>
  )
}
