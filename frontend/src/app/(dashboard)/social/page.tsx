'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button,
  StatCard, TabBar, Modal, Input, Textarea
} from '@/components/ui'
import {
  Plus, Calendar, Eye, Heart, MessageSquare,
  TrendingUp, CheckCircle2, Clock, Edit2, Repeat2
} from 'lucide-react'

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0077b5', followers: 4820, connected: true },
  { id: 'twitter', name: 'Twitter / X', icon: '𝕏', color: '#000000', followers: 1240, connected: true },
  { id: 'instagram', name: 'Instagram', icon: '📸', color: '#e1306c', followers: 2180, connected: false },
  { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877f2', followers: 880, connected: false },
]

const MOCK_POSTS = [
  { id: 'p1', content: '🚀 Excited to announce our new GST module! Automated GSTR-1, GSTR-3B filing + e-Invoice IRN generation — all in one place. Indian businesses, your compliance just got easier. #GST #IndianBusiness #PRSK', platforms: ['linkedin','twitter'], scheduled: '2026-06-02 10:00 AM', impressions: 2840, likes: 148, comments: 32, shares: 24, status: 'published' },
  { id: 'p2', content: '📊 Did you know? 78% of Indian SMEs spend 2+ hours weekly on manual attendance tracking. PRSK\'s AI-powered attendance module reduces this to under 5 minutes. See how 👇 [link]', platforms: ['linkedin'], scheduled: '2026-06-01 9:00 AM', impressions: 1920, likes: 96, comments: 18, shares: 12, status: 'published' },
  { id: 'p3', content: '🎯 Hiring? Our AI Interview Suite lets you screen 10x more candidates with async video + Zia AI scoring. No more scheduling chaos. Try it free. #Hiring #ArtificialIntelligence', platforms: ['linkedin','twitter','instagram'], scheduled: '2026-06-03 11:00 AM', impressions: 0, likes: 0, comments: 0, shares: 0, status: 'scheduled' },
  { id: 'p4', content: '✅ IATF 16949 compliance made simple. PRSK\'s IATF Hub covers kaizen, skill matrices, training calendars, and audit checklists — all digitised.', platforms: ['linkedin'], scheduled: '2026-06-05 10:00 AM', impressions: 0, likes: 0, comments: 0, shares: 0, status: 'draft' },
]

const STATUS_VARIANT: Record<string, any> = { published: 'success', scheduled: 'info', draft: 'neutral', failed: 'danger' }

export default function SocialPage() {
  const [tab, setTab] = useState('posts')
  const [newPost, setNewPost] = useState(false)
  const [form, setForm] = useState({ content: '', platforms: [] as string[], schedule: '' })

  const totalImpressions = MOCK_POSTS.filter(p => p.status === 'published').reduce((s, p) => s + p.impressions, 0)
  const totalEngagements = MOCK_POSTS.filter(p => p.status === 'published').reduce((s, p) => s + p.likes + p.comments + p.shares, 0)
  const engagementRate   = totalImpressions > 0 ? ((totalEngagements / totalImpressions) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Social Media"
        description="Schedule, publish, and analyse posts across LinkedIn, Twitter, Instagram, and Facebook"
        actions={<>
          <Button variant="outline" size="sm" leftIcon={<Calendar className="h-3.5 w-3.5" />}>Content Calendar</Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewPost(true)}>Create Post</Button>
        </>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Reach" value={totalImpressions.toLocaleString()} icon={<Eye className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Engagements" value={totalEngagements.toString()} icon={<Heart className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
        <StatCard label="Engagement Rate" value={`${engagementRate}%`} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" delta={{ value: 'Industry avg: 2.1%', positive: Number(engagementRate) > 2.1 }} />
        <StatCard label="Scheduled Posts" value={MOCK_POSTS.filter(p => p.status === 'scheduled').length.toString()} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
      </div>

      {/* Connected Platforms */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PLATFORMS.map(p => (
          <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${p.connected ? 'border-slate-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50'}`}>
            <span className="text-2xl">{p.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{p.name}</p>
              <p className="text-xs text-slate-400">{p.connected ? `${p.followers.toLocaleString()} followers` : 'Not connected'}</p>
            </div>
            {p.connected
              ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              : <Button variant="ghost" size="sm" className="text-xs text-blue-600 flex-shrink-0">Connect</Button>
            }
          </div>
        ))}
      </div>

      <TabBar tabs={[
        { id: 'posts', label: 'Posts', count: MOCK_POSTS.length },
        { id: 'analytics', label: 'Analytics' },
      ]} active={tab} onChange={setTab} />

      {tab === 'posts' && (
        <div className="space-y-4">
          {MOCK_POSTS.map(post => (
            <Card key={post.id}>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {post.platforms.map(pl => {
                      const plat = PLATFORMS.find(p => p.id === pl)
                      return plat ? <span key={pl} className="text-sm">{plat.icon}</span> : null
                    })}
                    <Badge variant={STATUS_VARIANT[post.status]}>{post.status}</Badge>
                    <span className="text-xs text-slate-400">{post.scheduled}</span>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-3">{post.content}</p>
                  {post.status === 'published' && (
                    <div className="flex items-center gap-6 mt-3 text-sm">
                      <span className="flex items-center gap-1 text-slate-500"><Eye className="h-3.5 w-3.5" />{post.impressions.toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-red-500"><Heart className="h-3.5 w-3.5" />{post.likes}</span>
                      <span className="flex items-center gap-1 text-blue-500"><MessageSquare className="h-3.5 w-3.5" />{post.comments}</span>
                      <span className="flex items-center gap-1 text-emerald-500"><Repeat2 className="h-3.5 w-3.5" />{post.shares}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button>
                  {post.status !== 'published' && <Button variant="ghost" size="icon"><Edit2 className="h-3.5 w-3.5" /></Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Performance by Platform" />
            <div className="space-y-4 mt-3">
              {[{ name:'LinkedIn', reach: 3800, eng: 280, color:'bg-blue-500' }, { name:'Twitter/X', reach: 960, eng: 52, color:'bg-slate-800' }].map(pl => (
                <div key={pl.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700">{pl.name}</span>
                    <span className="text-slate-500">{pl.reach.toLocaleString()} reach · {pl.eng} engagements</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pl.color}`} style={{ width: `${(pl.reach / 4760) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Best Time to Post" description="Based on engagement data" />
            <div className="space-y-2 mt-3">
              {[{day:'Monday',time:'9:00–11:00 AM',score:92},{day:'Tuesday',time:'9:00–10:00 AM',score:88},{day:'Wednesday',time:'2:00–4:00 PM',score:85},{day:'Thursday',time:'10:00 AM',score:80}].map(t => (
                <div key={t.day} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <span className="text-sm font-medium text-slate-700">{t.day}</span>
                  <span className="text-xs text-slate-500">{t.time}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${t.score}%` }} /></div>
                    <span className="text-xs font-bold text-blue-600">{t.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Modal open={newPost} onClose={() => setNewPost(false)} title="Create Social Post" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewPost(false)}>Cancel</Button><Button variant="outline" size="sm">Save Draft</Button><Button size="sm">Schedule Post</Button></>}
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Post to</p>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.filter(p => p.connected).map(p => (
                <label key={p.id} className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>{p.icon} {p.name}</span>
                </label>
              ))}
            </div>
          </div>
          <Textarea label="Post Content *" rows={5} required value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your post..." />
          <p className="text-xs text-slate-400">{form.content.length} / 3000 characters</p>
          <Input label="Schedule Date & Time" type="datetime-local" value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} />
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-300">
            <p className="text-sm text-slate-500">+ Add Image / Video</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
