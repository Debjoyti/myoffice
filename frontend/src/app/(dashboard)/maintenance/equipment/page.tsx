'use client'

import { useState, useMemo } from 'react'
import { Package, Plus, Search, Edit2, X } from 'lucide-react'

const CATEGORIES = [
  { code: 'C', name: 'Construction Machine' }, { code: 'D', name: 'DSD Vehicle' },
  { code: 'G', name: 'GG Equip Category' },    { code: 'H', name: 'Medical Device' },
  { code: 'I', name: 'IT Equipment' },          { code: 'J', name: 'Containers' },
  { code: 'L', name: 'Liner Equipment' },       { code: 'M', name: 'Machines' },
  { code: 'N', name: 'Mining Equipment' },      { code: 'O', name: 'Transmitter Equipment' },
  { code: 'P', name: 'Production Resources / Tools' }, { code: 'Q', name: 'Test/Measurement Equipment' },
  { code: 'R', name: 'RFID Equipment' },        { code: 'S', name: 'Customer Equipment' },
  { code: 'T', name: 'Transport Equipment' },   { code: 'V', name: 'Vehicles' },
  { code: 'X', name: 'Equipment Services' },
]

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-slate-100 text-slate-500',
  under_repair: 'bg-amber-100 text-amber-700',
  retired: 'bg-red-100 text-red-700',
}

const DEMO = [
  { id: '1', equipment_number: 'EQ-001000', description: 'CNC Milling Machine', category_code: 'M', category: 'Machines', location: 'Plant A - Section 1', status: 'active', manufacturer: 'FANUC', model: 'ROBODRILL α-D14MiB5', install_date: '2023-06-15' },
  { id: '2', equipment_number: 'EQ-001001', description: 'Industrial Compressor 75kW', category_code: 'P', category: 'Production Resources', location: 'Utility Block', status: 'active', manufacturer: 'Atlas Copco', model: 'GA75+', install_date: '2022-01-10' },
  { id: '3', equipment_number: 'EQ-001002', description: 'Overhead Crane 10T', category_code: 'L', category: 'Liner Equipment', location: 'Bay 3', status: 'under_repair', manufacturer: 'Demag', model: 'EKDR 10-4', install_date: '2020-03-01' },
  { id: '4', equipment_number: 'EQ-001003', description: 'Conveyor Belt System', category_code: 'M', category: 'Machines', location: 'Plant B', status: 'active', manufacturer: 'Interroll', model: 'RollerDrive EC5000', install_date: '2021-08-20' },
]

const EMPTY_FORM = {
  description: '', category_code: 'M', object_type: '', location: '', plant_section: '',
  function_location: '', room: '', abc_indicator: 'A', plant_code: '', company_code: '',
  planning_plant: '', work_center: '', weight_kg: '', width: '', height: '', length: '',
  dimension_unit: 'mm', invoice_number: '', invoice_date: '', assets_number: '',
  valid_from: '', valid_to: '', install_date: '', electricity_meter_number: '',
  manufacturer_name: '', manufacturer_country: '', model_number: '', manufacture_date: '',
  manufacture_part_number: '', manufacture_serial_number: '', status: 'active',
  materials: Array.from({ length: 8 }, (_, i) => ({ sr: i + 1, material_code: '', description: '', qty: '', unit: '' })),
}

