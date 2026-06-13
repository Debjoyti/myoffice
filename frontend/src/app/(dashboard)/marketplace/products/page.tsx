// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, Divider, EmptyState,
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  Package, Plus, Edit2, Trash2, RefreshCw, Star, ImageIcon, X, Link2,
  Eye, CheckCircle2, AlertTriangle, Boxes,
} from 'lucide-react'

const STATUS_BADGE = { active: 'success', draft: 'neutral', inactive: 'warning', archived: 'danger' }
const blank = () => ({
  id: null, title: '', brand: '', short_desc: '', description: '', category_id: '',
  item_id: '', warehouse_id: '', create_item: true, mrp: '', price: '', sale_price: '',
  gst_rate: '18', bullet_points: [''], images: [{ url: '', alt: '', is_primary: true }],
  is_cod_available: true, is_returnable: true, return_window_days: '7', handling_days: '1',
  is_featured: false, is_prime: false, status: 'draft',
})

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(blank())

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tab !== 'all') params.set('status', tab)
      const res = await fetch(`/api/v1/marketplace/products?${params}`)
      if (res.ok) { const d = await res.json(); setProducts(d.products ?? []); setSummary(d.summary ?? {}) }
    } finally { setLoading(false) }
  }, [tab])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => {
    fetch('/api/v1/marketplace/categories').then(r => r.ok && r.json()).then(d => d && setCategories(d)).catch(() => {})
    fetch('/api/v1/inventory/items').then(r => r.ok && r.json()).then(d => d && setItems(d.items ?? [])).catch(() => {})
    fetch('/api/v1/inventory/warehouses').then(r => r.ok && r.json()).then(d => d && setWarehouses(Array.isArray(d) ? d : d.warehouses ?? [])).catch(() => {})
  }, [])

  const displayed = products.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => { setForm(blank()); setOpen(true) }
  const openEdit = (p) => {
    setForm({
      ...blank(), ...p,
      category_id: p.category_id ?? '', item_id: p.item_id ?? '', warehouse_id: p.warehouse_id ?? '',
      create_item: false,
      mrp: String(p.mrp ?? ''), price: String(p.price ?? ''), sale_price: p.sale_price != null ? String(p.sale_price) : '',
      gst_rate: String(p.gst_rate ?? '18'),
      return_window_days: String(p.return_window_days ?? '7'), handling_days: String(p.handling_days ?? '1'),
      bullet_points: p.bullet_points?.length ? p.bullet_points : [''],
      images: p.images?.length ? p.images : [{ url: '', alt: '', is_primary: true }],
    })
    setOpen(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        title: form.title, brand: form.brand || undefined, short_desc: form.short_desc || undefined,
        description: form.description || undefined,
        category_id: form.category_id || null,
        item_id: form.item_id || null,
        warehouse_id: form.warehouse_id || null,
        create_item: !form.item_id && form.create_item,
        mrp: Number(form.mrp) || 0, price: Number(form.price) || 0,
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        gst_rate: Number(form.gst_rate) || 18,
        bullet_points: form.bullet_points.filter(b => b.trim()),
        images: form.images.filter(i => i.url.trim()),
        is_cod_available: form.is_cod_available, is_returnable: form.is_returnable,
        return_window_days: Number(form.return_window_days) || 7, handling_days: Number(form.handling_days) || 1,
        is_featured: form.is_featured, is_prime: form.is_prime, status: form.status,
      }
      const url = form.id ? `/api/v1/marketplace/products/${form.id}` : '/api/v1/marketplace/products'
      const method = form.id ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { setOpen(false); fetchProducts() }
      else { const e = await res.json(); alert(e.error?.formErrors?.join(', ') || e.error || 'Save failed') }
    } finally { setSaving(false) }
  }

  const archive = async (p) => {
    if (!confirm(`Archive "${p.title}"? It will be hidden from the storefront.`)) return
    await fetch(`/api/v1/marketplace/products/${p.id}`, { method: 'DELETE' })
    fetchProducts()
  }

  const quickPublish = async (p) => {
    await fetch(`/api/v1/marketplace/products/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: p.status === 'active' ? 'inactive' : 'active' }),
    })
    fetchProducts()
  }

  // bullet / image helpers
  const setBullet = (i, v) => setForm(f => ({ ...f, bullet_points: f.bullet_points.map((b, idx) => idx === i ? v : b) }))
  const addBullet = () => setForm(f => ({ ...f, bullet_points: [...f.bullet_points, ''] }))
  const rmBullet = (i) => setForm(f => ({ ...f, bullet_points: f.bullet_points.filter((_, idx) => idx !== i) }))
  const setImg = (i, key, v) => setForm(f => ({ ...f, images: f.images.map((im, idx) => idx === i ? { ...im, [key]: v } : im) }))
  const addImg = () => setForm(f => ({ ...f, images: [...f.images, { url: '', alt: '', is_primary: false }] }))
  const rmImg = (i) => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Products"
        description="Create and manage your storefront listings — linked end-to-end to inventory"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={openNew}>Add Product</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Listings" value={(summary.total ?? 0).toString()} icon={<Package className="h-4 w-4" />} accent="blue" />
        <StatCard label="Active" value={(summary.active ?? 0).toString()} icon={<CheckCircle2 className="h-4 w-4" />} accent="emerald" />
        <StatCard label="Drafts" value={(summary.draft ?? 0).toString()} icon={<Edit2 className="h-4 w-4" />} accent="amber" />
        <StatCard label="Out of Stock" value={(summary.out_of_stock ?? 0).toString()} icon={<AlertTriangle className="h-4 w-4" />} accent="red" />
      </div>

      <TabBar
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'active', label: 'Active' },
          { id: 'draft', label: 'Drafts' },
          { id: 'inactive', label: 'Inactive' },
          { id: 'archived', label: 'Archived' },
        ]}
        active={tab} onChange={setTab}
      />

      <Card padding="none">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
          <SearchInput placeholder="Search by title, brand, SKU..." value={search} onChange={setSearch} className="w-72" />
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchProducts} className="ml-auto">Refresh</Button>
        </div>

        {!loading && displayed.length === 0 ? (
          <EmptyState icon={<Package className="h-7 w-7" />} title="No products yet"
            description="Add your first listing — link it to an inventory item so stock stays in sync."
            action={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={openNew}>Add Product</Button>} />
        ) : (
          <Table>
            <Thead><tr>
              <Th>Product</Th><Th>SKU</Th><Th>Category</Th><Th align="right">Price</Th>
              <Th align="right">Stock</Th><Th>Rating</Th><Th>Status</Th><Th></Th>
            </tr></Thead>
            <Tbody>
              {loading ? (
                <Tr><td colSpan={8} className="py-12 text-center text-slate-400 text-sm">Loading…</td></Tr>
              ) : displayed.map(p => (
                <Tr key={p.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {p.images?.[0]?.url ? <img src={p.images[0].url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-slate-300" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate max-w-[220px]">{p.title}</p>
                        {p.brand && <p className="text-[10px] text-slate-400">{p.brand}</p>}
                      </div>
                    </div>
                  </Td>
                  <Td><span className="font-mono text-xs text-blue-600">{p.sku ?? '—'}</span>{p.item_id && <Link2 className="h-3 w-3 inline ml-1 text-emerald-500" title="Linked to inventory" />}</Td>
                  <Td><span className="text-xs text-slate-500">{categories.find(c => c.id === p.category_id)?.name ?? '—'}</span></Td>
                  <Td align="right">
                    <span className="font-semibold text-slate-800">{formatCurrency(p.sale_price ?? p.price)}</span>
                    {p.sale_price != null && <span className="text-[10px] text-slate-400 line-through block">{formatCurrency(p.price)}</span>}
                  </Td>
                  <Td align="right">
                    {p.qty_available == null ? <span className="text-xs text-slate-400">untracked</span>
                      : <span className={`font-semibold ${p.qty_available <= 0 ? 'text-red-600' : 'text-slate-700'}`}>{p.qty_available}</span>}
                  </Td>
                  <Td>{p.rating_count > 0 ? <span className="text-xs flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{Number(p.rating_avg).toFixed(1)} <span className="text-slate-400">({p.rating_count})</span></span> : <span className="text-xs text-slate-300">—</span>}</Td>
                  <Td><Badge variant={STATUS_BADGE[p.status]}>{p.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" title={p.status === 'active' ? 'Unpublish' : 'Publish'} onClick={() => quickPublish(p)}>
                        {p.status === 'active' ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => archive(p)}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Add / Edit modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Edit Product' : 'Add Product'} size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={save} disabled={!form.title || !form.price}>{form.id ? 'Save Changes' : 'Create Listing'}</Button>
        </>}>
        <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
          <Divider label="Product Details" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Title *" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Wireless Noise-Cancelling Headphones" />
            <Input label="Brand" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. Acme Audio" />
          </div>
          <Input label="Short description" value={form.short_desc} onChange={e => setForm(f => ({ ...f, short_desc: e.target.value }))} placeholder="One-line hook shown on cards" />
          <Textarea label="Full description" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              options={[{ label: '— None —', value: '' }, ...categories.map(c => ({ label: c.name, value: c.id }))]} />
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              options={[{ label: 'Draft', value: 'draft' }, { label: 'Active (published)', value: 'active' }, { label: 'Inactive', value: 'inactive' }]} />
          </div>

          <Divider label="Inventory Link" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Linked inventory item" value={form.item_id} onChange={e => setForm(f => ({ ...f, item_id: e.target.value }))}
              options={[{ label: form.create_item && !form.id ? '— Auto-create new item —' : '— None (untracked) —', value: '' }, ...items.map(i => ({ label: `${i.sku} · ${i.name}`, value: i.id }))]} />
            <Select label="Fulfilment warehouse" value={form.warehouse_id} onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value }))}
              options={[{ label: '— Select —', value: '' }, ...warehouses.map(w => ({ label: `${w.code ?? ''} ${w.name}`, value: w.id }))]} />
          </div>
          {!form.item_id && !form.id && (
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input type="checkbox" checked={form.create_item} onChange={e => setForm(f => ({ ...f, create_item: e.target.checked }))} className="rounded" />
              Auto-create a backing inventory item (Finished Goods) so stock & sales stay linked
            </label>
          )}

          <Divider label="Pricing" />
          <div className="grid grid-cols-4 gap-3">
            <Input label="MRP (₹)" type="number" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))} placeholder="List price" />
            <Input label="Sell Price (₹) *" type="number" required value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <Input label="Sale Price (₹)" type="number" value={form.sale_price} onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))} placeholder="Optional promo" />
            <Select label="GST %" value={form.gst_rate} onChange={e => setForm(f => ({ ...f, gst_rate: e.target.value }))}
              options={['0', '5', '12', '18', '28'].map(r => ({ label: `${r}%`, value: r }))} />
          </div>

          <Divider label="Images" />
          <div className="space-y-2">
            {form.images.map((im, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-9 w-9 rounded bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {im.url ? <img src={im.url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-slate-300" />}
                </div>
                <Input className="flex-1" placeholder="https://image-url.jpg" value={im.url} onChange={e => setImg(i, 'url', e.target.value)} />
                <Button variant="ghost" size="icon" onClick={() => rmImg(i)}><X className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" leftIcon={<Plus className="h-3 w-3" />} onClick={addImg}>Add image</Button>
          </div>

          <Divider label="Key Features (bullet points)" />
          <div className="space-y-2">
            {form.bullet_points.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-slate-300 text-xs">•</span>
                <Input className="flex-1" placeholder="Highlight a feature" value={b} onChange={e => setBullet(i, e.target.value)} />
                <Button variant="ghost" size="icon" onClick={() => rmBullet(i)}><X className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" leftIcon={<Plus className="h-3 w-3" />} onClick={addBullet}>Add feature</Button>
          </div>

          <Divider label="Logistics & Merchandising" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Handling days" type="number" value={form.handling_days} onChange={e => setForm(f => ({ ...f, handling_days: e.target.value }))} />
            <Input label="Return window (days)" type="number" value={form.return_window_days} onChange={e => setForm(f => ({ ...f, return_window_days: e.target.value }))} />
          </div>
          <div className="flex flex-wrap gap-5">
            {[
              ['is_cod_available', 'COD available'], ['is_returnable', 'Returnable'],
              ['is_prime', 'Fast delivery (Prime)'], ['is_featured', 'Featured'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} className="rounded" />
                <span className="text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
