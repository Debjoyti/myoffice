// @ts-nocheck
'use client'

import {
  useLiveData, InsightHeader, KpiTile, Panel, Donut, exportToCsv, Empty, ACCENT_HEX,
} from '@/components/insights'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  IndianRupee, TrendingUp, TrendingDown, FileText, AlertCircle, Wallet, Receipt,
} from 'lucide-react'

const INV_COLOR = { paid: 'bg-emerald-100 text-emerald-700', sent: 'bg-blue-100 text-blue-700', partial: 'bg-amber-100 text-amber-700', overdue: 'bg-rose-100 text-rose-700', draft: 'bg-slate-100 text-slate-600', cancelled: 'bg-slate-100 text-slate-500' }

export default function FinanceInsights() {
  const { data, loading, updatedAt, refresh } = useLiveData('/api/v1/insights/finance', 15000)
  const k = data?.kpis ?? {}
  const pl = data?.pl_trend ?? []
  const maxPl = Math.max(1, ...pl.flatMap(p => [p.revenue, p.expense]))

  return (
    <div className="space-y-5 animate-fadeIn">
      <InsightHeader title="Finance" accent="rose" updatedAt={updatedAt} onRefresh={refresh}
        subtitle="Revenue, collections, expenses and receivables"
        onExport={() => exportToCsv('finance-invoices', data?.recent_invoices ?? [])} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Collected (8mo)" value={formatCurrency(k.revenue_collected ?? 0)} icon={<IndianRupee className="h-4 w-4" />} accent="emerald" loading={loading} />
        <KpiTile label="Expenses (8mo)" value={formatCurrency(k.expenses ?? 0)} icon={<TrendingDown className="h-4 w-4" />} accent="rose" loading={loading} />
        <KpiTile label="Net" value={formatCurrency(k.net ?? 0)} icon={<TrendingUp className="h-4 w-4" />} accent={k.net >= 0 ? 'emerald' : 'rose'} loading={loading} delta={{ value: k.net >= 0 ? 'surplus' : 'deficit', positive: k.net >= 0 }} />
        <KpiTile label="Outstanding" value={formatCurrency(k.outstanding ?? 0)} icon={<AlertCircle className="h-4 w-4" />} accent="amber" loading={loading} sub={`${formatCurrency(k.overdue ?? 0)} overdue`} />
      </div>

      <Panel title="Revenue vs Expense — last 8 months"
        action={<span className="text-xs"><span className="text-emerald-600">● revenue</span> &nbsp; <span className="text-rose-500">● expense</span></span>}>
        {pl.length === 0 ? <Empty /> : (
          <div className="flex items-end gap-3 h-48 pt-4">
            {pl.map((p, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group">
                <div className="w-full flex items-end justify-center gap-1 flex-1">
                  <div className="w-1/2 rounded-t transition-all group-hover:opacity-80" title={`Revenue ${formatCurrency(p.revenue)}`}
                    style={{ height: `${(p.revenue / maxPl) * 150}px`, minHeight: 2, background: ACCENT_HEX.emerald }} />
                  <div className="w-1/2 rounded-t transition-all group-hover:opacity-80" title={`Expense ${formatCurrency(p.expense)}`}
                    style={{ height: `${(p.expense / maxPl) * 150}px`, minHeight: 2, background: ACCENT_HEX.rose }} />
                </div>
                <span className="text-[10px] text-slate-400">{p.label}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Invoices by status">
          <Donut data={(data?.invoice_status ?? []).map(s => ({ label: s.label, value: s.value }))} centerValue={k.invoices ?? 0} centerLabel="invoices" />
        </Panel>
        <Panel className="lg:col-span-2" title="Receivables snapshot">
          <div className="grid grid-cols-2 gap-3 py-1">
            <Metric icon={<FileText className="h-4 w-4 text-blue-500" />} label="Total invoiced" value={formatCurrency(k.total_invoiced ?? 0)} />
            <Metric icon={<Receipt className="h-4 w-4 text-emerald-500" />} label="Paid invoices" value={`${k.paid_invoices ?? 0} / ${k.invoices ?? 0}`} />
            <Metric icon={<AlertCircle className="h-4 w-4 text-amber-500" />} label="Outstanding" value={formatCurrency(k.outstanding ?? 0)} />
            <Metric icon={<Wallet className="h-4 w-4 text-violet-500" />} label="Pending expense claims" value={k.pending_expense_claims ?? 0} />
          </div>
        </Panel>
      </div>

      <Panel title="Recent invoices">
        {(data?.recent_invoices ?? []).length === 0 ? <Empty /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="py-2">Invoice</th><th className="text-right">Amount</th><th>Due date</th><th>Status</th>
              </tr></thead>
              <tbody>
                {data.recent_invoices.map((iv, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2 font-mono text-xs text-slate-700">{iv.invoice}</td>
                    <td className="text-right font-semibold">{formatCurrency(iv.amount)}</td>
                    <td className="text-slate-500 text-xs">{iv.due_date ? formatDate(iv.due_date) : '—'}</td>
                    <td><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${INV_COLOR[iv.status] ?? 'bg-slate-100 text-slate-600'}`}>{iv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

function Metric({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
      <span className="p-1.5 rounded-lg bg-white">{icon}</span>
      <div><p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p><p className="text-sm font-bold text-slate-800">{value}</p></div>
    </div>
  )
}
