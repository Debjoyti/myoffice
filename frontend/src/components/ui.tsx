'use client'

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/* ─── Button ─────────────────────────────────────────────────────────────── */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none'
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500 shadow-sm',
      secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-400',
      ghost: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-400',
      danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 shadow-sm',
      outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-400',
    }
    const sizes = {
      sm: 'h-7 px-3 text-xs rounded-md gap-1.5',
      md: 'h-8 px-3.5 text-sm rounded-md gap-2',
      lg: 'h-10 px-5 text-sm rounded-lg gap-2',
      icon: 'h-8 w-8 rounded-md',
    }
    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
        {loading ? <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)
Button.displayName = 'Button'

/* ─── Badge ──────────────────────────────────────────────────────────────── */
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  dot?: boolean
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', size = 'md', dot, children, className }: BadgeProps) {
  const variants = {
    default: 'bg-indigo-50 text-indigo-700 ring-indigo-200/60 dark:bg-indigo-900/30 dark:text-indigo-300',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200/60 dark:bg-amber-900/30 dark:text-amber-300',
    danger: 'bg-red-50 text-red-700 ring-red-200/60 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-50 text-blue-700 ring-blue-200/60 dark:bg-blue-900/30 dark:text-blue-300',
    neutral: 'bg-slate-100 text-slate-600 ring-slate-200/60 dark:bg-slate-800 dark:text-slate-400',
  }
  const dotColors = {
    default: 'bg-indigo-500', success: 'bg-emerald-500', warning: 'bg-amber-500',
    danger: 'bg-red-500', info: 'bg-blue-500', neutral: 'bg-slate-400',
  }
  const sizes = { sm: 'text-[10px] px-1.5 py-0.5', md: 'text-xs px-2 py-0.5' }
  return (
    <span className={cn('inline-flex items-center gap-1 font-medium rounded-full ring-1 ring-inset', variants[variant], sizes[size], className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dotColors[variant])} />}
      {children}
    </span>
  )
}

/* ─── Card ───────────────────────────────────────────────────────────────── */
interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, padding = 'md', hover = false, onClick }: CardProps) {
  const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }
  return (
    <div onClick={onClick} className={cn(
      'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg',
      hover && 'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-150 cursor-pointer',
      paddings[padding], className
    )}>
      {children}
    </div>
  )
}

