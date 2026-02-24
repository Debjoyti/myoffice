import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Users, Briefcase, Calendar, TrendingUp, DollarSign, ShoppingCart, Store, ClipboardList } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => { fetchStats(); }, []);

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
    { title: 'Total Employees', value: stats?.total_employees ?? '—', icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', testId: 'stat-total-employees', trend: '+12%' },
    { title: 'Active Employees', value: stats?.active_employees ?? '—', icon: Users, color: '#10b981', bg: 'rgba(16,185,129,0.12)', testId: 'stat-active-employees', trend: '+5%' },
    { title: 'Total Projects', value: stats?.total_projects ?? '—', icon: Briefcase, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', testId: 'stat-total-projects', trend: '+3' },
    { title: 'Pending Leaves', value: stats?.pending_leaves ?? '—', icon: Calendar, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', testId: 'stat-pending-leaves', trend: null },
    { title: 'Total Leads', value: stats?.total_leads ?? '—', icon: TrendingUp, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', testId: 'stat-total-leads', trend: '+18%' },
    { title: 'Total Expenses', value: `₹${((stats?.total_expenses || 0) / 100000).toFixed(1)}L`, icon: DollarSign, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', testId: 'stat-total-expenses', trend: null },
    { title: 'Total Stores', value: stats?.total_stores ?? '—', icon: Store, color: '#14b8a6', bg: 'rgba(20,184,166,0.12)', testId: 'stat-total-stores', trend: null },
    { title: 'Pending Requests', value: stats?.pending_purchase_requests ?? '—', icon: ClipboardList, color: '#f97316', bg: 'rgba(249,115,22,0.12)', testId: 'stat-pending-requests', trend: null },
  ];

  const quickActions = [
    { label: 'Add Employee', sublabel: 'Onboard a new team member', href: '/employees', emoji: '👤', color: '#6366f1' },
    { label: 'Create Project', sublabel: 'Start a new project', href: '/projects', emoji: '📋', color: '#8b5cf6' },
    { label: 'Add Lead', sublabel: 'Track a new opportunity', href: '/crm', emoji: '🎯', color: '#06b6d4' },
    { label: 'Log Expense', sublabel: 'Record an expense', href: '/expenses', emoji: '💰', color: '#10b981' },
    { label: 'Attendance', sublabel: 'Mark today\'s attendance', href: '/attendance', emoji: '✅', color: '#f59e0b' },
    { label: 'Leave Request', sublabel: 'Manage leave requests', href: '/leave', emoji: '🗓️', color: '#ef4444' },
  ];

  return (
    <div style={{ display: 'flex', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh', background: '#0f172a' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stat-card-new {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.25s ease;
          cursor: default;
          animation: fadeInUp 0.5s ease forwards;
        }
        .stat-card-new:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }
        .quick-action-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .quick-action-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
          transform: translateX(4px);
        }
      `}</style>

      <Sidebar
        user={user}
        onLogout={onLogout}
        activePage="dashboard"
        setActivePage={() => { }}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: '0 0 4px' }}>{getHour()},</p>
              <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }} data-testid="dashboard-title">
                {user?.name || 'Admin'} 👋
              </h1>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50px', padding: '8px 16px 8px 8px',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '14px',
              }}>
                {getInitials(user?.name)}
              </div>
              <div>
                <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0 }}>{user?.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0, textTransform: 'capitalize' }}>{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>Loading stats...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {statCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="stat-card-new" data-testid={card.testId} style={{ animationDelay: `${i * 60}ms` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '12px',
                        background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={20} color={card.color} />
                      </div>
                      {card.trend && (
                        <span style={{
                          fontSize: '12px', fontWeight: 600, color: '#10b981',
                          background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: '50px',
                        }}>
                          ↑ {card.trend}
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 4px' }}>{card.title}</p>
                    <p style={{ color: '#fff', fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{card.value}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Quick Actions */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px', padding: '24px',
            }}>
              <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 20px' }}>⚡ Quick Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {quickActions.map((action, i) => (
                  <a key={i} href={action.href} className="quick-action-card">
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '10px',
                      background: `${action.color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', flexShrink: 0,
                    }}>
                      {action.emoji}
                    </div>
                    <div>
                      <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>{action.label}</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>{action.sublabel}</p>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.2)', marginLeft: 'auto', fontSize: '18px' }}>›</span>
                  </a>
                ))}
              </div>
            </div>

            {/* System status */}
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px', padding: '24px',
            }}>
              <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 20px' }}>🟢 System Status</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: 'Backend API', status: 'Operational', color: '#10b981' },
                  { label: 'Database', status: 'Connected', color: '#10b981' },
                  { label: 'Authentication', status: 'Active', color: '#10b981' },
                  { label: 'Storage', status: 'Available', color: '#10b981' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{item.label}</span>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      color: item.color, fontSize: '13px', fontWeight: 500,
                    }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '24px', paddingTop: '20px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: '0 0 12px' }}>📈 Data Overview</h3>
                {[
                  { label: 'Employees', value: stats?.total_employees || 0, color: '#6366f1', max: 200 },
                  { label: 'Active Projects', value: stats?.total_projects || 0, color: '#8b5cf6', max: 20 },
                  { label: 'CRM Leads', value: stats?.total_leads || 0, color: '#06b6d4', max: 50 },
                ].map((bar, i) => (
                  <div key={i} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{bar.label}</span>
                      <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>{bar.value}</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }}>
                      <div style={{
                        height: '100%', borderRadius: '4px',
                        background: bar.color,
                        width: `${Math.min((bar.value / bar.max) * 100, 100)}%`,
                        transition: 'width 1s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;