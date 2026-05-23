'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Clock, Banknote,
  ShoppingCart, LogOut, ChevronLeft, ChevronRight,
  Building2, Target, FileText,
  Settings, Bell, Search, ChevronDown,
  TrendingUp, Zap, Package, MessageSquare, BarChart3
} from 'lucide-react'

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    label: 'People',
    items: [
      { name: 'HRMS', href: '/hrms', icon: Users },
      { name: 'Attendance', href: '/attendance', icon: Clock },
      { name: 'Payroll', href: '/payroll', icon: Banknote },
    ]
  },
  {
    label: 'Business',
    items: [
      { name: 'Finance', href: '/finance', icon: TrendingUp },
      { name: 'Procurement', href: '/procurement', icon: Package },
      { name: 'CRM', href: '/crm', icon: Target },
    ]
  },
  {
    label: 'Operations',
    items: [
      { name: 'Projects', href: '/projects', icon: Zap },
      { name: 'Support', href: '/support', icon: MessageSquare },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ]
  },
  {
    label: 'Admin',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
    ]
  }
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const currentPage = NAV_GROUPS.flatMap(g => g.items).find(i => pathname === i.href || pathname.startsWith(i.href + '/'))

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center h-14 border-b flex-shrink-0',
        'border-white/[0.06] px-3',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-900/40">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">PRSK</span>
              <span className="block text-[10px] text-slate-500 leading-none mt-0.5">Enterprise Suite</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <Building2 className="h-4 w-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1 rounded-md text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.12em] px-2.5 mb-1.5">
                {group.label}
              </p>
            )}
            {collapsed && <div className="h-px bg-white/[0.04] mx-1 mb-2" />}
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
                        'flex items-center rounded-lg text-sm font-medium transition-all duration-150',
                        collapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-2.5 px-2.5 h-8',
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]'
                      )}
                    >
                      <item.icon className={cn('flex-shrink-0', collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4')} />
                      {!collapsed && item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/[0.06] p-2">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-colors mb-0.5 cursor-default">
            <span className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              AD
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate leading-tight">Admin User</p>
              <p className="text-[10px] text-slate-500 truncate">admin@prsk.in</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-1">
            <span className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
              AD
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center rounded-lg text-xs font-medium text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors w-full',
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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col flex-shrink-0 bg-slate-950 border-r border-white/[0.06] transition-all duration-200',
        collapsed ? 'w-[60px]' : 'w-[228px]'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[228px] bg-slate-950 border-r border-white/[0.06] flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-13 flex items-center justify-between gap-4 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0" style={{ height: '52px' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-400 dark:text-slate-500 text-xs">PRSK</span>
              <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
              <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                {currentPage?.name || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button className="hidden sm:flex items-center gap-2 h-8 px-3 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-slate-600 dark:hover:text-slate-300 transition-all group">
              <Search className="h-3.5 w-3.5 group-hover:text-indigo-500 transition-colors" />
              <span>Search...</span>
              <kbd className="ml-1 text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
            </button>
            <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-red-500 rounded-full ring-1 ring-white dark:ring-slate-900" />
            </button>
            <button className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                AD
              </span>
              <span className="hidden sm:block text-xs font-semibold text-slate-700 dark:text-slate-200">Admin</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
