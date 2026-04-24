import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PurchaseOrders = ({ user, onLogout, isSubComponent }) => {
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [selectedPOForGRN, setSelectedPOForGRN] = useState(null);
  const [grnData, setGrnData] = useState({ items_received: [], receipt_date: new Date().toISOString().split('T')[0], delivery_note: '', received_by: user.id });
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


  const handleOpenGRNModal = (po) => {
    setSelectedPOForGRN(po);
    setGrnData({
      purchase_order_id: po.id,
      store_id: po.store_id,
      items_received: po.items.map(item => ({ ...item, received_quantity: item.quantity })),
      receipt_date: new Date().toISOString().split('T')[0],
      delivery_note: '',
      received_by: user.name || user.id
    });
    setShowGRNModal(true);
  };

  const handleGRNSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // Format items correctly for backend
      const formattedData = {
        ...grnData,
        items_received: grnData.items_received.map(item => ({
          name: item.name,
          quantity: parseInt(item.received_quantity, 10),
          price: item.price || item.unit_price || 0,
          unit: item.unit
        }))
      };

      await axios.post(`${API}/goods-receipts`, formattedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Goods Receipt Note created successfully');
      setShowGRNModal(false);
      fetchOrders();
    } catch (error) {
      console.error('Error creating GRN:', error);
      toast.error('Failed to create Goods Receipt Note');
    }
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

  const content = (
    <>
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
    </>
  );

  if (isSubComponent) {
    return content;
  }

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="purchase-orders" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          {content}
        </div>

        {/* GRN Modal */}
        {showGRNModal && selectedPOForGRN && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Create Goods Receipt Note (GRN)</h3>
                <button onClick={() => setShowGRNModal(false)} className="text-gray-400 hover:text-gray-500">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleGRNSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Receipt Date</label>
                    <input type="date" value={grnData.receipt_date} onChange={(e) => setGrnData({...grnData, receipt_date: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Note / Waybill</label>
                    <input type="text" value={grnData.delivery_note} onChange={(e) => setGrnData({...grnData, delivery_note: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Optional" />
                  </div>
                </div>

                <h4 className="font-medium text-gray-900 mb-2">Items Received</h4>
                <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200 max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ordered Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Received Qty</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {grnData.items_received.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.name}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{item.quantity} {item.unit}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={item.received_quantity}
                              onChange={(e) => {
                                const newItems = [...grnData.items_received];
                                newItems[index].received_quantity = e.target.value;
                                setGrnData({...grnData, items_received: newItems});
                              }}
                              className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              required
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowGRNModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Confirm Receipt</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PurchaseOrders;
