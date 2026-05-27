'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, GraduationCap, Lightbulb, Grid3x3,
  ShieldCheck, UserCheck, GitBranch, FileText
} from 'lucide-react'

const IATF_NAV = [
  { name: 'Hub', href: '/iatf', icon: LayoutDashboard },
  { name: 'Training', href: '/iatf/training', icon: GraduationCap },
  { name: 'Kaizen', href: '/iatf/kaizen', icon: Lightbulb },
  { name: 'Matrices', href: '/iatf/matrices', icon: Grid3x3 },
  { name: 'Compliance', href: '/iatf/compliance', icon: ShieldCheck },
  { name: 'Induction', href: '/iatf/induction', icon: UserCheck },
  { name: 'Process Mgmt', href: '/iatf/process', icon: GitBranch },
  { name: 'Job Descriptions', href: '/iatf/job-descriptions', icon: FileText },
]

export default function IATFLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-0">
      {/* Secondary Nav */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 -mt-6 -mx-6 px-6 mb-6">
        <div className="flex items-center gap-0 overflow-x-auto">
          {IATF_NAV.map(item => {
            const isActive = pathname === item.href || (item.href !== '/iatf' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all',
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
      {children}
    </div>
  )
}
