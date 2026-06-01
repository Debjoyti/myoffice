'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, Divider
} from '@/components/ui'
import {
  BookOpen, Plus, Play, CheckCircle2, Clock, Users, Award, BarChart3,
  Video, FileText, Brain, Star, TrendingUp, Eye, Edit2, Lock, Unlock
} from 'lucide-react'

const MOCK_COURSES = [
  { id: '1', title: 'Induction & Company Orientation', category: 'Onboarding', type: 'mixed', modules: 8, duration_hrs: 4, enrolled: 24, completed: 20, rating: 4.8, status: 'published', mandatory: true, created: '2026-04-01' },
  { id: '2', title: 'IATF 16949 Quality System Training', category: 'Compliance', type: 'video', modules: 12, duration_hrs: 6, enrolled: 45, completed: 38, rating: 4.5, status: 'published', mandatory: true, created: '2026-03-15' },
  { id: '3', title: 'Advanced MS Excel for Finance', category: 'Skills', type: 'video', modules: 10, duration_hrs: 5, enrolled: 18, completed: 11, rating: 4.2, status: 'published', mandatory: false, created: '2026-02-10' },
  { id: '4', title: 'Leadership & People Management', category: 'Leadership', type: 'mixed', modules: 15, duration_hrs: 8, enrolled: 12, completed: 5, rating: 4.9, status: 'published', mandatory: false, created: '2026-01-20' },
  { id: '5', title: 'POSH — Prevention of Sexual Harassment', category: 'Compliance', type: 'video', modules: 5, duration_hrs: 2, enrolled: 89, completed: 89, rating: 4.1, status: 'published', mandatory: true, created: '2026-01-01' },
  { id: '6', title: 'Sales Excellence Program', category: 'Skills', type: 'mixed', modules: 20, duration_hrs: 12, enrolled: 8, completed: 0, rating: 0, status: 'draft', mandatory: false, created: '2026-05-20' },
]

const MOCK_ENROLLMENTS = [
  { id: 'e1', employee: 'Arjun Mehta', dept: 'Engineering', course: 'IATF 16949 Quality System Training', progress: 100, score: 88, status: 'completed', enrolled: '2026-05-01', completed_on: '2026-05-15', cert: true },
  { id: 'e2', employee: 'Priya Sharma', dept: 'HR', course: 'Leadership & People Management', progress: 60, score: null, status: 'in_progress', enrolled: '2026-05-10', completed_on: null, cert: false },
  { id: 'e3', employee: 'Rahul Gupta', dept: 'Finance', course: 'Advanced MS Excel for Finance', progress: 100, score: 92, status: 'completed', enrolled: '2026-04-15', completed_on: '2026-04-28', cert: true },
  { id: 'e4', employee: 'Sneha Patel', dept: 'Sales', course: 'Sales Excellence Program', progress: 0, score: null, status: 'not_started', enrolled: '2026-05-28', completed_on: null, cert: false },
  { id: 'e5', employee: 'Vikram Nair', dept: 'Production', course: 'IATF 16949 Quality System Training', progress: 45, score: null, status: 'in_progress', enrolled: '2026-05-05', completed_on: null, cert: false },
]

const STATUS_VARIANT: Record<string, any> = {
  published: 'success', draft: 'neutral',
  completed: 'success', in_progress: 'info', not_started: 'neutral', failed: 'danger',
}
const TYPE_ICON: Record<string, React.ReactNode> = {
  video: <Video className="h-3 w-3" />,
  mixed: <BookOpen className="h-3 w-3" />,
  quiz: <Brain className="h-3 w-3" />,
}

