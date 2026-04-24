import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Home, Calendar, Clock, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WFHRequests = ({ user, isSubComponent }) => {
  const [requests, setRequests] = useState([// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'manager';

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [// eslint-disable-next-line react-hooks/exhaustive-deps
]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/wfh-requests`, { headers: { Authorization: `Bearer ${token}` } });
      
      if (!isAdmin) {
        setRequests(res.data.filter(r => r.employee_id === user?.id));
      } else {
        setRequests(res.data);
      }
    } catch { toast.error('Failed to fetch WFH requests'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/wfh-requests`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('WFH Request submitted');
      setShowModal(false);
      setFormData({ start_date: '', end_date: '', reason: '' });
      fetchData();
    } catch { toast.error('Failed to submit WFH request'); }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/wfh-requests/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Request ${status}`);
      fetchData();
    } catch { toast.error('Failed to update status'); }
  };

  const myPending = requests.filter(r => r.employee_id === user?.id && r.status === 'pending').length;
  const myApproved = requests.filter(r => r.employee_id === user?.id && r.status === 'approved').length;
  const teamPending = isAdmin ? requests.filter(r => r.status === 'pending').length : 0;

  const content = (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Home size={24} color="#06b6d4" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#fff' }}>Work From Home</h2>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '4px 0 0' }}>Request and manage remote work days</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-dark-primary" style={{ background: '#06b6d4', border: 'none', color: '#fff' }}>
          Apply for WFH
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="dark-card" style={{ padding: '20px', borderLeft: '3px solid #f59e0b' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '0 0 8px', fontWeight: 600 }}>My Pending Requests</p>
          <p style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#f59e0b' }}>{myPending}</p>
        </div>
        <div className="dark-card" style={{ padding: '20px', borderLeft: '3px solid #10b981' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '0 0 8px', fontWeight: 600 }}>My Approved WFH</p>
          <p style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#10b981' }}>{myApproved}</p>
        </div>
        {isAdmin && (
          <div className="dark-card" style={{ padding: '20px', borderLeft: '3px solid #6366f1', background: 'rgba(99,102,241,0.05)' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '0 0 8px', fontWeight: 600 }}>Team Approvals Pending</p>
            <p style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#818cf8' }}>{teamPending}</p>
          </div>
        )}
      </div>

      <div className="dark-table-wrap">
        <table style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              <th>Request ID</th>
              {isAdmin && <th>Employee Name</th>}
              <th>Period</th>
              <th>Total Days</th>
              <th>Status</th>
              {isAdmin && <th>Manager Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No WFH requests found.</td></tr>
            ) : (
              requests.map(r => {
                const start = new Date(r.start_date);
                const end = new Date(r.end_date);
                const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
                
                return (
                  <tr key={r.id}>
                    <td><span style={{ fontFamily: 'monospace', color: '#818cf8' }}>{r.id.split('-')[1]}</span></td>
                    {isAdmin && <td style={{ fontWeight: 600, color: '#fff' }}>{r.employee_name}</td>}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="rgba(255,255,255,0.3)" />
                        {start.toLocaleDateString()} to {end.toLocaleDateString()}
                      </div>
                    </td>
                    <td>{days} day{days > 1 ? 's' : ''}</td>
                    <td>
                      <span className={r.status === 'approved' ? 'badge-green' : r.status === 'rejected' ? 'badge-red' : 'badge-amber'}>
                        {r.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        {r.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => updateStatus(r.id, 'approved')} style={{ padding: '4px 12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Approve</button>
                            <button onClick={() => updateStatus(r.id, 'rejected')} style={{ padding: '4px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Reject</button>
                          </div>
                        ) : <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Actioned</span>}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '500px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', margin: 0 }}>Apply for Work From Home</h2>
              <button onClick={() => setShowModal(false)} className="icon-btn" style={{ color: 'rgba(255,255,255,0.4)' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="dark-label">Start Date *</label>
                  <input type="date" className="dark-input" required 
                    value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div>
                  <label className="dark-label">End Date *</label>
                  <input type="date" className="dark-input" required 
                    value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="dark-label">Reason / Work Plan *</label>
                <textarea className="dark-input" rows="4" placeholder="Brief reason or daily work plan while WFH..." required 
                  value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center', background: '#06b6d4', border: 'none' }}>Submit Request</button>
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

export default WFHRequests;
