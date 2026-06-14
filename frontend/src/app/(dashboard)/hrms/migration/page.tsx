'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  PageHeader, Card, Badge, Button, Table, Thead, Th, Tbody, Tr, Td,
  Modal, Select, EmptyState, Alert, ProgressBar, Spinner,
} from '@/components/ui'
import { formatDate } from '@/lib/utils'
import {
  UploadCloud, Sparkles, Database, CheckCircle2,
  ArrowRight, RefreshCw, FileSpreadsheet, Wand2,
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────────────────────── */
type Migration = {
  id: string
  name: string
  source_system: string
  file_name: string | null
  status: string
  total_rows: number
  mapped_rows: number
  error_rows: number
  created_at: string
  completed_at: string | null
}

const SOURCE_OPTIONS = [
  { value: 'excel', label: 'Excel / Spreadsheet' },
  { value: 'sap',   label: 'SAP SuccessFactors / HCM' },
  { value: 'zoho',  label: 'Zoho People' },
  { value: 'csv',   label: 'CSV Export' },
  { value: 'other', label: 'Other HRMS' },
]

const STATUS_LABEL: Record<string, string> = {
  uploaded: 'Uploaded', mapping_suggested: 'AI Mapping Ready', mapping_confirmed: 'Mapping Confirmed',
  importing: 'Importing…', completed: 'Completed', completed_with_errors: 'Completed (with errors)', failed: 'Failed',
}
const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
  uploaded: 'neutral', mapping_suggested: 'info', mapping_confirmed: 'info',
  importing: 'warning', completed: 'success', completed_with_errors: 'warning', failed: 'danger',
}

const TARGET_FIELDS = [
  { key: 'external_employee_code', label: 'Employee Code (old system)', required: true },
  { key: 'full_name',              label: 'Full Name',                  required: true },
  { key: 'email',                  label: 'Work Email',                 required: true },
  { key: 'phone',                  label: 'Phone',                      required: false },
  { key: 'designation',            label: 'Designation',                required: false },
  { key: 'department',             label: 'Department',                 required: false },
  { key: 'employment_type',        label: 'Employment Type',            required: false },
  { key: 'date_of_joining',        label: 'Date of Joining',            required: false },
  { key: 'date_of_birth',          label: 'Date of Birth',              required: false },
  { key: 'pan_number',             label: 'PAN Number',                 required: false },
  { key: 'aadhaar_number',         label: 'Aadhaar Number',             required: false },
  { key: 'bank_account',           label: 'Bank Account',               required: false },
]

