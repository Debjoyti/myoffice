import { NextResponse } from 'next/server'
import { requireHR } from '@/lib/supabase/employee'
import { z } from 'zod'

const mappingSchema = z.object({
  column_mapping: z.record(z.string(), z.string().nullable()),
})

/** GET /api/v1/migrations/:id — full status + a page of staged rows for review */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { supabase } = result
  const { id } = await params

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 200)

  const { data: migration, error } = await supabase
    .from('company_migrations')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  let recordsQuery = supabase
    .from('migration_staging_records')
    .select('id, row_number, raw_data, mapped_data, status, error_message, employee_id')
    .eq('migration_id', id)
    .order('row_number')
    .limit(limit)
  if (status) recordsQuery = recordsQuery.eq('status', status)

  const { data: records } = await recordsQuery

  return NextResponse.json({ migration, records: records ?? [] })
}

/**
 * PATCH /api/v1/migrations/:id — confirm (or correct) the AI-suggested column
 * mapping. Re-applies the mapping to every staged row and validates them so
 * the HR admin can see exactly what will be imported before committing.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { supabase } = result
  const { id } = await params

  const body = await req.json()
  const parsed = mappingSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { applyMapping, validateMappedRow } = await import('@/lib/services/ai/companyMigration')
  const mapping = parsed.data.column_mapping as any

  await supabase.from('company_migrations').update({ column_mapping: mapping, status: 'mapping_confirmed' }).eq('id', id)

  // Re-map & validate every staged row in chunks
  const PAGE = 1000
  let from = 0
  let mappedCount = 0
  let errorCount = 0
  for (;;) {
    const { data: page } = await supabase
      .from('migration_staging_records')
      .select('id, raw_data')
      .eq('migration_id', id)
      .range(from, from + PAGE - 1)
    if (!page || page.length === 0) break

    const updates = page.map(rec => {
      const mapped = applyMapping(rec.raw_data as any, mapping)
      const err = validateMappedRow(mapped)
      if (err) errorCount++; else mappedCount++
      return { id: rec.id, mapped_data: mapped, status: err ? 'error' : 'valid', error_message: err }
    })

    // Supabase JS has no bulk-update; upsert by PK is the efficient path here.
    await supabase.from('migration_staging_records').upsert(updates)

    from += PAGE
    if (page.length < PAGE) break
  }

  await supabase.from('company_migrations').update({ mapped_rows: mappedCount, error_rows: errorCount }).eq('id', id)

  return NextResponse.json({ ok: true, mapped_rows: mappedCount, error_rows: errorCount })
}

/** DELETE /api/v1/migrations/:id — discard a migration batch and its staged rows */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireHR()
  if (result instanceof NextResponse) return result
  const { supabase } = result
  const { id } = await params

  const { error } = await supabase.from('company_migrations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
