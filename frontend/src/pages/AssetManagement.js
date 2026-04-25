import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Laptop, Monitor, Smartphone, Sofa, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AssetManagement = ({ user, onLogout }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // was dead input — now wired
  
  const [formData, setFormData] = useState({ 
    name: '', type: 'Laptop', serial_number: '', assigned_to: '', value: 0, purchase_date: new Date().toISOString().split('T')[0] 
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/assets`, { headers: { Authorization: `Bearer ${token}` } });
      setAssets(res.data);
    } catch { toast.error('Failed to fetch assets'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/assets`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Asset registered');
      setShowModal(false);
      setFormData({ name: '', type: 'Laptop', serial_number: '', assigned_to: '', value: 0, purchase_date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch { toast.error('Failed to register asset'); }
  };

  // Client-side filtering — keeps it instant without extra API calls
  const filteredAssets = assets.filter(a => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.name || '').toLowerCase().includes(q) ||
      (a.type || '').toLowerCase().includes(q) ||
      (a.serial_number || '').toLowerCase().includes(q) ||
      (a.assigned_to || '').toLowerCase().includes(q)
    );
  });

  const getIcon = (type) => {
    const t = type.toLowerCase();
    if (t.includes('laptop')) return <Laptop size={18} />;
    if (t.includes('monitor')) return <Monitor size={18} />;
    if (t.includes('phone')) return <Smartphone size={18} />;
    return <Sofa size={18} />;
  };

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 className="page-title">Asset Management</h1>
                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '4px' }}>AA01</span>
              </div>
              <p className="page-subtitle">Track hardware, electronics, and office inventory</p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-dark-primary">
              <Plus size={18} /> Register Asset
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} size={16} />
              <input
                type="text"
                placeholder="Search by name, type, or serial number..."
                className="dark-input"
                style={{ paddingLeft: '40px' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn-dark-secondary" onClick={() => setSearchQuery('')}><Filter size={18} /> Filter</button>
          </div>

          {loading ? (
            <div className="dark-loading">Inventorying assets...</div>
          ) : (
            <div className="dark-table-wrap fade-in">
              <table>
                <thead>
                  <tr><th>Asset ID</th><th>Name</th><th>Type</th><th>Assigned To</th><th>Serial #</th><th>Purchase Value</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {filteredAssets.map(asset => (
                    <tr key={asset.id}>
                      <td style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{asset.id}</td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {getIcon(asset.type)} {asset.name}
                        </div>
                      </td>
                      <td>{asset.type}</td>
                      <td style={{ color: asset.assigned_to ? '#fff' : 'rgba(255,255,255,0.2)' }}>{asset.assigned_to || 'Unassigned'}</td>
                      <td style={{ fontSize: '13px', fontFamily: 'monospace' }}>{asset.serial_number || '—'}</td>
                      <td style={{ color: '#10b981', fontWeight: 600 }}>₹{asset.value.toLocaleString()}</td>
                      <td>
                        <span className={asset.assigned_to ? 'badge-blue' : 'badge-green'}>
                          {asset.assigned_to ? 'In Use' : 'Available'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAssets.length === 0 && (
                <div className="dark-empty">{searchQuery ? `No assets found for "${searchQuery}"` : 'No assets registered. Better secure that hardware!'}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Asset Modal */}
      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '500px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', margin: 0 }}>Register Asset</h2>
              <button onClick={() => setShowModal(false)} className="icon-btn"><X /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Asset Name</label>
                <input 
                  type="text" className="dark-input" placeholder="e.g. MacBook Pro M3" required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dark-label">Category</label>
                  <select 
                    className="dark-input" 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Laptop">Laptop</option>
                    <option value="Desktop">Desktop PC</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Phone">Phone</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="dark-label">Purchase Value (₹)</label>
                  <input 
                    type="number" className="dark-input" placeholder="0" 
                    value={formData.value} 
                    onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="dark-label">Serial Number</label>
                <input 
                  type="text" className="dark-input" placeholder="e.g. SN12345678" 
                  value={formData.serial_number} 
                  onChange={e => setFormData({...formData, serial_number: e.target.value})}
                />
              </div>
              <div>
                <label className="dark-label">Assign to (Employee Email)</label>
                <input 
                  type="text" className="dark-input" placeholder="Leave empty if available" 
                  value={formData.assigned_to} 
                  onChange={e => setFormData({...formData, assigned_to: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManagement;
