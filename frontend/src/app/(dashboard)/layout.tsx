'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Clock, Banknote, Wallet,
  Settings, Bell, ChevronLeft, ChevronRight,
  TrendingUp, Package, Target, Zap, MessageSquare,
  BarChart3, Home, LogOut, Building2, ShieldCheck, Crown,
  UserCircle, Briefcase, Receipt, CalendarCheck,
  Megaphone, FileText, MapPin, Cpu, Truck,
  PieChart, ShoppingCart, Laptop, Shield, Book, CreditCard, UserMinus,
  Wrench, AlertTriangle, ClipboardList, BarChart2, Calendar, HelpCircle, Network,
  Video, Warehouse, Factory, GraduationCap, FlaskConical, BookOpen,
  ArrowUpDown, BadgeDollarSign, Landmark, Scale, BarChart,
} from 'lucide-react'

/* ── Nav item definition ─────────────────────────────────────────── */
type NavItem = { name: string; href: string; icon: React.ElementType }
type NavGroup = { label: string; items: NavItem[] }

const ALL_NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { name: 'My Home',      href: '/home',          icon: Home },
      { name: 'Dashboard',    href: '/dashboard',     icon: LayoutDashboard },
      { name: 'Cockpit',      href: '/cockpit',       icon: PieChart },
      { name: 'Office Feed',  href: '/feed',          icon: Megaphone },
    ]
  },
  {
    label: 'People',
    items: [
      { name: 'Org Chart',     href: '/org-chart',     icon: Network },
      { name: 'HRMS',         href: '/hrms',          icon: Users },
      { name: 'Attendance',   href: '/attendance',    icon: Clock },
      { name: 'Payroll',      href: '/payroll',       icon: Banknote },
      { name: 'Salary',       href: '/salary',        icon: Wallet },
      { name: 'Leave',        href: '/leave',         icon: CalendarCheck },
      { name: 'WFH Requests', href: '/wfh',           icon: Home },
      { name: 'Resignations', href: '/resignations',  icon: UserMinus },
    ]
  },
  {
    label: 'Recruitment & Talent',
    items: [
      { name: 'Recruitment',    href: '/recruitment',    icon: Briefcase },
      { name: 'AI Interviews',  href: '/ai-interviews',  icon: Video },
      { name: 'Offer Letters',  href: '/offer-letters',  icon: FileText },
      { name: 'Job Studio',     href: '/job-studio',     icon: Cpu },
      { name: 'LMS / Learning', href: '/lms',            icon: GraduationCap },
    ]
  },
  {
    label: 'Finance & Accounting',
    items: [
      { name: 'Finance',        href: '/finance',       icon: TrendingUp },
      { name: 'Accounting (GL)', href: '/accounting',   icon: BookOpen },
      { name: 'GST',            href: '/gst',           icon: Landmark },
      { name: 'TDS / TCS',      href: '/tds',           icon: BadgeDollarSign },
      { name: 'Fixed Assets',   href: '/fixed-assets',  icon: Cpu },
      { name: 'Budgeting',      href: '/budgeting',     icon: BarChart3 },
      { name: 'Statutory',      href: '/statutory',     icon: Scale },
      { name: 'Expenses',       href: '/expenses',      icon: Receipt },
    ]
  },
  {
    label: 'Inventory & Warehouse',
    items: [
      { name: 'IMS / WMS Suite',    href: '/inventory-suite',         icon: Warehouse },
      { name: 'Item Master',        href: '/inventory-suite/items',   icon: Package },
      { name: 'Warehouses',         href: '/inventory-suite/warehouses', icon: Building2 },
      { name: 'Purchase Requests',  href: '/inventory-suite/pr',      icon: FileText },
      { name: 'Import Tracking',    href: '/inventory-suite/imports', icon: ArrowUpDown },
      { name: 'Stock Ledger',       href: '/inventory-suite/ledger',  icon: BookOpen },
      { name: 'Reorder Alerts',     href: '/inventory-suite/reorder', icon: AlertTriangle },
    ]
  },
  {
    label: 'Supply Chain',
    items: [
      { name: 'Sales & Distribution', href: '/sales',    icon: ShoppingCart },
      { name: 'Procurement',   href: '/procurement',     icon: Package },
      { name: 'Vendor Mgmt',   href: '/vendor',          icon: Building2 },
      { name: 'Biz Orders',    href: '/business-orders', icon: Target },
      { name: 'Goods Receipts',href: '/goods-receipts',  icon: Truck },
      { name: 'CRM',           href: '/crm',             icon: Target },
    ]
  },
  {
    label: 'Manufacturing',
    items: [
      { name: 'Production',    href: '/production',      icon: Factory },
      { name: 'Quality (QM)',  href: '/quality',         icon: FlaskConical },
    ]
  },
  {
    label: 'Operations',
    items: [
      { name: 'Projects',     href: '/projects',      icon: Zap },
      { name: 'Timesheets',   href: '/timesheets',    icon: Clock },
      { name: 'Travel',       href: '/travel',        icon: MapPin },
      { name: 'Assets',       href: '/assets',        icon: Laptop },
      { name: 'Team',         href: '/team',          icon: Users },
      { name: 'Support',      href: '/support',       icon: MessageSquare },
      { name: 'Analytics',    href: '/analytics',     icon: BarChart3 },
    ]
  },
  {
    label: 'Knowledge & Compliance',
    items: [
      { name: 'Knowledge Base', href: '/kb',           icon: Book },
      { name: 'IATF Hub',       href: '/iatf',         icon: ShieldCheck },
      { name: 'POSH',           href: '/posh',         icon: Shield },
      { name: 'PIP',            href: '/pip',          icon: Target },
    ]
  },
  {
    label: 'Maintenance',
    items: [
      { name: 'Maintenance',    href: '/maintenance',              icon: Wrench },
      { name: 'Equipment',      href: '/maintenance/equipment',    icon: Package },
      { name: 'Task Lists',     href: '/maintenance/task-lists',   icon: ClipboardList },
      { name: 'Breakdowns',     href: '/maintenance/breakdowns',   icon: AlertTriangle },
      { name: 'Why-Why',        href: '/maintenance/why-why',      icon: HelpCircle },
      { name: 'MTTR & MTTF',    href: '/maintenance/mttr',         icon: BarChart2 },
      { name: 'Meters',         href: '/maintenance/meters',       icon: Zap },
      { name: 'PM / PdM Plan',  href: '/maintenance/pm-plan',      icon: Calendar },
    ]
  },
  {
    label: 'Admin',
    items: [
      { name: 'Settings',     href: '/settings',      icon: Settings },
      { name: 'Audit Logs',   href: '/audit',         icon: FileText },
      { name: 'Subscription', href: '/subscription',  icon: CreditCard },
      { name: 'SaaS Admin',   href: '/saas-admin',    icon: Crown },
    ]
  }
]

