'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Building2, Eye, EyeOff, AlertCircle } from 'lucide-react'

/* ── OAuth provider icons ────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="0"   y="0"   width="8.5" height="8.5" fill="#F25022"/>
      <rect x="9.5" y="0"   width="8.5" height="8.5" fill="#7FBA00"/>
      <rect x="0"   y="9.5" width="8.5" height="8.5" fill="#00A4EF"/>
      <rect x="9.5" y="9.5" width="8.5" height="8.5" fill="#FFB900"/>
    </svg>
  )
}

/* ── Component ───────────────────────────────────────────────────────────── */
const DEMO_LOGIN_USERS = [
  { label: 'Super Admin', email: 'superadmin@prsk.demo' },
  { label: 'HR Admin', email: 'hradmin@prsk.demo' },
  { label: 'Accountant', email: 'accountant@prsk.demo' },
  { label: 'Employee', email: 'employee@prsk.demo' },
]

const DEMO_PASSWORD = 'Demo@123456'

export default function LoginPage() {
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'azure' | null>(null)
  const router = useRouter()

  /* Email + password ---------------------------------------------------- */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/home'); router.refresh() }
  }

  /* OAuth (Google / Microsoft) ------------------------------------------ */
  const handleOAuth = async (provider: 'google' | 'azure') => {
    setOauthLoading(provider)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Scopes for Microsoft: openid + email + profile via Azure AD
        ...(provider === 'azure' ? { scopes: 'openid email profile' } : {}),
      },
    })
    if (error) {
      setError(error.message)
      setOauthLoading(null)
    }
    // On success Supabase redirects the browser — no need to push manually
  }

  /* Surface OAuth errors forwarded via ?error= query param -------------- */
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const urlError = params.get('error')
    if (urlError && !error) setError(decodeURIComponent(urlError))
  }

  const anyLoading = loading || oauthLoading !== null

  const fillDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword(DEMO_PASSWORD)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Left — Brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] flex-shrink-0 p-12 bg-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight">PRSK</span>
            <span className="block text-xs text-blue-200">Enterprise Suite</span>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white leading-tight">
              Your complete<br />HR & Operations OS
            </h1>
            <p className="mt-4 text-blue-200 text-sm leading-relaxed max-w-xs">
              HRMS, Payroll, Attendance, Finance, and more — unified in one platform built for modern Indian businesses.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Attendance & leave management',
              'Payroll with PF, ESI, PT compliance',
              'Salary structures & payslips',
              'Role-based access control',
            ].map(f => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-blue-100">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-blue-300">© 2026 PRSK Technologies Pvt. Ltd.</p>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">PRSK</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
            <p className="mt-1.5 text-sm text-slate-500">Access your organisation's workspace</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* ── Social sign-in ─────────────────────────────────────────── */}
          <div className="space-y-2.5 mb-5">
            <button
              type="button"
              disabled={anyLoading}
              onClick={() => handleOAuth('google')}
              className="w-full h-10 flex items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'google'
                ? <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
                : <GoogleIcon />
              }
              Continue with Google
            </button>

            <button
              type="button"
              disabled={anyLoading}
              onClick={() => handleOAuth('azure')}
              className="w-full h-10 flex items-center justify-center gap-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'azure'
                ? <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
                : <MicrosoftIcon />
              }
              Continue with Microsoft
            </button>
          </div>

          {/* ── Divider ────────────────────────────────────────────────── */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-50 px-3 text-xs text-slate-400 font-medium">or sign in with email</span>
            </div>
          </div>

          {/* ── Email + password ────────────────────────────────────────── */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1.5">
                Work email
              </label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                disabled={anyLoading}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors disabled:opacity-60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-medium text-slate-700">Password</label>
              </div>
              <div className="relative">
                <input
                  id="password" type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={anyLoading}
                  className="w-full h-10 pl-3 pr-10 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors disabled:opacity-60"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={anyLoading}
              className="w-full h-10 mt-1 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-sm font-semibold text-white transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p className="mb-2 text-center text-xs font-medium text-blue-900">
              Demo accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_LOGIN_USERS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => fillDemoCredentials(demo.email)}
                  className="h-8 rounded-md border border-blue-200 bg-white px-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Secure enterprise sign-in · SSO available
          </p>
        </div>
      </div>
    </div>
  )
}
