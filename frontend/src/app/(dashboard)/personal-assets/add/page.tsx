'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card, Button, Input, Select, Textarea, Alert, Badge
} from '@/components/ui'
import {
  CheckCircle2, ChevronLeft, ChevronRight, Package,
  Info, Tag, X
} from 'lucide-react'
import { validateAsset, calculateCurrentValue, type DepreciationMethod } from '@/lib/services/personal-assets'

type Category = { id: string; category_name: string; default_depreciation_rate: number }
type Location = { id: string; location_name: string; location_type: string }

type FormData = {
  // Step 1: Basic
  asset_name:        string
  category_id:       string
  asset_subcategory: string
  // Step 2: Purchase
  purchase_date:     string
  purchase_price:    string
  acquisition_source:string
  // Step 3: Specifications
  brand:             string
  model_number:      string
  serial_number:     string
  condition:         string
  warranty_expiry:   string
  // Step 4: Financials
  depreciation_method: DepreciationMethod
  depreciation_rate:   string
  salvage_value:       string
  insurance_policy_number: string
  insurance_value:     string
  // Step 5: Location
  location_id:       string
  // Step 6: Notes & Tags
  notes:             string
  tags:              string[]
  tagInput:          string
}

const INIT: FormData = {
  asset_name: '', category_id: '', asset_subcategory: '',
  purchase_date: '', purchase_price: '', acquisition_source: 'retail',
  brand: '', model_number: '', serial_number: '', condition: 'good', warranty_expiry: '',
  depreciation_method: 'straight_line', depreciation_rate: '10', salvage_value: '0',
  insurance_policy_number: '', insurance_value: '',
  location_id: '',
  notes: '', tags: [], tagInput: '',
}

