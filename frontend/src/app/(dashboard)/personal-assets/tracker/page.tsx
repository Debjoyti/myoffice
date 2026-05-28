'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Badge, Button } from '@/components/ui'
import {
  MapPin, Package, Clock, CheckCircle2, Wrench, ArrowRight,
  Home, Building2, Shield, Car, Archive, RefreshCw, Search,
  Activity, Zap, AlertTriangle, TrendingDown, Circle,
  ChevronRight, RotateCcw, ShoppingBag, Trash2, Eye
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type Loc = { id: string; location_name: string; location_type: string; lat?: number; lng?: number }

type Movement = {
  id: string
  movement_type: string
  notes?: string
  reference_doc?: string
  created_at: string
  from_loc?: Loc
  to_loc?: Loc
}

type AssetSummary = {
  id: string; asset_id: string; asset_name: string; status: string
  condition: string; current_value: number; purchase_price: number; purchase_date: string
  category?: { category_name: string }
  location?: { location_name: string; location_type: string }
}

type AssetDetail = AssetSummary & {
  brand?: string; salvage_value: number
  depreciation_method: string; depreciation_rate: number
  warranty_expiry?: string; insurance_policy_number?: string; insurance_value?: number
  notes?: string; tags: string[]; created_at: string; updated_at: string
  location?: Loc & { security_level: string; city?: string }
}

type LocationHub = {
  id: string; location_name: string; location_type: string
  security_level: string; lat?: number; lng?: number; city?: string; address?: string
  asset_count: number; active_count: number
}

type TrackerData = {
  locations: LocationHub[]
  assets: AssetSummary[]
  asset: AssetDetail | null
  journey: Movement[] | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  active: 'success', sold: 'info', disposed: 'neutral',
  lost: 'danger', stolen: 'danger', in_repair: 'warning',
}

const MOVEMENT_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  acquisition: { label: 'Acquired',          icon: ShoppingBag,   color: 'text-emerald-600', bg: 'bg-emerald-100' },
  transfer:    { label: 'Transferred',        icon: ArrowRight,    color: 'text-indigo-600',  bg: 'bg-indigo-100' },
  sale:        { label: 'Sold',               icon: TrendingDown,  color: 'text-blue-600',    bg: 'bg-blue-100' },
  disposal:    { label: 'Disposed',           icon: Trash2,        color: 'text-slate-500',   bg: 'bg-slate-100' },
  repair_out:  { label: 'Sent for Repair',    icon: Wrench,        color: 'text-amber-600',   bg: 'bg-amber-100' },
  repair_in:   { label: 'Returned from Repair',icon: RotateCcw,   color: 'text-teal-600',    bg: 'bg-teal-100' },
  found:       { label: 'Found / Recovered',  icon: Eye,           color: 'text-emerald-600', bg: 'bg-emerald-100' },
  adjustment:  { label: 'Value Adjusted',     icon: Activity,      color: 'text-purple-600',  bg: 'bg-purple-100' },
  valuation:   { label: 'Revalued',           icon: Zap,           color: 'text-orange-600',  bg: 'bg-orange-100' },
}

const LOC_ICON: Record<string, React.ElementType> = {
  room: Home, building: Building2, storage_unit: Archive,
  safe: Shield, vehicle: Car, other: MapPin,
}

const LOC_COLOR: Record<string, string> = {
  room: 'bg-indigo-100 text-indigo-700',
  building: 'bg-slate-100 text-slate-700',
  storage_unit: 'bg-amber-100 text-amber-700',
  safe: 'bg-emerald-100 text-emerald-700',
  vehicle: 'bg-blue-100 text-blue-700',
  other: 'bg-rose-100 text-rose-700',
}

