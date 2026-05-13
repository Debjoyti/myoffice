'use client'

import { useState } from 'react'
import { PageHeader, Card, CardHeader, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td, StatCard, TabBar, Modal } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Banknote, Users, CheckCircle2, Clock, Download, Play, FileText } from 'lucide-react'

const PAYROLL = [
  { name: 'Priya Sharma', empId: 'EMP-001', dept: 'Engineering', basic: 900000, hra: 360000, allowances: 180000, pf: 108000, tds: 85000, gross: 1440000, net: 1247000, status: 'Processed' },
  { name: 'Rahul Mehta', empId: 'EMP-002', dept: 'Finance', basic: 600000, hra: 240000, allowances: 120000, pf: 72000, tds: 42000, gross: 960000, net: 846000, status: 'Processed' },
  { name: 'Ananya Iyer', empId: 'EMP-003', dept: 'HR', basic: 700000, hra: 280000, allowances: 140000, pf: 84000, tds: 58000, gross: 1120000, net: 978000, status: 'Pending' },
  { name: 'Karan Singh', empId: 'EMP-004', dept: 'Sales', basic: 500000, hra: 200000, allowances: 100000, pf: 60000, tds: 28000, gross: 800000, net: 712000, status: 'On Hold' },
  { name: 'Divya Nair', empId: 'EMP-005', dept: 'Engineering', basic: 1100000, hra: 440000, allowances: 220000, pf: 132000, tds: 145000, gross: 1760000, net: 1483000, status: 'Pending' },
  { name: 'Amit Patel', empId: 'EMP-006', dept: 'Operations', basic: 800000, hra: 320000, allowances: 160000, pf: 96000, tds: 72000, gross: 1280000, net: 1112000, status: 'Processed' },
]

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  Processed: 'success', Pending: 'warning', 'On Hold': 'danger',
}

const totalGross = PAYROLL.reduce((s, r) => s + r.gross / 12, 0)
const totalNet = PAYROLL.reduce((s, r) => s + r.net / 12, 0)
const totalPF = PAYROLL.reduce((s, r) => s + r.pf / 12, 0)
const totalTDS = PAYROLL.reduce((s, r) => s + r.tds / 12, 0)

export default function PayrollPage() {
  const [tab, setTab] = useState('summary')
  const [runOpen, setRunOpen] = useState(false)
  const [selected, setSelected] = useState<typeof PAYROLL[0] | null>(null)

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Payroll"
        description="Manage salary processing, payslips, and statutory compliance"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button size="sm" leftIcon={<Play className="h-3.5 w-3.5" />} onClick={() => setRunOpen(true)}>Run Payroll</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Gross Payroll" value={formatCurrency(totalGross)} icon={<Banknote className="h-4 w-4" />} delta={{ value: '2.1%', positive: true }} />
        <StatCard label="Net Disbursement" value={formatCurrency(totalNet)} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard label="PF Contribution" value={formatCurrency(totalPF)} icon={<Users className="h-4 w-4" />} iconColor="bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400" />
        <StatCard label="TDS Deducted" value={formatCurrency(totalTDS)} icon={<Clock className="h-4 w-4" />} iconColor="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Processed', count: PAYROLL.filter(r => r.status === 'Processed').length, variant: 'success' as const },
          { label: 'Pending', count: PAYROLL.filter(r => r.status === 'Pending').length, variant: 'warning' as const },
          { label: 'On Hold', count: PAYROLL.filter(r => r.status === 'On Hold').length, variant: 'danger' as const },
        ].map(s => (
          <Card key={s.label} className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{s.count}</p>
            </div>
            <Badge variant={s.variant} dot>{s.label}</Badge>
          </Card>
        ))}
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">May 2026 — Payroll Register</h3>
              <p className="text-xs text-slate-500 mt-0.5">Payroll cycle: 1–31 May 2026</p>
            </div>
            <Badge variant="warning" dot>Processing</Badge>
          </div>
        </div>

        <TabBar
          tabs={[
            { id: 'summary', label: 'Summary' },
            { id: 'detailed', label: 'Detailed View' },
          ]}
          active={tab}
          onChange={setTab}
        />

        <Table>
          <Thead>
            <tr>
              <Th>Employee</Th>
              <Th>Dept</Th>
              {tab === 'detailed' && <><Th align="right">Basic</Th><Th align="right">HRA</Th><Th align="right">PF Ded.</Th><Th align="right">TDS</Th></>}
              <Th align="right">Gross/mo</Th>
              <Th align="right">Net/mo</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {PAYROLL.map(r => (
              <Tr key={r.empId} onClick={() => setSelected(r)}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={r.name} size="sm" />
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{r.name}</p>
                      <p className="text-xs font-mono text-slate-400">{r.empId}</p>
                    </div>
                  </div>
                </Td>
                <Td><span className="text-slate-500">{r.dept}</span></Td>
                {tab === 'detailed' && (
                  <>
                    <Td align="right"><span className="data-value text-xs">{formatCurrency(r.basic / 12)}</span></Td>
                    <Td align="right"><span className="data-value text-xs">{formatCurrency(r.hra / 12)}</span></Td>
                    <Td align="right"><span className="data-value text-xs text-red-600">−{formatCurrency(r.pf / 12)}</span></Td>
                    <Td align="right"><span className="data-value text-xs text-red-600">−{formatCurrency(r.tds / 12)}</span></Td>
                  </>
                )}
                <Td align="right"><span className="font-medium data-value">{formatCurrency(r.gross / 12)}</span></Td>
                <Td align="right"><span className="font-bold data-value text-emerald-600">{formatCurrency(r.net / 12)}</span></Td>
                <Td><Badge variant={STATUS_COLOR[r.status]} dot>{r.status}</Badge></Td>
                <Td>
                  <Button variant="ghost" size="sm" leftIcon={<FileText className="h-3 w-3" />}
                    onClick={e => { e.stopPropagation(); }}>Payslip</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500">Total: {PAYROLL.length} employees</p>
          <div className="flex items-center gap-6 text-xs">
            <span className="text-slate-500">Gross: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(totalGross)}</span></span>
            <span className="text-slate-500">Net: <span className="font-bold text-emerald-600">{formatCurrency(totalNet)}</span></span>
          </div>
        </div>
      </Card>

      {/* Run Payroll Modal */}
      <Modal open={runOpen} onClose={() => setRunOpen(false)} title="Run Payroll — May 2026">
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">⚠ Pre-flight Check</p>
            <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-400">
              <li>• {PAYROLL.filter(r => r.status === 'Pending').length} employees have pending payroll</li>
              <li>• 1 employee is on hold — will be excluded</li>
              <li>• Attendance data is synced through 12 May 2026</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Payroll Month', 'May 2026'], ['Total Employees', '5 (excl. 1 on hold)'],
              ['Gross Payout', formatCurrency(totalGross)], ['Net Disbursement', formatCurrency(totalNet)],
            ].map(([l, v]) => (
              <div key={l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-400">{l}</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" leftIcon={<Play className="h-3.5 w-3.5" />}>Confirm & Run Payroll</Button>
            <Button variant="ghost" size="sm" onClick={() => setRunOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
