'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, Modal, Input, Select, Textarea, EmptyState, Alert, SkeletonTable
} from '@/components/ui'
import { Briefcase, Users, TrendingUp, CheckCircle2, Plus, FlaskConical, RefreshCw } from 'lucide-react'

type ApiPosition = {
  id: string
  title: string
  code: string
  level: string
  min_ctc: number | null
  max_ctc: number | null
  is_active: boolean
  created_at: string
  dept?: { id: string; name: string; code: string } | null
}

type Candidate = {
  id: string; name: string; role: string; stage: string; score: number; applied: string
}

const MOCK_POSITIONS: ApiPosition[] = [
  { id: '1', title: 'Senior Software Engineer', code: 'ENG-SSE', level: 'Senior', min_ctc: 1500000, max_ctc: 2200000, is_active: true, created_at: '2026-05-01T00:00:00Z', dept: { id: '1', name: 'Engineering', code: 'ENG' } },
  { id: '2', title: 'Product Manager', code: 'PRD-PM', level: 'Mid', min_ctc: 1800000, max_ctc: 2500000, is_active: true, created_at: '2026-05-05T00:00:00Z', dept: { id: '2', name: 'Product', code: 'PRD' } },
  { id: '3', title: 'UX Designer', code: 'DES-UX', level: 'Mid', min_ctc: 1200000, max_ctc: 1800000, is_active: true, created_at: '2026-05-10T00:00:00Z', dept: { id: '3', name: 'Design', code: 'DES' } },
  { id: '4', title: 'DevOps Engineer', code: 'ENG-DO', level: 'Senior', min_ctc: 1400000, max_ctc: 2000000, is_active: false, created_at: '2026-04-15T00:00:00Z', dept: { id: '1', name: 'Engineering', code: 'ENG' } },
]

const MOCK_CANDIDATES: Candidate[] = [
  { id: '1', name: 'Arjun Menon', role: 'Senior Software Engineer', stage: 'Offer', score: 92, applied: '15 May 2026' },
  { id: '2', name: 'Kavya Nair', role: 'Product Manager', stage: 'Interview', score: 85, applied: '18 May 2026' },
  { id: '3', name: 'Rohit Gupta', role: 'DevOps Engineer', stage: 'Screening', score: 78, applied: '20 May 2026' },
  { id: '4', name: 'Meera Pillai', role: 'UX Designer', stage: 'Application', score: 71, applied: '22 May 2026' },
  { id: '5', name: 'Siddharth Rao', role: 'Senior Software Engineer', stage: 'Interview', score: 88, applied: '24 May 2026' },
]

