import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, TrendingUp, DollarSign, Users, Target, ChevronRight, Phone, Mail, Building, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PIPELINE_STAGES = [
  { id: 'new', label: 'New Lead', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  { id: 'contacted', label: 'Contacted', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  { id: 'qualified', label: 'Qualified', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { id: 'proposal', label: 'Proposal', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { id: 'negotiation', label: 'Negotiation', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  { id: 'closed-won', label: 'Won ✓', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { id: 'closed-lost', label: 'Lost ✗', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
];

const DEAL_STAGES = [
  { id: 'proposal', label: 'Proposal' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'closed-won', label: 'Closed Won' },
  { id: 'closed-lost', label: 'Closed Lost' },
];

const CRM = ({ user, onLogout }) => {
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('pipeline');
  const [draggedLead, setDraggedLead] = useState(null);
  const [leadFormData, setLeadFormData] = useState({ name: '', email: '', phone: '', company: '', source: '' });
  const [dealFormData, setDealFormData] = useState({ lead_id: '', title: '', value: '', stage: 'proposal', probability: 50, expected_close_date: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [leadsRes, dealsRes] = await Promise.all([
        axios.get(`${API}/leads`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/deals`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setLeads(leadsRes.data);
      setDeals(dealsRes.data);
    } catch { toast.error('Failed to fetch CRM data'); }
    setLoading(false);
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/leads`, leadFormData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Lead added successfully');
      setShowLeadModal(false);
      setLeadFormData({ name: '', email: '', phone: '', company: '', source: '' });
      fetchData();
    } catch { toast.error('Failed to add lead'); }
  };

  const handleDealSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/deals`, { ...dealFormData, value: parseFloat(dealFormData.value) }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Deal created successfully');
      setShowDealModal(false);
      setDealFormData({ lead_id: '', title: '', value: '', stage: 'proposal', probability: 50, expected_close_date: '' });
      fetchData();
    } catch { toast.error('Failed to create deal'); }
  };

  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/leads/${leadId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      toast.success(`Lead moved to ${newStatus}`);
    } catch {
      toast.error('Failed to update lead status');
      fetchData();
    }
  };

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, stageId) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== stageId) {
      updateLeadStatus(draggedLead.id, stageId);
    }
    setDraggedLead(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const getLeadName = (id) => leads.find(l => l.id === id)?.name || 'Unknown';

  // KPI calculations
  const totalDealsValue = deals.reduce((s, d) => s + (d.value || 0), 0);
  const wonDeals = deals.filter(d => d.stage === 'closed-won');
  const wonValue = wonDeals.reduce((s, d) => s + (d.value || 0), 0);
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;
  const activeLeads = leads.filter(l => l.status !== 'closed-won' && l.status !== 'closed-lost').length;

  const getTabStyle = (tabId) => ({
    padding: '10px 18px', border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontWeight: 600, fontSize: '13px', transition: 'all 0.2s',
    background: activeView === tabId ? 'rgba(99,102,241,0.15)' : 'transparent',
    color: activeView === tabId ? '#818cf8' : 'rgba(255,255,255,0.5)',
  });

  const leadsByStage = (stageId) => leads.filter(l => (l.status || 'new') === stageId);

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="crm" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          {/* Header */}
          <div className="page-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 className="page-title" data-testid="crm-title">CRM Pipeline</h1>
                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px' }}>VA01</span>
              </div>
              <p className="page-subtitle">Manage leads, deals & sales pipeline</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLeadModal(true)} data-testid="add-lead-btn" className="btn-dark-primary">
                <Plus size={18} /> Add Lead
              </button>
              <button onClick={() => setShowDealModal(true)} data-testid="add-deal-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                <Plus size={18} /> Add Deal
              </button>
            </div>
          </div>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
            {[
              { label: 'Total Leads', value: leads.length, sub: `${activeLeads} active`, icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
              { label: 'Pipeline Value', value: `₹${(totalDealsValue / 100000).toFixed(1)}L`, sub: `${deals.length} deals`, icon: TrendingUp, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
              { label: 'Revenue Won', value: `₹${(wonValue / 100000).toFixed(1)}L`, sub: `${wonDeals.length} won`, icon: DollarSign, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
              { label: 'Win Rate', value: `${winRate}%`, sub: 'conversion', icon: Target, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={kpi.color} />
                    </div>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', margin: '0 0 2px' }}>{kpi.label}</p>
                  <p style={{ color: '#fff', fontSize: '22px', fontWeight: 800, margin: '0 0 2px' }}>{kpi.value}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>{kpi.sub}</p>
                </div>
              );
            })}
          </div>

          {/* View switcher */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
            <button style={getTabStyle('pipeline')} onClick={() => setActiveView('pipeline')}>🗂 Pipeline Board</button>
            <button style={getTabStyle('leads')} onClick={() => setActiveView('leads')}>👤 Leads List</button>
            <button style={getTabStyle('deals')} onClick={() => setActiveView('deals')}>💼 Deals Table</button>
          </div>

          {loading ? (
            <div className="dark-loading">Loading CRM data…</div>
          ) : (
            <div className="fade-in">
              {/* PIPELINE KANBAN VIEW */}
              {activeView === 'pipeline' && (
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px' }}>
                  {PIPELINE_STAGES.map(stage => {
                    const stageLeads = leadsByStage(stage.id);
                    const stageValue = deals.filter(d => leads.find(l => l.id === d.lead_id)?.status === stage.id)
                      .reduce((s, d) => s + (d.value || 0), 0);
                    return (
                      <div
                        key={stage.id}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage.id)}
                        style={{ minWidth: '220px', maxWidth: '220px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}
                      >
                        {/* Column header */}
                        <div style={{ padding: '12px 14px', background: stage.bg, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: stage.color }}>{stage.label}</span>
                            <span style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: '11px', fontWeight: 700, borderRadius: '10px', padding: '2px 7px' }}>{stageLeads.length}</span>
                          </div>
                          {stageValue > 0 && (
                            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>₹{(stageValue / 1000).toFixed(0)}K pipeline</p>
                          )}
                        </div>
                        {/* Cards */}
                        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '120px' }}>
                          {stageLeads.map(lead => (
                            <div
                              key={lead.id}
                              data-testid={`lead-row-${lead.id}`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, lead)}
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', cursor: 'grab', transition: 'all 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                              <p style={{ color: '#fff', fontSize: '13px', fontWeight: 700, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</p>
                              {lead.company && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                                  <Building size={11} color="rgba(255,255,255,0.3)" />
                                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.company}</span>
                                </div>
                              )}
                              {lead.email && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <Mail size={11} color="rgba(255,255,255,0.3)" />
                                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email}</span>
                                </div>
                              )}
                              {lead.source && (
                                <div style={{ marginTop: '8px' }}>
                                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99,102,241,0.12)', color: '#818cf8', fontWeight: 600 }}>{lead.source}</span>
                                </div>
                              )}
                              {/* Quick move */}
                              <div style={{ display: 'flex', gap: '4px', marginTop: '10px', flexWrap: 'wrap' }}>
                                {PIPELINE_STAGES.filter(s => s.id !== stage.id).slice(0, 2).map(s => (
                                  <button key={s.id} onClick={() => updateLeadStatus(lead.id, s.id)}
                                    style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontWeight: 600 }}>
                                    → {s.label.split(' ')[0]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          {stageLeads.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>
                              Drop leads here
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LEADS LIST VIEW */}
              {activeView === 'leads' && (
                <div>
                  {leads.length === 0 ? (
                    <div className="dark-empty">
                      <p style={{ marginBottom: '12px' }}>No leads found</p>
                      <button onClick={() => setShowLeadModal(true)} style={{ color: '#818cf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Add your first lead</button>
                    </div>
                  ) : (
                    <div className="dark-table-wrap fade-in">
                      <table>
                        <thead>
                          <tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Source</th><th>Stage</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                          {leads.map(lead => {
                            const stage = PIPELINE_STAGES.find(s => s.id === (lead.status || 'new'));
                            return (
                              <tr key={lead.id} data-testid={`lead-row-${lead.id}`}>
                                <td style={{ color: '#fff', fontWeight: 600 }}>{lead.name}</td>
                                <td>{lead.company || '—'}</td>
                                <td>{lead.email || '—'}</td>
                                <td>{lead.phone || '—'}</td>
                                <td>{lead.source || '—'}</td>
                                <td>
                                  <span style={{ background: stage?.bg || 'rgba(99,102,241,0.12)', color: stage?.color || '#818cf8', padding: '3px 10px', borderRadius: '50px', fontSize: '12px', fontWeight: 600 }}>
                                    {stage?.label || lead.status}
                                  </span>
                                </td>
                                <td>
                                  <select
                                    value={lead.status || 'new'}
                                    onChange={e => updateLeadStatus(lead.id, e.target.value)}
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                                  >
                                    {PIPELINE_STAGES.map(s => <option key={s.id} value={s.id} style={{ background: '#1e293b' }}>{s.label}</option>)}
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* DEALS TABLE VIEW */}
              {activeView === 'deals' && (
                <div>
                  {deals.length === 0 ? (
                    <div className="dark-empty">
                      <p style={{ marginBottom: '12px' }}>No deals found</p>
                      <button onClick={() => setShowDealModal(true)} style={{ color: '#818cf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Create your first deal</button>
                    </div>
                  ) : (
                    <div className="dark-table-wrap fade-in">
                      <table>
                        <thead>
                          <tr><th>Title</th><th>Lead</th><th>Value</th><th>Stage</th><th>Probability</th><th>Close Date</th></tr>
                        </thead>
                        <tbody>
                          {deals.map(deal => (
                            <tr key={deal.id} data-testid={`deal-row-${deal.id}`}>
                              <td style={{ color: '#fff', fontWeight: 600 }}>{deal.title}</td>
                              <td>{getLeadName(deal.lead_id)}</td>
                              <td style={{ color: '#34d399', fontWeight: 700 }}>₹{deal.value.toLocaleString('en-IN')}</td>
                              <td><span className="badge-blue" style={{ textTransform: 'capitalize' }}>{deal.stage}</span></td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '50px', height: '4px', maxWidth: '60px' }}>
                                    <div style={{ width: `${deal.probability}%`, background: deal.probability > 70 ? '#10b981' : deal.probability > 40 ? '#f59e0b' : '#ef4444', height: '100%', borderRadius: '50px' }} />
                                  </div>
                                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{deal.probability}%</span>
                                </div>
                              </td>
                              <td>{deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString('en-IN') : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Lead Modal */}
      {showLeadModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '480px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="add-lead-modal-title">Add New Lead</h2>
              <button onClick={() => setShowLeadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleLeadSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { field: 'name', label: 'Full Name *', type: 'text', testId: 'lead-name-input', required: true, placeholder: 'John Doe' },
                { field: 'email', label: 'Email', type: 'email', testId: 'lead-email-input', placeholder: 'john@company.com' },
                { field: 'phone', label: 'Phone', type: 'tel', testId: 'lead-phone-input', placeholder: '+91 98765 43210' },
                { field: 'company', label: 'Company', type: 'text', testId: 'lead-company-input', placeholder: 'Acme Corp' },
              ].map(({ field, label, type, testId, required, placeholder }) => (
                <div key={field}>
                  <label className="dark-label">{label}</label>
                  <input type={type} required={required} data-testid={testId} className="dark-input" placeholder={placeholder}
                    value={leadFormData[field]} onChange={e => setLeadFormData({ ...leadFormData, [field]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="dark-label">Source</label>
                <select className="dark-input" value={leadFormData.source} onChange={e => setLeadFormData({ ...leadFormData, source: e.target.value })}>
                  <option value="">Select source</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Email Campaign">Email Campaign</option>
                  <option value="Trade Show">Trade Show</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowLeadModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" data-testid="submit-lead-btn" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Add Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Deal Modal */}
      {showDealModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '480px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="add-deal-modal-title">Create Deal</h2>
              <button onClick={() => setShowDealModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleDealSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="dark-label">Lead *</label>
                <select required data-testid="deal-lead-select" className="dark-input"
                  value={dealFormData.lead_id} onChange={e => setDealFormData({ ...dealFormData, lead_id: e.target.value })}>
                  <option value="">Select lead</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name} {l.company ? `(${l.company})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="dark-label">Deal Title *</label>
                <input type="text" required data-testid="deal-title-input" className="dark-input" placeholder="e.g., Annual License Renewal"
                  value={dealFormData.title} onChange={e => setDealFormData({ ...dealFormData, title: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dark-label">Value (₹) *</label>
                  <input type="number" required data-testid="deal-value-input" min="0" step="0.01" className="dark-input" placeholder="0"
                    value={dealFormData.value} onChange={e => setDealFormData({ ...dealFormData, value: e.target.value })} />
                </div>
                <div>
                  <label className="dark-label">Stage *</label>
                  <select required data-testid="deal-stage-select" className="dark-input"
                    value={dealFormData.stage} onChange={e => setDealFormData({ ...dealFormData, stage: e.target.value })}>
                    {DEAL_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dark-label">Win Probability (%)</label>
                  <input type="number" data-testid="deal-probability-input" min="0" max="100" className="dark-input" placeholder="50"
                    value={dealFormData.probability} onChange={e => setDealFormData({ ...dealFormData, probability: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label className="dark-label">Expected Close Date</label>
                  <input type="date" data-testid="deal-close-date-input" className="dark-input"
                    value={dealFormData.expected_close_date} onChange={e => setDealFormData({ ...dealFormData, expected_close_date: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowDealModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" data-testid="submit-deal-btn" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Create Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;