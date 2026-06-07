import { NextResponse } from 'next/server'
import { requireHR } from '@/lib/supabase/employee'

const BATCH_SIZE = 250 // keeps each DB round-trip small even for a 30k-row roster

/**
 * POST /api/v1/migrations/:id/commit — import one batch of validated staging
 * rows into `employees`.
 *
 * Why batched rather than "import everything now": a 20-30k row company
 * roster can take well over the request timeout to insert in one go. The
 * client calls this endpoint repeatedly (it returns `done: false` with
 * progress) until `done: true` — each call is small, idempotent-safe (already
 * imported rows are skipped), and cheap to retry. This keeps the import
 * resumable without needing a separate job-queue deployment, while staying
 * within the "background job that fans out" spirit for heavy work.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { employee: actor, supabase } = result
  const { id } = await params

  const { data: migration, error: migErr } = await supabase
    .from('company_migrations')
    .select('*')
    .eq('id', id)
    .single()
  if (migErr || !migration) return NextResponse.json({ error: 'Migration not found' }, { status: 404 })

  if (!['mapping_confirmed', 'importing', 'completed_with_errors'].includes(migration.status)) {
    return NextResponse.json({ error: `Cannot import in status "${migration.status}". Confirm the column mapping first.` }, { status: 400 })
  }

  await supabase.from('company_migrations').update({ status: 'importing' }).eq('id', id)

  const { data: batch, error: batchErr } = await supabase
    .from('migration_staging_records')
    .select('id, mapped_data, raw_data')
    .eq('migration_id', id)
    .eq('status', 'valid')
    .limit(BATCH_SIZE)
  if (batchErr) return NextResponse.json({ error: batchErr.message }, { status: 500 })

  // Pre-compute the next PRSK employee_code once, then increment in-memory for
  // the whole batch — avoids a per-row round trip at 20k+ scale.
  const { data: lastEmp } = await supabase
    .from('employees')
    .select('employee_code')
    .eq('company_id', migration.company_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  let nextNum = lastEmp ? (parseInt(String(lastEmp.employee_code).replace(/\D/g, ''), 10) || 0) + 1 : 1

  let imported = 0
  let failed = 0

  for (const rec of batch ?? []) {
    const m = rec.mapped_data as Record<string, any>
    const empCode = `EMP${String(nextNum).padStart(3, '0')}`
    try {
      const { data: emp, error: empErr } = await supabase
        .from('employees')
        .insert({
          employee_code: empCode,
          full_name: m.full_name,
          email: m.email,
          phone: m.phone ?? null,
          designation: m.designation ?? 'Employee',
          department: m.department ?? null,
          employment_type: m.employment_type ?? 'full_time',
          date_of_joining: m.date_of_joining ?? null,
          external_employee_code: m.external_employee_code ?? null,
          source_system: migration.source_system,
          status: 'active',
          role: 'employee',
          company_id: migration.company_id,
          pan_number: m.pan_number ?? null,
          aadhaar_number: m.aadhaar_number ?? null,
          uan_number: m.uan_number ?? null,
          bank_name: m.bank_name ?? null,
          bank_account: m.bank_account ?? null,
          bank_ifsc: m.bank_ifsc ?? null,
        })
        .select('id')
        .single()

      if (empErr) throw empErr

      await supabase.from('migration_staging_records')
        .update({ status: 'imported', employee_id: emp.id })
        .eq('id', rec.id)
      imported++
      nextNum++
    } catch (err: any) {
      await supabase.from('migration_staging_records')
        .update({ status: 'error', error_message: err?.message ?? 'Import failed' })
        .eq('id', rec.id)
      failed++
    }
  }

  // Re-tally and decide whether we're done
  const { count: remaining } = await supabase
    .from('migration_staging_records')
    .select('id', { count: 'exact', head: true })
    .eq('migration_id', id)
    .eq('status', 'valid')

  const { count: importedTotal } = await supabase
    .from('migration_staging_records')
    .select('id', { count: 'exact', head: true })
    .eq('migration_id', id)
    .eq('status', 'imported')

  const { count: errorTotal } = await supabase
    .from('migration_staging_records')
    .select('id', { count: 'exact', head: true })
    .eq('migration_id', id)
    .eq('status', 'error')

  const done = (remaining ?? 0) === 0
  if (done) {
    await supabase.from('company_migrations').update({
      status: (errorTotal ?? 0) > 0 ? 'completed_with_errors' : 'completed',
      mapped_rows: importedTotal ?? 0,
      error_rows: errorTotal ?? 0,
      completed_at: new Date().toISOString(),
    }).eq('id', id)
  }

  return NextResponse.json({
    done,
    batch_imported: imported,
    batch_failed: failed,
    total_imported: importedTotal ?? 0,
    total_errors: errorTotal ?? 0,
    remaining: remaining ?? 0,
  })
}
