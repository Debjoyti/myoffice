import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Users, Briefcase, Calendar, TrendingUp, DollarSign, ShoppingCart, Store, ClipboardList, Receipt, Clock, MessageSquare } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => { 
    fetchStats(); 
    fetchInsights();
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

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  
  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = [
    { title: 'Total Employees', value: stats?.total_employees ?? '—', icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', trend: '+12%' },
    { title: 'Active Projects', value: stats?.total_projects ?? '—', icon: Briefcase, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', trend: '+3' },
    { title: 'Pending Leaves', value: stats?.pending_leaves ?? '—', icon: Calendar, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { title: 'CRM Leads', value: stats?.total_leads ?? '—', icon: TrendingUp, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', trend: '+18%' },
    { title: 'Invoices', value: stats?.total_invoices ?? '—', icon: Receipt, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { title: 'Support Tickets', value: stats?.total_tickets ?? '—', icon: MessageSquare, color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
    { title: 'Total Expenses', value: `₹${((stats?.total_expenses || 0) / 100000).toFixed(1)}L`, icon: DollarSign, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    { title: 'Billable Hours', value: `${stats?.total_timesheet_hours ?? 0}h`, icon: Clock, color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  ];

  const quickActions = [
    { label: 'Create Invoice', sublabel: 'VF01 • Finance', href: '/finance', emoji: '🧾', color: '#ec4899' },
    { label: 'Log Time', sublabel: 'CAT2 • Timesheets', href: '/timesheets', emoji: '⏱️', color: '#38bdf8' },
    { label: 'Raise Ticket', sublabel: 'SO11 • Support', href: '/support-desk', emoji: '🆘', color: '#f87171' },
    { label: 'Add Employee', sublabel: 'PA40 • HRMS', href: '/employees', emoji: '👤', color: '#6366f1' },
    { label: 'Create Project', sublabel: 'CJ20N • Projects', href: '/projects', emoji: '📋', color: '#8b5cf6' },
    { label: 'New Asset', sublabel: 'AA01 • Fixed Assets', href: '/assets', emoji: '📦', color: '#10b981' },
  ];

  return (
    <div style={{ display: 'flex', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh', background: '#0f172a' }}>
      <Sidebar user={user} onLogout={onLogout} activePage="dashboard" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
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
                    <p style={{ color: '#ef4444', fontSize: '18px', fontWeight: 800, margin: '4px 0 0' }}>₹1.2M</p>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(16,185,129,0.05)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.1)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0' }}>Revenue Projection</p>
                    <p style={{ color: '#10b981', fontSize: '18px', fontWeight: 800, margin: '4px 0 0' }}>₹4.8M</p>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(129,140,248,0.05)', borderRadius: '12px', border: '1px solid rgba(129,140,248,0.1)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0' }}>Hiring Progress</p>
                    <p style={{ color: '#818cf8', fontSize: '18px', fontWeight: 800, margin: '4px 0 0' }}>65%</p>
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