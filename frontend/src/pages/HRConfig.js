import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HRConfig = ({ user, onLogout }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    field_name: '', field_type: 'text', is_required: false, options: '', applies_to: 'employee',
  });

  useEffect(() => { fetchFields(); }, []);

  const fetchFields = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/hr-fields`, { headers: { Authorization: `Bearer ${token}` } });
      setFields(response.data);
    } catch { toast.error('Failed to fetch HR fields'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const fieldData = { ...formData, options: formData.options ? formData.options.split(',').map(o => o.trim()) : null };
      await axios.post(`${API}/hr-fields`, fieldData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('HR field added successfully');
      setShowModal(false);
      setFormData({ field_name: '', field_type: 'text', is_required: false, options: '', applies_to: 'employee' });
      fetchFields();
    } catch { toast.error('Failed to add HR field'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this field?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/hr-fields/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('HR field deleted successfully');
      fetchFields();
    } catch { toast.error('Failed to delete HR field'); }
  };

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="hr-config" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
              <h1 className="page-title">HR Configuration</h1>
              <p className="page-subtitle">Customize HR fields for employees, leaves, and more</p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-dark-primary">
              <Plus size={18} /> Add Field
            </button>
          </div>

          {loading ? (
            <div className="dark-loading">Loading HR fields…</div>
          ) : fields.length === 0 ? (
            <div className="dark-empty">
              <p style={{ marginBottom: '12px' }}>No custom HR fields found</p>
              <button onClick={() => setShowModal(true)} style={{ color: '#818cf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Add your first custom field</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
              {fields.map(field => (
                <div key={field.id} className="dark-card fade-in" style={{ padding: '20px', transition: 'all 0.25s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>{field.field_name}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0, textTransform: 'capitalize' }}>{field.field_type}</p>
                    </div>
                    <button onClick={() => handleDelete(field.id)}
                      style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 600 }}>Applies to:</span>
                      <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', textTransform: 'capitalize' }}>{field.applies_to}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 600 }}>Required:</span>
                      <span className={field.is_required ? 'badge-green' : 'badge-amber'} style={{ fontSize: '11px' }}>{field.is_required ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '480px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Add Custom Field</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Field Name *</label>
                <input type="text" required className="dark-input" placeholder="e.g., Employee ID, Blood Group"
                  value={formData.field_name} onChange={e => setFormData({ ...formData, field_name: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Field Type *</label>
                <select required className="dark-input" value={formData.field_type} onChange={e => setFormData({ ...formData, field_type: e.target.value })}>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="date">Date</option>
                  <option value="select">Dropdown</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>
              {formData.field_type === 'select' && (
                <div>
                  <label className="dark-label">Options (comma separated)</label>
                  <input type="text" className="dark-input" placeholder="A+, B+, O+, AB+"
                    value={formData.options} onChange={e => setFormData({ ...formData, options: e.target.value })} />
                </div>
              )}
              <div>
                <label className="dark-label">Applies To *</label>
                <select required className="dark-input" value={formData.applies_to} onChange={e => setFormData({ ...formData, applies_to: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="leave">Leave</option>
                  <option value="attendance">Attendance</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="required-field" style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }}
                  checked={formData.is_required} onChange={e => setFormData({ ...formData, is_required: e.target.checked })} />
                <label htmlFor="required-field" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer' }}>Required field</label>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Add Field</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRConfig;
