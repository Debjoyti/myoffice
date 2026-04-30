import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Camera, ShieldAlert, Activity } from 'lucide-react';
import { toast } from 'sonner';
import FaceVerification from '../components/FaceVerification';
import useActivityMonitor from '../hooks/useActivityMonitor';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Attendance = ({ user, onLogout, isSubComponent }) => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // HR View Toggles
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'sessions', 'anomalies'
  const [sessions, setSessions] = useState([]);
  const [anomalies, setAnomalies] = useState([]);

  // AI Attendance State
  const [activeSession, setActiveSession] = useState(null);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceAction, setFaceAction] = useState('start'); // 'start' or 'end'

  // Activity Monitor
  const { idleTime, isActive } = useActivityMonitor(600); // 10 minutes

  const [formData, setFormData] = useState({
    employee_id: '', date: new Date().toISOString().split('T')[0], check_in: '', check_out: '', status: 'present',
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); fetchActiveSession(); }, []);

  // Heartbeat mechanism
  useEffect(() => {
    let heartbeatInterval;
    if (activeSession && activeSession.status === 'active') {
      heartbeatInterval = setInterval(async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.post(`${API}/attendance/session/heartbeat`, {
            session_id: activeSession.id,
            employee_id: user?.employee_id || user?.id,
            idle_time_seconds: idleTime,
            ip_address: '192.168.1.1' // Simulated, in production fetch from context/API
          }, { headers: { Authorization: `Bearer ${token}` } });

          setActiveSession(prev => ({ ...prev, trust_score: res.data.trust_score, status: res.data.session_status }));
        } catch (error) {
          console.error("Heartbeat failed", error);
        }
      }, 60000); // Every minute
    }
    return () => clearInterval(heartbeatInterval);
  }, [activeSession, idleTime, user]);

  const fetchActiveSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/attendance/sessions?employee_id=${user?.employee_id || user?.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentActive = res.data.find(s => s.status === 'active' || s.status === 'suspicious');
      if (currentActive) {
        setActiveSession(currentActive);
      }
    } catch (e) {
      console.log("No active AI session found or error fetching");
    }
  };

  const handleFaceVerified = async (verificationData) => {
    try {
      const token = localStorage.getItem('token');
      const empId = user?.employee_id || user?.id;

      if (faceAction === 'start') {
        const res = await axios.post(`${API}/attendance/session/start`, {
          employee_id: empId,
          face_verification_id: verificationData.id,
          ip_address: '192.168.1.1',
          user_agent: navigator.userAgent,
          device_fingerprint: 'device_fp_mock'
        }, { headers: { Authorization: `Bearer ${token}` } });

        setActiveSession(res.data);
        toast.success('Session started successfully. Continuous tracking active.');
      } else if (faceAction === 'end') {
        const res = await axios.post(`${API}/attendance/session/end`, {
          session_id: activeSession.id,
          employee_id: empId,
          face_verification_id: verificationData.id
        }, { headers: { Authorization: `Bearer ${token}` } });

        setActiveSession(null);
        toast.success('Session ended successfully.');
      }

      setShowFaceModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Session action failed');
      setShowFaceModal(false);
    }
  };


  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [attRes, empRes, sessionRes, anomalyRes] = await Promise.all([
        axios.get(`${API}/attendance`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/attendance/sessions`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/attendance/anomalies`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAttendance(attRes.data);
      setEmployees(empRes.data);
      setSessions(sessionRes.data);
      setAnomalies(anomalyRes.data);
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" data-testid="attendance-title">Attendance</h1>
          <p className="page-subtitle">Track employee attendance records</p>
          {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'hr') && (
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              <button onClick={() => setActiveTab('attendance')} style={{ background: 'none', border: 'none', color: activeTab === 'attendance' ? '#fff' : '#9ca3af', borderBottom: activeTab === 'attendance' ? '2px solid var(--brand-primary)' : 'none', paddingBottom: '4px', cursor: 'pointer' }}>Daily Records</button>
              <button onClick={() => setActiveTab('sessions')} style={{ background: 'none', border: 'none', color: activeTab === 'sessions' ? '#fff' : '#9ca3af', borderBottom: activeTab === 'sessions' ? '2px solid var(--brand-primary)' : 'none', paddingBottom: '4px', cursor: 'pointer' }}>AI Sessions</button>
              <button onClick={() => setActiveTab('anomalies')} style={{ background: 'none', border: 'none', color: activeTab === 'anomalies' ? '#fff' : '#9ca3af', borderBottom: activeTab === 'anomalies' ? '2px solid var(--brand-primary)' : 'none', paddingBottom: '4px', cursor: 'pointer' }}>
                Anomaly Flags {anomalies.length > 0 && <span style={{ background: '#ef4444', color: 'var(--text-primary)', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>{anomalies.length}</span>}
              </button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {activeSession ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '14px' }}>
                <span style={{ color: activeSession.status === 'suspicious' ? '#ef4444' : '#4ade80', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {activeSession.status === 'suspicious' ? <ShieldAlert size={16} /> : <Activity size={16} />}
                  Session: {activeSession.status.toUpperCase()}
                </span>
                <span style={{ color: '#9ca3af' }}>Trust Score: {activeSession.trust_score}% | Idle: {idleTime}s</span>
              </div>
              <button onClick={() => { setFaceAction('end'); setShowFaceModal(true); }} className="btn-dark-cancel" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                End Session
              </button>
            </div>
          ) : (
            <button onClick={() => { setFaceAction('start'); setShowFaceModal(true); }} className="btn-dark-primary" style={{ background: '#10b981', borderColor: '#10b981' }}>
              <Camera size={18} /> Start Smart Session
            </button>
          )}

          <button onClick={() => setShowModal(true)} data-testid="mark-attendance-btn" className="btn-dark-primary">
            <Plus size={18} /> Mark Manual
          </button>
        </div>
      </div>

      {loading ? (
        <div className="dark-loading">Loading attendance…</div>
      ) : activeTab === 'attendance' ? (
        attendance.length === 0 ? (
          <div className="dark-empty">
            <p style={{ marginBottom: '12px' }}>No attendance records found</p>
            <button onClick={() => setShowModal(true)} style={{ color: 'var(--brand-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Mark attendance</button>
          </div>
        ) : (
          <div className="dark-table-wrap fade-in">
            <table>
              <thead>
                <tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></tr>
              </thead>
              <tbody>
                {attendance.map(att => (
                  <tr key={att.id} data-testid={`attendance-row-${att.id}`}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{getEmployeeName(att.employee_id)}</td>
                    <td>{new Date(att.date).toLocaleDateString('en-IN')}</td>
                    <td>{att.check_in || '—'}</td>
                    <td>{att.check_out || '—'}</td>
                    <td>{statusBadge(att.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : activeTab === 'sessions' ? (
        sessions.length === 0 ? (
          <div className="dark-empty">No AI sessions recorded</div>
        ) : (
          <div className="dark-table-wrap fade-in">
            <table>
              <thead>
                <tr><th>Employee</th><th>Start Time</th><th>Last Heartbeat</th><th>End Time</th><th>Status</th><th>Trust Score</th></tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{getEmployeeName(s.employee_id)}</td>
                    <td>{new Date(s.start_time).toLocaleString('en-IN')}</td>
                    <td>{s.last_heartbeat ? new Date(s.last_heartbeat).toLocaleString('en-IN') : '—'}</td>
                    <td>{s.end_time ? new Date(s.end_time).toLocaleString('en-IN') : '—'}</td>
                    <td>{s.status === 'active' ? <span className="badge-green">Active</span> : s.status === 'suspicious' ? <span className="badge-red">Suspicious</span> : <span className="badge-amber">Ended</span>}</td>
                    <td>
                      <span style={{ color: s.trust_score < 70 ? '#ef4444' : s.trust_score < 90 ? '#f59e0b' : '#4ade80', fontWeight: 'bold' }}>
                        {s.trust_score}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : anomalies.length === 0 ? (
        <div className="dark-empty">No anomalies detected. System is secure.</div>
      ) : (
        <div className="dark-table-wrap fade-in">
          <table>
            <thead>
              <tr><th>Employee</th><th>Timestamp</th><th>Reason</th><th>Severity</th></tr>
            </thead>
            <tbody>
              {anomalies.map(a => (
                <tr key={a.id}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{getEmployeeName(a.employee_id)}</td>
                  <td>{new Date(a.timestamp).toLocaleString('en-IN')}</td>
                  <td>
                    {a.reason === 'ip_change' ? 'IP Changed mid-session' : a.reason === 'long_idle' ? 'Extended Idle Period' : a.reason}
                  </td>
                  <td>
                    {a.severity === 'high' ? <span className="badge-red">High</span> : a.severity === 'medium' ? <span className="badge-amber">Medium</span> : <span className="badge-green">Low</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showFaceModal && (
        <div className="dark-modal-overlay" style={{ zIndex: 1000 }}>
          <div className="dark-modal" style={{ maxWidth: '400px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, margin: 0 }}>
                {faceAction === 'start' ? 'Start AI Session' : 'End AI Session'}
              </h2>
              <button onClick={() => setShowFaceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
            </div>
            <div style={{ padding: '24px' }}>
              <FaceVerification onVerified={handleFaceVerified} />
            </div>
          </div>
        </div>
      )}
      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '480px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="mark-attendance-modal-title">Mark Attendance</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
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
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          {content}
        </div>
      </div>
    </div>
  );
};

export default Attendance;