/* ── Role → allowed hrefs (null = all) ───────────────────────────── */
const ROLE_ACCESS: Record<string, Set<string> | null> = {
  admin:      null, // sees everything
  hr:         new Set(['/home', '/dashboard', '/hrms', '/attendance', '/payroll', '/salary', '/leave', '/wfh', '/resignations', '/recruitment', '/offer-letters', '/job-studio', '/crm', '/analytics', '/iatf', '/posh', '/pip', '/kb', '/feed']),
  manager:    new Set(['/home', '/dashboard', '/hrms', '/attendance', '/projects', '/timesheets', '/support', '/salary', '/leave', '/wfh', '/travel', '/feed', '/kb', '/maintenance', '/maintenance/equipment', '/maintenance/task-lists', '/maintenance/breakdowns', '/maintenance/why-why', '/maintenance/mttr', '/maintenance/meters', '/maintenance/pm-plan']),
  accountant: new Set(['/home', '/dashboard', '/finance', '/expenses', '/payroll', '/salary', '/procurement', '/business-orders', '/goods-receipts', '/analytics']),
  employee:   new Set(['/home', '/attendance', '/salary', '/leave', '/wfh', '/timesheets', '/expenses', '/travel', '/kb', '/feed']),
}

function getNavGroups(role: string): NavGroup[] {
  const allowed = ROLE_ACCESS[role] ?? null
  if (!allowed) return ALL_NAV_GROUPS // admin sees all

  return ALL_NAV_GROUPS
    .map(group => ({
      ...group,
      items: group.items.filter(item => allowed.has(item.href)),
    }))
    .filter(group => group.items.length > 0)
}

/* ── Role badge config ───────────────────────────────────────────── */
const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  admin:      { label: 'Admin',      color: 'text-red-600 bg-red-50',      icon: Crown },
  hr:         { label: 'HR',         color: 'text-blue-600 bg-blue-50',    icon: Users },
  manager:    { label: 'Manager',    color: 'text-amber-600 bg-amber-50',  icon: UserCircle },
  accountant: { label: 'Accountant', color: 'text-violet-600 bg-violet-50',icon: Wallet },
  employee:   { label: 'Employee',   color: 'text-slate-600 bg-slate-100', icon: UserCircle },
}

