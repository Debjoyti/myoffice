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
    field_name: '',
    field_type: 'text',
    is_required: false,
    options: '',
    applies_to: 'employee',
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/hr-fields`, { headers: { Authorization: `Bearer ${token}` } });
      setFields(response.data);
    } catch (error) {
      toast.error('Failed to fetch HR fields');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const fieldData = {
        ...formData,
        options: formData.options ? formData.options.split(',').map(o => o.trim()) : null,
      };
      await axios.post(`${API}/hr-fields`, fieldData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('HR field added successfully');
      setShowModal(false);
      setFormData({ field_name: '', field_type: 'text', is_required: false, options: '', applies_to: 'employee' });
      fetchFields();
    } catch (error) {
      toast.error('Failed to add HR field');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this field?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/hr-fields/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('HR field deleted successfully');
      fetchFields();
    } catch (error) {
      toast.error('Failed to delete HR field');
    }
  };

  return (
    <div className="flex">
      <Sidebar user={user} onLogout={onLogout} activePage="hr-config" setActivePage={() => {}} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-cyan-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">HR Configuration</h1>
              <p className="text-slate-600">Customize HR fields for employees, leaves, and more</p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg">
              <Plus size={20} />
              Add Field
            </button>
          </div>

          {loading ? <div className="text-center py-12">Loading...</div> : fields.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
              <p className="text-slate-600 mb-4">No custom HR fields found</p>
              <button onClick={() => setShowModal(true)} className="text-cyan-600 hover:text-cyan-700 font-medium">Add your first custom field</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fields.map((field) => (
                <div key={field.id} className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{field.field_name}</h3>
                      <p className="text-sm text-slate-500 capitalize">{field.field_type}</p>
                    </div>
                    <button onClick={() => handleDelete(field.id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">Applies to:</span>
                      <span className="text-sm text-slate-700 capitalize">{field.applies_to}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">Required:</span>
                      <span className="text-sm text-slate-700">{field.is_required ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-t-2xl px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Add Custom Field</h2>
              <button onClick={() => setShowModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Field Name *</label>
                <input type="text" required className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500" value={formData.field_name} onChange={(e) => setFormData({ ...formData, field_name: e.target.value })} placeholder="e.g., Employee ID, Blood Group" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Field Type *</label>
                <select required className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500" value={formData.field_type} onChange={(e) => setFormData({ ...formData, field_type: e.target.value })}>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Options (comma separated)</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500" value={formData.options} onChange={(e) => setFormData({ ...formData, options: e.target.value })} placeholder="A+, B+, O+, AB+" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Applies To *</label>
                <select required className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-cyan-500" value={formData.applies_to} onChange={(e) => setFormData({ ...formData, applies_to: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="leave">Leave</option>
                  <option value="attendance">Attendance</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="required" className="w-5 h-5 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500" checked={formData.is_required} onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })} />
                <label htmlFor="required" className="text-sm font-medium text-slate-700">Required field</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-semibold shadow-lg transition-all">Add Field</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRConfig;
