'use client'

import { useState } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, Modal, Input, Select, Textarea, EmptyState, Alert
} from '@/components/ui'
import { Shield, FileText, CheckCircle2, AlertTriangle, Plus, Lock } from 'lucide-react'

type ComplaintStatus = 'Under Review' | 'Investigating' | 'Action Taken' | 'Closed'

type Complaint = {
  id: string; subject: string; category: string; reportedOn: string
  status: ComplaintStatus; assignedTo: string; anonymous: boolean
}

const MOCK_COMPLAINTS: Complaint[] = [
  { id: 'POSH-001', subject: 'Inappropriate comment in team meeting', category: 'Verbal Harassment', reportedOn: '20 May 2026', status: 'Investigating', assignedTo: 'ICC Committee', anonymous: false },
  { id: 'POSH-002', subject: 'Uncomfortable communication via messaging app', category: 'Digital Harassment', reportedOn: '15 May 2026', status: 'Action Taken', assignedTo: 'ICC Committee', anonymous: true },
  { id: 'POSH-003', subject: 'Hostile work environment concern', category: 'Hostile Environment', reportedOn: '10 May 2026', status: 'Closed', assignedTo: 'HR + Legal', anonymous: false },
]

const STATUS_COLOR: Record<ComplaintStatus, 'warning' | 'info' | 'success' | 'neutral'> = {
  'Under Review': 'warning', Investigating: 'info', 'Action Taken': 'success', Closed: 'neutral',
}

const CATEGORY_MAP: Record<string, string> = {
  verbal: 'Verbal Harassment', physical: 'Physical Harassment',
  digital: 'Digital Harassment', hostile: 'Hostile Work Environment',
  qpq: 'Quid Pro Quo', other: 'Other',
}

const INITIAL_FORM = { category: 'verbal', subject: '', description: '', anonymous: false }

export default function POSHPage() {
  const [complaints, setComplaints] = useState<Complaint[]>(MOCK_COMPLAINTS)
  const [newModal, setNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formError, setFormError] = useState('')

  const active = complaints.filter(c => c.status !== 'Closed').length

  const handleSubmit = async () => {
    if (!form.subject.trim()) { setFormError('Subject is required'); return }
    if (!form.description.trim()) { setFormError('A description is required'); return }
    setSaving(true)
    setFormError('')
    await new Promise(r => setTimeout(r, 400))
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    setComplaints(prev => [{
      id: `POSH-${String(prev.length + 1).padStart(3, '0')}`,
      subject: form.subject.trim(),
      category: CATEGORY_MAP[form.category] ?? form.category,
      reportedOn: today,
      status: 'Under Review',
      assignedTo: 'ICC Committee',
      anonymous: form.anonymous,
    }, ...prev])
    setNewModal(false)
    setForm(INITIAL_FORM)
    setSaving(false)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <Alert variant="warning" title="Confidential Module">
        All complaints are handled with strict confidentiality. Information is accessible only to HR, Legal, and designated ICC members.
      </Alert>

      <PageHeader
        title="POSH Compliance"
        description="Prevention of Sexual Harassment — complaint management and ICC oversight"
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setNewModal(true); setFormError('') }}>
            File Complaint
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Complaints" value={complaints.length} icon={<FileText className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Active Cases" value={active} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Action Taken" value={complaints.filter(c => c.status === 'Action Taken').length} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Closed" value={complaints.filter(c => c.status === 'Closed').length} icon={<Shield className="h-4 w-4" />} iconColor="bg-neutral-100 text-neutral-600" />
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" /> POSH Policy Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { title: 'ICC Committee', desc: 'Internal Complaints Committee with external member, as mandated by law. Meetings held quarterly.' },
            { title: 'Complaint Window', desc: 'Complaints can be filed within 3 months of the incident. ICC will respond within 7 working days.' },
            { title: 'Confidentiality', desc: 'Identity of complainant, respondent, and witnesses is protected throughout the inquiry process.' },
          ].map(p => (
            <div key={p.title} className="bg-blue-50 rounded-lg p-3">
              <p className="font-semibold text-blue-800 text-xs mb-1">{p.title}</p>
              <p className="text-xs text-blue-700 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="none">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-slate-500" /> Complaint Register (HR & ICC View)
          </h3>
        </div>
        {complaints.length === 0 ? (
          <div className="py-10"><EmptyState icon={<Shield className="h-6 w-6" />} title="No complaints filed" /></div>
        ) : (
          <Table>
            <Thead><tr><Th>ID</Th><Th>Subject</Th><Th>Category</Th><Th>Filed On</Th><Th>Assigned To</Th><Th>Anonymous</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {complaints.map(c => (
                <Tr key={c.id}>
                  <Td><span className="font-mono text-xs font-medium text-slate-600">{c.id}</span></Td>
                  <Td><span className="text-xs font-medium text-slate-800">{c.subject}</span></Td>
                  <Td><Badge variant="neutral" size="sm">{c.category}</Badge></Td>
                  <Td><span className="text-xs text-slate-500">{c.reportedOn}</span></Td>
                  <Td><span className="text-xs text-slate-600">{c.assignedTo}</span></Td>
                  <Td>
                    {c.anonymous
                      ? <Badge variant="warning" size="sm">Anonymous</Badge>
                      : <span className="text-xs text-slate-400">Named</span>
                    }
                  </Td>
                  <Td><Badge variant={STATUS_COLOR[c.status]} dot size="sm">{c.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={newModal}
        onClose={() => { setNewModal(false); setFormError('') }}
        title="File a Complaint"
        size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSubmit}>Submit Confidentially</Button>
        </>}
      >
        <div className="space-y-4">
          <Alert variant="info">
            Your complaint will be treated with full confidentiality. Only the ICC committee will have access to the details.
          </Alert>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Select
            label="Category of Complaint"
            required
            options={[
              { label: 'Verbal Harassment', value: 'verbal' },
              { label: 'Physical Harassment', value: 'physical' },
              { label: 'Digital Harassment', value: 'digital' },
              { label: 'Hostile Work Environment', value: 'hostile' },
              { label: 'Quid Pro Quo', value: 'qpq' },
              { label: 'Other', value: 'other' },
            ]}
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: (e.target as HTMLSelectElement).value }))}
          />
          <Input
            label="Subject"
            placeholder="Brief description of the incident"
            required
            value={form.subject}
            onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          />
          <Textarea
            label="Detailed Description"
            placeholder="Describe the incident(s) in detail. Include dates, times, locations, and any witnesses."
            rows={4}
            required
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <input
              type="checkbox"
              id="anon"
              className="h-4 w-4 rounded text-blue-600"
              checked={form.anonymous}
              onChange={e => setForm(f => ({ ...f, anonymous: e.target.checked }))}
            />
            <label htmlFor="anon" className="text-xs text-slate-700">File anonymously (your identity will not be disclosed)</label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
