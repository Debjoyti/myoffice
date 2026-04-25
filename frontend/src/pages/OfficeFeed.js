import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Megaphone, Plus, X, User, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_ANNOUNCEMENTS } from '../utils/demoData';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OfficeFeed = ({ user, onLogout }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', content: '', priority: 'normal' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/announcements`, { headers: { Authorization: `Bearer ${token}` } });
      setAnnouncements((res.data && res.data.length > 0) ? res.data : MOCK_ANNOUNCEMENTS);
    } catch { 
      setAnnouncements(MOCK_ANNOUNCEMENTS);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/announcements`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Announcement posted');
      setShowModal(false);
      setFormData({ title: '', content: '', priority: 'normal' });
      fetchData();
    } catch { toast.error('Failed to post announcement'); }
  };

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 className="page-title">Office Feed</h1>
                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(236,72,153,0.15)', color: '#ec4899', padding: '2px 8px', borderRadius: '4px' }}>Z-FEED</span>
              </div>
              <p className="page-subtitle">Internal announcements and updates</p>
            </div>
            {user?.role === 'admin' || user?.role === 'superadmin' ? (
              <button onClick={() => setShowModal(true)} className="btn-dark-primary">
                <Plus size={18} /> Announcements
              </button>
            ) : null}
          </div>

          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {loading ? (
              <div className="dark-loading">Gathering updates...</div>
            ) : (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {announcements.map(item => (
                  <div key={item.id} className="dark-card" style={{ padding: '24px', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={20} color="rgba(255,255,255,0.4)" />
                      </div>
                      <div>
                        <h4 style={{ color: '#fff', margin: 0, fontSize: '15px' }}>{item.author_name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                            {item.priority === 'urgent' && <span className="badge-red">Urgent</span>}
                            {item.priority === 'high' && <span className="badge-blue" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>High Priority</span>}
                        </div>
                      </div>
                    </div>
                    <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 10px', fontWeight: 700 }}>{item.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.content}</p>
                    
                    <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>Like</span>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>Comment</span>
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="dark-empty">No announcements yet. All quiet at the office.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Announcement Modal */}
      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '600px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', margin: 0 }}>New Announcement</h2>
              <button onClick={() => setShowModal(false)} className="icon-btn"><X /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Headline / Title</label>
                <input 
                  type="text" className="dark-input" placeholder="e.g. Office Party this Friday!" required 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="dark-label">Priority Level</label>
                <select 
                  className="dark-input" 
                  value={formData.priority} 
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="dark-label">Message Content</label>
                <textarea 
                  className="dark-input" rows="6" placeholder="Share the details with the team..." required
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Post Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeFeed;
