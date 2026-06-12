// @ts-nocheck
'use client'

import { useState } from 'react'
import {
  useLiveData, InsightHeader, KpiTile, Panel, Bars, Donut, RankList, AreaSpark, exportToCsv, Empty,
} from '@/components/insights'
import { formatCurrency } from '@/lib/utils'
import {
  Boxes, IndianRupee, AlertTriangle, PackageX, Warehouse, ArrowDownToLine,
  ArrowUpFromLine, FileText, Truck,
} from 'lucide-react'

const RANGES = [{ id: '7d', label: '7D' }, { id: '30d', label: '30D' }, { id: '90d', label: '90D' }]

export default function InventoryInsights() {
  const [range, setRange] = useState('30d')
  const { data, loading, updatedAt, refresh } = useLiveData(`/api/v1/insights/inventory?range=${range}`, 12000)
  const k = data?.kpis ?? {}
  const movement = data?.movement ?? []

  return (
    <div className="space-y-5 animate-fadeIn">
      <InsightHeader title="Inventory & Warehouse" accent="blue" updatedAt={updatedAt} onRefresh={refresh}
        subtitle="Stock health, goods received vs issued, and warehouse value"
        range={range} onRange={setRange} ranges={RANGES}
        onExport={() => exportToCsv('inventory-movement', movement)} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Stock Value" value={formatCurrency(k.stock_value ?? 0)} icon={<IndianRupee className="h-4 w-4" />} accent="blue" loading={loading} sub={`${k.total_skus ?? 0} SKUs`} />
        <KpiTile label="Goods In (qty)" value={(k.inflow_qty ?? 0).toLocaleString()} icon={<ArrowDownToLine className="h-4 w-4" />} accent="emerald" loading={loading} sub={formatCurrency(k.inflow_value ?? 0)} />
        <KpiTile label="Goods Out (qty)" value={(k.outflow_qty ?? 0).toLocaleString()} icon={<ArrowUpFromLine className="h-4 w-4" />} accent="violet" loading={loading} sub={formatCurrency(k.outflow_value ?? 0)} />
        <KpiTile label="Low / Out of Stock" value={`${k.low_stock ?? 0} / ${k.out_of_stock ?? 0}`} icon={<AlertTriangle className="h-4 w-4" />} accent="rose" loading={loading} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Warehouses" value={k.warehouses ?? 0} icon={<Warehouse className="h-4 w-4" />} accent="cyan" loading={loading} />
        <KpiTile label="Open POs" value={k.open_pos ?? 0} icon={<FileText className="h-4 w-4" />} accent="amber" loading={loading} sub={formatCurrency(k.po_value ?? 0)} />
        <KpiTile label="Pending PRs" value={k.pending_prs ?? 0} icon={<FileText className="h-4 w-4" />} accent="indigo" loading={loading} />
        <KpiTile label="GRNs Received" value={k.grns_received ?? 0} icon={<Truck className="h-4 w-4" />} accent="emerald" loading={loading} />
      </div>

      <Panel title="Goods movement — inbound vs outbound" action={<span className="text-xs"><span className="text-emerald-600">● in</span> &nbsp; <span className="text-violet-600">● out</span></span>}>
        {movement.length === 0 ? <Empty /> : (
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Inbound</p>
              <AreaSpark data={movement.map(m => m.inbound)} accent="emerald" width={1100} height={70} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Outbound</p>
              <AreaSpark data={movement.map(m => m.outbound)} accent="violet" width={1100} height={70} />
            </div>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Stock value by category">
          <Donut data={(data?.category_value ?? []).map(c => ({ label: c.label, value: c.value }))} centerValue={(data?.category_value ?? []).length} centerLabel="categories" />
        </Panel>
        <Panel title="Value by warehouse">
          <Bars data={data?.warehouse_value ?? []} accent="blue" valueFmt={(n) => formatCurrency(n)} />
        </Panel>
        <Panel title="Top items by value">
          <RankList items={data?.top_items ?? []} accent="cyan" />
        </Panel>
      </div>
    </div>
  )
}
