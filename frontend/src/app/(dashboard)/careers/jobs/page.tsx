'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  PageHeader, Card, StatCard, Button, Badge, Table, Thead, Th, Tbody, Tr, Td,
  Modal, Input, Select, Textarea, EmptyState, Alert, SkeletonTable, SearchInput, Spinner,
} from '@/components/ui'
import { formatSalary, formatExperience } from '@/lib/services/careers'
import {
  Briefcase, Plus, Sparkles, RefreshCw, MapPin, Users, Trash2, Edit3, Eye,
} from 'lucide-react'

type Job = {
  id: string; title: string; code: string | null; department_name: string | null
  summary: string | null; description: string | null
  responsibilities: string[]; requirements: string[]; perks: string[]; skills: string[]
  employment_type: string; work_mode: string; experience_level: string
  min_experience: number; max_experience: number | null; location: string | null
  currency: string; salary_min: number | null; salary_max: number | null; salary_period: string
  show_salary: boolean; openings: number; status: string; is_featured: boolean; is_urgent: boolean
  applicant_count: number; hired_count: number; view_count: number
  ai_interview_enabled: boolean; ai_question_count: number
}

const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'warning' | 'info' | 'danger'> = {
  draft: 'neutral', open: 'success', paused: 'warning', closed: 'danger', filled: 'info',
}
const WORK_MODE_LABEL: Record<string, string> = { onsite: 'On-site', hybrid: 'Hybrid', remote: 'Remote' }
const TYPE_LABEL: Record<string, string> = { full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', internship: 'Internship', temporary: 'Temporary' }

const blankForm = {
  title: '', code: '', department_name: '', location: '', summary: '', description: '',
  employment_type: 'full_time', work_mode: 'onsite', experience_level: 'mid',
  min_experience: '2', max_experience: '6', salary_min: '', salary_max: '', salary_period: 'year',
  show_salary: true, openings: '1', skills: '', responsibilities: '', requirements: '', perks: '',
  ai_interview_enabled: true, ai_question_count: '5', status: 'open',
}

const toLines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean)
const toCsv = (s: string) => s.split(/[,\n]/).map(x => x.trim()).filter(Boolean)

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [summary, setSummary] = useState({ total: 0, open: 0, draft: 0, applicants: 0, openings: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(blankForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('q', search)
      const res = await fetch(`/api/v1/careers/jobs?${params}`)
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load')
      const data = await res.json()
      setJobs(data.jobs); setSummary(data.summary)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [statusFilter, search])

  useEffect(() => { const t = setTimeout(load, search ? 300 : 0); return () => clearTimeout(t) }, [load, search])

  const openCreate = () => { setEditId(null); setForm(blankForm); setFormError(null); setModalOpen(true) }
  const openEdit = (j: Job) => {
    setEditId(j.id)
    setForm({
      title: j.title, code: j.code ?? '', department_name: j.department_name ?? '', location: j.location ?? '',
      summary: j.summary ?? '', description: j.description ?? '',
      employment_type: j.employment_type, work_mode: j.work_mode, experience_level: j.experience_level,
      min_experience: String(j.min_experience), max_experience: j.max_experience != null ? String(j.max_experience) : '',
      salary_min: j.salary_min != null ? String(j.salary_min) : '', salary_max: j.salary_max != null ? String(j.salary_max) : '',
      salary_period: j.salary_period, show_salary: j.show_salary, openings: String(j.openings),
      skills: j.skills.join(', '), responsibilities: j.responsibilities.join('\n'),
      requirements: j.requirements.join('\n'), perks: j.perks.join(', '),
      ai_interview_enabled: j.ai_interview_enabled, ai_question_count: String(j.ai_question_count), status: j.status,
    })
    setFormError(null); setModalOpen(true)
  }

  const save = async () => {
    setSaving(true); setFormError(null)
    try {
      const payload = {
        title: form.title.trim(), code: form.code.trim() || undefined,
        department_name: form.department_name.trim() || undefined,
        location: form.location.trim() || undefined, summary: form.summary.trim() || undefined,
        description: form.description.trim() || undefined,
        employment_type: form.employment_type, work_mode: form.work_mode, experience_level: form.experience_level,
        min_experience: Number(form.min_experience) || 0,
        max_experience: form.max_experience ? Number(form.max_experience) : null,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        salary_period: form.salary_period, show_salary: form.show_salary,
        openings: Number(form.openings) || 1,
        skills: toCsv(form.skills), responsibilities: toLines(form.responsibilities),
        requirements: toLines(form.requirements), perks: toCsv(form.perks),
        ai_interview_enabled: form.ai_interview_enabled, ai_question_count: Number(form.ai_question_count) || 5,
        status: form.status,
      }
      const res = await fetch(editId ? `/api/v1/careers/jobs/${editId}` : '/api/v1/careers/jobs', {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(typeof e.error === 'string' ? e.error : 'Validation failed — check required fields') }
      setModalOpen(false); await load()
    } catch (e: any) { setFormError(e.message) }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this job and all its applications?')) return
    const res = await fetch(`/api/v1/careers/jobs/${id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Postings"
        description="Create, publish and manage open roles for your career site."
        actions={<>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={load} loading={loading}>Refresh</Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>New Job</Button>
        </>}
      />

      {error && <Alert variant="danger" title="Could not load">{error}</Alert>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Jobs" value={summary.total} icon={<Briefcase className="h-4 w-4" />} accent="blue" loading={loading} />
        <StatCard label="Open" value={summary.open} icon={<Eye className="h-4 w-4" />} accent="emerald" loading={loading} />
        <StatCard label="Total Openings" value={summary.openings} icon={<Plus className="h-4 w-4" />} accent="violet" loading={loading} />
        <StatCard label="Applicants" value={summary.applicants} icon={<Users className="h-4 w-4" />} accent="amber" loading={loading} />
      </div>

      <Card padding="none">
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 flex-wrap">
          <SearchInput placeholder="Search jobs..." value={search} onChange={setSearch} className="w-64" />
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={[
            { label: 'All statuses', value: 'all' }, { label: 'Open', value: 'open' },
            { label: 'Draft', value: 'draft' }, { label: 'Paused', value: 'paused' },
            { label: 'Closed', value: 'closed' }, { label: 'Filled', value: 'filled' },
          ]} className="w-40" />
        </div>

        {loading ? <div className="p-4"><SkeletonTable rows={6} cols={6} /></div>
        : jobs.length === 0 ? (
          <EmptyState icon={<Briefcase className="h-6 w-6" />} title="No jobs yet"
            description="Create your first job posting to start hiring."
            action={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>New Job</Button>} />
        ) : (
          <Table>
            <Thead><Tr>
              <Th>Role</Th><Th>Type / Mode</Th><Th>Experience</Th><Th>Compensation</Th>
              <Th align="center">Applicants</Th><Th>Status</Th><Th align="right">Actions</Th>
            </Tr></Thead>
            <Tbody>
              {jobs.map(j => (
                <Tr key={j.id}>
                  <Td>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 flex items-center gap-1.5">
                          {j.title}
                          {j.is_featured && <Badge variant="default" size="sm">Featured</Badge>}
                          {j.is_urgent && <Badge variant="danger" size="sm">Urgent</Badge>}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          {j.code && <span>{j.code}</span>}
                          {j.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{j.location}</span>}
                          {j.ai_interview_enabled && <span className="flex items-center gap-0.5 text-violet-600"><Sparkles className="h-3 w-3" />AI interview</span>}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td><span className="text-xs">{TYPE_LABEL[j.employment_type]}<br /><span className="text-slate-400">{WORK_MODE_LABEL[j.work_mode]}</span></span></Td>
                  <Td className="text-xs">{formatExperience(j.min_experience, j.max_experience)}</Td>
                  <Td className="text-xs">{j.show_salary ? formatSalary(j.salary_min, j.salary_max, j.currency, j.salary_period) : <span className="text-slate-400">Hidden</span>}</Td>
                  <Td align="center"><Link href={`/careers/pipeline?job=${j.id}`}><Badge variant="info">{j.applicant_count}</Badge></Link></Td>
                  <Td><Badge variant={STATUS_VARIANT[j.status]} dot>{j.status}</Badge></Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(j)} title="Edit"><Edit3 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(j.id)} title="Delete"><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Job' : 'New Job Posting'} size="xl"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={save} loading={saving} leftIcon={<Briefcase className="h-3.5 w-3.5" />}>{editId ? 'Save changes' : 'Create job'}</Button>
        </>}>
        {formError && <div className="mb-4"><Alert variant="danger">{formError}</Alert></div>}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Job title" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="Senior Backend Engineer" />
          <Input label="Requisition code" value={form.code} onChange={e => set('code', e.target.value)} placeholder="ENG-SBE-026" />
          <Input label="Department" value={form.department_name} onChange={e => set('department_name', e.target.value)} placeholder="Engineering" />
          <Input label="Location" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Bengaluru, IN / Remote" />
          <Select label="Employment type" value={form.employment_type} onChange={e => set('employment_type', e.target.value)} options={Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label }))} />
          <Select label="Work mode" value={form.work_mode} onChange={e => set('work_mode', e.target.value)} options={Object.entries(WORK_MODE_LABEL).map(([value, label]) => ({ value, label }))} />
          <Select label="Experience level" value={form.experience_level} onChange={e => set('experience_level', e.target.value)} options={['intern', 'junior', 'mid', 'senior', 'lead', 'director'].map(v => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} />
          <Input label="Openings" type="number" min="1" value={form.openings} onChange={e => set('openings', e.target.value)} />
          <Input label="Min experience (yrs)" type="number" min="0" value={form.min_experience} onChange={e => set('min_experience', e.target.value)} />
          <Input label="Max experience (yrs)" type="number" min="0" value={form.max_experience} onChange={e => set('max_experience', e.target.value)} />
          <Input label="Salary min (₹/yr)" type="number" min="0" value={form.salary_min} onChange={e => set('salary_min', e.target.value)} placeholder="3500000" />
          <Input label="Salary max (₹/yr)" type="number" min="0" value={form.salary_max} onChange={e => set('salary_max', e.target.value)} placeholder="5500000" />
        </div>
        <div className="mt-4 space-y-4">
          <Input label="One-line summary" value={form.summary} onChange={e => set('summary', e.target.value)} placeholder="Own our payments and ledger services end-to-end." />
          <Textarea label="Description (full JD)" rows={4} value={form.description} onChange={e => set('description', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Textarea label="Responsibilities (one per line)" rows={4} value={form.responsibilities} onChange={e => set('responsibilities', e.target.value)} />
            <Textarea label="Requirements (one per line)" rows={4} value={form.requirements} onChange={e => set('requirements', e.target.value)} />
          </div>
          <Input label="Skills (comma-separated — drives AI matching)" value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="TypeScript, Node.js, PostgreSQL, AWS" />
          <Input label="Perks (comma-separated)" value={form.perks} onChange={e => set('perks', e.target.value)} placeholder="ESOPs, Remote-first, Health cover" />
          <div className="grid grid-cols-3 gap-4 items-end">
            <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)} options={[
              { value: 'draft', label: 'Draft' }, { value: 'open', label: 'Open (publish)' },
              { value: 'paused', label: 'Paused' }, { value: 'closed', label: 'Closed' }, { value: 'filled', label: 'Filled' },
            ]} />
            <Input label="AI questions" type="number" min="3" max="8" value={form.ai_question_count} onChange={e => set('ai_question_count', e.target.value)} />
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 h-8">
              <input type="checkbox" checked={form.ai_interview_enabled} onChange={e => set('ai_interview_enabled', e.target.checked)} className="rounded border-slate-300" />
              Enable AI interview
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
