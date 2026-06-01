// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  Ship, Plus, Download, Eye, Edit2, AlertTriangle, CheckCircle2, Clock,
  FileText, RefreshCw, TrendingUp, Anchor, Globe, FlaskConical
} from 'lucide-react'

const STATUS_STEPS = ['ordered','shipped','at_port','at_customs','customs_cleared','in_transit','delivered']

const STATUS_LABEL: Record<string,string> = {
  ordered: 'Ordered', shipped: 'Shipped', at_port: 'At Port',
  at_customs: 'At Customs', customs_cleared: 'Customs Cleared',
  in_transit: 'In Transit (Dom.)', delivered: 'Delivered', cancelled: 'Cancelled',
}
const STATUS_VARIANT: Record<string,any> = {
  ordered: 'neutral', shipped: 'info', at_port: 'info',
  at_customs: 'warning', customs_cleared: 'success', in_transit: 'warning',
  delivered: 'success', cancelled: 'danger',
}

const MOCK_IMPORTS = [
  {
    id: '1', shipment_no: 'IMP-2026-0004', po_no: 'PO-2026-0030',
    supplier_name: 'Shenzhen Tech Electronics Co. Ltd', supplier_country: 'China',
    incoterms: 'FOB', currency: 'USD', invoice_no_foreign: 'STE-2026-INV-0041',
    invoice_value_foreign: 18500, exchange_rate: 84.25, invoice_value_inr: 1558625,
    vessel_name: 'COSCO Shanghai', bl_no: 'COSU6789012345', container_no: 'TCKU1234567',
    container_size: '20GP', transport_mode: 'sea', port_of_loading: 'CNSHK',
    port_of_discharge: 'INNSA', etd: '2026-05-10', eta: '2026-06-05', ata: null,
    be_no: null, be_date: null,
    customs_duty: 124690, igst_on_import: 306000, social_welfare_surcharge: 12469,
    freight_charges: 45000, insurance: 8000, cha_charges: 18000, port_charges: 12000,
    other_charges: 5000, total_landed_cost: 2089784, status: 'shipped',
  },
  {
    id: '2', shipment_no: 'IMP-2026-0003', po_no: 'PO-2026-0025',
    supplier_name: 'Heraeus Electronics GmbH', supplier_country: 'Germany',
    incoterms: 'CIF', currency: 'EUR', invoice_no_foreign: 'HE-2026-04-0098',
    invoice_value_foreign: 4200, exchange_rate: 91.5, invoice_value_inr: 384300,
    vessel_name: null, bl_no: null, container_no: null, container_size: null,
    transport_mode: 'air', port_of_loading: 'FRA', port_of_discharge: 'BOM',
    etd: '2026-05-22', eta: '2026-05-24', ata: '2026-05-24',
    be_no: '4567890', be_date: '2026-05-25',
    customs_duty: 30744, igst_on_import: 75685, social_welfare_surcharge: 3074,
    freight_charges: 12000, insurance: 2000, cha_charges: 8000, port_charges: 3500,
    other_charges: 1000, total_landed_cost: 520303, status: 'customs_cleared',
  },
  {
    id: '3', shipment_no: 'IMP-2026-0002', po_no: 'PO-2026-0018',
    supplier_name: 'Taiwan Semiconductor Corp.', supplier_country: 'Taiwan',
    incoterms: 'EXW', currency: 'USD', invoice_no_foreign: 'TSC-INV-2026-0234',
    invoice_value_foreign: 8750, exchange_rate: 83.8, invoice_value_inr: 733250,
    vessel_name: 'Ever Given Jr.', bl_no: 'EVGJ5678901234', container_no: 'TRHU9876543',
    container_size: '20GP', transport_mode: 'sea', port_of_loading: 'TWTPE',
    port_of_discharge: 'INNSA', etd: '2026-04-28', eta: '2026-05-18', ata: '2026-05-19',
    be_no: '3456789', be_date: '2026-05-20',
    customs_duty: 58660, igst_on_import: 143640, social_welfare_surcharge: 5866,
    freight_charges: 38000, insurance: 5000, cha_charges: 15000, port_charges: 8000,
    other_charges: 3000, total_landed_cost: 1010416, status: 'delivered',
  },
]

