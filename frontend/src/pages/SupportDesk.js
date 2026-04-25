import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, MessageSquare, User, Clock, AlertTriangle, CheckCircle2, Circle, Sparkles, Tag, Timer, SmilePlus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  icon: Circle },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  high:   { label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: AlertTriangle },
};

const STATUS_CONFIG = {
  open:        { label: 'Open',        class: 'badge-blue',  color: '#a5b4fc' },
  in_progress: { label: 'In Progress', class: 'badge-amber', color: '#fbbf24' },
  resolved:    { label: 'Resolved',    class: 'badge-green', color: '#34d399' },
  closed:      { label: 'Closed',      class: 'badge-gray',  color: '#9ca3af' },
};

// AI category detection
const detectCategory = (subject, description) => {
  const text = `${subject} ${description}`.toLowerCase();
  if (text.includes('bug') || text.includes('error') || text.includes('crash') || text.includes('not working')) return '🐛 Bug Report';
  if (text.includes('feature') || text.includes('request') || text.includes('add') || text.includes('want')) return '✨ Feature Request';
  if (text.includes('billing') || text.includes('invoice') || text.includes('payment') || text.includes('charge')) return '💳 Billing';
  if (text.includes('password') || text.includes('login') || text.includes('access') || text.includes('account')) return '🔐 Account Access';
  if (text.includes('slow') || text.includes('performance') || text.includes('speed')) return '⚡ Performance';
  return '💬 General Inquiry';
};

// AI Smart Reply suggestions
const getSmartReplies = (ticket) => {
  const category = detectCategory(ticket.subject || '', ticket.description || '');
  const name = ticket.contact_email?.split('@')[0] || 'there';

  if (category.includes('Bug')) return [
    `Hi ${name}, thank you for reporting this issue. Our technical team has been notified and is investigating. We'll update you within 2 business hours with a resolution.`,
    `Hello ${name}, we've reproduced the issue and it's been escalated to our engineering team. Expected fix: within 24 hours. We'll send a confirmation once deployed.`,
  ];
  if (category.includes('Feature')) return [
    `Hi ${name}, thank you for this feature suggestion! It's been added to our product roadmap for review. We'll notify you if it makes it to our next sprint.`,
    `Hello ${name}, great idea! We've logged this as a feature request (ID: #${ticket.id?.slice(-6)}). Our product team will evaluate it in the next planning cycle.`,
  ];
  if (category.includes('Billing')) return [
    `Hi ${name}, I can see your billing inquiry. Please note that invoices are processed within 3 business days. Would you like me to escalate this to our finance team?`,
    `Hello ${name}, I've reviewed your account. If you're facing a billing discrepancy, please share the invoice number and we'll resolve it immediately.`,
  ];
  if (category.includes('Account')) return [
    `Hi ${name}, for account security, please use the 'Forgot Password' link on the login page. If that doesn't work, reply here and we'll manually reset your access.`,
    `Hello ${name}, I've flagged your account for priority review. Please expect a resolution within 1 hour. Meanwhile, try incognito mode as a workaround.`,
  ];
  return [
    `Hi ${name}, thank you for reaching out! I've reviewed your request and will get back to you with a detailed response within 4 hours.`,
    `Hello ${name}, your ticket has been assigned and is being reviewed by our specialist. We'll resolve this as quickly as possible.`,
  ];
};

// SLA targets (hours)
const SLA_TARGETS = { high: 4, medium: 24, low: 72 };

const getSLAStatus = (ticket) => {
  if (!ticket.created_at) return null;
  const created = new Date(ticket.created_at);
  const now = new Date();
  const hoursElapsed = (now - created) / 3600000;
  const target = SLA_TARGETS[ticket.priority] || 24;
  const remaining = target - hoursElapsed;
  if (remaining < 0) return { label: 'SLA Breached', color: '#f43f5e', breached: true };
  if (remaining < target * 0.2) return { label: `${Math.round(remaining)}h left`, color: '#f59e0b', breached: false };
  return { label: `${Math.round(remaining)}h SLA`, color: '#10b981', breached: false };
};

