import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Mail, UserCheck, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TeamMembers = ({ user, onLogout }) => {
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'employee',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [membersRes, invitesRes] = await Promise.all([
        axios.get(`${API}/team/members`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/team/invites`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setMembers(membersRes.data);
      setInvites(invitesRes.data);
    } catch (error) {
      toast.error('Failed to fetch team data');
    }
    setLoading(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/team/invite`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Invitation sent to ${formData.email}`);
      setShowModal(false);
      setFormData({ email: '', role: 'employee' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send invitation');
    }
  };

  return (
    <div className="flex">
      <Sidebar user={user} onLogout={onLogout} activePage="team" setActivePage={() => {}} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex-1 overflow-auto bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Team Members</h1>
              <p className="text-slate-600">Invite and manage your team</p>
            </div>
            {user.role === 'admin' && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition-all"
              >
                <Plus size={20} />
                Invite Member
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* Active Members */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-lg font-semibold text-slate-900">Active Members ({members.length})</h2>
                </div>
                <div className="divide-y divide-slate-200">
                  {members.map((member) => (
                    <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">{member.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{member.name}</p>
                          <p className="text-sm text-slate-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                          {member.role}
                        </span>
                        {member.email_verified && (
                          <div className="flex items-center gap-1 text-green-600">
                            <UserCheck size={16} />
                            <span className="text-xs font-medium">Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Invitations */}
              {invites.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 bg-amber-50">
                    <h2 className="text-lg font-semibold text-slate-900">Pending Invitations ({invites.length})</h2>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {invites.filter(inv => inv.status === 'pending').map((invite) => (
                      <div key={invite.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <Mail size={20} className="text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{invite.email}</p>
                            <p className="text-sm text-slate-500">Invited {new Date(invite.created_at).toLocaleDateString('en-IN')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-amber-600" />
                          <span className="text-sm text-amber-600 font-medium">Pending</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-overlay">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl modal-content">
            <div className="px-6 py-5 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Invite Team Member</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  required
                  className="input-modern"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="colleague@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Role *</label>
                <select
                  required
                  className="input-modern"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">The invitation will be sent to this email with a secure link to join your organization.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-sm"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMembers;
