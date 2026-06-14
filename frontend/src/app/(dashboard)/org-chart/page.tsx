'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Crown, Users, Briefcase, Building2, ShieldCheck, Target,
  Truck, Package, UserCheck, Star, BarChart3, Wrench,
  FlaskConical, ChevronDown, ChevronRight, Search,
  ZoomIn, ZoomOut, Maximize2,
} from 'lucide-react'

/* ── Types ───────────────────────────────────────────────────────────── */
type OrgNode = {
  id: string
  name: string
  title: string
  department: string
  level: number          // 1 = top, 14 = bottom
  tier: string           // tier label
  email?: string
  reportCount?: number
  children?: OrgNode[]
  type: 'executive' | 'senior-management' | 'management' | 'supervisor' |
        'specialist' | 'associate' | 'coordinator' | 'analyst' | 'technician' |
        'support' | 'intern' | 'vendor' | 'contractor' | 'consultant'
  avatar?: string
}

/* ── 14-Level Org Hierarchy ──────────────────────────────────────────── */
const TIER_COLORS: Record<number, { bg: string; border: string; text: string; badge: string }> = {
  1:  { bg: 'bg-purple-950',  border: 'border-purple-400', text: 'text-purple-100',  badge: 'bg-purple-500' },
  2:  { bg: 'bg-purple-900',  border: 'border-purple-400', text: 'text-purple-100',  badge: 'bg-purple-600' },
  3:  { bg: 'bg-indigo-900',  border: 'border-indigo-400', text: 'text-indigo-100',  badge: 'bg-indigo-500' },
  4:  { bg: 'bg-blue-900',    border: 'border-blue-400',   text: 'text-blue-100',    badge: 'bg-blue-500' },
  5:  { bg: 'bg-blue-800',    border: 'border-blue-300',   text: 'text-blue-100',    badge: 'bg-blue-400' },
  6:  { bg: 'bg-cyan-800',    border: 'border-cyan-300',   text: 'text-cyan-100',    badge: 'bg-cyan-500' },
  7:  { bg: 'bg-teal-800',    border: 'border-teal-300',   text: 'text-teal-100',    badge: 'bg-teal-500' },
  8:  { bg: 'bg-green-800',   border: 'border-green-300',  text: 'text-green-100',   badge: 'bg-green-500' },
  9:  { bg: 'bg-lime-800',    border: 'border-lime-300',   text: 'text-lime-100',    badge: 'bg-lime-500' },
  10: { bg: 'bg-yellow-800',  border: 'border-yellow-300', text: 'text-yellow-100',  badge: 'bg-yellow-500' },
  11: { bg: 'bg-orange-800',  border: 'border-orange-300', text: 'text-orange-100',  badge: 'bg-orange-500' },
  12: { bg: 'bg-red-800',     border: 'border-red-300',    text: 'text-red-100',     badge: 'bg-red-500' },
  13: { bg: 'bg-rose-900',    border: 'border-rose-300',   text: 'text-rose-100',    badge: 'bg-rose-500' },
  14: { bg: 'bg-slate-800',   border: 'border-slate-400',  text: 'text-slate-100',   badge: 'bg-slate-500' },
}

const TIER_LABELS: Record<number, string> = {
  1:  'Tier 1 — Board / Chairperson',
  2:  'Tier 2 — C-Suite',
  3:  'Tier 3 — President / EVP',
  4:  'Tier 4 — Vice President',
  5:  'Tier 5 — Senior Director',
  6:  'Tier 6 — Director',
  7:  'Tier 7 — Senior Manager',
  8:  'Tier 8 — Manager',
  9:  'Tier 9 — Team Lead / Supervisor',
  10: 'Tier 10 — Senior Associate / Specialist',
  11: 'Tier 11 — Associate / Analyst',
  12: 'Tier 12 — Coordinator / Technician',
  13: 'Tier 13 — Intern / Trainee',
  14: 'Tier 14 — Vendor / Contractor / Consultant',
}

