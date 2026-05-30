'use client'

import Link from 'next/link'
import {
  Wrench, AlertTriangle, ClipboardList, BarChart2,
  Zap, Calendar, Settings, HelpCircle, Package
} from 'lucide-react'

const CARDS = [
  {
    title: 'Equipment',
    desc: 'Add, edit and view all plant equipment',
    href: '/maintenance/equipment',
    icon: Package,
    color: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  {
    title: 'Task Lists',
    desc: 'Create preventive & predictive task operations',
    href: '/maintenance/task-lists',
    icon: ClipboardList,
    color: 'bg-violet-50 text-violet-600 border-violet-100',
  },
  {
    title: 'Breakdown Reports',
    desc: 'Log malfunction/breakdown notifications',
    href: '/maintenance/breakdowns',
    icon: AlertTriangle,
    color: 'bg-red-50 text-red-600 border-red-100',
  },
  {
    title: 'Why-Why Analysis',
    desc: 'Root cause analysis for equipment failures',
    href: '/maintenance/why-why',
    icon: HelpCircle,
    color: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  {
    title: 'MTTR & MTTF',
    desc: 'Mean time to repair and between failures',
    href: '/maintenance/mttr',
    icon: BarChart2,
    color: 'bg-green-50 text-green-600 border-green-100',
  },
  {
    title: 'Electricity Meters',
    desc: 'Daily meter readings and unit tracking',
    href: '/maintenance/meters',
    icon: Zap,
    color: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  },
  {
    title: 'PM / PdM Plan',
    desc: 'Preventive and predictive maintenance calendar',
    href: '/maintenance/pm-plan',
    icon: Calendar,
    color: 'bg-teal-50 text-teal-600 border-teal-100',
  },
  {
    title: 'Settings',
    desc: 'Manage categories, locations, object types',
    href: '/maintenance/equipment',
    icon: Settings,
    color: 'bg-slate-50 text-slate-600 border-slate-100',
  },
]

export default function MaintenancePage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <Wrench className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Department</h1>
          <p className="text-sm text-slate-500">SAP-grade plant maintenance management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CARDS.map(c => (
          <Link
            key={c.href + c.title}
            href={c.href}
            className={`group rounded-xl border p-5 hover:shadow-md transition-all ${c.color}`}
          >
            <c.icon className="h-6 w-6 mb-3" />
            <p className="font-semibold text-sm">{c.title}</p>
            <p className="text-xs opacity-70 mt-1 leading-snug">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
