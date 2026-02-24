import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Check, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PurchaseRequests = ({ user, onLogout }) => {
  const [requests, setRequests] = useState([]);
  const [stores, setStores] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    store_id: '',
    requested_by: '',
    items: [{ name: '', quantity: '', price: '' }],
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

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
    } catch (error) {
      toast.error('Failed to fetch data');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const totalAmount = formData.items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);
      const requestData = {
        ...formData,
        total_amount: totalAmount,
        items: formData.items.map(item => ({
          name: item.name,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
        })),
      };
      await axios.post(`${API}/purchase-requests`, requestData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Purchase request submitted successfully');
      setShowModal(false);
      setFormData({
        store_id: '',
        requested_by: '',
        items: [{ name: '', quantity: '', price: '' }],
        reason: '',
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to submit purchase request');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: '', price: '' }],
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleApprove = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/purchase-requests/${requestId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Purchase request approved');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve purchase request');
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/purchase-requests/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Purchase request rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject purchase request');
    }
  };

  const getStoreName = (storeId) => {
    const store = stores.find((s) => s.id === storeId);
    return store ? store.name : 'Unknown';
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find((e) => e.id === empId);
    return emp ? emp.name : 'Unknown';
  };

  return (
    <div className="flex">
      <Sidebar
        user={user}
        onLogout={onLogout}
        activePage="purchase-requests"
        setActivePage={() => {}}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2" data-testid="purchase-requests-title">
                Purchase Requests
              </h1>
              <p className="text-slate-600">Submit and manage purchase requests with admin approval</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              data-testid="add-purchase-request-btn"
              className="btn-primary flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
            >
              <Plus size={20} />
              New Request
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-12 text-center">
              <p className="text-slate-600 mb-4">No purchase requests found</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Create your first purchase request
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="table-container overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Store</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Requested By</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Items</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Total Amount</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-purple-50/30" data-testid={`purchase-request-row-${request.id}`}>
                        <td className="px-6 py-4 text-slate-900 font-medium">{getStoreName(request.store_id)}</td>
                        <td className="px-6 py-4 text-slate-600">{getEmployeeName(request.requested_by)}</td>
                        <td className="px-6 py-4 text-slate-600">{request.items.length} items</td>
                        <td className="px-6 py-4 text-slate-900 font-semibold">
                          ₹{request.total_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              request.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : request.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {request.status === 'pending' && user.role === 'admin' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(request.id)}
                                data-testid={`approve-request-${request.id}`}
                                className="text-emerald-600 hover:text-emerald-700 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <Check size={18} />
                              </button>
                              <button
                                onClick={() => handleReject(request.id)}
                                data-testid={`reject-request-${request.id}`}
                                className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-white" data-testid="add-purchase-request-modal-title">
                New Purchase Request
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Store *</label>
                  <select
                    required
                    data-testid="purchase-request-store-select"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    value={formData.store_id}
                    onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                  >
                    <option value="">Select store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Requested By *</label>
                  <select
                    required
                    data-testid="purchase-request-employee-select"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    value={formData.requested_by}
                    onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                  >
                    <option value="">Select employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Items *</label>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start bg-slate-50 p-4 rounded-lg">
                      <input
                        type="text"
                        required
                        placeholder="Item name"
                        data-testid={`item-name-${index}`}
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                      />
                      <input
                        type="number"
                        required
                        placeholder="Qty"
                        data-testid={`item-quantity-${index}`}
                        className="w-24 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                      />
                      <input
                        type="number"
                        required
                        placeholder="Price"
                        data-testid={`item-price-${index}`}
                        className="w-32 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', e.target.value)}
                      />
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-3 text-purple-600 hover:text-purple-700 font-medium text-sm"
                >
                  + Add another item
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                <textarea
                  data-testid="purchase-request-reason-input"
                  rows="3"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 transition-all"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Reason for this purchase request"
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
                  data-testid="submit-purchase-request-btn"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold shadow-lg transition-all"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequests;
