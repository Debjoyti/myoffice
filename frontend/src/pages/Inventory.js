import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_INVENTORY } from '../utils/demoData';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Inventory = ({ user, onLogout, isSubComponent }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: '', quantity: '', unit: '', price_per_unit: '', location: '' });

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/inventory`, { headers: { Authorization: `Bearer ${token}` } });
      setItems((response.data && response.data.length > 0) ? response.data : MOCK_INVENTORY);
    } catch { 
      setItems(MOCK_INVENTORY);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/inventory`, { ...formData, quantity: parseInt(formData.quantity), price_per_unit: parseFloat(formData.price_per_unit) }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Item added successfully');
      setShowModal(false);
      setFormData({ name: '', category: '', quantity: '', unit: '', price_per_unit: '', location: '' });
      fetchItems();
    } catch { toast.error('Failed to add item'); }
  };

  const totalValue = items.reduce((s, i) => s + i.quantity * i.price_per_unit, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const content = (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title" data-testid="inventory-title">Inventory</h1>
          <p className="page-subtitle">Manage inventory items and stock</p>
        </div>
        <button onClick={() => setShowModal(true)} data-testid="add-inventory-btn" className="btn-dark-primary">
          <Plus size={18} /> Add Item
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Items', value: totalItems, color: '#818cf8', testId: 'total-items-card' },
          { label: 'Total Value', value: `₹${totalValue.toLocaleString('en-IN')}`, color: '#34d399', testId: 'total-value-card' },
        ].map(c => (
          <div key={c.label} className="dark-card fade-in" style={{ padding: '20px' }} data-testid={c.testId}>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', margin: '0 0 6px' }}>{c.label}</p>
            <p style={{ color: c.color, fontSize: '26px', fontWeight: 800, margin: 0 }}>{c.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="dark-loading">Loading inventory…</div>
      ) : items.length === 0 ? (
        <div className="dark-empty">
          <p style={{ marginBottom: '12px' }}>No inventory items found</p>
          <button onClick={() => setShowModal(true)} style={{ color: '#818cf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Add your first item</button>
        </div>
      ) : (
        <div className="dark-table-wrap fade-in">
          <table>
            <thead>
              <tr><th>Name</th><th>Category</th><th>Quantity</th><th>Unit</th><th>Price/Unit</th><th>Total Value</th><th>Location</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} data-testid={`inventory-row-${item.id}`}>
                  <td style={{ color: '#fff', fontWeight: 600 }}>{item.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{item.category}</td>
                  <td style={{ color: '#fff' }}>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td style={{ color: '#fff' }}>₹{item.price_per_unit.toLocaleString('en-IN')}</td>
                  <td style={{ color: '#34d399', fontWeight: 600 }}>₹{(item.quantity * item.price_per_unit).toLocaleString('en-IN')}</td>
                  <td>{item.location || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '480px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="add-inventory-modal-title">Add Inventory Item</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Item Name *</label>
                <input type="text" required data-testid="inventory-name-input" className="dark-input"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Category *</label>
                <select required data-testid="inventory-category-select" className="dark-input"
                  value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option value="">Select category</option>
                  <option value="furniture">Furniture</option>
                  <option value="electronics">Electronics</option>
                  <option value="supplies">Office Supplies</option>
                  <option value="equipment">Equipment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dark-label">Quantity *</label>
                  <input type="number" required data-testid="inventory-quantity-input" min="0" className="dark-input"
                    value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="dark-label">Unit *</label>
                  <input type="text" required data-testid="inventory-unit-input" placeholder="pcs, kg, box" className="dark-input"
                    value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="dark-label">Price per Unit (₹) *</label>
                <input type="number" required data-testid="inventory-price-input" min="0" step="0.01" className="dark-input"
                  value={formData.price_per_unit} onChange={e => setFormData({ ...formData, price_per_unit: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Location</label>
                <input type="text" data-testid="inventory-location-input" placeholder="e.g., Warehouse A, Floor 2" className="dark-input"
                  value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" data-testid="submit-inventory-btn" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Add Item</button>
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
      <Sidebar user={user} onLogout={onLogout} activePage="inventory" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          {content}
        </div>
      </div>
    </div>
  );
};

export default Inventory;