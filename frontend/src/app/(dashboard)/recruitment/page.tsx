'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, TabBar, Modal, Input, Select, Textarea, EmptyState
} from '@/components/ui'
import { Briefcase, Users, CheckCircle2, Clock, Plus, FlaskConical } from 'lucide-react'

type JobStatus = 'Open' | 'Paused' | 'Closed'
type CandidateStatus = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected'

type Job = {
  id: string; title: string; department: string; location: string; type: string
  status: JobStatus; applicants: number; posted: string; description: string
}

type Candidate = {
  id: string; name: string; email: string; role: string; applied: string
  status: CandidateStatus; score: number
}

const JOBS: Job[] = [
  { id: 'JD-001', title: 'Senior Software Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time', status: 'Open', applicants: 24, posted: '01 May 2026', description: 'Build scalable backend services and APIs for the PRSK platform.' },
  { id: 'JD-002', title: 'Product Manager', department: 'Product', location: 'Bangalore', type: 'Full-time', status: 'Open', applicants: 18, posted: '05 May 2026', description: 'Own product roadmap and work closely with engineering and design teams.' },
  { id: 'JD-003', title: 'UX Designer', department: 'Design', location: 'Remote', type: 'Contract', status: 'Open', applicants: 11, posted: '10 May 2026', description: 'Design intuitive experiences for enterprise HR and finance workflows.' },
  { id: 'JD-004', title: 'DevOps Engineer', department: 'Engineering', location: 'Hyderabad', type: 'Full-time', status: 'Paused', applicants: 7, posted: '15 Apr 2026', description: 'Maintain CI/CD pipelines, Kubernetes clusters, and cloud infrastructure.' },
]

const CANDIDATES: Candidate[] = [
  { id: 'C-001', name: 'Arjun Menon', email: 'arjun.m@email.com', role: 'Senior Software Engineer', applied: '03 May 2026', status: 'Interview', score: 87 },
  { id: 'C-002', name: 'Kavya Nair', email: 'kavya.n@email.com', role: 'Product Manager', applied: '06 May 2026', status: 'Screening', score: 74 },
  { id: 'C-003', name: 'Rohit Gupta', email: 'rohit.g@email.com', role: 'Senior Software Engineer', applied: '04 May 2026', status: 'Offer', score: 91 },
  { id: 'C-004', name: 'Meera Pillai', email: 'meera.p@email.com', role: 'UX Designer', applied: '12 May 2026', status: 'Applied', score: 68 },
  { id: 'C-005', name: 'Aditya Shah', email: 'aditya.s@email.com', role: 'DevOps Engineer', applied: '20 Apr 2026', status: 'Rejected', score: 55 },
]

const JOB_COLOR: Record<JobStatus, 'success' | 'warning' | 'neutral'> = { Open: 'success', Paused: 'warning', Closed: 'neutral' }
const CAND_COLOR: Record<CandidateStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  Applied: 'neutral', Screening: 'info', Interview: 'warning', Offer: 'success', Hired: 'success', Rejected: 'danger',
}

