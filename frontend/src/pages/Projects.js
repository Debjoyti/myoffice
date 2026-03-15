import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Projects = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projectFormData, setProjectFormData] = useState({ name: '', description: '', start_date: '', end_date: '' });
  const [taskFormData, setTaskFormData] = useState({ project_id: '', title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [projRes, taskRes, empRes] = await Promise.all([
        axios.get(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setProjects(projRes.data);
      setTasks(taskRes.data);
      setEmployees(empRes.data);
    } catch { toast.error('Failed to fetch data'); }
    setLoading(false);
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/projects`, projectFormData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Project created successfully');
      setShowProjectModal(false);
      setProjectFormData({ name: '', description: '', start_date: '', end_date: '' });
      fetchData();
    } catch { toast.error('Failed to create project'); }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/tasks`, taskFormData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Task created successfully');
      setShowTaskModal(false);
      setTaskFormData({ project_id: '', title: '', description: '', assigned_to: '', priority: 'medium', due_date: '' });
      fetchData();
    } catch { toast.error('Failed to create task'); }
  };

  const handleTaskStatusUpdate = async (taskId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/tasks/${taskId}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Task status updated');
      fetchData();
    } catch { toast.error('Failed to update task status'); }
  };

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || 'Unknown';
  const getEmployeeName = (id) => employees.find(e => e.id === id)?.name || 'Unassigned';

  const priorityBadge = (p) => {
    if (p === 'high') return <span className="badge-red">{p}</span>;
    if (p === 'medium') return <span className="badge-amber">{p}</span>;
    return <span className="badge-blue">{p}</span>;
  };

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="projects" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h1 className="page-title" data-testid="projects-title">Projects &amp; Tasks</h1>
                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>CJ20N</span>
              </div>
              <p className="page-subtitle">Manage projects and track tasks</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowProjectModal(true)} data-testid="add-project-btn" className="btn-dark-primary">
                <Plus size={18} /> New Project
              </button>
              <button onClick={() => setShowTaskModal(true)} data-testid="add-task-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.25)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.15)'; }}
              >
                <Plus size={18} /> New Task
              </button>
            </div>
          </div>

          {loading ? (
            <div className="dark-loading">Loading projects…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Projects grid */}
              <div>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 14px' }}>Projects</h2>
                {projects.length === 0 ? (
                  <div className="dark-empty">
                    <p style={{ marginBottom: '12px' }}>No projects found</p>
                    <button onClick={() => setShowProjectModal(true)} style={{ color: '#818cf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Create your first project</button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                    {projects.map(project => (
                      <div key={project.id} data-testid={`project-card-${project.id}`} className="dark-card fade-in"
                        style={{ padding: '20px', transition: 'all 0.25s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 6px' }}>{project.name}</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 14px', lineHeight: 1.5 }}>{project.description || 'No description'}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'rgba(255,255,255,0.35)' }}>Start:</span>
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(project.start_date).toLocaleDateString('en-IN')}</span>
                          </div>
                          {project.end_date && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'rgba(255,255,255,0.35)' }}>End:</span>
                              <span style={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(project.end_date).toLocaleDateString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop: '12px' }}>
                          <span className={project.status === 'active' ? 'badge-green' : 'badge-amber'}>{project.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks table */}
              <div>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 14px' }}>Tasks</h2>
                {tasks.length === 0 ? (
                  <div className="dark-empty">
                    <p style={{ marginBottom: '12px' }}>No tasks found</p>
                    <button onClick={() => setShowTaskModal(true)} style={{ color: '#818cf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Create your first task</button>
                  </div>
                ) : (
                  <div className="dark-table-wrap fade-in">
                    <table>
                      <thead>
                        <tr><th>Task</th><th>Project</th><th>Assigned To</th><th>Priority</th><th>Status</th><th></th></tr>
                      </thead>
                      <tbody>
                        {tasks.map(task => (
                          <tr key={task.id} data-testid={`task-row-${task.id}`}>
                            <td>
                              <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>{task.title}</p>
                              {task.due_date && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', margin: 0 }}>Due: {new Date(task.due_date).toLocaleDateString('en-IN')}</p>}
                            </td>
                            <td>{getProjectName(task.project_id)}</td>
                            <td>{getEmployeeName(task.assigned_to)}</td>
                            <td>{priorityBadge(task.priority)}</td>
                            <td>
                              <select value={task.status} onChange={e => handleTaskStatusUpdate(task.id, e.target.value)}
                                data-testid={`task-status-${task.id}`} className="dark-input" style={{ width: 'auto', fontSize: '12px', padding: '5px 10px' }}>
                                <option value="todo">To Do</option>
                                <option value="in-progress">In Progress</option>
                                <option value="done">Done</option>
                              </select>
                            </td>
                            <td>—</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {showProjectModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '480px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="add-project-modal-title">Create Project</h2>
              <button onClick={() => setShowProjectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleProjectSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="dark-label">Project Name *</label>
                <input type="text" required data-testid="project-name-input" className="dark-input"
                  value={projectFormData.name} onChange={e => setProjectFormData({ ...projectFormData, name: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Description</label>
                <textarea data-testid="project-description-input" rows="3" className="dark-input"
                  value={projectFormData.description} onChange={e => setProjectFormData({ ...projectFormData, description: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Start Date *</label>
                <input type="date" required data-testid="project-start-date-input" className="dark-input"
                  value={projectFormData.start_date} onChange={e => setProjectFormData({ ...projectFormData, start_date: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">End Date</label>
                <input type="date" data-testid="project-end-date-input" className="dark-input"
                  value={projectFormData.end_date} onChange={e => setProjectFormData({ ...projectFormData, end_date: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowProjectModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" data-testid="submit-project-btn" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showTaskModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '480px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="add-task-modal-title">Create Task</h2>
              <button onClick={() => setShowTaskModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleTaskSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="dark-label">Project *</label>
                <select required data-testid="task-project-select" className="dark-input"
                  value={taskFormData.project_id} onChange={e => setTaskFormData({ ...taskFormData, project_id: e.target.value })}>
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="dark-label">Task Title *</label>
                <input type="text" required data-testid="task-title-input" className="dark-input"
                  value={taskFormData.title} onChange={e => setTaskFormData({ ...taskFormData, title: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Description</label>
                <textarea data-testid="task-description-input" rows="3" className="dark-input"
                  value={taskFormData.description} onChange={e => setTaskFormData({ ...taskFormData, description: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Assign To</label>
                <select data-testid="task-assignee-select" className="dark-input"
                  value={taskFormData.assigned_to} onChange={e => setTaskFormData({ ...taskFormData, assigned_to: e.target.value })}>
                  <option value="">Unassigned</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="dark-label">Priority *</label>
                <select required data-testid="task-priority-select" className="dark-input"
                  value={taskFormData.priority} onChange={e => setTaskFormData({ ...taskFormData, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="dark-label">Due Date</label>
                <input type="date" data-testid="task-due-date-input" className="dark-input"
                  value={taskFormData.due_date} onChange={e => setTaskFormData({ ...taskFormData, due_date: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" data-testid="submit-task-btn" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;