const INCOTERMS = ['EXW','FCA','FOB','CIF','CFR','CIP','DAP','DDP','DPU']
const CURRENCIES = ['USD','EUR','GBP','CNY','JPY','SGD','AED','THB']
const TRANSPORT_MODES = [
  { label: 'Sea Freight', value: 'sea' },
  { label: 'Air Freight', value: 'air' },
  { label: 'Road (Import)', value: 'road' },
  { label: 'Rail', value: 'rail' },
]
const PORTS_INDIA = ['INNSA (Nhava Sheva)','INBOM (Mumbai)','INCCU (Kolkata)','INMAA (Chennai)','INNHAVA','INKTP (Mundra)']

function ShipmentTracker({ status }: { status: string }) {
  const idx = STATUS_STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-1 mt-2">
      {STATUS_STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${i < idx ? 'bg-emerald-500' : i === idx ? 'bg-blue-500 ring-2 ring-blue-200' : 'bg-slate-200'}`} title={STATUS_LABEL[step]} />
          {i < STATUS_STEPS.length - 1 && <div className={`h-0.5 w-3 ${i < idx ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
        </div>
      ))}
      <span className="text-[10px] text-slate-500 ml-1">{STATUS_LABEL[status]}</span>
    </div>
  )
}

export default function ImportsPage() {
  const [shipments, setShipments] = useState(MOCK_IMPORTS)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(true)
  const [tab, setTab] = useState('all')
  const [newShipment, setNewShipment] = useState(false)
  const [statusModal, setStatusModal] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    po_no: '', supplier_name: '', supplier_country: '', incoterms: 'FOB',
    currency: 'USD', invoice_no_foreign: '', invoice_value_foreign: '',
    exchange_rate: '84', transport_mode: 'sea', vessel_name: '', bl_no: '',
    awb_no: '', container_no: '', container_size: '20GP',
    port_of_loading: '', port_of_discharge: 'INNSA', etd: '', eta: '',
    customs_duty: '', igst_on_import: '', social_welfare_surcharge: '',
    freight_charges: '', insurance: '', cha_charges: '', port_charges: '',
    other_charges: '', notes: '',
  })

  const fetchShipments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/inventory/imports')
      if (res.ok) {
        const data = await res.json()
        if (data.shipments?.length > 0) { setShipments(data.shipments); setIsPreview(false) }
      }
    } catch { /* keep mock */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchShipments() }, [fetchShipments])

  const filtered = shipments.filter(s => {
    if (tab === 'all') return true
    if (tab === 'active') return !['delivered','cancelled'].includes(s.status)
    if (tab === 'customs') return ['at_customs','at_port'].includes(s.status)
    return s.status === tab
  })

  const totalValueUSD = shipments.reduce((s, i) => s + i.invoice_value_foreign, 0)
  const totalDuty = shipments.reduce((s, i) => s + i.customs_duty + i.igst_on_import, 0)
  const inTransit = shipments.filter(s => ['shipped','at_port','at_customs','customs_cleared','in_transit'].includes(s.status)).length

  const handleUpdateStatus = async () => {
    if (!statusModal) return
    setSaving(true)
    try {
      await fetch('/api/v1/inventory/imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: statusModal.new_status, shipment_id: statusModal.id, be_no: statusModal.be_no, be_date: statusModal.be_date }),
      })
      setStatusModal(null)
      fetchShipments()
    } finally { setSaving(false) }
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/inventory/imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          invoice_value_foreign: Number(form.invoice_value_foreign) || 0,
          exchange_rate: Number(form.exchange_rate) || 84,
          customs_duty: Number(form.customs_duty) || 0,
          igst_on_import: Number(form.igst_on_import) || 0,
          social_welfare_surcharge: Number(form.social_welfare_surcharge) || 0,
          freight_charges: Number(form.freight_charges) || 0,
          insurance: Number(form.insurance) || 0,
          cha_charges: Number(form.cha_charges) || 0,
          port_charges: Number(form.port_charges) || 0,
          other_charges: Number(form.other_charges) || 0,
        }),
      })
      if (res.ok) { setNewShipment(false); fetchShipments() }
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Import Shipment Tracking"
        description="Track all foreign purchase shipments — from PO to customs clearance to delivery"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewShipment(true)}>New Shipment</Button>
          </>
        }
      />

      {isPreview && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
          <strong>Preview mode</strong> — Showing sample import shipments.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Shipments" value={shipments.length.toString()} icon={<Ship className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="In Transit / Customs" value={inTransit.toString()} icon={<Anchor className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Total Invoice (USD equiv.)" value={`$${totalValueUSD.toLocaleString()}`} icon={<Globe className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="Total Duty & IGST" value={formatCurrency(totalDuty)} icon={<FileText className="h-4 w-4" />} iconColor="bg-red-50 text-red-500" />
      </div>

      <TabBar
        tabs={[
          { id: 'all',     label: 'All',           count: shipments.length },
          { id: 'active',  label: 'Active',         count: inTransit },
          { id: 'customs', label: 'At Customs',     count: shipments.filter(s => ['at_customs','at_port'].includes(s.status)).length },
          { id: 'delivered', label: 'Delivered',    count: shipments.filter(s => s.status === 'delivered').length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* Shipment Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading shipments…</div>
        ) : filtered.map(s => {
          const invoiceINR = s.invoice_value_foreign * s.exchange_rate
          const allDuty = s.customs_duty + s.igst_on_import + s.social_welfare_surcharge
          return (
            <Card key={s.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Left */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-blue-600">{s.shipment_no}</span>
                    {s.po_no && <span className="font-mono text-xs text-slate-400">← {s.po_no}</span>}
                    <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                    <Badge variant="neutral">{s.transport_mode === 'sea' ? '🚢 Sea' : '✈ Air'}</Badge>
                  </div>
                  <p className="mt-1.5 font-semibold text-slate-800">{s.supplier_name}</p>
                  <p className="text-xs text-slate-500">{s.supplier_country} · {s.incoterms} · {s.currency}</p>
                  <ShipmentTracker status={s.status} />
                </div>

                {/* Route */}
                <div className="text-center px-4 py-2 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">Route</p>
                  <p className="text-sm font-bold text-slate-700">{s.port_of_loading} → {s.port_of_discharge}</p>
                  {s.vessel_name && <p className="text-[10px] text-slate-400">{s.vessel_name}</p>}
                  {s.bl_no && <p className="font-mono text-[10px] text-slate-400">BL: {s.bl_no}</p>}
                  {s.awb_no && <p className="font-mono text-[10px] text-slate-400">AWB: {s.awb_no}</p>}
                  {s.container_no && <p className="font-mono text-[10px] text-slate-400">Ctr: {s.container_no} ({s.container_size})</p>}
                  <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                    {s.etd && <span>ETD: {s.etd}</span>}
                    {s.eta && <span>ETA: {s.eta}</span>}
                    {s.ata && <span className="text-emerald-600 font-semibold">ATA: {s.ata}</span>}
                  </div>
                </div>

                {/* Financials */}
                <div className="text-right space-y-1">
                  <p className="text-xs text-slate-400">Invoice Value</p>
                  <p className="font-bold text-slate-800">{s.currency} {s.invoice_value_foreign.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">= {formatCurrency(invoiceINR)} @ {s.exchange_rate}</p>
                  <p className="text-xs text-slate-400 mt-1">Customs + IGST</p>
                  <p className="font-semibold text-red-600">{formatCurrency(allDuty)}</p>
                  <p className="text-xs text-slate-400 mt-1">Landed Cost</p>
                  <p className="font-bold text-lg text-blue-700">{formatCurrency(s.total_landed_cost)}</p>
                  {s.be_no && <p className="text-[10px] text-slate-400">BE No: {s.be_no} ({s.be_date})</p>}
                </div>
              </div>

              {/* Charges breakdown */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-xs text-center">
                  {[
                    { label: 'Basic Customs Duty', value: s.customs_duty, color: 'text-red-600' },
                    { label: 'IGST on Import', value: s.igst_on_import, color: 'text-red-600' },
                    { label: 'SWS', value: s.social_welfare_surcharge, color: 'text-red-500' },
                    { label: 'Freight', value: s.freight_charges, color: 'text-slate-600' },
                    { label: 'Insurance', value: s.insurance, color: 'text-slate-600' },
                    { label: 'CHA + Port', value: s.cha_charges + s.port_charges, color: 'text-slate-600' },
                  ].map(c => (
                    <div key={c.label} className="bg-slate-50 rounded p-2">
                      <p className="text-slate-400 text-[10px]">{c.label}</p>
                      <p className={`font-semibold ${c.color}`}>{formatCurrency(c.value)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-3 mt-3">
                  {s.status !== 'delivered' && s.status !== 'cancelled' && (
                    <Button size="sm" variant="outline" onClick={() => {
                      const nextIdx = STATUS_STEPS.indexOf(s.status) + 1
                      if (nextIdx < STATUS_STEPS.length) {
                        setStatusModal({ id: s.id, shipment_no: s.shipment_no, current: s.status, new_status: STATUS_STEPS[nextIdx], be_no: s.be_no ?? '', be_date: s.be_date ?? '' })
                      }
                    }}>
                      Advance Status →
                    </Button>
                  )}
                  <Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon"><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" title="Upload Documents"><FileText className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Status Advance Modal */}
      {statusModal && (
        <Modal open={!!statusModal} onClose={() => setStatusModal(null)}
          title={`Advance Shipment — ${statusModal.shipment_no}`}
          footer={<><Button variant="ghost" size="sm" onClick={() => setStatusModal(null)}>Cancel</Button><Button size="sm" loading={saving} onClick={handleUpdateStatus}>Confirm</Button></>}
        >
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              Moving: <strong>{STATUS_LABEL[statusModal.current]}</strong> → <strong>{STATUS_LABEL[statusModal.new_status]}</strong>
            </div>
            {statusModal.new_status === 'at_customs' && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Bill of Entry (BE) No" value={statusModal.be_no} onChange={e => setStatusModal((p: any) => ({ ...p, be_no: e.target.value }))} placeholder="7-digit BE No" />
                <Input label="BE Date" type="date" value={statusModal.be_date} onChange={e => setStatusModal((p: any) => ({ ...p, be_date: e.target.value }))} />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* New Shipment Modal */}
      <Modal open={newShipment} onClose={() => setNewShipment(false)} title="Register Import Shipment" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewShipment(false)}>Cancel</Button><Button size="sm" loading={saving} onClick={handleCreate}>Create Shipment</Button></>}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Divider label="Supplier & PO" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Supplier Name *" required value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))} />
            <Input label="Supplier Country *" required value={form.supplier_country} onChange={e => setForm(f => ({ ...f, supplier_country: e.target.value }))} />
            <Input label="Purchase Order No" value={form.po_no} onChange={e => setForm(f => ({ ...f, po_no: e.target.value }))} />
            <Select label="Incoterms" value={form.incoterms} onChange={e => setForm(f => ({ ...f, incoterms: (e.target as any).value }))} options={INCOTERMS.map(i => ({ label: i, value: i }))} />
          </div>
          <Divider label="Invoice" />
          <div className="grid grid-cols-3 gap-4">
            <Select label="Currency" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: (e.target as any).value }))} options={CURRENCIES.map(c => ({ label: c, value: c }))} />
            <Input label="Invoice No (Foreign)" value={form.invoice_no_foreign} onChange={e => setForm(f => ({ ...f, invoice_no_foreign: e.target.value }))} />
            <Input label="Invoice Value" type="number" value={form.invoice_value_foreign} onChange={e => setForm(f => ({ ...f, invoice_value_foreign: e.target.value }))} />
            <Input label="Exchange Rate (₹)" type="number" value={form.exchange_rate} onChange={e => setForm(f => ({ ...f, exchange_rate: e.target.value }))} />
          </div>
          <Divider label="Transport" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Mode" value={form.transport_mode} onChange={e => setForm(f => ({ ...f, transport_mode: (e.target as any).value }))} options={TRANSPORT_MODES} />
            <Input label={form.transport_mode === 'air' ? 'AWB No' : 'BL No'} value={form.transport_mode === 'air' ? form.awb_no : form.bl_no} onChange={e => form.transport_mode === 'air' ? setForm(f => ({ ...f, awb_no: e.target.value })) : setForm(f => ({ ...f, bl_no: e.target.value }))} />
            {form.transport_mode === 'sea' && <>
              <Input label="Vessel Name" value={form.vessel_name} onChange={e => setForm(f => ({ ...f, vessel_name: e.target.value }))} />
              <Input label="Container No" value={form.container_no} onChange={e => setForm(f => ({ ...f, container_no: e.target.value }))} />
            </>}
            <Input label="Port of Loading" value={form.port_of_loading} onChange={e => setForm(f => ({ ...f, port_of_loading: e.target.value }))} placeholder="e.g. CNSHK, FRA" />
            <Select label="Port of Discharge" value={form.port_of_discharge} onChange={e => setForm(f => ({ ...f, port_of_discharge: (e.target as any).value }))} options={PORTS_INDIA.map(p => ({ label: p, value: p.split(' ')[0] }))} />
            <Input label="ETD (Est. Departure)" type="date" value={form.etd} onChange={e => setForm(f => ({ ...f, etd: e.target.value }))} />
            <Input label="ETA (Est. Arrival)" type="date" value={form.eta} onChange={e => setForm(f => ({ ...f, eta: e.target.value }))} />
          </div>
          <Divider label="Customs & Charges (₹)" />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Basic Customs Duty" type="number" value={form.customs_duty} onChange={e => setForm(f => ({ ...f, customs_duty: e.target.value }))} placeholder="0" />
            <Input label="IGST on Import" type="number" value={form.igst_on_import} onChange={e => setForm(f => ({ ...f, igst_on_import: e.target.value }))} placeholder="0" />
            <Input label="Social Welfare Surcharge" type="number" value={form.social_welfare_surcharge} onChange={e => setForm(f => ({ ...f, social_welfare_surcharge: e.target.value }))} placeholder="0" />
            <Input label="Freight Charges" type="number" value={form.freight_charges} onChange={e => setForm(f => ({ ...f, freight_charges: e.target.value }))} placeholder="0" />
            <Input label="Insurance" type="number" value={form.insurance} onChange={e => setForm(f => ({ ...f, insurance: e.target.value }))} placeholder="0" />
            <Input label="CHA Agent Fees" type="number" value={form.cha_charges} onChange={e => setForm(f => ({ ...f, cha_charges: e.target.value }))} placeholder="0" />
            <Input label="Port Charges" type="number" value={form.port_charges} onChange={e => setForm(f => ({ ...f, port_charges: e.target.value }))} placeholder="0" />
            <Input label="Other Charges" type="number" value={form.other_charges} onChange={e => setForm(f => ({ ...f, other_charges: e.target.value }))} placeholder="0" />
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <strong>Estimated Landed Cost: </strong>
            {formatCurrency(
              (Number(form.invoice_value_foreign) || 0) * (Number(form.exchange_rate) || 84) +
              (Number(form.customs_duty) || 0) + (Number(form.igst_on_import) || 0) +
              (Number(form.social_welfare_surcharge) || 0) + (Number(form.freight_charges) || 0) +
              (Number(form.insurance) || 0) + (Number(form.cha_charges) || 0) +
              (Number(form.port_charges) || 0) + (Number(form.other_charges) || 0)
            )}
          </div>
          <Textarea label="Notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}
