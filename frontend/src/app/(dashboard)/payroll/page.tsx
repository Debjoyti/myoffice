'use client'

import { useState } from 'react'
import {
  PageHeader, Card, CardHeader, Badge, Avatar, Button, Table, Thead, Th, Tbody, Tr, Td,
  StatCard, TabBar, Modal, DetailGrid, Divider, ProgressBar, Alert
} from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { Banknote, Users, CheckCircle2, Clock, Download, Play, FileText, AlertTriangle, IndianRupee } from 'lucide-react'

type PayrollRow = {
  name: string; empId: string; dept: string; basic: number; hra: number;
  allowances: number; pf: number; tds: number; gross: number; net: number
  status: 'Processed' | 'Pending' | 'On Hold'
}

const PAYROLL: PayrollRow[] = [
  { name: 'Priya Sharma', empId: 'EMP-001', dept: 'Engineering', basic: 900000, hra: 360000, allowances: 180000, pf: 108000, tds: 85000, gross: 1440000, net: 1247000, status: 'Processed' },
  { name: 'Rahul Mehta', empId: 'EMP-002', dept: 'Finance', basic: 600000, hra: 240000, allowances: 120000, pf: 72000, tds: 42000, gross: 960000, net: 846000, status: 'Processed' },
  { name: 'Ananya Iyer', empId: 'EMP-003', dept: 'HR', basic: 700000, hra: 280000, allowances: 140000, pf: 84000, tds: 58000, gross: 1120000, net: 978000, status: 'Pending' },
  { name: 'Karan Singh', empId: 'EMP-004', dept: 'Sales', basic: 500000, hra: 200000, allowances: 100000, pf: 60000, tds: 28000, gross: 800000, net: 712000, status: 'On Hold' },
  { name: 'Divya Nair', empId: 'EMP-005', dept: 'Engineering', basic: 1100000, hra: 440000, allowances: 220000, pf: 132000, tds: 145000, gross: 1760000, net: 1483000, status: 'Pending' },
  { name: 'Amit Patel', empId: 'EMP-006', dept: 'Operations', basic: 800000, hra: 320000, allowances: 160000, pf: 96000, tds: 72000, gross: 1280000, net: 1112000, status: 'Processed' },
  { name: 'Sneha Reddy', empId: 'EMP-007', dept: 'Sales', basic: 900000, hra: 360000, allowances: 180000, pf: 108000, tds: 89000, gross: 1440000, net: 1243000, status: 'Pending' },
]

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'danger'> = {
  Processed: 'success', Pending: 'warning', 'On Hold': 'danger',
}

const totalGross = PAYROLL.reduce((s, r) => s + r.gross / 12, 0)
const totalNet = PAYROLL.reduce((s, r) => s + r.net / 12, 0)
const totalPF = PAYROLL.reduce((s, r) => s + r.pf / 12, 0)
const totalTDS = PAYROLL.reduce((s, r) => s + r.tds / 12, 0)

const processedCount = PAYROLL.filter(r => r.status === 'Processed').length

