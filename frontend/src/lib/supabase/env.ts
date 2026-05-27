function cleanEnvValue(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Missing ${name} env var`)

  const cleaned = value
    .trim()
    .replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, '')
    .replace(/[^\x20-\x7E]/g, '')

  if (!cleaned) throw new Error(`${name} env var is empty after sanitization`)
  return cleaned
}

export function getSupabaseUrl(): string {
  return cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')
}

export function getSupabaseAnonKey(): string {
  return cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export function getSupabaseServiceRoleKey(): string {
  return cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY')
}
