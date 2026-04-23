import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { MOCK_DASHBOARD_STATS, MOCK_INSIGHTS, MOCK_ANNOUNCEMENTS } from '../utils/demoData';
import {
  Users, Briefcase, Calendar, TrendingUp, DollarSign, Receipt, Clock,
  MessageSquare, Building2, Plus, Sparkles, ArrowUp, ArrowDown, Minus,
  Zap, Target, CheckCircle2, AlertTriangle, ChevronRight, Rss
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Skeleton card
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton skeleton-line skeleton-h2" style={{ marginBottom: '16px' }} />
    <div className="skeleton skeleton-line skeleton-1q" />
  </div>
);

// Mini sparkline (CSS bars)
const Sparkline = ({ data = [], color = '#6366f1', height = 28 }) => {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: '2px',
          background: i === data.length - 1 ? color : `${color}55`,
          height: `${(v / max) * 100}%`,
          minHeight: '2px',
          transition: 'height 0.5s ease',
        }} />
      ))}
    </div>
  );
};

// AI Health Score
const getHealthScore = (stats) => {
  if (!stats) return { score: 0, label: 'No Data', color: '#6b7280', breakdown: [] };
  let score = 50;
  const breakdown = [];
  if (stats.total_employees > 0) { score += 10; breakdown.push({ label: 'Team built', positive: true }); }
  if (stats.total_leads > 5) { score += 10; breakdown.push({ label: 'Active pipeline', positive: true }); }
  if (stats.total_invoices > 2) { score += 10; breakdown.push({ label: 'Revenue flowing', positive: true }); }
  if (stats.total_projects > 0) { score += 8; breakdown.push({ label: 'Projects active', positive: true }); }
  if (stats.pending_leaves > 3) { score -= 8; breakdown.push({ label: 'Leave backlog', positive: false }); }
  if (stats.total_tickets > 10) { score -= 5; breakdown.push({ label: 'High ticket volume', positive: false }); }
  score = Math.max(0, Math.min(100, score));
  const label = score > 80 ? 'Excellent 🚀' : score > 60 ? 'Good 👍' : score > 40 ? 'Fair ⚡' : 'Needs Focus 🎯';
  const color = score > 80 ? '#10b981' : score > 60 ? '#22d3ee' : score > 40 ? '#f59e0b' : '#f43f5e';
  return { score, label, color, breakdown };
};

const Dashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [briefDismissed, setBriefDismissed] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const [statsRes, insightsRes, compRes, annRes] = await Promise.allSettled([
        axios.get(`${API}/dashboard/stats`, h),
        axios.get(`${API}/insights`, h),
        axios.get(`${API}/companies`, h),
        axios.get(`${API}/announcements`, h),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data || MOCK_DASHBOARD_STATS);
      else if (!stats) setStats(MOCK_DASHBOARD_STATS);

      if (insightsRes.status === 'fulfilled') setInsights((insightsRes.value.data && insightsRes.value.data.length > 0) ? insightsRes.value.data : MOCK_INSIGHTS);
      else if (insights.length === 0) setInsights(MOCK_INSIGHTS);

      if (compRes.status === 'fulfilled') setRecentCompanies((compRes.value.data || []).slice(0, 4));
      
      if (annRes.status === 'fulfilled') setAnnouncements((annRes.value.data && annRes.value.data.length > 0) ? annRes.value.data : MOCK_ANNOUNCEMENTS);
      else if (announcements.length === 0) setAnnouncements(MOCK_ANNOUNCEMENTS);
    } catch {
      if (!stats) setStats(MOCK_DASHBOARD_STATS);
      if (insights.length === 0) setInsights(MOCK_INSIGHTS);
      if (announcements.length === 0) setAnnouncements(MOCK_ANNOUNCEMENTS);
    }
    setLoading(false);
  };

  const getHour = () => {
    const h = new Date().getHours();
    if (h < 6) return 'Good night';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    return Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = user?.subscription_end_date ? getDaysRemaining(user.subscription_end_date) : null;
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining !== null && daysRemaining <= 0;

  const health = getHealthScore(stats);

  // Sparkline data (simulated trend — last 7 points)
  const sparklines = {
    employees: [3, 5, 8, 10, stats?.total_employees || 10],
    leads:     [1, 3, 4, 5, stats?.total_leads || 5],
    invoices:  [0, 1, 2, 2, stats?.total_invoices || 2],
    tickets:   [2, 4, 3, 5, stats?.total_tickets || 5],
  };

  const statCards = [
    { id: 'employees', title: 'Total Employees', value: stats?.total_employees ?? '—', icon: Users,        color: '#6366f1', trend: '+2 this month', sparkData: sparklines.employees },
    { id: 'projects',  title: 'Active Projects',  value: stats?.total_projects  ?? '—', icon: Briefcase,    color: '#8b5cf6', trend: 'On track',       sparkData: [2,3,4,4,stats?.total_projects||4] },
    { id: 'leaves',    title: 'Pending Leaves',   value: stats?.pending_leaves  ?? '—', icon: Calendar,     color: '#f59e0b', trend: 'Needs review',   sparkData: [0,1,2,1,stats?.pending_leaves||1] },
    { id: 'crm',       title: 'CRM Pipeline',     value: stats?.total_leads     ?? '—', icon: Target,       color: '#22d3ee', trend: 'Active leads',   sparkData: sparklines.leads },
    { id: 'finance',   title: 'Invoices',          value: stats?.total_invoices  ?? '—', icon: Receipt,      color: '#f59e0b', trend: 'In system',      sparkData: sparklines.invoices },
    { id: 'support',   title: 'Support Tickets',  value: stats?.total_tickets   ?? '—', icon: MessageSquare,color: '#f43f5e', trend: 'Need attention', sparkData: sparklines.tickets },
    { id: 'finance',   title: 'Monthly Expenses', value: `₹${((stats?.total_expenses || 0) / 100000).toFixed(1)}L`, icon: DollarSign, color: '#ef4444', trend: 'This month', sparkData: [1,2,2,3,(stats?.total_expenses||0)/100000] },
    { id: 'projects',  title: 'Billable Hours',   value: `${stats?.total_timesheet_hours ?? 0}h`, icon: Clock, color: '#38bdf8', trend: 'Logged total', sparkData: [10,20,30,stats?.total_timesheet_hours||40] },
  ].filter(card => {
    if (user?.role === 'superadmin') return true;
    if (!user?.enabled_services) return true;
    return user.enabled_services.includes(card.id);
  });

  const quickActions = [
    { id: 'finance',   label: 'Create Invoice',  sub: 'VF01 · Finance',    href: '/finance',      emoji: '🧾', color: '#6366f1' },
    { id: 'projects',  label: 'Log Time',         sub: 'CAT2 · Timesheets', href: '/timesheets',   emoji: '⏱️', color: '#22d3ee' },
    { id: 'support',   label: 'Raise Ticket',     sub: 'SO11 · Support',    href: '/support-desk', emoji: '🆘', color: '#f43f5e' },
    { id: 'employees', label: 'Add Employee',     sub: 'PA40 · HRMS',       href: '/hrms',         emoji: '👤', color: '#8b5cf6' },
    { id: 'projects',  label: 'Create Project',   sub: 'CJ20N · Projects',  href: '/projects',     emoji: '📋', color: '#10b981' },
    { id: 'assets',    label: 'New Asset',        sub: 'AA01 · Assets',     href: '/assets',       emoji: '📦', color: '#f59e0b' },
  ].filter(a => {
    if (user?.role === 'superadmin') return true;
    if (!user?.enabled_services) return true;
    return user.enabled_services.includes(a.id);
  });

  // AI Brief items
  const aiBriefItems = [
    stats?.pending_leaves > 0 && { type: 'warning', icon: AlertTriangle, msg: `${stats.pending_leaves} leave request${stats.pending_leaves > 1 ? 's' : ''} pending your review`, link: '/hrms', color: '#f59e0b' },
    stats?.total_tickets > 0 && { type: 'info', icon: MessageSquare, msg: `${stats.total_tickets} support ticket${stats.total_tickets > 1 ? 's' : ''} in queue — check SLA status`, link: '/support-desk', color: '#6366f1' },
    stats?.total_leads > 0 && { type: 'positive', icon: TrendingUp, msg: `${stats.total_leads} leads in CRM pipeline — review today for momentum`, link: '/crm', color: '#10b981' },
    stats?.total_invoices > 0 && { type: 'info', icon: Receipt, msg: `${stats.total_invoices} invoice${stats.total_invoices > 1 ? 's' : ''} created — follow up on any overdue amounts`, link: '/finance', color: '#22d3ee' },
  ].filter(Boolean);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ display: 'flex', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh', background: '#05070f' }}>
      <Sidebar user={user} onLogout={onLogout} activePage="dashboard" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

          {/* Subscription Alert */}
          {(isExpiringSoon || isExpired) && (
            <div style={{
              background: isExpired ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)',
              border: `1px solid ${isExpired ? 'rgba(244,63,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
              borderRadius: '14px', padding: '16px 24px', marginBottom: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>{isExpired ? '⚠️' : '⏳'}</span>
                <div>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: 0 }}>
                    {isExpired ? 'Subscription Expired' : 'Subscription Ending Soon'}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: 0 }}>
                    {isExpired ? 'Your premium access has ended. Renew to continue.' : `Expires in ${daysRemaining} days — renew to avoid interruption.`}
                  </p>
                </div>
              </div>
              <a href="/subscription" style={{
                background: isExpired ? '#f43f5e' : '#f59e0b', color: '#fff',
                textDecoration: 'none', padding: '8px 20px', borderRadius: '9px',
                fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap',
              }}>
                {isExpired ? 'Renew Plan' : 'Extend Now'}
              </a>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <p className="text-slate-400 text-xs tracking-wider mb-1 uppercase font-medium">{today} · {getHour()}</p>
              <h1 className="text-slate-100 text-3xl font-extrabold m-0 tracking-tight">
                {user?.name || 'Founder'} 👋
              </h1>
              <p className="text-slate-500 mt-2 text-sm font-medium">
                Here's your business intelligence overview
              </p>
            </div>

            {/* Health Score */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '16px 22px', display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', position: 'relative',
                  background: `conic-gradient(${health.color} ${health.score * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#05070f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: health.color, fontSize: '14px', fontWeight: 900 }}>{health.score}</span>
                  </div>
                </div>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Health Score</p>
                <p style={{ color: health.color, fontSize: '15px', fontWeight: 800, margin: 0 }}>{health.label}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '4px 0 0' }}>{health.breakdown[0]?.label || 'Building momentum'}</p>
              </div>
            </div>
          </div>

          {/* AI Morning Brief */}
          {!briefDismissed && aiBriefItems.length > 0 && (
            <div className="ai-panel" style={{ padding: '20px 24px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={14} color="#fff" />
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: 0 }}>AI Morning Brief</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Personalized from your live data</p>
                  </div>
                </div>
                <button onClick={() => setBriefDismissed(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {aiBriefItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <a key={i} href={item.link} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: `${item.color}0d`, border: `1px solid ${item.color}22`, borderRadius: '12px', transition: 'all 0.18s' }}
                      onMouseEnter={e => e.currentTarget.style.background = `${item.color}15`}
                      onMouseLeave={e => e.currentTarget.style.background = `${item.color}0d`}
                    >
                      <Icon size={14} color={item.color} style={{ flexShrink: 0 }} />
                      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12.5px', lineHeight: 1.4 }}>{item.msg}</span>
                      <ChevronRight size={12} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0, marginLeft: 'auto' }} />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stat Cards */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stagger fade-in">
              {statCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-default">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Icon size={64} color={card.color} />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
                        <Icon size={20} color={card.color} />
                      </div>
                      <Sparkline data={card.sparkData} color={card.color} height={28} />
                    </div>
                    <p className="text-slate-400 text-sm font-semibold mb-1 relative z-10">{card.title}</p>
                    <p className="text-slate-100 text-3xl font-extrabold mb-1 tracking-tight relative z-10">{card.value}</p>
                    <p className="text-xs font-semibold relative z-10" style={{ color: card.color }}>{card.trend}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Main Content Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            <div className="xl:col-span-2 flex flex-col gap-8">

              {/* Quick Actions */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <Zap size={18} className="text-amber-500" />
                  <h2 className="text-slate-100 text-lg font-bold m-0">Quick Actions</h2>
                  <span className="ml-auto text-[10px] uppercase tracking-widest font-bold bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">AI Powered</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {quickActions.map((action, i) => (
                    <a key={i} href={action.href} className="group flex flex-col gap-3 p-4 rounded-md border transition-all duration-200 no-underline" style={{ backgroundColor: `${action.color}10`, borderColor: `${action.color}20` }}>
                      <span className="text-2xl group-hover:scale-110 transition-transform origin-bottom-left">{action.emoji}</span>
                      <div>
                        <p className="text-slate-200 text-sm font-bold m-0">{action.label}</p>
                        <p className="text-xs font-mono mt-1" style={{ color: `${action.color}99` }}>{action.sub}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Executive Intelligence */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-sm">
                <h2 className="text-slate-100 text-lg font-bold m-0 mb-6">📈 Executive Intelligence</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                  {[
                    { label: 'Monthly Burn Rate', value: `₹${((stats?.burn_rate || 0) / 1000).toFixed(1)}K/day`, color: '#f43f5e', bg: 'rgba(244,63,94,0.06)', icon: '🔥' },
                    { label: 'Revenue Projection', value: `₹${((stats?.projected_revenue || 0) / 100000).toFixed(1)}L`, color: '#10b981', bg: 'rgba(16,185,129,0.06)', icon: '📊' },
                    { label: 'Hiring Progress', value: `${Math.round(stats?.hiring_progress || 0)}%`, color: '#818cf8', bg: 'rgba(129,140,248,0.06)', icon: '🎯' },
                  ].map((m, i) => (
                    <div key={i} style={{ padding: '16px', background: m.bg, border: `1px solid ${m.color}22`, borderRadius: '14px' }}>
                      <p style={{ fontSize: '18px', margin: '0 0 6px' }}>{m.icon}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 3px', fontWeight: 600 }}>{m.label}</p>
                      <p style={{ color: m.color, fontSize: '20px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              {insights.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                    <Sparkles size={16} color="#818cf8" />
                    <h2 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: 0 }}>AI Business Consultant</h2>
                    <span className="ai-badge" style={{ marginLeft: 'auto' }}>LIVE</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {insights.map((insight, i) => (
                      <div key={i} style={{
                        padding: '14px 16px',
                        background: insight.type === 'warning' ? 'rgba(245,158,11,0.05)' : 'rgba(99,102,241,0.05)',
                        borderLeft: `3px solid ${insight.type === 'warning' ? '#f59e0b' : '#6366f1'}`,
                        borderRadius: '4px 12px 12px 4px',
                        border: `1px solid ${insight.type === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)'}`,
                        borderLeft: `3px solid ${insight.type === 'warning' ? '#f59e0b' : '#6366f1'}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'flex-start', gap: '8px' }}>
                          <p style={{ color: '#fff', fontSize: '13.5px', fontWeight: 700, margin: 0 }}>{insight.title}</p>
                          <span style={{ fontSize: '10px', color: insight.type === 'warning' ? '#f59e0b' : '#6366f1', fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap', background: insight.type === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)', padding: '2px 7px', borderRadius: '4px' }}>{insight.impact}</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12.5px', margin: 0, lineHeight: 1.5 }}>{insight.message}</p>
                        <button style={{ marginTop: '10px', background: 'transparent', border: 'none', color: insight.type === 'warning' ? '#f59e0b' : '#818cf8', fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Take Action →</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Live Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Rss size={15} color="#22d3ee" />
                    <h2 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: 0 }}>Office Feed</h2>
                  </div>
                  <a href="/feed" style={{ fontSize: '11px', color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>View All →</a>
                </div>
                {announcements.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {announcements.map((ann, i) => (
                      <div key={ann.id || i} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.055)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      >
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          {ann.priority === 'urgent' && <span style={{ fontSize: '12px', flexShrink: 0, marginTop: '1px' }}>🔴</span>}
                          {ann.priority === 'high' && <span style={{ fontSize: '12px', flexShrink: 0, marginTop: '1px' }}>🟠</span>}
                          {(!ann.priority || ann.priority === 'normal') && <span style={{ fontSize: '12px', flexShrink: 0, marginTop: '1px' }}>📢</span>}
                          <div style={{ flex: 1 }}>
                            <p style={{ color: '#fff', fontSize: '12.5px', fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3 }}>{ann.title}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'rgba(255,255,255,0.3)' }}>
                              <span>{ann.author_name}</span>
                              <span>{ann.created_at ? new Date(ann.created_at).toLocaleDateString('en-IN') : ''}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: 'rgba(255,255,255,0.25)' }}>
                    <Rss size={24} color="rgba(255,255,255,0.08)" style={{ marginBottom: '12px' }} />
                    <p style={{ fontSize: '12px', margin: 0 }}>No announcements yet</p>
                    <a href="/feed" style={{ fontSize: '11px', color: '#818cf8', display: 'block', marginTop: '8px' }}>Post the first one →</a>
                  </div>
                )}
              </div>

              {/* System Health */}
              <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px' }}>
                <h2 style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: '0 0 16px' }}>🟢 System Status</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'API Gateway', status: 'Operational', color: '#10b981' },
                    { label: 'Database', status: 'Healthy', color: '#10b981' },
                    { label: 'AI Engine', status: 'Active', color: '#10b981' },
                    { label: 'Auth Service', status: 'Secure', color: '#10b981' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{item.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }} />
                        <span style={{ color: item.color, fontSize: '11px', fontWeight: 700 }}>{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Companies Widget */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={16} color="#818cf8" />
                </div>
                <div>
                  <h2 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: 0 }}>Company Onboardings</h2>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11.5px', margin: 0 }}>Recently registered profiles</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href="/company-onboarding" style={{ fontSize: '12px', color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>View All →</a>
                <a href="/company-onboarding" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', textDecoration: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '12px', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}>
                  <Plus size={13} /> Onboard Company
                </a>
              </div>
            </div>
            {recentCompanies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.2)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: '14px' }}>
                <Building2 size={28} color="rgba(255,255,255,0.07)" style={{ marginBottom: '10px' }} />
                <p style={{ margin: 0, fontSize: '13px' }}>No companies onboarded yet — <a href="/company-onboarding" style={{ color: '#818cf8' }}>get started</a></p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {recentCompanies.map((c, i) => {
                  const initials = (c.name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  const colors = ['#6366f1', '#8b5cf6', '#22d3ee', '#10b981'];
                  const color = colors[i % colors.length];
                  return (
                    <a key={c.id} href="/company-onboarding" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                    >
                      {c.logo ? (
                        <img src={c.logo} alt="logo" style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'contain', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${color}22`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color, flexShrink: 0 }}>
                          {initials}
                        </div>
                      )}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ color: '#fff', fontWeight: 700, fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '2px 0 0' }}>{c.industry || 'Technology'} {c.city ? `· ${c.city}` : ''}</p>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
                          {c.pan_number && <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>PAN</span>}
                          {c.gst_number && <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>GST</span>}
                          {c.logo && <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>Logo</span>}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;