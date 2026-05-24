'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  EmptyState, Modal, Input, Textarea, Select, SearchInput, Skeleton
} from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Plus, FileText, Edit2, Printer } from 'lucide-react'

type JobDescription = {
  id: string; title: string; department_id: string | null; purpose: string | null
  key_responsibilities: string[]; qualifications: string[]; required_skills: string[]
  experience_years_min: number; experience_years_max: number | null
  key_performance_indicators: string[]; reporting_to: string | null
  version: number; status: string; effective_date: string | null; document_number: string | null
  dept: { name: string } | null
  creator: { id: string; users: { full_name: string } } | null
}

const STATUS_COLOR: Record<string, 'default' | 'success' | 'neutral'> = {
  active: 'success', draft: 'default', archived: 'neutral'
}

const BLANK_FORM = {
  title: '', department_id: '', purpose: '',
  key_responsibilities: '', qualifications: '', required_skills: '',
  experience_years_min: '0', experience_years_max: '',
  key_performance_indicators: '', reporting_to: '',
  effective_date: '', document_number: '',
}

export default function JobDescriptionsPage() {
  const [loading, setLoading] = useState(true)
  const [jds, setJds] = useState<JobDescription[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedJD, setSelectedJD] = useState<JobDescription | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)
  const [changeSummary, setChangeSummary] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      let url = '/api/v1/iatf/job-descriptions?'
      if (filterStatus) url += `status=${filterStatus}&`
      const res = await fetch(url)
      if (res.ok) {
        const d = await res.json()
        setJds(d.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { loadData() }, [loadData])

  async function handleCreate() {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/iatf/job-descriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          experience_years_min: parseInt(form.experience_years_min) || 0,
          experience_years_max: form.experience_years_max ? parseInt(form.experience_years_max) : undefined,
          key_responsibilities: form.key_responsibilities.split('\n').filter(Boolean),
          qualifications: form.qualifications.split('\n').filter(Boolean),
          required_skills: form.required_skills.split('\n').filter(Boolean),
          key_performance_indicators: form.key_performance_indicators.split('\n').filter(Boolean),
        }),
      })
      if (res.ok) {
        setShowAdd(false)
        setForm(BLANK_FORM)
        loadData()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate() {
    if (!selectedJD) return
    setSaving(true)
    try {
      const res = await fetch('/api/v1/iatf/job-descriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedJD.id,
          ...form,
          experience_years_min: parseInt(form.experience_years_min) || 0,
          experience_years_max: form.experience_years_max ? parseInt(form.experience_years_max) : undefined,
          key_responsibilities: form.key_responsibilities.split('\n').filter(Boolean),
          qualifications: form.qualifications.split('\n').filter(Boolean),
          required_skills: form.required_skills.split('\n').filter(Boolean),
          key_performance_indicators: form.key_performance_indicators.split('\n').filter(Boolean),
          change_summary: changeSummary,
        }),
      })
      if (res.ok) {
        setEditMode(false)
        setSelectedJD(null)
        loadData()
      }
    } finally {
      setSaving(false)
    }
  }

  function openEdit(jd: JobDescription) {
    setSelectedJD(jd)
    setForm({
      title: jd.title,
      department_id: jd.department_id ?? '',
      purpose: jd.purpose ?? '',
      key_responsibilities: (jd.key_responsibilities ?? []).join('\n'),
      qualifications: (jd.qualifications ?? []).join('\n'),
      required_skills: (jd.required_skills ?? []).join('\n'),
      experience_years_min: String(jd.experience_years_min ?? 0),
      experience_years_max: String(jd.experience_years_max ?? ''),
      key_performance_indicators: (jd.key_performance_indicators ?? []).join('\n'),
      reporting_to: jd.reporting_to ?? '',
      effective_date: jd.effective_date ?? '',
      document_number: jd.document_number ?? '',
    })
    setEditMode(true)
  }

  function handlePrint(jd: JobDescription) {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>${jd.title} - JD v${jd.version}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto}h1{font-size:22px}h2{font-size:14px;text-transform:uppercase;color:#555;border-bottom:1px solid #ddd;padding-bottom:4px;margin-top:24px}p,li{font-size:13px;line-height:1.6}ul{padding-left:20px}</style>
      </head><body>
      <h1>${jd.title}</h1>
      <p><strong>Document No:</strong> ${jd.document_number ?? '—'} &nbsp; <strong>Version:</strong> v${jd.version} &nbsp; <strong>Status:</strong> ${jd.status}</p>
      ${jd.purpose ? `<h2>Purpose</h2><p>${jd.purpose}</p>` : ''}
      ${(jd.key_responsibilities ?? []).length > 0 ? `<h2>Key Responsibilities</h2><ul>${(jd.key_responsibilities ?? []).map(r => `<li>${r}</li>`).join('')}</ul>` : ''}
      ${(jd.qualifications ?? []).length > 0 ? `<h2>Qualifications</h2><ul>${(jd.qualifications ?? []).map(q => `<li>${q}</li>`).join('')}</ul>` : ''}
      ${(jd.required_skills ?? []).length > 0 ? `<h2>Required Skills</h2><ul>${(jd.required_skills ?? []).map(s => `<li>${s}</li>`).join('')}</ul>` : ''}
      <h2>Experience</h2><p>${jd.experience_years_min}${jd.experience_years_max ? '–' + jd.experience_years_max : '+'} years</p>
      ${(jd.key_performance_indicators ?? []).length > 0 ? `<h2>KPIs</h2><ul>${(jd.key_performance_indicators ?? []).map(k => `<li>${k}</li>`).join('')}</ul>` : ''}
      ${jd.reporting_to ? `<h2>Reporting To</h2><p>${jd.reporting_to}</p>` : ''}
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  const filtered = jds.filter(jd => {
    const q = search.toLowerCase()
    return !q || jd.title.toLowerCase().includes(q) || (jd.dept?.name ?? '').toLowerCase().includes(q)
  })

  const grouped = filtered.reduce<Record<string, JobDescription[]>>((acc, jd) => {
    const dept = jd.dept?.name ?? 'No Department'
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(jd)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Descriptions"
        description="Versioned job description library by department"
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAdd(true)}>
            New JD
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <SearchInput placeholder="Search JDs..." value={search} onChange={setSearch} className="w-64" />
        <Select
          options={[{label:'All Status',value:''},{label:'Draft',value:'draft'},{label:'Active',value:'active'},{label:'Archived',value:'archived'}]}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-32 w-full"/>)}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No job descriptions"
          description="Create versioned JDs for all roles in your organization."
          action={<Button size="sm" onClick={() => setShowAdd(true)}>New JD</Button>}
        />
      ) : (
        Object.entries(grouped).map(([dept, items]) => (
          <Card key={dept} padding="none">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
              <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{dept} ({items.length})</h3>
            </div>
            <Table>
              <Thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Doc No.</Th>
                  <Th>Version</Th>
                  <Th>Status</Th>
                  <Th>Experience</Th>
                  <Th>Effective</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {items.map(jd => (
                  <Tr key={jd.id} onClick={() => setSelectedJD(jd)}>
                    <Td>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{jd.title}</p>
                        {jd.reporting_to && <p className="text-xs text-slate-400">Reports to: {jd.reporting_to}</p>}
                      </div>
                    </Td>
                    <Td><span className="font-mono text-xs text-slate-500">{jd.document_number ?? '—'}</span></Td>
                    <Td><Badge variant="neutral" size="sm">v{jd.version}</Badge></Td>
                    <Td><Badge variant={STATUS_COLOR[jd.status] ?? 'neutral'} size="sm" dot>{jd.status}</Badge></Td>
                    <Td>{jd.experience_years_min}{jd.experience_years_max ? `–${jd.experience_years_max}` : '+'} yrs</Td>
                    <Td>{jd.effective_date ? formatDate(jd.effective_date) : '—'}</Td>
                    <Td>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(jd)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Print" onClick={() => handlePrint(jd)}>
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        ))
      )}

      {/* View JD Modal */}
      <Modal
        open={!!selectedJD && !editMode}
        onClose={() => setSelectedJD(null)}
        title={selectedJD?.title ?? ''}
        size="xl"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Printer className="h-3.5 w-3.5" />} onClick={() => selectedJD && handlePrint(selectedJD)}>Print</Button>
            <Button size="sm" leftIcon={<Edit2 className="h-3.5 w-3.5" />} onClick={() => selectedJD && openEdit(selectedJD)}>Edit</Button>
          </div>
        }
      >
        {selectedJD && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Badge variant={STATUS_COLOR[selectedJD.status] ?? 'neutral'}>{selectedJD.status}</Badge>
              <Badge variant="neutral">v{selectedJD.version}</Badge>
              {selectedJD.document_number && <Badge variant="neutral">{selectedJD.document_number}</Badge>}
            </div>
            {selectedJD.purpose && <div><h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Purpose</h4><p className="text-sm">{selectedJD.purpose}</p></div>}
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-slate-500">Experience</span><p className="text-sm font-medium">{selectedJD.experience_years_min}–{selectedJD.experience_years_max ?? '?'} years</p></div>
              <div><span className="text-xs text-slate-500">Reports To</span><p className="text-sm font-medium">{selectedJD.reporting_to ?? '—'}</p></div>
              <div><span className="text-xs text-slate-500">Effective</span><p className="text-sm font-medium">{selectedJD.effective_date ? formatDate(selectedJD.effective_date) : '—'}</p></div>
              <div><span className="text-xs text-slate-500">Department</span><p className="text-sm font-medium">{selectedJD.dept?.name ?? '—'}</p></div>
            </div>
            {(selectedJD.key_responsibilities ?? []).length > 0 && (
              <div><h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Key Responsibilities</h4><ul className="list-disc list-inside space-y-0.5">{(selectedJD.key_responsibilities ?? []).map((r, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-300">{r}</li>)}</ul></div>
            )}
            {(selectedJD.qualifications ?? []).length > 0 && (
              <div><h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Qualifications</h4><ul className="list-disc list-inside space-y-0.5">{(selectedJD.qualifications ?? []).map((q, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-300">{q}</li>)}</ul></div>
            )}
            {(selectedJD.required_skills ?? []).length > 0 && (
              <div><h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Required Skills</h4><div className="flex flex-wrap gap-1">{(selectedJD.required_skills ?? []).map((s, i) => <Badge key={i} variant="neutral" size="sm">{s}</Badge>)}</div></div>
            )}
            {(selectedJD.key_performance_indicators ?? []).length > 0 && (
              <div><h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">KPIs</h4><ul className="list-disc list-inside space-y-0.5">{(selectedJD.key_performance_indicators ?? []).map((k, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-300">{k}</li>)}</ul></div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit / Create JD Modal */}
      <Modal
        open={showAdd || editMode}
        onClose={() => { setShowAdd(false); setEditMode(false); setSelectedJD(null); setForm(BLANK_FORM) }}
        title={editMode ? `Edit: ${selectedJD?.title}` : 'New Job Description'}
        size="xl"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setShowAdd(false); setEditMode(false); setSelectedJD(null) }}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={editMode ? handleUpdate : handleCreate}>{editMode ? 'Save Changes' : 'Create JD'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Input label="Document Number" placeholder="e.g. JD-ENG-001" value={form.document_number} onChange={e => setForm(f => ({ ...f, document_number: e.target.value }))} />
          </div>
          <Textarea label="Purpose" rows={2} value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Reports To" value={form.reporting_to} onChange={e => setForm(f => ({ ...f, reporting_to: e.target.value }))} />
            <Input label="Min Experience (years)" type="number" value={form.experience_years_min} onChange={e => setForm(f => ({ ...f, experience_years_min: e.target.value }))} />
            <Input label="Max Experience (years)" type="number" value={form.experience_years_max} onChange={e => setForm(f => ({ ...f, experience_years_max: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Textarea label="Key Responsibilities (one per line)" rows={5} value={form.key_responsibilities} onChange={e => setForm(f => ({ ...f, key_responsibilities: e.target.value }))} />
            <Textarea label="Qualifications (one per line)" rows={5} value={form.qualifications} onChange={e => setForm(f => ({ ...f, qualifications: e.target.value }))} />
            <Textarea label="Required Skills (one per line)" rows={4} value={form.required_skills} onChange={e => setForm(f => ({ ...f, required_skills: e.target.value }))} />
            <Textarea label="KPIs (one per line)" rows={4} value={form.key_performance_indicators} onChange={e => setForm(f => ({ ...f, key_performance_indicators: e.target.value }))} />
          </div>
          <Input label="Effective Date" type="date" value={form.effective_date} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} />
          {editMode && (
            <Input label="Change Summary" placeholder="Describe what changed in this version" value={changeSummary} onChange={e => setChangeSummary(e.target.value)} />
          )}
        </div>
      </Modal>
    </div>
  )
}
