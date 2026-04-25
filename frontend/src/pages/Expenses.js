import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Check, XCircle, TrendingUp, Clock, CheckCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORIES = ['travel', 'meals', 'supplies', 'software', 'marketing', 'utilities', 'rent', 'equipment', 'training', 'other'];

const Expenses = ({ user, onLogout }) => {
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    employee_id: '', category: '', amount: '', description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

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
      toast.success('Expense submitted for approval');
      setShowModal(false);
      setFormData({ employee_id: '', category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch { toast.error('Failed to add expense'); }
  };

  const handleApprove = async (expenseId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/expenses/${expenseId}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Expense approved');
      setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, status: 'approved' } : e));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve expense');
    }
  };

  const handleReject = async (expenseId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/expenses/${expenseId}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Expense rejected');
      setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, status: 'rejected' } : e));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject expense');
    }
  };

  const getEmployeeName = (id) => employees.find(e => e.id === id)?.name || 'Unknown';

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending');
  const approvedExpenses = expenses.filter(e => e.status === 'approved');
  const pendingAmount = pendingExpenses.reduce((s, e) => s + e.amount, 0);
  const approvedAmount = approvedExpenses.reduce((s, e) => s + e.amount, 0);

  const filteredExpenses = expenses.filter(e => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    return true;
  });

  const statusBadge = (s) => {
    if (s === 'approved') return <span className="badge-green">{s}</span>;
    if (s === 'rejected') return <span className="badge-red">{s}</span>;
    return <span className="badge-amber">{s}</span>;
  };

  const categoryIcon = (cat) => {
    const icons = { travel: '✈️', meals: '🍽️', supplies: '📦', software: '💻', marketing: '📢', utilities: '⚡', rent: '🏢', equipment: '🔧', training: '📚', other: '📋' };
    return icons[cat] || '📋';
  };

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title" data-testid="expenses-title">Expense Management</h1>
              <p className="page-subtitle">Track, submit, and approve team expenses</p>
            </div>
            <button onClick={() => setShowModal(true)} data-testid="add-expense-btn" className="btn-dark-primary">
              <Plus size={18} /> Submit Expense
            </button>
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
            {[
              { label: 'Total Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}`, sub: `${expenses.length} entries`, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: TrendingUp, testId: 'total-expenses-card' },
              { label: 'Pending Approval', value: `₹${pendingAmount.toLocaleString('en-IN')}`, sub: `${pendingExpenses.length} pending`, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock, testId: 'pending-expenses-card' },
              { label: 'Approved', value: `₹${approvedAmount.toLocaleString('en-IN')}`, sub: `${approvedExpenses.length} approved`, color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle, testId: null },
              { label: 'Rejected', value: expenses.filter(e => e.status === 'rejected').length, sub: 'claims declined', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: XCircle, testId: null },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} className="dark-card fade-in" style={{ padding: '20px' }} data-testid={kpi.testId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={kpi.color} />
                    </div>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', margin: '0 0 2px' }}>{kpi.label}</p>
                  <p style={{ color: kpi.color, fontSize: '22px', fontWeight: 800, margin: '0 0 2px' }}>{kpi.value}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>{kpi.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px' }}>
              {['all', 'pending', 'approved', 'rejected'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  style={{ padding: '7px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
                    background: filterStatus === s ? 'rgba(99,102,241,0.2)' : 'transparent',
                    color: filterStatus === s ? '#818cf8' : 'rgba(255,255,255,0.45)' }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1e293b' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="dark-loading">Loading expenses…</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="dark-empty">
              <p style={{ marginBottom: '12px' }}>No expenses found matching filters</p>
              <button onClick={() => setShowModal(true)} style={{ color: '#818cf8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Submit your first expense</button>
            </div>
          ) : (
            <div className="dark-table-wrap fade-in">
              <table>
                <thead>
                  <tr><th>Employee</th><th>Category</th><th>Amount</th><th>Description</th><th>Date</th><th>Status</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id} data-testid={`expense-row-${exp.id}`}>
                      <td style={{ color: '#fff', fontWeight: 600 }}>{getEmployeeName(exp.employee_id)}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{categoryIcon(exp.category)}</span>
                          <span style={{ textTransform: 'capitalize' }}>{exp.category}</span>
                        </span>
                      </td>
                      <td style={{ color: '#fff', fontWeight: 700 }}>₹{exp.amount.toLocaleString('en-IN')}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.description || '—'}</td>
                      <td>{new Date(exp.date).toLocaleDateString('en-IN')}</td>
                      <td>{statusBadge(exp.status)}</td>
                      {isAdmin && (
                        <td>
                          {exp.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleApprove(exp.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                <Check size={12} /> Approve
                              </button>
                              <button onClick={() => handleReject(exp.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                <XCircle size={12} /> Reject
                              </button>
                            </div>
                          )}
                          {exp.status !== 'pending' && (
                            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Submit Expense Modal */}
      {showModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '500px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="add-expense-modal-title">Submit Expense</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Employee *</label>
                <select required data-testid="expense-employee-select" className="dark-input"
                  value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })}>
                  <option value="">Select employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} — {emp.department}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dark-label">Category *</label>
                  <select required data-testid="expense-category-select" className="dark-input"
                    value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1e293b' }}>{categoryIcon(c)} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="dark-label">Amount (₹) *</label>
                  <input type="number" required data-testid="expense-amount-input" min="0" step="0.01" className="dark-input" placeholder="0.00"
                    value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="dark-label">Date *</label>
                <input type="date" required data-testid="expense-date-input" className="dark-input"
                  value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Description</label>
                <textarea data-testid="expense-description-input" rows="3" className="dark-input" placeholder="What was this expense for?"
                  value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: 0 }}>⚠️ Expense will be submitted for manager approval before reimbursement.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" data-testid="submit-expense-btn" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Submit Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;