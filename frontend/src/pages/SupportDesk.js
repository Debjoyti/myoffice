import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, MessageSquare, User, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SupportDesk = ({ user, onLogout }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [formData, setFormData] = useState({ 
    subject: '', description: '', priority: 'medium', contact_email: '' 
  });

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
      toast.success('Support ticket created');
      setShowModal(false);
      setFormData({ subject: '', description: '', priority: 'medium', contact_email: '' });
      fetchData();
    } catch { toast.error('Failed to create ticket'); }
  };

  const priorityIcon = (p) => {
    if (p === 'high') return <AlertTriangle size={14} color="#f87171" />;
    return <Clock size={14} color="rgba(255,255,255,0.4)" />;
  };

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="support" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
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

          {loading ? (
            <div className="dark-loading">Loading tickets...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }} className="fade-in">
              {tickets.map(t => (
                <div key={t.id} className="dark-card" style={{ padding: '24px', borderLeft: `4px solid ${t.priority === 'high' ? '#f87171' : '#6366f1'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>{t.id}</span>
                    <span className={t.status === 'open' ? 'badge-blue' : 'badge-green'}>{t.status}</span>
                  </div>
                  <h3 style={{ color: '#fff', fontSize: '17px', margin: '0 0 8px', fontWeight: 700 }}>{t.subject}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.5, margin: '0 0 20px', height: '40px', overflow: 'hidden' }}>
                    {t.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} color="rgba(255,255,255,0.4)" />
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{t.contact_email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {priorityIcon(t.priority)}
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{t.priority}</span>
                    </div>
                  </div>
                </div>
              ))}
              {tickets.length === 0 && (
                <div className="dark-empty" style={{ gridColumn: '1/-1' }}>
                  No open tickets. It's a quiet day!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '500px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', margin: 0 }}>Create Ticket</h2>
              <button onClick={() => setShowModal(false)} className="icon-btn"><X /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Subject</label>
                <input 
                  type="text" className="dark-input" placeholder="What's the issue?" required 
                  value={formData.subject} 
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dark-label">Contact Email</label>
                  <input 
                    type="email" className="dark-input" placeholder="customer@example.com" required 
                    value={formData.contact_email} 
                    onChange={e => setFormData({...formData, contact_email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="dark-label">Priority</label>
                  <select 
                    className="dark-input"
                    value={formData.priority} 
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="dark-label">Description</label>
                <textarea 
                  className="dark-input" rows="4" placeholder="Detailed description of the issue..." required
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Create Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportDesk;