export default function PayrollPage() {
  const [tab, setTab] = useState('summary')
  const [runOpen, setRunOpen] = useState(false)
  const [selected, setSelected] = useState<PayrollRow | null>(null)
  const [running, setRunning] = useState(false)

  const handleRun = () => {
    setRunning(true)
    setTimeout(() => { setRunning(false); setRunOpen(false) }, 2000)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title="Payroll"
        description="Salary processing, payslips, and statutory compliance"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Export</Button>
            <Button size="sm" leftIcon={<Play className="h-3.5 w-3.5" />} onClick={() => setRunOpen(true)}>Run Payroll</Button>
          </>
        }
      />

      {PAYROLL.some(r => r.status === 'On Hold') && (
        <Alert variant="warning" title="Action Required">
          {PAYROLL.filter(r => r.status === 'On Hold').length} employee(s) have payroll on hold. Please resolve before processing.
        </Alert>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Gross Payroll" value={formatCurrency(totalGross)} icon={<Banknote className="h-4 w-4" />} delta={{ value: '2.1%', positive: true }} />
        <StatCard label="Net Disbursement" value={formatCurrency(totalNet)} icon={<IndianRupee className="h-4 w-4" />} iconColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <StatCard label="PF Contribution" value={formatCurrency(totalPF)} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400" />
        <StatCard label="TDS Deducted" value={formatCurrency(totalTDS)} icon={<FileText className="h-4 w-4" />} iconColor="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
      </div>

      {/* Processing status */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">May 2026 Processing Status</p>
            <p className="text-xs text-slate-500 mt-0.5">{processedCount} of {PAYROLL.length} employees processed</p>
          </div>
          <Badge variant={processedCount === PAYROLL.length ? 'success' : 'warning'}>
            {processedCount === PAYROLL.length ? 'Complete' : `${PAYROLL.length - processedCount} pending`}
          </Badge>
        </div>
        <ProgressBar value={processedCount} max={PAYROLL.length} color={processedCount === PAYROLL.length ? 'emerald' : 'amber'} size="md" showLabel />
      </Card>

      <TabBar
        tabs={[
          { id: 'summary', label: 'Payroll Register' },
          { id: 'statutory', label: 'Statutory Reports' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'summary' && (
        <Card padding="none">
          <Table>
            <Thead>
              <tr>
                <Th>Employee</Th><Th>Dept</Th><Th align="right">Gross</Th>
                <Th align="right">PF</Th><Th align="right">TDS</Th><Th align="right">Net Pay</Th>
                <Th>Status</Th>
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
                  <Td><Badge variant="neutral" size="sm">{r.dept}</Badge></Td>
                  <Td align="right"><span className="data-value text-sm">{formatCurrency(r.gross / 12)}</span></Td>
                  <Td align="right"><span className="data-value text-xs text-slate-500">{formatCurrency(r.pf / 12)}</span></Td>
                  <Td align="right"><span className="data-value text-xs text-slate-500">{formatCurrency(r.tds / 12)}</span></Td>
                  <Td align="right"><span className="data-value font-semibold text-emerald-600">{formatCurrency(r.net / 12)}</span></Td>
                  <Td><Badge variant={STATUS_COLOR[r.status]} dot>{r.status}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Total: <span className="font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(totalGross)}</span> gross · <span className="font-semibold text-emerald-600">{formatCurrency(totalNet)}</span> net
            </p>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Download Payslips</Button>
          </div>
        </Card>
      )}

      {tab === 'statutory' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Provident Fund (PF)', value: formatCurrency(totalPF * 2), note: 'Employee + Employer contribution', color: 'bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800' },
            { label: 'Tax Deducted at Source (TDS)', value: formatCurrency(totalTDS), note: 'Deposit by 7th of next month', color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' },
            { label: 'Professional Tax (PT)', value: formatCurrency(PAYROLL.length * 200), note: `${PAYROLL.length} employees × ₹200`, color: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' },
          ].map(s => (
            <div key={s.label} className={`rounded-lg border p-4 ${s.color}`}>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{s.label}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 data-value">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.note}</p>
            </div>
          ))}
        </div>
      )}

      {/* Payslip Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Payslip Details" size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-3.5 w-3.5" />}>Download PDF</Button>
        </>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar name={selected.name} size="lg" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{selected.name}</p>
                <p className="text-xs text-slate-500">{selected.dept} · {selected.empId}</p>
                <Badge variant={STATUS_COLOR[selected.status]} dot className="mt-1">{selected.status}</Badge>
              </div>
            </div>
            <Divider label="May 2026 Payslip" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Earnings</p>
                {[['Basic Salary', selected.basic / 12], ['HRA', selected.hra / 12], ['Allowances', selected.allowances / 12]].map(([l, v]) => (
                  <div key={l as string} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-600 dark:text-slate-400">{l as string}</span>
                    <span className="text-xs font-medium data-value">{formatCurrency(v as number)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1.5 font-semibold">
                  <span className="text-xs text-slate-800 dark:text-slate-200">Gross Pay</span>
                  <span className="text-xs data-value text-emerald-600">{formatCurrency(selected.gross / 12)}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Deductions</p>
                {[['Provident Fund', selected.pf / 12], ['TDS (Income Tax)', selected.tds / 12]].map(([l, v]) => (
                  <div key={l as string} className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-600 dark:text-slate-400">{l as string}</span>
                    <span className="text-xs font-medium data-value text-red-500">{formatCurrency(v as number)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-1.5 font-semibold">
                  <span className="text-xs text-slate-800 dark:text-slate-200">Net Pay</span>
                  <span className="text-xs data-value text-indigo-600">{formatCurrency(selected.net / 12)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Run Payroll Modal */}
      <Modal open={runOpen} onClose={() => setRunOpen(false)} title="Run Payroll — May 2026" size="md"
        footer={<>
          <Button variant="ghost" size="sm" onClick={() => setRunOpen(false)}>Cancel</Button>
          <Button size="sm" loading={running} onClick={handleRun}>Confirm & Process</Button>
        </>}
      >
        <div className="space-y-4">
          <Alert variant="info" title="Pre-flight checks">
            All attendance and reimbursement data has been synced. Review the summary below before processing.
          </Alert>
          <DetailGrid items={[
            { label: 'Pay Period', value: 'May 2026 (01–31 May)' },
            { label: 'Total Employees', value: PAYROLL.length },
            { label: 'Gross Disbursement', value: formatCurrency(totalGross) },
            { label: 'Net Disbursement', value: formatCurrency(totalNet) },
            { label: 'PF Contribution', value: formatCurrency(totalPF) },
            { label: 'TDS Payable', value: formatCurrency(totalTDS) },
          ]} />
          {PAYROLL.some(r => r.status === 'On Hold') && (
            <Alert variant="warning">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              {PAYROLL.filter(r => r.status === 'On Hold').length} employees are on hold and will be excluded from this run.
            </Alert>
          )}
        </div>
      </Modal>
    </div>
  )
}
