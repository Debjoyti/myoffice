'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Banknote, TrendingUp, Wallet, Shield, FileText, History,
  RefreshCw, ChevronRight, Download, Eye, Plus, X,
  CheckCircle2, Clock, AlertCircle, ArrowUpRight, ArrowDownRight,
  Calendar, Building2, Award, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

interface SalaryStructure {
  id: string; effective_from: string; ctc_monthly: number; ctc_annual: number
  gross_monthly: number; net_monthly: number
  earnings: { basic: number; hra: number; special_allowance: number; transport_allowance: number; medical_allowance: number; lta_monthly: number; total: number }
  benefits: { pf_employer: number; gratuity_monthly: number; insurance_monthly: number; total: number }
  deductions: { pf_employee: number; esi_employee: number; professional_tax: number; total: number }
  breakdown: { label: string; value: number; pct: number; color: string }[]
}
interface Payslip {
  id: string; payroll_month: string; working_days: number; paid_days: number; loss_of_pay_days: number
  gross_earnings: number; total_deductions: number; net_salary: number
  basic_paid: number; hra_paid: number; special_allowance_paid: number; transport_allowance_paid: number
  medical_allowance_paid: number; lta_paid: number; bonus_paid: number; other_earnings: number
  pf_employee_deduction: number; esi_employee_deduction: number; professional_tax_deduction: number
  tds_deduction: number; advance_deduction: number; reimbursements_paid: number; status: string
}
interface ComplianceRecord {
  id: string; record_month: string; pf_employee: number; pf_employer: number
  esi_employee: number; esi_employer: number; esi_applicable: boolean; professional_tax: number
}
interface Reimbursement {
  id: string; category: string; amount: number; claim_month: string
  description: string; status: string; approved_at: string | null; paid_at: string | null; created_at: string
}
interface Revision {
  id: string; revision_date: string; revision_type: string
  old_ctc_monthly: number | null; new_ctc_monthly: number; percentage_change: number | null
  notes: string | null; approved_by: { full_name: string; designation: string } | null
}
interface AnnualData {
  fiscal_year: string
  monthly_chart: { month: string; gross: number; net: number; bonus: number; status: string | null }[]
  ytd: { gross_total: number; net_total: number; deductions_total: number; bonus_total: number; reimbursements_total: number; months_paid: number }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const fmtShort = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

const revisionTypeLabel: Record<string, string> = {
  joining: 'Joining Package', increment: 'Annual Increment',
  promotion: 'Promotion', correction: 'Correction', restructure: 'Restructure',
}
const revisionTypeColor: Record<string, string> = {
  joining: 'text-sky-600 bg-sky-50 border-sky-200',
  increment: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  promotion: 'text-violet-600 bg-violet-50 border-violet-200',
  correction: 'text-amber-600 bg-amber-50 border-amber-200',
  restructure: 'text-slate-600 bg-slate-50 border-slate-200',
}

const categoryLabel: Record<string, string> = {
  internet: 'Internet', travel: 'Travel', fuel: 'Fuel',
  petty_cash: 'Petty Cash', food: 'Food', other: 'Other',
}
const categoryColor: Record<string, string> = {
  internet: 'bg-sky-100 text-sky-700', travel: 'bg-violet-100 text-violet-700',
  fuel: 'bg-amber-100 text-amber-700', petty_cash: 'bg-emerald-100 text-emerald-700',
  food: 'bg-rose-100 text-rose-700', other: 'bg-slate-100 text-slate-700',
}
const statusConfig: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  paid:      { label: 'Paid',      cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" /> },
  finalized: { label: 'Finalized', cls: 'text-indigo-700 bg-indigo-50 border-indigo-200',   icon: <CheckCircle2 className="h-3 w-3" /> },
  generated: { label: 'Generated', cls: 'text-amber-700 bg-amber-50 border-amber-200',      icon: <Clock className="h-3 w-3" /> },
  draft:     { label: 'Draft',     cls: 'text-slate-600 bg-slate-100 border-slate-200',     icon: <AlertCircle className="h-3 w-3" /> },
  pending:   { label: 'Pending',   cls: 'text-amber-700 bg-amber-50 border-amber-200',      icon: <Clock className="h-3 w-3" /> },
  approved:  { label: 'Approved',  cls: 'text-emerald-700 bg-emerald-50 border-emerald-200',icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected:  { label: 'Rejected',  cls: 'text-red-700 bg-red-50 border-red-200',           icon: <X className="h-3 w-3" /> },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.draft
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border', cfg.cls)}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{children}</p>
}

function ComponentRow({ label, amount, sub, muted }: { label: string; amount: number; sub?: string; muted?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0', muted && 'opacity-60')}>
      <div>
        <p className="text-sm text-slate-700 font-medium">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <span className="text-sm font-semibold text-slate-800 tabular-nums">{fmt(amount)}</span>
    </div>
  )
}

// Custom tooltip for recharts
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.fill }} className="font-medium">{p.name}</span>
          <span className="font-semibold text-slate-800">{fmtShort(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// SVG Donut chart (custom, lightweight)
function DonutChart({ data, total }: { data: { label: string; value: number; color: string }[]; total: number }) {
  const SIZE = 180; const STROKE = 32; const R = (SIZE - STROKE) / 2
  const circ = 2 * Math.PI * R
  let offset = 0
  const slices = data.map(d => {
    const pct = d.value / total
    const dash = circ * pct; const gap = circ - dash
    const slice = { ...d, dash, gap, offset }
    offset += dash
    return slice
  })
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
          {slices.map((s, i) => (
            <circle key={i} cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
              stroke={s.color} strokeWidth={STROKE}
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[11px] text-slate-400 font-medium">Monthly CTC</p>
          <p className="text-lg font-bold text-slate-800">{fmtShort(total)}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 w-full">
        {data.map(d => (
          <div key={d.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="text-slate-600">{d.label}</span>
            </div>
            <span className="font-semibold text-slate-700 tabular-nums">{fmt(d.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Payslip detail modal
function PayslipModal({ payslipId, onClose }: { payslipId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<(Payslip & { earnings_lines: {label:string;amount:number}[]; deduction_lines: {label:string;amount:number}[] }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/v1/salary/payslips/${payslipId}`)
      .then(r => r.json())
      .then(d => { setDetail(d.payslip); setLoading(false) })
  }, [payslipId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">Payslip Detail</h3>
            {detail && <p className="text-xs text-slate-400 mt-0.5">{monthLabel(detail.payroll_month)} • {detail.paid_days} days paid</p>}
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors">
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-slate-400 animate-spin" />
          </div>
        ) : detail ? (
          <div className="p-5 space-y-5">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Gross Earnings', value: detail.gross_earnings, color: 'text-slate-800' },
                { label: 'Deductions', value: detail.total_deductions, color: 'text-red-600' },
                { label: 'Net Pay', value: detail.net_salary, color: 'text-emerald-600' },
              ].map(c => (
                <div key={c.label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-slate-400 mb-1">{c.label}</p>
                  <p className={cn('text-lg font-bold tabular-nums', c.color)}>{fmt(Number(c.value))}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Earnings */}
              <div>
                <SectionLabel>Earnings</SectionLabel>
                <div className="bg-slate-50 rounded-xl p-3">
                  {detail.earnings_lines.map((l, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
                      <span className="text-slate-600">{l.label}</span>
                      <span className="font-semibold text-slate-800 tabular-nums">{fmt(Number(l.amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Deductions */}
              <div>
                <SectionLabel>Deductions</SectionLabel>
                <div className="bg-slate-50 rounded-xl p-3">
                  {detail.deduction_lines.map((l, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
                      <span className="text-slate-600">{l.label}</span>
                      <span className="font-semibold text-red-600 tabular-nums">− {fmt(Number(l.amount))}</span>
                    </div>
                  ))}
                </div>
                {detail.reimbursements_paid > 0 && (
                  <div className="mt-3 bg-sky-50 border border-sky-200 rounded-xl p-3 flex justify-between text-sm">
                    <span className="text-sky-700 font-medium">Reimbursements</span>
                    <span className="font-semibold text-sky-700 tabular-nums">+ {fmt(Number(detail.reimbursements_paid))}</span>
                  </div>
                )}
              </div>
            </div>

            {detail.loss_of_pay_days > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <Info className="h-3.5 w-3.5 flex-shrink-0" />
                {detail.loss_of_pay_days} day(s) of Loss-of-Pay deducted this month.
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">Failed to load payslip.</div>
        )}
      </div>
    </div>
  )
}

// New reimbursement claim modal
function NewClaimModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ category: 'internet', amount: '', claim_month: new Date().toISOString().slice(0,7), description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!form.amount || isNaN(Number(form.amount))) { setError('Enter a valid amount'); return }
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/v1/salary/reimbursements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      })
      if (!res.ok) { const j = await res.json(); setError(j.error?.toString() ?? 'Error'); return }
      onSuccess()
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">New Reimbursement Claim</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Category</label>
            <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
              {Object.entries(categoryLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Amount (₹)</label>
            <input type="number" placeholder="0" value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Claim Month</label>
            <input type="month" value={form.claim_month} onChange={e => setForm(p => ({...p, claim_month: e.target.value}))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Description</label>
            <textarea rows={2} placeholder="Brief description..." value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={submit} disabled={submitting} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? 'Submitting…' : 'Submit Claim'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = ['Structure', 'Payslips', 'Annual', 'Compliance', 'Reimbursements'] as const
type Tab = typeof TABS[number]

export default function SalaryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Structure')
  const [loading, setLoading] = useState(true)
  const [structure, setStructure]       = useState<SalaryStructure | null>(null)
  const [payslips, setPayslips]         = useState<Payslip[]>([])
  const [compliance, setCompliance]     = useState<{ records: ComplianceRecord[]; uan_number: string | null; esi_applicable: boolean; ytd_totals: Record<string, number> } | null>(null)
  const [reimbursements, setReimbursements] = useState<{ reimbursements: Reimbursement[]; category_totals: Record<string,number>; monthly_total: number; pending_count: number } | null>(null)
  const [revisions, setRevisions]       = useState<Revision[]>([])
  const [annual, setAnnual]             = useState<AnnualData | null>(null)
  const [viewPayslip, setViewPayslip]   = useState<string | null>(null)
  const [showNewClaim, setShowNewClaim] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, pRes, cRes, rRes, revRes, aRes] = await Promise.all([
        fetch('/api/v1/salary/structure'),
        fetch('/api/v1/salary/payslips'),
        fetch('/api/v1/salary/compliance'),
        fetch('/api/v1/salary/reimbursements'),
        fetch('/api/v1/salary/revisions'),
        fetch('/api/v1/salary/annual'),
      ])
      const [s, p, c, r, rev, a] = await Promise.all([
        sRes.json(), pRes.json(), cRes.json(), rRes.json(), revRes.json(), aRes.json()
      ])
      setStructure(s.structure ?? null)
      setPayslips(p.payslips ?? [])
      setCompliance(c ?? null)
      setReimbursements(r ?? null)
      setRevisions(rev.revisions ?? [])
      setAnnual(a ?? null)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="h-6 w-6 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading salary data…</p>
      </div>
    </div>
  )

  // ── No structure guard ──────────────────────────────────────────────────────
  if (!structure) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Banknote className="h-7 w-7 text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-700 mb-2">No Salary Structure</h2>
        <p className="text-sm text-slate-400">Your salary structure hasn't been set up yet. Please contact HR to configure your compensation details.</p>
      </div>
    </div>
  )

  // ── Derived values ──────────────────────────────────────────────────────────
  const latestPayslip = payslips[0] ?? null
  const ytdGross = annual?.ytd.gross_total ?? 0
  const ytdNet   = annual?.ytd.net_total   ?? 0
  const approvedReimb = reimbursements?.reimbursements.filter(r => r.status === 'approved' || r.status === 'paid').reduce((s, r) => s + Number(r.amount), 0) ?? 0
  const pendingReimb  = reimbursements?.reimbursements.filter(r => r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0) ?? 0

  return (
    <div className="space-y-6">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Salary & Compensation</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Effective from {new Date(structure.effective_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* ── Hero Stat Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Monthly CTC',
            value: fmt(structure.ctc_monthly),
            sub: 'Cost to Company',
            icon: <Banknote className="h-5 w-5" />,
            accent: 'bg-gradient-to-br from-indigo-500 to-violet-600',
            text: 'text-indigo-600',
            bg: 'bg-indigo-50 dark:bg-indigo-500/10',
            bar: 'bg-gradient-to-r from-indigo-500 to-violet-500',
          },
          {
            label: 'Annual CTC',
            value: fmtShort(structure.ctc_monthly * 12),
            sub: `${fmt(structure.ctc_monthly * 12)} per year`,
            icon: <TrendingUp className="h-5 w-5" />,
            accent: 'bg-gradient-to-br from-violet-500 to-purple-600',
            text: 'text-violet-600',
            bg: 'bg-violet-50 dark:bg-violet-500/10',
            bar: 'bg-gradient-to-r from-violet-500 to-purple-500',
          },
          {
            label: 'Monthly Take-home',
            value: fmt(structure.net_monthly),
            sub: 'After all deductions',
            icon: <Wallet className="h-5 w-5" />,
            accent: 'bg-gradient-to-br from-emerald-500 to-teal-600',
            text: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
          },
          {
            label: 'YTD Gross',
            value: fmtShort(ytdGross),
            sub: `${annual?.ytd.months_paid ?? 0} months paid`,
            icon: <Award className="h-5 w-5" />,
            accent: 'bg-gradient-to-br from-amber-500 to-orange-600',
            text: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
          },
        ].map(c => (
          <div key={c.label} className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className={cn('h-1', c.bar)} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-xs font-semibold text-slate-400">{c.label}</p>
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0', c.bg, c.text)}>
                  {c.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800 tabular-nums">{c.value}</p>
              <p className="text-[11px] text-slate-400 mt-1">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex gap-1 px-4 pt-4 border-b border-slate-100 dark:border-slate-800">
          {TABS.map(tab => (
            <button key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap',
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              )}
            >
              {tab}
              {tab === 'Reimbursements' && (reimbursements?.pending_count ?? 0) > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded-full font-bold">
                  {reimbursements!.pending_count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1 — SALARY STRUCTURE
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Structure' && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-5 gap-6">

                {/* Left — Breakdown Table */}
                <div className="lg:col-span-3 space-y-4">

                  {/* Earnings */}
                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        <span className="text-sm font-bold text-indigo-700">Earnings</span>
                      </div>
                      <span className="text-sm font-bold text-indigo-700 tabular-nums">{fmt(structure.earnings.total)}</span>
                    </div>
                    <div className="px-4">
                      <ComponentRow label="Basic"                  amount={structure.earnings.basic}              sub="40% of CTC — forms PF base" />
                      <ComponentRow label="House Rent Allowance"   amount={structure.earnings.hra}                sub="50% of basic — partially tax exempt" />
                      <ComponentRow label="Special Allowance"      amount={structure.earnings.special_allowance}  sub="Fully taxable" />
                      <ComponentRow label="Transport Allowance"    amount={structure.earnings.transport_allowance} sub="Partially exempt up to ₹1,600/mo" />
                      <ComponentRow label="Medical Allowance"      amount={structure.earnings.medical_allowance}  sub="Exempt with bills up to ₹15,000/yr" />
                      <ComponentRow label="LTA (monthly accrual)"  amount={structure.earnings.lta_monthly}        sub="Leave Travel — claimed twice in 4 years" />
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-bold text-emerald-700">Employer Benefits</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-700 tabular-nums">{fmt(structure.benefits.total)}</span>
                    </div>
                    <div className="px-4">
                      <ComponentRow label="PF — Employer Contribution"  amount={structure.benefits.pf_employer}       sub="12% of basic (EPF + EPS)" />
                      <ComponentRow label="Gratuity"                    amount={structure.benefits.gratuity_monthly}  sub="4.81% of basic (payable after 5 years)" />
                      <ComponentRow label="Group Health Insurance"       amount={structure.benefits.insurance_monthly} sub="Premium borne by company" />
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-sm font-bold text-amber-700">Monthly Deductions</span>
                      </div>
                      <span className="text-sm font-bold text-amber-700 tabular-nums">− {fmt(structure.deductions.total)}</span>
                    </div>
                    <div className="px-4">
                      <ComponentRow label="PF — Employee Contribution"  amount={structure.deductions.pf_employee}    sub="12% of basic (statutory)" />
                      {structure.deductions.esi_employee > 0
                        ? <ComponentRow label="ESI — Employee" amount={structure.deductions.esi_employee} sub="0.75% of gross (applicable ≤ ₹21,000)" />
                        : <div className="flex items-center gap-2 py-2.5 text-sm text-slate-400 border-b border-slate-100 last:border-0">
                            <Info className="h-3.5 w-3.5" />
                            ESI not applicable (gross &gt; ₹21,000)
                          </div>
                      }
                      <ComponentRow label="Professional Tax"          amount={structure.deductions.professional_tax} sub="State levy — ₹200/month" />
                    </div>
                  </div>

                  {/* Net take-home summary row */}
                  <div className="flex items-center justify-between bg-slate-800 text-white rounded-xl px-5 py-3.5">
                    <div>
                      <p className="text-xs font-semibold text-slate-300">Monthly Take-home</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Gross − Employee Deductions</p>
                    </div>
                    <p className="text-2xl font-bold tabular-nums text-emerald-400">{fmt(structure.net_monthly)}</p>
                  </div>
                </div>

                {/* Right — Donut + Revision history */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <SectionLabel>CTC Composition</SectionLabel>
                    <DonutChart data={structure.breakdown} total={structure.ctc_monthly} />
                  </div>

                  {/* Revision history card */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                    <SectionLabel>Revision History</SectionLabel>
                    <div className="space-y-3">
                      {revisions.map((rev, i) => (
                        <div key={rev.id} className="flex items-start gap-3">
                          <div className="flex flex-col items-center mt-1">
                            <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold border', revisionTypeColor[rev.revision_type])}>
                              {i + 1}
                            </div>
                            {i < revisions.length - 1 && <div className="w-px h-4 bg-slate-200 my-0.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', revisionTypeColor[rev.revision_type])}>
                                {revisionTypeLabel[rev.revision_type]}
                              </span>
                              {rev.percentage_change && (
                                <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                                  <ArrowUpRight className="h-3 w-3" />{rev.percentage_change}%
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-700 mt-1">{fmt(rev.new_ctc_monthly)}<span className="font-normal text-slate-400">/mo</span></p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(rev.revision_date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                              {rev.approved_by ? ` · ${rev.approved_by.full_name}` : ''}
                            </p>
                            {rev.notes && <p className="text-[10px] text-slate-500 mt-0.5 italic">{rev.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2 — PAYSLIPS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Payslips' && (
            <div className="space-y-4">
              {payslips.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <FileText className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No payslips generated yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs text-slate-400 font-semibold uppercase tracking-wide">
                        <th className="text-left px-4 py-3">Month</th>
                        <th className="text-right px-4 py-3">Days</th>
                        <th className="text-right px-4 py-3">Gross</th>
                        <th className="text-right px-4 py-3">Deductions</th>
                        <th className="text-right px-4 py-3">Net Pay</th>
                        <th className="text-right px-4 py-3">Reimb.</th>
                        <th className="text-center px-4 py-3">Status</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {payslips.map(p => (
                        <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-700">{monthLabel(p.payroll_month)}</td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            {p.paid_days}/{p.working_days}
                            {p.loss_of_pay_days > 0 && <span className="text-amber-500 ml-1">(−{p.loss_of_pay_days})</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800 tabular-nums">{fmt(Number(p.gross_earnings))}</td>
                          <td className="px-4 py-3 text-right text-red-500 tabular-nums">− {fmt(Number(p.total_deductions))}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600 tabular-nums">{fmt(Number(p.net_salary))}</td>
                          <td className="px-4 py-3 text-right text-sky-600 tabular-nums">
                            {p.reimbursements_paid > 0 ? `+ ${fmt(Number(p.reimbursements_paid))}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-center"><StatusBadge status={p.status} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => setViewPayslip(p.id)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View">
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Download PDF">
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3 — ANNUAL EARNINGS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Annual' && annual && (
            <div className="space-y-5">

              {/* YTD summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'YTD Gross', value: annual.ytd.gross_total, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'YTD Net', value: annual.ytd.net_total, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Total Deductions', value: annual.ytd.deductions_total, color: 'text-red-600', bg: 'bg-red-50' },
                  { label: 'Total Bonus', value: annual.ytd.bonus_total, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map(c => (
                  <div key={c.label} className={cn('rounded-xl p-4 border border-slate-100', c.bg)}>
                    <p className="text-xs font-semibold text-slate-400 mb-1">{c.label}</p>
                    <p className={cn('text-xl font-bold tabular-nums', c.color)}>{fmtShort(c.value)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{fmt(c.value)}</p>
                  </div>
                ))}
              </div>

              {/* Monthly bar chart */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <SectionLabel>Monthly Earnings — FY {annual.fiscal_year}–{Number(annual.fiscal_year)+1}</SectionLabel>
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={annual.monthly_chart.map(m => ({ ...m, name: monthLabel(m.month) }))} barGap={3} barCategoryGap="35%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={v => fmtShort(v)} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={52} />
                      <Tooltip content={<BarTooltip />} cursor={{ fill: '#f1f5f9' }} />
                      <Bar dataKey="gross" name="Gross" fill="#6366f1" radius={[4,4,0,0]} />
                      <Bar dataKey="net"   name="Net"   fill="#10b981" radius={[4,4,0,0]} />
                      {annual.monthly_chart.some(m => m.bonus > 0) &&
                        <Bar dataKey="bonus" name="Bonus" fill="#f59e0b" radius={[4,4,0,0]} />
                      }
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 mt-3">
                  {[['#6366f1','Gross'],['#10b981','Net'],['#f59e0b','Bonus']].map(([c,l]) => (
                    <div key={l} className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="h-2 w-5 rounded-sm" style={{ background: c }} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              {/* Month detail table */}
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide font-semibold">
                      <th className="text-left px-4 py-3">Month</th>
                      <th className="text-right px-4 py-3">Gross</th>
                      <th className="text-right px-4 py-3">Net</th>
                      <th className="text-right px-4 py-3">Bonus</th>
                      <th className="text-center px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annual.monthly_chart.filter(m => m.gross > 0).map(m => (
                      <tr key={m.month} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-700">{monthLabel(m.month)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-800">{fmt(m.gross)}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-600">{fmt(m.net)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-amber-600">{m.bonus > 0 ? `+ ${fmt(m.bonus)}` : '—'}</td>
                        <td className="px-4 py-3 text-center">{m.status ? <StatusBadge status={m.status} /> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-800 text-white text-sm font-bold">
                      <td className="px-4 py-3">Total YTD</td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmt(annual.ytd.gross_total)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-400">{fmt(annual.ytd.net_total)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-400">{annual.ytd.bonus_total > 0 ? fmt(annual.ytd.bonus_total) : '—'}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 4 — COMPLIANCE
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Compliance' && compliance && (
            <div className="space-y-5">

              {/* Compliance summary cards */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* PF Card */}
                <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <Shield className="h-4.5 w-4.5 text-indigo-600 h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-700">Provident Fund</p>
                      <p className="text-[11px] text-indigo-400">{compliance.uan_number ?? 'UAN not set'}</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-indigo-600">Employee (12% Basic)</span>
                      <span className="font-bold text-indigo-800 tabular-nums">{fmt(structure.deductions.pf_employee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-indigo-600">Employer (12% Basic)</span>
                      <span className="font-bold text-indigo-800 tabular-nums">{fmt(structure.benefits.pf_employer)}</span>
                    </div>
                    <div className="h-px bg-indigo-200 my-1" />
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-indigo-700">Monthly Total</span>
                      <span className="font-bold text-indigo-800 tabular-nums">{fmt(structure.deductions.pf_employee + structure.benefits.pf_employer)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-indigo-500 mt-1">
                      <span>YTD (Employee)</span>
                      <span className="font-semibold">{fmt(compliance.ytd_totals.pf_employee)}</span>
                    </div>
                  </div>
                </div>

                {/* ESI Card */}
                <div className={cn('rounded-xl border p-5', compliance.esi_applicable ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100')}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', compliance.esi_applicable ? 'bg-emerald-100' : 'bg-slate-100')}>
                      <Shield className={cn('h-5 w-5', compliance.esi_applicable ? 'text-emerald-600' : 'text-slate-400')} />
                    </div>
                    <div>
                      <p className={cn('text-sm font-bold', compliance.esi_applicable ? 'text-emerald-700' : 'text-slate-500')}>ESI</p>
                      <p className={cn('text-[11px]', compliance.esi_applicable ? 'text-emerald-400' : 'text-slate-400')}>Employees State Insurance</p>
                    </div>
                  </div>
                  {compliance.esi_applicable ? (
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-600">Employee (0.75%)</span>
                        <span className="font-bold text-emerald-800 tabular-nums">{fmt(compliance.ytd_totals.esi_employee / (compliance.records.length || 1))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-600">Employer (3.25%)</span>
                        <span className="font-bold text-emerald-800 tabular-nums">{fmt(compliance.ytd_totals.esi_employer / (compliance.records.length || 1))}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-xs text-slate-500 bg-white rounded-lg p-3 border border-slate-100">
                      <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                      <span>ESI not applicable — gross salary exceeds ₹21,000/month threshold.</span>
                    </div>
                  )}
                </div>

                {/* Professional Tax Card */}
                <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-700">Professional Tax</p>
                      <p className="text-[11px] text-amber-400">State levy (Maharashtra)</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-600">Monthly</span>
                      <span className="font-bold text-amber-800 tabular-nums">{fmt(structure.deductions.professional_tax)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-amber-500">
                      <span>YTD Total</span>
                      <span className="font-semibold">{fmt(compliance.ytd_totals.professional_tax)}</span>
                    </div>
                    <div className="text-[10px] text-amber-500 bg-white rounded-lg p-2 border border-amber-100">
                      ₹200/month for salary &gt; ₹10,000 (Maharashtra slab)
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly compliance table */}
              <div>
                <SectionLabel>Monthly Compliance Records</SectionLabel>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide font-semibold">
                        <th className="text-left px-4 py-3">Month</th>
                        <th className="text-right px-4 py-3">PF (Employee)</th>
                        <th className="text-right px-4 py-3">PF (Employer)</th>
                        <th className="text-right px-4 py-3">ESI (Emp)</th>
                        <th className="text-right px-4 py-3">Prof. Tax</th>
                        <th className="text-right px-4 py-3">Total Outflow</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compliance.records.map(r => {
                        const total = r.pf_employee + r.pf_employer + r.esi_employee + r.esi_employer + r.professional_tax
                        return (
                          <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-700">{monthLabel(r.record_month)}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{fmt(Number(r.pf_employee))}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-indigo-600">{fmt(Number(r.pf_employer))}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-slate-400">{r.esi_applicable ? fmt(Number(r.esi_employee)) : '—'}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{fmt(Number(r.professional_tax))}</td>
                            <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-800">{fmt(total)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-800 text-white text-sm font-bold">
                        <td className="px-4 py-3">YTD Total</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmt(compliance.ytd_totals.pf_employee)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmt(compliance.ytd_totals.pf_employer)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmt(compliance.ytd_totals.esi_employee)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmt(compliance.ytd_totals.professional_tax)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {fmt(Object.values(compliance.ytd_totals).reduce((s, v) => s + v, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 5 — REIMBURSEMENTS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Reimbursements' && reimbursements && (
            <div className="space-y-5">

              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Approved / Paid', value: fmt(approvedReimb), sub: 'All time', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                  { label: 'Pending', value: fmt(pendingReimb), sub: `${reimbursements.pending_count} claims`, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                  { label: 'Internet', value: fmt(reimbursements.category_totals.internet ?? 0), sub: 'Total approved', color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
                  { label: 'Travel + Fuel', value: fmt((reimbursements.category_totals.travel ?? 0) + (reimbursements.category_totals.fuel ?? 0)), sub: 'Total approved', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
                ].map(c => (
                  <div key={c.label} className={cn('rounded-xl border p-4', c.bg)}>
                    <p className="text-xs font-semibold text-slate-400">{c.label}</p>
                    <p className={cn('text-xl font-bold mt-1 tabular-nums', c.color)}>{c.value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{c.sub}</p>
                  </div>
                ))}
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between">
                <SectionLabel>Claim History</SectionLabel>
                <button
                  onClick={() => setShowNewClaim(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                >
                  <Plus className="h-3.5 w-3.5" /> New Claim
                </button>
              </div>

              {/* Claims table */}
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wide font-semibold">
                      <th className="text-left px-4 py-3">Category</th>
                      <th className="text-left px-4 py-3">Month</th>
                      <th className="text-left px-4 py-3">Description</th>
                      <th className="text-right px-4 py-3">Amount</th>
                      <th className="text-center px-4 py-3">Status</th>
                      <th className="text-right px-4 py-3">Approved / Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reimbursements.reimbursements.map(r => (
                      <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', categoryColor[r.category] ?? 'bg-slate-100 text-slate-600')}>
                            {categoryLabel[r.category] ?? r.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{monthLabel(r.claim_month)}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{r.description ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800 tabular-nums">{fmt(Number(r.amount))}</td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-3 text-right text-xs text-slate-400">
                          {r.paid_at
                            ? new Date(r.paid_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })
                            : r.approved_at
                            ? new Date(r.approved_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3 border border-slate-100">
                <strong>Note:</strong> Reimbursements are paid separately from your salary and are <em>not</em> part of your CTC. They're processed after HR approval and do not attract PF or income tax.
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {viewPayslip && <PayslipModal payslipId={viewPayslip} onClose={() => setViewPayslip(null)} />}
      {showNewClaim && (
        <NewClaimModal onClose={() => setShowNewClaim(false)} onSuccess={() => { setShowNewClaim(false); fetchAll() }} />
      )}
    </div>
  )
}
