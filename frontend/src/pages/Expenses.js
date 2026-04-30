import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Check, XCircle, TrendingUp, Clock, CheckCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Expenses = ({ user, onLogout }) => {
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '', category: '', amount: '', description: '',
    date: new Date().toISOString().split('T')[0], receipt_url: '', payment_method: 'direct'
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [expRes, empRes, catRes] = await Promise.all([
        axios.get(`${API}/expenses`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/expenses/categories`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);
      setExpenses(expRes.data);
      setEmployees(empRes.data);
      if (catRes.data.length === 0) {
        setCategories([{ name: 'internet', max_limit: 5000 }, { name: 'travel', max_limit: 20000 }, { name: 'meals', max_limit: 5000 }]);
      } else {
        setCategories(catRes.data);
      }
    } catch { toast.error('Failed to fetch data'); }
    setLoading(false);
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setReceiptFile(file);
    setUploadingReceipt(true);
    try {
      const token = localStorage.getItem('token');
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await axios.post(`${API}/expenses/upload-receipt`, formDataUpload, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      setAiData(res.data.extracted_data);
      setFormData(prev => ({
        ...prev,
        receipt_url: res.data.receipt_url,
        amount: res.data.extracted_data.amount > 0 ? res.data.extracted_data.amount : prev.amount,
        date: res.data.extracted_data.date || prev.date
      }));
      toast.success('Receipt analyzed by AI successfully');
    } catch {
      toast.error('Receipt upload failed');
    }
    setUploadingReceipt(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        ai_extracted_data: aiData
      };
      await axios.post(`${API}/expenses`, submitData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Expense submitted for approval');
      setShowModal(false);
      setFormData({ employee_id: '', category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0], receipt_url: '', payment_method: 'direct' });
      setReceiptFile(null);
      setAiData(null);
      fetchData();
    } catch { toast.error('Failed to add expense'); }
  };

  const handleApprove = async (expenseId, level) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/expenses/${expenseId}/approve?level=${level}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Expense ${level} approved`);
      setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, status: level === 'manager' ? 'manager_approved' : 'approved' } : e));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve expense');
    }
  };

  const handlePay = async (expenseId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/expenses/${expenseId}/pay`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Expense marked as paid');
      setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, status: 'paid' } : e));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to pay expense');
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
  const pendingExpenses = expenses.filter(e => ['submitted', 'manager_approved'].includes(e.status));
  const approvedExpenses = expenses.filter(e => ['approved', 'paid'].includes(e.status));
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
              { label: 'Total Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}`, sub: `${expenses.length} entries`, color: 'var(--brand-primary)', bg: 'rgba(99,102,241,0.12)', icon: TrendingUp, testId: 'total-expenses-card' },
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
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: 0 }}>{kpi.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', borderRadius: '10px', padding: '4px' }}>
              {['all', 'submitted', 'manager_approved', 'approved', 'rejected', 'paid', 'flagged'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  style={{ padding: '7px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s',
                    background: filterStatus === s ? 'rgba(94, 106, 210, 0.2)' : 'transparent',
                    color: filterStatus === s ? 'var(--brand-primary)' : 'rgba(255,255,255,0.45)' }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.name} value={c.name} style={{ background: '#1e293b' }}>{c.name.charAt(0).toUpperCase() + c.name.slice(1)}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="dark-loading">Loading expenses…</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="dark-empty">
              <p style={{ marginBottom: '12px' }}>No expenses found matching filters</p>
              <button onClick={() => setShowModal(true)} style={{ color: 'var(--brand-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Submit your first expense</button>
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
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {getEmployeeName(exp.employee_id)}
                        {exp.ai_score < 7.0 && <span title={exp.ai_flags?.join(', ')} style={{ marginLeft: '6px', color: '#ef4444', fontSize: '10px' }}>⚠️ Flag</span>}
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{categoryIcon(exp.category)}</span>
                          <span style={{ textTransform: 'capitalize' }}>{exp.category}</span>
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 700 }}>₹{exp.amount.toLocaleString('en-IN')}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.description || '—'}</td>
                      <td>{new Date(exp.date).toLocaleDateString('en-IN')}</td>
                      <td>{statusBadge(exp.status)}</td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {['submitted', 'flagged'].includes(exp.status) && (
                              <>
                                <button onClick={() => handleApprove(exp.id, 'manager')}
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                  <Check size={12} /> Mgr Approve
                                </button>
                                <button onClick={() => handleReject(exp.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                  <XCircle size={12} /> Reject
                                </button>
                              </>
                            )}
                            {exp.status === 'manager_approved' && (
                              <>
                                <button onClick={() => handleApprove(exp.id, 'finance')}
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                  <Check size={12} /> Fin Approve
                                </button>
                                <button onClick={() => handleReject(exp.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                  <XCircle size={12} /> Reject
                                </button>
                              </>
                            )}
                            {exp.status === 'approved' && (
                              <button onClick={() => handlePay(exp.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                <Check size={12} /> Pay Now
                              </button>
                            )}
                          </div>
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
              <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="add-expense-modal-title">Submit Expense</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={22} /></button>
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
                  <label className="dark-label">Receipt Upload *</label>
                  <input type="file" accept="image/*,.pdf" onChange={handleReceiptUpload} className="dark-input" />
                  {uploadingReceipt && <span style={{ fontSize: '12px', color: '#60a5fa' }}>AI Analyzing receipt...</span>}
                  {aiData && <span style={{ fontSize: '12px', color: '#34d399' }}>AI Extracted: ₹{aiData.amount} | {aiData.vendor}</span>}
                </div>
                <div>
                  <label className="dark-label">Category *</label>
                  <select required data-testid="expense-category-select" className="dark-input"
                    value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.name} value={c.name} style={{ background: '#1e293b' }}>{categoryIcon(c.name)} {c.name.charAt(0).toUpperCase() + c.name.slice(1)} (Max ₹{c.max_limit})</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dark-label">Amount (₹) *</label>
                  <input type="number" required data-testid="expense-amount-input" min="0" step="0.01" className="dark-input" placeholder="0.00"
                    value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                </div>
                <div>
                  <label className="dark-label">Date *</label>
                  <input type="date" required data-testid="expense-date-input" className="dark-input"
                    value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="dark-label">Description</label>
                  <textarea data-testid="expense-description-input" rows="2" className="dark-input" placeholder="What was this expense for?"
                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div>
                  <label className="dark-label">Reimbursement Method</label>
                  <select className="dark-input" value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })}>
                    <option value="direct">Direct Bank Transfer</option>
                    <option value="payroll">Add to Next Payroll</option>
                  </select>
                </div>
              </div>
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(94, 106, 210, 0.2)', borderRadius: '10px', padding: '12px 14px' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: 0 }}>🤖 AI will scan the receipt to detect fraud, limit breaches, and duplicates before manager and finance approval.</p>
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