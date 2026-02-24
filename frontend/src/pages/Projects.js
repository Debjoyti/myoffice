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
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  });
  const [taskFormData, setTaskFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    due_date: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [projResponse, taskResponse, empResponse] = await Promise.all([
        axios.get(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setProjects(projResponse.data);
      setTasks(taskResponse.data);
      setEmployees(empResponse.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    }
    setLoading(false);
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/projects`, projectFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Project created successfully');
      setShowProjectModal(false);
      setProjectFormData({ name: '', description: '', start_date: '', end_date: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/tasks`, taskFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Task created successfully');
      setShowTaskModal(false);
      setTaskFormData({
        project_id: '',
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        due_date: '',
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleTaskStatusUpdate = async (taskId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/tasks/${taskId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Task status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const getProjectName = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : 'Unknown';
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find((e) => e.id === empId);
    return emp ? emp.name : 'Unassigned';
  };

  return (
    <div className="flex">
      <Sidebar
        user={user}
        onLogout={onLogout}
        activePage="projects"
        setActivePage={() => {}}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2" data-testid="projects-title">
                Projects & Tasks
              </h1>
              <p className="text-slate-600">Manage projects and track tasks</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowProjectModal(true)}
                data-testid="add-project-btn"
                className="btn-primary flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                <Plus size={20} />
                New Project
              </button>
              <button
                onClick={() => setShowTaskModal(true)}
                data-testid="add-task-btn"
                className="btn-primary flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                <Plus size={20} />
                New Task
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Projects</h2>
                {projects.length === 0 ? (
                  <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                    <p className="text-slate-600 mb-4">No projects found</p>
                    <button
                      onClick={() => setShowProjectModal(true)}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Create your first project
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        data-testid={`project-card-${project.id}`}
                        className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow"
                      >
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{project.name}</h3>
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{project.description || 'No description'}</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Start:</span>
                            <span className="font-medium">{new Date(project.start_date).toLocaleDateString('en-IN')}</span>
                          </div>
                          {project.end_date && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">End:</span>
                              <span className="font-medium">{new Date(project.end_date).toLocaleDateString('en-IN')}</span>
                            </div>
                          )}
                          <div>
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                project.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {project.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Tasks</h2>
                {tasks.length === 0 ? (
                  <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                    <p className="text-slate-600 mb-4">No tasks found</p>
                    <button
                      onClick={() => setShowTaskModal(true)}
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Create your first task
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="table-container overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Task</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Project</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Assigned To</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Priority</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {tasks.map((task) => (
                            <tr key={task.id} className="hover:bg-slate-50" data-testid={`task-row-${task.id}`}>
                              <td className="px-6 py-4">
                                <p className="text-slate-900 font-medium">{task.title}</p>
                                {task.due_date && (
                                  <p className="text-xs text-slate-500">Due: {new Date(task.due_date).toLocaleDateString('en-IN')}</p>
                                )}
                              </td>
                              <td className="px-6 py-4 text-slate-600">{getProjectName(task.project_id)}</td>
                              <td className="px-6 py-4 text-slate-600">{getEmployeeName(task.assigned_to)}</td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                    task.priority === 'high'
                                      ? 'bg-red-100 text-red-700'
                                      : task.priority === 'medium'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {task.priority}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <select
                                  value={task.status}
                                  onChange={(e) => handleTaskStatusUpdate(task.id, e.target.value)}
                                  data-testid={`task-status-${task.id}`}
                                  className="text-sm px-3 py-1 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                                >
                                  <option value="todo">To Do</option>
                                  <option value="in-progress">In Progress</option>
                                  <option value="done">Done</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 text-slate-600">-</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900" data-testid="add-project-modal-title">Create Project</h2>
              <button onClick={() => setShowProjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleProjectSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Project Name *</label>
                <input
                  type="text"
                  required
                  data-testid="project-name-input"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  value={projectFormData.name}
                  onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  data-testid="project-description-input"
                  rows="3"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  required
                  data-testid="project-start-date-input"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  value={projectFormData.start_date}
                  onChange={(e) => setProjectFormData({ ...projectFormData, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  data-testid="project-end-date-input"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  value={projectFormData.end_date}
                  onChange={(e) => setProjectFormData({ ...projectFormData, end_date: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-project-btn"
                  className="flex-1 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900" data-testid="add-task-modal-title">Create Task</h2>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleTaskSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Project *</label>
                <select
                  required
                  data-testid="task-project-select"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={taskFormData.project_id}
                  onChange={(e) => setTaskFormData({ ...taskFormData, project_id: e.target.value })}
                >
                  <option value="">Select project</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Task Title *</label>
                <input
                  type="text"
                  required
                  data-testid="task-title-input"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  data-testid="task-description-input"
                  rows="3"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assign To</label>
                <select
                  data-testid="task-assignee-select"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={taskFormData.assigned_to}
                  onChange={(e) => setTaskFormData({ ...taskFormData, assigned_to: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Priority *</label>
                <select
                  required
                  data-testid="task-priority-select"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={taskFormData.priority}
                  onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                <input
                  type="date"
                  data-testid="task-due-date-input"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={taskFormData.due_date}
                  onChange={(e) => setTaskFormData({ ...taskFormData, due_date: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-task-btn"
                  className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;