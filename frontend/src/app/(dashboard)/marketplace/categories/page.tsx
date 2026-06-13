// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, Button, Badge, Modal, Input, Textarea, Select, EmptyState, SearchInput,
} from '@/components/ui'
import { Boxes, Plus, RefreshCw, Tag, Star } from 'lucide-react'

const blank = () => ({ name: '', parent_id: '', description: '', image_url: '', icon: '', sort_order: '0', is_featured: false })

export default function CategoriesPage() {
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(blank())

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/marketplace/categories')
      if (res.ok) setCats(await res.json())
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetch_() }, [fetch_])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/marketplace/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, parent_id: form.parent_id || null, description: form.description || undefined,
          image_url: form.image_url || undefined, icon: form.icon || undefined,
          sort_order: Number(form.sort_order) || 0, is_featured: form.is_featured,
        }),
      })
      if (res.ok) { setOpen(false); setForm(blank()); fetch_() }
    } finally { setSaving(false) }
  }

  const displayed = cats.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader title="Categories" description="Organise your storefront into browsable departments"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setForm(blank()); setOpen(true) }}>New Category</Button>} />

      <Card padding="none">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
          <SearchInput placeholder="Search categories..." value={search} onChange={setSearch} className="w-64" />
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetch_} className="ml-auto">Refresh</Button>
        </div>
        {!loading && displayed.length === 0 ? (
          <EmptyState icon={<Boxes className="h-7 w-7" />} title="No categories yet" description="Create departments like Electronics, Home & Kitchen, etc."
            action={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>New Category</Button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {displayed.map(c => (
              <Card key={c.id} className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {c.image_url ? <img src={c.image_url} alt="" className="h-full w-full object-cover" /> : <Tag className="h-5 w-5 text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-slate-800 truncate">{c.name}</p>
                    {c.is_featured && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{c.description || '—'}</p>
                </div>
                <Badge variant="info">{c.product_count ?? 0}</Badge>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New Category"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={save} disabled={!form.name}>Create</Button>
        </>}>
        <div className="space-y-4">
          <Input label="Name *" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Electronics" />
          <Select label="Parent category" value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
            options={[{ label: '— Top level —', value: '' }, ...cats.map(c => ({ label: c.name, value: c.id }))]} />
          <Textarea label="Description" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Image URL" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
            <Input label="Sort order" type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="rounded" />
            <span className="text-slate-700">Feature on storefront home</span>
          </label>
        </div>
      </Modal>
    </div>
  )
}
