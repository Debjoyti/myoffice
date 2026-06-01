import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function sanitize(val: string | undefined): string {
  return Array.from(val ?? '')
    .filter((ch) => (ch.codePointAt(0) ?? 0) <= 255)
    .join('')
    .trim()
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL),
    sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — fine if middleware is refreshing sessions
          }
        },
      },
    }
  )
}
