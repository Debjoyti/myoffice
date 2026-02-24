import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Stores = ({ user, onLogout }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    manager: '',
    contact: '',
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStores(response.data);
    } catch (error) {
      toast.error('Failed to fetch stores');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/stores`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Store added successfully');
      setShowModal(false);
      setFormData({ name: '', location: '', manager: '', contact: '' });
      fetchStores();
    } catch (error) {
      toast.error('Failed to add store');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/stores/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Store deleted successfully');
      fetchStores();
    } catch (error) {
      toast.error('Failed to delete store');
    }
  };

  return (
    <div className="flex">
      <Sidebar
        user={user}
        onLogout={onLogout}
        activePage="stores"
        setActivePage={() => {}}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2" data-testid="stores-title">
                Store Management
              </h1>
              <p className="text-slate-600">Manage your organization's stores and warehouses</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              data-testid="add-store-btn"
              className="btn-primary flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
            >
              <Plus size={20} />
              Add Store
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : stores.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
              <p className="text-slate-600 mb-4">No stores found</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Add your first store
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <div
                  key={store.id}
                  data-testid={`store-card-${store.id}`}
                  className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{store.name}</h3>
                      <p className="text-sm text-slate-500">{store.location}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(store.id)}
                      data-testid={`delete-store-${store.id}`}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {store.manager && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Manager:</span>
                        <span className="text-sm text-slate-700">{store.manager}</span>
                      </div>
                    )}
                    {store.contact && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Contact:</span>
                        <span className="text-sm text-slate-700">{store.contact}</span>
                      </div>
                    )}
                    <div className="pt-3">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          store.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {store.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{zIndex: 9999}}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl relative" style={{zIndex: 10000}}>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white" data-testid="add-store-modal-title">Add Store</h2>
              <button onClick={() => setShowModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Store Name *</label>
                <input
                  type="text"
                  required
                  data-testid="store-name-input"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Main Warehouse"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location *</label>
                <input
                  type="text"
                  required
                  data-testid="store-location-input"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Mumbai, Maharashtra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Manager Name</label>
                <input
                  type="text"
                  data-testid="store-manager-input"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  placeholder="Rajesh Kumar"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number</label>
                <input
                  type="tel"
                  data-testid="store-contact-input"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-store-btn"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-semibold shadow-lg transition-all"
                >
                  Add Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stores;