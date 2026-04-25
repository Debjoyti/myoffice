import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Stores = ({ user, onLogout, isSubComponent }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '', manager: '', contact: '' });

  useEffect(() => { fetchStores(); }, []);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/stores`, { headers: { Authorization: `Bearer ${token}` } });
      setStores(response.data);
    } catch { toast.error('Failed to fetch stores'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/stores`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Store added successfully');
      setShowModal(false);
      setFormData({ name: '', location: '', manager: '', contact: '' });
      fetchStores();
    } catch { toast.error('Failed to add store'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/stores/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Store deleted successfully');
      fetchStores();
    } catch { toast.error('Failed to delete store'); }
  };

  const content = (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title" data-testid="stores-title">Store Management</h1>
          <p className="page-subtitle">Manage your organization's stores and warehouses</p>
        </div>
        <button onClick={() => setShowModal(true)} data-testid="add-store-btn" className="btn-dark-primary">
          <Plus size={18} /> Add Store
        </button>
      </div>

      {loading ? (
        <div className="dark-loading">Loading stores…</div>
      ) : stores.length === 0 ? (
        <div className="dark-empty">
          <p style={{ marginBottom: '12px' }}>No stores found</p>
          <button onClick={() => setShowModal(true)} style={{ color: '#818cf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Add your first store</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {stores.map(store => (
            <div key={store.id} data-testid={`store-card-${store.id}`}
              className="dark-card fade-in"
              style={{ padding: '20px', transition: 'all 0.25s ease', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: '0 0 4px' }}>{store.name}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>{store.location}</p>
                </div>
                <button onClick={() => handleDelete(store.id)} data-testid={`delete-store-${store.id}`}
                  style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {store.manager && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 600 }}>Manager:</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{store.manager}</span>
                  </div>
                )}
                {store.contact && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 600 }}>Contact:</span>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{store.contact}</span>
                  </div>
                )}
                <div style={{ marginTop: '8px' }}>
                  <span className={store.status === 'active' ? 'badge-green' : 'badge-amber'}>{store.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="dark-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="dark-modal" style={{ maxWidth: '480px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="add-store-modal-title">Add Store</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Store Name *</label>
                <input type="text" required data-testid="store-name-input" placeholder="Main Warehouse" className="dark-input"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Location *</label>
                <input type="text" required data-testid="store-location-input" placeholder="Mumbai, Maharashtra" className="dark-input"
                  value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Manager Name</label>
                <input type="text" data-testid="store-manager-input" placeholder="Rajesh Kumar" className="dark-input"
                  value={formData.manager} onChange={e => setFormData({ ...formData, manager: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Contact Number</label>
                <input type="tel" data-testid="store-contact-input" placeholder="+91 98765 43210" className="dark-input"
                  value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" data-testid="submit-store-btn" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Add Store</button>
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

export default Stores;