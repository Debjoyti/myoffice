'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, Modal, Input, Textarea, EmptyState, Alert
} from '@/components/ui'
import { MapPin, Navigation, Clock, CheckCircle2, Plus, FlaskConical } from 'lucide-react'

type TravelStatus = 'Pending' | 'Approved' | 'In Progress' | 'Completed' | 'Cancelled'

type TravelRequest = {
  id: string; employee: string; from: string; to: string
  purpose: string; startDate: string; endDate: string
  estimatedCost: number; status: TravelStatus
}

const MOCK_REQUESTS: TravelRequest[] = [
  { id: 'TR-001', employee: 'Rahul Mehta', from: 'Bangalore', to: 'Mumbai', purpose: 'Client pitch — Vertex Global', startDate: '02 Jun 2026', endDate: '04 Jun 2026', estimatedCost: 18000, status: 'Approved' },
  { id: 'TR-002', employee: 'Priya Sharma', from: 'Bangalore', to: 'Delhi', purpose: 'HR conference 2026', startDate: '10 Jun 2026', endDate: '12 Jun 2026', estimatedCost: 22000, status: 'Pending' },
  { id: 'TR-003', employee: 'Karan Singh', from: 'Bangalore', to: 'Pune', purpose: 'Partner integration meeting', startDate: '28 May 2026', endDate: '28 May 2026', estimatedCost: 5000, status: 'Completed' },
  { id: 'TR-004', employee: 'Ananya Iyer', from: 'Hyderabad', to: 'Bangalore', purpose: 'Quarterly finance review', startDate: '05 Jun 2026', endDate: '05 Jun 2026', estimatedCost: 4500, status: 'Approved' },
]

const STATUS_COLOR: Record<TravelStatus, 'warning' | 'success' | 'info' | 'neutral' | 'danger'> = {
  Pending: 'warning', Approved: 'success', 'In Progress': 'info', Completed: 'neutral', Cancelled: 'danger',
}

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

const INITIAL_FORM = { from: '', to: '', startDate: '', endDate: '', purpose: '', estimatedCost: '', notes: '' }

export default function TravelPage() {
  const [requests, setRequests] = useState<TravelRequest[]>(MOCK_REQUESTS)
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formError, setFormError] = useState('')

  const approved = requests.filter(r => r.status === 'Approved').length
  const pending = requests.filter(r => r.status === 'Pending').length
  const totalCost = requests.reduce((s, r) => s + r.estimatedCost, 0)

  const filtered = useMemo(() =>
    requests.filter(r => !search ||
      r.employee.toLowerCase().includes(search.toLowerCase()) ||
      r.to.toLowerCase().includes(search.toLowerCase()) ||
      r.purpose.toLowerCase().includes(search.toLowerCase())
    ),
    [requests, search]
  )

  const handleSubmit = async () => {
    if (!form.from.trim() || !form.to.trim()) { setFormError('From and To cities are required'); return }
    if (!form.startDate) { setFormError('Departure date is required'); return }
    if (!form.purpose.trim()) { setFormError('Purpose of travel is required'); return }
    setSaving(true)
    setFormError('')
    await new Promise(r => setTimeout(r, 400))
    setRequests(prev => [{
      id: `TR-${String(prev.length + 1).padStart(3, '0')}`,
      employee: 'You',
      from: form.from.trim(),
      to: form.to.trim(),
      purpose: form.purpose.trim(),
      startDate: fmtDate(form.startDate),
      endDate: form.endDate ? fmtDate(form.endDate) : fmtDate(form.startDate),
      estimatedCost: Number(form.estimatedCost) || 0,
      status: 'Pending',
    }, ...prev])
    setNewModal(false)
    setForm(INITIAL_FORM)
    setSaving(false)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — Travel request data is illustrative. GPS tracking and booking integration is on the roadmap.</span>
      </div>

      <PageHeader
        title="Travel Tracker"
        description="Request, approve, and track business travel with cost management"
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setNewModal(true); setFormError('') }}>
            Request Travel
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={requests.length} icon={<MapPin className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Approved" value={approved} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Pending" value={pending} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Estimated Cost" value={`₹${totalCost.toLocaleString('en-IN')}`} icon={<Navigation className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-4">
          <SearchInput placeholder="Search by employee, destination, or purpose..." value={search} onChange={setSearch} className="w-80" />
        </div>
        {filtered.length === 0 ? (
          <div className="py-10"><EmptyState icon={<MapPin className="h-6 w-6" />} title="No travel requests found" /></div>
        ) : (
          <Table>
            <Thead><tr><Th>Employee</Th><Th>From → To</Th><Th>Purpose</Th><Th>Dates</Th><Th align="right">Est. Cost</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {filtered.map(r => (
                <Tr key={r.id}>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <Avatar name={r.employee} size="xs" />
                      <span className="text-xs font-medium text-slate-700">{r.employee}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-600">{r.from}</span>
                      <Navigation className="h-3 w-3 text-blue-400" />
                      <span className="font-medium text-slate-800">{r.to}</span>
                    </div>
                  </Td>
                  <Td><span className="text-xs text-slate-600 max-w-48 truncate block">{r.purpose}</span></Td>
                  <Td>
                    <span className="text-xs text-slate-500">{r.startDate}</span>
                    {r.startDate !== r.endDate && <span className="text-xs text-slate-400"> → {r.endDate}</span>}
                  </Td>
                  <Td align="right"><span className="text-xs font-bold text-slate-800 tabular-nums">₹{r.estimatedCost.toLocaleString('en-IN')}</span></Td>
                  <Td><Badge variant={STATUS_COLOR[r.status]} dot size="sm">{r.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={newModal}
        onClose={() => { setNewModal(false); setFormError('') }}
        title="Request Travel"
        size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSubmit}>Submit Request</Button>
        </>}
      >
        <div className="space-y-4">
          {formError && <Alert variant="danger">{formError}</Alert>}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="From City"
              placeholder="e.g. Bangalore"
              required
              value={form.from}
              onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
            />
            <Input
              label="To City"
              placeholder="e.g. Mumbai"
              required
              value={form.to}
              onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Departure Date"
              type="date"
              required
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            />
            <Input
              label="Return Date"
              type="date"
              value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <Input
            label="Purpose of Travel"
            placeholder="e.g. Client meeting, Conference"
            required
            value={form.purpose}
            onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
          />
          <Input
            label="Estimated Cost (₹)"
            type="number"
            placeholder="0"
            value={form.estimatedCost}
            onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))}
          />
          <Textarea
            label="Additional Notes"
            placeholder="Hotel preferences, special requirements..."
            rows={2}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
