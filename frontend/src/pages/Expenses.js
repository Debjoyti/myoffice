import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Expenses = ({ user, onLogout }) => {
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [expResponse, empResponse] = await Promise.all([
        axios.get(`${API}/expenses`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setExpenses(expResponse.data);
      setEmployees(empResponse.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const expenseData = { ...formData, amount: parseFloat(formData.amount) };
      await axios.post(`${API}/expenses`, expenseData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Expense added successfully');
      setShowModal(false);
      setFormData({
        employee_id: '',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find((e) => e.id === empId);
    return emp ? emp.name : 'Unknown';
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpenses = expenses.filter((e) => e.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="flex">
      <Sidebar
        user={user}
        onLogout={onLogout}
        activePage="expenses"
        setActivePage={() => {}}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2" data-testid="expenses-title">
                Expenses
              </h1>
              <p className="text-slate-600">Track and manage expenses</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              data-testid="add-expense-btn"
              className="btn-primary flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              <Plus size={20} />
              Add Expense
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="total-expenses-card">
              <p className="text-sm text-slate-600 mb-2">Total Expenses</p>
              <p className="text-3xl font-bold text-slate-900">₹{totalExpenses.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-6" data-testid="pending-expenses-card">
              <p className="text-sm text-slate-600 mb-2">Pending Approval</p>
              <p className="text-3xl font-bold text-amber-600">₹{pendingExpenses.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <p className="text-slate-600 mb-4">No expenses found</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Add your first expense
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="table-container overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Employee</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Category</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Amount</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Description</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Date</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-slate-50" data-testid={`expense-row-${expense.id}`}>
                        <td className="px-6 py-4 text-slate-900 font-medium">{getEmployeeName(expense.employee_id)}</td>
                        <td className="px-6 py-4 text-slate-600 capitalize">{expense.category}</td>
                        <td className="px-6 py-4 text-slate-900 font-semibold">
                          ₹{expense.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{expense.description || '-'}</td>
                        <td className="px-6 py-4 text-slate-600">{new Date(expense.date).toLocaleDateString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              expense.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : expense.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {expense.status}
                          </span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900" data-testid="add-expense-modal-title">Add Expense</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Employee *</label>
                <select
                  required
                  data-testid="expense-employee-select"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                <select
                  required
                  data-testid="expense-category-select"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  <option value="travel">Travel</option>
                  <option value="meals">Meals</option>
                  <option value="supplies">Office Supplies</option>
                  <option value="software">Software</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  data-testid="expense-amount-input"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date *</label>
                <input
                  type="date"
                  required
                  data-testid="expense-date-input"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  data-testid="expense-description-input"
                  rows="3"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter expense details"
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
                  data-testid="submit-expense-btn"
                  className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;