const SupportDesk = ({ user, onLogout }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showSmartReply, setShowSmartReply] = useState(null);
  const [formData, setFormData] = useState({ subject: '', description: '', priority: 'medium', contact_email: user?.email || '' });
  const [aiCategory, setAiCategory] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'hr';

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    if (formData.subject || formData.description) {
      setAiCategory(detectCategory(formData.subject, formData.description));
    }
  }, [formData.subject, formData.description]);

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
      toast.success('🎫 Ticket created — we\'ll respond within SLA window');
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
    } catch { toast.error('Failed to update'); fetchData(); }
  };

  const filteredTickets = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  // KPIs
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const highPriorityCount = tickets.filter(t => t.priority === 'high' && !['resolved', 'closed'].includes(t.status)).length;
  const resolvedCount = tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length;
  const slaBreachCount = tickets.filter(t => !['resolved', 'closed'].includes(t.status) && getSLAStatus(t)?.breached).length;

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          <div className="breadcrumb"><span>BizOps</span><span className="breadcrumb-sep">/</span><span className="breadcrumb-current">Support Desk</span></div>

          <div className="page-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 className="page-title">Support Desk</h1>
                <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace' }}>SO11</span>
                <span className="ai-badge"><Sparkles size={9} /> Smart Replies</span>
              </div>
              <p className="page-subtitle">Track & resolve tickets with AI-powered categorization and SLA monitoring</p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-dark-primary"><Plus size={16} /> New Ticket</button>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }} className="stagger">
            {[
              { label: 'Total',       value: tickets.length,   color: '#6366f1', icon: MessageSquare },
              { label: 'Open',        value: openCount,        color: '#22d3ee', icon: Circle },
              { label: 'In Progress', value: inProgressCount,  color: '#f59e0b', icon: Clock },
              { label: 'High Priority', value: highPriorityCount, color: '#f43f5e', icon: AlertTriangle },
              { label: 'SLA Breached', value: slaBreachCount,  color: slaBreachCount > 0 ? '#f43f5e' : '#10b981', icon: Timer },
            ].map((k, i) => {
              const Icon = k.icon;
              return (
                <div key={i} className="kpi-card fade-in">
                  <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `${k.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <Icon size={15} color={k.color} />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 2px', fontWeight: 600 }}>{k.label}</p>
                  <p style={{ color: k.color, fontSize: '22px', fontWeight: 900, margin: 0 }}>{k.value}</p>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div className="tab-bar">
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
                <button key={s} className={`tab-btn ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
                  {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
                </button>
              ))}
            </div>
            <div className="tab-bar">
              {['all', 'low', 'medium', 'high'].map(p => (
                <button key={p} className={`tab-btn ${filterPriority === p ? 'active' : ''}`} onClick={() => setFilterPriority(p)}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="dark-loading"><div className="dark-loading-spinner" /><span>Loading tickets…</span></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }} className="fade-in">
              {filteredTickets.map(t => {
                const pCfg = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                const sCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
                const category = detectCategory(t.subject || '', t.description || '');
                const sla = getSLAStatus(t);
                const isSelected = selectedTicket?.id === t.id;
                const smartReplies = getSmartReplies(t);

                return (
                  <div key={t.id} className="dark-card" style={{ padding: '18px 20px', borderLeft: `3px solid ${pCfg.color}`, cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setSelectedTicket(isSelected ? null : t)}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: pCfg.color }}>{pCfg.label}</span>
                        {sla && <span style={{ fontSize: '9.5px', padding: '1px 6px', borderRadius: '5px', background: `${sla.color}12`, color: sla.color, fontWeight: 700 }}>{sla.label}</span>}
                      </div>
                      <span className={sCfg.class}>{sCfg.label}</span>
                    </div>

                    <h3 style={{ color: '#fff', fontSize: '14px', margin: '0 0 6px', fontWeight: 700, lineHeight: 1.3 }}>{t.subject}</h3>

                    {/* AI Category */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Tag size={11} color="#818cf8" />
                      <span style={{ fontSize: '10.5px', color: '#818cf8', fontWeight: 600 }}>AI: {category}</span>
                    </div>

                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12.5px', lineHeight: 1.5, margin: '0 0 14px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {t.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <User size={11} color="rgba(255,255,255,0.3)" />
                        <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>{t.contact_email}</span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)' }}>
                        {t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : '—'}
                      </span>
                    </div>

                    {/* Expanded: AI Smart Reply + Admin Actions */}
                    {isSelected && (
                      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }} onClick={e => e.stopPropagation()}>
                        {/* AI Smart Replies */}
                        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <Sparkles size={12} color="#818cf8" />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Smart Replies</span>
                          </div>
                          {smartReplies.map((reply, i) => (
                            <div key={i} style={{ marginBottom: i < smartReplies.length - 1 ? '8px' : 0 }}>
                              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11.5px', margin: '0 0 4px', lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                {reply}
                              </p>
                              <button onClick={() => { navigator.clipboard?.writeText(reply); toast.success('Reply copied!'); }}
                                style={{ fontSize: '10px', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '0 4px' }}>
                                📋 Copy reply
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Admin status actions */}
                        {isAdmin && (
                          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 12px' }}>
                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Update Status</p>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {Object.entries(STATUS_CONFIG).filter(([k]) => k !== t.status).map(([statusKey, cfg]) => (
                                <button key={statusKey} onClick={() => updateStatus(t.id, statusKey)} style={{ padding: '5px 12px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: cfg.color, fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                                  → {cfg.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredTickets.length === 0 && (
                <div className="dark-empty" style={{ gridColumn: '1/-1' }}>
                  {tickets.length === 0 ? <><SmilePlus size={36} color="rgba(99,102,241,0.3)" style={{ marginBottom: '14px' }} /><p>No tickets yet — it's a quiet day! 🎉</p></> : <p>No tickets match the selected filters.</p>}
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
              <h2 style={{ color: '#fff', margin: 0, fontSize: '18px', fontWeight: 800 }}>Create Support Ticket</h2>
              <button onClick={() => setShowModal(false)} className="icon-btn"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Subject *</label>
                <input type="text" className="dark-input" placeholder="Brief description of the issue" required value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
              </div>
              {aiCategory && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '9px' }}>
                  <Sparkles size={12} color="#818cf8" />
                  <span style={{ fontSize: '12px', color: '#a5b4fc', fontWeight: 600 }}>AI Category: {aiCategory}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>SLA: {SLA_TARGETS[formData.priority]}h</span>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dark-label">Contact Email *</label>
                  <input type="email" className="dark-input" placeholder="customer@example.com" required value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} />
                </div>
                <div>
                  <label className="dark-label">Priority</label>
                  <select className="dark-input" value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="low">🟢 Low (SLA: 72h)</option>
                    <option value="medium">🟡 Medium (SLA: 24h)</option>
                    <option value="high">🔴 High (SLA: 4h)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="dark-label">Description *</label>
                <textarea className="dark-input" rows="5" placeholder="Detailed description, steps to reproduce, expected vs actual behavior..." required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
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
