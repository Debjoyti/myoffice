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
    employee_id: '', category: '', amount: '', description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [expRes, empRes] = await Promise.all([
        axios.get(`${API}/expenses`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setExpenses(expRes.data);
      setEmployees(empRes.data);
    } catch { toast.error('Failed to fetch data'); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/expenses`, { ...formData, amount: parseFloat(formData.amount) }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Expense added successfully');
      setShowModal(false);
      setFormData({ employee_id: '', category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch { toast.error('Failed to add expense'); }
  };

  const getEmployeeName = (id) => employees.find(e => e.id === id)?.name || 'Unknown';

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);

  const statusBadge = (s) => {
    if (s === 'approved') return <span className="badge-green">{s}</span>;
    if (s === 'rejected') return <span className="badge-red">{s}</span>;
    return <span className="badge-amber">{s}</span>;
  };

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="expenses" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
              <h1 className="page-title" data-testid="expenses-title">Expenses</h1>
              <p className="page-subtitle">Track and manage expenses</p>
            </div>
            <button onClick={() => setShowModal(true)} data-testid="add-expense-btn" className="btn-dark-primary">
              <Plus size={18} /> Add Expense
            </button>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}`, color: '#f87171', testId: 'total-expenses-card' },
              { label: 'Pending Approval', value: `₹${pendingExpenses.toLocaleString('en-IN')}`, color: '#fbbf24', testId: 'pending-expenses-card' },
            ].map(c => (
              <div key={c.label} className="dark-card fade-in" style={{ padding: '20px' }} data-testid={c.testId}>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', margin: '0 0 6px' }}>{c.label}</p>
                <p style={{ color: c.color, fontSize: '26px', fontWeight: 800, margin: 0 }}>{c.value}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="dark-loading">Loading expenses…</div>
          ) : expenses.length === 0 ? (
            <div className="dark-empty">
              <p style={{ marginBottom: '12px' }}>No expenses found</p>
              <button onClick={() => setShowModal(true)} style={{ color: '#818cf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Add your first expense</button>
            </div>
          ) : (
            <div className="dark-table-wrap fade-in">
              <table>
                <thead>
                  <tr><th>Employee</th><th>Category</th><th>Amount</th><th>Description</th><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id} data-testid={`expense-row-${exp.id}`}>
                      <td style={{ color: '#fff', fontWeight: 600 }}>{getEmployeeName(exp.employee_id)}</td>
                      <td style={{ textTransform: 'capitalize' }}>{exp.category}</td>
                      <td style={{ color: '#fff', fontWeight: 600 }}>₹{exp.amount.toLocaleString('en-IN')}</td>
                      <td>{exp.description || '—'}</td>
                      <td>{new Date(exp.date).toLocaleDateString('en-IN')}</td>
                      <td>{statusBadge(exp.status)}</td>
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
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="add-expense-modal-title">Add Expense</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Employee *</label>
                <select required data-testid="expense-employee-select" className="dark-input"
                  value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })}>
                  <option value="">Select employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="dark-label">Category *</label>
                <select required data-testid="expense-category-select" className="dark-input"
                  value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
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
                <label className="dark-label">Amount (₹) *</label>
                <input type="number" required data-testid="expense-amount-input" min="0" step="0.01" className="dark-input"
                  value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Date *</label>
                <input type="date" required data-testid="expense-date-input" className="dark-input"
                  value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Description</label>
                <textarea data-testid="expense-description-input" rows="3" className="dark-input" placeholder="Enter expense details"
                  value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" data-testid="submit-expense-btn" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;