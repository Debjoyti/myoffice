'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, SearchInput, Modal, Input, Select, Textarea
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import {
  Cpu, Plus, Download, Eye, Edit2, TrendingDown, BarChart3,
  AlertTriangle, CheckCircle2, RefreshCw, Wrench
} from 'lucide-react'

const MOCK_ASSETS = [
  { id: 'FA-001', code: 'VEH-001', name: 'Toyota Innova Crysta', category: 'Vehicle', location: 'HQ Pune', vendor: 'Toyota India', purchase_date: '2023-04-01', cost: 2200000, accumulated_dep: 660000, wdv: 1540000, dep_rate: 15, status: 'active' },
  { id: 'FA-002', code: 'COMP-012', name: 'Dell XPS 15 Laptops (12 units)', category: 'Computer Equipment', location: 'IT Dept', vendor: 'Dell India', purchase_date: '2024-01-15', cost: 1440000, accumulated_dep: 432000, wdv: 1008000, dep_rate: 40, status: 'active' },
  { id: 'FA-003', code: 'FURN-005', name: 'Workstations & Chairs Set', category: 'Furniture', location: 'Office Floor 2', vendor: 'Durian Furniture', purchase_date: '2023-06-01', cost: 650000, accumulated_dep: 130000, wdv: 520000, dep_rate: 10, status: 'active' },
  { id: 'FA-004', code: 'MACH-003', name: 'CNC Milling Machine', category: 'Plant & Machinery', location: 'Factory — Plant 1', vendor: 'BFW India', purchase_date: '2022-10-01', cost: 4500000, accumulated_dep: 1350000, wdv: 3150000, dep_rate: 15, status: 'active' },
  { id: 'FA-005', code: 'ELEC-008', name: 'HVAC System', category: 'Electrical Fittings', location: 'Factory — Plant 1', vendor: 'Daikin India', purchase_date: '2023-03-15', cost: 380000, accumulated_dep: 76000, wdv: 304000, dep_rate: 10, status: 'active' },
  { id: 'FA-006', code: 'SOFT-001', name: 'SAP ERP License (5 yr)', category: 'Intangible — Software', location: 'All Depts', vendor: 'SAP India', purchase_date: '2023-04-01', cost: 1800000, accumulated_dep: 720000, wdv: 1080000, dep_rate: 25, status: 'active' },
  { id: 'FA-007', code: 'VEH-002', name: 'Mahindra Bolero (Old)', category: 'Vehicle', location: 'Disposal', vendor: 'Mahindra', purchase_date: '2020-01-01', cost: 800000, accumulated_dep: 800000, wdv: 0, dep_rate: 15, status: 'disposed' },
]

const MOCK_SCHEDULE = [
  { category: 'Buildings', rate: 5, method: 'SLM', useful_life: '30 years' },
  { category: 'Plant & Machinery', rate: 15, method: 'WDV', useful_life: '15–25 years' },
  { category: 'Computer Equipment', rate: 40, method: 'WDV', useful_life: '3–6 years' },
  { category: 'Furniture & Fixtures', rate: 10, method: 'WDV', useful_life: '10 years' },
  { category: 'Vehicles', rate: 15, method: 'WDV', useful_life: '8–10 years' },
  { category: 'Electrical Installations', rate: 10, method: 'WDV', useful_life: '10 years' },
  { category: 'Intangible Assets', rate: 25, method: 'SLM', useful_life: '5 years' },
]

const MOCK_DEP_SCHEDULE = [
  { month: 'Apr 2026', vehicles: 19250, computers: 33600, furniture: 4333, machinery: 39375, others: 11500, total: 108058 },
  { month: 'May 2026', vehicles: 19250, computers: 33600, furniture: 4333, machinery: 39375, others: 11500, total: 108058 },
  { month: 'Jun 2026', vehicles: 19250, computers: 33600, furniture: 4333, machinery: 39375, others: 11500, total: 108058 },
]

const CAT_COLOR: Record<string, string> = {
  'Vehicle': 'bg-blue-50 text-blue-700',
  'Computer Equipment': 'bg-violet-50 text-violet-700',
  'Furniture': 'bg-amber-50 text-amber-700',
  'Plant & Machinery': 'bg-slate-100 text-slate-700',
  'Electrical Fittings': 'bg-emerald-50 text-emerald-700',
  'Intangible — Software': 'bg-pink-50 text-pink-700',
}

const STATUS_VARIANT: Record<string, any> = { active: 'success', disposed: 'neutral', scrapped: 'danger', under_maintenance: 'warning' }

