import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Clock, Calendar, CheckCircle, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Timesheets = ({ user, onLogout }) => {
  const [timesheets, setTimesheets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [formData, setFormData] = useState({ 
    project_id: '', task_id: '', hours: '', date: new Date().toISOString().split('T')[0], description: '' 
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [tsRes, projRes, taskRes] = await Promise.all([
        axios.get(`${API}/timesheets`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setTimesheets(tsRes.data);
      setProjects(projRes.data);
      setTasks(taskRes.data);
    } catch { toast.error('Failed to fetch timesheets'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/timesheets`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Time entry logged');
      setShowModal(false);
      fetchData();
    } catch { toast.error('Failed to log time'); }
  };

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || 'Unknown';
  const getTaskName = (id) => tasks.find(t => t.id === id)?.title || 'Unknown';

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="timesheets" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 className="page-title">Timesheets</h1>
                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px' }}>CAT2</span>
              </div>
              <p className="page-subtitle">Track time spent on tasks and projects</p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-dark-primary">
              <Plus size={18} /> Log Time
            </button>
          </div>

          {loading ? (
            <div className="dark-loading">Loading timesheets...</div>
          ) : (
            <div className="dark-table-wrap fade-in">
              <table>
                <thead>
                  <tr><th>Date</th><th>Project</th><th>Task</th><th>Description</th><th>Hours</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {timesheets.map(ts => (
                    <tr key={ts.id}>
                      <td style={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(ts.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{getProjectName(ts.project_id)}</td>
                      <td>{getTaskName(ts.task_id)}</td>
                      <td style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ts.description || '—'}
                      </td>
                      <td style={{ fontWeight: 700, color: '#818cf8' }}>{ts.hours}h</td>
                      <td>
                        <span className="badge-blue">{ts.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {timesheets.length === 0 && (
                <div className="dark-empty">No time entries yet. Click "Log Time" to add your first entry.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Log Time Modal */}
      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '500px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', margin: 0 }}>Log Time</h2>
              <button onClick={() => setShowModal(false)} className="icon-btn"><X /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dark-label">Date</label>
                  <input 
                    type="date" className="dark-input" required 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="dark-label">Hours</label>
                  <input 
                    type="number" step="0.5" className="dark-input" placeholder="0.0" required 
                    value={formData.hours} 
                    onChange={e => setFormData({...formData, hours: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="dark-label">Project</label>
                <select 
                  className="dark-input" 
                  required 
                  value={formData.project_id} 
                  onChange={e => setFormData({...formData, project_id: e.target.value})}
                >
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="dark-label">Task</label>
                <select 
                  className="dark-input" 
                  required 
                  value={formData.task_id} 
                  onChange={e => setFormData({...formData, task_id: e.target.value})}
                >
                  <option value="">Select task</option>
                  {tasks.filter(t => t.project_id === formData.project_id).map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="dark-label">Description</label>
                <textarea 
                  className="dark-input" rows="3" placeholder="What did you work on?"
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Submit Logging</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timesheets;
