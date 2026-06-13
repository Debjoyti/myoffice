'use client'

/**
 * Live-dashboard kit — shared building blocks for the Insights section.
 * Pure SVG/CSS charts (no chart dependency) + a polling data hook so every
 * dashboard reflects underlying changes in near real-time.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Activity, RefreshCw, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react'

/* ── Live data hook ─────────────────────────────────────────────────────── */
export function useLiveData<T = any>(url: string, intervalMs = 15000) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const timer = useRef<any>(null)

  const fetcher = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
      setError(null)
      setUpdatedAt(Date.now())
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetcher(false)
    timer.current = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return // pause when tab hidden
      fetcher(true)
    }, intervalMs)
    const onFocus = () => fetcher(true)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      clearInterval(timer.current)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [fetcher, intervalMs])

  return { data, loading, error, updatedAt, refresh: () => fetcher(true) }
}

/* ── Live status pill ───────────────────────────────────────────────────── */
export function LiveDot({ updatedAt }: { updatedAt: number | null }) {
  const [, force] = useState(0)
  useEffect(() => { const t = setInterval(() => force(n => n + 1), 1000); return () => clearInterval(t) }, [])
  const secs = updatedAt ? Math.max(0, Math.round((Date.now() - updatedAt) / 1000)) : null
  const label = secs == null ? 'connecting…' : secs < 2 ? 'just now' : secs < 60 ? `${secs}s ago` : `${Math.round(secs / 60)}m ago`
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      Live · {label}
    </span>
  )
}

