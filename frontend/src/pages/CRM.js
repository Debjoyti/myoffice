import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, TrendingUp, DollarSign, Users, Target, Phone, Mail, Building, Sparkles, ChevronRight, BarChart2, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_CRM } from '../utils/demoData';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PIPELINE_STAGES = [
  { id: 'new',         label: 'New Lead',     color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  { id: 'contacted',   label: 'Contacted',    color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
  { id: 'qualified',   label: 'Qualified',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { id: 'proposal',    label: 'Proposal',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { id: 'negotiation', label: 'Negotiation',  color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  { id: 'closed-won',  label: 'Won ✓',        color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { id: 'closed-lost', label: 'Lost ✗',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
];

const DEAL_STAGES = [
  { id: 'proposal',    label: 'Proposal' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'closed-won',  label: 'Closed Won' },
  { id: 'closed-lost', label: 'Closed Lost' },
];

// AI Lead Scoring engine — rule-based intelligence
const computeLeadScore = (lead, deals) => {
  let score = 30;
  if (lead.email) score += 10;
  if (lead.phone) score += 8;
  if (lead.company) score += 12;
  if (lead.source === 'Referral') score += 20;
  if (lead.source === 'Website') score += 12;
  if (lead.source === 'LinkedIn') score += 10;
  const stageScores = { 'new': 0, 'contacted': 15, 'qualified': 25, 'proposal': 35, 'negotiation': 45, 'closed-won': 60, 'closed-lost': -20 };
  score += stageScores[lead.status] || 0;
  const hasDeal = deals.some(d => d.lead_id === lead.id);
  if (hasDeal) score += 15;
  const daysSince = Math.floor((new Date() - new Date(lead.created_at)) / (1000 * 60 * 60 * 24));
  if (daysSince > 30) score -= 15;
  else if (daysSince > 14) score -= 5;
  return Math.max(0, Math.min(100, score));
};

const getLeadHeat = (score) => {
  if (score >= 70) return { label: '🔥 Hot', class: 'badge-hot', color: '#f87171' };
  if (score >= 45) return { label: '🌡 Warm', class: 'badge-warm', color: '#fbbf24' };
  return { label: '❄️ Cold', class: 'badge-cold', color: '#a5b4fc' };
};

const getNextAction = (lead, score) => {
  if (lead.status === 'new') return '📧 Send introduction email';
  if (lead.status === 'contacted') return '📞 Schedule discovery call';
  if (lead.status === 'qualified') return '📋 Prepare proposal document';
  if (lead.status === 'proposal') return '🤝 Follow up on proposal';
  if (lead.status === 'negotiation') return '💼 Close with executive sign-off';
  if (score < 40) return '♻️ Re-engage with fresh content';
  return '📊 Monitor engagement signals';
};

const CRM = ({ user, onLogout }) => {
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('pipeline');
  const [draggedLead, setDraggedLead] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
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
      setLeads((leadsRes.data && leadsRes.data.length > 0) ? leadsRes.data : MOCK_CRM.leads);
      setDeals((dealsRes.data && dealsRes.data.length > 0) ? dealsRes.data : MOCK_CRM.deals);
    } catch { 
      setLeads(MOCK_CRM.leads);
      setDeals(MOCK_CRM.deals);
    }
    setLoading(false);
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/leads`, leadFormData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Lead added to pipeline');
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
    } catch { toast.error('Failed to update'); fetchData(); }
  };

  const handleDragStart = (e, lead) => { setDraggedLead(lead); e.dataTransfer.effectAllowed = 'move'; };
  const handleDrop = (e, stageId) => {
    e.preventDefault();
    if (draggedLead && draggedLead.status !== stageId) updateLeadStatus(draggedLead.id, stageId);
    setDraggedLead(null);
  };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const getLeadName = (id) => leads.find(l => l.id === id)?.name || 'Unknown';

  // KPIs
  const totalDealsValue = deals.reduce((s, d) => s + (d.value || 0), 0);
  const wonDeals = deals.filter(d => d.stage === 'closed-won');
  const wonValue = wonDeals.reduce((s, d) => s + (d.value || 0), 0);
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;
  const activeLeads = leads.filter(l => l.status !== 'closed-won' && l.status !== 'closed-lost').length;

  // AI Scored leads
  const scoredLeads = useMemo(() =>
    leads.map(l => ({ ...l, aiScore: computeLeadScore(l, deals) })).sort((a, b) => b.aiScore - a.aiScore),
    [leads, deals]
  );

  const hotLeadsCount = scoredLeads.filter(l => l.aiScore >= 70).length;
  const forecastedRevenue = deals
    .filter(d => d.stage !== 'closed-lost')
    .reduce((s, d) => s + (d.value || 0) * ((d.probability || 50) / 100), 0);

  const leadsByStage = (stageId) => scoredLeads.filter(l => (l.status || 'new') === stageId);

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span>BizOps</span><span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">CRM Pipeline</span>
          </div>

          {/* Header */}
          <div className="page-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 className="page-title" data-testid="crm-title">CRM Pipeline</h1>
                <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace' }}>VA01</span>
                <span className="ai-badge"><Sparkles size={9} /> AI Scoring</span>
              </div>
              <p className="page-subtitle">Manage leads, deals & AI-powered sales pipeline · {hotLeadsCount} hot leads detected</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLeadModal(true)} data-testid="add-lead-btn" className="btn-dark-primary">
                <Plus size={16} /> Add Lead
              </button>
              <button onClick={() => setShowDealModal(true)} data-testid="add-deal-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', borderRadius: '10px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                <Plus size={16} /> Add Deal
              </button>
            </div>
          </div>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }} className="stagger">
            {[
              { label: 'Total Leads',      value: leads.length,           sub: `${activeLeads} active`,      icon: Users,    color: '#6366f1' },
              { label: 'Hot Leads 🔥',     value: hotLeadsCount,          sub: 'AI scored ≥70',              icon: Brain,    color: '#f43f5e' },
              { label: 'Pipeline Value',   value: `₹${(totalDealsValue/100000).toFixed(1)}L`, sub: `${deals.length} deals`, icon: TrendingUp, color: '#22d3ee' },
              { label: 'Revenue Won',      value: `₹${(wonValue/100000).toFixed(1)}L`,        sub: `${wonDeals.length} closed`, icon: DollarSign, color: '#10b981' },
              { label: 'Forecasted Rev.', value: `₹${(forecastedRevenue/100000).toFixed(1)}L`, sub: `${winRate}% win rate`,   icon: BarChart2, color: '#f59e0b' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} className="kpi-card fade-in">
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${kpi.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                    <Icon size={16} color={kpi.color} />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', margin: '0 0 2px', fontWeight: 600 }}>{kpi.label}</p>
                  <p style={{ color: '#fff', fontSize: '20px', fontWeight: 900, margin: '0 0 2px', letterSpacing: '-0.02em' }}>{kpi.value}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10.5px', margin: 0 }}>{kpi.sub}</p>
                </div>
              );
            })}
          </div>

          {/* View Tabs */}
          <div className="tab-bar" style={{ marginBottom: '20px' }}>
            {[
              { id: 'pipeline', label: '🗂 Pipeline' },
              { id: 'leads',    label: '👤 Leads + AI' },
              { id: 'deals',    label: '💼 Deals' },
            ].map(v => (
              <button key={v.id} className={`tab-btn ${activeView === v.id ? 'active' : ''}`} onClick={() => setActiveView(v.id)}>
                {v.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="dark-loading"><div className="dark-loading-spinner" /><span>Loading CRM data…</span></div>
          ) : (
            <div className="fade-in">
              {/* PIPELINE KANBAN */}
              {activeView === 'pipeline' && (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '16px' }}>
                  {PIPELINE_STAGES.map(stage => {
                    const stageLeads = leadsByStage(stage.id);
                    const stageValue = deals.filter(d => leads.find(l => l.id === d.lead_id)?.status === stage.id).reduce((s, d) => s + (d.value || 0), 0);
                    return (
                      <div key={stage.id} onDragOver={handleDragOver} onDrop={e => handleDrop(e, stage.id)}
                        style={{ minWidth: '210px', maxWidth: '210px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ padding: '12px 14px', background: stage.bg, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: stage.color }}>{stage.label}</span>
                            <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '10px', fontWeight: 800, borderRadius: '99px', padding: '2px 7px' }}>{stageLeads.length}</span>
                          </div>
                          {stageValue > 0 && <p style={{ margin: '3px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>₹{(stageValue / 1000).toFixed(0)}K pipeline</p>}
                        </div>
                        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '7px', minHeight: '120px' }}>
                          {stageLeads.map(lead => {
                            const heat = getLeadHeat(lead.aiScore);
                            return (
                              <div key={lead.id} data-testid={`lead-row-${lead.id}`} draggable onDragStart={e => handleDragStart(e, lead)}
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '11px', cursor: 'grab', transition: 'all 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                  <p style={{ color: '#fff', fontSize: '12.5px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{lead.name}</p>
                                  <span className={heat.class} style={{ fontSize: '9px', padding: '1px 5px', marginLeft: '4px', flexShrink: 0 }}>{lead.aiScore}</span>
                                </div>
                                {lead.company && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}><Building size={10} color="rgba(255,255,255,0.25)" /><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.company}</span></div>}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '7px' }}>
                                  <span style={{ fontSize: '9px', color: heat.color, fontWeight: 700 }}>{heat.label}</span>
                                </div>
                                <p style={{ fontSize: '9.5px', color: 'rgba(99,102,241,0.8)', margin: 0, background: 'rgba(99,102,241,0.08)', padding: '3px 7px', borderRadius: '5px', lineHeight: 1.3 }}>
                                  {getNextAction(lead, lead.aiScore)}
                                </p>
                                <div style={{ display: 'flex', gap: '3px', marginTop: '7px', flexWrap: 'wrap' }}>
                                  {PIPELINE_STAGES.filter(s => s.id !== stage.id).slice(0, 2).map(s => (
                                    <button key={s.id} onClick={() => updateLeadStatus(lead.id, s.id)} style={{ fontSize: '8.5px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontWeight: 600 }}>→ {s.label.split(' ')[0]}</button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          {stageLeads.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.12)', fontSize: '11px' }}>Drop leads here</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* LEADS + AI VIEW */}
              {activeView === 'leads' && (
                <div className="dark-table-wrap">
                  <table>
                    <thead>
                      <tr><th>Name</th><th>Company</th><th>Contact</th><th>Source</th><th>AI Score</th><th>Heat</th><th>Next Action</th><th>Stage</th></tr>
                    </thead>
                    <tbody>
                      {scoredLeads.map(lead => {
                        const stage = PIPELINE_STAGES.find(s => s.id === (lead.status || 'new'));
                        const heat = getLeadHeat(lead.aiScore);
                        return (
                          <tr key={lead.id} data-testid={`lead-row-${lead.id}`}>
                            <td style={{ color: '#fff', fontWeight: 700 }}>{lead.name}</td>
                            <td>{lead.company || '—'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {lead.email && <a href={`mailto:${lead.email}`} style={{ color: '#818cf8', fontSize: '12px' }}><Mail size={13} /></a>}
                                {lead.phone && <a href={`tel:${lead.phone}`} style={{ color: '#34d399', fontSize: '12px' }}><Phone size={13} /></a>}
                              </div>
                            </td>
                            <td><span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontWeight: 600 }}>{lead.source || '—'}</span></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="progress-bar" style={{ maxWidth: '60px' }}>
                                  <div className="progress-fill" style={{ width: `${lead.aiScore}%`, background: lead.aiScore >= 70 ? '#f43f5e' : lead.aiScore >= 45 ? '#f59e0b' : '#6366f1' }} />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: lead.aiScore >= 70 ? '#f87171' : lead.aiScore >= 45 ? '#fbbf24' : '#a5b4fc' }}>{lead.aiScore}</span>
                              </div>
                            </td>
                            <td><span className={heat.class}>{heat.label}</span></td>
                            <td><p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11.5px', margin: 0 }}>{getNextAction(lead, lead.aiScore)}</p></td>
                            <td>
                              <select value={lead.status || 'new'} onChange={e => updateLeadStatus(lead.id, e.target.value)}
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', color: '#fff', padding: '4px 8px', fontSize: '11.5px', cursor: 'pointer' }}>
                                {PIPELINE_STAGES.map(s => <option key={s.id} value={s.id} style={{ background: '#1e293b' }}>{s.label}</option>)}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {leads.length === 0 && <div className="dark-empty">No leads yet. <button onClick={() => setShowLeadModal(true)} style={{ color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Add your first lead →</button></div>}
                </div>
              )}

              {/* DEALS VIEW */}
              {activeView === 'deals' && (
                <div className="dark-table-wrap">
                  <table>
                    <thead>
                      <tr><th>Title</th><th>Lead</th><th>Value</th><th>Stage</th><th>Win Probability</th><th>Close Date</th></tr>
                    </thead>
                    <tbody>
                      {deals.map(deal => (
                        <tr key={deal.id} data-testid={`deal-row-${deal.id}`}>
                          <td style={{ color: '#fff', fontWeight: 700 }}>{deal.title}</td>
                          <td>{getLeadName(deal.lead_id)}</td>
                          <td style={{ color: '#34d399', fontWeight: 700 }}>₹{deal.value.toLocaleString('en-IN')}</td>
                          <td><span className="badge-blue" style={{ textTransform: 'capitalize' }}>{deal.stage}</span></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className="progress-bar" style={{ maxWidth: '70px' }}>
                                <div className="progress-fill" style={{ width: `${deal.probability}%`, background: deal.probability > 70 ? '#10b981' : deal.probability > 40 ? '#f59e0b' : '#ef4444' }} />
                              </div>
                              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{deal.probability}%</span>
                            </div>
                          </td>
                          <td>{deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString('en-IN') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {deals.length === 0 && <div className="dark-empty">No deals yet. <button onClick={() => setShowDealModal(true)} style={{ color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Create your first deal →</button></div>}
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
              <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, margin: 0 }} data-testid="add-lead-modal-title">Add New Lead</h2>
              <button onClick={() => setShowLeadModal(false)} className="icon-btn"><X size={16} /></button>
            </div>
            <form onSubmit={handleLeadSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { field: 'name',    label: 'Full Name *',  type: 'text',  testId: 'lead-name-input',    required: true, placeholder: 'John Doe' },
                { field: 'email',   label: 'Email',        type: 'email', testId: 'lead-email-input',   placeholder: 'john@company.com' },
                { field: 'phone',   label: 'Phone',        type: 'tel',   testId: 'lead-phone-input',   placeholder: '+91 98765 43210' },
                { field: 'company', label: 'Company',      type: 'text',  testId: 'lead-company-input', placeholder: 'Acme Corp' },
              ].map(({ field, label, type, testId, required, placeholder }) => (
                <div key={field}>
                  <label className="dark-label">{label}</label>
                  <input type={type} required={required} data-testid={testId} className="dark-input" placeholder={placeholder}
                    value={leadFormData[field]} onChange={e => setLeadFormData({ ...leadFormData, [field]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="dark-label">Lead Source</label>
                <select className="dark-input" value={leadFormData.source} onChange={e => setLeadFormData({ ...leadFormData, source: e.target.value })}>
                  <option value="">Select source</option>
                  {['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Email Campaign', 'Trade Show', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Sparkles size={12} color="#818cf8" /><span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8' }}>AI Score Preview</span></div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11.5px', margin: 0 }}>
                  {leadFormData.source === 'Referral' ? '🔥 Referral leads score highest — expect 80+ AI score' :
                   leadFormData.company ? '🌡 Company field boosts lead score significantly' :
                   '❄️ Add contact details and source to improve AI score'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
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
              <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, margin: 0 }} data-testid="add-deal-modal-title">Create Deal</h2>
              <button onClick={() => setShowDealModal(false)} className="icon-btn"><X size={16} /></button>
            </div>
            <form onSubmit={handleDealSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="dark-label">Lead *</label>
                <select required data-testid="deal-lead-select" className="dark-input" value={dealFormData.lead_id} onChange={e => setDealFormData({ ...dealFormData, lead_id: e.target.value })}>
                  <option value="">Select lead</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name} {l.company ? `(${l.company})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="dark-label">Deal Title *</label>
                <input type="text" required data-testid="deal-title-input" className="dark-input" placeholder="e.g., Annual License Renewal" value={dealFormData.title} onChange={e => setDealFormData({ ...dealFormData, title: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dark-label">Value (₹) *</label>
                  <input type="number" required data-testid="deal-value-input" min="0" step="0.01" className="dark-input" placeholder="0" value={dealFormData.value} onChange={e => setDealFormData({ ...dealFormData, value: e.target.value })} />
                </div>
                <div>
                  <label className="dark-label">Stage *</label>
                  <select required data-testid="deal-stage-select" className="dark-input" value={dealFormData.stage} onChange={e => setDealFormData({ ...dealFormData, stage: e.target.value })}>
                    {DEAL_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dark-label">Win Probability (%)</label>
                  <input type="number" data-testid="deal-probability-input" min="0" max="100" className="dark-input" placeholder="50" value={dealFormData.probability} onChange={e => setDealFormData({ ...dealFormData, probability: parseInt(e.target.value) })} />
                </div>
                <div>
                  <label className="dark-label">Expected Close Date</label>
                  <input type="date" data-testid="deal-close-date-input" className="dark-input" value={dealFormData.expected_close_date} onChange={e => setDealFormData({ ...dealFormData, expected_close_date: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
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