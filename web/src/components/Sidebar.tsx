'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  Wallet,
  Receipt,
  LineChart,
  GraduationCap,
  HeartPulse,
  Banknote,
  FileText,
  CreditCard,
  Building2,
  BookOpen,
  PieChart,
  TrendingUp,
  Target,
  UserSquare2,
  ListTodo,
  FileSignature,
  Package,
  ShoppingCart,
  ArrowRightLeft,
  Warehouse,
  FolderKanban,
  CheckSquare,
  Clock,
  Headset,
  Ticket,
  BookMarked,
  BarChart4,
  Settings,
  Shield,
  Plug,
  ActivitySquare,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'

const NAVIGATION = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'People',
    icon: Users,
    children: [
      { name: 'Employees', href: '/people/employees', icon: Users },
      { name: 'Org Chart', href: '/people/org-chart', icon: Building2 },
      { name: 'Attendance', href: '/people/attendance', icon: Clock },
      { name: 'Leave Management', href: '/people/leave', icon: Calendar },
      { name: 'Payroll', href: '/people/payroll', icon: Banknote },
      { name: 'Reimbursements', href: '/people/reimbursements', icon: Receipt },
      { name: 'Performance', href: '/people/performance', icon: TrendingUp },
      { name: 'Learning & Development', href: '/people/learning', icon: GraduationCap },
      { name: 'Benefits & Compliance', href: '/people/benefits', icon: HeartPulse },
    ],
  },
  {
    name: 'Finance',
    icon: Wallet,
    children: [
      { name: 'Dashboard (P&L snapshot)', href: '/finance/dashboard', icon: PieChart },
      { name: 'Invoices', href: '/finance/invoices', icon: FileText },
      { name: 'Bills', href: '/finance/bills', icon: FileSignature },
      { name: 'Payments', href: '/finance/payments', icon: CreditCard },
      { name: 'Customers', href: '/finance/customers', icon: Users },
      { name: 'Vendors', href: '/finance/vendors', icon: Building2 },
      { name: 'Journal Entries', href: '/finance/journals', icon: BookOpen },
      { name: 'Chart of Accounts', href: '/finance/accounts', icon: ListTodo },
      { name: 'Budgets', href: '/finance/budgets', icon: Target },
      { name: 'Reports', href: '/finance/reports', icon: BarChart4 },
    ],
  },
  {
    name: 'CRM',
    icon: Target,
    children: [
      { name: 'Pipeline (Kanban)', href: '/crm/pipeline', icon: FolderKanban },
      { name: 'Leads', href: '/crm/leads', icon: UserSquare2 },
      { name: 'Deals', href: '/crm/deals', icon: Briefcase },
      { name: 'Contacts', href: '/crm/contacts', icon: Users },
      { name: 'Activities', href: '/crm/activities', icon: ActivitySquare },
      { name: 'Quotes', href: '/crm/quotes', icon: FileText },
    ],
  },
  {
    name: 'Inventory',
    icon: Package,
    children: [
      { name: 'Products', href: '/inventory/products', icon: Package },
      { name: 'Purchase Orders', href: '/inventory/purchase-orders', icon: ShoppingCart },
      { name: 'Stock Movements', href: '/inventory/movements', icon: ArrowRightLeft },
      { name: 'Warehouses', href: '/inventory/warehouses', icon: Warehouse },
      { name: 'Reports', href: '/inventory/reports', icon: BarChart4 },
    ],
  },
  {
    name: 'Projects',
    icon: FolderKanban,
    children: [
      { name: 'All Projects', href: '/projects/all', icon: Briefcase },
      { name: 'My Tasks', href: '/projects/tasks', icon: CheckSquare },
      { name: 'Kanban Board', href: '/projects/kanban', icon: FolderKanban },
      { name: 'Gantt View', href: '/projects/gantt', icon: Calendar },
      { name: 'Timesheets', href: '/projects/timesheets', icon: Clock },
    ],
  },
  {
    name: 'Support',
    icon: Headset,
    children: [
      { name: 'Tickets', href: '/support/tickets', icon: Ticket },
      { name: 'My Tickets', href: '/support/my-tickets', icon: Ticket },
      { name: 'Knowledge Base', href: '/support/kb', icon: BookMarked },
      { name: 'SLA Reports', href: '/support/sla', icon: BarChart4 },
    ],
  },
  {
    name: 'Analytics',
    icon: LineChart,
    children: [
      { name: 'Overview', href: '/analytics/overview', icon: PieChart },
      { name: 'HR Analytics', href: '/analytics/hr', icon: Users },
      { name: 'Finance Analytics', href: '/analytics/finance', icon: Wallet },
      { name: 'Sales Analytics', href: '/analytics/sales', icon: Target },
      { name: 'Custom Reports', href: '/analytics/custom', icon: BarChart4 },
    ],
  },
  {
    name: 'Admin',
    icon: Settings,
    children: [
      { name: 'Users & Roles', href: '/admin/users', icon: Shield },
      { name: 'Company Settings', href: '/admin/settings', icon: Settings },
      { name: 'Integrations', href: '/admin/integrations', icon: Plug },
      { name: 'Audit Logs', href: '/admin/audit', icon: ActivitySquare },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})

  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
    return null
  }

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [name]: !prev[name],
    }))
  }

  return (
    <aside
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } h-screen`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && <span className="font-bold text-xl text-brand-600">PRSK</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded hover:bg-gray-100 text-gray-500"
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAVIGATION.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <>
                <button
                  onClick={() => !collapsed && toggleMenu(item.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                    openMenus[item.name]
                      ? 'bg-gray-50 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon size={20} className="shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${
                        openMenus[item.name] ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>
                {!collapsed && openMenus[item.name] && (
                  <div className="mt-1 space-y-1 pl-10 pr-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                          pathname === child.href
                            ? 'bg-brand-50 text-brand-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  pathname === item.href
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <item.icon size={20} className="shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}
