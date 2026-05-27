'use client'

import { useState, useMemo } from 'react'
import {
  PageHeader, Card, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, SearchInput, Modal, Input, Select, EmptyState
} from '@/components/ui'
import { Laptop, Monitor, Smartphone, Package, Plus, FlaskConical } from 'lucide-react'

type AssetType = 'Laptop' | 'Monitor' | 'Phone' | 'Furniture' | 'Other'
type AssetStatus = 'In Use' | 'Available' | 'Under Repair' | 'Retired'

type Asset = {
  id: string; name: string; type: AssetType; serial: string
  assignedTo: string | null; value: number; purchased: string; status: AssetStatus
}

const ASSETS: Asset[] = [
  { id: 'AST-001', name: 'MacBook Pro 14"', type: 'Laptop', serial: 'MBP-X1234', assignedTo: 'Priya Sharma', value: 145000, purchased: '01 Jan 2025', status: 'In Use' },
  { id: 'AST-002', name: 'Dell 27" 4K Monitor', type: 'Monitor', serial: 'DLL-M9872', assignedTo: 'Rahul Mehta', value: 32000, purchased: '15 Mar 2025', status: 'In Use' },
  { id: 'AST-003', name: 'iPhone 15 Pro', type: 'Phone', serial: 'APL-IP9901', assignedTo: null, value: 89000, purchased: '01 Oct 2024', status: 'Available' },
  { id: 'AST-004', name: 'Lenovo ThinkPad X1', type: 'Laptop', serial: 'LNV-T5623', assignedTo: 'Karan Singh', value: 98000, purchased: '05 Jun 2024', status: 'In Use' },
  { id: 'AST-005', name: 'Ergonomic Chair', type: 'Furniture', serial: 'FRN-EC001', assignedTo: null, value: 18000, purchased: '20 Feb 2025', status: 'Under Repair' },
  { id: 'AST-006', name: 'MacBook Air M2', type: 'Laptop', serial: 'MBP-A8821', assignedTo: null, value: 115000, purchased: '01 Dec 2024', status: 'Available' },
]

const TYPE_ICON: Record<AssetType, React.ReactNode> = {
  Laptop: <Laptop className="h-4 w-4" />,
  Monitor: <Monitor className="h-4 w-4" />,
  Phone: <Smartphone className="h-4 w-4" />,
  Furniture: <Package className="h-4 w-4" />,
  Other: <Package className="h-4 w-4" />,
}

const STATUS_COLOR: Record<AssetStatus, 'success' | 'info' | 'warning' | 'neutral'> = {
  'In Use': 'success', Available: 'info', 'Under Repair': 'warning', Retired: 'neutral',
}

export default function AssetsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [newModal, setNewModal] = useState(false)

  const totalValue = ASSETS.reduce((s, a) => s + a.value, 0)
  const inUse = ASSETS.filter(a => a.status === 'In Use').length
  const available = ASSETS.filter(a => a.status === 'Available').length

  const filtered = useMemo(() => {
    return ASSETS.filter(a => {
      const matchType = typeFilter === 'All' || a.type === typeFilter
      const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.serial.toLowerCase().includes(search.toLowerCase()) ||
        (a.assignedTo?.toLowerCase().includes(search.toLowerCase()) ?? false)
      return matchType && matchSearch
    })
  }, [search, typeFilter])

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
        <FlaskConical className="h-3.5 w-3.5 flex-shrink-0" />
        <span><strong>Preview mode</strong> — Asset data is illustrative. Full asset tracking with depreciation is on the roadmap.</span>
      </div>

      <PageHeader
        title="Asset Management"
        description="Track company hardware, software, and equipment assignments"
        actions={<Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewModal(true)}>Add Asset</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Assets" value={ASSETS.length} icon={<Package className="h-4 w-4" />} iconColor="bg-blue-50 text-blue-600" />
        <StatCard label="In Use" value={inUse} icon={<Laptop className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard label="Available" value={available} icon={<Monitor className="h-4 w-4" />} iconColor="bg-violet-50 text-violet-600" />
        <StatCard label="Total Value" value={`₹${(totalValue / 100000).toFixed(1)}L`} icon={<Package className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-4 flex items-center gap-3 flex-wrap">
          <SearchInput placeholder="Search assets, serial numbers..." value={search} onChange={setSearch} className="w-72" />
          <div className="flex gap-1">
            {['All', 'Laptop', 'Monitor', 'Phone', 'Furniture'].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >{t}</button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="py-10"><EmptyState icon={<Package className="h-6 w-6" />} title="No assets found" /></div>
        ) : (
          <Table>
            <Thead><tr><Th>Asset</Th><Th>Type</Th><Th>Serial No.</Th><Th>Assigned To</Th><Th>Value</Th><Th>Purchased</Th><Th>Status</Th></tr></Thead>
            <Tbody>
              {filtered.map(a => (
                <Tr key={a.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        {TYPE_ICON[a.type]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{a.name}</p>
                        <p className="text-[11px] text-slate-400">{a.id}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><Badge variant="neutral" size="sm">{a.type}</Badge></Td>
                  <Td><span className="font-mono text-xs text-slate-600">{a.serial}</span></Td>
                  <Td>
                    {a.assignedTo ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={a.assignedTo} size="xs" />
                        <span className="text-xs text-slate-600">{a.assignedTo}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </Td>
                  <Td align="right"><span className="text-xs font-semibold text-slate-700 tabular-nums">₹{a.value.toLocaleString('en-IN')}</span></Td>
                  <Td><span className="text-xs text-slate-500">{a.purchased}</span></Td>
                  <Td><Badge variant={STATUS_COLOR[a.status]} dot size="sm">{a.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal open={newModal} onClose={() => setNewModal(false)} title="Add Asset" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setNewModal(false)}>Cancel</Button>
          <Button size="sm">Add Asset</Button>
        </>}
      >
        <div className="space-y-4">
          <Input label="Asset Name" placeholder="e.g. MacBook Pro 14 inch" required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" options={[
              { label: 'Laptop', value: 'Laptop' }, { label: 'Monitor', value: 'Monitor' },
              { label: 'Phone', value: 'Phone' }, { label: 'Furniture', value: 'Furniture' }, { label: 'Other', value: 'Other' },
            ]} />
            <Input label="Serial Number" placeholder="SN-XXXXXX" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Purchase Value (₹)" type="number" placeholder="0" />
            <Input label="Purchase Date" type="date" />
          </div>
          <Input label="Assign To (optional)" placeholder="Employee name" />
        </div>
      </Modal>
    </div>
  )
}
