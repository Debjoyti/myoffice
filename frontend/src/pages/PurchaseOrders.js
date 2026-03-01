import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PurchaseOrders = ({ user, onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    purchase_request_id: '', store_id: '', supplier_name: '',
    supplier_contact: '', items: [], total_amount: 0,
    delivery_date: '', created_by: user.id,
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [ordersRes, storesRes, requestsRes] = await Promise.all([
        axios.get(`${API}/purchase-orders`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/stores`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/purchase-requests`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setOrders(ordersRes.data);
      setStores(storesRes.data);
      setRequests(requestsRes.data.filter(r => r.status === 'approved'));
    } catch { toast.error('Failed to fetch data'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/purchase-orders`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Purchase order created successfully');
      setShowModal(false);
      fetchData();
    } catch { toast.error('Failed to create purchase order'); }
  };

  const getStoreName = (id) => stores.find(s => s.id === id)?.name || 'Unknown';

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="purchase-orders" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
              <h1 className="page-title">Purchase Orders</h1>
              <p className="page-subtitle">Create and manage purchase orders from approved requests</p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-dark-primary">
              <Plus size={18} /> Create PO
            </button>
          </div>

          {loading ? (
            <div className="dark-loading">Loading purchase orders…</div>
          ) : orders.length === 0 ? (
            <div className="dark-empty">
              <p style={{ marginBottom: '12px' }}>No purchase orders found</p>
              <button onClick={() => setShowModal(true)} style={{ color: '#818cf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Create your first purchase order</button>
            </div>
          ) : (
            <div className="dark-table-wrap fade-in">
              <table>
                <thead>
                  <tr><th>PO ID</th><th>Store</th><th>Supplier</th><th>Amount</th><th>Delivery Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{order.id.slice(0, 8)}</td>
                      <td style={{ color: '#fff', fontWeight: 600 }}>{getStoreName(order.store_id)}</td>
                      <td>{order.supplier_name}</td>
                      <td style={{ color: '#fff', fontWeight: 600 }}>₹{order.total_amount.toLocaleString('en-IN')}</td>
                      <td>{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td><span className="badge-amber" style={{ textTransform: 'capitalize' }}>{order.status}</span></td>
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
          <div className="dark-modal" style={{ maxWidth: '480px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Create Purchase Order</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Purchase Request (Approved)</label>
                <select className="dark-input" value={formData.purchase_request_id}
                  onChange={e => setFormData({ ...formData, purchase_request_id: e.target.value })}>
                  <option value="">Select request</option>
                  {requests.map(r => <option key={r.id} value={r.id}>{r.id.slice(0, 8)} — ₹{r.total_amount?.toLocaleString('en-IN')}</option>)}
                </select>
              </div>
              <div>
                <label className="dark-label">Store *</label>
                <select required className="dark-input" value={formData.store_id}
                  onChange={e => setFormData({ ...formData, store_id: e.target.value })}>
                  <option value="">Select store</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="dark-label">Supplier Name *</label>
                <input type="text" required className="dark-input" placeholder="e.g., ABC Suppliers"
                  value={formData.supplier_name} onChange={e => setFormData({ ...formData, supplier_name: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Supplier Contact</label>
                <input type="text" className="dark-input" placeholder="+91 98765 43210"
                  value={formData.supplier_contact} onChange={e => setFormData({ ...formData, supplier_contact: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Total Amount (₹) *</label>
                <input type="number" required min="0" step="0.01" className="dark-input"
                  value={formData.total_amount} onChange={e => setFormData({ ...formData, total_amount: parseFloat(e.target.value) })} />
              </div>
              <div>
                <label className="dark-label">Expected Delivery Date</label>
                <input type="date" className="dark-input"
                  value={formData.delivery_date} onChange={e => setFormData({ ...formData, delivery_date: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
