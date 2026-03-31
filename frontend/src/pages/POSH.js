import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_CONFIG = {
  "Under Review": { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  "Investigating": { color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  "Action Taken": { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  "Closed": { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' }
};

const POSH = ({ user, isSubComponent }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    incident_date: '',
    accused_name: '',
    description: ''
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'hr';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/posh-complaints`, { headers: { Authorization: `Bearer ${token}` } });
      setComplaints(res.data);
    } catch { toast.error('Failed to fetch data'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/posh-complaints`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Confidential report submitted successfully.');
      setShowModal(false);
      setFormData({ incident_date: '', accused_name: '', description: '' });
      fetchData();
    } catch { toast.error('Failed to submit report'); }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/posh-complaints/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Status updated');
      fetchData();
    } catch { toast.error('Failed to update status'); }
  };

  const content = (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={24} color="#f43f5e" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#fff' }}>POSH Compliance & Reporting</h2>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '4px 0 0' }}>
            Internal Complaints Committee (ICC) secure reporting. All reports are strictly confidential.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-dark-primary" style={{ background: '#f43f5e', border: 'none', color: '#fff' }}>
          File Confidential Report
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Reports', val: complaints.length, c: '#6366f1' },
          { label: 'Under Review', val: complaints.filter(c => c.status === 'Under Review').length, c: '#f59e0b' },
          { label: 'Investigating', val: complaints.filter(c => c.status === 'Investigating').length, c: '#6366f1' },
          { label: 'Resolved/Closed', val: complaints.filter(c => ['Action Taken', 'Closed'].includes(c.status)).length, c: '#10b981' },
        ].map((k, i) => (
          <div key={i} className="dark-card" style={{ padding: '20px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '0 0 8px', fontWeight: 600 }}>{k.label}</p>
            <p style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: k.c }}>{k.val}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="dark-loading">Loading records securely...</div>
      ) : complaints.length === 0 ? (
        <div className="dark-empty">No records found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {complaints.map(c => (
            <div key={c.id} className="dark-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                    {c.id}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                    Reported on: {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <span style={{ 
                  fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px',
                  color: STATUS_CONFIG[c.status]?.color || '#fff',
                  background: STATUS_CONFIG[c.status]?.bg || 'transparent'
                }}>
                  {c.status}
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div>
                  <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', fontWeight: 700 }}>Accused / Subject</p>
                  <p style={{ fontSize: '14px', color: '#fff', margin: 0, fontWeight: 600 }}>{c.accused_name}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', fontWeight: 700 }}>Incident Description & Details</p>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5 }}>{c.description}</p>
                </div>
              </div>

              {isAdmin && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>ICC Action:</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {Object.keys(STATUS_CONFIG).map(status => (
                      <button 
                        key={status}
                        onClick={() => updateStatus(c.id, status)}
                        disabled={c.status === status}
                        style={{ 
                          padding: '6px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)',
                          background: c.status === status ? 'rgba(255,255,255,0.1)' : 'transparent',
                          color: c.status === status ? '#fff' : 'rgba(255,255,255,0.5)',
                          fontSize: '11px', fontWeight: 600, cursor: c.status === status ? 'default' : 'pointer'
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '600px' }}>
            <div className="dark-modal-header" style={{ borderBottom: '1px solid rgba(244,63,94,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield color="#f43f5e" size={20} />
                <h2 style={{ color: '#fff', margin: 0, fontSize: '18px' }}>File ICC Report (Confidential)</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="icon-btn" style={{ color: 'rgba(255,255,255,0.4)' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(244,63,94,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(244,63,94,0.2)' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#fda4af', lineHeight: 1.5 }}>
                  <strong>Notice:</strong> This report is securely routed directly to the Internal Complaints Committee (ICC) and HR Director. Your confidentiality is protected by company policy and law.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="dark-label">Date of Incident *</label>
                  <input type="date" className="dark-input" required 
                    value={formData.incident_date} onChange={e => setFormData({...formData, incident_date: e.target.value})} />
                </div>
                <div>
                  <label className="dark-label">Name of Accused *</label>
                  <input type="text" className="dark-input" placeholder="Name and exact department/designation" required 
                    value={formData.accused_name} onChange={e => setFormData({...formData, accused_name: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="dark-label">Detailed Description *</label>
                <textarea className="dark-input" rows="6" placeholder="Please describe what happened in as much detail as possible, including specific locations, times, and witnesses if any." required 
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center', background: '#f43f5e', border: 'none' }}>Submit Securely</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (isSubComponent) return content;
  
  return (
    <div className="page-root">
      <div className="page-content"><div className="page-inner">{content}</div></div>
    </div>
  );
};

export default POSH;
