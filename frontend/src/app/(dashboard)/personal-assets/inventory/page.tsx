'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  SearchInput, Select, EmptyState, StatCard
} from '@/components/ui'
import {
  Package, Plus, Filter, RefreshCw, Eye, ChevronLeft, ChevronRight,
  TrendingDown, Laptop, Gem, Car, Sofa, AlertCircle
} from 'lucide-react'

type Asset = {
  id: string; asset_id: string; asset_name: string; brand?: string
  purchase_date: string; purchase_price: number; current_value: number
  depreciation_method: string; depreciation_rate: number; condition: string
  status: string; serial_number?: string; tags: string[]
  category?: { id: string; category_name: string }
  location?: { id: string; location_name: string; location_type: string }
}

type Category = { id: string; category_name: string }
type Location = { id: string; location_name: string }

const STATUS_VARIANT: Record<string, 'success'|'warning'|'danger'|'neutral'|'info'> = {
  active: 'success', sold: 'info', disposed: 'neutral',
  lost: 'danger', stolen: 'danger', in_repair: 'warning',
}

const CONDITION_VARIANT: Record<string, 'success'|'info'|'warning'|'danger'|'neutral'> = {
  new: 'success', excellent: 'success', good: 'info', fair: 'warning', poor: 'danger', damaged: 'danger',
}

function fmtCurrency(n: number) {
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function InventoryPage() {
  const router = useRouter()
  const [assets, setAssets]         = useState<Asset[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations]   = useState<Location[]>([])
  const [loading, setLoading]       = useState(true)
  const [total, setTotal]           = useState(0)
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [page, setPage]             = useState(1)

  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('')
  const [catFilter, setCat]         = useState('')
  const [locFilter, setLoc]         = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (search)      params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (catFilter)   params.set('category', catFilter)
    if (locFilter)   params.set('location', locFilter)

    const [res, catRes, locRes] = await Promise.all([
      fetch(`/api/v1/personal-assets?${params}`),
      categories.length === 0 ? fetch('/api/v1/personal-assets/categories') : Promise.resolve(null),
      locations.length === 0  ? fetch('/api/v1/personal-assets/locations')  : Promise.resolve(null),
    ])

    if (res.ok) {
      const data = await res.json()
      setAssets(data.assets ?? [])
      setTotal(data.total ?? 0)
      setPortfolioValue(data.portfolioValue ?? 0)
    }
    if (catRes?.ok) setCategories(await catRes.json())
    if (locRes?.ok) setLocations(await locRes.json())
    setLoading(false)
  }, [page, search, statusFilter, catFilter, locFilter])

  useEffect(() => { load() }, [load])

  const activeCount = assets.filter(a => a.status === 'active').length
  const deprAssets  = assets.filter(a => a.depreciation_method !== 'none').length

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Asset Inventory"
        description={`${total} total asset${total !== 1 ? 's' : ''} — full lifecycle tracking`}
        actions={
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => router.push('/personal-assets/add')}>
            Add Asset
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Portfolio Value" value={`₹${(portfolioValue/100000).toFixed(1)}L`} icon={<Package className="h-4 w-4" />} iconColor="bg-indigo-50 text-indigo-600" />
        <StatCard label="Active Assets"   value={activeCount}   icon={<Package className="h-4 w-4" />}      iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Depreciating"    value={deprAssets}    icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Total Found"     value={total}         icon={<Filter className="h-4 w-4" />}       iconColor="bg-blue-50 text-blue-600" />
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            placeholder="Search name, brand, serial…"
            value={search}
            onChange={v => { setSearch(v); setPage(1) }}
            className="w-64"
          />
          <div className="flex gap-2 flex-wrap">
            <select
              className="h-7 px-2 text-xs rounded-md border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={statusFilter}
              onChange={e => { setStatus(e.target.value); setPage(1) }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="disposed">Disposed</option>
              <option value="in_repair">In Repair</option>
              <option value="lost">Lost</option>
              <option value="stolen">Stolen</option>
            </select>
            <select
              className="h-7 px-2 text-xs rounded-md border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={catFilter}
              onChange={e => { setCat(e.target.value); setPage(1) }}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
            </select>
            <select
              className="h-7 px-2 text-xs rounded-md border border-slate-200 bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={locFilter}
              onChange={e => { setLoc(e.target.value); setPage(1) }}
            >
              <option value="">All Locations</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.location_name}</option>)}
            </select>
            {(search || statusFilter || catFilter || locFilter) && (
              <button
                onClick={() => { setSearch(''); setStatus(''); setCat(''); setLoc(''); setPage(1) }}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Clear
              </button>
            )}
          </div>
          <button onClick={load} className="ml-auto p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title="No assets found"
              description="Try adjusting your filters or add a new asset."
              action={
                <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => router.push('/personal-assets/add')}>
                  Add Asset
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Asset</Th>
                  <Th>Category</Th>
                  <Th>Location</Th>
                  <Th>Condition</Th>
                  <Th align="right">Purchase</Th>
                  <Th align="right">Current Value</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {assets.map(a => {
                  const deprPct = a.purchase_price > 0
                    ? Math.round(((a.purchase_price - a.current_value) / a.purchase_price) * 100)
                    : 0
                  return (
                    <Tr key={a.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-md bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <Package className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{a.asset_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{a.asset_id}</p>
                            {a.serial_number && (
                              <p className="text-[10px] text-slate-400 font-mono">S/N: {a.serial_number}</p>
                            )}
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <span className="text-xs text-slate-600">
                          {a.category?.category_name ?? <span className="text-slate-300">—</span>}
                        </span>
                      </Td>
                      <Td>
                        {a.location ? (
                          <span className="text-xs text-slate-600">{a.location.location_name}</span>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </Td>
                      <Td>
                        <Badge variant={CONDITION_VARIANT[a.condition] ?? 'neutral'} size="sm">
                          {a.condition.charAt(0).toUpperCase() + a.condition.slice(1)}
                        </Badge>
                      </Td>
                      <Td align="right">
                        <span className="text-xs text-slate-500 tabular-nums">{fmtCurrency(a.purchase_price)}</span>
                        <p className="text-[10px] text-slate-400">{fmtDate(a.purchase_date)}</p>
                      </Td>
                      <Td align="right">
                        <span className="text-xs font-semibold text-slate-800 tabular-nums">{fmtCurrency(a.current_value)}</span>
                        {deprPct > 0 && (
                          <p className="text-[10px] text-amber-500">−{deprPct}% depr.</p>
                        )}
                      </Td>
                      <Td>
                        <Badge variant={STATUS_VARIANT[a.status] ?? 'neutral'} dot size="sm">
                          {a.status.replace('_', ' ')}
                        </Badge>
                      </Td>
                      <Td>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => router.push(`/personal-assets/${a.id}`)}
                          title="View details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>

            {/* Pagination */}
            {total > 50 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Showing {Math.min((page - 1) * 50 + 1, total)}–{Math.min(page * 50, total)} of {total}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs text-slate-600 px-2">Page {page}</span>
                  <Button variant="ghost" size="icon" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