export function CardHeader({ title, description, action, className }: {
  title: string; description?: string; action?: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-5', className)}>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const STAT_ACCENTS = {
  blue:    { bar: 'accent-bar-blue',    iconBg: 'bg-blue-50 text-blue-600' },
  indigo:  { bar: 'accent-bar-indigo',  iconBg: 'bg-indigo-50 text-indigo-600' },
  emerald: { bar: 'accent-bar-emerald', iconBg: 'bg-emerald-50 text-emerald-600' },
  amber:   { bar: 'accent-bar-amber',   iconBg: 'bg-amber-50 text-amber-600' },
  sky:     { bar: 'accent-bar-sky',     iconBg: 'bg-sky-50 text-sky-600' },
  rose:    { bar: 'accent-bar-rose',    iconBg: 'bg-rose-50 text-rose-600' },
  violet:  { bar: 'accent-bar-violet',  iconBg: 'bg-violet-50 text-violet-600' },
  teal:    { bar: 'accent-bar-teal',    iconBg: 'bg-teal-50 text-teal-600' },
  purple:  { bar: 'accent-bar-violet',  iconBg: 'bg-purple-50 text-purple-600' },
}

interface StatCardProps {
  label: string
  value: string | number
  delta?: { value: string; positive: boolean }
  icon?: React.ReactNode
  accent?: keyof typeof STAT_ACCENTS
  iconColor?: string
  className?: string
  onClick?: () => void
  loading?: boolean
}

export function StatCard({ label, value, delta, icon, accent = 'blue', iconColor, className, onClick, loading }: StatCardProps) {
  const a = STAT_ACCENTS[accent] ?? STAT_ACCENTS.blue
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden bg-white rounded-xl border border-slate-200',
        'shadow-sm hover:shadow-md transition-all duration-200',
        onClick && 'cursor-pointer hover:border-slate-300',
        className
      )}
    >
      <div className={cn('absolute top-0 inset-x-0 h-[3px]', a.bar)} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest leading-snug">{label}</span>
          {icon && <span className={cn('p-2 rounded-lg flex-shrink-0', iconColor || a.iconBg)}>{icon}</span>}
        </div>
        {loading
          ? <div className="skeleton h-8 w-24 mt-1" />
          : <div className="text-[1.875rem] font-bold text-slate-900 leading-none tracking-tight data-value">{value}</div>
        }
        {delta && !loading && (
          <div className="flex items-center gap-2 mt-2.5">
            <span className={cn(
              'inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-md',
              delta.positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            )}>
              {delta.positive ? '↑' : '↓'} {delta.value}
            </span>
            <span className="text-xs text-slate-400">vs last month</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Input ──────────────────────────────────────────────────────────────── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {label}{props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{leftIcon}</span>}
          <input
            ref={ref} id={inputId}
            className={cn(
              'w-full h-8 rounded-md border bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-colors',
              'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              leftIcon ? 'pl-8' : 'pl-3',
              rightIcon ? 'pr-8' : 'pr-3',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
          {rightIcon && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{rightIcon}</span>}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

/* ─── Textarea ───────────────────────────────────────────────────────────── */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string; hint?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={inputId} className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}{props.required && <span className="text-red-500 ml-0.5">*</span>}</label>}
        <textarea ref={ref} id={inputId} className={cn('w-full rounded-md border bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-colors px-3 py-2 resize-none', 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20', error && 'border-red-500', className)} {...props} />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

/* ─── Select ─────────────────────────────────────────────────────────────── */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string
  options: { label: string; value: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label htmlFor={selectId} className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</label>}
        <select ref={ref} id={selectId} className={cn('w-full h-8 rounded-md border bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 px-3 transition-colors', 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20', error && 'border-red-500', className)} {...props}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

/* ─── Table ──────────────────────────────────────────────────────────────── */
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className="overflow-x-auto"><table className={cn('w-full text-sm border-collapse', className)}>{children}</table></div>
}
export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">{children}</thead>
}
export function Th({ children, className, align = 'left' }: { children?: React.ReactNode; className?: string; align?: 'left' | 'right' | 'center' }) {
  return <th className={cn('px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap', align === 'right' && 'text-right', align === 'center' && 'text-center', className)}>{children}</th>
}
export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>
}
export function Tr({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr onClick={onClick} className={cn('bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors', onClick && 'cursor-pointer', className)}>
      {children}
    </tr>
  )
}
export function Td({ children, className, align = 'left' }: { children: React.ReactNode; className?: string; align?: 'left' | 'right' | 'center' }) {
  return <td className={cn('px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap', align === 'right' && 'text-right', align === 'center' && 'text-center', className)}>{children}</td>
}

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
]

export function Avatar({ name, src, size = 'md', className }: { name: string; src?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const colorIndex = name.charCodeAt(0) % AVATAR_COLORS.length
  const sizes = { xs: 'h-5 w-5 text-[9px]', sm: 'h-6 w-6 text-[10px]', md: 'h-7 w-7 text-xs', lg: 'h-9 w-9 text-sm', xl: 'h-12 w-12 text-base' }
  if (src) return <img src={src} alt={name} className={cn('rounded-full object-cover flex-shrink-0', sizes[size], className)} />
  return <span className={cn('inline-flex items-center justify-center rounded-full font-semibold flex-shrink-0', AVATAR_COLORS[colorIndex], sizes[size], className)}>{initials}</span>
}

/* ─── Empty State ────────────────────────────────────────────────────────── */
export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {icon && <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400">{icon}</div>}
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</p>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Table>
      <Thead><tr>{Array.from({ length: cols }).map((_, i) => <Th key={i}><Skeleton className="h-3 w-20" /></Th>)}</tr></Thead>
      <Tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <Tr key={i}>
            {Array.from({ length: cols }).map((_, j) => (
              <Td key={j}><Skeleton className={cn('h-3', j === 0 ? 'w-32' : 'w-20')} /></Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  )
}

/* ─── Divider ────────────────────────────────────────────────────────────── */
export function Divider({ label, className }: { label?: string; className?: string }) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        <span className="text-xs text-slate-400">{label}</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      </div>
    )
  }
  return <div className={cn('h-px bg-slate-200 dark:bg-slate-700', className)} />
}

/* ─── Alert ──────────────────────────────────────────────────────────────── */
export function Alert({ variant = 'info', title, children }: { variant?: 'info' | 'success' | 'warning' | 'danger'; title?: string; children: React.ReactNode }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
    danger: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
  }
  return (
    <div className={cn('border rounded-lg px-4 py-3 text-sm', styles[variant])}>
      {title && <p className="font-semibold mb-0.5">{title}</p>}
      <p className="opacity-90">{children}</p>
    </div>
  )
}

/* ─── Page Header ────────────────────────────────────────────────────────── */
export function PageHeader({ title, description, actions, breadcrumb }: { title: string; description?: string; actions?: React.ReactNode; breadcrumb?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        {breadcrumb && <div className="mb-1">{breadcrumb}</div>}
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}

/* ─── Tab Bar ────────────────────────────────────────────────────────────── */
export function TabBar({ tabs, active, onChange, className }: {
  tabs: { id: string; label: string; count?: number }[]
  active: string; onChange: (id: string) => void; className?: string
}) {
  return (
    <div className={cn('flex gap-1 border-b border-slate-200 dark:border-slate-800', className)}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={cn('flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
            active === tab.id ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
          )}>
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', active === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500')}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ─── Search Input ───────────────────────────────────────────────────────── */
export function SearchInput({ placeholder = 'Search...', value, onChange, className }: { placeholder?: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input type="search" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-8 pl-8 pr-3 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
      />
    </div>
  )
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, size = 'md', footer }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'; footer?: React.ReactNode
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-full animate-fadeIn flex flex-col max-h-[90vh]', sizes[size])}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  )
}

/* ─── Progress Bar ───────────────────────────────────────────────────────── */
export function ProgressBar({ value, max = 100, color = 'blue', size = 'sm', showLabel = false, className }: {
  value: number; max?: number; color?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'red' | 'sky'; size?: 'xs' | 'sm' | 'md'; showLabel?: boolean; className?: string
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const colors = { blue: 'bg-blue-500', indigo: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500', sky: 'bg-sky-500' }
  const heights = { xs: 'h-1', sm: 'h-1.5', md: 'h-2' }
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden', heights[size])}>
        <div className={cn('h-full rounded-full transition-all duration-300', colors[color])} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="text-xs font-medium text-slate-500 w-8 text-right tabular-nums">{pct}%</span>}
    </div>
  )
}

/* ─── Inline KV ──────────────────────────────────────────────────────────── */
export function KV({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn('', className)}>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  )
}

