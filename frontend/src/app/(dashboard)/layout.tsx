'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Clock,
  Banknote,
  Briefcase,
  ShoppingCart,
  LogOut
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'HRMS', href: '/hrms', icon: Users },
  { name: 'Attendance', href: '/attendance', icon: Clock },
  { name: 'Payroll', href: '/payroll', icon: Banknote },
  { name: 'Finance', href: '/finance', icon: Briefcase },
  { name: 'Procurement', href: '/procurement', icon: ShoppingCart },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700 px-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">PRSK</h1>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto pt-5 pb-4">
          <nav className="mt-2 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive
                        ? 'text-blue-700 dark:text-blue-200'
                        : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white capitalize">
            {pathname.split('/').pop() || 'Dashboard'}
          </h2>
          <div className="flex items-center md:hidden">
             <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Logout</span>
              <LogOut className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Main section */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
