'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Package, PlusCircle, BarChart3, Settings, Search, MapPin
} from 'lucide-react'

const TABS = [
  { name: 'Overview',   href: '/personal-assets',            icon: LayoutDashboard },
  { name: 'Inventory',  href: '/personal-assets/inventory',  icon: Package         },
  { name: 'Tracker',    href: '/personal-assets/tracker',    icon: MapPin          },
  { name: 'Add Asset',  href: '/personal-assets/add',        icon: PlusCircle      },
  { name: 'Search',     href: '/personal-assets/search',     icon: Search          },
  { name: 'Reports',    href: '/personal-assets/reports',    icon: BarChart3       },
  { name: 'Settings',   href: '/personal-assets/settings',   icon: Settings        },
]

export default function PersonalAssetsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-0">
      {/* Sub-navigation */}
      <div className="bg-white border border-slate-200 rounded-lg mb-5 overflow-hidden">
        <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100">
          <div className="h-7 w-7 rounded-md bg-indigo-600 flex items-center justify-center mr-2">
            <Package className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 leading-none">Personal Asset Store</p>
            <p className="text-[10px] text-slate-400 mt-0.5">SAP-grade personal inventory management</p>
          </div>
        </div>
        <nav className="flex items-center gap-0.5 px-3 py-2 overflow-x-auto">
          {TABS.map(tab => {
            const isActive = tab.href === '/personal-assets'
              ? pathname === '/personal-assets'
              : pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-150',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                )}
              >
                <tab.icon className={cn('h-3.5 w-3.5', isActive ? 'text-indigo-600' : 'text-slate-400')} />
                {tab.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {children}
    </div>
  )
}
