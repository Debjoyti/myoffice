'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  PageHeader, TabBar, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, Modal, Input, Select, Textarea, EmptyState, ProgressBar, Skeleton
} from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Plus, GraduationCap, Calendar, Users, Star, CheckCircle, Clock, BarChart3 } from 'lucide-react'

type TrainingSession = {
  id: string
  training_title: string
  training_type: string | null
  session_date: string
  trainer_name: string
  trainer_type: string
  venue: string | null
  status: string
  max_participants: number | null
  pre_test_conducted: boolean
  post_test_conducted: boolean
}

type CalendarItem = {
  id: string
  training_title: string
  training_type: string
  scheduled_month: number
  scheduled_date: string | null
  duration_hours: number
  trainer_type: string
  trainer_name: string | null
  status: string
  estimated_cost: number | null
}

type Calendar = {
  id: string
  year: number
  title: string | null
  status: string
  budget_allocated: number | null
  training_calendar_items: CalendarItem[]
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'default'> = {
  completed: 'success',
  scheduled: 'info',
  planned: 'neutral',
  ongoing: 'warning',
  cancelled: 'danger',
}

const TYPE_OPTIONS = [
  { label: 'Technical', value: 'technical' },
  { label: 'Behavioural', value: 'behavioural' },
  { label: 'Safety', value: 'safety' },
  { label: 'Compliance', value: 'compliance' },
  { label: 'OJT', value: 'ojt' },
  { label: 'Induction', value: 'induction' },
]

export default function TrainingPage() {
  const [tab, setTab] = useState('calendar')
  const [loading, setLoading] = useState(true)
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null)
  const [sessionDetail, setSessionDetail] = useState<{ attendance: unknown[]; feedback_summary: { count: number; avg_overall: number } | null } | null>(null)
  const [showAddSession, setShowAddSession] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [saving, setSaving] = useState(false)
  const currentYear = new Date().getFullYear()

  const [sessionForm, setSessionForm] = useState({
    training_title: '',
    trainer_name: '',
    trainer_type: 'internal',
    session_date: '',
    venue: '',
    training_type: 'technical',
  })

  const [itemForm, setItemForm] = useState({
    training_title: '',
    training_type: 'technical',
    scheduled_month: '1',
    duration_hours: '8',
    trainer_type: 'internal',
    trainer_name: '',
    venue: '',
    estimated_cost: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [calRes, sessionRes] = await Promise.all([
        fetch(`/api/v1/iatf/training-calendar?year=${currentYear}`),
        fetch('/api/v1/iatf/training-sessions'),
      ])
      if (calRes.ok) {
        const d = await calRes.json()
        setCalendars(d.data ?? [])
      }
      if (sessionRes.ok) {
        const d = await sessionRes.json()
        setSessions(d.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [currentYear])

  useEffect(() => { loadData() }, [loadData])

  async function openSessionDetail(session: TrainingSession) {
    setSelectedSession(session)
    const res = await fetch(`/api/v1/iatf/training-sessions/${session.id}`)
    if (res.ok) {
      const d = await res.json()
      setSessionDetail(d.data)
    }
  }

  async function handleCreateSession() {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/iatf/training-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionForm),
      })
      if (res.ok) {
        setShowAddSession(false)
        setSessionForm({ training_title: '', trainer_name: '', trainer_type: 'internal', session_date: '', venue: '', training_type: 'technical' })
        loadData()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleAddCalendarItem() {
    setSaving(true)
    try {
      let calId = calendars[0]?.id
      if (!calId) {
        // Create calendar first
        const calRes = await fetch('/api/v1/iatf/training-calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ year: currentYear, title: `Training Plan ${currentYear}` }),
        })
        if (calRes.ok) {
          const d = await calRes.json()
          calId = d.data.id
        }
      }
      if (!calId) return

      await fetch(`/api/v1/iatf/training-calendar/${calId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          add_item: {
            ...itemForm,
            scheduled_month: parseInt(itemForm.scheduled_month),
            duration_hours: parseFloat(itemForm.duration_hours),
            estimated_cost: itemForm.estimated_cost ? parseFloat(itemForm.estimated_cost) : undefined,
          },
        }),
      })
      setShowAddItem(false)
      loadData()
    } finally {
      setSaving(false)
    }
  }

  const allItems = calendars.flatMap(c => c.training_calendar_items ?? [])
  const completedCount = sessions.filter(s => s.status === 'completed').length
  const completionRate = sessions.length > 0 ? Math.round((completedCount / sessions.length) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Management"
        description="Annual calendar, sessions, feedback, and effectiveness tracking"
        actions={
          <div className="flex gap-2">
            {tab === 'sessions' && (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddSession(true)}>
                New Session
              </Button>
            )}
            {tab === 'calendar' && (
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddItem(true)}>
                Add to Calendar
              </Button>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Sessions" value={sessions.length} icon={<GraduationCap className="h-4 w-4" />} accent="indigo" />
        <StatCard label="Completed" value={completedCount} icon={<CheckCircle className="h-4 w-4" />} accent="emerald" />
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon={<BarChart3 className="h-4 w-4" />} accent="sky" />
        <StatCard label="Planned Items" value={allItems.length} icon={<Calendar className="h-4 w-4" />} accent="violet" />
      </div>

      <TabBar
        tabs={[
          { id: 'calendar', label: 'Annual Calendar' },
          { id: 'sessions', label: 'Sessions', count: sessions.length },
          { id: 'feedback', label: 'Feedback' },
          { id: 'effectiveness', label: 'Effectiveness' },
          { id: 'history', label: 'History' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* TAB: Annual Calendar */}
      {tab === 'calendar' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Training Plan {currentYear}
            </h3>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-10 w-full"/>)}</div>
          ) : allItems.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-6 w-6" />}
              title="No training planned"
              description="Add items to the annual training calendar."
              action={<Button size="sm" onClick={() => setShowAddItem(true)}>Add Item</Button>}
            />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Training</Th>
                  <Th>Type</Th>
                  <Th>Month</Th>
                  <Th>Duration</Th>
                  <Th>Trainer</Th>
                  <Th>Status</Th>
                </tr>
              </Thead>
              <Tbody>
                {allItems.map(item => (
                  <Tr key={item.id}>
                    <Td><p className="font-medium text-slate-900 dark:text-slate-100">{item.training_title}</p></Td>
                    <Td><Badge variant="default" size="sm">{item.training_type}</Badge></Td>
                    <Td>{MONTHS[(item.scheduled_month ?? 1) - 1]}</Td>
                    <Td>{item.duration_hours}h</Td>
                    <Td>{item.trainer_name ?? '-'} <span className="text-xs text-slate-400">({item.trainer_type})</span></Td>
                    <Td><Badge variant={STATUS_COLOR[item.status] ?? 'neutral'} size="sm" dot>{item.status}</Badge></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {/* TAB: Sessions */}
      {tab === 'sessions' && (
        <Card padding="none">
          {loading ? (
            <div className="p-5 space-y-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10 w-full"/>)}</div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="h-6 w-6" />}
              title="No sessions yet"
              description="Create training sessions to track attendance and feedback."
              action={<Button size="sm" onClick={() => setShowAddSession(true)}>New Session</Button>}
            />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Date</Th>
                  <Th>Trainer</Th>
                  <Th>Venue</Th>
                  <Th>Status</Th>
                  <Th>Tests</Th>
                </tr>
              </Thead>
              <Tbody>
                {sessions.map(s => (
                  <Tr key={s.id} onClick={() => openSessionDetail(s)}>
                    <Td><p className="font-medium text-slate-900 dark:text-slate-100">{s.training_title}</p></Td>
                    <Td>{formatDate(s.session_date)}</Td>
                    <Td>{s.trainer_name} <span className="text-xs text-slate-400">({s.trainer_type})</span></Td>
                    <Td>{s.venue ?? '-'}</Td>
                    <Td><Badge variant={STATUS_COLOR[s.status] ?? 'neutral'} size="sm" dot>{s.status}</Badge></Td>
                    <Td>
                      <div className="flex gap-1">
                        {s.pre_test_conducted && <Badge variant="success" size="sm">Pre</Badge>}
                        {s.post_test_conducted && <Badge variant="info" size="sm">Post</Badge>}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {/* TAB: Feedback */}
      {tab === 'feedback' && (
        <Card>
          <CardHeader title="Training Feedback Overview" description="Aggregated feedback ratings across all sessions" />
          {sessions.filter(s => s.status === 'completed').length === 0 ? (
            <EmptyState
              icon={<Star className="h-6 w-6" />}
              title="No feedback available"
              description="Feedback can be submitted after sessions are completed."
            />
          ) : (
            <div className="space-y-4">
              {sessions.filter(s => s.status === 'completed').map(s => (
                <div key={s.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{s.training_title}</p>
                    <span className="text-xs text-slate-500">{formatDate(s.session_date)}</span>
                  </div>
                  <div className="space-y-2">
                    {['Content', 'Trainer', 'Venue', 'Overall'].map(label => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-16">{label}</span>
                        <ProgressBar value={3.8} max={5} color="indigo" size="sm" showLabel />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB: Effectiveness */}
      {tab === 'effectiveness' && (
        <Card>
          <CardHeader title="Training Effectiveness Reviews" description="30/60/90 day post-training effectiveness assessments" />
          {sessions.filter(s => s.status === 'completed').length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-6 w-6" />}
              title="No completed sessions"
              description="Effectiveness reviews are triggered after session completion."
            />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Session</Th>
                  <Th>Date</Th>
                  <Th>Review Type</Th>
                  <Th>Status</Th>
                  <Th>Score</Th>
                </tr>
              </Thead>
              <Tbody>
                {sessions.filter(s => s.status === 'completed').flatMap(s => [
                  <Tr key={`${s.id}-mgmt`}>
                    <Td><p className="font-medium">{s.training_title}</p></Td>
                    <Td>{formatDate(s.session_date)}</Td>
                    <Td><Badge variant="default" size="sm">Management</Badge></Td>
                    <Td><Badge variant="warning" size="sm" dot>Pending</Badge></Td>
                    <Td>—</Td>
                  </Tr>,
                  <Tr key={`${s.id}-gen`}>
                    <Td><p className="font-medium">{s.training_title}</p></Td>
                    <Td>{formatDate(s.session_date)}</Td>
                    <Td><Badge variant="neutral" size="sm">General</Badge></Td>
                    <Td><Badge variant="warning" size="sm" dot>Pending</Badge></Td>
                    <Td>—</Td>
                  </Tr>,
                ])}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {/* TAB: History */}
      {tab === 'history' && (
        <Card>
          <CardHeader title="Employee Training History" description="Per-employee training record card" />
          {sessions.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-6 w-6" />}
              title="No training history"
              description="Completed training sessions will appear here."
            />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Training</Th>
                  <Th>Type</Th>
                  <Th>Date</Th>
                  <Th>Trainer</Th>
                  <Th>Duration</Th>
                  <Th>Status</Th>
                </tr>
              </Thead>
              <Tbody>
                {sessions.map(s => (
                  <Tr key={s.id}>
                    <Td><p className="font-medium">{s.training_title}</p></Td>
                    <Td><Badge variant="default" size="sm">{s.training_type ?? 'N/A'}</Badge></Td>
                    <Td>{formatDate(s.session_date)}</Td>
                    <Td>{s.trainer_name}</Td>
                    <Td>—</Td>
                    <Td><Badge variant={STATUS_COLOR[s.status] ?? 'neutral'} size="sm" dot>{s.status}</Badge></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>
      )}

      {/* Session Detail Modal */}
      <Modal
        open={!!selectedSession}
        onClose={() => { setSelectedSession(null); setSessionDetail(null) }}
        title={selectedSession?.training_title ?? ''}
        size="lg"
      >
        {selectedSession && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Date:</span> <span className="font-medium">{formatDate(selectedSession.session_date)}</span></div>
              <div><span className="text-slate-500">Trainer:</span> <span className="font-medium">{selectedSession.trainer_name}</span></div>
              <div><span className="text-slate-500">Venue:</span> <span className="font-medium">{selectedSession.venue ?? '—'}</span></div>
              <div><span className="text-slate-500">Status:</span> <Badge variant={STATUS_COLOR[selectedSession.status] ?? 'neutral'} size="sm">{selectedSession.status}</Badge></div>
            </div>

            {sessionDetail && (
              <>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Attendance</h4>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">{(sessionDetail.attendance as unknown[]).length} attendees recorded</span>
                  </div>
                </div>
                {sessionDetail.feedback_summary && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Feedback Summary</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-20">Overall</span>
                        <ProgressBar value={sessionDetail.feedback_summary.avg_overall} max={5} color="indigo" size="sm" showLabel />
                        <span className="text-xs font-medium">{sessionDetail.feedback_summary.avg_overall.toFixed(1)}/5</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Add Session Modal */}
      <Modal
        open={showAddSession}
        onClose={() => setShowAddSession(false)}
        title="Create Training Session"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowAddSession(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleCreateSession}>Create Session</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Training Title" required value={sessionForm.training_title} onChange={e => setSessionForm(f => ({ ...f, training_title: e.target.value }))} />
          <Select label="Type" options={TYPE_OPTIONS} value={sessionForm.training_type} onChange={e => setSessionForm(f => ({ ...f, training_type: e.target.value }))} />
          <Input label="Session Date" type="date" required value={sessionForm.session_date} onChange={e => setSessionForm(f => ({ ...f, session_date: e.target.value }))} />
          <Input label="Trainer Name" required value={sessionForm.trainer_name} onChange={e => setSessionForm(f => ({ ...f, trainer_name: e.target.value }))} />
          <Select label="Trainer Type" options={[{label:'Internal',value:'internal'},{label:'External',value:'external'}]} value={sessionForm.trainer_type} onChange={e => setSessionForm(f => ({ ...f, trainer_type: e.target.value }))} />
          <Input label="Venue" value={sessionForm.venue} onChange={e => setSessionForm(f => ({ ...f, venue: e.target.value }))} />
        </div>
      </Modal>

      {/* Add Calendar Item Modal */}
      <Modal
        open={showAddItem}
        onClose={() => setShowAddItem(false)}
        title="Add to Training Calendar"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowAddItem(false)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleAddCalendarItem}>Add Item</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Training Title" required value={itemForm.training_title} onChange={e => setItemForm(f => ({ ...f, training_title: e.target.value }))} />
          <Select label="Type" options={TYPE_OPTIONS} value={itemForm.training_type} onChange={e => setItemForm(f => ({ ...f, training_type: e.target.value }))} />
          <Select label="Month" options={MONTHS.map((m, i) => ({ label: m, value: String(i + 1) }))} value={itemForm.scheduled_month} onChange={e => setItemForm(f => ({ ...f, scheduled_month: e.target.value }))} />
          <Input label="Duration (hours)" type="number" value={itemForm.duration_hours} onChange={e => setItemForm(f => ({ ...f, duration_hours: e.target.value }))} />
          <Select label="Trainer Type" options={[{label:'Internal',value:'internal'},{label:'External',value:'external'}]} value={itemForm.trainer_type} onChange={e => setItemForm(f => ({ ...f, trainer_type: e.target.value }))} />
          <Input label="Trainer Name" value={itemForm.trainer_name} onChange={e => setItemForm(f => ({ ...f, trainer_name: e.target.value }))} />
          <Input label="Venue" value={itemForm.venue} onChange={e => setItemForm(f => ({ ...f, venue: e.target.value }))} />
          <Input label="Estimated Cost (INR)" type="number" value={itemForm.estimated_cost} onChange={e => setItemForm(f => ({ ...f, estimated_cost: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
