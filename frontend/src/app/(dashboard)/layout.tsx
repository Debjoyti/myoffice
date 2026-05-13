'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Clock, Banknote, Briefcase,
  ShoppingCart, LogOut, ChevronLeft, ChevronRight,
  Building2, Target, FileText, UserCheck, BarChart3,
  Settings, HelpCircle, Bell, Search, ChevronDown,
  TrendingUp, Zap, Package, MessageSquare
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
        'flex items-center h-14 border-b flex-shrink-0 transition-all duration-200',
        'border-white/8 px-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">PRSK</span>
              <span className="block text-[10px] text-slate-500 leading-none">Enterprise Suite</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-2 mb-1">
                {group.label}
              </p>
            )}
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
                        'flex items-center rounded-md text-sm font-medium transition-all duration-150',
                        collapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-2.5 px-2.5 h-8',
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/6'
                      )}
                    >
                      <item.icon className={cn('flex-shrink-0', collapsed ? 'h-4.5 w-4.5' : 'h-4 w-4')} />
                      {!collapsed && item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/8 p-2 space-y-0.5">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center rounded-md text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-white/6 transition-colors w-full',
            collapsed ? 'justify-center h-9 w-9 mx-auto' : 'gap-2.5 px-2.5 h-8'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col flex-shrink-0 bg-slate-950 border-r border-white/6 transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-slate-950 border-r border-white/6 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between gap-4 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-slate-400 dark:text-slate-500">PRSK</span>
              <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {currentPage?.name || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Search trigger */}
            <button className="hidden sm:flex items-center gap-2 h-8 px-3 text-sm text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 hover:border-slate-300 transition-colors">
              <Search className="h-3.5 w-3.5" />
              <span className="text-xs">Search...</span>
              <kbd className="text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1 ml-2">⌘K</kbd>
            </button>
            {/* Notifications */}
            <button className="relative p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
            </button>
            {/* Avatar */}
            <button className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center">
                AD
              </span>
              <span className="hidden sm:block text-xs font-medium text-slate-700 dark:text-slate-200">Admin</span>
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
