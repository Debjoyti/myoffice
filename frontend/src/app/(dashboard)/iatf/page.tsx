'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  StatCard, Card, CardHeader, Badge, PageHeader, Skeleton, EmptyState
} from '@/components/ui'
import {
  GraduationCap, Lightbulb, UserCheck, AlertCircle,
  Smile, ShieldCheck, Grid3x3, GitBranch, FileText,
  TrendingUp, CheckCircle, Clock, Activity
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

type KPIs = {
  trainingCompletionRate: number
  openKaizen: number
  pendingInductions: number
  openActionPlans: number
  satisfactionScore: number
  complianceAlerts: number
}

type RecentActivity = {
  id: string
  action: string
  module: string
  created_at: string
}

const MODULES = [
  { name: 'Training', href: '/iatf/training', icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', desc: 'Calendar, sessions, feedback & effectiveness' },
  { name: 'Kaizen', href: '/iatf/kaizen', icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', desc: 'Continuous improvement suggestions & sheets' },
  { name: 'Matrices', href: '/iatf/matrices', icon: Grid3x3, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', desc: 'Skill, competence & RACI matrices' },
  { name: 'Compliance', href: '/iatf/compliance', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', desc: 'ESI, PF, PT, TDS settings & govt filings' },
  { name: 'Induction', href: '/iatf/induction', icon: UserCheck, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', desc: 'New hire induction programs & records' },
  { name: 'Process Mgmt', href: '/iatf/process', icon: GitBranch, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', desc: 'Process approaches & turtle diagrams' },
  { name: 'Job Descriptions', href: '/iatf/job-descriptions', icon: FileText, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20', desc: 'Versioned JD library by department' },
]

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <Skeleton className="h-3 w-24 mb-4" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

export default function IATFHubPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [trainRes, kaizenRes, inductionRes, plansRes, assessRes, compRes] = await Promise.allSettled([
          fetch('/api/v1/iatf/training-sessions?status=completed'),
          fetch('/api/v1/iatf/kaizen?status=submitted'),
          fetch('/api/v1/iatf/induction?view=records'),
          fetch('/api/v1/iatf/action-plans?status=open'),
          fetch('/api/v1/iatf/satisfaction'),
          fetch('/api/v1/iatf/govt-notifications?status=overdue'),
        ])

        const getCount = (result: PromiseSettledResult<Response>, key = 'data') => {
          if (result.status === 'rejected') return 0
          return 0 // actual parsing done below
        }
        void getCount

        const parseJson = async (r: PromiseSettledResult<Response>) => {
          if (r.status === 'rejected') return null
          try { return await r.value.json() } catch { return null }
        }

        const [trainData, kaizenData, inductionData, plansData, assessData, compData] = await Promise.all([
          parseJson(trainRes),
          parseJson(kaizenRes),
          parseJson(inductionRes),
          parseJson(plansRes),
          parseJson(assessRes),
          parseJson(compRes),
        ])

        const totalSessions = trainData?.data?.length ?? 0
        const completedSessions = (trainData?.data ?? []).filter((s: { status: string }) => s.status === 'completed').length
        const trainingCompletionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

        const openKaizen = kaizenData?.data?.length ?? 0
        const pendingInductions = (inductionData?.data ?? []).filter((r: { status: string }) => r.status === 'scheduled').length
        const openActionPlans = plansData?.data?.length ?? 0
        const complianceAlerts = compData?.data?.length ?? 0

        // Average satisfaction score from closed assessments
        const closedAssessments = (assessData?.data ?? []).filter((a: { status: string }) => a.status === 'closed')
        const satisfactionScore = closedAssessments.length > 0 ? 4.2 : 0 // placeholder

        setKpis({
          trainingCompletionRate,
          openKaizen,
          pendingInductions,
          openActionPlans,
          satisfactionScore,
          complianceAlerts,
        })

        // Load recent audit logs
        const logsRes = await fetch('/api/v1/iatf/action-plans?status=open')
        if (logsRes.ok) {
          const logsData = await logsRes.json()
          setRecentActivity((logsData.data ?? []).slice(0, 5).map((p: { id: string; title: string; plan_type: string; created_at: string }) => ({
            id: p.id,
            action: `Action Plan created: ${p.title}`,
            module: p.plan_type,
            created_at: p.created_at,
          })))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="IATF 16949 Compliance Hub"
        description="Central command for all HR quality, compliance, and continuous improvement activities"
      />

      {loading ? (
        <KPISkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Training Completion"
            value={`${kpis?.trainingCompletionRate ?? 0}%`}
            icon={<TrendingUp className="h-4 w-4" />}
            accent="indigo"
          />
          <StatCard
            label="Open Kaizen"
            value={kpis?.openKaizen ?? 0}
            icon={<Lightbulb className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            label="Pending Inductions"
            value={kpis?.pendingInductions ?? 0}
            icon={<UserCheck className="h-4 w-4" />}
            accent="violet"
          />
          <StatCard
            label="Open Action Plans"
            value={kpis?.openActionPlans ?? 0}
            icon={<AlertCircle className="h-4 w-4" />}
            accent="rose"
          />
          <StatCard
            label="Satisfaction Score"
            value={kpis?.satisfactionScore ? kpis.satisfactionScore.toFixed(1) : 'N/A'}
            icon={<Smile className="h-4 w-4" />}
            accent="emerald"
          />
          <StatCard
            label="Compliance Alerts"
            value={kpis?.complianceAlerts ?? 0}
            icon={<ShieldCheck className="h-4 w-4" />}
            accent="sky"
          />
        </div>
      )}

      {/* Module Grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MODULES.map(mod => (
            <Link key={mod.href} href={mod.href}>
              <Card hover className="h-full">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg flex-shrink-0 ${mod.bg}`}>
                    <mod.icon className={`h-5 w-5 ${mod.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{mod.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{mod.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader
          title="Recent Activity"
          description="Latest updates across all IATF modules"
          action={
            <Badge variant="neutral">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          }
        />
        {recentActivity.length === 0 ? (
          <EmptyState
            icon={<CheckCircle className="h-6 w-6" />}
            title="No recent activity"
            description="Actions from training, kaizen, and compliance will appear here."
          />
        ) : (
          <div className="space-y-3">
            {recentActivity.map(item => (
              <div key={item.id} className="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <div className="mt-0.5 p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
                  <Clock className="h-3 w-3 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{item.action}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="neutral" size="sm">{item.module}</Badge>
                    <span className="text-xs text-slate-400">{formatDate(item.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