/* ─── Inline Loading Spinner ─────────────────────────────────────────────── */
export function Spinner({ size = 'sm', className }: { size?: 'xs' | 'sm' | 'md'; className?: string }) {
  const sizes = { xs: 'h-3 w-3', sm: 'h-4 w-4', md: 'h-5 w-5' }
  return <span className={cn('inline-block rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin', sizes[size], className)} />
}

/* ─── Page-level Loading ─────────────────────────────────────────────────── */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <Spinner size="md" />
    </div>
  )
}

/* ─── Confirm Dialog ─────────────────────────────────────────────────────── */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', variant = 'danger', loading = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; description?: string
  confirmLabel?: string; variant?: 'danger' | 'primary'; loading?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={variant} size="sm" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </>}
    >
      {description && <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>}
    </Modal>
  )
}

/* ─── Section Heading ────────────────────────────────────────────────────── */
export function SectionHeading({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5', className)}>{children}</p>
}

/* ─── Tooltip (simple CSS) ───────────────────────────────────────────────── */
export function Tooltip({ children, content, className }: { children: React.ReactNode; content: string; className?: string }) {
  return (
    <span className={cn('group relative inline-flex', className)}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 hidden group-hover:flex items-center">
        <span className="bg-slate-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap shadow-lg">{content}</span>
      </span>
    </span>
  )
}

/* ─── Label/Value Grid ───────────────────────────────────────────────────── */
export function DetailGrid({ items, cols = 2, className }: {
  items: { label: string; value: React.ReactNode }[]
  cols?: 1 | 2 | 3; className?: string
}) {
  return (
    <div className={cn('grid gap-4', cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : 'grid-cols-3', className)}>
      {items.map(({ label, value }) => (
        <div key={label}>
          <p className="text-xs text-slate-400 mb-0.5">{label}</p>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value ?? '—'}</p>
        </div>
      ))}
    </div>
  )
}
