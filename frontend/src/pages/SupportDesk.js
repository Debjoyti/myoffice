import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, MessageSquare, User, Clock, AlertTriangle, CheckCircle2, Circle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: Circle },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  high: { label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: AlertTriangle },
};

const STATUS_CONFIG = {
  open: { label: 'Open', color: '#6366f1', class: 'badge-blue' },
  in_progress: { label: 'In Progress', color: '#f59e0b', class: 'badge-amber' },
  resolved: { label: 'Resolved', color: '#10b981', class: 'badge-green' },
  closed: { label: 'Closed', color: '#6b7280', class: 'badge-blue' },
};

const SupportDesk = ({ user, onLogout }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [formData, setFormData] = useState({
    subject: '', description: '', priority: 'medium', contact_email: user?.email || ''
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/tickets`, { headers: { Authorization: `Bearer ${token}` } });
      setTickets(res.data);
    } catch { toast.error('Failed to fetch tickets'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/tickets`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('🎫 Support ticket created — our team will respond within 24hrs');
      setShowModal(false);
      setFormData({ subject: '', description: '', priority: 'medium', contact_email: user?.email || '' });
      fetchData();
    } catch { toast.error('Failed to create ticket'); }
  };

  const updateStatus = async (ticketId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/tickets/${ticketId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket?.id === ticketId) setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      toast.success(`Ticket ${newStatus === 'resolved' ? 'resolved ✓' : 'updated'}`);
    } catch { toast.error('Failed to update ticket'); fetchData(); }
  };

  const filteredTickets = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const openCount = tickets.filter(t => t.status === 'open').length;
  const highPriorityCount = tickets.filter(t => t.priority === 'high' && t.status !== 'resolved' && t.status !== 'closed').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  const priorityIcon = (p) => {
    const cfg = PRIORITY_CONFIG[p] || PRIORITY_CONFIG.medium;
    const Icon = cfg.icon;
    return <Icon size={14} color={cfg.color} />;
  };

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="support-desk" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          {/* Header */}
          <div className="page-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 className="page-title">Support Desk</h1>
                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px' }}>SO11</span>
              </div>
              <p className="page-subtitle">Track and resolve customer support requests</p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-dark-primary">
              <Plus size={18} /> New Ticket
            </button>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
            {[
              { label: 'Total Tickets', value: tickets.length, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
              { label: 'Open', value: openCount, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
              { label: 'High Priority', value: highPriorityCount, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
              { label: 'Resolved', value: resolvedCount, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
            ].map((k, i) => (
              <div key={i} className="dark-card" style={{ padding: '18px 20px' }}>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', margin: '0 0 4px' }}>{k.label}</p>
                <p style={{ color: k.color, fontSize: '28px', fontWeight: 800, margin: 0 }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px' }}>
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  style={{ padding: '7px 13px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
                    background: filterStatus === s ? 'rgba(99,102,241,0.2)' : 'transparent',
                    color: filterStatus === s ? '#818cf8' : 'rgba(255,255,255,0.45)' }}>
                  {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px' }}>
              {['all', 'low', 'medium', 'high'].map(p => (
                <button key={p} onClick={() => setFilterPriority(p)}
                  style={{ padding: '7px 13px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
                    background: filterPriority === p ? 'rgba(99,102,241,0.2)' : 'transparent',
                    color: filterPriority === p ? '#818cf8' : 'rgba(255,255,255,0.45)' }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="dark-loading">Loading tickets...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }} className="fade-in">
              {filteredTickets.map(t => {
                const pCfg = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                const sCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
                return (
                  <div key={t.id} className="dark-card" style={{ padding: '20px', borderLeft: `3px solid ${pCfg.color}`, cursor: 'pointer' }}
                    onClick={() => setSelectedTicket(selectedTicket?.id === t.id ? null : t)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {priorityIcon(t.priority)}
                        <span style={{ fontSize: '11px', fontWeight: 700, color: pCfg.color }}>{pCfg.label} Priority</span>
                      </div>
                      <span className={sCfg.class} style={{ textTransform: 'capitalize' }}>{sCfg.label}</span>
                    </div>
                    <h3 style={{ color: '#fff', fontSize: '15px', margin: '0 0 8px', fontWeight: 700, lineHeight: 1.3 }}>{t.subject}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.5, margin: '0 0 16px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {t.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={12} color="rgba(255,255,255,0.35)" />
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{t.contact_email}</span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                        {t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : '—'}
                      </span>
                    </div>

                    {/* Expanded admin actions */}
                    {selectedTicket?.id === t.id && isAdmin && (
                      <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(99,102,241,0.05)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.15)' }}
                        onClick={e => e.stopPropagation()}>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase' }}>Update Status</p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {Object.entries(STATUS_CONFIG).filter(([k]) => k !== t.status).map(([statusKey, cfg]) => (
                            <button key={statusKey} onClick={() => updateStatus(t.id, statusKey)}
                              style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: cfg.color, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                              → {cfg.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredTickets.length === 0 && (
                <div className="dark-empty" style={{ gridColumn: '1/-1' }}>
                  {tickets.length === 0 ? 'No open tickets. It\'s a quiet day! 🎉' : 'No tickets matching selected filters.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '520px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', margin: 0 }}>Create Support Ticket</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Subject *</label>
                <input type="text" className="dark-input" placeholder="Brief description of the issue" required
                  value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dark-label">Contact Email *</label>
                  <input type="email" className="dark-input" placeholder="customer@example.com" required
                    value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} />
                </div>
                <div>
                  <label className="dark-label">Priority</label>
                  <select className="dark-input" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="dark-label">Description *</label>
                <textarea className="dark-input" rows="5" placeholder="Detailed description of the issue, steps to reproduce, expected vs actual behavior..." required
                  value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportDesk;
