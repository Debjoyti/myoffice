'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card, CardHeader, Badge, Button, Alert, Input, Divider, EmptyState
} from '@/components/ui'
import {
  ArrowLeft, Package, Edit2, TrendingDown, MapPin, Calendar,
  Tag, FileText, Clock, ShoppingCart, Trash2, RefreshCw,
  CheckCircle2, AlertTriangle, Wrench, Shield, Info
} from 'lucide-react'

type Asset = {
  id: string; asset_id: string; asset_name: string; brand?: string; model_number?: string
  serial_number?: string; asset_subcategory?: string; condition: string; status: string
  purchase_date: string; purchase_price: number; current_value: number; salvage_value: number
  depreciation_method: string; depreciation_rate: number
  warranty_expiry?: string; insurance_policy_number?: string; insurance_value?: number
  notes?: string; tags: string[]; photos: string[]
  acquisition_source: string
  category?: { category_name: string }
  location?: { location_name: string; location_type: string; security_level: string }
  movements: any[]; valuations: any[]; sales: any[]; disposals: any[]
  created_at: string; updated_at: string
}

const STATUS_VARIANT: Record<string, 'success'|'warning'|'danger'|'neutral'|'info'> = {
  active: 'success', sold: 'info', disposed: 'neutral',
  lost: 'danger', stolen: 'danger', in_repair: 'warning',
}

const MOVEMENT_LABEL: Record<string, string> = {
  acquisition:'Acquired', transfer:'Transferred', sale:'Sold', disposal:'Disposed',
  repair_out:'Sent for repair', repair_in:'Back from repair',
  adjustment:'Value adjusted', valuation:'Valuation updated', found:'Found',
}

