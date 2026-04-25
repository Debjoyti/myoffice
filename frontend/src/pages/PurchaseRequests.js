import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Check, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PurchaseRequests = ({ user, onLogout, isSubComponent }) => {
  const [requests, setRequests] = useState([]);
  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    store_id: '', requested_by: '',
    items: [{ name: '', quantity: '', price: '' }],
    reason: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [requestsRes, storesRes, employeesRes] = await Promise.all([
        axios.get(`${API}/purchase-requests`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/stores`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setRequests(requestsRes.data);
      setStores(storesRes.data);
      setEmployees(employeesRes.data);
    } catch { toast.error('Failed to fetch data'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const totalAmount = formData.items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);
      const requestData = { ...formData, total_amount: totalAmount, items: formData.items.map(item => ({ name: item.name, quantity: parseInt(item.quantity), price: parseFloat(item.price) })) };
      await axios.post(`${API}/purchase-requests`, requestData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Purchase request submitted successfully');
      setShowModal(false);
      setFormData({ store_id: '', requested_by: '', items: [{ name: '', quantity: '', price: '' }], reason: '' });
      fetchData();
    } catch { toast.error('Failed to submit purchase request'); }
  };

  const addItem = () => setFormData({ ...formData, items: [...formData.items, { name: '', quantity: '', price: '' }] });
  const removeItem = (index) => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/purchase-requests/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Purchase request approved');
      fetchData();
    } catch { toast.error('Failed to approve purchase request'); }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/purchase-requests/${id}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Purchase request rejected');
      fetchData();
    } catch { toast.error('Failed to reject purchase request'); }
  };

  const getStoreName = (id) => stores.find(s => s.id === id)?.name || 'Unknown';
  const getEmployeeName = (id) => employees.find(e => e.id === id)?.name || 'Unknown';

  const statusBadge = (s) => {
    if (s === 'approved') return <span className="badge-green">{s}</span>;
    if (s === 'rejected') return <span className="badge-red">{s}</span>;
    return <span className="badge-amber">{s}</span>;
  };

  const content = (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title" data-testid="purchase-requests-title">Purchase Requests</h1>
          <p className="page-subtitle">Submit and manage purchase requests with admin approval</p>
        </div>
        <button onClick={() => setShowModal(true)} data-testid="add-purchase-request-btn" className="btn-dark-primary">
          <Plus size={18} /> New Request
        </button>
      </div>

      {loading ? (
        <div className="dark-loading">Loading requests…</div>
      ) : requests.length === 0 ? (
        <div className="dark-empty">
          <p style={{ marginBottom: '12px' }}>No purchase requests found</p>
          <button onClick={() => setShowModal(true)} style={{ color: '#818cf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Create your first purchase request</button>
        </div>
      ) : (
        <div className="dark-table-wrap fade-in">
          <table>
            <thead>
              <tr><th>Store</th><th>Requested By</th><th>Items</th><th>Total Amount</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} data-testid={`purchase-request-row-${req.id}`}>
                  <td style={{ color: '#fff', fontWeight: 600 }}>{getStoreName(req.store_id)}</td>
                  <td>{getEmployeeName(req.requested_by)}</td>
                  <td>{req.items.length} items</td>
                  <td style={{ color: '#fff', fontWeight: 600 }}>₹{req.total_amount.toLocaleString('en-IN')}</td>
                  <td>{statusBadge(req.status)}</td>
                  <td>
                    {req.status === 'pending' && user.role === 'admin' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleApprove(req.id)} data-testid={`approve-request-${req.id}`}
                          style={{ color: '#34d399', background: 'rgba(16,185,129,0.1)', border: 'none', borderRadius: '6px', padding: '5px', cursor: 'pointer' }} title="Approve">
                          <Check size={16} />
                        </button>
                        <button onClick={() => handleReject(req.id)} data-testid={`reject-request-${req.id}`}
                          style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', padding: '5px', cursor: 'pointer' }} title="Reject">
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '680px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="add-purchase-request-modal-title">New Purchase Request</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dark-label">Store *</label>
                  <select required data-testid="purchase-request-store-select" className="dark-input"
                    value={formData.store_id} onChange={e => setFormData({ ...formData, store_id: e.target.value })}>
                    <option value="">Select store</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="dark-label">Requested By *</label>
                  <select required data-testid="purchase-request-employee-select" className="dark-input"
                    value={formData.requested_by} onChange={e => setFormData({ ...formData, requested_by: e.target.value })}>
                    <option value="">Select employee</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="dark-label">Items *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {formData.items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '10px' }}>
                      <input type="text" required placeholder="Item name" data-testid={`item-name-${index}`} className="dark-input" style={{ flex: 1 }}
                        value={item.name} onChange={e => updateItem(index, 'name', e.target.value)} />
                      <input type="number" required placeholder="Qty" data-testid={`item-quantity-${index}`} className="dark-input" style={{ width: '80px' }}
                        value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
                      <input type="number" required placeholder="Price" data-testid={`item-price-${index}`} className="dark-input" style={{ width: '100px' }}
                        value={item.price} onChange={e => updateItem(index, 'price', e.target.value)} />
                      {formData.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(index)}
                          style={{ color: '#f87171', background: 'rgba(239,68,68,0.12)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', flexShrink: 0 }}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem}
                  style={{ marginTop: '8px', color: '#818cf8', fontSize: '13px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  + Add another item
                </button>
              </div>

              <div>
                <label className="dark-label">Reason</label>
                <textarea data-testid="purchase-request-reason-input" rows="3" className="dark-input" placeholder="Reason for this purchase request"
                  value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" data-testid="submit-purchase-request-btn" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Submit Request</button>
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

export default PurchaseRequests;
