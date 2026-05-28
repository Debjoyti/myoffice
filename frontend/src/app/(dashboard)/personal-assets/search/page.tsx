'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Badge, Button, EmptyState } from '@/components/ui'
import { Search, Package, ArrowRight, X, Clock } from 'lucide-react'

type Asset = {
  id: string; asset_id: string; asset_name: string; brand?: string
  current_value: number; status: string; condition: string
  category?: { category_name: string }
  location?: { location_name: string }
}

const STATUS_VARIANT: Record<string, 'success'|'warning'|'danger'|'neutral'|'info'> = {
  active: 'success', sold: 'info', disposed: 'neutral',
  lost: 'danger', stolen: 'danger', in_repair: 'warning',
}

function fmtCurrency(n: number) {
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

const RECENT_SEARCHES_KEY = 'pa_recent_searches'
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]') } catch { return [] }
}
function saveRecent(q: string) {
  try {
    const prev = getRecent().filter(s => s !== q)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([q, ...prev].slice(0, 8)))
  } catch {}
}

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<Asset[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [recent, setRecent]   = useState<string[]>(() => getRecent())
  const debounceRef           = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return }
    setLoading(true)
    const res = await fetch(`/api/v1/personal-assets?search=${encodeURIComponent(q)}&page=1`)
    if (res.ok) {
      const data = await res.json()
      setResults(data.assets ?? [])
      setTotal(data.total ?? 0)
      setSearched(true)
      saveRecent(q.trim())
      setRecent(getRecent())
    }
    setLoading(false)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(q), 300)
  }

  function clearSearch() {
    setQuery('')
    setResults([])
    setSearched(false)
  }

  function useRecent(q: string) {
    setQuery(q)
    doSearch(q)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fadeIn">
      <h1 className="text-base font-bold text-slate-800">Search Assets</h1>

      {/* Search input */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            autoFocus
            type="text"
            className="w-full h-10 pl-10 pr-9 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Search by name, brand, serial number, tags…"
            value={query}
            onChange={handleChange}
            onKeyDown={e => { if (e.key === 'Enter') doSearch(query) }}
          />
          {query && (
            <button onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Recent searches */}
        {!searched && recent.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Recent Searches</p>
            <div className="flex flex-wrap gap-2">
              {recent.map(r => (
                <button
                  key={r}
                  onClick={() => useRecent(r)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <Clock className="h-3 w-3 text-slate-400" />
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <div>
          <p className="text-xs text-slate-500 mb-3">
            {total === 0 ? 'No results' : `${total} result${total !== 1 ? 's' : ''} for "${query}"`}
          </p>
          {results.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Package className="h-6 w-6" />}
                title="No assets found"
                description={`No assets match "${query}". Try a different search term.`}
              />
            </Card>
          ) : (
            <div className="space-y-2">
              {results.map(a => (
                <button
                  key={a.id}
                  onClick={() => router.push(`/personal-assets/${a.id}`)}
                  className="w-full text-left"
                >
                  <Card hover className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <Package className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">{a.asset_name}</p>
                        <Badge variant={STATUS_VARIANT[a.status] ?? 'neutral'} dot size="sm">
                          {a.status.replace('_',' ')}
                        </Badge>
                        {a.category && <Badge variant="neutral" size="sm">{a.category.category_name}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-mono">{a.asset_id}</span>
                        {a.brand && <span className="text-[11px] text-slate-400">{a.brand}</span>}
                        {a.location && <span className="text-[11px] text-slate-400">{a.location.location_name}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-700 tabular-nums">{fmtCurrency(a.current_value)}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{a.condition}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                  </Card>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prompt state */}
      {!loading && !searched && (
        <div className="text-center py-10 text-slate-400">
          <Search className="h-10 w-10 mx-auto mb-3 text-slate-200" />
          <p className="text-sm">Type to search your assets</p>
          <p className="text-xs mt-1">Search by name, brand, serial number, or tag</p>
        </div>
      )}
    </div>
  )
}
