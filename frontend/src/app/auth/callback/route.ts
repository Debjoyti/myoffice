import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * OAuth Callback Route
 *
 * Supabase redirects here after a successful Google / Microsoft OAuth flow.
 * This route exchanges the one-time `code` for a persistent session cookie,
 * then forwards the user to the intended destination (default: /home).
 *
 * URL shape: /auth/callback?code=<code>&next=/home
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Surface any provider-level errors (e.g. user cancelled auth)
  if (errorParam) {
    const msg = encodeURIComponent(errorDescription ?? errorParam)
    return NextResponse.redirect(`${origin}/login?error=${msg}`)
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Ensure next is a relative path to prevent open-redirect attacks
      const safePath = next.startsWith('/') ? next : '/home'
      return NextResponse.redirect(`${origin}${safePath}`)
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    )
  }

  // No code and no error — something unexpected happened
  return NextResponse.redirect(`${origin}/login?error=missing_code`)
}
