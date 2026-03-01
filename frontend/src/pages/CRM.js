import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CRM = ({ user, onLogout }) => {
  const [leads, setLeads] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    } catch { toast.error('Failed to fetch data'); }
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

  const getLeadName = (id) => leads.find(l => l.id === id)?.name || 'Unknown';

  const leadStatusBadge = (s) => {
    if (s === 'new') return <span className="badge-blue">{s}</span>;
    if (s === 'contacted') return <span className="badge-amber">{s}</span>;
    return <span className="badge-green">{s}</span>;
  };

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="crm" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
              <h1 className="page-title" data-testid="crm-title">CRM</h1>
              <p className="page-subtitle">Manage leads and deals</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLeadModal(true)} data-testid="add-lead-btn" className="btn-dark-primary">
                <Plus size={18} /> Add Lead
              </button>
              <button onClick={() => setShowDealModal(true)} data-testid="add-deal-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.15)'; }}
              >
                <Plus size={18} /> Add Deal
              </button>
            </div>
          </div>

          {loading ? (
            <div className="dark-loading">Loading CRM data…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Leads */}
              <div>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 14px' }}>Leads</h2>
                {leads.length === 0 ? (
                  <div className="dark-empty">
                    <p style={{ marginBottom: '12px' }}>No leads found</p>
                    <button onClick={() => setShowLeadModal(true)} style={{ color: '#818cf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Add your first lead</button>
                  </div>
                ) : (
                  <div className="dark-table-wrap fade-in">
                    <table>
                      <thead>
                        <tr><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Source</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {leads.map(lead => (
                          <tr key={lead.id} data-testid={`lead-row-${lead.id}`}>
                            <td style={{ color: '#fff', fontWeight: 600 }}>{lead.name}</td>
                            <td>{lead.email || '—'}</td>
                            <td>{lead.phone || '—'}</td>
                            <td>{lead.company || '—'}</td>
                            <td>{lead.source || '—'}</td>
                            <td>{leadStatusBadge(lead.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Deals */}
              <div>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 14px' }}>Deals</h2>
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
                            <td style={{ color: '#34d399', fontWeight: 600 }}>₹{deal.value.toLocaleString('en-IN')}</td>
                            <td><span className="badge-blue" style={{ textTransform: 'capitalize' }}>{deal.stage}</span></td>
                            <td>{deal.probability}%</td>
                            <td>{deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString('en-IN') : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Lead Modal */}
      {showLeadModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '480px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="add-lead-modal-title">Add Lead</h2>
              <button onClick={() => setShowLeadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleLeadSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { field: 'name', label: 'Name *', type: 'text', testId: 'lead-name-input', required: true },
                { field: 'email', label: 'Email', type: 'email', testId: 'lead-email-input' },
                { field: 'phone', label: 'Phone', type: 'tel', testId: 'lead-phone-input' },
                { field: 'company', label: 'Company', type: 'text', testId: 'lead-company-input' },
              ].map(({ field, label, type, testId, required }) => (
                <div key={field}>
                  <label className="dark-label">{label}</label>
                  <input type={type} required={required} data-testid={testId} className="dark-input"
                    value={leadFormData[field]} onChange={e => setLeadFormData({ ...leadFormData, [field]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="dark-label">Source</label>
                <input type="text" data-testid="lead-source-input" placeholder="e.g., Website, Referral" className="dark-input"
                  value={leadFormData.source} onChange={e => setLeadFormData({ ...leadFormData, source: e.target.value })} />
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
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="dark-label">Deal Title *</label>
                <input type="text" required data-testid="deal-title-input" className="dark-input"
                  value={dealFormData.title} onChange={e => setDealFormData({ ...dealFormData, title: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Value (₹) *</label>
                <input type="number" required data-testid="deal-value-input" min="0" step="0.01" className="dark-input"
                  value={dealFormData.value} onChange={e => setDealFormData({ ...dealFormData, value: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Stage *</label>
                <select required data-testid="deal-stage-select" className="dark-input"
                  value={dealFormData.stage} onChange={e => setDealFormData({ ...dealFormData, stage: e.target.value })}>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closed-won">Closed Won</option>
                  <option value="closed-lost">Closed Lost</option>
                </select>
              </div>
              <div>
                <label className="dark-label">Probability (%)</label>
                <input type="number" data-testid="deal-probability-input" min="0" max="100" className="dark-input"
                  value={dealFormData.probability} onChange={e => setDealFormData({ ...dealFormData, probability: parseInt(e.target.value) })} />
              </div>
              <div>
                <label className="dark-label">Expected Close Date</label>
                <input type="date" data-testid="deal-close-date-input" className="dark-input"
                  value={dealFormData.expected_close_date} onChange={e => setDealFormData({ ...dealFormData, expected_close_date: e.target.value })} />
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