function fmtCurrency(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateShort(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

// ─── Status Stepper ───────────────────────────────────────────────────────────

type Step = { label: string; sublabel: string; done: boolean; current: boolean; icon: React.ElementType }

function buildSteps(asset: AssetDetail, journey: Movement[]): Step[] {
  const hasRepairOut = journey.some(m => m.movement_type === 'repair_out')
  const hasRepairIn  = journey.some(m => m.movement_type === 'repair_in')
  const hasTransfer  = journey.some(m => m.movement_type === 'transfer')
  const isClosed     = ['sold', 'disposed', 'lost', 'stolen'].includes(asset.status)
  const isRepair     = asset.status === 'in_repair'

  const steps: Step[] = [
    {
      label: 'Acquired', sublabel: fmtDate(asset.purchase_date),
      done: true, current: false, icon: ShoppingBag,
    },
    {
      label: 'Active', sublabel: isRepair ? 'Previously active' : 'In use',
      done: true, current: !isRepair && !isClosed, icon: Activity,
    },
  ]

  if (hasRepairOut) {
    steps.push({
      label: 'Repair', sublabel: hasRepairIn ? 'Completed' : 'In progress',
      done: hasRepairIn, current: isRepair, icon: Wrench,
    })
  }

  if (hasTransfer) {
    steps.push({
      label: 'Transferred', sublabel: 'Location changed',
      done: true, current: false, icon: ArrowRight,
    })
  }

  if (isClosed) {
    const labels: Record<string, string> = {
      sold: 'Sold', disposed: 'Disposed', lost: 'Reported Lost', stolen: 'Reported Stolen',
    }
    steps.push({
      label: labels[asset.status] ?? asset.status,
      sublabel: 'Final state',
      done: true, current: true, icon: CheckCircle2,
    })
  }

  return steps
}

function StatusStepper({ steps }: { steps: Step[] }) {
  const doneCount = steps.filter(s => s.done).length
  const pct = Math.round((doneCount / steps.length) * 100)

  return (
    <div className="relative">
      {/* Progress track */}
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 mx-6" />
      <div
        className="absolute top-4 left-0 h-0.5 bg-indigo-500 mx-6 transition-all duration-700"
        style={{ width: `calc(${pct}% - 3rem)` }}
      />

      <div className="relative flex items-start justify-between px-2">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                step.current
                  ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-200'
                  : step.done
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'bg-white border-slate-200'
              }`}>
                {step.current ? (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                  </span>
                ) : (
                  <Icon className={`h-3.5 w-3.5 ${step.done ? 'text-white' : 'text-slate-300'}`} />
                )}
              </div>
              <p className={`text-[11px] font-semibold text-center ${step.current ? 'text-indigo-700' : step.done ? 'text-slate-700' : 'text-slate-400'}`}>
                {step.label}
              </p>
              <p className="text-[10px] text-slate-400 text-center leading-tight max-w-[80px]">{step.sublabel}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Journey Route SVG ────────────────────────────────────────────────────────

function JourneyRoute({ journey, currentLocName }: { journey: Movement[]; currentLocName?: string }) {
  // Build ordered list of unique location stops
  type Stop = { name: string; type: string; movementType: string; date: string; isCurrent: boolean }
  const stops: Stop[] = []

  for (const m of journey) {
    if (m.movement_type === 'acquisition' && m.to_loc) {
      stops.push({
        name: m.to_loc.location_name,
        type: m.to_loc.location_type,
        movementType: m.movement_type,
        date: m.created_at,
        isCurrent: false,
      })
    } else if (m.movement_type === 'transfer' && m.to_loc) {
      stops.push({
        name: m.to_loc.location_name,
        type: m.to_loc.location_type,
        movementType: m.movement_type,
        date: m.created_at,
        isCurrent: false,
      })
    } else if ((m.movement_type === 'repair_out' || m.movement_type === 'repair_in') && m.to_loc) {
      stops.push({
        name: m.to_loc.location_name,
        type: m.to_loc.location_type,
        movementType: m.movement_type,
        date: m.created_at,
        isCurrent: false,
      })
    }
  }

  // Mark last stop as current
  if (stops.length > 0) stops[stops.length - 1].isCurrent = true

  if (stops.length === 0) return null

  const nodeW = 80
  const gap   = 100
  const totalW = stops.length * nodeW + (stops.length - 1) * gap
  const svgW  = Math.max(totalW + 40, 300)
  const cy    = 60

  return (
    <div className="overflow-x-auto">
      <svg width={svgW} height={130} className="min-w-full">
        {/* Connecting lines */}
        {stops.slice(0, -1).map((_, i) => {
          const x1 = 20 + i * (nodeW + gap) + nodeW / 2
          const x2 = 20 + (i + 1) * (nodeW + gap) + nodeW / 2
          return (
            <g key={i}>
              <line x1={x1} y1={cy} x2={x2} y2={cy} stroke="#e2e8f0" strokeWidth={2} />
              <line x1={x1} y1={cy} x2={x2} y2={cy} stroke="#6366f1" strokeWidth={2}
                strokeDasharray="6 4" opacity={0.6}>
                <animate attributeName="stroke-dashoffset" from="0" to="-20"
                  dur="1s" repeatCount="indefinite" />
              </line>
              {/* Arrow */}
              <polygon
                points={`${(x1 + x2) / 2 - 4},${cy - 4} ${(x1 + x2) / 2 + 6},${cy} ${(x1 + x2) / 2 - 4},${cy + 4}`}
                fill="#6366f1" opacity={0.7}
              />
            </g>
          )
        })}

        {/* Nodes */}
        {stops.map((stop, i) => {
          const cx = 20 + i * (nodeW + gap) + nodeW / 2
          const Icon = LOC_ICON[stop.type] ?? MapPin
          const isCurrent = stop.isCurrent
          return (
            <g key={i}>
              {/* Pulse ring for current */}
              {isCurrent && (
                <circle cx={cx} cy={cy} r={22} fill="#6366f1" opacity={0.12}>
                  <animate attributeName="r" from="18" to="28" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.2" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Node circle */}
              <circle cx={cx} cy={cy} r={18}
                fill={isCurrent ? '#6366f1' : '#f1f5f9'} stroke={isCurrent ? '#4f46e5' : '#cbd5e1'} strokeWidth={2} />
              {/* Location label */}
              <text x={cx} y={cy + 36} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={600}>
                {stop.name.length > 12 ? stop.name.slice(0, 11) + '…' : stop.name}
              </text>
              <text x={cx} y={cy + 48} textAnchor="middle" fontSize={8} fill="#94a3b8">
                {fmtDateShort(stop.date)}
              </text>
              {/* Current badge */}
              {isCurrent && (
                <text x={cx} y={cy + 60} textAnchor="middle" fontSize={8} fill="#6366f1" fontWeight={700}>
                  NOW
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Movement Timeline ────────────────────────────────────────────────────────

function MovementTimeline({ journey }: { journey: Movement[] }) {
  if (journey.length === 0) {
    return <p className="text-xs text-slate-400 text-center py-4">No movement history</p>
  }

  return (
    <div className="space-y-0">
      {journey.map((m, i) => {
        const meta = MOVEMENT_META[m.movement_type] ?? { label: m.movement_type, icon: Activity, color: 'text-slate-500', bg: 'bg-slate-100' }
        const Icon = meta.icon
        const isLast = i === journey.length - 1

        return (
          <div key={m.id} className="flex gap-3">
            {/* Timeline spine */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center z-10 ${meta.bg}`}>
                <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-slate-100 my-1 min-h-[20px]" />}
            </div>

            {/* Content */}
            <div className={`pb-4 flex-1 min-w-0 ${isLast ? '' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-xs font-semibold ${isLast ? 'text-indigo-700' : 'text-slate-700'}`}>
                    {meta.label}
                    {isLast && (
                      <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-600">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600" />
                        </span>
                        CURRENT
                      </span>
                    )}
                  </p>
                  {m.from_loc && m.to_loc && (
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <span>{m.from_loc.location_name}</span>
                      <ArrowRight className="h-3 w-3 text-slate-300" />
                      <span>{m.to_loc.location_name}</span>
                    </p>
                  )}
                  {m.to_loc && !m.from_loc && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      <MapPin className="h-3 w-3 inline mr-0.5" />{m.to_loc.location_name}
                    </p>
                  )}
                  {m.notes && (
                    <p className="text-[11px] text-slate-400 mt-0.5 italic">"{m.notes}"</p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                  {fmtDate(m.created_at)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrackerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData]         = useState<TrackerData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [loadingAsset, setLoadingAsset] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('asset_id'))
  const [query, setQuery]       = useState('')
  const [filterLoc, setFilterLoc] = useState<string | null>(null)

  const load = useCallback(async (assetId?: string | null) => {
    const url = assetId
      ? `/api/v1/personal-assets/tracker?asset_id=${assetId}`
      : '/api/v1/personal-assets/tracker'
    const res = await fetch(url)
    if (res.ok) setData(await res.json())
  }, [])

  useEffect(() => {
    setLoading(true)
    load(selectedId).finally(() => setLoading(false))
  }, []) // eslint-disable-line

  async function selectAsset(id: string) {
    setSelectedId(id)
    setLoadingAsset(true)
    await load(id)
    setLoadingAsset(false)
  }

  const filteredAssets = (data?.assets ?? []).filter(a => {
    const q = query.toLowerCase()
    const matchQ = !q || a.asset_name.toLowerCase().includes(q) || a.asset_id.toLowerCase().includes(q) || a.category?.category_name.toLowerCase().includes(q)
    const matchL = !filterLoc || a.location?.location_name === filterLoc
    return matchQ && matchL
  })

  const selectedAsset = data?.asset
  const journey = data?.journey ?? []
  const steps = selectedAsset ? buildSteps(selectedAsset, journey) : []

  const gainLoss = selectedAsset
    ? selectedAsset.current_value - selectedAsset.purchase_price
    : 0

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">

      {/* ── Location Hub strip ──────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Your Locations</p>
        {loading ? (
          <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
        ) : (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterLoc(null)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                !filterLoc ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              All Assets
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${!filterLoc ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {data?.assets.length ?? 0}
              </span>
            </button>
            {(data?.locations ?? []).map(loc => {
              const Icon = LOC_ICON[loc.location_type] ?? MapPin
              const isActive = filterLoc === loc.location_name
              return (
                <button
                  key={loc.id}
                  onClick={() => setFilterLoc(isActive ? null : loc.location_name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    isActive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {loc.active_count > 0 && (
                    <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                  )}
                  <Icon className="h-3.5 w-3.5" />
                  {loc.location_name}
                  <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {loc.asset_count}
                  </span>
                </button>
              )
            })}
            {(data?.locations ?? []).length === 0 && !loading && (
              <button
                onClick={() => router.push('/personal-assets/settings')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all"
              >
                <MapPin className="h-3.5 w-3.5" />
                Add locations in Settings
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Main layout ─────────────────────────────────────────── */}
      <div className="flex gap-5 min-h-[600px]">

        {/* Left: Asset list */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Asset cards */}
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[600px] pr-1">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
              ))
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Package className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                <p className="text-xs">No assets found</p>
              </div>
            ) : (
              filteredAssets.map(a => {
                const isSelected = selectedId === a.id
                const Icon = LOC_ICON[a.location?.location_type ?? ''] ?? MapPin
                return (
                  <button
                    key={a.id}
                    onClick={() => selectAsset(a.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-150 ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected ? 'bg-indigo-600' : 'bg-slate-100'
                      }`}>
                        <Package className={`h-3 w-3 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-800' : 'text-slate-700'}`}>
                          {a.asset_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`text-[10px] font-bold ${
                            a.status === 'active' ? 'text-emerald-600' :
                            a.status === 'in_repair' ? 'text-amber-600' :
                            a.status === 'sold' ? 'text-blue-600' : 'text-slate-400'
                          }`}>
                            {a.status === 'active' ? '● Active' :
                             a.status === 'in_repair' ? '● Repair' :
                             a.status === 'sold' ? '● Sold' :
                             a.status === 'disposed' ? '○ Disposed' :
                             a.status === 'lost' ? '● Lost' : a.status}
                          </span>
                          {a.location && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5 truncate">
                              <Icon className="h-2.5 w-2.5 flex-shrink-0" />
                              {a.location.location_name}
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] font-bold mt-0.5 tabular-nums ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>
                          {fmtCurrency(a.current_value)}
                        </p>
                      </div>
                      {isSelected && <ChevronRight className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0 mt-1" />}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Tracker panel */}
        <div className="flex-1 min-w-0">
          {!selectedId || !selectedAsset ? (
            /* Empty prompt */
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-200 py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-indigo-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Select an asset to track</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Choose any asset from the list to see its full journey — where it's been, how its value changed, and where it is right now.
              </p>
            </div>
          ) : loadingAsset ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">

              {/* Asset header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-800">{selectedAsset.asset_name}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">{selectedAsset.asset_id}</span>
                    <Badge variant={STATUS_VARIANT[selectedAsset.status] ?? 'neutral'} dot size="sm">
                      {selectedAsset.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="neutral" size="sm">{selectedAsset.condition}</Badge>
                    {selectedAsset.category && (
                      <Badge variant="neutral" size="sm">{selectedAsset.category.category_name}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="ghost" leftIcon={<Eye className="h-3.5 w-3.5" />}
                    onClick={() => router.push(`/personal-assets/${selectedAsset.id}`)}>
                    Details
                  </Button>
                  <Button size="sm" variant="ghost" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                    onClick={() => load(selectedId)}>
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Status stepper — the Swiggy bar */}
              <Card>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-4">Asset Journey Status</p>
                <StatusStepper steps={steps} />
              </Card>

              {/* Info row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Current location live card */}
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 to-white pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Live Location</span>
                    </div>
                    {selectedAsset.location ? (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          {(() => {
                            const Icon = LOC_ICON[selectedAsset.location.location_type] ?? MapPin
                            return (
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${LOC_COLOR[selectedAsset.location.location_type] ?? 'bg-slate-100 text-slate-600'}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                            )
                          })()}
                          <div>
                            <p className="text-sm font-bold text-slate-800">{selectedAsset.location.location_name}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{selectedAsset.location.location_type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <Shield className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] text-slate-500 capitalize">Security: {selectedAsset.location.security_level}</span>
                        </div>
                        {selectedAsset.location.city && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{selectedAsset.location.city}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-slate-400">No location assigned</p>
                    )}
                  </div>
                </Card>

                {/* Value snapshot */}
                <Card>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Value Snapshot</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500">Purchase price</span>
                      <span className="text-xs font-bold text-slate-700 tabular-nums">{fmtCurrency(selectedAsset.purchase_price)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500">Current value</span>
                      <span className="text-xs font-bold text-indigo-700 tabular-nums">{fmtCurrency(selectedAsset.current_value)}</span>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500">{gainLoss >= 0 ? 'Gain' : 'Depreciation'}</span>
                      <span className={`text-xs font-bold tabular-nums ${gainLoss >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {gainLoss >= 0 ? '+' : ''}{fmtCurrency(Math.abs(gainLoss))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500">Depr. rate</span>
                      <span className="text-xs font-semibold text-slate-600">{selectedAsset.depreciation_rate}%/yr</span>
                    </div>
                    {selectedAsset.warranty_expiry && (
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-slate-500">Warranty</span>
                        <span className="text-xs text-slate-600">{fmtDate(selectedAsset.warranty_expiry)}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Journey route map */}
              {journey.length > 0 && (
                <Card>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-4">Route Map</p>
                  <div className="bg-slate-50 rounded-lg p-4"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
                      `,
                      backgroundSize: '24px 24px',
                    }}
                  >
                    <JourneyRoute
                      journey={journey}
                      currentLocName={selectedAsset.location?.location_name}
                    />
                  </div>
                </Card>
              )}

              {/* Movement timeline */}
              <Card>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-4">Movement History</p>
                <MovementTimeline journey={journey} />
                {journey.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No movements recorded yet. Add this asset to a location to start tracking.
                  </p>
                )}
              </Card>

              {/* Tags */}
              {selectedAsset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedAsset.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-medium">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