/* ── Upload Wizard Modal ─────────────────────────────────────────────────────── */
function UploadWizard({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep]           = useState<'upload' | 'mapping' | 'importing' | 'done'>('upload')
  const [sourceSystem, setSource] = useState('excel')
  const [busy, setBusy]           = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [migration, setMigration] = useState<Migration | null>(null)
  const [columns, setColumns]     = useState<string[]>([])
  const [mapping, setMapping]     = useState<Record<string, string | null>>({})
  const [aiNotes, setAiNotes]     = useState('')
  const [progress, setProgress]   = useState({ imported: 0, errors: 0, total: 0 })

  useEffect(() => {
    if (!open) {
      setStep('upload'); setBusy(false); setError(null); setMigration(null)
      setColumns([]); setMapping({}); setAiNotes(''); setProgress({ imported: 0, errors: 0, total: 0 })
    }
  }, [open])

  /* Step 1: upload + AI mapping suggestion */
  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Please choose a file to upload'); return }
    setBusy(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', file.name)
      fd.append('source_system', sourceSystem)
      const res = await fetch('/api/v1/migrations', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')

      setMigration(data.migration)
      setColumns(data.source_columns ?? [])
      setMapping(data.suggested_mapping ?? {})
      setAiNotes(data.ai_notes ?? data.mapping_error ?? '')
      setProgress(p => ({ ...p, total: data.migration.total_rows }))
      setStep('mapping')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  /* Step 2: confirm mapping */
  const handleConfirmMapping = async () => {
    if (!migration) return
    const missingRequired = TARGET_FIELDS.filter(f => f.required && !mapping[f.key])
    if (missingRequired.length) {
      setError(`Please map required field(s): ${missingRequired.map(f => f.label).join(', ')}`)
      return
    }
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/v1/migrations/${migration.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_mapping: mapping }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.formErrors?.[0] ?? data.error ?? 'Could not confirm mapping')
      setStep('importing')
      runImport(migration.id)
    } catch (err: any) {
      setError(err.message)
      setBusy(false)
    }
  }

  /* Step 3: drive the batched commit endpoint until done */
  const runImport = async (migrationId: string) => {
    setBusy(true)
    try {
      for (;;) {
        const res = await fetch(`/api/v1/migrations/${migrationId}/commit`, { method: 'POST' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Import failed')
        setProgress({ imported: data.total_imported, errors: data.total_errors, total: migration?.total_rows ?? data.total_imported + data.total_errors + data.remaining })
        if (data.done) break
      }
      setStep('done')
      onDone()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!migration && step !== 'upload') return null

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} size="xl"
      title="Onboard a Company — Bulk Roster Import"
      footer={
        step === 'upload' ? (
          <>
            <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button onClick={handleUpload} loading={busy} leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
              Upload &amp; Let AI Map Columns
            </Button>
          </>
        ) : step === 'mapping' ? (
          <>
            <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button onClick={handleConfirmMapping} loading={busy} leftIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Confirm Mapping &amp; Import {migration?.total_rows?.toLocaleString()} Records
            </Button>
          </>
        ) : step === 'importing' ? (
          <Button variant="outline" disabled>Importing — please keep this open…</Button>
        ) : (
          <Button onClick={onClose}>Done</Button>
        )
      }
    >
      {error && <div className="mb-4"><Alert variant="danger">{error}</Alert></div>}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5 text-xs font-medium">
        {(['upload', 'mapping', 'importing', 'done'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-full flex items-center justify-center ${
              step === s ? 'bg-blue-600 text-white' : (['upload','mapping','importing','done'].indexOf(step) > i ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400')
            }`}>{['upload','mapping','importing','done'].indexOf(step) > i ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}</span>
            <span className={step === s ? 'text-slate-800' : 'text-slate-400'}>
              {s === 'upload' ? 'Upload Roster' : s === 'mapping' ? 'AI Column Mapping' : s === 'importing' ? 'Importing' : 'Done'}
            </span>
            {i < 3 && <div className="w-6 h-px bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* STEP 1 — Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <Alert variant="info" title="How this works">
            Export your existing roster from SAP, Zoho, or any spreadsheet — column names don&apos;t need to
            match ours. Claude reads the header row and a few sample rows, suggests how each of your columns
            maps onto our schema, and then we import every row in fast batches. No manual data entry, even
            for rosters of 20,000+ employees.
          </Alert>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1.5 block">Source system</label>
            <Select value={sourceSystem} onChange={e => setSource(e.target.value)} options={SOURCE_OPTIONS} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1.5 block">Roster file (.xlsx, .xls, .csv)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-300 transition-colors">
              <UploadCloud className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="text-sm mx-auto" />
              <p className="text-xs text-slate-400 mt-2">One sheet, header row in the first row. Up to ~50,000 rows.</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 — AI mapping review */}
      {step === 'mapping' && migration && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <FileSpreadsheet className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-800">{migration.file_name}</span>
            <Badge variant="neutral">{migration.total_rows.toLocaleString()} rows detected</Badge>
          </div>
          {aiNotes && (
            <Alert variant="info" title="Claude's notes">
              <span className="flex items-start gap-1.5"><Wand2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />{aiNotes}</span>
            </Alert>
          )}
          <p className="text-xs text-slate-500">
            Review the AI-suggested mapping below. Adjust anything that looks off, then confirm to start the import.
          </p>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <Thead>
                <Tr><Th>Our Field</Th><Th>Maps From (their column)</Th></Tr>
              </Thead>
              <Tbody>
                {TARGET_FIELDS.map(f => (
                  <Tr key={f.key}>
                    <Td>
                      <span className="font-medium text-slate-700">{f.label}</span>
                      {f.required && <span className="text-red-500 ml-1">*</span>}
                    </Td>
                    <Td>
                      <select
                        value={mapping[f.key] ?? ''}
                        onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value || null }))}
                        className="h-8 rounded-md border border-slate-200 bg-white text-sm text-slate-700 px-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full max-w-xs"
                      >
                        <option value="">— Not mapped / skip —</option>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        </div>
      )}

      {/* STEP 3 — Importing */}
      {step === 'importing' && (
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <Spinner /> <p className="text-sm text-slate-600">Importing employees in batches — this runs safely in the background of this dialog…</p>
          </div>
          <ProgressBar value={progress.imported + progress.errors} max={progress.total || 1} showLabel />
          <div className="flex gap-4 text-sm">
            <span className="text-emerald-600 font-medium">{progress.imported.toLocaleString()} imported</span>
            {progress.errors > 0 && <span className="text-rose-600 font-medium">{progress.errors.toLocaleString()} errors</span>}
            <span className="text-slate-400">of {progress.total.toLocaleString()} total</span>
          </div>
        </div>
      )}

      {/* STEP 4 — Done */}
      {step === 'done' && (
        <div className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <p className="text-lg font-semibold text-slate-800">Import complete</p>
          <p className="text-sm text-slate-500 mt-1">
            {progress.imported.toLocaleString()} employees onboarded
            {progress.errors > 0 && <span className="text-rose-600"> · {progress.errors.toLocaleString()} rows had errors and were skipped</span>}
          </p>
        </div>
      )}
    </Modal>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────────────── */
export default function CompanyMigrationPage() {
  const [migrations, setMigrations] = useState<Migration[]>([])
  const [loading, setLoading]       = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)

  const fetchMigrations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/migrations')
      if (res.ok) {
        const data = await res.json()
        setMigrations(data.migrations ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMigrations() }, [fetchMigrations])

  return (
    <div className="space-y-5 animate-fadeIn">
      <PageHeader
        title="Company Onboarding (Bulk Migration)"
        description="Migrate an entire company's roster from SAP, Zoho, or Excel — AI maps the columns, we import the rest"
        actions={
          <Button leftIcon={<Sparkles className="h-3.5 w-3.5" />} onClick={() => setWizardOpen(true)}>
            Import Company Roster
          </Button>
        }
      />

      <Alert variant="info" title="How bulk onboarding works">
        Upload a spreadsheet exported from your old HR system. Claude reads the headers, suggests how each
        column maps onto PRSK's employee fields (keeping each person's original employee code as their
        <strong> external_employee_code</strong> alongside a new PRSK-native code), you confirm the mapping
        once, and we import every row — no manual entry even for 20,000+ employees.
      </Alert>

      <Card padding="none">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <Database className="h-4 w-4 text-slate-400" /> Import History
          </p>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3 w-3" />} onClick={() => fetchMigrations()}>
            Refresh
          </Button>
        </div>

        {!loading && migrations.length === 0 ? (
          <EmptyState
            icon={<UploadCloud className="h-8 w-8" />}
            title="No imports yet"
            description="Start by importing your company's existing employee roster — Claude will handle the column mapping for you."
            action={<Button leftIcon={<Sparkles className="h-3.5 w-3.5" />} onClick={() => setWizardOpen(true)}>Import Company Roster</Button>}
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Import</Th>
                <Th>Source</Th>
                <Th>Status</Th>
                <Th>Progress</Th>
                <Th>Started</Th>
              </Tr>
            </Thead>
            <Tbody>
              {migrations.map(m => (
                <Tr key={m.id}>
                  <Td>
                    <p className="font-medium text-slate-800">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.file_name}</p>
                  </Td>
                  <Td><Badge variant="neutral">{SOURCE_OPTIONS.find(s => s.value === m.source_system)?.label ?? m.source_system}</Badge></Td>
                  <Td><Badge variant={STATUS_VARIANT[m.status] ?? 'neutral'}>{STATUS_LABEL[m.status] ?? m.status}</Badge></Td>
                  <Td>
                    <div className="w-40">
                      <ProgressBar value={m.mapped_rows} max={m.total_rows || 1} size="xs" />
                      <p className="text-[11px] text-slate-400 mt-1">
                        {m.mapped_rows.toLocaleString()} / {m.total_rows.toLocaleString()}
                        {m.error_rows > 0 && <span className="text-rose-500"> · {m.error_rows} errors</span>}
                      </p>
                    </div>
                  </Td>
                  <Td>{formatDate(m.created_at)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <UploadWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onDone={fetchMigrations} />
    </div>
  )
}