type UserProfile = {
  full_name: string
  email: string
  designation: string
  role: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [user,        setUser]        = useState<UserProfile | null>(null)
  const [notifCount,  setNotifCount]  = useState(0)

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/v1/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.employee)
        }
      } catch { /* silent */ }
    }
    async function loadNotifs() {
      try {
        const res = await fetch('/api/v1/notifications')
        if (res.ok) {
          const data = await res.json()
          setNotifCount(data.unread_count ?? 0)
        }
      } catch { /* silent */ }
    }
    loadUser()
    loadNotifs()
  }, [pathname])

  const handleLogout = async () => {
    // Clear dev session if active
    await fetch('/api/dev-login', { method: 'DELETE' }).catch(() => {})
    const supabase = createClient()
    await supabase.auth.signOut().catch(() => {})
    router.push('/login')
    router.refresh()
  }

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  const navGroups = getNavGroups(user?.role ?? 'employee')

  const currentPage = ALL_NAV_GROUPS.flatMap(g => g.items)
    .find(i => pathname === i.href || pathname.startsWith(i.href + '/'))

  const roleConfig = ROLE_CONFIG[user?.role ?? 'employee'] ?? ROLE_CONFIG.employee

  /* ── Sidebar Content ─────────────────────────────────────────────────────── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">

      {/* Logo */}
      <div className={cn(
        'flex items-center h-[52px] border-b border-slate-200 flex-shrink-0 px-3',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 tracking-tight">PRSK</span>
              <span className="block text-[10px] text-slate-400 leading-none mt-0.5">Enterprise Suite</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <ChevronLeft  className="h-3.5 w-3.5" />
          }
        </button>
      </div>

      {/* Role banner (only when expanded) */}
      {!collapsed && user?.role && (
        <div className={cn(
          'mx-2 mt-2 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5',
          roleConfig.color
        )}>
          <roleConfig.icon className="h-3 w-3 flex-shrink-0" />
          <span className="text-[11px] font-semibold truncate">{roleConfig.label} Portal</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {navGroups.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] px-2 mb-1">
                {group.label}
              </p>
            )}
            {collapsed && <div className="h-px bg-slate-100 mx-1 mb-2" />}
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.name : undefined}
                      className={cn(
                        'flex items-center rounded-lg text-[13px] font-medium transition-all duration-150',
                        collapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-2.5 px-2.5 h-8',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      )}
                    >
                      <item.icon className={cn(
                        'flex-shrink-0 transition-colors',
                        collapsed ? 'h-[18px] w-[18px]' : 'h-[15px] w-[15px]',
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      )} />
                      {!collapsed && item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-slate-200 p-2">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors mb-0.5 cursor-default">
            <div className="h-7 w-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {user ? initials(user.full_name) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                {user?.full_name ?? 'Loading...'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.designation ?? user?.role ?? ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-1">
            <div className="h-7 w-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {user ? initials(user.full_name) : '?'}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center rounded-lg text-xs font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors w-full',
            collapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-2 px-2.5 h-8'
          )}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col flex-shrink-0 border-r border-slate-200 shadow-sm transition-all duration-200',
        collapsed ? 'w-[60px]' : 'w-[228px]'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[228px] border-r border-slate-200 shadow-xl flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <header
          className="flex items-center justify-between gap-4 px-5 bg-white border-b border-slate-200 flex-shrink-0"
          style={{ height: '52px' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-400 text-xs font-medium">PRSK</span>
              <ChevronRight className="h-3 w-3 text-slate-300" />
              <span className="font-semibold text-slate-700 text-sm">
                {currentPage?.name || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Role badge in header */}
            {user?.role && (
              <span className={cn(
                'hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold',
                roleConfig.color
              )}>
                <roleConfig.icon className="h-3 w-3" />
                {roleConfig.label}
              </span>
            )}

            {/* Notification bell */}
            <Link
              href="/home"
              className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Bell className="h-4 w-4" />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-[7px] w-[7px] bg-red-500 rounded-full ring-1 ring-white" />
              )}
            </Link>

            {/* User chip */}
            <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-default">
              <div className="h-6 w-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {user ? initials(user.full_name) : '?'}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-slate-700">
                {user?.full_name?.split(' ')[0] ?? 'You'}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto p-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
