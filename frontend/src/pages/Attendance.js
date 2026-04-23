import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Attendance = ({ user, onLogout, isSubComponent }) => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '', date: new Date().toISOString().split('T')[0], check_in: '', check_out: '', status: 'present',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [attRes, empRes] = await Promise.all([
        axios.get(`${API}/attendance`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setAttendance(attRes.data);
      setEmployees(empRes.data);
    } catch { toast.error('Failed to fetch data'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/attendance`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Attendance marked successfully');
      setShowModal(false);
      setFormData({ employee_id: '', date: new Date().toISOString().split('T')[0], check_in: '', check_out: '', status: 'present' });
      fetchData();
    } catch { toast.error('Failed to mark attendance'); }
  };

  const getEmployeeName = (id) => employees.find(e => e.id === id)?.name || 'Unknown';

  const statusBadge = (s) => {
    if (s === 'present') return <span className="badge-green">{s}</span>;
    if (s === 'absent') return <span className="badge-red">{s}</span>;
    return <span className="badge-amber">{s}</span>;
  };

  const content = (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title" data-testid="attendance-title">Attendance</h1>
          <p className="page-subtitle">Track employee attendance records</p>
        </div>
        <button onClick={() => setShowModal(true)} data-testid="mark-attendance-btn" className="btn-dark-primary">
          <Plus size={18} /> Mark Attendance
        </button>
      </div>

      {loading ? (
        <div className="dark-loading">Loading attendance…</div>
      ) : attendance.length === 0 ? (
        <div className="dark-empty">
          <p style={{ marginBottom: '12px' }}>No attendance records found</p>
          <button onClick={() => setShowModal(true)} style={{ color: '#818cf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Mark attendance</button>
        </div>
      ) : (
        <div className="dark-table-wrap fade-in">
          <table>
            <thead>
              <tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Overtime (Hrs)</th></tr>
            </thead>
            <tbody>
              {attendance.map(att => (
                <tr key={att.id} data-testid={`attendance-row-${att.id}`}>
                  <td style={{ color: '#fff', fontWeight: 600 }}>{getEmployeeName(att.employee_id)}</td>
                  <td>{new Date(att.date).toLocaleDateString('en-IN')}</td>
                  <td>{att.check_in || '—'}</td>
                  <td>{att.check_out || '—'}</td>
                  <td>{statusBadge(att.status)}</td>
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
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="mark-attendance-modal-title">Mark Attendance</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Employee *</label>
                <select required data-testid="attendance-employee-select" className="dark-input"
                  value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })}>
                  <option value="">Select employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="dark-label">Date *</label>
                <input type="date" required data-testid="attendance-date-input" className="dark-input"
                  value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Check In</label>
                <input type="time" data-testid="attendance-checkin-input" className="dark-input"
                  value={formData.check_in} onChange={e => setFormData({ ...formData, check_in: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Check Out</label>
                <input type="time" data-testid="attendance-checkout-input" className="dark-input"
                  value={formData.check_out} onChange={e => setFormData({ ...formData, check_out: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Status *</label>
                <select required data-testid="attendance-status-select" className="dark-input"
                  value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half-day">Half Day</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" data-testid="submit-attendance-btn" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Mark Attendance</button>
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
      <Sidebar user={user} onLogout={onLogout} activePage="attendance" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          {content}
        </div>
      </div>
    </div>
  );
};

export default Attendance;