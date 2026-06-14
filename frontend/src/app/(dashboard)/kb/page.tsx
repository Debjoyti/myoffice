'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Avatar, Button, SearchInput, Modal, Input, Select, Textarea, EmptyState
} from '@/components/ui'
import { Book, FileText, ExternalLink, Plus, FlaskConical } from 'lucide-react'

type Category = 'HR Policies' | 'Engineering' | 'Finance' | 'Onboarding' | 'Legal' | 'General'

type Article = {
  id: string; title: string; category: Category; author: string
  summary: string; updated: string; views: number; pinned: boolean
}

const ARTICLES: Article[] = [
  { id: 'KB-001', title: 'Employee Leave Policy 2026', category: 'HR Policies', author: 'HR Central', summary: 'Complete guide to casual, sick, earned, and special leaves. Includes application process, approval workflow, and encashment rules.', updated: '01 May 2026', views: 142, pinned: true },
  { id: 'KB-002', title: 'Expense Reimbursement Guidelines', category: 'Finance', author: 'Finance Team', summary: 'Step-by-step guide to submitting expense claims, category limits, receipt requirements, and payment timelines.', updated: '15 Apr 2026', views: 98, pinned: true },
  { id: 'KB-003', title: 'Onboarding Checklist for New Joiners', category: 'Onboarding', author: 'People Ops', summary: 'Everything a new employee needs to do in their first 30 days — from IT setup to introduction meetings and compliance training.', updated: '10 May 2026', views: 76, pinned: false },
  { id: 'KB-004', title: 'Code Review Best Practices', category: 'Engineering', author: 'Tech Lead', summary: 'Guidelines for writing and receiving code reviews. Covers PR size, review etiquette, and automated checks.', updated: '05 May 2026', views: 64, pinned: false },
  { id: 'KB-005', title: 'IT Asset Request Process', category: 'General', author: 'IT Department', summary: 'How to request new hardware, software licenses, or accessories. Includes approval matrix and expected timelines.', updated: '20 Apr 2026', views: 55, pinned: false },
  { id: 'KB-006', title: 'NDA and IP Assignment Policy', category: 'Legal', author: 'Legal Team', summary: 'Summary of non-disclosure and intellectual property agreements signed at joining. Key obligations and prohibited activities.', updated: '01 Mar 2026', views: 43, pinned: false },
]

const CATEGORY_COLOR: Record<Category, string> = {
  'HR Policies': 'bg-blue-50 text-blue-700', Engineering: 'bg-violet-50 text-violet-700',
  Finance: 'bg-emerald-50 text-emerald-700', Onboarding: 'bg-amber-50 text-amber-700',
  Legal: 'bg-red-50 text-red-700', General: 'bg-slate-100 text-slate-700',
}

const CATEGORIES: Category[] = ['HR Policies', 'Engineering', 'Finance', 'Onboarding', 'Legal', 'General']

export default function KBPage() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string>('All')
  const [newModal, setNewModal] = useState(false)
  const [selected, setSelected] = useState<Article | null>(null)

  const filtered = useMemo(() => {
    const byCat = catFilter === 'All' ? ARTICLES : ARTICLES.filter(a => a.category === catFilter)
    return byCat.filter(a => !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, catFilter])

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — Knowledge base articles are illustrative. Full wiki with rich text editor is on the roadmap.</span>
      </div>

      <PageHeader
        title="Knowledge Base"
        description="Company policies, guides, and internal documentation"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewModal(true)}>New Article</Button>}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput placeholder="Search articles..." value={search} onChange={setSearch} className="w-80" />
        <div className="flex gap-1 flex-wrap">
          {['All', ...CATEGORIES].map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${catFilter === c ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >{c}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<Book className="h-6 w-6" />} title="No articles found" /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(a => (
            <Card key={a.id} hover onClick={() => setSelected(a)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CATEGORY_COLOR[a.category]}`}>{a.category}</span>
                </div>
                {a.pinned && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">📌 Pinned</span>}
              </div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1">{a.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{a.summary}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Avatar name={a.author} size="xs" />
                  <span className="text-[11px] text-slate-500">{a.author}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>{a.views} views</span>
                  <span>{a.updated}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Article Detail */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title ?? ''} size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          <Button variant="secondary" size="sm" leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>Open Full Article</Button>
        </>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[selected.category]}`}>{selected.category}</span>
              <span className="text-xs text-slate-400">{selected.views} views · Updated {selected.updated}</span>
            </div>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-4 leading-relaxed">{selected.summary}</p>
            <div className="flex items-center gap-2">
              <Avatar name={selected.author} size="xs" />
              <span className="text-xs text-slate-600">Authored by <strong>{selected.author}</strong></span>
            </div>
          </div>
        )}
      </Modal>

      {/* New Article Modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="New Article" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm">Publish Article</Button>
        </>}
      >
        <div className="space-y-4">
          <Input label="Article Title" placeholder="e.g. Remote Work Policy 2026" required />
          <Select label="Category" options={CATEGORIES.map(c => ({ label: c, value: c }))} />
          <Textarea label="Content" placeholder="Write the article content here..." rows={6} required />
        </div>
      </Modal>
    </div>
  )
}
