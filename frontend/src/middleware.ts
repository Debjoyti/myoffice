import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const DEV_SESSION_COOKIE = 'prsk_dev_session'

/** Strip BOM (U+FEFF) and other non-ISO-8859-1 chars from env vars. */
function sanitize(val: string | undefined): string {
  return Array.from(val ?? '')
    .filter((ch) => (ch.codePointAt(0) ?? 0) <= 255)
    .join('')
    .trim()
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isLoginRoute = pathname === '/login'
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/')

  // ── Demo-account bypass ──────────────────────────────────────────────────
  // If the prsk_dev_session cookie exists, the user is logged in as a demo
  // account. Skip Supabase entirely — the 4 hardcoded @prsk.demo emails are
  // the only ones that can ever set this cookie (via /api/dev-login).
  const devCookie = request.cookies.get(DEV_SESSION_COOKIE)
  if (devCookie) {
    // Demo user hitting login or root → send to dashboard
    if (isLoginRoute || pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }
    // Demo user hitting any other route → allow through
    return NextResponse.next({ request })
  }

  // ── Public routes & login page ───────────────────────────────────────────
  // Don't call Supabase here — avoids "Database error querying schema" on the
  // login page itself when the anon key has a BOM character.
  if (isPublicRoute || isLoginRoute) {
    return NextResponse.next({ request })
  }

  // ── Normal Supabase auth for protected dashboard routes ──────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL),
    sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Not authenticated — redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
