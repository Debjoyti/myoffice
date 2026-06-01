// @ts-nocheck
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Package, Warehouse, FileText, ShoppingCart, Truck,
  ArrowUpDown, Ship, ClipboardList, BarChart3, RefreshCw, ArrowDown,
  BookOpen,
} from 'lucide-react'

const NAV: { name: string; href: string; icon: React.ElementType; badge?: string }[] = [
  { name: 'Dashboard',         href: '/inventory-suite',                    icon: LayoutDashboard },
  { name: 'Item Master',       href: '/inventory-suite/items',              icon: Package },
  { name: 'Warehouses & Bins', href: '/inventory-suite/warehouses',         icon: Warehouse },
  { name: 'Stock Ledger',      href: '/inventory-suite/ledger',             icon: BookOpen },
  { name: 'Purchase Requests', href: '/inventory-suite/pr',                 icon: FileText,    badge: 'PR' },
  { name: 'Purchase Orders',   href: '/inventory-suite/po',                 icon: ShoppingCart,badge: 'PO' },
  { name: 'Goods Receipt',     href: '/inventory-suite/grn',                icon: ArrowDown,   badge: 'GRN' },
  { name: 'Goods Issue',       href: '/inventory-suite/gi',                 icon: RefreshCw,   badge: 'GI' },
  { name: 'Stock Transfer',    href: '/inventory-suite/sto',                icon: ArrowUpDown, badge: 'STO' },
  { name: 'Import Tracking',   href: '/inventory-suite/imports',            icon: Ship },
  { name: 'Physical Count',    href: '/inventory-suite/stock-count',        icon: ClipboardList },
  { name: 'Reorder Alerts',    href: '/inventory-suite/reorder',            icon: Truck },
  { name: 'Analytics',         href: '/inventory-suite/analytics',          icon: BarChart3 },
]

export default function InventorySuiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full -m-5">
      {/* Sub-sidebar */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 flex flex-col h-full overflow-y-auto">
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-blue-500 flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Inventory &</p>
              <p className="text-xs font-bold text-white">Warehouse Suite</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map(item => {
            const isActive = item.href === '/inventory-suite'
              ? pathname === '/inventory-suite'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 h-8 rounded-md text-[12.5px] font-medium transition-all',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="flex-1 truncate">{item.name}</span>
                {item.badge && (
                  <span className={cn(
                    'text-[9px] font-bold px-1.5 py-0.5 rounded',
                    isActive ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-3 border-t border-slate-700">
          <p className="text-[10px] text-slate-500">IMS / WMS v2.0</p>
          <p className="text-[10px] text-slate-600">SAP MM + WM equivalent</p>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
