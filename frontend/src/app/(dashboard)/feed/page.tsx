'use client'

import { useState } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Modal, Input, Select, Textarea, Alert
} from '@/components/ui'
import { Clock, Pin, Plus, FlaskConical } from 'lucide-react'

type Priority = 'High' | 'Normal' | 'Low'

type Announcement = {
  id: string; title: string; content: string; author: string
  priority: Priority; date: string; pinned: boolean
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'A1', title: 'Q2 Performance Reviews Starting Next Week', content: 'Managers will coordinate with their teams to begin the Q2 appraisal cycle. Please ensure your self-assessment forms are filled by Friday, 30 May. HR will share detailed guidelines via email.', author: 'HR Central', priority: 'High', date: '27 May 2026', pinned: true },
  { id: 'A2', title: 'Office Security Patch Update – Sunday', content: 'IT will be patching all workstations this Sunday, 31 May, between 9 AM – 2 PM. Please save your work before leaving on Saturday. Remote access will be unavailable during this window.', author: 'IT Department', priority: 'Normal', date: '26 May 2026', pinned: true },
  { id: 'A3', title: 'New Pantry Vendor – Better Snacks!', content: 'Starting June 1st, we have a new pantry vendor. Expect healthier snack options and a wider beverage menu. Feedback forms will be available at the pantry.', author: 'Admin Team', priority: 'Low', date: '25 May 2026', pinned: false },
  { id: 'A4', title: 'WFH Policy Update for June', content: 'The WFH policy for June has been revised. Employees can now avail up to 3 WFH days per week with manager approval. Please submit WFH requests through the portal at least 24 hours in advance.', author: 'People Ops', priority: 'High', date: '24 May 2026', pinned: false },
  { id: 'A5', title: 'Monthly All-Hands — 5 June 2026', content: 'Join us for our monthly all-hands meeting on 5 June at 4 PM IST. The leadership team will share Q1 results, product roadmap updates, and team highlights. Zoom link will be shared closer to the date.', author: 'Founders Office', priority: 'Normal', date: '23 May 2026', pinned: false },
]

const PRIORITY_COLOR: Record<Priority, 'danger' | 'info' | 'neutral'> = {
  High: 'danger', Normal: 'info', Low: 'neutral',
}

const PRIORITY_BAR: Record<Priority, string> = {
  High: 'bg-red-500', Normal: 'bg-blue-500', Low: 'bg-slate-300',
}

const INITIAL_FORM = { title: '', priority: 'Normal' as Priority, content: '' }

export default function FeedPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS)
  const [newModal, setNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formError, setFormError] = useState('')

  const handlePost = async () => {
    if (!form.title.trim()) { setFormError('Title is required'); return }
    if (!form.content.trim()) { setFormError('Content is required'); return }
    setSaving(true)
    setFormError('')
    await new Promise(r => setTimeout(r, 400))
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    setAnnouncements(prev => [{
      id: `A${Date.now()}`,
      title: form.title.trim(),
      content: form.content.trim(),
      author: 'You',
      priority: form.priority,
      date: dateStr,
      pinned: false,
    }, ...prev])
    setNewModal(false)
    setForm(INITIAL_FORM)
    setSaving(false)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — Announcements are illustrative. Real-time office feed integration is on the roadmap.</span>
      </div>

      <PageHeader
        title="Office Feed"
        description="Company announcements, updates, and team notices"
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setNewModal(true); setFormError('') }}>
            Post Announcement
          </Button>
        }
      />

      <div className="space-y-3">
        {announcements.map(a => (
          <Card key={a.id} className="relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${PRIORITY_BAR[a.priority]}`} />
            <div className="pl-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {a.pinned && <Pin className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight">{a.title}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={PRIORITY_COLOR[a.priority]} size="sm">{a.priority}</Badge>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">{a.content}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Avatar name={a.author} size="xs" />
                  <span className="text-xs font-medium text-slate-600">{a.author}</span>
                </div>
                <span className="text-slate-300">·</span>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>{a.date}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={newModal}
        onClose={() => { setNewModal(false); setFormError('') }}
        title="Post Announcement"
        size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handlePost}>Post</Button>
        </>}
      >
        <div className="space-y-4">
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Input
            label="Title"
            placeholder="Announcement title..."
            required
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <Select
            label="Priority"
            options={[
              { label: 'Normal', value: 'Normal' },
              { label: 'High', value: 'High' },
              { label: 'Low', value: 'Low' },
            ]}
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: (e.target as HTMLSelectElement).value as Priority }))}
          />
          <Textarea
            label="Content"
            placeholder="Write the announcement details..."
            rows={4}
            required
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
