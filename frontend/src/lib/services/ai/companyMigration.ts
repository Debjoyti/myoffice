/**
 * AI-assisted bulk company onboarding.
 *
 * When a customer migrates from SAP / Zoho / a raw Excel export, they upload a
 * roster file with arbitrary column names ("Emp Code", "Pers. No.", "Joining Dt"…).
 * Instead of a human mapping thousands of rows by hand, we ask Claude to map the
 * *header row* onto our schema once — then apply that mapping to every row
 * programmatically. This keeps the AI cost/latency constant regardless of
 * whether the roster has 200 or 30,000 people.
 */
import { getAnthropicClient } from '@/lib/integrations/anthropic/client'

/** Canonical fields we can populate on `employees` from an imported roster row. */
export const TARGET_FIELDS = [
  { key: 'external_employee_code', label: 'Employee Code (from old system)', required: true },
  { key: 'full_name',              label: 'Full Name',                       required: true },
  { key: 'email',                  label: 'Work Email',                      required: true },
  { key: 'phone',                  label: 'Phone',                           required: false },
  { key: 'designation',            label: 'Designation / Job Title',         required: false },
  { key: 'department',             label: 'Department',                      required: false },
  { key: 'employment_type',        label: 'Employment Type',                 required: false },
  { key: 'date_of_joining',        label: 'Date of Joining',                 required: false },
  { key: 'date_of_birth',          label: 'Date of Birth',                   required: false },
  { key: 'gender',                 label: 'Gender',                          required: false },
  { key: 'pan_number',             label: 'PAN Number',                      required: false },
  { key: 'aadhaar_number',         label: 'Aadhaar Number',                  required: false },
  { key: 'uan_number',             label: 'UAN Number',                      required: false },
  { key: 'bank_name',              label: 'Bank Name',                       required: false },
  { key: 'bank_account',           label: 'Bank Account Number',             required: false },
  { key: 'bank_ifsc',              label: 'Bank IFSC',                       required: false },
  { key: 'manager_name_or_code',   label: "Manager's Name or Employee Code", required: false },
  { key: 'work_location',          label: 'Work Location',                   required: false },
] as const

export type TargetFieldKey = typeof TARGET_FIELDS[number]['key']
export type ColumnMapping = Partial<Record<TargetFieldKey, string | null>>

const FIELD_KEYS = TARGET_FIELDS.map(f => f.key)

/**
 * Ask Claude to map an uploaded roster's column headers (with a few sample rows
 * for context) onto our canonical employee fields. Returns a single mapping
 * object: { our_field: 'Source Column Header' | null }.
 */
export async function suggestColumnMapping(
  sourceColumns: string[],
  sampleRows: Record<string, any>[],
  sourceSystem: string,
): Promise<{ mapping: ColumnMapping; notes: string }> {
  const client = getAnthropicClient()

  const system = `You are a data-migration assistant for an HR SaaS platform (PRSK). \
A customer is migrating their employee roster from ${sourceSystem.toUpperCase()} into our system. \
Map each of OUR target fields to the BEST matching column header from their uploaded file. \
If no reasonable match exists for a field, set it to null. Never invent column names — \
only use headers that literally appear in "Source columns". Respond with ONLY raw JSON, \
no markdown fences, in this exact shape:
{"mapping": {"<our_field_key>": "<source column header or null>", ...}, "notes": "<one short sentence about anything the user should double-check>"}`

  const prompt = `Our target fields (key — description — required):
${TARGET_FIELDS.map(f => `- ${f.key} — ${f.label}${f.required ? ' (required)' : ''}`).join('\n')}

Source columns from their uploaded ${sourceSystem} export:
${JSON.stringify(sourceColumns)}

Sample rows (first ${sampleRows.length}):
${JSON.stringify(sampleRows, null, 2)}

Return the JSON mapping now.`

  const result = await client.completeJSON<{ mapping: ColumnMapping; notes: string }>(prompt, { system, maxTokens: 2048 })

  // Defensive: only keep keys we know about, and only values that are real source columns.
  const mapping: ColumnMapping = {}
  for (const key of FIELD_KEYS) {
    const val = result?.mapping?.[key]
    mapping[key] = (typeof val === 'string' && sourceColumns.includes(val)) ? val : null
  }
  return { mapping, notes: result?.notes ?? '' }
}

/** Apply a confirmed column mapping to a raw row, producing a normalized employee record. */
export function applyMapping(rawRow: Record<string, any>, mapping: ColumnMapping): Record<string, any> {
  const out: Record<string, any> = {}
  for (const key of FIELD_KEYS) {
    const sourceCol = mapping[key]
    if (!sourceCol) continue
    const val = rawRow[sourceCol]
    if (val === undefined || val === null || val === '') continue
    out[key] = typeof val === 'string' ? val.trim() : val
  }
  return out
}

/** Validate a mapped row before import. Returns null when valid, or an error message. */
export function validateMappedRow(mapped: Record<string, any>): string | null {
  if (!mapped.full_name) return 'Missing full name'
  if (!mapped.email) return 'Missing email'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(mapped.email))) return 'Invalid email format'
  return null
}
