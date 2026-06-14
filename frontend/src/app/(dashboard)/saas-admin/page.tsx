'use client'

import { useState } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, Modal, Input, Alert
} from '@/components/ui'
import { Settings, Users, Briefcase, Plus, Building2, AlertTriangle } from 'lucide-react'

type ClientStatus = 'Active' | 'Trial' | 'Suspended' | 'Churned'

type Client = {
  id: string; name: string; email: string; plan: string
  employees: number; maxEmployees: number; projects: number
  status: ClientStatus; since: string; expires: string
}

const CLIENTS: Client[] = [
  { id: 'C-001', name: 'Vertex Global Pvt Ltd', email: 'admin@vertexglobal.com', plan: 'Enterprise', employees: 245, maxEmployees: 500, projects: 18, status: 'Active', since: '01 Jan 2025', expires: '31 Dec 2026' },
  { id: 'C-002', name: 'TechCore Solutions', email: 'admin@techcore.io', plan: 'Growth', employees: 48, maxEmployees: 100, projects: 7, status: 'Active', since: '15 Mar 2025', expires: '14 Mar 2026' },
  { id: 'C-003', name: 'Bharat Logistics Ltd', email: 'it@bharatlogistics.in', plan: 'Starter', employees: 12, maxEmployees: 25, projects: 2, status: 'Trial', since: '20 May 2026', expires: '19 Jun 2026' },
  { id: 'C-004', name: 'Nimbus Fintech', email: 'ops@nimbusfintech.com', plan: 'Growth', employees: 0, maxEmployees: 100, projects: 0, status: 'Churned', since: '01 Aug 2024', expires: '31 Jan 2026' },
]

const STATUS_COLOR: Record<ClientStatus, 'success' | 'info' | 'warning' | 'neutral'> = {
  Active: 'success', Trial: 'info', Suspended: 'warning', Churned: 'neutral',
}

export default function SaasAdminPage() {
  const [selected, setSelected] = useState<Client | null>(null)
  const [newModal, setNewModal] = useState(false)

  const active = CLIENTS.filter(c => c.status === 'Active').length
  const totalEmployees = CLIENTS.filter(c => c.status === 'Active').reduce((s, c) => s + c.employees, 0)
  const trial = CLIENTS.filter(c => c.status === 'Trial').length

  return (
    <div className="space-y-6 animate-fadeIn">
      <Alert variant="warning" title="Superadmin Zone">
        This panel is restricted to superadmin accounts only. All actions are audited.
      </Alert>

      <PageHeader
        title="SaaS Administration"
        description="Manage tenant organisations, subscriptions, and platform-level settings"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewModal(true)}>Add Client</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Clients" value={active} icon={<Building2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Trial Accounts" value={trial} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Total Users" value={totalEmployees} icon={<Users className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Total Projects" value={CLIENTS.filter(c => c.status === 'Active').reduce((s, c) => s + c.projects, 0)} icon={<Briefcase className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      <Card padding="none">
        <Table>
          <Thead><tr><Th>Client</Th><Th>Plan</Th><Th>Users</Th><Th>Projects</Th><Th>Since</Th><Th>Expires</Th><Th>Status</Th><Th>Actions</Th></tr></Thead>
          <Tbody>
            {CLIENTS.map(c => (
              <Tr key={c.id}>
                <Td>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                    <p className="text-[11px] text-slate-400">{c.email}</p>
                  </div>
                </Td>
                <Td><Badge variant="neutral" size="sm">{c.plan}</Badge></Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-800">{c.employees}</span>
                    <span className="text-xs text-slate-400">/ {c.maxEmployees}</span>
                  </div>
                  <div className="w-16 bg-slate-100 rounded-full h-1 mt-1">
                    <div className="h-1 rounded-full bg-blue-400" style={{ width: `${Math.min(c.employees / c.maxEmployees * 100, 100)}%` }} />
                  </div>
                </Td>
                <Td><span className="text-xs text-slate-700">{c.projects}</span></Td>
                <Td><span className="text-xs text-slate-500">{c.since}</span></Td>
                <Td><span className="text-xs text-slate-500">{c.expires}</span></Td>
                <Td><Badge variant={STATUS_COLOR[c.status]} dot size="sm">{c.status}</Badge></Td>
                <Td>
                  <Button variant="ghost" size="sm" leftIcon={<Settings className="h-3 w-3" />} onClick={() => setSelected(c)}>
                    Manage
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      {/* Client Detail */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''} size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          <Button variant="secondary" size="sm">Suspend Account</Button>
          <Button size="sm">Edit Plan</Button>
        </>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{selected.name}</p>
                <p className="text-sm text-slate-500">{selected.email}</p>
              </div>
              <Badge variant={STATUS_COLOR[selected.status]} dot>{selected.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Plan', value: selected.plan },
                { label: 'Users', value: `${selected.employees} / ${selected.maxEmployees}` },
                { label: 'Active Projects', value: selected.projects },
                { label: 'Account Since', value: selected.since },
                { label: 'Subscription Expires', value: selected.expires },
              ].map(r => (
                <div key={r.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{r.label}</p>
                  <p className="text-sm font-semibold text-slate-800">{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Client Modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="Add New Client" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm">Create Account</Button>
        </>}
      >
        <div className="space-y-4">
          <Input label="Company Name" placeholder="e.g. Vertex Global Pvt Ltd" required />
          <Input label="Admin Email" type="email" placeholder="admin@company.com" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Max Employees" type="number" placeholder="100" />
            <Input label="Max Projects" type="number" placeholder="10" />
          </div>
          <Input label="Subscription End Date" type="date" />
        </div>
      </Modal>
    </div>
  )
}
