import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Users, Briefcase, Calendar, TrendingUp, DollarSign, ShoppingCart, Store, ClipboardList, Receipt, Clock, MessageSquare, Building2, Plus } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => { 
    fetchStats(); 
    fetchInsights();
    fetchRecentCompanies();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/insights`, { headers: { Authorization: `Bearer ${token}` } });
      setInsights(res.data);
    } catch { }
    setLoading(false);
  };

  const fetchRecentCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/companies`, { headers: { Authorization: `Bearer ${token}` } });
      setRecentCompanies((res.data || []).slice(0, 4));
    } catch { }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  
  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    const end = new Date(dateString);
    const today = new Date();
    const diff = end - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = user?.subscription_end_date ? getDaysRemaining(user.subscription_end_date) : null;
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining !== null && daysRemaining <= 0;

  const statCards = [
    { id: 'employees', title: 'Total Employees', value: stats?.total_employees ?? '—', icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { id: 'projects', title: 'Active Projects', value: stats?.total_projects ?? '—', icon: Briefcase, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    { id: 'leaves', title: 'Pending Leaves', value: stats?.pending_leaves ?? '—', icon: Calendar, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { id: 'crm', title: 'CRM Leads', value: stats?.total_leads ?? '—', icon: TrendingUp, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
    { id: 'finance', title: 'Invoices', value: stats?.total_invoices ?? '—', icon: Receipt, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { id: 'support', title: 'Support Tickets', value: stats?.total_tickets ?? '—', icon: MessageSquare, color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
    { id: 'finance', title: 'Total Expenses', value: `₹${((stats?.total_expenses || 0) / 100000).toFixed(1)}L`, icon: DollarSign, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    { id: 'projects', title: 'Billable Hours', value: `${stats?.total_timesheet_hours ?? 0}h`, icon: Clock, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  ].filter(card => {
    if (user?.role === 'superadmin') return true;
    if (!user?.enabled_services) return true;
    return user.enabled_services.includes(card.id);
  });

  const quickActions = [
    { id: 'finance', label: 'Create Invoice', sublabel: 'VF01 • Finance', href: '/finance', emoji: '🧾', color: '#ec4899' },
    { id: 'projects', label: 'Log Time', sublabel: 'CAT2 • Timesheets', href: '/timesheets', emoji: '⏱️', color: '#38bdf8' },
    { id: 'support', label: 'Raise Ticket', sublabel: 'SO11 • Support', href: '/support-desk', emoji: '🆘', color: '#f87171' },
    { id: 'employees', label: 'Add Employee', sublabel: 'PA40 • HRMS', href: '/employees', emoji: '👤', color: '#6366f1' },
    { id: 'projects', label: 'Create Project', sublabel: 'CJ20N • Projects', href: '/projects', emoji: '📋', color: '#8b5cf6' },
    { id: 'assets', label: 'New Asset', sublabel: 'AA01 • Fixed Assets', href: '/assets', emoji: '📦', color: '#10b981' },
  ].filter(action => {
    if (user?.role === 'superadmin') return true;
    if (!user?.enabled_services) return true;
    return user.enabled_services.includes(action.id);
  });

  return (
    <div style={{ display: 'flex', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh', background: '#0f172a' }}>
      <Sidebar user={user} onLogout={onLogout} activePage="dashboard" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Subscription Alert */}
          {(isExpiringSoon || isExpired) && (
            <div style={{ 
              background: isExpired ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
              border: `1px solid ${isExpired ? '#ef4444' : '#f59e0b'}`,
              borderRadius: '12px',
              padding: '16px 24px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>{isExpired ? '⚠️' : '⏳'}</span>
                <div>
                  <p style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: 0 }}>
                    {isExpired ? 'Subscription Expired' : 'Subscription Ending Soon'}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>
                    {isExpired 
                      ? 'Your access to premium services has ended. Please renew to continue using the platform.' 
                      : `Your subscription expires in ${daysRemaining} days. Renew now to avoid service interruption.`}
                  </p>
                </div>
              </div>
              <a href="/subscription" style={{ 
                background: isExpired ? '#ef4444' : '#f59e0b', 
                color: '#fff', 
                textDecoration: 'none', 
                padding: '8px 20px', 
                borderRadius: '8px', 
                fontWeight: 700, 
                fontSize: '13px' 
              }}>
                {isExpired ? 'Renew Plan' : 'Extend Now'}
              </a>
            </div>
          )}
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: '0 0 4px' }}>{getHour()},</p>
              <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800, margin: 0 }}>{user?.name || 'Founder'} 👋</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px', padding: '8px 16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                {getInitials(user?.name)}
              </div>
              <div>
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0 }}>{user?.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color={card.color} />
                    </div>
                    {card.trend && <span style={{ fontSize: '12px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '50px' }}>↑ {card.trend}</span>}
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 4px' }}>{card.title}</p>
                  <p style={{ color: '#fff', fontSize: '24px', fontWeight: 800, margin: 0 }}>{card.value}</p>
                </div>
              );
            })}
          </div>

          {/* Middle Row: Actions + Summary + Feed */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Business Actions */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
                <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 20px' }}>⚡ Business Growth Actions</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {quickActions.map((action, i) => (
                    <a key={i} href={action.href} style={{ textDecoration: 'none', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '20px' }}>{action.emoji}</span>
                      <div>
                        <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, margin: 0 }}>{action.label}</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: 0 }}>{action.sublabel}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Executive Summary */}
              <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(16,185,129,0.05))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
                <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 20px' }}>📈 Executive Intelligence</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <div style={{ padding: '12px', background: 'rgba(239,68,68,0.05)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.1)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0' }}>Burn Rate</p>
                    <p style={{ color: '#ef4444', fontSize: '18px', fontWeight: 800, margin: '4px 0 0' }}>₹{((stats?.burn_rate || 0) / 1000).toFixed(1)}K</p>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(16,185,129,0.05)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.1)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0' }}>Revenue Projection</p>
                    <p style={{ color: '#10b981', fontSize: '18px', fontWeight: 800, margin: '4px 0 0' }}>₹{((stats?.projected_revenue || 0) / 100000).toFixed(1)}L</p>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(129,140,248,0.05)', borderRadius: '12px', border: '1px solid rgba(129,140,248,0.1)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0' }}>Hiring Progress</p>
                    <p style={{ color: '#818cf8', fontSize: '18px', fontWeight: 800, margin: '4px 0 0' }}>{Math.round(stats?.hiring_progress || 0)}%</p>
                  </div>
                </div>
              </div>

              {/* AI Business Insights Panel */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '18px' }}>🤖</span>
                    <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0 }}>AI Business Consultant</h2>
                    <span className="badge-blue" style={{ marginLeft: 'auto', fontSize: '10px' }}>BETA</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {insights.map((insight, i) => (
                    <div key={i} style={{ 
                        padding: '16px', 
                        background: insight.type === 'warning' ? 'rgba(245,158,11,0.05)' : 'rgba(99,102,241,0.05)',
                        borderLeft: `4px solid ${insight.type === 'warning' ? '#f59e0b' : '#6366f1'}`,
                        borderRadius: '4px 12px 12px 4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 700, margin: 0 }}>{insight.title}</p>
                        <span style={{ fontSize: '10px', color: insight.type === 'warning' ? '#f59e0b' : '#6366f1', fontWeight: 800, textTransform: 'uppercase' }}>{insight.impact} impact</span>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>{insight.message}</p>
                      <button style={{ 
                          marginTop: '12px', background: 'transparent', border: 'none', 
                          color: insight.type === 'warning' ? '#f59e0b' : '#6366f1', 
                          fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0
                      }}>Take Action →</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Office Feed Sidebar */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0 }}>📢 Office Feed</h2>
                <a href="/feed" style={{ fontSize: '11px', color: '#818cf8', textDecoration: 'none' }}>View All</a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { title: 'New ERP Features Live', time: '2h ago', author: 'Founder' },
                  { title: 'Team Outing Plans', time: '5h ago', author: 'HR' },
                  { title: 'Security Update Required', time: '1d ago', author: 'IT' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ color: '#fff', fontSize: '12px', fontWeight: 600, margin: '0 0 4px' }}>{item.title}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                      <span>{item.author}</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Company Onboarding Widget */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} color="#818cf8" />
                </div>
                <div>
                  <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0 }}>🏢 New Company Onboardings</h2>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>Recently registered company profiles</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <a href="/company-onboarding" style={{ fontSize: '12px', color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>View All →</a>
                <a href="/company-onboarding" style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', textDecoration: 'none',
                  borderRadius: '10px', fontWeight: 700, fontSize: '12px'
                }}>
                  <Plus size={14} /> Onboard Company
                </a>
              </div>
            </div>

            {recentCompanies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.25)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '14px' }}>
                <Building2 size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: '10px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No companies onboarded yet — <a href="/company-onboarding" style={{ color: '#818cf8', textDecoration: 'none' }}>get started</a></p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                {recentCompanies.map((c, i) => {
                  const initials = (c.name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981'];
                  const color = colors[i % colors.length];
                  return (
                    <a key={c.id} href="/company-onboarding" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                      {c.logo ? (
                        <img src={c.logo} alt="logo" style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'contain', background: 'rgba(255,255,255,0.08)', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}22`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color, flexShrink: 0 }}>
                          {initials}
                        </div>
                      )}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ color: '#fff', fontWeight: 700, fontSize: '13px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: '2px 0 0' }}>{c.industry || 'No industry'} {c.city ? `• ${c.city}` : ''}</p>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                          {c.pan_number && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99,102,241,0.12)', color: '#818cf8', fontFamily: 'monospace' }}>PAN</span>}
                          {c.gst_number && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.12)', color: '#34d399', fontFamily: 'monospace' }}>GST</span>}
                          {c.logo && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>🎨 Logo</span>}
                          {c.stamp && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(236,72,153,0.12)', color: '#f472b6' }}>🔏 Stamp</span>}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Row: System Health */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
              <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 20px' }}>🟢 System Health</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {[
                  { label: 'API Gateway', status: 'Operational', color: '#10b981' },
                  { label: 'Cloud DB', status: 'Healthy', color: '#10b981' },
                  { label: 'Security Layer', status: 'Active', color: '#10b981' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{item.label}</span>
                    <span style={{ color: item.color, fontSize: '12px', fontWeight: 700 }}>{item.status}</span>
                  </div>
                ))}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;