/* ── Section header with range tabs / refresh / export ──────────────────── */
export function InsightHeader({
  title, subtitle, accent = 'blue', updatedAt, onRefresh, onExport, range, onRange, ranges,
}: {
  title: string; subtitle?: string; accent?: string; updatedAt?: number | null
  onRefresh?: () => void; onExport?: () => void
  range?: string; onRange?: (r: string) => void; ranges?: { id: string; label: string }[]
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2.5">
          <span className={cn('h-7 w-1.5 rounded-full', ACCENT_BAR[accent] ?? ACCENT_BAR.blue)} />
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
          {updatedAt !== undefined && <LiveDot updatedAt={updatedAt ?? null} />}
        </div>
        {subtitle && <p className="text-sm text-slate-500 mt-1 ml-4">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {ranges && (
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            {ranges.map(r => (
              <button key={r.id} onClick={() => onRange?.(r.id)}
                className={cn('px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                  range === r.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                {r.label}
              </button>
            ))}
          </div>
        )}
        {onRefresh && (
          <button onClick={onRefresh} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Refresh now">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
        {onExport && (
          <button onClick={onExport} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        )}
      </div>
    </div>
  )
}

const ACCENT_BAR: Record<string, string> = {
  blue: 'bg-blue-500', emerald: 'bg-emerald-500', violet: 'bg-violet-500',
  amber: 'bg-amber-500', rose: 'bg-rose-500', cyan: 'bg-cyan-500', indigo: 'bg-indigo-500',
}
const ACCENT_TEXT: Record<string, string> = {
  blue: 'text-blue-600', emerald: 'text-emerald-600', violet: 'text-violet-600',
  amber: 'text-amber-600', rose: 'text-rose-600', cyan: 'text-cyan-600', indigo: 'text-indigo-600',
}
const ACCENT_SOFT: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600', rose: 'bg-rose-50 text-rose-600', cyan: 'bg-cyan-50 text-cyan-600', indigo: 'bg-indigo-50 text-indigo-600',
}
const ACCENT_HEX: Record<string, string> = {
  blue: '#3b82f6', emerald: '#10b981', violet: '#8b5cf6',
  amber: '#f59e0b', rose: '#f43f5e', cyan: '#06b6d4', indigo: '#6366f1',
}

/* ── KPI tile (optional sparkline) ──────────────────────────────────────── */
export function KpiTile({
  label, value, sub, delta, icon, accent = 'blue', spark, loading,
}: {
  label: string; value: React.ReactNode; sub?: string
  delta?: { value: string; positive: boolean }
  icon?: React.ReactNode; accent?: string; spark?: number[]; loading?: boolean
}) {
  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {icon && <span className={cn('p-1.5 rounded-lg', ACCENT_SOFT[accent] ?? ACCENT_SOFT.blue)}>{icon}</span>}
      </div>
      {loading
        ? <div className="h-7 w-20 mt-2 rounded bg-slate-100 animate-pulse" />
        : <div className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">{value}</div>}
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex items-center gap-1.5">
          {delta && (
            <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-bold',
              delta.positive ? 'text-emerald-600' : 'text-rose-600')}>
              {delta.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{delta.value}
            </span>
          )}
          {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
        </div>
        {spark && spark.length > 1 && <AreaSpark data={spark} accent={accent} width={70} height={26} />}
      </div>
    </div>
  )
}

/* ── Card / panel ───────────────────────────────────────────────────────── */
export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          {title && <h3 className="text-sm font-semibold text-slate-800">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}

/* ── SVG area sparkline ─────────────────────────────────────────────────── */
export function AreaSpark({ data, accent = 'blue', width = 240, height = 56 }: { data: number[]; accent?: string; width?: number; height?: number }) {
  if (!data || data.length === 0) return <div style={{ height }} className="flex items-center justify-center text-xs text-slate-300">no data</div>
  const max = Math.max(...data, 1), min = Math.min(...data, 0)
  const span = max - min || 1
  const stepX = data.length > 1 ? width / (data.length - 1) : width
  const pts = data.map((d, i) => [i * stepX, height - ((d - min) / span) * (height - 6) - 3])
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  const hex = ACCENT_HEX[accent] ?? ACCENT_HEX.blue
  const id = `g-${accent}-${width}-${height}`
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={hex} stopOpacity="0.25" /><stop offset="100%" stopColor={hex} stopOpacity="0" />
      </linearGradient></defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={hex} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/* ── SVG vertical bars ──────────────────────────────────────────────────── */
export function Bars({ data, accent = 'blue', height = 160, valueFmt }: {
  data: { label: string; value: number }[]; accent?: string; height?: number; valueFmt?: (n: number) => string
}) {
  if (!data || data.length === 0) return <Empty />
  const max = Math.max(...data.map(d => d.value), 1)
  const hex = ACCENT_HEX[accent] ?? ACCENT_HEX.blue
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end group min-w-0">
          <span className="text-[9px] text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{valueFmt ? valueFmt(d.value) : d.value}</span>
          <div className="w-full rounded-t transition-all group-hover:opacity-80" style={{ height: `${(d.value / max) * (height - 24)}px`, minHeight: 2, background: hex }} />
          <span className="text-[9px] text-slate-400 mt-1 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ── SVG donut ──────────────────────────────────────────────────────────── */
const DONUT_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#6366f1', '#94a3b8']
export function Donut({ data, size = 150, centerLabel, centerValue }: {
  data: { label: string; value: number; color?: string }[]; size?: number; centerLabel?: string; centerValue?: React.ReactNode
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total <= 0) return <Empty />
  const r = size / 2, stroke = size * 0.16, c = 2 * Math.PI * (r - stroke / 2)
  let offset = 0
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
        {data.map((d, i) => {
          const frac = d.value / total, len = frac * c
          const el = (
            <circle key={i} cx={r} cy={r} r={r - stroke / 2} fill="none"
              stroke={d.color ?? DONUT_PALETTE[i % DONUT_PALETTE.length]} strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />
          )
          offset += len
          return el
        })}
        {centerValue !== undefined && (
          <g className="rotate-90" style={{ transformOrigin: 'center' }}>
            <text x={r} y={r - 2} textAnchor="middle" className="fill-slate-900 font-bold" style={{ fontSize: size * 0.16 }}>{centerValue as any}</text>
            {centerLabel && <text x={r} y={r + size * 0.13} textAnchor="middle" className="fill-slate-400" style={{ fontSize: size * 0.08 }}>{centerLabel}</text>}
          </g>
        )}
      </svg>
      <div className="space-y-1.5 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: d.color ?? DONUT_PALETTE[i % DONUT_PALETTE.length] }} />
            <span className="text-slate-600 truncate">{d.label}</span>
            <span className="text-slate-400 ml-auto font-medium">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Progress ring ──────────────────────────────────────────────────────── */
export function Ring({ value, max = 100, accent = 'blue', size = 96, label }: { value: number; max?: number; accent?: string; size?: number; label?: string }) {
  const pct = Math.min(1, max > 0 ? value / max : 0)
  const r = size / 2, stroke = size * 0.1, c = 2 * Math.PI * (r - stroke / 2)
  const hex = ACCENT_HEX[accent] ?? ACCENT_HEX.blue
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={r} cy={r} r={r - stroke / 2} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle cx={r} cy={r} r={r - stroke / 2} fill="none" stroke={hex} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${pct * c} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-900">{Math.round(pct * 100)}%</span>
        {label && <span className="text-[9px] text-slate-400">{label}</span>}
      </div>
    </div>
  )
}

/* ── Ranked list ────────────────────────────────────────────────────────── */
export function RankList({ items, accent = 'blue' }: { items: { label: string; value: React.ReactNode; bar?: number; sub?: string; img?: string | null }[]; accent?: string }) {
  if (!items || items.length === 0) return <Empty />
  const max = Math.max(...items.map(i => i.bar ?? 0), 1)
  return (
    <div className="space-y-2.5">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-300 w-4 text-right">{i + 1}</span>
          {it.img !== undefined && (
            <span className="h-8 w-8 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
              {it.img ? <img src={it.img} alt="" className="h-full w-full object-cover" /> : null}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-700 truncate">{it.label}</span>
              <span className="text-xs font-semibold text-slate-800 flex-shrink-0">{it.value}</span>
            </div>
            {it.bar !== undefined && (
              <div className="h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(it.bar / max) * 100}%`, background: ACCENT_HEX[accent] ?? ACCENT_HEX.blue }} />
              </div>
            )}
            {it.sub && <span className="text-[10px] text-slate-400">{it.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Empty({ msg = 'No data yet' }: { msg?: string }) {
  return <div className="h-full min-h-[120px] flex items-center justify-center text-sm text-slate-300">{msg}</div>
}

/* ── CSV export ─────────────────────────────────────────────────────────── */
export function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return
  const headers = Object.keys(rows[0])
  const esc = (v: any) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

export { ACCENT_TEXT, ACCENT_SOFT, ACCENT_HEX }
