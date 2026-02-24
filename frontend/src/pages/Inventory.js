import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Inventory = ({ user, onLogout }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    price_per_unit: '',
    location: '',
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data);
    } catch (error) {
      toast.error('Failed to fetch inventory');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const itemData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        price_per_unit: parseFloat(formData.price_per_unit),
      };
      await axios.post(`${API}/inventory`, itemData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Item added successfully');
      setShowModal(false);
      setFormData({
        name: '',
        category: '',
        quantity: '',
        unit: '',
        price_per_unit: '',
        location: '',
      });
      fetchItems();
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.price_per_unit, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex">
      <Sidebar
        user={user}
        onLogout={onLogout}
        activePage="inventory"
        setActivePage={() => {}}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2" data-testid="inventory-title">
                Inventory
              </h1>
              <p className="text-slate-600">Manage inventory items</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              data-testid="add-inventory-btn"
              className="btn-primary flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              <Plus size={20} />
              Add Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="total-items-card">
              <p className="text-sm text-slate-600 mb-2">Total Items</p>
              <p className="text-3xl font-bold text-slate-900">{totalItems}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="total-value-card">
              <p className="text-sm text-slate-600 mb-2">Total Value</p>
              <p className="text-3xl font-bold text-slate-900">₹{totalValue.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <p className="text-slate-600 mb-4">No inventory items found</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Add your first item
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="table-container overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Name</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Category</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Quantity</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Unit</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Price/Unit</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Total Value</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50" data-testid={`inventory-row-${item.id}`}>
                        <td className="px-6 py-4 text-slate-900 font-medium">{item.name}</td>
                        <td className="px-6 py-4 text-slate-600 capitalize">{item.category}</td>
                        <td className="px-6 py-4 text-slate-900">{item.quantity}</td>
                        <td className="px-6 py-4 text-slate-600">{item.unit}</td>
                        <td className="px-6 py-4 text-slate-900">₹{item.price_per_unit.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-slate-900 font-semibold">
                          ₹{(item.quantity * item.price_per_unit).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{item.location || '-'}</td>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900" data-testid="add-inventory-modal-title">Add Inventory Item</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Item Name *</label>
                <input
                  type="text"
                  required
                  data-testid="inventory-name-input"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                <select
                  required
                  data-testid="inventory-category-select"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  <option value="furniture">Furniture</option>
                  <option value="electronics">Electronics</option>
                  <option value="supplies">Office Supplies</option>
                  <option value="equipment">Equipment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    required
                    data-testid="inventory-quantity-input"
                    min="0"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Unit *</label>
                  <input
                    type="text"
                    required
                    data-testid="inventory-unit-input"
                    placeholder="pcs, kg, box"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Price per Unit (₹) *</label>
                <input
                  type="number"
                  required
                  data-testid="inventory-price-input"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={formData.price_per_unit}
                  onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                <input
                  type="text"
                  data-testid="inventory-location-input"
                  placeholder="e.g., Warehouse A, Floor 2"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-inventory-btn"
                  className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;