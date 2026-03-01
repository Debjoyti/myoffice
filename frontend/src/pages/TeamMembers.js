import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Mail, UserCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TeamMembers = ({ user, onLogout }) => {
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', role: 'employee' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [membersRes, invitesRes] = await Promise.all([
        axios.get(`${API}/team/members`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/team/invites`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setMembers(membersRes.data);
      setInvites(invitesRes.data);
    } catch { toast.error('Failed to fetch team data'); }
    setLoading(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/team/invite`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Invitation sent to ${formData.email}`);
      setShowModal(false);
      setFormData({ email: '', role: 'employee' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send invitation');
    }
  };

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="team" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
              <h1 className="page-title">Team Members</h1>
              <p className="page-subtitle">Invite and manage your team</p>
            </div>
            {user.role === 'admin' && (
              <button onClick={() => setShowModal(true)} className="btn-dark-primary">
                <Plus size={18} /> Invite Member
              </button>
            )}
          </div>

          {loading ? (
            <div className="dark-loading">Loading team data…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Active Members */}
              <div className="dark-card fade-in" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <h2 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: 0 }}>Active Members ({members.length})</h2>
                </div>
                {members.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>No active members</div>
                ) : members.map(member => (
                  <div key={member.id} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>{member.name}</p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>{member.email}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="badge-blue" style={{ textTransform: 'capitalize' }}>{member.role}</span>
                      {member.email_verified && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399' }}>
                          <UserCheck size={14} /><span style={{ fontSize: '12px', fontWeight: 500 }}>Verified</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pending Invitations */}
              {invites.filter(i => i.status === 'pending').length > 0 && (
                <div className="dark-card fade-in" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(245,158,11,0.06)' }}>
                    <h2 style={{ color: '#fff', fontSize: '15px', fontWeight: 600, margin: 0 }}>
                      Pending Invitations ({invites.filter(i => i.status === 'pending').length})
                    </h2>
                  </div>
                  {invites.filter(i => i.status === 'pending').map(invite => (
                    <div key={invite.id} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Mail size={18} color="#fbbf24" />
                        </div>
                        <div>
                          <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>{invite.email}</p>
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Invited {new Date(invite.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24' }}>
                        <Clock size={14} /><span style={{ fontSize: '13px', fontWeight: 500 }}>Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '440px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Invite Team Member</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleInvite} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Email Address *</label>
                <input type="email" required placeholder="colleague@company.com" className="dark-input"
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Role *</label>
                <select required className="dark-input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                  The invitation will be sent to this email with a secure link to join your organization.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembers;
