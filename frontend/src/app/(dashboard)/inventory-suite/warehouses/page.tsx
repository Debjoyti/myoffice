// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, Modal, Input, Select, Textarea
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Warehouse, Plus, Eye, Edit2, Package, MapPin, FlaskConical } from 'lucide-react'

const MOCK_WAREHOUSES = [
  { id:'1', code:'WH-01', name:'Main Warehouse', type:'general', city:'Pune', state:'Maharashtra', area_sqft:5000, has_bin_mgmt:true, is_bonded:false, temp_controlled:false, status:'active', stock_value:1673500, total_qty:5920, bin_count:48, manager:'Rakesh Sharma' },
  { id:'2', code:'WH-02', name:'Raw Material Store', type:'raw_material', city:'Pune', state:'Maharashtra', area_sqft:2000, has_bin_mgmt:false, is_bonded:false, temp_controlled:false, status:'active', stock_value:23800, total_qty:360, bin_count:0, manager:'Priya Patel' },
  { id:'3', code:'WH-03', name:'Chemical Store', type:'general', city:'Pune', state:'Maharashtra', area_sqft:500, has_bin_mgmt:false, is_bonded:false, temp_controlled:true, status:'active', stock_value:4800, total_qty:15, bin_count:0, manager:'Amit Desai' },
  { id:'4', code:'WH-04', name:'Bonded Warehouse', type:'bonded', city:'Nhava Sheva', state:'Maharashtra', area_sqft:1000, has_bin_mgmt:false, is_bonded:true, temp_controlled:false, status:'active', stock_value:0, total_qty:0, bin_count:0, manager:'Import Team' },
]

const MOCK_BINS = [
  { id:'1', bin_code:'A-01-01-1', zone:'A', aisle:'01', rack:'01', level:'1', bin_type:'storage', status:'active', warehouse:'WH-01' },
  { id:'2', bin_code:'A-01-01-2', zone:'A', aisle:'01', rack:'01', level:'2', bin_type:'storage', status:'active', warehouse:'WH-01' },
  { id:'3', bin_code:'A-01-02-1', zone:'A', aisle:'01', rack:'02', level:'1', bin_type:'storage', status:'active', warehouse:'WH-01' },
  { id:'4', bin_code:'B-02-01-1', zone:'B', aisle:'02', rack:'01', level:'1', bin_type:'storage', status:'active', warehouse:'WH-01' },
  { id:'5', bin_code:'RCV-001',   zone:'RECV', aisle:'', rack:'', level:'', bin_type:'receiving', status:'active', warehouse:'WH-01' },
  { id:'6', bin_code:'DSP-001',   zone:'DISP', aisle:'', rack:'', level:'', bin_type:'dispatch', status:'active', warehouse:'WH-01' },
  { id:'7', bin_code:'QRN-001',   zone:'QC', aisle:'', rack:'', level:'', bin_type:'quarantine', status:'active', warehouse:'WH-01' },
]

