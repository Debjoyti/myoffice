'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Building2, Users, DollarSign, BarChart3, ShoppingCart,
  ClipboardCheck, ArrowRight, Star, Shield, Zap, Menu, X,
  CheckCircle2, TrendingUp, Globe, ChevronRight, Sparkles,
  Clock, Lock, HeartHandshake
} from 'lucide-react'

/* ─── Scroll reveal hook ──────────────────────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    )
    // Observe the container and all .reveal children inside it
    el.querySelectorAll('.reveal').forEach(child => obs.observe(child))
    if (el.classList.contains('reveal')) obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

/* ─── Dashboard product mockup ────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-[520px] mx-auto select-none">
      {/* Glow */}
      <div className="absolute inset-0 blur-3xl opacity-30 rounded-3xl"
           style={{ background: 'radial-gradient(ellipse at center, #3b82f6 0%, #8b5cf6 50%, transparent 70%)' }} />

      {/* Browser frame */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.08]"
           style={{ background: 'rgba(15,23,42,0.95)', boxShadow: '0 32px 80px -12px rgba(0,0,0,0.6)' }}>

        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]"
             style={{ background: 'rgba(8,14,26,0.8)' }}>
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <div className="flex-1 mx-3 flex items-center justify-center">
            <div className="flex items-center gap-1.5 h-5 px-3 rounded bg-white/[0.06] text-[10px] text-slate-500">
              <Lock className="h-2.5 w-2.5" />
              app.prsk.in/dashboard
            </div>
          </div>
        </div>

        {/* App layout */}
        <div className="flex h-[280px]">

          {/* Sidebar */}
          <div className="w-11 flex-shrink-0 border-r border-white/[0.06] flex flex-col items-center pt-3 gap-2.5"
               style={{ background: 'rgba(8,14,26,0.6)' }}>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
              <Building2 className="h-3.5 w-3.5 text-white" />
            </div>
            {[
              { Icon: Users,          active: true  },
              { Icon: DollarSign,     active: false },
              { Icon: BarChart3,      active: false },
              { Icon: ShoppingCart,   active: false },
              { Icon: ClipboardCheck, active: false },
            ].map(({ Icon, active }, i) => (
              <div key={i} className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
                   style={{ background: active ? 'rgba(37,99,235,0.2)' : 'transparent' }}>
                <Icon className="h-3.5 w-3.5" style={{ color: active ? '#60a5fa' : '#475569' }} />
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-3 overflow-hidden space-y-2.5">

            {/* Stat cards row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Employees', value: '247',    color: '#60a5fa', sub: '↑ 4.2% this month' },
                { label: 'Payroll',   value: '₹18.4L', color: '#34d399', sub: '↑ 2.1% vs last' },
                { label: 'Pending',   value: '12',     color: '#fbbf24', sub: '3 urgent actions' },
              ].map(({ label, value, color, sub }) => (
                <div key={label} className="rounded-xl p-2.5 border"
                     style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-[9px] text-slate-500 mb-1">{label}</p>
                  <p className="text-sm font-bold leading-none" style={{ color }}>{value}</p>
                  <p className="text-[8px] mt-1" style={{ color: color + 'aa' }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Attendance chart */}
            <div className="rounded-xl p-2.5 border"
                 style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-slate-500 mb-2">Attendance — May 2026</p>
              <div className="flex items-end gap-[3px] h-14">
                {[62, 79, 91, 84, 97, 89, 74, 86, 93, 81, 95, 88, 76, 90].map((v, i) => (
                  <div key={i} className="flex-1 rounded-sm"
                       style={{
                         height: `${v}%`,
                         background: i === 13 ? '#3b82f6' : i >= 11 ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.25)',
                         transition: 'height 0.3s ease',
                       }} />
                ))}
              </div>
            </div>

            {/* Employee rows */}
            <div className="space-y-1.5">
              {[
                { name: 'Rahul Sharma',  dept: 'Engineering', status: 'Present',  color: '#34d399' },
                { name: 'Priya Mehta',   dept: 'Finance',     status: 'On Leave', color: '#fbbf24' },
                { name: 'Arjun Singh',   dept: 'HR',          status: 'Present',  color: '#34d399' },
              ].map(({ name, dept, status, color }) => (
                <div key={name} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 border"
                     style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div>
                    <p className="text-[9px] font-semibold text-slate-300">{name}</p>
                    <p className="text-[8px] text-slate-600">{dept}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                    <p className="text-[8px] font-medium" style={{ color }}>{status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification cards */}
      <div className="absolute -left-8 top-[30%] animate-float"
           style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))' }}>
        <div className="bg-white rounded-2xl px-3.5 py-2.5 flex items-center gap-3 border border-slate-100/80"
             style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.12)' }}>
          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900">Payroll processed</p>
            <p className="text-[10px] text-slate-500">₹18.4L · 247 employees</p>
          </div>
        </div>
      </div>

      <div className="absolute -right-6 bottom-[22%] animate-float"
           style={{ animationDelay: '1.8s', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))' }}>
        <div className="bg-white rounded-2xl px-3.5 py-2.5 flex items-center gap-3 border border-slate-100/80"
             style={{ boxShadow: '0 4px 24px -4px rgba(0,0,0,0.12)' }}>
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900">IATF Score</p>
            <p className="text-[10px] text-slate-500">98.3% this month</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Feature cards data ──────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Users,
    label: 'HRMS',
    title: 'People ops, fully automated',
    desc: 'Employee lifecycle from onboarding to exit. Org hierarchy, leave policies, attendance, and role-based access — all connected.',
    bullets: ['Onboarding workflows', 'Leave & attendance', 'Org charts & roles'],
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.07)',
    span: 'col-span-2',
  },
  {
    icon: DollarSign,
    label: 'Payroll',
    title: 'GST-ready. PF-compliant.',
    desc: 'Run payroll in minutes with automatic PF, ESI, PT, and TDS deductions. Generate payslips instantly.',
    bullets: ['PF · ESI · PT · TDS', 'One-click payslips', 'Salary structures'],
    accent: '#10b981',
    accentBg: 'rgba(16,185,129,0.07)',
    span: 'col-span-1',
  },
  {
    icon: BarChart3,
    label: 'Finance',
    title: 'Expense to approval in minutes',
    desc: 'Track expense claims, procurement orders, and vendor payments with full audit trails.',
    bullets: ['Expense approvals', 'PO management', 'Vendor ledger'],
    accent: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.07)',
    span: 'col-span-1',
  },
  {
    icon: ShoppingCart,
    label: 'CRM',
    title: 'Deals that close faster',
    desc: 'Track your full sales pipeline from lead to revenue. Assign, follow up, and never miss a deal.',
    bullets: ['Pipeline kanban', 'Lead scoring', 'Activity tracking'],
    accent: '#8b5cf6',
    accentBg: 'rgba(139,92,246,0.07)',
    span: 'col-span-1',
  },
  {
    icon: ClipboardCheck,
    label: 'IATF 16949',
    title: 'Quality compliance, simplified',
    desc: 'India\'s only office suite with IATF 16949 built-in. Manage kaizen, skill matrices, training, and audits.',
    bullets: ['Skill matrices', 'Kaizen tracking', 'Audit calendars'],
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.07)',
    span: 'col-span-1',
  },
  {
    icon: Sparkles,
    label: 'Analytics',
    title: 'Decisions backed by data',
    desc: 'Real-time dashboards across every department. Attendance trends, payroll cost analysis, and headcount forecasting.',
    bullets: ['Cross-dept reports', 'Payroll analytics', 'Headcount forecasts'],
    accent: '#14b8a6',
    accentBg: 'rgba(20,184,166,0.07)',
    span: 'col-span-3',
  },
] as const