const ORG_DATA: OrgNode = {
  id: 'board-chair',
  name: 'Rajesh Kumar',
  title: 'Chairman & Managing Director',
  department: 'Board',
  level: 1,
  tier: TIER_LABELS[1],
  type: 'executive',
  reportCount: 4,
  email: 'chairman@myoffice.com',
  children: [
    {
      id: 'ceo',
      name: 'Priya Sharma',
      title: 'Chief Executive Officer',
      department: 'Executive',
      level: 2,
      tier: TIER_LABELS[2],
      type: 'executive',
      reportCount: 5,
      email: 'ceo@myoffice.com',
      children: [
        {
          id: 'president-ops',
          name: 'Vikram Singh',
          title: 'President — Operations',
          department: 'Operations',
          level: 3,
          tier: TIER_LABELS[3],
          type: 'executive',
          reportCount: 3,
          children: [
            {
              id: 'vp-ops',
              name: 'Anita Desai',
              title: 'VP — Operations',
              department: 'Operations',
              level: 4,
              tier: TIER_LABELS[4],
              type: 'senior-management',
              reportCount: 2,
              children: [
                {
                  id: 'sd-ops',
                  name: 'Ravi Mehta',
                  title: 'Senior Director — Ops',
                  department: 'Operations',
                  level: 5,
                  tier: TIER_LABELS[5],
                  type: 'senior-management',
                  reportCount: 2,
                  children: [
                    {
                      id: 'dir-ops',
                      name: 'Sunita Rao',
                      title: 'Director — Field Ops',
                      department: 'Operations',
                      level: 6,
                      tier: TIER_LABELS[6],
                      type: 'management',
                      reportCount: 3,
                      children: [
                        {
                          id: 'smgr-ops',
                          name: 'Deepak Joshi',
                          title: 'Senior Manager — Logistics',
                          department: 'Operations',
                          level: 7,
                          tier: TIER_LABELS[7],
                          type: 'management',
                          reportCount: 4,
                          children: [
                            {
                              id: 'mgr-ops',
                              name: 'Kavita Nair',
                              title: 'Manager — Warehouse',
                              department: 'Warehouse',
                              level: 8,
                              tier: TIER_LABELS[8],
                              type: 'management',
                              reportCount: 5,
                              children: [
                                {
                                  id: 'lead-wh',
                                  name: 'Arjun Patel',
                                  title: 'Team Lead — Warehouse',
                                  department: 'Warehouse',
                                  level: 9,
                                  tier: TIER_LABELS[9],
                                  type: 'supervisor',
                                  reportCount: 6,
                                  children: [
                                    {
                                      id: 'sr-spec-wh',
                                      name: 'Meena Gupta',
                                      title: 'Sr. Inventory Specialist',
                                      department: 'Warehouse',
                                      level: 10,
                                      tier: TIER_LABELS[10],
                                      type: 'specialist',
                                      reportCount: 2,
                                      children: [
                                        {
                                          id: 'assoc-wh',
                                          name: 'Rahul Verma',
                                          title: 'Inventory Associate',
                                          department: 'Warehouse',
                                          level: 11,
                                          tier: TIER_LABELS[11],
                                          type: 'associate',
                                          reportCount: 1,
                                          children: [
                                            {
                                              id: 'coord-wh',
                                              name: 'Pooja Bhat',
                                              title: 'Stock Coordinator',
                                              department: 'Warehouse',
                                              level: 12,
                                              tier: TIER_LABELS[12],
                                              type: 'coordinator',
                                              reportCount: 1,
                                              children: [
                                                {
                                                  id: 'intern-wh',
                                                  name: 'Amit Shah',
                                                  title: 'Warehouse Intern',
                                                  department: 'Warehouse',
                                                  level: 13,
                                                  tier: TIER_LABELS[13],
                                                  type: 'intern',
                                                  children: [
                                                    {
                                                      id: 'vendor-1',
                                                      name: 'FastMove Logistics',
                                                      title: 'Logistics Vendor',
                                                      department: 'External',
                                                      level: 14,
                                                      tier: TIER_LABELS[14],
                                                      type: 'vendor',
                                                      email: 'ops@fastmove.com',
                                                    }
                                                  ]
                                                }
                                              ]
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'cfo',
          name: 'Neha Kapoor',
          title: 'Chief Financial Officer',
          department: 'Finance',
          level: 2,
          tier: TIER_LABELS[2],
          type: 'executive',
          reportCount: 3,
          email: 'cfo@myoffice.com',
          children: [
            {
              id: 'vp-finance',
              name: 'Suresh Iyer',
              title: 'VP — Finance',
              department: 'Finance',
              level: 4,
              tier: TIER_LABELS[4],
              type: 'senior-management',
              reportCount: 2,
              children: [
                {
                  id: 'dir-fin',
                  name: 'Lata Krishnan',
                  title: 'Director — Accounts',
                  department: 'Finance',
                  level: 6,
                  tier: TIER_LABELS[6],
                  type: 'management',
                  reportCount: 3,
                  children: [
                    {
                      id: 'mgr-fin',
                      name: 'Prakash Dubey',
                      title: 'Manager — Accounts Payable',
                      department: 'Finance',
                      level: 8,
                      tier: TIER_LABELS[8],
                      type: 'management',
                      reportCount: 3,
                      children: [
                        {
                          id: 'sr-analyst-fin',
                          name: 'Rekha Mishra',
                          title: 'Sr. Financial Analyst',
                          department: 'Finance',
                          level: 10,
                          tier: TIER_LABELS[10],
                          type: 'specialist',
                          children: [
                            {
                              id: 'analyst-fin',
                              name: 'Vivek Tiwari',
                              title: 'Financial Analyst',
                              department: 'Finance',
                              level: 11,
                              tier: TIER_LABELS[11],
                              type: 'analyst',
                              children: [
                                {
                                  id: 'intern-fin',
                                  name: 'Shruti Das',
                                  title: 'Finance Intern',
                                  department: 'Finance',
                                  level: 13,
                                  tier: TIER_LABELS[13],
                                  type: 'intern',
                                  children: [
                                    {
                                      id: 'consultant-fin',
                                      name: 'Deloitte Advisory',
                                      title: 'Financial Consultant',
                                      department: 'External',
                                      level: 14,
                                      tier: TIER_LABELS[14],
                                      type: 'consultant',
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'cto',
          name: 'Arun Menon',
          title: 'Chief Technology Officer',
          department: 'Technology',
          level: 2,
          tier: TIER_LABELS[2],
          type: 'executive',
          reportCount: 4,
          email: 'cto@myoffice.com',
          children: [
            {
              id: 'vp-eng',
              name: 'Divya Pillai',
              title: 'VP — Engineering',
              department: 'Engineering',
              level: 4,
              tier: TIER_LABELS[4],
              type: 'senior-management',
              reportCount: 3,
              children: [
                {
                  id: 'sd-eng',
                  name: 'Kiran Bose',
                  title: 'Senior Director — Product',
                  department: 'Product',
                  level: 5,
                  tier: TIER_LABELS[5],
                  type: 'senior-management',
                  children: [
                    {
                      id: 'dir-eng',
                      name: 'Manish Saxena',
                      title: 'Director — Engineering',
                      department: 'Engineering',
                      level: 6,
                      tier: TIER_LABELS[6],
                      type: 'management',
                      children: [
                        {
                          id: 'smgr-eng',
                          name: 'Swati Kulkarni',
                          title: 'Senior Manager — Dev',
                          department: 'Engineering',
                          level: 7,
                          tier: TIER_LABELS[7],
                          type: 'management',
                          children: [
                            {
                              id: 'mgr-eng',
                              name: 'Rohit Chatterjee',
                              title: 'Engineering Manager',
                              department: 'Engineering',
                              level: 8,
                              tier: TIER_LABELS[8],
                              type: 'management',
                              children: [
                                {
                                  id: 'lead-eng',
                                  name: 'Nisha Banerjee',
                                  title: 'Tech Lead',
                                  department: 'Engineering',
                                  level: 9,
                                  tier: TIER_LABELS[9],
                                  type: 'supervisor',
                                  children: [
                                    {
                                      id: 'sr-dev',
                                      name: 'Gaurav Pandey',
                                      title: 'Senior Software Engineer',
                                      department: 'Engineering',
                                      level: 10,
                                      tier: TIER_LABELS[10],
                                      type: 'specialist',
                                      children: [
                                        {
                                          id: 'dev',
                                          name: 'Trisha Reddy',
                                          title: 'Software Engineer',
                                          department: 'Engineering',
                                          level: 11,
                                          tier: TIER_LABELS[11],
                                          type: 'associate',
                                          children: [
                                            {
                                              id: 'tech-eng',
                                              name: 'Farhan Ansari',
                                              title: 'QA Technician',
                                              department: 'Engineering',
                                              level: 12,
                                              tier: TIER_LABELS[12],
                                              type: 'technician',
                                              children: [
                                                {
                                                  id: 'intern-eng',
                                                  name: 'Pallavi Jain',
                                                  title: 'Engineering Intern',
                                                  department: 'Engineering',
                                                  level: 13,
                                                  tier: TIER_LABELS[13],
                                                  type: 'intern',
                                                  children: [
                                                    {
                                                      id: 'contractor-eng',
                                                      name: 'TechPro Solutions',
                                                      title: 'IT Contractor',
                                                      department: 'External',
                                                      level: 14,
                                                      tier: TIER_LABELS[14],
                                                      type: 'contractor',
                                                    }
                                                  ]
                                                }
                                              ]
                                            }
                                          ]
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'chro',
          name: 'Smita Rao',
          title: 'Chief HR Officer',
          department: 'Human Resources',
          level: 2,
          tier: TIER_LABELS[2],
          type: 'executive',
          reportCount: 3,
          email: 'chro@myoffice.com',
          children: [
            {
              id: 'vp-hr',
              name: 'Dinesh Nambiar',
              title: 'VP — Human Resources',
              department: 'Human Resources',
              level: 4,
              tier: TIER_LABELS[4],
              type: 'senior-management',
              children: [
                {
                  id: 'dir-hr',
                  name: 'Shalini Mathur',
                  title: 'Director — HR',
                  department: 'Human Resources',
                  level: 6,
                  tier: TIER_LABELS[6],
                  type: 'management',
                  children: [
                    {
                      id: 'mgr-hr',
                      name: 'Tanvir Khan',
                      title: 'HR Manager',
                      department: 'Human Resources',
                      level: 8,
                      tier: TIER_LABELS[8],
                      type: 'management',
                      children: [
                        {
                          id: 'lead-hr',
                          name: 'Bindu Varghese',
                          title: 'HR Team Lead',
                          department: 'Human Resources',
                          level: 9,
                          tier: TIER_LABELS[9],
                          type: 'supervisor',
                          children: [
                            {
                              id: 'sr-hr',
                              name: 'Jayesh Kulkarni',
                              title: 'Sr. HR Specialist',
                              department: 'Human Resources',
                              level: 10,
                              tier: TIER_LABELS[10],
                              type: 'specialist',
                              children: [
                                {
                                  id: 'hr-coord',
                                  name: 'Usha Patel',
                                  title: 'HR Coordinator',
                                  department: 'Human Resources',
                                  level: 12,
                                  tier: TIER_LABELS[12],
                                  type: 'coordinator',
                                  children: [
                                    {
                                      id: 'intern-hr',
                                      name: 'Chirag Sharma',
                                      title: 'HR Intern',
                                      department: 'Human Resources',
                                      level: 13,
                                      tier: TIER_LABELS[13],
                                      type: 'intern',
                                      children: [
                                        {
                                          id: 'consultant-hr',
                                          name: 'PeopleFirst Consulting',
                                          title: 'HR Consultant',
                                          department: 'External',
                                          level: 14,
                                          tier: TIER_LABELS[14],
                                          type: 'consultant',
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

/* ── Node type icons ─────────────────────────────────────────────────── */
function typeIcon(type: OrgNode['type']) {
  switch (type) {
    case 'executive':       return <Crown className="w-3 h-3" />
    case 'senior-management': return <Star className="w-3 h-3" />
    case 'management':      return <Briefcase className="w-3 h-3" />
    case 'supervisor':      return <UserCheck className="w-3 h-3" />
    case 'specialist':      return <ShieldCheck className="w-3 h-3" />
    case 'associate':       return <Users className="w-3 h-3" />
    case 'coordinator':     return <Target className="w-3 h-3" />
    case 'analyst':         return <BarChart3 className="w-3 h-3" />
    case 'technician':      return <Wrench className="w-3 h-3" />
    case 'support':         return <FlaskConical className="w-3 h-3" />
    case 'intern':          return <Users className="w-3 h-3" />
    case 'vendor':          return <Truck className="w-3 h-3" />
    case 'contractor':      return <Package className="w-3 h-3" />
    case 'consultant':      return <Building2 className="w-3 h-3" />
    default:                return <Users className="w-3 h-3" />
  }
}

/* ── Initials avatar ─────────────────────────────────────────────────── */
function Initials({ name, level }: { name: string; level: number }) {
  const colors = TIER_COLORS[level] || TIER_COLORS[8]
  const parts = name.split(' ')
  const initials = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : name.slice(0, 2)
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
      ${colors.badge} text-white flex-shrink-0`}>
      {initials.toUpperCase()}
    </div>
  )
}

/* ── Single org card ─────────────────────────────────────────────────── */
function OrgCard({
  node,
  expanded,
  onToggle,
  selected,
  onSelect,
}: {
  node: OrgNode
  expanded: boolean
  onToggle: () => void
  selected: boolean
  onSelect: () => void
}) {
  const colors = TIER_COLORS[node.level] || TIER_COLORS[8]
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div
        onClick={onSelect}
        className={`relative cursor-pointer rounded-xl border-2 p-3 w-52 transition-all duration-200
          ${colors.bg} ${colors.border} ${colors.text}
          ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 shadow-xl scale-105' : 'hover:scale-[1.02] hover:shadow-lg'}
        `}
      >
        {/* Level badge */}
        <div className={`absolute -top-2 -right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full
          ${colors.badge} text-white`}>
          L{node.level}
        </div>

        <div className="flex items-start gap-2 mb-2">
          <Initials name={node.name} level={node.level} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs leading-tight truncate">{node.name}</div>
            <div className="text-[10px] opacity-80 leading-tight mt-0.5 line-clamp-2">{node.title}</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full ${colors.badge} text-white`}>
            {typeIcon(node.type)}
            <span className="capitalize">{node.type}</span>
          </div>
          <div className="text-[9px] opacity-60">{node.department}</div>
        </div>

        {node.reportCount && (
          <div className="mt-1.5 text-[9px] opacity-60 flex items-center gap-1">
            <Users className="w-2.5 h-2.5" />
            {node.reportCount} direct reports
          </div>
        )}
      </div>

      {/* Expand/collapse toggle */}
      {hasChildren && (
        <button
          onClick={onToggle}
          className="mt-1.5 w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center
            justify-center text-gray-300 transition-colors z-10"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      )}
    </div>
  )
}

/* ── Recursive tree renderer ─────────────────────────────────────────── */
function OrgTree({
  node,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
  isRoot = false,
}: {
  node: OrgNode
  expandedIds: Set<string>
  selectedId: string | null
  onToggle: (id: string) => void
  onSelect: (node: OrgNode) => void
  isRoot?: boolean
}) {
  const isExpanded = expandedIds.has(node.id)
  const children = node.children || []

  return (
    <div className={`flex flex-col items-center ${isRoot ? '' : ''}`}>
      <OrgCard
        node={node}
        expanded={isExpanded}
        onToggle={() => onToggle(node.id)}
        selected={selectedId === node.id}
        onSelect={() => onSelect(node)}
      />

      {isExpanded && children.length > 0 && (
        <>
          {/* Vertical line down */}
          <div className="w-px h-6 bg-gray-600" />

          {children.length === 1 ? (
            <OrgTree
              node={children[0]}
              expandedIds={expandedIds}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ) : (
            <div className="relative flex gap-8">
              {/* Horizontal spanning line */}
              <div
                className="absolute top-0 h-px bg-gray-600"
                style={{
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: `calc(100% - 4rem + 208px)`,
                }}
              />
              {children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  {/* Short vertical line from horizontal bar down */}
                  <div className="w-px h-6 bg-gray-600" />
                  <OrgTree
                    node={child}
                    expandedIds={expandedIds}
                    selectedId={selectedId}
                    onToggle={onToggle}
                    onSelect={onSelect}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Detail panel ────────────────────────────────────────────────────── */
function DetailPanel({ node, onClose }: { node: OrgNode; onClose: () => void }) {
  const colors = TIER_COLORS[node.level] || TIER_COLORS[8]
  return (
    <div className={`fixed right-0 top-0 h-full w-80 ${colors.bg} border-l ${colors.border}
      shadow-2xl z-50 flex flex-col`}>
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <span className={`text-sm font-semibold ${colors.text}`}>Profile</span>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
      </div>
      <div className="p-5 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center mb-6">
          <Initials name={node.name} level={node.level} />
          <div className={`mt-3 font-bold text-base ${colors.text}`}>{node.name}</div>
          <div className={`text-sm opacity-80 ${colors.text} text-center mt-1`}>{node.title}</div>
          <div className={`mt-2 text-xs px-3 py-1 rounded-full ${colors.badge} text-white`}>
            {node.tier}
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Department', value: node.department },
            { label: 'Level', value: `Level ${node.level} of 14` },
            { label: 'Type', value: node.type },
            node.email ? { label: 'Email', value: node.email } : null,
            node.reportCount ? { label: 'Direct Reports', value: `${node.reportCount} people` } : null,
          ].filter(Boolean).map((row: any) => (
            <div key={row.label} className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className={`text-xs opacity-60 ${colors.text}`}>{row.label}</span>
              <span className={`text-xs font-medium ${colors.text}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Tier legend ─────────────────────────────────────────────────────── */
function TierLegend() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(TIER_LABELS).map(([lvl, label]) => {
        const level = parseInt(lvl)
        const colors = TIER_COLORS[level]
        return (
          <div
            key={lvl}
            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
              ${colors.bg} ${colors.text} border ${colors.border}`}
          >
            <span className="font-bold">L{lvl}</span>
            <span className="hidden sm:inline opacity-80">{label.split('—')[1]?.trim()}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Flatten tree for search ─────────────────────────────────────────── */
function flattenTree(node: OrgNode): OrgNode[] {
  return [node, ...(node.children || []).flatMap(flattenTree)]
}

/* ── Main page ───────────────────────────────────────────────────────── */
export default function OrgChartPage() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(['board-chair', 'ceo'])
  )
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null)
  const [search, setSearch] = useState('')
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const allNodes = flattenTree(ORG_DATA)

  const searchResults = search.length > 1
    ? allNodes.filter(n =>
        n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.department.toLowerCase().includes(search.toLowerCase())
      )
    : []

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const expandAll = () => setExpandedIds(new Set(allNodes.map(n => n.id)))
  const collapseAll = () => setExpandedIds(new Set(['board-chair']))

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              Organization Chart
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              14-tier hierarchy — {allNodes.length} people across {new Set(allNodes.map(n => n.department)).size} departments
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search people..."
                className="bg-gray-800 border border-gray-700 text-sm text-white pl-8 pr-3 py-1.5
                  rounded-lg w-48 placeholder:text-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-1">
              <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}
                className="p-1.5 text-gray-400 hover:text-white">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-300 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
                className="p-1.5 text-gray-400 hover:text-white">
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button onClick={() => setZoom(1)}
              className="p-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white">
              <Maximize2 className="w-4 h-4" />
            </button>

            <button onClick={expandAll}
              className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
              Expand All
            </button>
            <button onClick={collapseAll}
              className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
              Collapse
            </button>
          </div>
        </div>

        {/* Tier legend */}
        <div className="mt-3">
          <TierLegend />
        </div>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-1/2 -translate-x-1/2 mt-1 bg-gray-800 border border-gray-700
            rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto w-96">
            {searchResults.map(n => {
              const colors = TIER_COLORS[n.level]
              return (
                <button
                  key={n.id}
                  onClick={() => { setSelectedNode(n); setSearch('') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700 text-left"
                >
                  <Initials name={n.name} level={n.level} />
                  <div>
                    <div className="text-sm text-white font-medium">{n.name}</div>
                    <div className="text-xs text-gray-400">{n.title} · {n.department}</div>
                  </div>
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${colors.badge} text-white`}>
                    L{n.level}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Chart canvas ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-8 relative"
        style={{ background: 'radial-gradient(ellipse at center, #1a1f2e 0%, #0d1117 100%)' }}
      >
        <div
          className="min-w-max mx-auto"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}
        >
          <OrgTree
            node={ORG_DATA}
            expandedIds={expandedIds}
            selectedId={selectedNode?.id ?? null}
            onToggle={toggleExpand}
            onSelect={setSelectedNode}
            isRoot
          />
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="flex-shrink-0 border-t border-gray-800 bg-gray-900 px-6 py-2 flex items-center gap-6 text-xs text-gray-400">
        {[
          { label: 'Total People', value: allNodes.length },
          { label: 'Departments', value: new Set(allNodes.map(n => n.department)).size },
          { label: 'Executives (L1-L2)', value: allNodes.filter(n => n.level <= 2).length },
          { label: 'Managers (L7-L9)', value: allNodes.filter(n => n.level >= 7 && n.level <= 9).length },
          { label: 'External (L14)', value: allNodes.filter(n => n.level === 14).length },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-1.5">
            <span className="text-gray-500">{stat.label}:</span>
            <span className="text-white font-medium">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* ── Detail panel ── */}
      {selectedNode && (
        <DetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  )
}
