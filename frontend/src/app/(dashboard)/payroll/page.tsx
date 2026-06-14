'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, Modal, DetailGrid, Alert, Input, EmptyState
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Banknote, Users, CheckCircle2, Lock, Play, RefreshCw, IndianRupee } from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────────────────────── */
type PayrollRun = {
  id: string
  payroll_month: string
  status: 'processing' | 'completed' | 'locked' | 'failed'
  total_employees: number
  total_gross: number
  total_net: number
  total_deductions: number
  total_reimbursements: number
  processed_at: string | null
  locked_at: string | null
  notes: string | null
  processor: { full_name: string; designation: string } | null
}

type Payslip = {
  id: string
  payroll_month: string
  paid_days: number
  working_days: number
  loss_of_pay_days: number
  gross_earnings: number
  total_deductions: number
  net_salary: number
  reimbursements_paid: number
  status: 'draft' | 'finalized' | 'paid'
  generated_at: string | null
  paid_at: string | null
  employee: { id: string; full_name: string; employee_code: string; designation: string; department: string }
}

type PayrollDetail = { payroll: PayrollRun; payslips: Payslip[] }

/* ── Status helpers ─────────────────────────────────────────────────────────── */
const PAYROLL_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' | 'neutral' }> = {
  completed: { label: 'Completed', variant: 'success' },
  locked:    { label: 'Locked',    variant: 'info' },
  processing:{ label: 'Processing',variant: 'warning' },
  failed:    { label: 'Failed',    variant: 'danger' },
}
const PAYSLIP_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' | 'info' }> = {
  paid:      { label: 'Paid',      variant: 'success' },
  finalized: { label: 'Finalized', variant: 'info' },
  draft:     { label: 'Draft',     variant: 'neutral' },
}

