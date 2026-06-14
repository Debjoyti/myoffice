'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button,
  StatCard, TabBar, Modal, Input, Select, Textarea
} from '@/components/ui'
import {
  ClipboardList, Plus, Eye, Send, Users, TrendingUp,
  Star
} from 'lucide-react'

const MOCK_SURVEYS = [
  { id: '1', title: 'Employee Satisfaction Survey — Q2 2026', type: 'internal', questions: 15, responses: 78, invited: 89, avg_score: 7.8, status: 'active', created: '2026-05-01', closes: '2026-06-15' },
  { id: '2', title: 'NPS Survey — May 2026', type: 'customer', questions: 3, responses: 248, invited: 480, avg_score: 8.2, status: 'active', created: '2026-05-15', closes: '2026-06-15' },
  { id: '3', title: 'Product Feature Feedback', type: 'customer', questions: 8, responses: 142, invited: 350, avg_score: 7.4, status: 'closed', created: '2026-04-01', closes: '2026-04-30' },
  { id: '4', title: 'Exit Interview Survey', type: 'internal', questions: 12, responses: 4, invited: 4, avg_score: 6.1, status: 'closed', created: '2026-03-01', closes: '2026-03-31' },
]

const MOCK_NPS_DATA = [
  { score: 10, count: 42, label: 'Promoter' },
  { score: 9, count: 62, label: 'Promoter' },
  { score: 8, count: 55, label: 'Passive' },
  { score: 7, count: 48, label: 'Passive' },
  { score: 6, count: 22, label: 'Detractor' },
  { score: 5, count: 12, label: 'Detractor' },
  { score: 0, count: 7, label: 'Detractor' },
]

const STATUS_VARIANT: Record<string, any> = { active: 'success', closed: 'neutral', draft: 'neutral' }