const STAGE_COLOR: Record<string, 'neutral' | 'info' | 'warning' | 'success'> = {
  Application: 'neutral', Screening: 'info', Interview: 'warning', Offer: 'success',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

const INITIAL_JOB_FORM = { title: '', level: 'mid', department: '', min_ctc: '', max_ctc: '', description: '' }
const INITIAL_CAND_FORM = { name: '', email: '', role: '', stage: 'Application', notes: '' }

export default function RecruitmentPage() {
  const [positions, setPositions] = useState<ApiPosition[]>(MOCK_POSITIONS)
  const [candidates, setCandidates] = useState<Candidate[]>(MOCK_CANDIDATES)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(false)
  const [tab, setTab] = useState('jobs')
  const [jobModal, setJobModal] = useState(false)
  const [candModal, setCandModal] = useState(false)
  const [savingJob, setSavingJob] = useState(false)
  const [savingCand, setSavingCand] = useState(false)
  const [jobError, setJobError] = useState('')
  const [candError, setCandError] = useState('')
  const [jobForm, setJobForm] = useState(INITIAL_JOB_FORM)
  const [candForm, setCandForm] = useState(INITIAL_CAND_FORM)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/positions')
      if (res.ok) {
        const data = await res.json()
        if (data.positions?.length > 0) {
          setPositions(data.positions)
          setIsPreview(false)
          return
        }
      }
    } catch { /* fall through */ }
    setPositions(MOCK_POSITIONS)
    setIsPreview(true)
  }, [])

  useEffect(() => { fetchData().finally(() => setLoading(false)) }, [fetchData])

  const handlePostJob = async () => {
    if (!jobForm.title.trim()) { setJobError('Job title is required'); return }
    setSavingJob(true)
    setJobError('')
    try {
      const res = await fetch('/api/v1/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobForm.title,
          level: jobForm.level,
          ...(jobForm.min_ctc ? { min_ctc: Number(jobForm.min_ctc) } : {}),
          ...(jobForm.max_ctc ? { max_ctc: Number(jobForm.max_ctc) } : {}),
        }),
      })
      if (res.ok) {
        setJobModal(false)
        setJobForm(INITIAL_JOB_FORM)
        fetchData()
        return
      }
    } catch { /* optimistic */ }
    setPositions(prev => [{
      id: `temp-${Date.now()}`,
      title: jobForm.title,
      code: jobForm.title.toUpperCase().replace(/\s+/g, '-').slice(0, 10),
      level: jobForm.level,
      min_ctc: jobForm.min_ctc ? Number(jobForm.min_ctc) : null,
      max_ctc: jobForm.max_ctc ? Number(jobForm.max_ctc) : null,
      is_active: true,
      created_at: new Date().toISOString(),
      dept: jobForm.department ? { id: 'new', name: jobForm.department, code: jobForm.department.toUpperCase().slice(0, 3) } : null,
    }, ...prev])
    setJobModal(false)
    setJobForm(INITIAL_JOB_FORM)
    setSavingJob(false)
  }

  const handleAddCandidate = async () => {
    if (!candForm.name.trim()) { setCandError('Candidate name is required'); return }
    if (!candForm.role.trim()) { setCandError('Role is required'); return }
    setSavingCand(true)
    setCandError('')
    await new Promise(r => setTimeout(r, 400))
    setCandidates(prev => [{
      id: `temp-${Date.now()}`,
      name: candForm.name,
      role: candForm.role,
      stage: candForm.stage,
      score: 0,
      applied: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    }, ...prev])
    setCandModal(false)
    setCandForm(INITIAL_CAND_FORM)
    setSavingCand(false)
  }

  const openRoles = useMemo(() => positions.filter(p => p.is_active).length, [positions])
  const inPipeline = useMemo(() => candidates.filter(c => c.stage !== 'Offer').length, [candidates])
  const hired = useMemo(() => candidates.filter(c => c.stage === 'Offer').length, [candidates])

  return (
    <div className="space-y-6 animate-fadeIn">
      {isPreview && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
          <span><strong>Preview mode</strong> — Recruitment data is illustrative. Full ATS integration is on the roadmap.</span>
        </div>
      )}

      <PageHeader
        title="Recruitment (ATS)"
        description="Manage job openings, track candidates, and streamline hiring"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchData}>Refresh</Button>
            <Button variant="secondary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setCandModal(true); setCandError('') }}>Add Candidate</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setJobModal(true); setJobError('') }}>Post Job</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Open Roles" value={openRoles} icon={<Briefcase className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Total Candidates" value={candidates.length} icon={<Users className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="In Pipeline" value={inPipeline} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Offers Extended" value={hired} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
      </div>

      <TabBar
        tabs={[
          { id: 'jobs', label: 'Open Roles', count: positions.length },
          { id: 'candidates', label: 'Candidates', count: candidates.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'jobs' && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-36 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : positions.length === 0 ? (
          <Card><EmptyState icon={<Briefcase className="h-6 w-6" />} title="No open roles" description="Post a job opening to get started" /></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {positions.map(p => (
              <Card key={p.id} hover>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 mr-2">
                    <h3 className="font-semibold text-slate-900 text-sm leading-tight">{p.title}</h3>
                    {p.dept && <p className="text-xs text-slate-500 mt-0.5">{p.dept.name}</p>}
                  </div>
                  <Badge variant={p.is_active ? 'success' : 'neutral'} size="sm">{p.is_active ? 'Open' : 'Paused'}</Badge>
                </div>
                {p.level && <p className="text-xs text-slate-400 mb-2 capitalize">{p.level} level</p>}
                {(p.min_ctc || p.max_ctc) && (
                  <p className="text-xs text-blue-600 font-medium mb-2">
                    {p.min_ctc && p.max_ctc ? `${fmt(p.min_ctc)} – ${fmt(p.max_ctc)}` : p.min_ctc ? `From ${fmt(p.min_ctc)}` : `Up to ${fmt(p.max_ctc!)}`}
                    {' '}<span className="text-slate-400 font-normal">/ yr</span>
                  </p>
                )}
                <p className="text-[11px] text-slate-400">Posted {fmtDate(p.created_at)}</p>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'candidates' && (
        <Card padding="none">
          <Table>
            <Thead>
              <tr><Th>Candidate</Th><Th>Role</Th><Th>Stage</Th><Th>AI Score</Th><Th>Applied</Th></tr>
            </Thead>
            <Tbody>
              {candidates.map(c => (
                <Tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar name={c.name} size="sm" />
                      <span className="text-xs font-semibold text-slate-800">{c.name}</span>
                    </div>
                  </Td>
                  <Td><span className="text-xs text-slate-600">{c.role}</span></Td>
                  <Td><Badge variant={STAGE_COLOR[c.stage] ?? 'neutral'} size="sm">{c.stage}</Badge></Td>
                  <Td>
                    {c.score > 0 ? (
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${c.score}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 tabular-nums">{c.score}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Not scored</span>
                    )}
                  </Td>
                  <Td><span className="text-xs text-slate-400">{c.applied}</span></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Post Job Modal */}
      <Modal open={jobModal} onClose={() => { setJobModal(false); setJobError('') }} title="Post New Job" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setJobModal(false)}>Cancel</Button>
          <Button size="sm" loading={savingJob} onClick={handlePostJob}>Post Job</Button>
        </>}
      >
        <div className="space-y-4">
          {jobError && <Alert variant="danger">{jobError}</Alert>}
          <Input label="Job Title" placeholder="e.g. Senior Software Engineer" required value={jobForm.title} onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Level" options={[
              { label: 'Internship', value: 'internship' },
              { label: 'Junior', value: 'junior' },
              { label: 'Mid-level', value: 'mid' },
              { label: 'Senior', value: 'senior' },
              { label: 'Lead / Manager', value: 'lead' },
            ]} value={jobForm.level} onChange={e => setJobForm(f => ({ ...f, level: (e.target as HTMLSelectElement).value }))} />
            <Input label="Department" placeholder="e.g. Engineering" value={jobForm.department} onChange={e => setJobForm(f => ({ ...f, department: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min CTC (₹/yr)" type="number" placeholder="1200000" value={jobForm.min_ctc} onChange={e => setJobForm(f => ({ ...f, min_ctc: e.target.value }))} />
            <Input label="Max CTC (₹/yr)" type="number" placeholder="2000000" value={jobForm.max_ctc} onChange={e => setJobForm(f => ({ ...f, max_ctc: e.target.value }))} />
          </div>
          <Textarea label="Job Description (optional)" placeholder="Briefly describe the role and requirements..." rows={3} value={jobForm.description} onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))} />
        </div>
      </Modal>

      {/* Add Candidate Modal */}
      <Modal open={candModal} onClose={() => { setCandModal(false); setCandError('') }} title="Add Candidate" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setCandModal(false)}>Cancel</Button>
          <Button size="sm" loading={savingCand} onClick={handleAddCandidate}>Add Candidate</Button>
        </>}
      >
        <div className="space-y-4">
          {candError && <Alert variant="danger">{candError}</Alert>}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" placeholder="Candidate name" required value={candForm.name} onChange={e => setCandForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Email" type="email" placeholder="candidate@email.com" value={candForm.email} onChange={e => setCandForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Applying For" placeholder="Job title" required value={candForm.role} onChange={e => setCandForm(f => ({ ...f, role: e.target.value }))} />
            <Select label="Current Stage" options={[
              { label: 'Application', value: 'Application' },
              { label: 'Screening', value: 'Screening' },
              { label: 'Interview', value: 'Interview' },
              { label: 'Offer', value: 'Offer' },
            ]} value={candForm.stage} onChange={e => setCandForm(f => ({ ...f, stage: (e.target as HTMLSelectElement).value }))} />
          </div>
          <Textarea label="Notes" placeholder="Any notes about this candidate..." rows={2} value={candForm.notes} onChange={e => setCandForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
