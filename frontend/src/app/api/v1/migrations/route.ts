import { NextResponse } from 'next/server'
import { requireHR } from '@/lib/supabase/employee'
import { suggestColumnMapping } from '@/lib/services/ai/companyMigration'
import * as XLSX from 'xlsx'

const MAX_ROWS = 50_000 // generous ceiling for a single-company roster import

/** GET /api/v1/migrations — list past & in-progress migration batches */
export async function GET() {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { supabase } = result

  const { data, error } = await supabase
    .from('company_migrations')
    .select('id, name, source_system, file_name, status, total_rows, mapped_rows, error_rows, created_at, completed_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ migrations: data ?? [] })
}

/**
 * POST /api/v1/migrations — upload a roster file (Excel/CSV).
 * We parse it, ask Claude to map the headers onto our schema once, stage every
 * row, and return a preview + suggested mapping for the HR admin to confirm.
 * This is the entry point for onboarding an entire company (hundreds to tens
 * of thousands of employees) from SAP/Zoho/Excel in one shot.
 */
export async function POST(req: Request) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result

  const form = await req.formData()
  const file = form.get('file') as File | null
  const name = (form.get('name') as string | null) ?? file?.name ?? 'Company roster import'
  const sourceSystem = (form.get('source_system') as string | null) ?? 'excel'

  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  let rows: Record<string, any>[]
  let columns: string[]
  try {
    const buf = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buf, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false })
    columns = rows.length
      ? Object.keys(rows[0])
      : (XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false })[0] as string[] ?? [])
  } catch {
    return NextResponse.json({ error: 'Could not parse the file. Please upload a valid Excel (.xlsx/.xls) or CSV file.' }, { status: 400 })
  }

  if (!rows.length) return NextResponse.json({ error: 'The file has no data rows' }, { status: 400 })
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `File has ${rows.length} rows — please split imports above ${MAX_ROWS} rows` }, { status: 400 })
  }

  // 1. Create the migration batch record
  const { data: migration, error: migErr } = await supabase
    .from('company_migrations')
    .insert({
      company_id: actor.company_id,
      name,
      source_system: sourceSystem,
      file_name: file.name,
      status: 'uploaded',
      total_rows: rows.length,
      source_columns: columns,
      created_by: actor.id,
    })
    .select()
    .single()

  if (migErr) return NextResponse.json({ error: migErr.message }, { status: 500 })

  // 2. Stage every row for review (chunked insert keeps payloads reasonable at scale)
  const STAGE_CHUNK = 1000
  for (let i = 0; i < rows.length; i += STAGE_CHUNK) {
    const chunk = rows.slice(i, i + STAGE_CHUNK).map((raw, j) => ({
      migration_id: migration.id,
      row_number: i + j + 1,
      raw_data: raw,
      status: 'pending' as const,
    }))
    const { error: stageErr } = await supabase.from('migration_staging_records').insert(chunk)
    if (stageErr) {
      await supabase.from('company_migrations').update({ status: 'failed', error_summary: stageErr.message }).eq('id', migration.id)
      return NextResponse.json({ error: `Failed staging rows: ${stageErr.message}` }, { status: 500 })
    }
  }

  // 3. Ask Claude to suggest the column mapping from the header + a few sample rows
  let mapping = null
  let notes = ''
  let mappingError: string | null = null
  try {
    const sample = rows.slice(0, 5)
    const suggestion = await suggestColumnMapping(columns, sample, sourceSystem)
    mapping = suggestion.mapping
    notes = suggestion.notes
  } catch (err: any) {
    mappingError = err?.message ?? 'AI mapping failed — please map columns manually'
  }

  await supabase
    .from('company_migrations')
    .update({
      status: mapping ? 'mapping_suggested' : 'uploaded',
      column_mapping: mapping,
      error_summary: mappingError,
    })
    .eq('id', migration.id)

  return NextResponse.json({
    migration: { ...migration, status: mapping ? 'mapping_suggested' : 'uploaded', column_mapping: mapping },
    source_columns: columns,
    sample_rows: rows.slice(0, 5),
    suggested_mapping: mapping,
    ai_notes: notes,
    mapping_error: mappingError,
  }, { status: 201 })
}
