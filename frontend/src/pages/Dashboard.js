import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  <div className="glass-card" style={{ padding: '24px' }}>
    <div style={{ width: '40%', height: '16px', background: 'var(--bg-elevated)', borderRadius: '4px', marginBottom: '16px' }} />
    <div style={{ width: '60%', height: '24px', background: 'var(--bg-elevated)', borderRadius: '4px' }} />
  </div>
);

// Mini sparkline (CSS bars)
const Sparkline = ({ data = [], color = 'var(--brand-primary)', height = 28 }) => {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: '2px',
          background: i === data.length - 1 ? color : `var(--border-hover)`,
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
  if (!stats) return { score: 0, label: 'No Data', color: 'var(--text-muted)', breakdown: [] };
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
  const color = score > 80 ? '#10b981' : score > 60 ? '#22d3ee' : score > 40 ? '#f59e0b' : '#ef4444';
  return { score, label, color, breakdown };
};

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
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

  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    return Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = user?.subscription_end_date ? getDaysRemaining(user.subscription_end_date) : null;
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining !== null && daysRemaining <= 0;

  const health = getHealthScore(stats);

  const sparklines = {
    employees: [3, 5, 8, 10, stats?.total_employees || 10],
    leads:     [1, 3, 4, 5, stats?.total_leads || 5],
    invoices:  [0, 1, 2, 2, stats?.total_invoices || 2],
    tickets:   [2, 4, 3, 5, stats?.total_tickets || 5],
  };

  const statCards = [
    { id: 'employees', title: 'Total Employees', value: stats?.total_employees ?? '—', icon: Users, color: '#3b82f6', trend: '+2 this month', sparkData: sparklines.employees },
    { id: 'projects',  title: 'Active Projects',  value: stats?.total_projects  ?? '—', icon: Briefcase, color: '#8b5cf6', trend: 'On track', sparkData: [2,3,4,4,stats?.total_projects||4] },
    { id: 'leaves',    title: 'Pending Leaves',   value: stats?.pending_leaves  ?? '—', icon: Calendar, color: '#f59e0b', trend: 'Needs review', sparkData: [0,1,2,1,stats?.pending_leaves||1] },
    { id: 'crm',       title: 'CRM Pipeline',     value: stats?.total_leads     ?? '—', icon: Target, color: '#10b981', trend: 'Active leads', sparkData: sparklines.leads },
    { id: 'finance',   title: 'Invoices',          value: stats?.total_invoices  ?? '—', icon: Receipt, color: '#f59e0b', trend: 'In system', sparkData: sparklines.invoices },
    { id: 'support',   title: 'Support Tickets',  value: stats?.total_tickets   ?? '—', icon: MessageSquare, color: '#ef4444', trend: 'Need attention', sparkData: sparklines.tickets },
    { id: 'finance',   title: 'Monthly Expenses', value: `₹${((stats?.total_expenses || 0) / 100000).toFixed(1)}L`, icon: DollarSign, color: '#ef4444', trend: 'This month', sparkData: [1,2,2,3,(stats?.total_expenses||0)/100000] },
    { id: 'projects',  title: 'Billable Hours',   value: `${stats?.total_timesheet_hours ?? 0}h`, icon: Clock, color: '#0ea5e9', trend: 'Logged total', sparkData: [10,20,30,stats?.total_timesheet_hours||40] },
  ].filter(card => {
    if (user?.role === 'superadmin') return true;
    if (!user?.enabled_services) return true;
    return user.enabled_services.includes(card.id);
  });

  const quickActions = [
    { id: 'finance',   label: 'Create Invoice',  sub: 'Finance', href: '/finance', icon: Receipt },
    { id: 'projects',  label: 'Log Time', sub: 'Timesheets', href: '/timesheets', icon: Clock },
    { id: 'support',   label: 'Raise Ticket', sub: 'Support', href: '/support-desk', icon: MessageSquare },
    { id: 'employees', label: 'Add Employee', sub: 'HRMS', href: '/hrms', icon: Users },
    { id: 'projects',  label: 'Create Project', sub: 'Projects', href: '/projects', icon: Briefcase },
    { id: 'assets',    label: 'New Asset', sub: 'Assets', href: '/assets', icon: Zap },
  ].filter(a => {
    if (user?.role === 'superadmin') return true;
    if (!user?.enabled_services) return true;
    return user.enabled_services.includes(a.id);
  });

  const aiBriefItems = [
    stats?.pending_leaves > 0 && { type: 'warning', icon: AlertTriangle, msg: `${stats.pending_leaves} leave requests pending review`, link: '/hrms', color: '#f59e0b' },
    stats?.total_tickets > 0 && { type: 'info', icon: MessageSquare, msg: `${stats.total_tickets} support tickets in queue`, link: '/support-desk', color: '#3b82f6' },
    stats?.total_leads > 0 && { type: 'positive', icon: TrendingUp, msg: `${stats.total_leads} leads in pipeline`, link: '/crm', color: '#10b981' },
    stats?.total_invoices > 0 && { type: 'info', icon: Receipt, msg: `${stats.total_invoices} invoices created`, link: '/finance', color: '#0ea5e9' },
  ].filter(Boolean);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="page-content">
        <div className="page-inner">

          {/* Subscription Alert */}
          {(isExpiringSoon || isExpired) && (
            <div className="glass-card" style={{
              background: isExpired ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)',
              borderColor: isExpired ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              padding: '16px 24px', marginBottom: '24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>{isExpired ? '⚠️' : '⏳'}</span>
                <div>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                    {isExpired ? 'Subscription Expired' : 'Subscription Ending Soon'}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                    {isExpired ? 'Your premium access has ended. Renew to continue.' : `Expires in ${daysRemaining} days — renew to avoid interruption.`}
                  </p>
                </div>
              </div>
              <a href="/subscription" className="btn-dark-primary" style={{ textDecoration: 'none' }}>
                {isExpired ? 'Renew Plan' : 'Extend Now'}
              </a>
            </div>
          )}

          {/* Header */}
          <div className="page-header">
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px', fontWeight: 600 }}>{today} · {getHour()}</p>
              <h1 className="page-title">{user?.name || 'User'} 👋</h1>
              <p className="page-subtitle">Here's your business intelligence overview</p>
            </div>

            {/* Health Score */}
            <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: `conic-gradient(${health.color} ${health.score * 3.6}deg, var(--bg-elevated) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: health.color, fontSize: '12px', fontWeight: 700 }}>{health.score}</span>
                </div>
              </div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px' }}>AI Health Score</p>
                <p style={{ color: health.color, fontSize: '14px', fontWeight: 600, margin: 0 }}>{health.label}</p>
              </div>
            </div>
          </div>

          {/* AI Morning Brief */}
          {!briefDismissed && aiBriefItems.length > 0 && (
            <div className="glass-card fade-in" style={{ padding: '20px', marginBottom: '24px', borderColor: 'rgba(94, 106, 210, 0.2)', background: 'rgba(94, 106, 210, 0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--brand-primary)" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px' }}>AI Morning Brief</h3>
                  </div>
                </div>
                <button onClick={() => setBriefDismissed(true)} className="icon-btn"><X size={14} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                {aiBriefItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <a key={i} href={item.link} className="glass-card" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
                      <Icon size={16} color={item.color} style={{ flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{item.msg}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stat Cards */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {statCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="kpi-card fade-in" style={{ padding: '20px', animationDelay: `${i * 50}ms` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} color={card.color} />
                      </div>
                      <Sparkline data={card.sparkData} color={card.color} height={24} />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, margin: '0 0 4px' }}>{card.title}</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <h2 style={{ fontSize: '24px', margin: 0 }}>{card.value}</h2>
                      <span style={{ fontSize: '12px', color: card.color, fontWeight: 500 }}>{card.trend}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Quick Actions */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0 }}>Quick Actions</h2>
                  <span className="badge">⌘K to search</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {quickActions.map((action, i) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => navigate(action.href)}
                        className="glass-card"
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px', cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
                      >
                        <Icon size={20} color="var(--text-secondary)" style={{ marginBottom: '12px' }} />
                        <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, margin: '0 0 4px' }}>{action.label}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>{action.sub}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Executive Intelligence */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h2 style={{ margin: '0 0 20px' }}>Executive Intelligence</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {[
                    { label: 'Burn Rate', value: `₹${((stats?.burn_rate || 0) / 1000).toFixed(1)}K/day` },
                    { label: 'Rev Projection', value: `₹${((stats?.projected_revenue || 0) / 100000).toFixed(1)}L` },
                    { label: 'Hiring Progress', value: `${Math.round(stats?.hiring_progress || 0)}%` },
                  ].map((m, i) => (
                    <div key={i} style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 8px', fontWeight: 500 }}>{m.label}</p>
                      <p style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 600, margin: 0 }}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Office Feed */}
              <div className="glass-card" style={{ padding: '24px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '16px' }}>Office Feed</h2>
                  <a href="/feed" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>View All</a>
                </div>
                {announcements.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {announcements.slice(0, 4).map((ann, i) => (
                      <div key={i} style={{ paddingBottom: '12px', borderBottom: i < announcements.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, margin: '0 0 4px', lineHeight: 1.4 }}>{ann.title}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <span>{ann.author_name}</span>
                          <span>{ann.created_at ? new Date(ann.created_at).toLocaleDateString() : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No recent announcements.</p>
                )}
              </div>

              {/* System Health */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h2 style={{ margin: '0 0 20px', fontSize: '16px' }}>System Status</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'API Gateway', status: 'Operational', color: '#10b981' },
                    { label: 'Database', status: 'Healthy', color: '#10b981' },
                    { label: 'AI Engine', status: 'Active', color: '#10b981' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{item.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }} />
                        <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;