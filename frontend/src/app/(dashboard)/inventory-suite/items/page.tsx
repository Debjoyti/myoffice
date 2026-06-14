// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea, Divider
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  Package, Plus, Download, Eye, Edit2, AlertTriangle, RefreshCw, Ship,
  FlaskConical
} from 'lucide-react'

const ITEM_CATEGORIES = ['Raw Material','WIP','Finished Goods','Spare Parts','Trading','Consumable','Capital Item']
const UOM_OPTIONS = ['PCS','KG','MTR','LTR','BTL','BOX','SET','NOS','SHT','TON','GM','ML','FT','INCH']
const GST_RATES = ['0','5','12','18','28']

const MOCK_ITEMS = [
  { id: '1', sku: 'ELE-PCB-001', name: 'PCB Assembly Board', category: 'Raw Material', item_type: 'imported', uom: 'PCS', hsn_code: '85340000', gst_rate: 18, current_cost: 1250, qty_on_hand: 450, qty_reserved: 50, qty_available: 400, stock_value: 562500, reorder_level: 100, is_low_stock: false, status: 'active', country_of_origin: 'China' },
  { id: '2', sku: 'PKG-BOX-L', name: 'Packaging Box Large', category: 'Consumable', item_type: 'domestic', uom: 'PCS', hsn_code: '48191000', gst_rate: 12, current_cost: 45, qty_on_hand: 1200, qty_reserved: 0, qty_available: 1200, stock_value: 54000, reorder_level: 500, is_low_stock: false, status: 'active', country_of_origin: 'India' },
  { id: '3', sku: 'RAW-STL-001', name: 'Steel Sheet 2mm', category: 'Raw Material', item_type: 'domestic', uom: 'KG', hsn_code: '72082700', gst_rate: 18, current_cost: 85, qty_on_hand: 80, qty_reserved: 0, qty_available: 80, stock_value: 6800, reorder_level: 200, is_low_stock: true, status: 'active', country_of_origin: 'India' },
  { id: '4', sku: 'ELE-CAP-100', name: 'Capacitor 100µF', category: 'Raw Material', item_type: 'imported', uom: 'PCS', hsn_code: '85322200', gst_rate: 18, current_cost: 8, qty_on_hand: 5000, qty_reserved: 200, qty_available: 4800, stock_value: 40000, reorder_level: 1000, is_low_stock: false, status: 'active', country_of_origin: 'Taiwan' },
  { id: '5', sku: 'CHM-SOL-001', name: 'Flux Solution 500ml', category: 'Consumable', item_type: 'imported', uom: 'BTL', hsn_code: '38100090', gst_rate: 18, current_cost: 320, qty_on_hand: 15, qty_reserved: 0, qty_available: 15, stock_value: 4800, reorder_level: 50, is_low_stock: true, status: 'active', country_of_origin: 'Germany' },
  { id: '6', sku: 'FIN-ASM-A1', name: 'Finished Assembly Unit A1', category: 'Finished Goods', item_type: 'domestic', uom: 'PCS', hsn_code: '85371090', gst_rate: 18, current_cost: 4800, qty_on_hand: 220, qty_reserved: 60, qty_available: 160, stock_value: 1056000, reorder_level: 50, is_low_stock: false, status: 'active', country_of_origin: 'India' },
  { id: '7', sku: 'SPR-BRG-6204', name: 'Bearing 6204 (SKF)', category: 'Spare Parts', item_type: 'both', uom: 'PCS', hsn_code: '84821010', gst_rate: 18, current_cost: 285, qty_on_hand: 48, qty_reserved: 5, qty_available: 43, stock_value: 13680, reorder_level: 20, is_low_stock: false, status: 'active', country_of_origin: 'Sweden' },
]

const TYPE_BADGE: Record<string, any> = { domestic: 'success', imported: 'info', both: 'warning' }
const TYPE_ICON: Record<string, React.ReactNode> = {
  imported: <Ship className="h-3 w-3" />,
  both: <Ship className="h-3 w-3" />,
}