const TYPE_LABEL: Record<string,string> = { general:'General', raw_material:'Raw Material', finished_goods:'Finished Goods', bonded:'Bonded (Import)', transit:'Transit', quarantine:'Quarantine' }
const TYPE_VARIANT: Record<string,any> = { general:'neutral', raw_material:'info', finished_goods:'success', bonded:'warning', transit:'neutral', quarantine:'danger' }
const BIN_TYPE_VARIANT: Record<string,any> = { storage:'neutral', receiving:'info', dispatch:'success', staging:'warning', quarantine:'danger', rejection:'danger' }

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState(MOCK_WAREHOUSES)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(true)
  const [tab, setTab] = useState('warehouses')
  const [selectedWH, setSelectedWH] = useState<any>(null)
  const [newWH, setNewWH] = useState(false)
  const [newBin, setNewBin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [whForm, setWhForm] = useState({ code:'', name:'', type:'general', address:'', city:'', state:'Maharashtra', pin_code:'', gstin:'', area_sqft:'', has_bin_mgmt:false, is_bonded:false, temp_controlled:false })
  const [binForm, setBinForm] = useState({ warehouse_id:'', bin_code:'', zone:'', aisle:'', rack:'', level:'', bin_type:'storage' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/inventory/warehouses')
      if (res.ok) { const d = await res.json(); if (d.warehouses?.length > 0) { setWarehouses(d.warehouses); setIsPreview(false) } }
    } catch { /* keep mock */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSaveWH = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/inventory/warehouses', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...whForm, area_sqft: Number(whForm.area_sqft)||null }) })
      if (res.ok) { setNewWH(false); fetchData() }
    } finally { setSaving(false) }
  }

  const totalValue = warehouses.reduce((s, w) => s + w.stock_value, 0)
  const bonded = warehouses.filter(w => w.is_bonded).length
  const withBins = warehouses.filter(w => w.has_bin_mgmt).length

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Warehouses & Bin Management"
        description="Manage warehouse locations, bin configurations, and storage zones"
        actions={<>
          <Button variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewBin(true)}>Add Bin</Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewWH(true)}>Add Warehouse</Button>
        </>}
      />

      {isPreview && <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700"><FlaskConical className="h-3.5 w-3.5" /><strong>Preview mode</strong></div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Warehouses" value={warehouses.length.toString()} icon={<Warehouse className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Total Stock Value" value={formatCurrency(totalValue)} icon={<Package className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Bonded Warehouses" value={bonded.toString()} icon={<MapPin className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="With Bin Management" value={withBins.toString()} icon={<Warehouse className="h-4 w-4" />} />
      </div>

      <TabBar tabs={[{ id:'warehouses', label:'Warehouses' }, { id:'bins', label:'Bin Locations (WH-01)' }]} active={tab} onChange={setTab} />

      {tab === 'warehouses' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {warehouses.map(wh => {
            return (
              <Card key={wh.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedWH(wh); setTab('bins') }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{wh.code}</span>
                      <Badge variant={TYPE_VARIANT[wh.type]}>{TYPE_LABEL[wh.type]}</Badge>
                      {wh.is_bonded && <Badge variant="warning">🔒 Bonded</Badge>}
                      {wh.temp_controlled && <Badge variant="info">🌡 Temp</Badge>}
                    </div>
                    <p className="font-bold text-slate-800 mt-1">{wh.name}</p>
                    <p className="text-xs text-slate-500">{wh.city}, {wh.state}</p>
                    <p className="text-xs text-slate-400">Manager: {wh.manager}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Stock Value</p>
                    <p className="font-bold text-slate-800">{formatCurrency(wh.stock_value)}</p>
                    <p className="text-xs text-slate-400">{wh.area_sqft.toLocaleString()} sqft</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs mt-3">
                  <div className="bg-slate-50 rounded p-2">
                    <p className="text-slate-400">Bin Mgmt</p>
                    <p className="font-semibold">{wh.has_bin_mgmt ? `${wh.bin_count} bins` : 'No'}</p>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <p className="text-slate-400">Status</p>
                    <Badge variant="success">{wh.status}</Badge>
                  </div>
                  <div className="bg-slate-50 rounded p-2">
                    <p className="text-slate-400">Total Qty</p>
                    <p className="font-semibold">{wh.total_qty.toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'bins' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-700">Bin Locations — WH-01 (Main Warehouse)</p>
              <p className="text-xs text-slate-400">Zones → Aisles → Racks → Levels</p>
            </div>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewBin(true)}>Add Bin</Button>
          </div>
          <Table>
            <Thead><tr><Th>Bin Code</Th><Th>Zone</Th><Th>Aisle</Th><Th>Rack</Th><Th>Level</Th><Th>Type</Th><Th>Status</Th><Th></Th></tr></Thead>
            <Tbody>
              {MOCK_BINS.map(b => (
                <Tr key={b.id}>
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{b.bin_code}</span></Td>
                  <Td><span className="text-sm">{b.zone || '—'}</span></Td>
                  <Td><span className="text-sm">{b.aisle || '—'}</span></Td>
                  <Td><span className="text-sm">{b.rack || '—'}</span></Td>
                  <Td><span className="text-sm">{b.level || '—'}</span></Td>
                  <Td><Badge variant={BIN_TYPE_VARIANT[b.bin_type]}>{b.bin_type}</Badge></Td>
                  <Td><Badge variant="success">{b.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon"><Edit2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      <Modal open={newWH} onClose={() => setNewWH(false)} title="Add Warehouse" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewWH(false)}>Cancel</Button><Button size="sm" loading={saving} onClick={handleSaveWH}>Save Warehouse</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Warehouse Code *" required value={whForm.code} onChange={e => setWhForm(f => ({ ...f, code: e.target.value }))} placeholder="WH-05" />
            <Input label="Warehouse Name *" required value={whForm.name} onChange={e => setWhForm(f => ({ ...f, name: e.target.value }))} placeholder="Descriptive name" />
            <Select label="Type" value={whForm.type} onChange={e => setWhForm(f => ({ ...f, type: (e.target as any).value }))} options={Object.entries(TYPE_LABEL).map(([v,l]) => ({ label: l, value: v }))} />
            <Input label="Area (sqft)" type="number" value={whForm.area_sqft} onChange={e => setWhForm(f => ({ ...f, area_sqft: e.target.value }))} />
            <Input label="City" value={whForm.city} onChange={e => setWhForm(f => ({ ...f, city: e.target.value }))} />
            <Input label="State" value={whForm.state} onChange={e => setWhForm(f => ({ ...f, state: e.target.value }))} />
            <Input label="PIN Code" value={whForm.pin_code} onChange={e => setWhForm(f => ({ ...f, pin_code: e.target.value }))} />
            <Input label="GSTIN (if separate)" value={whForm.gstin} onChange={e => setWhForm(f => ({ ...f, gstin: e.target.value }))} />
          </div>
          <Textarea label="Full Address" rows={2} value={whForm.address} onChange={e => setWhForm(f => ({ ...f, address: e.target.value }))} />
          <div className="flex gap-6">
            {[['has_bin_mgmt','Enable Bin Management'],['is_bonded','Bonded Warehouse (Import)'],['temp_controlled','Temperature Controlled']].map(([k,l]) => (
              <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={(whForm as any)[k]} onChange={e => setWhForm(f => ({ ...f, [k]: e.target.checked }))} className="rounded" />
                <span className="text-slate-700">{l}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <Modal open={newBin} onClose={() => setNewBin(false)} title="Add Bin Location" size="md"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewBin(false)}>Cancel</Button><Button size="sm">Save Bin</Button></>}
      >
        <div className="space-y-4">
          <Select label="Warehouse" value={binForm.warehouse_id} onChange={e => setBinForm(f => ({ ...f, warehouse_id: (e.target as any).value }))} options={warehouses.map(w => ({ label: `${w.code} — ${w.name}`, value: w.id }))} />
          <Input label="Bin Code *" required value={binForm.bin_code} onChange={e => setBinForm(f => ({ ...f, bin_code: e.target.value }))} placeholder="e.g. A-01-02-3 or RCV-001" />
          <div className="grid grid-cols-4 gap-3">
            <Input label="Zone" value={binForm.zone} onChange={e => setBinForm(f => ({ ...f, zone: e.target.value }))} placeholder="A" />
            <Input label="Aisle" value={binForm.aisle} onChange={e => setBinForm(f => ({ ...f, aisle: e.target.value }))} placeholder="01" />
            <Input label="Rack" value={binForm.rack} onChange={e => setBinForm(f => ({ ...f, rack: e.target.value }))} placeholder="02" />
            <Input label="Level" value={binForm.level} onChange={e => setBinForm(f => ({ ...f, level: e.target.value }))} placeholder="3" />
          </div>
          <Select label="Bin Type" value={binForm.bin_type} onChange={e => setBinForm(f => ({ ...f, bin_type: (e.target as any).value }))} options={['storage','receiving','dispatch','staging','quarantine','rejection'].map(t => ({ label: t, value: t }))} />
        </div>
      </Modal>
    </div>
  )
}