const STEPS = [
  { number: 1, title: 'Basic Info',       description: 'Name, category' },
  { number: 2, title: 'Purchase Details', description: 'When & how acquired' },
  { number: 3, title: 'Specifications',   description: 'Brand, model, serial' },
  { number: 4, title: 'Financials',       description: 'Depreciation, insurance' },
  { number: 5, title: 'Location',         description: 'Where is it stored?' },
  { number: 6, title: 'Notes & Tags',     description: 'Additional information' },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
      {STEPS.map((s, i) => (
        <div key={s.number} className="flex items-center">
          <div className="flex flex-col items-center min-w-[60px]">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              s.number < current  ? 'bg-indigo-600 border-indigo-600 text-white' :
              s.number === current ? 'bg-white border-indigo-600 text-indigo-600' :
              'bg-white border-slate-200 text-slate-400'
            }`}>
              {s.number < current ? <CheckCircle2 className="h-4 w-4" /> : s.number}
            </div>
            <p className={`text-[9px] font-semibold mt-1 text-center whitespace-nowrap ${
              s.number === current ? 'text-indigo-600' : 'text-slate-400'
            }`}>{s.title}</p>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-8 mx-1 mb-4 flex-shrink-0 ${s.number < current ? 'bg-indigo-500' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function AddAssetPage() {
  const router = useRouter()
  const [step, setStep]           = useState(1)
  const [form, setForm]           = useState<FormData>(INIT)
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [error, setError]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [done, setDone]           = useState(false)
  const [createdAsset, setCreatedAsset] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/personal-assets/categories').then(r => r.json()),
      fetch('/api/v1/personal-assets/locations').then(r => r.json()),
    ]).then(([cats, locs]) => {
      setCategories(cats)
      setLocations(locs)
    }).catch(() => {})
  }, [])

  function set(key: keyof FormData, value: any) {
    setForm(f => ({ ...f, [key]: value }))
    if (key === 'category_id' && value) {
      const cat = categories.find(c => c.id === value)
      if (cat) setForm(f => ({ ...f, category_id: value, depreciation_rate: String(cat.default_depreciation_rate) }))
    }
  }

  function validateStep(): string[] {
    switch (step) {
      case 1:
        if (!form.asset_name.trim()) return ['Asset name is required']
        return []
      case 2: {
        if (!form.purchase_date) return ['Purchase date is required']
        if (!form.purchase_price || Number(form.purchase_price) <= 0)
          return ['Purchase price must be a positive number']
        const pd = new Date(form.purchase_date)
        if (pd > new Date()) return ['Purchase date cannot be in the future']
        return []
      }
      case 3:
        return []
      case 4: {
        const rate = Number(form.depreciation_rate)
        if (isNaN(rate) || rate < 0 || rate > 100)
          return ['Depreciation rate must be 0–100%']
        const salvage = Number(form.salvage_value)
        const price   = Number(form.purchase_price)
        if (salvage > price) return ['Salvage value cannot exceed purchase price']
        return []
      }
      case 5: return []
      case 6: return []
      default: return []
    }
  }

  function next() {
    const errs = validateStep()
    if (errs.length > 0) { setError(errs[0]); return }
    setError('')
    setStep(s => s + 1)
  }

  function back() { setError(''); setStep(s => s - 1) }

  async function submit() {
    const errs = validateStep()
    if (errs.length > 0) { setError(errs[0]); return }
    setError('')
    setSaving(true)
    try {
      const payload = {
        asset_name:        form.asset_name.trim(),
        category_id:       form.category_id || null,
        asset_subcategory: form.asset_subcategory.trim() || null,
        purchase_date:     form.purchase_date,
        purchase_price:    Number(form.purchase_price),
        acquisition_source: form.acquisition_source,
        brand:             form.brand.trim() || null,
        model_number:      form.model_number.trim() || null,
        serial_number:     form.serial_number.trim() || null,
        condition:         form.condition,
        warranty_expiry:   form.warranty_expiry || null,
        depreciation_method: form.depreciation_method,
        depreciation_rate:   Number(form.depreciation_rate),
        salvage_value:       Number(form.salvage_value),
        insurance_policy_number: form.insurance_policy_number.trim() || null,
        insurance_value:     form.insurance_value ? Number(form.insurance_value) : null,
        location_id:         form.location_id || null,
        notes:               form.notes.trim() || null,
        tags:                form.tags,
      }
      const res = await fetch('/api/v1/personal-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create asset'); setSaving(false); return }
      setCreatedAsset(data)
      setDone(true)
    } catch {
      setError('Network error — please try again')
      setSaving(false)
    }
  }

  // Preview current value
  const previewValue = form.purchase_price && form.purchase_date
    ? calculateCurrentValue({
        purchasePrice:      Number(form.purchase_price),
        purchaseDate:       form.purchase_date,
        depreciationMethod: form.depreciation_method,
        depreciationRate:   Number(form.depreciation_rate),
        salvageValue:       Number(form.salvage_value),
      })
    : null

  if (done && createdAsset) {
    return (
      <Card className="max-w-lg mx-auto text-center py-10">
        <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 className="text-base font-bold text-slate-800 mb-1">Asset Created!</h2>
        <p className="text-sm text-slate-500 mb-1">{createdAsset.asset_name}</p>
        <p className="text-xs text-slate-400 font-mono mb-6">{createdAsset.asset_id}</p>
        <div className="flex items-center justify-center gap-3">
          <Button size="sm" onClick={() => router.push(`/personal-assets/${createdAsset.id}`)}>
            View Asset
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setForm(INIT); setStep(1); setDone(false) }}>
            Add Another
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push('/personal-assets/inventory')}>
            Go to Inventory
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="text-base font-bold text-slate-800">Add New Asset</h1>
        <p className="text-xs text-slate-500">Step {step} of {STEPS.length} — {STEPS[step-1].description}</p>
      </div>

      <StepIndicator current={step} />

      <Card>
        {error && <div className="mb-4"><Alert variant="danger">{error}</Alert></div>}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Basic Information</h2>
            <Input
              label="Asset Name *"
              placeholder="e.g. MacBook Pro 16-inch, Gold Ring, Honda Activa"
              value={form.asset_name}
              onChange={e => set('asset_name', e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
                <select
                  className="w-full h-8 px-3 text-sm rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={form.category_id}
                  onChange={e => set('category_id', e.target.value)}
                >
                  <option value="">Select category…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                </select>
              </div>
              <Input
                label="Sub-category"
                placeholder="e.g. Smartphone, Diamond, Sedan"
                value={form.asset_subcategory}
                onChange={e => set('asset_subcategory', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Purchase Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Purchase Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Purchase Date *"
                type="date"
                value={form.purchase_date}
                onChange={e => set('purchase_date', e.target.value)}
                required
              />
              <Input
                label="Purchase Price (₹) *"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.purchase_price}
                onChange={e => set('purchase_price', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Acquisition Source</label>
              <select
                className="w-full h-8 px-3 text-sm rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={form.acquisition_source}
                onChange={e => set('acquisition_source', e.target.value)}
              >
                <option value="retail">Retail Store</option>
                <option value="online">Online Purchase</option>
                <option value="auction">Auction</option>
                <option value="gift">Gift</option>
                <option value="inheritance">Inheritance</option>
                <option value="handmade">Handmade</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Specifications */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Specifications</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Brand / Manufacturer" placeholder="e.g. Apple, Samsung" value={form.brand} onChange={e => set('brand', e.target.value)} />
              <Input label="Model Number" placeholder="e.g. MBP16-2024" value={form.model_number} onChange={e => set('model_number', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Serial Number" placeholder="Unique serial (optional)" value={form.serial_number} onChange={e => set('serial_number', e.target.value)} />
              <Input label="Warranty Expiry" type="date" value={form.warranty_expiry} onChange={e => set('warranty_expiry', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Condition</label>
              <select
                className="w-full h-8 px-3 text-sm rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={form.condition}
                onChange={e => set('condition', e.target.value)}
              >
                <option value="new">New</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Financials */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Financial Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Depreciation Method</label>
                <select
                  className="w-full h-8 px-3 text-sm rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={form.depreciation_method}
                  onChange={e => set('depreciation_method', e.target.value as DepreciationMethod)}
                >
                  <option value="straight_line">Straight Line</option>
                  <option value="declining_balance">Declining Balance</option>
                  <option value="none">None (No Depreciation)</option>
                </select>
              </div>
              <Input
                label="Annual Depreciation Rate (%)"
                type="number" min="0" max="100" step="0.01"
                placeholder="10"
                value={form.depreciation_rate}
                onChange={e => set('depreciation_rate', e.target.value)}
                disabled={form.depreciation_method === 'none'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Salvage Value (₹)"
                type="number" min="0" step="0.01"
                placeholder="0"
                value={form.salvage_value}
                onChange={e => set('salvage_value', e.target.value)}
              />
              <Input
                label="Insurance Policy Number"
                placeholder="POL-XXXXXXXX"
                value={form.insurance_policy_number}
                onChange={e => set('insurance_policy_number', e.target.value)}
              />
            </div>
            <Input
              label="Insurance Value (₹)"
              type="number" min="0" step="0.01"
              placeholder="Insured amount"
              value={form.insurance_value}
              onChange={e => set('insurance_value', e.target.value)}
            />
            {/* Live depreciation preview */}
            {previewValue && form.depreciation_method !== 'none' && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-xs font-semibold text-indigo-700">Depreciation Preview (as of today)</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] text-indigo-400">Purchase Price</p>
                    <p className="text-xs font-bold text-indigo-700">₹{Number(form.purchase_price).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-indigo-400">Current Value</p>
                    <p className="text-xs font-bold text-indigo-700">₹{previewValue.currentValue.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-indigo-400">Depreciated</p>
                    <p className="text-xs font-bold text-amber-600">₹{previewValue.depreciationAmount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Location */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Storage Location</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Location</label>
              <select
                className="w-full h-8 px-3 text-sm rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={form.location_id}
                onChange={e => set('location_id', e.target.value)}
              >
                <option value="">No specific location</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.location_name} ({l.location_type})</option>)}
              </select>
            </div>
            {locations.length === 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-center gap-2">
                <Info className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  No locations set up yet. You can add locations in{' '}
                  <button
                    className="underline font-medium"
                    onClick={() => router.push('/personal-assets/settings')}
                  >
                    Settings
                  </button>
                  {' '}and come back to assign a location.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Notes & Tags */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Notes & Tags</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes / Description</label>
              <textarea
                className="w-full h-24 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                placeholder="Any additional details, purchase context, important notes…"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  className="flex-1 h-8 px-3 text-sm rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  placeholder="Type a tag and press Enter…"
                  value={form.tagInput}
                  onChange={e => set('tagInput', e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && form.tagInput.trim()) {
                      e.preventDefault()
                      const tag = form.tagInput.trim().toLowerCase()
                      if (!form.tags.includes(tag)) {
                        setForm(f => ({ ...f, tags: [...f.tags, tag], tagInput: '' }))
                      } else {
                        setForm(f => ({ ...f, tagInput: '' }))
                      }
                    }
                  }}
                />
                <Button
                  variant="outline" size="sm"
                  leftIcon={<Tag className="h-3 w-3" />}
                  onClick={() => {
                    const tag = form.tagInput.trim().toLowerCase()
                    if (tag && !form.tags.includes(tag)) {
                      setForm(f => ({ ...f, tags: [...f.tags, tag], tagInput: '' }))
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/60">
                    {tag}
                    <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))}>
                      <X className="h-2.5 w-2.5 text-indigo-400 hover:text-indigo-600" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Summary before submit */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
              <p className="text-xs font-semibold text-slate-600 mb-2">Review Summary</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400">Asset:</span> <span className="font-medium text-slate-700">{form.asset_name || '—'}</span></div>
                <div><span className="text-slate-400">Purchase Price:</span> <span className="font-medium text-slate-700">₹{Number(form.purchase_price || 0).toLocaleString('en-IN')}</span></div>
                <div><span className="text-slate-400">Condition:</span> <span className="font-medium text-slate-700 capitalize">{form.condition}</span></div>
                <div><span className="text-slate-400">Depreciation:</span> <span className="font-medium text-slate-700">{form.depreciation_method === 'none' ? 'None' : `${form.depreciation_rate}% ${form.depreciation_method.replace('_', ' ')}`}</span></div>
                {previewValue && <div className="col-span-2"><span className="text-slate-400">Current Value:</span> <span className="font-semibold text-indigo-700">₹{previewValue.currentValue.toLocaleString('en-IN')}</span></div>}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
          <Button
            variant="ghost" size="sm"
            leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
            onClick={step === 1 ? () => router.push('/personal-assets') : back}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < STEPS.length ? (
            <Button size="sm" rightIcon={<ChevronRight className="h-3.5 w-3.5" />} onClick={next}>
              Next
            </Button>
          ) : (
            <Button size="sm" loading={saving} onClick={submit} leftIcon={<Package className="h-3.5 w-3.5" />}>
              Create Asset
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
