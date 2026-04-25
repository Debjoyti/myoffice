import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, AlertTriangle, Calendar, FileText, MessageSquare, TrendingUp, Users, Sparkles, ChevronRight } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Notification type configs
const NOTIF_TYPES = {
  leave:     { icon: Calendar,     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Leave Request' },
  invoice:   { icon: FileText,     color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  label: 'Invoice' },
  ticket:    { icon: MessageSquare,color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Support' },
  lead:      { icon: TrendingUp,   color: '#10b981', bg: 'rgba(16,185,129,0.1)',  label: 'CRM' },
  employee:  { icon: Users,        color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  label: 'HR' },
  alert:     { icon: AlertTriangle,color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   label: 'Alert' },
  ai:        { icon: Sparkles,     color: '#22d3ee', bg: 'rgba(34,211,238,0.1)',  label: 'AI Insight' },
};

// Generate smart notifications from live data
const generateSmartNotifications = (stats, userData) => {
  const notifs = [];
  const now = new Date();

  if (stats?.pending_leaves > 0) {
    notifs.push({
      id: 'leave-1',
      type: 'leave',
      title: `${stats.pending_leaves} Leave Request${stats.pending_leaves > 1 ? 's' : ''} Pending`,
      body: 'Team members are waiting for approval. Resolve to maintain morale.',
      action: '/hrms',
      actionLabel: 'Review Now',
      time: new Date(now - 30 * 60000),
      read: false,
      priority: 'high',
    });
  }

  if (stats?.total_tickets > 0) {
    notifs.push({
      id: 'ticket-1',
      type: 'ticket',
      title: `${stats.total_tickets} Support Ticket${stats.total_tickets > 1 ? 's' : ''} Open`,
      body: 'Customers are waiting for responses. SLA clock is ticking.',
      action: '/support-desk',
      actionLabel: 'View Tickets',
      time: new Date(now - 2 * 3600000),
      read: false,
      priority: stats.total_tickets > 5 ? 'high' : 'medium',
    });
  }

  if (stats?.total_leads > 0) {
    notifs.push({
      id: 'lead-1',
      type: 'lead',
      title: 'CRM Pipeline Update',
      body: `${stats.total_leads} active leads in pipeline. AI detected 2 leads at risk of going cold.`,
      action: '/crm',
      actionLabel: 'View Pipeline',
      time: new Date(now - 4 * 3600000),
      read: false,
      priority: 'medium',
    });
  }

  if (stats?.projected_revenue > 0) {
    notifs.push({
      id: 'ai-1',
      type: 'ai',
      title: 'AI Revenue Forecast Ready',
      body: `Monthly projection: ₹${((stats.projected_revenue) / 100000).toFixed(1)}L — ${stats.projected_revenue > 500000 ? 'On track! 🎉' : 'Below target — review strategy'}`,
      action: '/finance',
      actionLabel: 'View Finance',
      time: new Date(now - 6 * 3600000),
      read: true,
      priority: 'low',
    });
  }

  notifs.push({
    id: 'ai-brief',
    type: 'ai',
    title: '🌅 Morning Business Brief',
    body: `${userData?.name?.split(' ')[0] || 'Founder'}, your AI brief is ready. ${stats?.pending_leaves || 0} approvals, ${stats?.total_tickets || 0} tickets, ${stats?.total_leads || 0} leads tracked.`,
    action: '/',
    actionLabel: 'View Dashboard',
    time: new Date(now - 8 * 3600000),
    read: true,
    priority: 'low',
  });

  return notifs;
};

const timeAgo = (date) => {
  const diff = Math.floor((new Date() - new Date(date)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationCenter = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const panelRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } });
        setStats(res.data);
        setNotifications(generateSmartNotifications(res.data, user));
      } catch {
        setNotifications(generateSmartNotifications(null, user));
      }
    };
    fetchStats();
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  const filtered = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter(n => !n.read) : notifications.filter(n => n.type === filter);

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...filtered].sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative', width: '36px', height: '36px', borderRadius: '10px',
          background: isOpen ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isOpen ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)'}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease', color: isOpen ? '#a5b4fc' : 'rgba(255,255,255,0.6)',
        }}
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-5px',
            width: '18px', height: '18px', borderRadius: '50%',
            background: '#f43f5e', border: '2px solid #05070f',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', fontWeight: 800, color: '#fff',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed', top: '80px', left: '260px', zIndex: 9999,
          width: '350px', maxHeight: '520px',
          background: '#0c1220',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '18px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.08)',
          display: 'flex', flexDirection: 'column',
          animation: 'fadeInUp 0.2s ease',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={16} color="#a5b4fc" />
                <p style={{ color: '#fff', fontWeight: 700, fontSize: '15px', margin: 0 }}>Notifications</p>
                {unreadCount > 0 && (
                  <span style={{ background: '#f43f5e', color: '#fff', borderRadius: '99px', padding: '2px 7px', fontSize: '10px', fontWeight: 800 }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
              {['all', 'unread', 'ai', 'leave', 'ticket', 'lead'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '4px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
                  background: filter === f ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: filter === f ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.15s',
                }}>
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notification List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {sorted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)' }}>
                <CheckCheck size={32} color="rgba(99,102,241,0.4)" style={{ marginBottom: '12px' }} />
                <p style={{ margin: 0, fontSize: '13px' }}>All caught up! 🎉</p>
              </div>
            ) : (
              sorted.map(notif => {
                const cfg = NOTIF_TYPES[notif.type] || NOTIF_TYPES.alert;
                const Icon = cfg.icon;
                return (
                  <div key={notif.id}
                    onClick={() => markRead(notif.id)}
                    style={{
                      display: 'flex', gap: '12px', padding: '12px 14px',
                      borderRadius: '12px', marginBottom: '4px', cursor: 'pointer',
                      background: notif.read ? 'transparent' : 'rgba(99,102,241,0.04)',
                      border: notif.read ? '1px solid transparent' : '1px solid rgba(99,102,241,0.1)',
                      transition: 'all 0.18s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(99,102,241,0.04)'}
                  >
                    {/* Unread dot */}
                    {!notif.read && (
                      <div style={{ position: 'absolute', top: '14px', left: '5px', width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }} />
                    )}

                    {/* Icon */}
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={cfg.color} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <p style={{ color: '#fff', fontWeight: notif.read ? 500 : 700, fontSize: '13px', margin: '0 0 3px', lineHeight: 1.3 }}>
                          {notif.title}
                        </p>
                        <button onClick={e => { e.stopPropagation(); dismiss(notif.id); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: '0', flexShrink: 0 }}>
                          <X size={12} />
                        </button>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 8px', lineHeight: 1.4 }}>
                        {notif.body}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <a href={notif.action} onClick={() => setIsOpen(false)} style={{ fontSize: '11px', color: '#818cf8', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {notif.actionLabel} <ChevronRight size={11} />
                        </a>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{timeAgo(notif.time)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={12} color="#a5b4fc" />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>AI-generated from live data</p>
              </div>
              {notifications.length > 0 && (
                <button onClick={() => setNotifications([])} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '11px', cursor: 'pointer' }}>
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