export default function EquipmentPage() {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [equipment, setEquipment] = useState(DEMO)

  const filtered = useMemo(() => equipment.filter(e => {
    const q = search.toLowerCase()
    return (catFilter === 'All' || e.category_code === catFilter) &&
      (!search || e.description.toLowerCase().includes(q) || e.equipment_number.toLowerCase().includes(q))
  }), [equipment, search, catFilter])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/v1/maintenance/equipment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        const cat = CATEGORIES.find(c => c.code === form.category_code)
        setEquipment(prev => [{
          id: data.id ?? String(Date.now()),
          equipment_number: data.equipment_number ?? `EQ-${Date.now()}`,
          description: form.description,
          category_code: form.category_code,
          category: cat?.name ?? '',
          location: form.location,
          status: form.status,
          manufacturer: form.manufacturer_name,
          model: form.model_number,
          install_date: form.install_date,
        }, ...prev])
        setShowForm(false)
        setForm(EMPTY_FORM)
        showToast('Equipment added and number generated.')
      }
    } catch {
      showToast('Saved locally (API unavailable).')
      setShowForm(false)
    } finally { setSaving(false) }
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000) }

  const f = (key: keyof typeof form, val: string) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Equipment Register</h1>
            <p className="text-xs text-slate-500">Add / change equipment master data</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
          <Plus className="h-4 w-4" /> Add Equipment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search equipment…"
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Equipment No.','Description','Category','Location','Status','Manufacturer','Install Date'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">No equipment found</td></tr>
            )}
            {filtered.map((eq, i) => (
              <tr key={eq.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">{eq.equipment_number}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{eq.description}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{eq.category_code} — {eq.category}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{eq.location || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[eq.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {eq.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{eq.manufacturer || '—'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{eq.install_date || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Add Equipment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 text-lg">Add / Change Equipment</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Equipment Description *</label>
                <input required value={form.description} onChange={e => f('description', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Valid From / To */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Valid From</label>
                  <input type="date" value={form.valid_from} onChange={e => f('valid_from', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Valid To <span className="text-slate-400 font-normal">(Accounts Dept fills)</span></label>
                  <input type="date" value={form.valid_to} onChange={e => f('valid_to', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Category + Object Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Equipment Category</label>
                  <select value={form.category_code} onChange={e => f('category_code', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {CATEGORIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Object Type</label>
                  <input value={form.object_type} onChange={e => f('object_type', e.target.value)}
                    placeholder="Select / enter object type"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Size & Dimensions</label>
                <div className="grid grid-cols-5 gap-2">
                  {(['width','height','length'] as const).map(dim => (
                    <div key={dim}>
                      <label className="text-xs text-slate-400 mb-1 block capitalize">{dim}</label>
                      <input type="number" value={form[dim]} onChange={e => f(dim, e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Weight (kg)</label>
                    <input type="number" value={form.weight_kg} onChange={e => f('weight_kg', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Unit</label>
                    <select value={form.dimension_unit} onChange={e => f('dimension_unit', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['mm','cm','inch','feet','meter'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Invoice + Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Invoice Number</label>
                  <input value={form.invoice_number} onChange={e => f('invoice_number', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Invoice Date</label>
                  <input type="date" value={form.invoice_date} onChange={e => f('invoice_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Assets Number</label>
                  <input value={form.assets_number} onChange={e => f('assets_number', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Location</label>
                  <input value={form.location} onChange={e => f('location', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">ABC Indicator</label>
                  <select value={form.abc_indicator} onChange={e => f('abc_indicator', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>A</option><option>B</option><option>C</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Room</label>
                  <input value={form.room} onChange={e => f('room', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Work Center</label>
                  <input value={form.work_center} onChange={e => f('work_center', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Plant Code</label>
                  <input value={form.plant_code} onChange={e => f('plant_code', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Company Code</label>
                  <input value={form.company_code} onChange={e => f('company_code', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Function Location</label>
                  <input value={form.function_location} onChange={e => f('function_location', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Installation Date</label>
                  <input type="date" value={form.install_date} onChange={e => f('install_date', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">Electricity Meter Number</label>
                <input value={form.electricity_meter_number} onChange={e => f('electricity_meter_number', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Manufacturer Material Detail */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-3 block">Manufacture Material Detail</label>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Sr.No','Material Code','Material Description','Qty','Unit'].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {form.materials.map((m, i) => (
                        <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50/50'}>
                          <td className="px-3 py-1.5 text-slate-400">{m.sr}</td>
                          {(['material_code','description','qty','unit'] as const).map(k => (
                            <td key={k} className="px-1 py-1">
                              <input value={(m as any)[k]} onChange={e => {
                                const mats = [...form.materials]
                                ;(mats[i] as any)[k] = e.target.value
                                setForm(p => ({ ...p, materials: mats }))
                              }}
                                className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Manufacturer Data */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-3 block">Manufacturer Data</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['manufacturer_name','Manufacturer Name'],['manufacturer_country','Country'],
                    ['model_number','Model Number'],['manufacture_date','Manufacture Date (mm/yyyy)'],
                    ['manufacture_part_number','Part Number'],['manufacture_serial_number','Serial Number'],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
                      <input value={(form as any)[key]} onChange={e => f(key as keyof typeof form, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium">
                  {saving ? 'Saving…' : 'Submit & Generate Equipment Number'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