export default function SurveysPage() {
  const [tab, setTab] = useState('surveys')
  const [newSurvey, setNewSurvey] = useState(false)
  const [viewSurvey, setViewSurvey] = useState<any>(null)

  const totalResponses = MOCK_SURVEYS.reduce((s, sv) => s + sv.responses, 0)
  const npsScore = Math.round((42 + 62 - 22 - 12 - 7) / 248 * 100)

  const promoters  = ((42 + 62) / 248 * 100).toFixed(0)
  const passives   = ((55 + 48) / 248 * 100).toFixed(0)
  const detractors = ((22 + 12 + 7) / 248 * 100).toFixed(0)

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Surveys & Feedback"
        description="Employee satisfaction, NPS, product feedback, and exit surveys"
        actions={<>
          <Button variant="outline" size="sm" leftIcon={<Eye className="h-3.5 w-3.5" />}>Preview</Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewSurvey(true)}>Create Survey</Button>
        </>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Active Surveys" value={MOCK_SURVEYS.filter(s => s.status === 'active').length.toString()} icon={<ClipboardList className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Total Responses" value={totalResponses.toString()} icon={<Users className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="NPS Score" value={`+${npsScore}`} icon={<TrendingUp className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" delta={{ value: '+8 vs last quarter', positive: true }} />
        <StatCard label="eNPS (Employees)" value="+42" icon={<Star className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
      </div>

      <TabBar tabs={[
        { id: 'surveys', label: 'Surveys', count: MOCK_SURVEYS.length },
        { id: 'nps', label: 'NPS Dashboard' },
        { id: 'enps', label: 'eNPS (Employee)' },
      ]} active={tab} onChange={setTab} />

      {tab === 'surveys' && (
        <div className="space-y-3">
          {MOCK_SURVEYS.map(sv => {
            const responseRate = Math.round((sv.responses / sv.invited) * 100)
            return (
              <Card key={sv.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewSurvey(sv)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-800">{sv.title}</p>
                      <Badge variant={STATUS_VARIANT[sv.status]}>{sv.status}</Badge>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${sv.type === 'internal' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{sv.type}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{sv.questions} questions · Closes {sv.closes}</p>
                  </div>
                  <div className="flex gap-6 flex-shrink-0 text-center">
                    <div><p className="text-xs text-slate-400">Responses</p><p className="font-bold text-blue-600">{sv.responses}/{sv.invited}</p></div>
                    <div><p className="text-xs text-slate-400">Rate</p><p className={`font-bold ${responseRate >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>{responseRate}%</p></div>
                    <div><p className="text-xs text-slate-400">Avg Score</p><p className="font-bold text-violet-600">{sv.avg_score}/10</p></div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${responseRate >= 70 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${responseRate}%` }} />
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'nps' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Net Promoter Score" description="May 2026 — Customer NPS" />
            <div className="text-center my-6">
              <p className="text-7xl font-black text-blue-600">+{npsScore}</p>
              <p className="text-sm text-slate-500 mt-2">248 responses this month</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Promoters (9-10)', pct: promoters, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Passives (7-8)', pct: passives, color: 'text-amber-600 bg-amber-50' },
                { label: 'Detractors (0-6)', pct: detractors, color: 'text-red-600 bg-red-50' },
              ].map(s => (
                <div key={s.label} className={`p-3 rounded-xl ${s.color}`}>
                  <p className="text-2xl font-black">{s.pct}%</p>
                  <p className="text-[10px] font-semibold mt-0.5 opacity-70">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Score Distribution" />
            <div className="space-y-2 mt-3">
              {MOCK_NPS_DATA.map(row => (
                <div key={row.score} className="flex items-center gap-3">
                  <span className="text-xs font-mono w-4 text-slate-500">{row.score}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full flex items-center px-2 ${row.label === 'Promoter' ? 'bg-emerald-500' : row.label === 'Passive' ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${(row.count / 62) * 100}%` }}>
                      {row.count > 15 && <span className="text-[10px] font-bold text-white">{row.count}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 w-6">{row.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'enps' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Employee NPS (eNPS)" description="Q2 2026 Satisfaction Survey" />
            <div className="text-center my-6">
              <p className="text-7xl font-black text-violet-600">+42</p>
              <p className="text-sm text-slate-500 mt-2">78 of 89 employees responded (88%)</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center mt-2">
              {[{ l:'Promoters', v:'61%', c:'text-emerald-600 bg-emerald-50'},{l:'Passives',v:'20%',c:'text-amber-600 bg-amber-50'},{l:'Detractors',v:'19%',c:'text-red-600 bg-red-50'}].map(s => (
                <div key={s.l} className={`p-3 rounded-xl ${s.c}`}><p className="text-2xl font-black">{s.v}</p><p className="text-[10px] font-semibold opacity-70">{s.l}</p></div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Top Feedback Themes" description="AI-extracted from open-ended responses" />
            <div className="space-y-3 mt-3">
              {[
                { theme: 'Work-life balance', sentiment: 'positive', mentions: 42 },
                { theme: 'Career growth opportunities', sentiment: 'neutral', mentions: 38 },
                { theme: 'Team collaboration', sentiment: 'positive', mentions: 35 },
                { theme: 'Management communication', sentiment: 'neutral', mentions: 28 },
                { theme: 'Compensation & benefits', sentiment: 'negative', mentions: 22 },
              ].map(t => (
                <div key={t.theme} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${t.sentiment === 'positive' ? 'bg-emerald-500' : t.sentiment === 'negative' ? 'bg-red-500' : 'bg-amber-400'}`} />
                    <span className="text-sm text-slate-700">{t.theme}</span>
                  </div>
                  <span className="text-xs text-slate-400">{t.mentions} mentions</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Modal open={newSurvey} onClose={() => setNewSurvey(false)} title="Create Survey" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewSurvey(false)}>Cancel</Button><Button variant="outline" size="sm">Save Draft</Button><Button size="sm" leftIcon={<Send className="h-3.5 w-3.5" />}>Publish & Share</Button></>}
      >
        <div className="space-y-4">
          <Input label="Survey Title *" required placeholder="e.g. Q3 Employee Satisfaction" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Survey Type" options={[{label:'Employee (Internal)',value:'internal'},{label:'Customer (External)',value:'customer'},{label:'Product Feedback',value:'product'},{label:'NPS Survey',value:'nps'},{label:'Exit Interview',value:'exit'}]} />
            <Select label="Response Format" options={[{label:'Anonymous',value:'anonymous'},{label:'Named',value:'named'},{label:'Optional',value:'optional'}]} />
            <Input label="Launch Date" type="date" />
            <Input label="Close Date" type="date" />
          </div>
          <Textarea label="Welcome Message" rows={2} placeholder="Thank you for participating..." />
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="rounded" /><span>Allow multiple submissions</span></label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="rounded" defaultChecked /><span>Send reminder emails</span></label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
