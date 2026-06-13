// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button, EmptyState } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  Search, ShoppingCart, Star, Zap, Store, SlidersHorizontal, Package, Check,
} from 'lucide-react'

const SORTS = [
  { id: 'relevance', label: 'Featured' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Avg. Customer Review' },
  { id: 'newest', label: 'Newest Arrivals' },
]

export default function StorefrontPage() {
  const [data, setData] = useState({ products: [], categories: [], settings: null })
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('')
  const [sort, setSort] = useState('relevance')
  const [cartCount, setCartCount] = useState(0)
  const [added, setAdded] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (cat) params.set('category', cat)
      if (sort) params.set('sort', sort)
      const res = await fetch(`/api/v1/marketplace/storefront?${params}`)
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }, [search, cat, sort])
  useEffect(() => { load() }, [load])

  const loadCart = () => fetch('/api/v1/marketplace/cart').then(r => r.ok && r.json()).then(d => d && setCartCount(d.item_count ?? 0)).catch(() => {})
  useEffect(() => { loadCart() }, [])

  const addToCart = async (p) => {
    const res = await fetch('/api/v1/marketplace/cart', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: p.id, qty: 1 }),
    })
    if (res.ok) {
      const d = await res.json(); setCartCount(d.item_count ?? 0)
      setAdded(a => ({ ...a, [p.id]: true })); setTimeout(() => setAdded(a => ({ ...a, [p.id]: false })), 1500)
    }
  }

  const store = data.settings
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Storefront top bar */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center"><Store className="h-5 w-5" /></div>
          <div>
            <p className="font-bold leading-tight">{store?.store_name || 'PRSK Marketplace'}</p>
            <p className="text-[11px] text-white/60">{store?.store_tagline || 'Everything your business needs'}</p>
          </div>
        </div>
        <form onSubmit={e => { e.preventDefault(); setSearch(q) }} className="flex-1 max-w-2xl mx-auto relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products, brands and more…"
            className="w-full h-10 rounded-lg pl-9 pr-24 text-sm text-slate-900 focus:outline-none" />
          <button type="submit" className="absolute right-1 top-1 h-8 px-4 rounded-md bg-amber-400 hover:bg-amber-500 text-slate-900 text-sm font-semibold">Search</button>
        </form>
        <Link href="/marketplace/cart" className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10">
          <ShoppingCart className="h-5 w-5" />
          <span className="text-sm font-medium hidden sm:block">Cart</span>
          {cartCount > 0 && <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold flex items-center justify-center">{cartCount}</span>}
        </Link>
      </div>

      {/* Category chips */}
      {data.categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button onClick={() => setCat('')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${!cat ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}>All</button>
          {data.categories.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${cat === c.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'}`}>{c.name}</button>
          ))}
        </div>
      )}

      {/* Sort bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500">{loading ? 'Loading…' : `${data.products.length} results`}</span>
        <div className="ml-auto flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
          <select value={sort} onChange={e => setSort(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600">
            {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {!loading && data.products.length === 0 ? (
        <EmptyState icon={<Package className="h-7 w-7" />} title="No products found" description="Try a different search or category." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {data.products.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col group">
              <Link href={`/marketplace/storefront/product/${p.id}`} className="block relative aspect-square bg-slate-50 overflow-hidden">
                {p.images?.[0]?.url
                  ? <img src={p.images[0].url} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  : <div className="h-full w-full flex items-center justify-center"><Package className="h-10 w-10 text-slate-200" /></div>}
                {p.discount_pct > 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-{p.discount_pct}%</span>}
                {!p.in_stock && <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs font-semibold text-slate-500">Out of stock</span>}
              </Link>
              <div className="p-3 flex flex-col flex-1">
                {p.brand && <p className="text-[10px] text-slate-400 uppercase tracking-wide">{p.brand}</p>}
                <Link href={`/marketplace/storefront/product/${p.id}`} className="text-sm text-slate-800 line-clamp-2 hover:text-blue-600 leading-snug min-h-[2.5rem]">{p.title}</Link>
                {p.rating_count > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={`h-3 w-3 ${i <= Math.round(p.rating_avg) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}</div>
                    <span className="text-[10px] text-slate-400">({p.rating_count})</span>
                  </div>
                )}
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-slate-900">{formatCurrency(p.sell_price)}</span>
                  {p.discount_pct > 0 && <span className="text-[11px] text-slate-400 line-through">{formatCurrency(p.mrp)}</span>}
                </div>
                {p.is_prime && <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-semibold mt-0.5"><Zap className="h-2.5 w-2.5 fill-blue-600" /> Fast delivery</span>}
                <div className="mt-auto pt-2">
                  <Button size="sm" className="w-full" disabled={!p.in_stock} onClick={() => addToCart(p)}
                    leftIcon={added[p.id] ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}>
                    {added[p.id] ? 'Added' : 'Add to Cart'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
