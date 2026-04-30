import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Check, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeaveManagement = ({ user, onLogout, isSubComponent }) => {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({ employee_id: '', leave_type: 'casual', from_date: '', to_date: '', reason: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [leavesRes, empRes] = await Promise.all([
        axios.get(`${API}/leave-requests`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setLeaves(leavesRes.data);
      setEmployees(empRes.data);
    } catch { toast.error('Failed to fetch data'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/leave-requests`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Leave request submitted successfully');
      setShowModal(false);
      setFormData({ employee_id: '', leave_type: 'casual', from_date: '', to_date: '', reason: '' });
      fetchData();
    } catch { toast.error('Failed to submit leave request'); }
  };

  const handleStatusUpdate = async (leaveId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/leave-requests/${leaveId}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Leave ${status}`);
      fetchData();
    } catch { toast.error('Failed to update status'); }
  };

  const getEmployeeName = (id) => employees.find(e => e.id === id)?.name || 'Unknown';

  const statusBadge = (s) => {
    if (s === 'approved') return <span className="badge-green">{s}</span>;
    if (s === 'rejected') return <span className="badge-red">{s}</span>;
    return <span className="badge-amber">{s}</span>;
  };

  const content = (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title" data-testid="leave-title">Leave Management</h1>
          <p className="page-subtitle">Manage employee leave requests</p>
        </div>
        <button onClick={() => setShowModal(true)} data-testid="request-leave-btn" className="btn-dark-primary">
          <Plus size={18} /> Request Leave
        </button>
      </div>

      {loading ? (
        <div className="dark-loading">Loading leave requests…</div>
      ) : leaves.length === 0 ? (
        <div className="dark-empty">
          <p style={{ marginBottom: '12px' }}>No leave requests found</p>
          <button onClick={() => setShowModal(true)} style={{ color: 'var(--brand-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Submit a leave request</button>
        </div>
      ) : (
        <div className="dark-table-wrap fade-in">
          <table>
            <thead>
              <tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {leaves.map(leave => (
                <tr key={leave.id} data-testid={`leave-row-${leave.id}`}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{getEmployeeName(leave.employee_id)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{leave.leave_type}</td>
                  <td>{new Date(leave.from_date).toLocaleDateString('en-IN')}</td>
                  <td>{new Date(leave.to_date).toLocaleDateString('en-IN')}</td>
                  <td>{leave.reason}</td>
                  <td>{statusBadge(leave.status)}</td>
                  <td>
                    {leave.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleStatusUpdate(leave.id, 'approved')} data-testid={`approve-leave-${leave.id}`}
                          style={{ color: '#34d399', background: 'rgba(16,185,129,0.1)', border: 'none', borderRadius: '6px', padding: '5px', cursor: 'pointer' }} title="Approve">
                          <Check size={16} />
                        </button>
                        <button onClick={() => handleStatusUpdate(leave.id, 'rejected')} data-testid={`reject-leave-${leave.id}`}
                          style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', padding: '5px', cursor: 'pointer' }} title="Reject">
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '480px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="request-leave-modal-title">Request Leave</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Employee *</label>
                <select required data-testid="leave-employee-select" className="dark-input"
                  value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })}>
                  <option value="">Select employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="dark-label">Leave Type *</label>
                <select required data-testid="leave-type-select" className="dark-input"
                  value={formData.leave_type} onChange={e => setFormData({ ...formData, leave_type: e.target.value })}>
                  <option value="casual">Casual Leave (CL)</option>
                  <option value="earned">Earned Leave (EL)</option>
                  <option value="sick">Sick Leave (SL)</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                </select>
              </div>
              <div>
                <label className="dark-label">From Date *</label>
                <input type="date" required data-testid="leave-from-date-input" className="dark-input"
                  value={formData.from_date} onChange={e => setFormData({ ...formData, from_date: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">To Date *</label>
                <input type="date" required data-testid="leave-to-date-input" className="dark-input"
                  value={formData.to_date} onChange={e => setFormData({ ...formData, to_date: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Reason *</label>
                <textarea required data-testid="leave-reason-input" rows="3" className="dark-input"
                  value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" data-testid="submit-leave-btn" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  if (isSubComponent) {
    return content;
  }

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          {content}
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;