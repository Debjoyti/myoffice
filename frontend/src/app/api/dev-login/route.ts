import { NextResponse } from 'next/server'
import { DEV_SESSION_COOKIE, DEV_DEMO_USERS, isDevBypass } from '@/lib/dev-auth'

export async function POST(request: Request) {
  if (!isDevBypass()) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const { email } = await request.json()
  const user = DEV_DEMO_USERS[email as string]

  if (!user) {
    return NextResponse.json({ error: 'Unknown demo user' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(DEV_SESSION_COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
  })
  return response
}

export async function DELETE() {
  if (!isDevBypass()) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(DEV_SESSION_COOKIE)
  return response
}