function fmtCurrency(n: number) {
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router  = useRouter()
  const [asset, setAsset]       = useState<Asset | null>(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'details'|'history'|'documents'>('details')
  const [error, setError]       = useState('')
  const [actionModal, setModal] = useState<'sell'|'dispose'|'transfer'|null>(null)
  const [actionForm, setActionForm] = useState<Record<string,string>>({})
  const [actioning, setActioning]  = useState(false)
  const [actionError, setActionError] = useState('')
  const [recalculating, setRecalc] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/v1/personal-assets/${id}`)
    if (res.ok) setAsset(await res.json())
    else setError('Asset not found')
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function recalculate() {
    setRecalc(true)
    const res = await fetch(`/api/v1/personal-assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: 'recalculate' }),
    })
    if (res.ok) await load()
    setRecalc(false)
  }

  async function doAction() {
    if (!actionModal) return
    setActioning(true)
    setActionError('')
    const res = await fetch(`/api/v1/personal-assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _action: actionModal, ...actionForm }),
    })
    const data = await res.json()
    if (!res.ok) { setActionError(data.error ?? 'Action failed'); setActioning(false); return }
    setModal(null)
    setActionForm({})
    await load()
    setActioning(false)
  }

  async function softDelete() {
    if (!confirm('Mark asset as disposed? This cannot be undone.')) return
    await fetch(`/api/v1/personal-assets/${id}`, { method: 'DELETE' })
    router.push('/personal-assets/inventory')
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (error || !asset) return (
    <div className="text-center py-20">
      <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
      <p className="text-sm text-slate-600">{error || 'Asset not found'}</p>
      <Button size="sm" className="mt-4" onClick={() => router.push('/personal-assets/inventory')}>
        Back to Inventory
      </Button>
    </div>
  )

  const deprPct = asset.purchase_price > 0
    ? Math.round(((asset.purchase_price - asset.current_value) / asset.purchase_price) * 100)
    : 0
  const gainLoss = asset.current_value - asset.purchase_price

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push('/personal-assets/inventory')}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-bold text-slate-800 truncate">{asset.asset_name}</h1>
            <Badge variant={STATUS_VARIANT[asset.status] ?? 'neutral'} dot>
              {asset.status.replace('_', ' ')}
            </Badge>
            {asset.category && <Badge variant="neutral" size="sm">{asset.category.category_name}</Badge>}
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{asset.asset_id}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost" size="sm"
            leftIcon={<RefreshCw className={`h-3 w-3 ${recalculating ? 'animate-spin' : ''}`} />}
            onClick={recalculate}
            disabled={recalculating}
            title="Recalculate depreciation"
          >
            Recalculate
          </Button>
          {asset.status === 'active' && (
            <>
              <Button variant="outline" size="sm" leftIcon={<ShoppingCart className="h-3 w-3" />}
                onClick={() => { setModal('sell'); setActionForm({ sale_date: new Date().toISOString().split('T')[0] }) }}>
                Sell
              </Button>
              <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-3 w-3" />}
                onClick={() => { setModal('dispose'); setActionForm({ disposal_date: new Date().toISOString().split('T')[0] }) }}>
                Dispose
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Key value cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Purchase Price</p>
          <p className="text-lg font-bold text-slate-700 tabular-nums">{fmtCurrency(asset.purchase_price)}</p>
          <p className="text-[10px] text-slate-400">{fmtDate(asset.purchase_date)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Current Value</p>
          <p className="text-lg font-bold text-indigo-700 tabular-nums">{fmtCurrency(asset.current_value)}</p>
          {deprPct > 0 && <p className="text-[10px] text-amber-500">−{deprPct}% depreciated</p>}
        </Card>
        <Card className="text-center">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Gain / Loss</p>
          <p className={`text-lg font-bold tabular-nums ${gainLoss >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {gainLoss >= 0 ? '+' : ''}{fmtCurrency(gainLoss)}
          </p>
          <p className="text-[10px] text-slate-400">vs. purchase</p>
        </Card>
        <Card className="text-center">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Condition</p>
          <p className="text-base font-bold text-slate-700 capitalize">{asset.condition}</p>
          <p className="text-[10px] text-slate-400">{asset.acquisition_source}</p>
        </Card>
      </div>

      {/* Tabs */}
      <Card padding="none">
        <div className="flex border-b border-slate-100 px-5">
          {(['details','history','documents'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors capitalize ${
                tab === t ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Details tab */}
          {tab === 'details' && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left column */}
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-3">Asset Information</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Category',    value: asset.category?.category_name },
                      { label: 'Sub-category',value: asset.asset_subcategory },
                      { label: 'Brand',       value: asset.brand },
                      { label: 'Model',       value: asset.model_number },
                      { label: 'Serial No.',  value: asset.serial_number },
                      { label: 'Condition',   value: asset.condition, capitalize: true },
                    ].map(row => row.value && (
                      <div key={row.label} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-24 flex-shrink-0">{row.label}</span>
                        <span className={`text-xs font-medium text-slate-700 ${row.capitalize ? 'capitalize' : ''}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-3">Depreciation</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Method', value: asset.depreciation_method.replace('_', ' '), capitalize: true },
                      { label: 'Rate',   value: `${asset.depreciation_rate}% per year` },
                      { label: 'Salvage Value', value: fmtCurrency(asset.salvage_value) },
                    ].map(row => (
                      <div key={row.label} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-28 flex-shrink-0">{row.label}</span>
                        <span className={`text-xs font-medium text-slate-700 ${row.capitalize ? 'capitalize' : ''}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Depreciation bar */}
                  {deprPct > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Remaining value</span>
                        <span>{100 - deprPct}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${100 - deprPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-5">
                {asset.location && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-3">Storage Location</p>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{asset.location.location_name}</p>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {asset.location.location_type} · {asset.location.security_level} security
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(asset.insurance_policy_number || asset.insurance_value) && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-3">Insurance</p>
                    <div className="space-y-2">
                      {asset.insurance_policy_number && (
                        <div className="flex gap-2">
                          <span className="text-xs text-slate-400 w-28">Policy No.</span>
                          <span className="text-xs font-mono font-medium text-slate-700">{asset.insurance_policy_number}</span>
                        </div>
                      )}
                      {asset.insurance_value && (
                        <div className="flex gap-2">
                          <span className="text-xs text-slate-400 w-28">Insured Value</span>
                          <span className="text-xs font-medium text-slate-700">{fmtCurrency(asset.insurance_value)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {asset.warranty_expiry && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-3">Warranty</p>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Shield className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Expires {fmtDate(asset.warranty_expiry)}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(asset.warranty_expiry) > new Date() ? 'Active' : 'Expired'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {asset.tags.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-3">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {asset.tags.map(tag => (
                        <Badge key={tag} variant="neutral" size="sm">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {asset.notes && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Notes</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{asset.notes}</p>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Record Info</p>
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <span className="text-xs text-slate-400 w-24">Created</span>
                      <span className="text-xs text-slate-600">{fmtDateTime(asset.created_at)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs text-slate-400 w-24">Last updated</span>
                      <span className="text-xs text-slate-600">{fmtDateTime(asset.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Movement History tab */}
          {tab === 'history' && (
            <div className="space-y-2">
              {asset.movements.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No movement history recorded</p>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200" />
                  {[...asset.movements]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((m, i) => (
                      <div key={m.id ?? i} className="relative mb-5 last:mb-0">
                        <div className="absolute -left-4 top-0.5 h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Clock className="h-2.5 w-2.5 text-indigo-500" />
                        </div>
                        <p className="text-xs font-semibold text-slate-700">
                          {MOVEMENT_LABEL[m.movement_type] ?? m.movement_type}
                        </p>
                        {m.notes && <p className="text-[11px] text-slate-500 mt-0.5">{m.notes}</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">{fmtDateTime(m.created_at)}</p>
                      </div>
                    ))}
                </div>
              )}

              {/* Valuation history */}
              {asset.valuations.length > 0 && (
                <div className="mt-6">
                  <Divider label="Valuation History" />
                  <div className="space-y-2 mt-3">
                    {[...asset.valuations]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((v, i) => (
                        <div key={v.id ?? i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                          <div>
                            <p className="text-xs text-slate-600">{fmtDate(v.valuation_date)}</p>
                            {v.notes && <p className="text-[10px] text-slate-400">{v.notes}</p>}
                          </div>
                          <div className="text-right">
                            {v.old_value && <p className="text-[10px] text-slate-400 line-through">{fmtCurrency(v.old_value)}</p>}
                            <p className="text-xs font-semibold text-slate-700">{fmtCurrency(v.new_value)}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents tab */}
          {tab === 'documents' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-slate-600">Receipts, Certificates & Manuals</p>
              </div>
              {asset.photos.length === 0 ? (
                <EmptyState
                  icon={<FileText className="h-6 w-6" />}
                  title="No documents or photos"
                  description="Photo uploads and document attachment coming soon."
                />
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {asset.photos.map((url, i) => (
                    <img key={i} src={url} alt={`Photo ${i+1}`} className="h-28 w-full object-cover rounded-lg border border-slate-200" />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Action Modals */}
      {actionModal === 'sell' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader title="Sell Asset" description="Record the sale of this asset" />
            {actionError && <div className="mb-4"><Alert variant="danger">{actionError}</Alert></div>}
            <div className="space-y-3">
              <Input label="Sale Date" type="date" value={actionForm.sale_date ?? ''} onChange={e => setActionForm(f => ({ ...f, sale_date: e.target.value }))} />
              <Input label="Sale Price (₹) *" type="number" min="0" placeholder="0.00" value={actionForm.sale_price ?? ''} onChange={e => setActionForm(f => ({ ...f, sale_price: e.target.value }))} />
              <Input label="Buyer Name" placeholder="Optional" value={actionForm.buyer_name ?? ''} onChange={e => setActionForm(f => ({ ...f, buyer_name: e.target.value }))} />
              <Input label="Notes" placeholder="Optional details" value={actionForm.notes ?? ''} onChange={e => setActionForm(f => ({ ...f, notes: e.target.value }))} />
              {actionForm.sale_price && (
                <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                  Gain/Loss: {Number(actionForm.sale_price) >= asset.current_value ? '+' : ''}
                  {fmtCurrency(Number(actionForm.sale_price) - asset.current_value)} vs. current value
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="ghost" size="sm" onClick={() => { setModal(null); setActionError('') }}>Cancel</Button>
              <Button size="sm" loading={actioning} onClick={doAction}>Confirm Sale</Button>
            </div>
          </Card>
        </div>
      )}

      {actionModal === 'dispose' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader title="Dispose Asset" description="Record the disposal of this asset" />
            {actionError && <div className="mb-4"><Alert variant="danger">{actionError}</Alert></div>}
            <div className="space-y-3">
              <Input label="Disposal Date" type="date" value={actionForm.disposal_date ?? ''} onChange={e => setActionForm(f => ({ ...f, disposal_date: e.target.value }))} />
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Reason *</label>
                <select className="w-full h-8 px-3 text-sm rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={actionForm.disposal_reason ?? ''} onChange={e => setActionForm(f => ({ ...f, disposal_reason: e.target.value }))}>
                  <option value="">Select reason…</option>
                  <option value="discarded">Discarded</option>
                  <option value="donated">Donated</option>
                  <option value="destroyed">Destroyed</option>
                  <option value="lost">Lost</option>
                  <option value="stolen">Stolen</option>
                </select>
              </div>
              <Input label="Recipient / Notes" placeholder="Who received it, or additional context" value={actionForm.notes ?? ''} onChange={e => setActionForm(f => ({ ...f, notes: e.target.value }))} />
              <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Loss recorded: {fmtCurrency(asset.current_value)}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="ghost" size="sm" onClick={() => { setModal(null); setActionError('') }}>Cancel</Button>
              <Button variant="danger" size="sm" loading={actioning} onClick={doAction}>Confirm Disposal</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