/* ── Run Payroll Modal ──────────────────────────────────────────────────────── */
function RunPayrollModal({ open, onClose, onSuccess }: {
  open: boolean; onClose: () => void; onSuccess: () => void
}) {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [month, setMonth] = useState(defaultMonth)
  const [notes, setNotes] = useState('')
  const [running, setRunning] = useState(false)
  const [result,  setResult]  = useState<any>(null)
  const [err,     setErr]     = useState<string | null>(null)

  useEffect(() => { if (!open) { setResult(null); setErr(null); setMonth(defaultMonth); setNotes('') } }, [open])

  const handleRun = async () => {
    setRunning(true); setErr(null)
    try {
      const res = await fetch('/api/v1/payroll/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payroll_month: month, notes }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Payroll run failed')
      setResult(d)
      onSuccess()
    } catch (err: any) { setErr(err.message) }
    finally { setRunning(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Run Payroll" size="md"
      footer={!result ? <>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={running}>Cancel</Button>
        <Button size="sm" loading={running}
          leftIcon={<Play className="h-3.5 w-3.5" />}
          onClick={handleRun}>
          Run Payroll
        </Button>
      </> : <Button size="sm" onClick={onClose}>Done</Button>}
    >
      {result ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800">Payroll completed successfully!</p>
              <p className="text-sm text-emerald-700 mt-0.5">{result.message}</p>
            </div>
          </div>
          <DetailGrid cols={2} items={[
            { label: 'Employees Processed', value: result.total_employees },
            { label: 'Total Gross',         value: formatCurrency(result.total_gross ?? 0) },
            { label: 'Total Net Salary',    value: formatCurrency(result.total_net ?? 0) },
            { label: 'Total Deductions',    value: formatCurrency(result.total_deductions ?? 0) },
          ]} />
        </div>
      ) : (
        <div className="space-y-4">
          {err && <Alert variant="danger">{err}</Alert>}
          <Alert variant="warning" title="Before you proceed">
            Running payroll will calculate salary for all active employees using their attendance
            data. Employees without a salary structure will be skipped.
          </Alert>
          <Input label="Payroll Month" type="month" value={month}
            onChange={e => setMonth(e.target.value)} />
          <div>
            <label className="text-xs font-medium text-slate-700">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="mt-1.5 w-full h-16 rounded-md border border-slate-200 bg-white text-sm px-3 py-2 resize-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g. Regular monthly payroll…"
            />
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ── Payroll Detail Modal ───────────────────────────────────────────────────── */
function PayrollDetailModal({ payrollId, onClose, onAction }: {
  payrollId: string | null; onClose: () => void; onAction: () => void
}) {
  const [detail,   setDetail]   = useState<PayrollDetail | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [actioning,setActioning]= useState(false)
  const [err,      setErr]      = useState<string | null>(null)

  useEffect(() => {
    if (!payrollId) { setDetail(null); return }
    setLoading(true); setErr(null)
    fetch(`/api/v1/payroll/${payrollId}`)
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(() => setErr('Failed to load payroll details'))
      .finally(() => setLoading(false))
  }, [payrollId])

  const handleAction = async (action: 'lock' | 'mark_paid') => {
    setActioning(true); setErr(null)
    try {
      const res = await fetch(`/api/v1/payroll/${payrollId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error ?? 'Action failed')
      onAction()
      onClose()
    } catch (err: any) { setErr(err.message) }
    finally { setActioning(false) }
  }

  if (!payrollId) return null

  const p = detail?.payroll
  return (
    <Modal open={!!payrollId} onClose={onClose} title={`Payroll — ${p?.payroll_month ?? '…'}`} size="xl"
      footer={
        p && <>
          {p.status === 'completed' && !p.locked_at && (
            <Button variant="outline" size="sm" loading={actioning}
              leftIcon={<Lock className="h-3.5 w-3.5" />}
              onClick={() => handleAction('lock')}>Lock & Finalise</Button>
          )}
          {p.status === 'locked' && (
            <Button size="sm" loading={actioning}
              leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
              onClick={() => handleAction('mark_paid')}>Mark All Paid</Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </>
      }
    >
      {loading && <div className="py-8 text-center text-sm text-slate-400">Loading…</div>}
      {err && <Alert variant="danger">{err}</Alert>}
      {p && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Employees',       value: p.total_employees },
              { label: 'Gross Salary',    value: formatCurrency(p.total_gross) },
              { label: 'Net Salary',      value: formatCurrency(p.total_net) },
              { label: 'Total Deductions',value: formatCurrency(p.total_deductions) },
            ].map(s => (
              <div key={s.label} className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                <p className="font-bold text-slate-900">{s.value}</p>
              </div>
            ))}
          </div>

          <Table>
            <Thead><tr>
              <Th>Employee</Th>
              <Th>Days</Th>
              <Th align="right">Gross</Th>
              <Th align="right">Deductions</Th>
              <Th align="right">Net Salary</Th>
              <Th>Status</Th>
            </tr></Thead>
            <Tbody>
              {(detail?.payslips ?? []).map(ps => (
                <Tr key={ps.id}>
                  <Td>
                    <div>
                      <p className="font-medium text-sm text-slate-900">{ps.employee?.full_name}</p>
                      <p className="text-xs text-slate-400">{ps.employee?.designation}</p>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-sm">{ps.paid_days}/{ps.working_days}</span>
                    {ps.loss_of_pay_days > 0 && (
                      <span className="ml-1 text-xs text-red-500">(-{ps.loss_of_pay_days} LOP)</span>
                    )}
                  </Td>
                  <Td align="right"><span className="font-mono text-sm">{formatCurrency(ps.gross_earnings)}</span></Td>
                  <Td align="right"><span className="font-mono text-sm text-red-600">-{formatCurrency(ps.total_deductions)}</span></Td>
                  <Td align="right"><span className="font-mono text-sm font-semibold text-emerald-700">{formatCurrency(ps.net_salary)}</span></Td>
                  <Td>
                    <Badge variant={(PAYSLIP_STATUS[ps.status] ?? PAYSLIP_STATUS.draft).variant} size="sm">
                      {(PAYSLIP_STATUS[ps.status] ?? PAYSLIP_STATUS.draft).label}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      )}
    </Modal>
  )
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function PayrollPage() {
  const [payrolls,   setPayrolls]   = useState<PayrollRun[]>([])
  const [loading,    setLoading]    = useState(true)
  const [runOpen,    setRunOpen]    = useState(false)
  const [detailId,   setDetailId]   = useState<string | null>(null)
  const [isHR,       setIsHR]       = useState(false)

  const fetchPayrolls = useCallback(async () => {
    setLoading(true)
    try {
      const [payRes, meRes] = await Promise.all([
        fetch('/api/v1/payroll'),
        fetch('/api/v1/me'),
      ])
      if (payRes.ok) { const d = await payRes.json(); setPayrolls(d.payrolls ?? []) }
      if (meRes.ok)  { const d = await meRes.json(); setIsHR(['admin', 'hr'].includes(d.employee?.role)) }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPayrolls() }, [fetchPayrolls])

  const latest = payrolls[0]
  const lockedCount = payrolls.filter(p => p.status === 'locked').length

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Payroll"
        description="Run monthly payroll, review payslips, and manage salary disbursement"
        actions={
          isHR && (
            <Button leftIcon={<Play className="h-3.5 w-3.5" />} onClick={() => setRunOpen(true)}>
              Run Payroll
            </Button>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Payroll Runs"    value={payrolls.length}          accent="blue"    icon={<Banknote className="h-4 w-4" />}  loading={loading} />
        <StatCard label="Last Month Gross" value={latest ? formatCurrency(latest.total_gross) : '—'} accent="emerald" icon={<IndianRupee className="h-4 w-4" />} loading={loading} />
        <StatCard label="Last Month Net"  value={latest ? formatCurrency(latest.total_net)   : '—'} accent="teal"    icon={<CheckCircle2 className="h-4 w-4" />} loading={loading} />
        <StatCard label="Locked Months"   value={lockedCount}             accent="sky"     icon={<Lock className="h-4 w-4" />}       loading={loading} />
      </div>

      {/* Payroll History */}
      <Card padding="none">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Payroll History</h3>
            <p className="text-xs text-slate-500 mt-0.5">All payroll runs in this organisation</p>
          </div>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3 w-3" />} onClick={fetchPayrolls}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading payroll history…</div>
        ) : payrolls.length === 0 ? (
          <EmptyState
            icon={<Banknote className="h-8 w-8" />}
            title="No payroll runs yet"
            description="Run your first payroll to get started"
            action={
              isHR ? (
                <Button size="sm" leftIcon={<Play className="h-3.5 w-3.5" />} onClick={() => setRunOpen(true)}>
                  Run Payroll
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Month</Th>
                <Th>Employees</Th>
                <Th align="right">Gross Salary</Th>
                <Th align="right">Total Deductions</Th>
                <Th align="right">Net Salary</Th>
                <Th>Processed By</Th>
                <Th>Status</Th>
                <Th align="center">Action</Th>
              </tr>
            </Thead>
            <Tbody>
              {payrolls.map(p => {
                const st = PAYROLL_STATUS[p.status] ?? { label: p.status, variant: 'neutral' as const }
                return (
                  <Tr key={p.id} onClick={() => setDetailId(p.id)}>
                    <Td>
                      <span className="font-semibold text-slate-900">{p.payroll_month}</span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{p.total_employees}</span>
                      </div>
                    </Td>
                    <Td align="right"><span className="font-mono">{formatCurrency(p.total_gross)}</span></Td>
                    <Td align="right"><span className="font-mono text-red-600">-{formatCurrency(p.total_deductions)}</span></Td>
                    <Td align="right"><span className="font-mono font-semibold text-emerald-700">{formatCurrency(p.total_net)}</span></Td>
                    <Td>
                      <span className="text-sm text-slate-500">{p.processor?.full_name ?? '—'}</span>
                    </Td>
                    <Td>
                      <Badge variant={st.variant} dot size="sm">{st.label}</Badge>
                    </Td>
                    <Td align="center">
                      <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setDetailId(p.id) }}>
                        View
                      </Button>
                    </Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        )}
      </Card>

      {/* Modals */}
      <RunPayrollModal open={runOpen} onClose={() => setRunOpen(false)} onSuccess={fetchPayrolls} />
      <PayrollDetailModal payrollId={detailId} onClose={() => setDetailId(null)} onAction={fetchPayrolls} />
    </div>
  )
}