/* ─── Testimonials data ───────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    quote: 'We went from 4 disconnected tools to one. Payroll compliance used to eat 2 days a month — now it\'s 20 minutes.',
    name: 'Arjun Tiwari',
    role: 'Operations Head, Bharat Auto Parts',
    avatar: 'AT',
    gradient: 'from-blue-500 to-indigo-600',
    stars: 5,
  },
  {
    quote: 'The IATF module alone justified the cost. Our auditors were genuinely impressed by how organized our documentation became.',
    name: 'Kavita Sharma',
    role: 'Quality Director, Nashik Precision Tools',
    avatar: 'KS',
    gradient: 'from-emerald-500 to-teal-600',
    stars: 5,
  },
  {
    quote: 'Setup took one afternoon. PRSK\'s team migrated our 300+ employee data, and we were live the same week.',
    name: 'Rajan Mehta',
    role: 'Founder, SwiftKart India',
    avatar: 'RM',
    gradient: 'from-amber-500 to-orange-600',
    stars: 5,
  },
]

/* ─── Page component ──────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled,  setScrolled]  = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const statsRef       = useReveal()
  const featuresRef    = useReveal()
  const howRef         = useReveal()
  const testimonialsRef = useReveal()
  const ctaRef         = useReveal()

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc', color: '#0f172a' }}>

      {/* ── Schema.org markup ─────────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'PRSK Enterprise Suite',
          description: 'Complete HRMS, Payroll, Finance, CRM, and IATF compliance platform for Indian businesses.',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
        })}}
      />

      {/* ══════════════════════ NAVBAR ════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(226,232,240,0.8)' : '1px solid transparent',
          boxShadow: scrolled ? '0 1px 24px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                   style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-base font-extrabold font-display tracking-tight"
                      style={{ color: scrolled ? '#0f172a' : '#fff' }}>PRSK</span>
                <span className="hidden sm:block text-[10px] font-medium leading-none"
                      style={{ color: scrolled ? '#94a3b8' : 'rgba(255,255,255,0.6)' }}>Enterprise Suite</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {[
                { label: 'Features', href: '#features' },
                { label: 'How it works', href: '#how' },
                { label: 'Testimonials', href: '#testimonials' },
              ].map(({ label, href }) => (
                <a key={label} href={href}
                   className="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
                   style={{ color: scrolled ? '#475569' : 'rgba(255,255,255,0.75)' }}
                   onMouseOver={e => (e.currentTarget.style.color = scrolled ? '#0f172a' : '#fff')}
                   onMouseOut={e  => (e.currentTarget.style.color = scrolled ? '#475569' : 'rgba(255,255,255,0.75)')}>
                  {label}
                </a>
              ))}
            </nav>

            {/* CTA group */}
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login"
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    style={{ color: scrolled ? '#475569' : 'rgba(255,255,255,0.8)' }}>
                Sign in
              </Link>
              <Link href="/login"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: scrolled ? '#475569' : '#fff' }}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-4 space-y-1">
            {[
              { label: 'Features',      href: '#features'     },
              { label: 'How it works',  href: '#how'          },
              { label: 'Testimonials',  href: '#testimonials' },
            ].map(({ label, href }) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)}
                 className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                {label}
              </a>
            ))}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link href="/login" className="block text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors">
                Sign in
              </Link>
              <Link href="/login" className="block text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                Get started free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════ HERO ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-16"
               style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', minHeight: '100vh' }}>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20"
               style={{ background: '#3b82f6' }} />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-15"
               style={{ background: '#8b5cf6' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-[80px] opacity-10"
               style={{ background: '#10b981', transform: 'translate(-50%,-50%)' }} />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.04]"
               style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — copy */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-8"
                   style={{ background: 'rgba(37,99,235,0.15)', borderColor: 'rgba(37,99,235,0.3)', color: '#93c5fd' }}>
                <Sparkles className="h-3 w-3" />
                Built for Indian businesses · PAN · GSTIN · PF · ESI
              </div>

              <h1 className="font-display font-extrabold leading-[1.05] tracking-tight text-white mb-6"
                  style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
                Your entire company,<br />
                <span className="text-gradient-blue">one platform.</span>
              </h1>

              <p className="text-lg leading-relaxed mb-8 max-w-lg"
                 style={{ color: 'rgba(255,255,255,0.65)' }}>
                HRMS, Payroll, Finance, CRM, and IATF compliance — unified in one workspace.
                Run operations for 10 or 10,000 employees with equal confidence.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-10">
                <Link href="/login"
                      className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', boxShadow: '0 8px 32px -4px rgba(37,99,235,0.5)' }}>
                  Start free — no credit card
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#features"
                   className="flex items-center gap-1.5 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all"
                   style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
                   onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
                   onMouseOut={e  => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)' }}>
                  See how it works
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-4">
                {[
                  { Icon: Shield,       text: 'SOC 2 ready'        },
                  { Icon: Lock,         text: 'Data stays in India' },
                  { Icon: Clock,        text: 'Setup in 1 day'      },
                ].map(({ Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-xs font-medium"
                       style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.4)' }} />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — product mockup */}
            <div className="hidden lg:block">
              <DashboardMockup />
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, transparent, #f8fafc)' }} />
      </section>

      {/* ══════════════════════ STATS BAR ════════════════════════════════════ */}
      <section ref={statsRef} style={{ background: '#fff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '1,200+',   label: 'companies trust PRSK',       Icon: Globe          },
              { value: '85,000+',  label: 'employees managed daily',     Icon: Users          },
              { value: '₹500 Cr+', label: 'payroll processed monthly',   Icon: DollarSign     },
              { value: '99.9%',    label: 'uptime SLA',                  Icon: Zap            },
            ].map(({ value, label, Icon }, i) => (
              <div key={label}
                   className={`reveal reveal-delay-${i + 1} text-center lg:text-left`}>
                <div className="flex items-center gap-2 justify-center lg:justify-start mb-1">
                  <Icon className="h-4 w-4" style={{ color: '#2563eb' }} />
                  <p className="text-2xl font-display font-extrabold tracking-tight" style={{ color: '#0f172a' }}>{value}</p>
                </div>
                <p className="text-sm" style={{ color: '#64748b' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ FEATURES ═════════════════════════════════════ */}
      <section id="features" ref={featuresRef}
               style={{ background: '#f1f5f9', padding: '80px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="reveal text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: '#2563eb' }}>
              Everything in one place
            </p>
            <h2 className="font-display font-extrabold tracking-tight leading-tight mb-4"
                style={{ fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', color: '#0f172a' }}>
              Six modules. Zero juggling.
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#64748b' }}>
              Stop paying for separate HR, payroll, and compliance tools. PRSK unifies them with live data flowing between every module.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, label, title, desc, bullets, accent, accentBg, span }, i) => (
              <div key={label}
                   className={`reveal reveal-delay-${i + 1} card-lift bg-white rounded-2xl border border-slate-200/80 overflow-hidden ${span === 'col-span-2' ? 'lg:col-span-2' : span === 'col-span-3' ? 'lg:col-span-3' : ''}`}
                   style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                {/* Accent bar */}
                <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}44)` }} />

                <div className="p-6">
                  <div className="flex items-start gap-4" style={{ flexDirection: span === 'col-span-3' ? 'row' : 'column' }}>
                    <div className={`flex items-center gap-4 ${span === 'col-span-3' ? 'flex-1' : 'w-full'}`}>
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                           style={{ background: accentBg }}>
                        <Icon className="h-5 w-5" style={{ color: accent }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-0.5" style={{ color: accent }}>{label}</p>
                        <h3 className="font-display font-bold leading-snug" style={{ fontSize: '1.05rem', color: '#0f172a' }}>{title}</h3>
                      </div>
                    </div>

                    <div className={span === 'col-span-3' ? 'flex-1' : 'w-full'}>
                      <p className="text-sm leading-relaxed mb-4" style={{ color: '#475569' }}>{desc}</p>
                      <ul className="space-y-1.5">
                        {bullets.map(b => (
                          <li key={b} className="flex items-center gap-2 text-sm font-medium" style={{ color: '#334155' }}>
                            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: accent }} />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ HOW IT WORKS ═════════════════════════════════ */}
      <section id="how" ref={howRef} style={{ background: '#fff', padding: '80px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="reveal text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: '#10b981' }}>
              Simple onboarding
            </p>
            <h2 className="font-display font-extrabold tracking-tight leading-tight mb-4"
                style={{ fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', color: '#0f172a' }}>
              Live in three steps.
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: '#64748b' }}>
              Most teams are fully up and running within a single business day.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-10 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.7%+2rem)] right-[calc(16.7%+2rem)] h-px"
                 style={{ background: 'linear-gradient(90deg, #e2e8f0, #2563eb44, #e2e8f0)' }} />

            {[
              {
                step: '01',
                title: 'Import your team',
                desc: 'Upload your employee data via CSV or connect your existing HR system. Our team handles the migration.',
                Icon: Users,
                color: '#2563eb',
              },
              {
                step: '02',
                title: 'Configure workflows',
                desc: 'Set your salary structures, leave policies, approval chains, and compliance rules. Templates ready for Indian companies.',
                Icon: ClipboardCheck,
                color: '#10b981',
              },
              {
                step: '03',
                title: 'Go live — same week',
                desc: 'Invite your team. Everyone gets role-based access from day one. No training required.',
                Icon: Zap,
                color: '#f59e0b',
              },
            ].map(({ step, title, desc, Icon, color }, i) => (
              <div key={step} className={`reveal reveal-delay-${i + 1} text-center relative`}>
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl border-2 mb-5 mx-auto relative z-10 bg-white"
                     style={{ borderColor: color + '40' }}>
                  <Icon className="h-6 w-6" style={{ color }} />
                  <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                        style={{ background: color }}>{i + 1}</span>
                </div>
                <h3 className="font-display font-bold text-lg mb-2" style={{ color: '#0f172a' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ TESTIMONIALS ═════════════════════════════════ */}
      <section id="testimonials" ref={testimonialsRef}
               style={{ background: '#f1f5f9', padding: '80px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="reveal text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: '#8b5cf6' }}>
              Real results
            </p>
            <h2 className="font-display font-extrabold tracking-tight leading-tight"
                style={{ fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', color: '#0f172a' }}>
              Teams that chose clarity.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, role, avatar, gradient, stars }, i) => (
              <div key={name}
                   className={`reveal reveal-delay-${i + 1} card-lift bg-white rounded-2xl p-6 border border-slate-200/80`}
                   style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <blockquote className="text-sm leading-relaxed mb-5" style={{ color: '#334155' }}>
                  &ldquo;{quote}&rdquo;
                </blockquote>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{name}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ WHY PRSK ════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '80px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] mb-3" style={{ color: '#2563eb' }}>
                Built for India
              </p>
              <h2 className="font-display font-extrabold tracking-tight leading-tight mb-5"
                  style={{ fontSize: 'clamp(1.875rem, 3vw, 2.5rem)', color: '#0f172a' }}>
                Not just another SaaS.<br />
                <span className="text-gradient-gold">Designed for ₹, GST, and beyond.</span>
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: '#475569' }}>
                Global HR tools weren't built with Indian compliance in mind. PRSK was.
                Every calculation, report, and workflow speaks the language of Indian business — PF, ESI, PT, IATF, PAN, GSTIN.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { Icon: HeartHandshake, title: 'Dedicated support',    desc: 'Onboarding team. Real humans. IST hours.'   },
                  { Icon: Shield,         title: 'Data residency',       desc: 'Your data stays in Indian data centres.'    },
                  { Icon: Zap,            title: 'Fast as you need',     desc: 'Handles 10 to 10,000 employees without lag.' },
                  { Icon: Globe,          title: 'Multi-entity ready',   desc: 'Manage multiple offices from one dashboard.' },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: '#eff6ff' }}>
                      <Icon className="h-4.5 w-4.5" style={{ color: '#2563eb' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance badge grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'PF',    sub: 'Provident Fund',       color: '#2563eb' },
                { label: 'ESI',   sub: 'Employee State Ins.',  color: '#10b981' },
                { label: 'PT',    sub: 'Professional Tax',     color: '#8b5cf6' },
                { label: 'TDS',   sub: 'Tax Deducted at Src.', color: '#f59e0b' },
                { label: 'GSTIN', sub: 'GST Compliance',       color: '#ef4444' },
                { label: 'IATF',  sub: '16949 Quality Mgmt.',  color: '#14b8a6' },
                { label: 'PAN',   sub: 'Income Tax',           color: '#ec4899' },
                { label: 'UAN',   sub: 'Universal Acc. No.',   color: '#f97316' },
                { label: 'WCAG',  sub: '2.2 Accessibility',    color: '#6366f1' },
              ].map(({ label, sub, color }) => (
                <div key={label}
                     className="card-lift rounded-2xl p-4 border border-slate-100 text-center"
                     style={{ background: color + '08' }}>
                  <p className="font-display font-extrabold text-lg leading-none mb-1" style={{ color }}>{label}</p>
                  <p className="text-[10px] leading-tight" style={{ color: '#94a3b8' }}>{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ CTA BANNER ═══════════════════════════════════ */}
      <section ref={ctaRef} style={{ background: '#f1f5f9', padding: '80px 0' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="reveal rounded-3xl overflow-hidden relative"
               style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', padding: '56px 48px' }}>

            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-20"
                   style={{ background: '#3b82f6', transform: 'translate(30%, -30%)' }} />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-[60px] opacity-15"
                   style={{ background: '#8b5cf6', transform: 'translate(-30%, 30%)' }} />
              <div className="absolute inset-0 opacity-[0.03]"
                   style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            </div>

            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.15em] mb-4" style={{ color: '#93c5fd' }}>
                14-day free trial · No credit card
              </p>
              <h2 className="font-display font-extrabold leading-tight text-white mb-4"
                  style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}>
                Ready to run your business<br />
                <span className="text-gradient-blue">the smart way?</span>
              </h2>
              <p className="text-base mb-8 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Join 1,200+ Indian companies that replaced their tool stack with PRSK.
                Setup takes less than a day.
              </p>
              <Link href="/login"
                    className="inline-flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', boxShadow: '0 8px 40px -4px rgba(37,99,235,0.5)' }}>
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Free for up to 10 employees · No setup fees · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ FOOTER ════════════════════════════════════════ */}
      <footer style={{ background: '#0f172a', color: 'rgba(255,255,255,0.5)', padding: '48px 0 32px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-extrabold font-display text-white">PRSK</span>
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Enterprise business suite built for modern Indian companies.
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                © 2026 PRSK Technologies Pvt. Ltd.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4 text-white/60">Product</p>
              <ul className="space-y-2.5 text-sm">
                {['HRMS', 'Payroll', 'Finance', 'CRM', 'IATF Compliance', 'Analytics'].map(item => (
                  <li key={item}>
                    <a href="#features" className="transition-colors hover:text-white text-white/40">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4 text-white/60">Company</p>
              <ul className="space-y-2.5 text-sm">
                {['About', 'Careers', 'Blog', 'Press kit'].map(item => (
                  <li key={item}>
                    <a href="#" className="transition-colors hover:text-white text-white/40">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4 text-white/60">Support</p>
              <ul className="space-y-2.5 text-sm">
                {['Documentation', 'Help centre', 'Status', 'Contact us'].map(item => (
                  <li key={item}>
                    <a href="#" className="transition-colors hover:text-white text-white/40">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-between gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <div className="flex flex-wrap gap-4">
              {['Privacy Policy', 'Terms of Service', 'Security'].map(item => (
                <a key={item} href="#" className="hover:text-white/60 transition-colors">{item}</a>
              ))}
            </div>
            <p>Made with care in India 🇮🇳</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
