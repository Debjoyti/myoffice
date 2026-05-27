import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { isDemoCredential } from '@/lib/demo-accounts'
import { ensureDemoAccount } from '@/lib/demo-seed'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = []
    const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(nextCookies) {
          cookiesToSet.push(...nextCookies)
        },
      },
    })

    let { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error && isDemoCredential(email, password)) {
      await ensureDemoAccount(email)
      const retry = await supabase.auth.signInWithPassword({ email, password })
      data = retry.data
      error = retry.error
    }

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? 'Invalid credentials' }, { status: 401 })
    }

    const response = NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })

    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })

    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed'
    console.error('[auth/login]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