export default function ItemMasterPage() {
  const [items, setItems] = useState(MOCK_ITEMS)
  const [loading, setLoading] = useState(true)
  const [isPreview, setIsPreview] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [tab, setTab] = useState('all')
  const [newItem, setNewItem] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    sku: '', name: '', description: '', category: 'Raw Material', sub_category: '',
    item_type: 'domestic', uom: 'PCS', secondary_uom: '', hsn_code: '', gst_rate: '18',
    valuation_method: 'moving_avg', standard_cost: '', reorder_level: '', reorder_qty: '',
    safety_stock: '', max_stock: '', lead_time_days: '7',
    lot_controlled: false, batch_controlled: false, shelf_life_days: '',
    weight_kg: '', country_of_origin: '', customs_tariff: '',
  })

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterCat !== 'all') params.set('category', filterCat)
      if (filterType !== 'all') params.set('type', filterType)
      const res = await fetch(`/api/v1/inventory/items?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (data.items?.length > 0) { setItems(data.items); setIsPreview(false) }
      }
    } catch { /* keep mock */ }
    finally { setLoading(false) }
  }, [filterCat, filterType])

  useEffect(() => { fetchItems() }, [fetchItems])

  const displayItems = items.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()) || (i.hsn_code ?? '').includes(search)
    const matchLow = tab === 'low_stock' ? i.is_low_stock : true
    const matchImport = tab === 'imported' ? i.item_type !== 'domestic' : true
    return matchSearch && matchLow && matchImport
  })

  const totalValue = items.reduce((s, i) => s + i.stock_value, 0)
  const lowStock   = items.filter(i => i.is_low_stock && i.reorder_level > 0).length
  const importedCount = items.filter(i => i.item_type !== 'domestic').length

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          gst_rate:      Number(form.gst_rate),
          standard_cost: Number(form.standard_cost) || 0,
          reorder_level: Number(form.reorder_level) || 0,
          reorder_qty:   Number(form.reorder_qty) || 0,
          safety_stock:  Number(form.safety_stock) || 0,
          max_stock:     Number(form.max_stock) || 0,
          lead_time_days:Number(form.lead_time_days) || 7,
        }),
      })
      if (res.ok) { setNewItem(false); fetchItems() }
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Item Master"
        description="All inventory items — domestic, imported, and semi-finished"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewItem(true)}>Add Item</Button>
          </>
        }
      />

      {isPreview && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
          <strong>Preview mode</strong> — Showing illustrative items. Add your first item to see live data.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total SKUs" value={items.length.toString()} icon={<Package className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Inventory Value" value={formatCurrency(totalValue)} icon={<Package className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Imported Items" value={importedCount.toString()} icon={<Ship className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="Low / Critical" value={lowStock.toString()} icon={<AlertTriangle className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" delta={lowStock > 0 ? { value: 'Needs reorder', positive: false } : undefined} />
      </div>

      <TabBar
        tabs={[
          { id: 'all', label: 'All Items', count: items.length },
          { id: 'low_stock', label: '⚠ Low Stock', count: lowStock },
          { id: 'imported', label: '🚢 Imported', count: importedCount },
        ]}
        active={tab}
        onChange={setTab}
      />

      <Card padding="none">
        <div className="px-5 py-4 flex flex-wrap items-center gap-3 border-b border-slate-100">
          <SearchInput placeholder="Search by name, SKU, or HSN..." value={search} onChange={setSearch} className="w-72" />
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white"
          >
            <option value="all">All Categories</option>
            {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white"
          >
            <option value="all">All Types</option>
            <option value="domestic">Domestic</option>
            <option value="imported">Imported</option>
            <option value="both">Both</option>
          </select>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchItems} className="ml-auto">
            Refresh
          </Button>
        </div>

        <Table>
          <Thead>
            <tr>
              <Th>SKU</Th><Th>Item Name</Th><Th>Category</Th><Th>Origin</Th>
              <Th>UOM</Th><Th>HSN</Th><Th>GST</Th>
              <Th align="right">On Hand</Th><Th align="right">Available</Th>
              <Th align="right">Rate</Th><Th align="right">Value</Th>
              <Th>Status</Th><Th></Th>
            </tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr><td colSpan={13} className="py-12 text-center text-slate-400 text-sm">Loading items…</td></Tr>
            ) : displayItems.length === 0 ? (
              <Tr><td colSpan={13} className="py-12 text-center text-slate-400 text-sm">No items found</td></Tr>
            ) : displayItems.map(item => (
              <Tr key={item.id}>
                <Td><span className="font-mono text-xs font-bold text-blue-600">{item.sku}</span></Td>
                <Td>
                  <div>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    {item.country_of_origin && <p className="text-[10px] text-slate-400">{item.country_of_origin}</p>}
                  </div>
                </Td>
                <Td><span className="text-xs text-slate-500">{item.category}</span></Td>
                <Td>
                  <Badge variant={TYPE_BADGE[item.item_type]}>
                    <span className="flex items-center gap-1">
                      {TYPE_ICON[item.item_type]}
                      {item.item_type}
                    </span>
                  </Badge>
                </Td>
                <Td><span className="text-xs text-slate-400">{item.uom}</span></Td>
                <Td><span className="font-mono text-xs text-slate-500">{item.hsn_code ?? '—'}</span></Td>
                <Td><span className="text-xs">{item.gst_rate}%</span></Td>
                <Td align="right">
                  <span className={`font-semibold ${item.is_low_stock ? 'text-red-600' : 'text-slate-800'}`}>
                    {Number(item.qty_on_hand).toLocaleString()}
                    {item.is_low_stock && <AlertTriangle className="h-3 w-3 text-amber-500 inline ml-1" />}
                  </span>
                </Td>
                <Td align="right">
                  <span className="text-slate-600">{Number(item.qty_available).toLocaleString()}</span>
                  {item.qty_reserved > 0 && <span className="text-[10px] text-slate-400 block">({item.qty_reserved} reserved)</span>}
                </Td>
                <Td align="right"><span className="text-sm">{formatCurrency(item.current_cost)}</span></Td>
                <Td align="right"><span className="data-value font-semibold">{formatCurrency(item.stock_value)}</span></Td>
                <Td>
                  <Badge variant={item.status === 'active' ? 'success' : 'neutral'}>{item.status}</Badge>
                </Td>
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

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {displayItems.length} of {items.length} items</span>
          <span>Total Value: <strong className="text-slate-700">{formatCurrency(totalValue)}</strong></span>
        </div>
      </Card>

      {/* New Item Modal */}
      <Modal open={newItem} onClose={() => setNewItem(false)} title="Add New Item to Master" size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewItem(false)}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSave}>Save Item</Button>
        </>}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Divider label="Basic Information" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU / Item Code *" required value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. ELE-PCB-001" />
            <Input label="Item Name *" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full descriptive name" />
            <Select label="Category *" value={form.category} onChange={e => setForm(f => ({ ...f, category: (e.target as any).value }))}
              options={ITEM_CATEGORIES.map(c => ({ label: c, value: c }))} />
            <Input label="Sub-Category" value={form.sub_category} onChange={e => setForm(f => ({ ...f, sub_category: e.target.value }))} placeholder="Optional" />
            <Select label="Item Type *" value={form.item_type} onChange={e => setForm(f => ({ ...f, item_type: (e.target as any).value }))}
              options={[{ label: 'Domestic (India)', value: 'domestic' }, { label: 'Imported (Foreign)', value: 'imported' }, { label: 'Both', value: 'both' }]} />
            <Input label="Country of Origin" value={form.country_of_origin} onChange={e => setForm(f => ({ ...f, country_of_origin: e.target.value }))} placeholder="e.g. China, Germany" />
          </div>
          <Textarea label="Description" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />

          <Divider label="Units & Taxation" />
          <div className="grid grid-cols-3 gap-4">
            <Select label="Primary UOM *" value={form.uom} onChange={e => setForm(f => ({ ...f, uom: (e.target as any).value }))}
              options={UOM_OPTIONS.map(u => ({ label: u, value: u }))} />
            <Select label="Secondary UOM" value={form.secondary_uom} onChange={e => setForm(f => ({ ...f, secondary_uom: (e.target as any).value }))}
              options={[{ label: '— None —', value: '' }, ...UOM_OPTIONS.map(u => ({ label: u, value: u }))]} />
            <Input label="HSN / SAC Code" value={form.hsn_code} onChange={e => setForm(f => ({ ...f, hsn_code: e.target.value }))} placeholder="8-digit HSN" />
            <Select label="GST Rate %" value={form.gst_rate} onChange={e => setForm(f => ({ ...f, gst_rate: (e.target as any).value }))}
              options={GST_RATES.map(r => ({ label: `${r}%`, value: r }))} />
            {form.item_type !== 'domestic' && (
              <Input label="Customs Tariff (HS Code)" value={form.customs_tariff} onChange={e => setForm(f => ({ ...f, customs_tariff: e.target.value }))} placeholder="10-digit HS code" />
            )}
          </div>

          <Divider label="Valuation & Costing" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Valuation Method" value={form.valuation_method} onChange={e => setForm(f => ({ ...f, valuation_method: (e.target as any).value }))}
              options={[{ label: 'Moving Average', value: 'moving_avg' }, { label: 'FIFO', value: 'fifo' }, { label: 'Standard Cost', value: 'standard_cost' }]} />
            <Input label="Standard Cost (₹)" type="number" value={form.standard_cost} onChange={e => setForm(f => ({ ...f, standard_cost: e.target.value }))} placeholder="0" />
          </div>

          <Divider label="Inventory Control" />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Reorder Level" type="number" value={form.reorder_level} onChange={e => setForm(f => ({ ...f, reorder_level: e.target.value }))} placeholder="Trigger reorder at" />
            <Input label="Reorder Qty" type="number" value={form.reorder_qty} onChange={e => setForm(f => ({ ...f, reorder_qty: e.target.value }))} placeholder="How much to order" />
            <Input label="Safety Stock" type="number" value={form.safety_stock} onChange={e => setForm(f => ({ ...f, safety_stock: e.target.value }))} placeholder="Buffer stock" />
            <Input label="Max Stock" type="number" value={form.max_stock} onChange={e => setForm(f => ({ ...f, max_stock: e.target.value }))} placeholder="Max storage" />
            <Input label="Lead Time (days)" type="number" value={form.lead_time_days} onChange={e => setForm(f => ({ ...f, lead_time_days: e.target.value }))} />
            <Input label="Shelf Life (days)" type="number" value={form.shelf_life_days} onChange={e => setForm(f => ({ ...f, shelf_life_days: e.target.value }))} placeholder="Leave blank if N/A" />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.lot_controlled} onChange={e => setForm(f => ({ ...f, lot_controlled: e.target.checked }))} className="rounded" />
              <span className="text-slate-700">Lot-controlled</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.batch_controlled} onChange={e => setForm(f => ({ ...f, batch_controlled: e.target.checked }))} className="rounded" />
              <span className="text-slate-700">Batch-controlled</span>
            </label>
          </div>
          <Input label="Weight (kg)" type="number" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} placeholder="Unit weight in kg" />
        </div>
      </Modal>
    </div>
  )
}