export default function FixedAssetsPage() {
  const [tab, setTab] = useState('register')
  const [search, setSearch] = useState('')
  const [newAsset, setNewAsset] = useState(false)

  const activeAssets = MOCK_ASSETS.filter(a => a.status === 'active')
  const totalCost = activeAssets.reduce((s, a) => s + a.cost, 0)
  const totalAccDep = activeAssets.reduce((s, a) => s + a.accumulated_dep, 0)
  const totalWDV = activeAssets.reduce((s, a) => s + a.wdv, 0)
  const monthlyDep = MOCK_DEP_SCHEDULE[0]?.total ?? 0

  const filtered = MOCK_ASSETS.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Fixed Assets"
        description="Asset register, depreciation schedule, disposals, and capitalization (Companies Act 2013)"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export FA Register</Button>
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewAsset(true)}>Capitalize Asset</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Gross Block (Cost)" value={formatCurrency(totalCost)} icon={<Cpu className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="Accumulated Depreciation" value={formatCurrency(totalAccDep)} icon={<TrendingDown className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
        <StatCard label="Net Block (WDV)" value={formatCurrency(totalWDV)} icon={<BarChart3 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Monthly Depreciation" value={formatCurrency(monthlyDep)} icon={<RefreshCw className="h-4 w-4" />} />
      </div>

      <TabBar
        tabs={[
          { id: 'register', label: 'Asset Register', count: MOCK_ASSETS.length },
          { id: 'depreciation', label: 'Depreciation' },
          { id: 'schedule', label: 'Rate Schedule' },
          { id: 'summary', label: 'Block Summary' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'register' && (
        <Card padding="none">
          <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
            <SearchInput placeholder="Search assets..." value={search} onChange={setSearch} className="w-72" />
            <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} className="ml-auto" onClick={() => setNewAsset(true)}>Capitalize</Button>
          </div>
          <Table>
            <Thead>
              <tr><Th>Asset Code</Th><Th>Asset Name</Th><Th>Category</Th><Th>Location</Th><Th>Purchase Date</Th><Th align="right">Cost</Th><Th align="right">Acc. Dep.</Th><Th align="right">WDV</Th><Th>Dep%</Th><Th>Status</Th><Th></Th></tr>
            </Thead>
            <Tbody>
              {filtered.map(a => (
                <Tr key={a.id}>
                  <Td><span className="font-mono text-xs font-bold text-blue-600">{a.code}</span></Td>
                  <Td>
                    <p className="font-medium text-slate-800">{a.name}</p>
                    <p className="text-[10px] text-slate-400">{a.vendor}</p>
                  </Td>
                  <Td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLOR[a.category] ?? 'bg-slate-100 text-slate-600'}`}>{a.category}</span></Td>
                  <Td><span className="text-xs text-slate-500">{a.location}</span></Td>
                  <Td><span className="text-xs text-slate-500">{a.purchase_date}</span></Td>
                  <Td align="right"><span className="data-value">{formatCurrency(a.cost)}</span></Td>
                  <Td align="right"><span className="text-amber-600 font-medium">{formatCurrency(a.accumulated_dep)}</span></Td>
                  <Td align="right"><span className="font-bold text-emerald-700">{formatCurrency(a.wdv)}</span></Td>
                  <Td><span className="text-sm">{a.dep_rate}%</span></Td>
                  <Td><Badge variant={STATUS_VARIANT[a.status]}>{a.status}</Badge></Td>
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
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex gap-6 text-xs">
            <span className="text-slate-500">Gross Block: <strong>{formatCurrency(totalCost)}</strong></span>
            <span className="text-slate-500">Acc. Depreciation: <strong className="text-amber-600">{formatCurrency(totalAccDep)}</strong></span>
            <span className="text-slate-500">Net Block (WDV): <strong className="text-emerald-700">{formatCurrency(totalWDV)}</strong></span>
          </div>
        </Card>
      )}

      {tab === 'depreciation' && (
        <Card padding="none">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Monthly Depreciation Schedule — FY 2026-27</p>
            <p className="text-xs text-slate-400 mt-0.5">WDV method as per Schedule II, Companies Act 2013</p>
          </div>
          <Table>
            <Thead>
              <tr><Th>Month</Th><Th align="right">Vehicles</Th><Th align="right">Computers</Th><Th align="right">Furniture</Th><Th align="right">Plant & Mach.</Th><Th align="right">Others</Th><Th align="right">Total</Th></tr>
            </Thead>
            <Tbody>
              {MOCK_DEP_SCHEDULE.map(d => (
                <Tr key={d.month}>
                  <Td><span className="font-medium text-slate-800">{d.month}</span></Td>
                  <Td align="right"><span className="text-sm">{formatCurrency(d.vehicles)}</span></Td>
                  <Td align="right"><span className="text-sm">{formatCurrency(d.computers)}</span></Td>
                  <Td align="right"><span className="text-sm">{formatCurrency(d.furniture)}</span></Td>
                  <Td align="right"><span className="text-sm">{formatCurrency(d.machinery)}</span></Td>
                  <Td align="right"><span className="text-sm">{formatCurrency(d.others)}</span></Td>
                  <Td align="right"><span className="font-bold text-blue-700">{formatCurrency(d.total)}</span></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500">Annual Depreciation Estimate: <strong>{formatCurrency(monthlyDep * 12)}</strong></p>
          </div>
        </Card>
      )}

      {tab === 'schedule' && (
        <Card>
          <CardHeader title="Depreciation Rate Schedule" description="As per Schedule II, Companies Act 2013" />
          <Table>
            <Thead><tr><Th>Asset Category</Th><Th>Dep. Rate</Th><Th>Method</Th><Th>Useful Life</Th></tr></Thead>
            <Tbody>
              {MOCK_SCHEDULE.map(s => (
                <Tr key={s.category}>
                  <Td><span className="font-medium text-slate-800">{s.category}</span></Td>
                  <Td><span className="font-bold text-blue-600">{s.rate}%</span></Td>
                  <Td><Badge variant={s.method === 'WDV' ? 'info' : 'neutral'}>{s.method}</Badge></Td>
                  <Td><span className="text-sm text-slate-500">{s.useful_life}</span></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {tab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Block Summary by Category" />
            <div className="space-y-3 mt-3">
              {['Vehicle', 'Computer Equipment', 'Plant & Machinery', 'Furniture', 'Electrical Fittings', 'Intangible — Software'].map(cat => {
                const items = MOCK_ASSETS.filter(a => a.category === cat && a.status === 'active')
                const cost = items.reduce((s, a) => s + a.cost, 0)
                const wdv = items.reduce((s, a) => s + a.wdv, 0)
                return cost > 0 ? (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium">{cat}</span>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(wdv)}</p>
                        <p className="text-[10px] text-slate-400">Cost: {formatCurrency(cost)}</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round((wdv / cost) * 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{Math.round((wdv / cost) * 100)}% remaining</p>
                  </div>
                ) : null
              })}
            </div>
          </Card>
          <Card>
            <CardHeader title="Upcoming Major Replacements" />
            <div className="space-y-3 mt-2">
              {MOCK_ASSETS.filter(a => a.status === 'active' && (a.wdv / a.cost) < 0.4).map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.name}</p>
                    <p className="text-xs text-slate-400">WDV: {formatCurrency(a.wdv)} ({Math.round((a.wdv / a.cost) * 100)}% remaining)</p>
                  </div>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Modal open={newAsset} onClose={() => setNewAsset(false)} title="Capitalize Fixed Asset" size="lg"
        footer={<><Button variant="ghost" size="sm" onClick={() => setNewAsset(false)}>Cancel</Button><Button size="sm">Capitalize Asset</Button></>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Asset Name" placeholder="e.g. Dell XPS Laptop" required />
            <Input label="Asset Code" placeholder="Auto-generated" />
            <Select label="Category" options={['Vehicle','Computer Equipment','Plant & Machinery','Furniture','Electrical Fittings','Intangible — Software','Land & Building','Tools & Equipment'].map(c => ({ label: c, value: c }))} />
            <Input label="Location" placeholder="Department / location" />
            <Input label="Vendor / Supplier" placeholder="Vendor name" />
            <Input label="Purchase Date" type="date" required />
            <Input label="Gross Cost (₹)" type="number" required />
            <Input label="Useful Life (years)" type="number" placeholder="5" />
            <Select label="Depreciation Method" options={[{ label: 'Written Down Value (WDV)', value: 'WDV' }, { label: 'Straight Line Method (SLM)', value: 'SLM' }]} />
            <Input label="Depreciation Rate (%)" type="number" placeholder="15" />
          </div>
          <Input label="Serial Number / Registration" placeholder="e.g. VIN, Asset tag" />
          <Textarea label="Description" rows={2} placeholder="Optional notes about the asset" />
        </div>
      </Modal>
    </div>
  )
}
