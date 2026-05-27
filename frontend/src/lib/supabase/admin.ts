import { createClient } from '@supabase/supabase-js'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from './env'

/**
 * Supabase admin client using the service-role key.
 * NEVER expose this client to the browser — server-side only.
 * Use only in Next.js API routes and server actions.
 */
export function createAdminClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseServiceRoleKey()
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