export default function RecruitmentPage() {
  const [tab, setTab] = useState('jobs')
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [newJob, setNewJob] = useState(false)
  const [newCand, setNewCand] = useState(false)

  const open = JOBS.filter(j => j.status === 'Open').length
  const totalCandidates = CANDIDATES.length
  const inPipeline = CANDIDATES.filter(c => !['Rejected', 'Hired'].includes(c.status)).length
  const hired = CANDIDATES.filter(c => c.status === 'Hired').length

  const filteredCandidates = useMemo(() =>
    CANDIDATES.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase())),
    [search]
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — Recruitment data is illustrative. Full ATS integration is on the roadmap.</span>
      </div>

      <PageHeader
        title="Recruitment (ATS)"
        description="Manage job openings, track candidates, and streamline hiring"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewCand(true)}>Add Candidate</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewJob(true)}>Post Job</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Open Roles" value={open} icon={<Briefcase className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Total Candidates" value={totalCandidates} icon={<Users className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="In Pipeline" value={inPipeline} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Hired This Month" value={hired} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
      </div>

      <TabBar
        tabs={[
          { id: 'jobs', label: 'Open Roles', count: JOBS.length },
          { id: 'candidates', label: 'Candidates', count: CANDIDATES.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'jobs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {JOBS.map(j => (
            <Card key={j.id} hover onClick={() => setSelectedJob(j)}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{j.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{j.department} · {j.location} · {j.type}</p>
                </div>
                <Badge variant={JOB_COLOR[j.status]}>{j.status}</Badge>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{j.description}</p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-semibold text-slate-700">{j.applicants} applicants</span>
                </div>
                <span className="text-xs text-slate-400">Posted {j.posted}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'candidates' && (
        <Card padding="none">
          <div className="px-5 pt-5 pb-4">
            <SearchInput placeholder="Search candidates or roles..." value={search} onChange={setSearch} className="w-80" />
          </div>
          <Table>
            <Thead><tr><Th>Candidate</Th><Th>Role</Th><Th>Applied</Th><Th>AI Score</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {filteredCandidates.map(c => (
                <Tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar name={c.name} size="xs" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                        <p className="text-[11px] text-slate-400">{c.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><span className="text-xs text-slate-600">{c.role}</span></Td>
                  <Td><span className="text-xs text-slate-500">{c.applied}</span></Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${c.score >= 80 ? 'bg-emerald-500' : c.score >= 60 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${c.score}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-700">{c.score}</span>
                    </div>
                  </Td>
                  <Td><Badge variant={CAND_COLOR[c.status]} dot size="sm">{c.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Job Detail */}
      <Modal open={!!selectedJob} onClose={() => setSelectedJob(null)} title={selectedJob?.id ?? ''} size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelectedJob(null)}>Close</Button>
          <Button size="sm">View Applicants</Button>
        </>}
      >
        {selectedJob && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{selectedJob.title}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{selectedJob.department} · {selectedJob.location} · {selectedJob.type}</p>
              </div>
              <Badge variant={JOB_COLOR[selectedJob.status]}>{selectedJob.status}</Badge>
            </div>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{selectedJob.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Applicants', value: `${selectedJob.applicants} candidates` },
                { label: 'Posted', value: selectedJob.posted },
              ].map(r => (
                <div key={r.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-0.5">{r.label}</p>
                  <p className="font-medium text-slate-800">{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Post Job Modal */}
      <Modal open={newJob} onClose={() => setNewJob(false)} title="Post New Job" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewJob(false)}>Cancel</Button>
          <Button size="sm">Post Job</Button>
        </>}
      >
        <div className="space-y-4">
          <Input label="Job Title" placeholder="e.g. Senior Software Engineer" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Department" placeholder="e.g. Engineering" required />
            <Input label="Location" placeholder="e.g. Remote / Bangalore" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Job Type" options={[
              { label: 'Full-time', value: 'Full-time' },
              { label: 'Part-time', value: 'Part-time' },
              { label: 'Contract', value: 'Contract' },
              { label: 'Internship', value: 'Internship' },
            ]} />
          </div>
          <Textarea label="Job Description" placeholder="Role responsibilities, requirements, and perks..." rows={4} required />
        </div>
      </Modal>

      {/* Add Candidate Modal */}
      <Modal open={newCand} onClose={() => setNewCand(false)} title="Add Candidate" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewCand(false)}>Cancel</Button>
          <Button size="sm">Add to Pipeline</Button>
        </>}
      >
        <div className="space-y-4">
          <Select label="Job Role" options={JOBS.map(j => ({ label: j.title, value: j.id }))} />
          <Input label="Candidate Name" placeholder="Full name" required />
          <Input label="Email Address" type="email" placeholder="candidate@email.com" required />
          <Input label="Resume Link" placeholder="https://..." />
        </div>
      </Modal>
    </div>
  )
}