export default function LMSPage() {
  const [tab, setTab] = useState('courses')
  const [search, setSearch] = useState('')
  const [newCourse, setNewCourse] = useState(false)
  const [viewCourse, setViewCourse] = useState<any>(null)

  const totalEnrolled  = MOCK_COURSES.reduce((s, c) => s + c.enrolled, 0)
  const totalCompleted = MOCK_COURSES.reduce((s, c) => s + c.completed, 0)
  const completionRate = Math.round((totalCompleted / totalEnrolled) * 100)
  const mandatoryCourses = MOCK_COURSES.filter(c => c.mandatory && c.status === 'published').length

  const filtered = MOCK_COURSES.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Learning Management System"
        description="Courses, compliance training, skill development, certifications, and learning paths"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Award className="h-3.5 w-3.5" />}>Certificates</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewCourse(true)}>Create Course</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Courses" value={MOCK_COURSES.length.toString()} icon={<BookOpen className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Total Enrollments" value={totalEnrolled.toString()} icon={<Users className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" delta={{ value: '+5% vs last month', positive: true }} />
        <StatCard label="Mandatory Courses" value={mandatoryCourses.toString()} icon={<Lock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
      </div>

      <TabBar
        tabs={[
          { id: 'courses', label: 'Course Library', count: MOCK_COURSES.length },
          { id: 'enrollments', label: 'Enrollments', count: MOCK_ENROLLMENTS.length },
          { id: 'reports', label: 'Reports' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <SearchInput placeholder="Search courses..." value={search} onChange={setSearch} className="w-64" />
            <select className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white">
              <option>All Categories</option>
              {['Onboarding','Compliance','Skills','Leadership'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(course => {
              const pct = course.enrolled > 0 ? Math.round((course.completed / course.enrolled) * 100) : 0
              return (
                <Card key={course.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewCourse(course)}>
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-800 text-sm">{course.title}</p>
                        {course.mandatory && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-semibold">Mandatory</span>}
                        <Badge variant={STATUS_VARIANT[course.status]}>{course.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">{TYPE_ICON[course.type]}{course.type}</span>
                        <span>{course.modules} modules</span>
                        <span><Clock className="h-3 w-3 inline mr-0.5" />{course.duration_hrs}h</span>
                        {course.rating > 0 && <span><Star className="h-3 w-3 inline mr-0.5 text-amber-400" />{course.rating}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
                    <div><p className="text-slate-400">Enrolled</p><p className="font-bold text-slate-700">{course.enrolled}</p></div>
                    <div><p className="text-slate-400">Completed</p><p className="font-bold text-emerald-600">{course.completed}</p></div>
                    <div><p className="text-slate-400">Completion</p><p className={`font-bold ${pct >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>{pct}%</p></div>
                  </div>
                  <div className="mt-2">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'enrollments' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">All Enrollments</p>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>Enroll Employees</Button>
          </div>
          <Table>
            <Thead><tr><Th>Employee</Th><Th>Department</Th><Th>Course</Th><Th>Enrolled</Th><Th>Progress</Th><Th>Score</Th><Th>Status</Th><Th>Certificate</Th></tr></Thead>
            <Tbody>
              {MOCK_ENROLLMENTS.map(e => (
                <Tr key={e.id}>
                  <Td><span className="font-medium text-slate-800">{e.employee}</span></Td>
                  <Td><span className="text-xs text-slate-500">{e.dept}</span></Td>
                  <Td><span className="text-sm text-slate-700">{e.course}</span></Td>
                  <Td><span className="text-xs text-slate-500">{e.enrolled}</span></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${e.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${e.progress}%` }} />
                      </div>
                      <span className="text-xs font-semibold">{e.progress}%</span>
                    </div>
                  </Td>
                  <Td><span className={`font-semibold ${e.score ? (e.score >= 80 ? 'text-emerald-600' : 'text-amber-600') : 'text-slate-300'}`}>{e.score ? `${e.score}%` : '—'}</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[e.status]}>{e.status.replace('_', ' ')}</Badge></Td>
                  <Td>{e.cert ? <Button variant="ghost" size="sm" leftIcon={<Award className="h-3.5 w-3.5 text-amber-500" />}>Download</Button> : <span className="text-slate-300 text-xs">—</span>}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Compliance Training Status" description="Mandatory course completion" />
            <div className="space-y-3 mt-3">
              {MOCK_COURSES.filter(c => c.mandatory && c.status === 'published').map(c => {
                const pct = Math.round((c.completed / c.enrolled) * 100)
                return (
                  <div key={c.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 truncate mr-2">{c.title}</span>
                      <span className={`font-bold flex-shrink-0 ${pct >= 80 ? 'text-emerald-600' : 'text-red-600'}`}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
          <Card>
            <CardHeader title="Learning Hours by Department" />
            <div className="space-y-3 mt-3">
              {[
                { dept: 'Engineering', hrs: 48, employees: 12 },
                { dept: 'Production', hrs: 72, employees: 28 },
                { dept: 'HR & Admin', hrs: 24, employees: 8 },
                { dept: 'Finance', hrs: 36, employees: 10 },
                { dept: 'Sales', hrs: 60, employees: 15 },
              ].map(row => (
                <div key={row.dept} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">{row.dept}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs">{row.employees} employees</span>
                    <span className="font-bold text-blue-600">{row.hrs}h</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Modal open={newCourse} onClose={() => setNewCourse(false)} title="Create New Course" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewCourse(false)}>Cancel</Button><Button variant="outline" size="sm">Save Draft</Button><Button size="sm">Publish Course</Button></>}
      >
        <div className="space-y-4">
          <Input label="Course Title *" required placeholder="e.g. Advanced Excel for Finance" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" options={['Onboarding','Compliance','Skills','Leadership','Technical','Safety'].map(c => ({ label: c, value: c }))} />
            <Select label="Course Type" options={[{ label: 'Video Course', value: 'video' }, { label: 'Mixed (Video + Quiz)', value: 'mixed' }, { label: 'Document + Quiz', value: 'document' }]} />
            <Input label="Duration (hours)" type="number" placeholder="4" />
            <Select label="Difficulty" options={['Beginner','Intermediate','Advanced'].map(d => ({ label: d, value: d }))} />
          </div>
          <Textarea label="Description" rows={3} placeholder="What will learners gain from this course?" />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-slate-700">Mandatory for all employees</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-slate-700">Issue certificate on completion</span>
            </label>
          </div>
          <Input label="Passing Score (%)" type="number" placeholder="70" />
        </div>
      </Modal>
    </div>
  )
}
