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
    purchase_request_id: '',
    store_id: '',
    supplier_name: '',
    supplier_contact: '',
    items: [],
    total_amount: 0,
    delivery_date: '',
    created_by: user.id,
  });

  useEffect(() => {
    fetchData();
  }, []);

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
    } catch (error) {
      toast.error('Failed to fetch data');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/purchase-orders`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Purchase order created successfully');
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create purchase order');
    }
  };

  const getStoreName = (storeId) => stores.find((s) => s.id === storeId)?.name || 'Unknown';

  return (
    <div className="flex">
      <Sidebar user={user} onLogout={onLogout} activePage="purchase-orders" setActivePage={() => {}} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-orange-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Purchase Orders</h1>
              <p className="text-slate-600">Create and manage purchase orders from approved requests</p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg">
              <Plus size={20} />
              Create PO
            </button>
          </div>

          {loading ? <div className="text-center py-12">Loading...</div> : orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
              <p className="text-slate-600 mb-4">No purchase orders found</p>
              <button onClick={() => setShowModal(true)} className="text-orange-600 hover:text-orange-700 font-medium">Create your first purchase order</button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="table-container overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">PO ID</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Store</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Supplier</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Amount</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Delivery Date</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-orange-50/30">
                        <td className="px-6 py-4 text-slate-900 font-mono text-sm">{order.id.slice(0, 8)}</td>
                        <td className="px-6 py-4 text-slate-900 font-medium">{getStoreName(order.store_id)}</td>
                        <td className="px-6 py-4 text-slate-600">{order.supplier_name}</td>
                        <td className="px-6 py-4 text-slate-900 font-semibold">₹{order.total_amount.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-slate-600">{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-IN') : '-'}</td>
                        <td className="px-6 py-4"><span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 capitalize">{order.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrders;
