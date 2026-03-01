import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Employees = ({ user, onLogout }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', department: '',
    designation: '', date_of_joining: '', pan_number: '', aadhaar_number: '', address: '',
  });

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } });
      setEmployees(response.data);
    } catch { toast.error('Failed to fetch employees'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/employees`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Employee added successfully');
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', department: '', designation: '', date_of_joining: '', pan_number: '', aadhaar_number: '', address: '' });
      fetchEmployees();
    } catch { toast.error('Failed to add employee'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/employees/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Employee deleted successfully');
      fetchEmployees();
    } catch { toast.error('Failed to delete employee'); }
  };

  const inp = (field, label, type = 'text', testId, placeholder) => (
    <div>
      <label className="dark-label">{label}</label>
      <input type={type} data-testid={testId} placeholder={placeholder} required={['name', 'email', 'phone', 'department', 'designation', 'date_of_joining'].includes(field)}
        className="dark-input"
        value={formData[field]}
        onChange={e => setFormData({ ...formData, [field]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="employees" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
              <h1 className="page-title" data-testid="employees-title">Employees</h1>
              <p className="page-subtitle">Manage your team members</p>
            </div>
            <button onClick={() => setShowModal(true)} data-testid="add-employee-btn" className="btn-dark-primary">
              <Plus size={18} /> Add Employee
            </button>
          </div>

          {loading ? (
            <div className="dark-loading">Loading employees…</div>
          ) : employees.length === 0 ? (
            <div className="dark-empty">
              <p style={{ marginBottom: '12px' }}>No employees found</p>
              <button onClick={() => setShowModal(true)} style={{ color: '#818cf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Add your first employee</button>
            </div>
          ) : (
            <div className="dark-table-wrap fade-in">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Department</th><th>Designation</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} data-testid={`employee-row-${emp.id}`}>
                      <td style={{ color: '#fff', fontWeight: 600 }}>{emp.name}</td>
                      <td>{emp.email}</td>
                      <td>{emp.department}</td>
                      <td>{emp.designation}</td>
                      <td>
                        <span className={emp.status === 'active' ? 'badge-green' : 'badge-amber'}>{emp.status}</span>
                      </td>
                      <td>
                        <button onClick={() => handleDelete(emp.id)} data-testid={`delete-employee-${emp.id}`}
                          style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '640px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="add-employee-modal-title">Add Employee</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px' }}>
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {inp('name', 'Name *', 'text', 'employee-name-input')}
              {inp('email', 'Email *', 'email', 'employee-email-input')}
              {inp('phone', 'Phone *', 'tel', 'employee-phone-input')}
              {inp('department', 'Department *', 'text', 'employee-department-input')}
              {inp('designation', 'Designation *', 'text', 'employee-designation-input')}
              {inp('date_of_joining', 'Date of Joining *', 'date', 'employee-doj-input')}
              {inp('pan_number', 'PAN Number', 'text', 'employee-pan-input', 'ABCDE1234F')}
              {inp('aadhaar_number', 'Aadhaar Number', 'text', 'employee-aadhaar-input', '1234 5678 9012')}
              <div style={{ gridColumn: '1/-1' }}>
                <label className="dark-label">Address</label>
                <textarea data-testid="employee-address-input" rows="3" className="dark-input"
                  value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" data-testid="submit-employee-btn" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;