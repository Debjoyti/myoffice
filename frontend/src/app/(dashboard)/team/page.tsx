'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, TabBar, Modal, Input, Select, EmptyState, Alert
} from '@/components/ui'
import { Users, UserCheck, Mail, Clock, Plus, FlaskConical } from 'lucide-react'

type Role = 'admin' | 'hr' | 'manager' | 'accountant' | 'employee'
type InviteStatus = 'Pending' | 'Accepted' | 'Expired'

type Member = {
  id: string; name: string; email: string; role: Role
  department: string; joined: string; status: 'Active' | 'Inactive'
}

type Invite = {
  id: string; email: string; role: Role; sent: string; status: InviteStatus
}

const MEMBERS: Member[] = [
  { id: 'M1', name: 'Arjun Patel', email: 'arjun@prsk.ai', role: 'admin', department: 'Founders Office', joined: '01 Jan 2024', status: 'Active' },
  { id: 'M2', name: 'Priya Sharma', email: 'priya@prsk.ai', role: 'hr', department: 'Human Resources', joined: '15 Feb 2024', status: 'Active' },
  { id: 'M3', name: 'Rahul Mehta', email: 'rahul@prsk.ai', role: 'manager', department: 'Engineering', joined: '01 Mar 2024', status: 'Active' },
  { id: 'M4', name: 'Karan Singh', email: 'karan@prsk.ai', role: 'employee', department: 'Engineering', joined: '01 Apr 2024', status: 'Active' },
  { id: 'M5', name: 'Ananya Iyer', email: 'ananya@prsk.ai', role: 'accountant', department: 'Finance', joined: '15 Apr 2024', status: 'Active' },
  { id: 'M6', name: 'Divya Nair', email: 'divya@prsk.ai', role: 'employee', department: 'Product', joined: '01 May 2024', status: 'Inactive' },
]

const MOCK_INVITES: Invite[] = [
  { id: 'I1', email: 'new.engineer@prsk.ai', role: 'employee', sent: '25 May 2026', status: 'Pending' },
  { id: 'I2', email: 'marketing.head@prsk.ai', role: 'manager', sent: '20 May 2026', status: 'Accepted' },
  { id: 'I3', email: 'finance.analyst@prsk.ai', role: 'accountant', sent: '10 May 2026', status: 'Expired' },
]

const ROLE_COLOR: Record<Role, string> = {
  admin: 'bg-red-50 text-red-700', hr: 'bg-blue-50 text-blue-700',
  manager: 'bg-amber-50 text-amber-700', accountant: 'bg-violet-50 text-violet-700', employee: 'bg-slate-100 text-slate-700',
}

const INVITE_COLOR: Record<InviteStatus, 'warning' | 'success' | 'neutral'> = {
  Pending: 'warning', Accepted: 'success', Expired: 'neutral',
}

const INITIAL_FORM = { email: '', role: 'employee' as Role }

export default function TeamPage() {
  const [tab, setTab] = useState('members')
  const [search, setSearch] = useState('')
  const [invites, setInvites] = useState<Invite[]>(MOCK_INVITES)
  const [inviteModal, setInviteModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formError, setFormError] = useState('')

  const active = MEMBERS.filter(m => m.status === 'Active').length
  const pendingInvites = invites.filter(i => i.status === 'Pending').length

  const filteredMembers = useMemo(() =>
    MEMBERS.filter(m => !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.department.toLowerCase().includes(search.toLowerCase())
    ),
    [search]
  )

  const handleInvite = async () => {
    if (!form.email.trim()) { setFormError('Email is required'); return }
    if (!form.email.includes('@')) { setFormError('Enter a valid email address'); return }
    setSaving(true)
    setFormError('')
    await new Promise(r => setTimeout(r, 400))
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    setInvites(prev => [{
      id: `I${Date.now()}`,
      email: form.email.trim().toLowerCase(),
      role: form.role,
      sent: today,
      status: 'Pending',
    }, ...prev])
    setInviteModal(false)
    setForm(INITIAL_FORM)
    setSaving(false)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — Team data is illustrative. Invite flow connects to Supabase Auth.</span>
      </div>

      <PageHeader
        title="Team Members"
        description="Manage workspace members, roles, and pending invitations"
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setInviteModal(true); setFormError('') }}>
            Invite Member
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={MEMBERS.length} icon={<Users className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Active" value={active} icon={<UserCheck className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Pending Invites" value={pendingInvites} icon={<Mail className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Departments" value={new Set(MEMBERS.map(m => m.department)).size} icon={<Clock className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      <TabBar
        tabs={[
          { id: 'members', label: 'Members', count: MEMBERS.length },
          { id: 'invites', label: 'Invitations', count: invites.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'members' && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-4">
            <SearchInput placeholder="Search by name, email, or department..." value={search} onChange={setSearch} className="w-80" />
          </div>
          <Table>
            <Thead><tr><Th>Member</Th><Th>Role</Th><Th>Department</Th><Th>Joined</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {filteredMembers.map(m => (
                <Tr key={m.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar name={m.name} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{m.name}</p>
                        <p className="text-[11px] text-slate-400">{m.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_COLOR[m.role]}`}>{m.role}</span>
                  </Td>
                  <Td><span className="text-xs text-slate-600">{m.department}</span></Td>
                  <Td><span className="text-xs text-slate-500">{m.joined}</span></Td>
                  <Td>
                    <Badge variant={m.status === 'Active' ? 'success' : 'neutral'} dot size="sm">{m.status}</Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'invites' && (
        <Card padding="none">
          {invites.length === 0 ? (
            <div className="py-10"><EmptyState icon={<Mail className="h-6 w-6" />} title="No pending invitations" /></div>
          ) : (
            <Table>
              <Thead><tr><Th>Email</Th><Th>Role</Th><Th>Sent</Th><Th>Status</Th></tr></Thead>
              <Tbody>
                {invites.map(i => (
                  <Tr key={i.id}>
                    <Td><span className="text-xs font-medium text-slate-700">{i.email}</span></Td>
                    <Td>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_COLOR[i.role]}`}>{i.role}</span>
                    </Td>
                    <Td><span className="text-xs text-slate-500">{i.sent}</span></Td>
                    <Td><Badge variant={INVITE_COLOR[i.status]} dot size="sm">{i.status}</Badge></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      <Modal
        open={inviteModal}
        onClose={() => { setInviteModal(false); setFormError('') }}
        title="Invite Team Member"
        size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setInviteModal(false)}>Cancel</Button>
          <Button size="sm" loading={saving} leftIcon={<Mail className="h-3.5 w-3.5" />} onClick={handleInvite}>Send Invitation</Button>
        </>}
      >
        <div className="space-y-4">
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Input
            label="Email Address"
            type="email"
            placeholder="colleague@company.com"
            required
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
          <Select
            label="Role"
            options={[
              { label: 'Employee', value: 'employee' },
              { label: 'Manager', value: 'manager' },
              { label: 'HR', value: 'hr' },
              { label: 'Accountant', value: 'accountant' },
              { label: 'Admin', value: 'admin' },
            ]}
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: (e.target as HTMLSelectElement).value as Role }))}
          />
          <p className="text-xs text-slate-500">An invitation email will be sent. The invitee will be asked to set up their password on first login.</p>
        </div>
      </Modal>
    </div>
  )
}
