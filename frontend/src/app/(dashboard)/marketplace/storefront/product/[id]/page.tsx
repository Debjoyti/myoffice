// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Badge, Divider, Card } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  Star, ShoppingCart, Zap, ChevronLeft, Package, ShieldCheck, RotateCcw,
  Truck, Check, Minus, Plus,
} from 'lucide-react'

export default function ProductDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [p, setP] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState(false)
  const [review, setReview] = useState({ rating: 5, title: '', body: '', author_name: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    fetch(`/api/v1/marketplace/products/${id}`).then(r => r.ok ? r.json() : null).then(d => setP(d)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [id])

  const sell = p ? (p.sale_price != null && Number(p.sale_price) > 0 ? Number(p.sale_price) : Number(p.price)) : 0
  const discount = p && Number(p.mrp) > sell ? Math.round((1 - sell / Number(p.mrp)) * 100) : 0
  const inStock = p ? (p.qty_available == null ? true : p.qty_available > 0) : false

  const addToCart = async (buyNow = false) => {
    setBusy(true)
    try {
      const res = await fetch('/api/v1/marketplace/cart', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: p.id, qty }),
      })
      if (res.ok) {
        if (buyNow) router.push('/marketplace/cart')
        else { setAdded(true); setTimeout(() => setAdded(false), 1800) }
      }
    } finally { setBusy(false) }
  }

  const submitReview = async () => {
    if (!review.author_name || !review.body) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/marketplace/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...review, product_id: p.id }),
      })
      if (res.ok) { setReview({ rating: 5, title: '', body: '', author_name: '' }); load() }
    } finally { setSubmitting(false) }
  }

  if (loading) return <div className="py-20 text-center text-slate-400 text-sm">Loading product…</div>
  if (!p) return <div className="py-20 text-center text-slate-400 text-sm">Product not found.</div>

  const images = p.images?.length ? p.images : [{ url: '' }]

  return (
    <div className="space-y-5 animate-fadeIn">
      <Link href="/marketplace/storefront" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to storefront
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gallery */}
        <div className="lg:col-span-5">
          <div className="aspect-square bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
            {images[activeImg]?.url
              ? <img src={images[activeImg].url} alt={p.title} className="h-full w-full object-contain" />
              : <Package className="h-16 w-16 text-slate-200" />}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {images.map((im, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`h-14 w-14 rounded-lg border overflow-hidden ${activeImg === i ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`}>
                  {im.url ? <img src={im.url} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-slate-300 m-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:col-span-4 space-y-3">
          {p.brand && <p className="text-xs text-blue-600 font-medium">{p.brand}</p>}
          <h1 className="text-xl font-bold text-slate-900 leading-snug">{p.title}</h1>
          {p.rating_count > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={`h-4 w-4 ${i <= Math.round(p.rating_avg) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}</div>
              <span className="text-xs text-slate-500">{Number(p.rating_avg).toFixed(1)} · {p.rating_count} ratings</span>
            </div>
          )}
          <Divider />
          <div className="flex items-baseline gap-2">
            {discount > 0 && <span className="text-red-600 text-lg font-medium">-{discount}%</span>}
            <span className="text-3xl font-bold text-slate-900">{formatCurrency(sell)}</span>
          </div>
          {discount > 0 && <p className="text-xs text-slate-400">M.R.P.: <span className="line-through">{formatCurrency(p.mrp)}</span> (incl. of all taxes)</p>}
          {p.is_prime && <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold"><Zap className="h-3 w-3 fill-blue-600" /> Fast delivery available</span>}

          {p.short_desc && <p className="text-sm text-slate-600">{p.short_desc}</p>}
          {p.bullet_points?.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {p.bullet_points.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />{b}</li>
              ))}
            </ul>
          )}
          {p.description && (<><Divider label="About this item" /><p className="text-sm text-slate-600 whitespace-pre-line">{p.description}</p></>)}
        </div>

        {/* Buy box */}
        <div className="lg:col-span-3">
          <Card className="p-4 space-y-3 sticky top-4">
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(sell)}</div>
            <p className={`text-sm font-semibold ${inStock ? 'text-emerald-600' : 'text-red-600'}`}>{inStock ? 'In stock' : 'Currently unavailable'}</p>
            {p.qty_available != null && inStock && p.qty_available <= 10 && <p className="text-xs text-amber-600">Only {p.qty_available} left — order soon</p>}

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Qty</span>
              <div className="flex items-center border border-slate-200 rounded-lg">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-2 py-1.5 text-slate-500 hover:bg-slate-50"><Minus className="h-3 w-3" /></button>
                <span className="px-3 text-sm font-medium">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="px-2 py-1.5 text-slate-500 hover:bg-slate-50"><Plus className="h-3 w-3" /></button>
              </div>
            </div>

            <Button className="w-full" disabled={!inStock || busy} loading={busy} onClick={() => addToCart(false)}
              leftIcon={added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}>
              {added ? 'Added to Cart' : 'Add to Cart'}
            </Button>
            <Button className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 border-0" disabled={!inStock} onClick={() => addToCart(true)}>Buy Now</Button>

            <div className="space-y-2 pt-2 text-xs text-slate-500">
              {p.is_returnable && <div className="flex items-center gap-2"><RotateCcw className="h-3.5 w-3.5 text-slate-400" /> {p.return_window_days}-day returns</div>}
              {p.is_cod_available && <div className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-slate-400" /> Cash on delivery available</div>}
              <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-slate-400" /> Secure transaction</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Reviews */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Ratings & Reviews</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* write */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Write a review</p>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setReview(r => ({ ...r, rating: i }))}>
                  <Star className={`h-5 w-5 ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
            <input value={review.author_name} onChange={e => setReview(r => ({ ...r, author_name: e.target.value }))} placeholder="Your name"
              className="w-full h-8 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500" />
            <textarea value={review.body} onChange={e => setReview(r => ({ ...r, body: e.target.value }))} placeholder="Share your experience…" rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 resize-none" />
            <Button size="sm" loading={submitting} onClick={submitReview} disabled={!review.author_name || !review.body}>Submit review</Button>
          </div>
          {/* list */}
          <div className="lg:col-span-2 space-y-3">
            {(p.reviews ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">No reviews yet — be the first to review this product.</p>
            ) : p.reviews.map(rv => (
              <div key={rv.id} className="border-b border-slate-100 pb-3 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={`h-3 w-3 ${i <= rv.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}</div>
                  <span className="text-xs font-medium text-slate-700">{rv.author_name}</span>
                  {rv.is_verified && <Badge variant="success" size="sm">Verified</Badge>}
                </div>
                {rv.title && <p className="text-sm font-medium text-slate-800 mt-1">{rv.title}</p>}
                <p className="text-sm text-slate-600 mt-0.5">{rv.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
