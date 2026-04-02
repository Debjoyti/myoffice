import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Receipt, Users, Trash2, Sparkles, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GST_RATES = [0, 5, 12, 18, 28];

// AI Cash Flow advice
const getCashFlowAdvice = (invoices, expenses) => {
  const totalInvoiced = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0);
  const overdueCount = invoices.filter(i => i.status !== 'paid' && new Date(i.due_date) < new Date()).length;
  if (overdueCount > 0) return { type: 'warning', msg: `${overdueCount} invoice${overdueCount > 1 ? 's' : ''} overdue — immediate follow-up required for cash flow`, color: '#f59e0b' };
  if (totalInvoiced > 0 && paidAmount / totalInvoiced < 0.5) return { type: 'warning', msg: 'Less than 50% of invoiced amount collected — accelerate collections', color: '#f43f5e' };
  if (totalInvoiced > 100000) return { type: 'positive', msg: 'Strong invoice pipeline! Consider offering early payment discounts to accelerate inflow', color: '#10b981' };
  return { type: 'info', msg: 'Build invoice pipeline — aim for 30-day payment cycles with Net-30 terms', color: '#6366f1' };
};

const Finance = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const initialItem = () => ({ name: '', quantity: 1, price: 0, gst_rate: 18, amount: 0 });
  const [invoiceForm, setInvoiceForm] = useState({
    customer_id: '', items: [initialItem()], due_date: '', notes: ''
  });
  const [customerForm, setCustomerForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const h = { headers: { Authorization: `Bearer ${token}` } };
      const [invRes, custRes, vendRes] = await Promise.allSettled([
        axios.get(`${API}/invoices`, h),
        axios.get(`${API}/customers`, h),
        axios.get(`${API}/vendors`, h),
      ]);
      if (invRes.status === 'fulfilled') setInvoices(invRes.value.data || []);
      if (custRes.status === 'fulfilled') setCustomers(custRes.value.data || []);
      if (vendRes.status === 'fulfilled') setVendors(vendRes.value.data || []);
    } catch { toast.error('Failed to fetch finance data'); }
    setLoading(false);
  };

  // Line item management
  const updateItem = (idx, field, value) => {
    const items = [...invoiceForm.items];
    items[idx] = { ...items[idx], [field]: value };
    // Recompute amount
    const qty = parseFloat(items[idx].quantity) || 0;
    const price = parseFloat(items[idx].price) || 0;
    const gst = parseFloat(items[idx].gst_rate) || 0;
    items[idx].amount = qty * price * (1 + gst / 100);
    setInvoiceForm({ ...invoiceForm, items });
  };
  const addItem = () => setInvoiceForm({ ...invoiceForm, items: [...invoiceForm.items, initialItem()] });
  const removeItem = (idx) => {
    if (invoiceForm.items.length === 1) return;
    setInvoiceForm({ ...invoiceForm, items: invoiceForm.items.filter((_, i) => i !== idx) });
  };

  const subtotal = invoiceForm.items.reduce((s, item) => s + (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0), 0);
  const gstTotal = invoiceForm.items.reduce((s, item) => {
    const base = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
    return s + base * ((parseFloat(item.gst_rate) || 0) / 100);
  }, 0);
  const grandTotal = subtotal + gstTotal;

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/invoices`, { ...invoiceForm, total_amount: grandTotal }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Invoice generated successfully');
      setShowInvoiceModal(false);
      setInvoiceForm({ customer_id: '', items: [initialItem()], due_date: '', notes: '' });
      fetchData();
    } catch { toast.error('Failed to generate invoice'); }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/customers`, customerForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Customer added');
      setShowCustomerModal(false);
      setCustomerForm({ name: '', contact_person: '', email: '', phone: '', address: '' });
      fetchData();
    } catch { toast.error('Failed to add customer'); }
  };

  const updateInvoiceStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/invoices/${id}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
      toast.success(`Invoice marked as ${status}`);
    } catch { toast.error('Failed to update invoice'); }
  };

  const getCustomerName = (id) => customers.find(c => c.id === id)?.name || 'Unknown';

  // Finance KPIs
  const totalInvoiced = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0);
  const overdueInvoices = invoices.filter(i => i.status !== 'paid' && new Date(i.due_date) < new Date());
  const collectionRate = totalInvoiced > 0 ? Math.round((paidAmount / totalInvoiced) * 100) : 0;
  const cashFlowAdvice = getCashFlowAdvice(invoices, []);

  const tabs = [
    { id: 'invoices', label: '🧾 Invoices' },
    { id: 'customers', label: '👥 Customers' },
    { id: 'vendors', label: '🏭 Vendors' },
  ];

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="finance" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span>BizOps</span><span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Finance & Books</span>
          </div>

          <div className="page-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 className="page-title">Finance & Books</h1>
                <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace' }}>FB01</span>
                <span className="ai-badge"><Sparkles size={9} /> AI Forecasting</span>
              </div>
              <p className="page-subtitle">Invoices, customers, vendors & AI cash flow intelligence</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {activeTab === 'invoices' && <button onClick={() => setShowInvoiceModal(true)} className="btn-dark-primary"><Plus size={16} /> New Invoice</button>}
              {activeTab === 'customers' && <button onClick={() => setShowCustomerModal(true)} className="btn-dark-primary"><Plus size={16} /> New Customer</button>}
            </div>
          </div>

          {/* KPI Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }} className="stagger">
            {[
              { label: 'Total Invoiced', value: `₹${(totalInvoiced / 100000).toFixed(1)}L`, icon: Receipt, color: '#6366f1' },
              { label: 'Amount Collected', value: `₹${(paidAmount / 100000).toFixed(1)}L`, icon: CheckCircle2, color: '#10b981' },
              { label: 'Collection Rate', value: `${collectionRate}%`, icon: TrendingUp, color: collectionRate > 70 ? '#10b981' : '#f59e0b' },
              { label: 'Overdue Invoices', value: overdueInvoices.length, icon: AlertTriangle, color: overdueInvoices.length > 0 ? '#f43f5e' : '#10b981' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} className="kpi-card fade-in">
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${kpi.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <Icon size={16} color={kpi.color} />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', margin: '0 0 2px', fontWeight: 600 }}>{kpi.label}</p>
                  <p style={{ color: kpi.color, fontSize: '22px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{kpi.value}</p>
                </div>
              );
            })}
          </div>

          {/* AI Cash Flow Advice */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: `${cashFlowAdvice.color}0d`, border: `1px solid ${cashFlowAdvice.color}22`, borderRadius: '12px', marginBottom: '20px' }}>
            <Sparkles size={14} color={cashFlowAdvice.color} />
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: 0 }}>
              <strong style={{ color: cashFlowAdvice.color }}>AI Cash Flow:</strong> {cashFlowAdvice.msg}
            </p>
          </div>

          {/* Tabs */}
          <div className="tab-bar" style={{ marginBottom: '20px' }}>
            {tabs.map(t => <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>)}
          </div>

          {loading ? (
            <div className="dark-loading"><div className="dark-loading-spinner" /><span>Loading financial data…</span></div>
          ) : (
            <div className="fade-in">
              {/* INVOICES */}
              {activeTab === 'invoices' && (
                <div className="dark-table-wrap">
                  <table>
                    <thead><tr><th>Invoice #</th><th>Customer</th><th>Subtotal</th><th>Amount</th><th>Status</th><th>Due Date</th><th>Actions</th></tr></thead>
                    <tbody>
                      {invoices.map(inv => {
                        const isOverdue = inv.status !== 'paid' && new Date(inv.due_date) < new Date();
                        return (
                          <tr key={inv.id}>
                            <td style={{ color: '#818cf8', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{inv.invoice_number}</td>
                            <td style={{ color: '#fff', fontWeight: 600 }}>{getCustomerName(inv.customer_id)}</td>
                            <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>₹{(inv.total_amount * 0.85).toLocaleString()}</td>
                            <td style={{ color: '#fff', fontWeight: 700 }}>₹{(inv.total_amount || 0).toLocaleString()}</td>
                            <td>
                              <span className={inv.status === 'paid' ? 'badge-green' : isOverdue ? 'badge-red' : 'badge-amber'}>
                                {inv.status === 'paid' ? '✓ Paid' : isOverdue ? '⚠ Overdue' : inv.status}
                              </span>
                            </td>
                            <td style={{ color: isOverdue ? '#f87171' : 'rgba(255,255,255,0.6)' }}>
                              {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}
                            </td>
                            <td>
                              {inv.status !== 'paid' && (
                                <button onClick={() => updateInvoiceStatus(inv.id, 'paid')} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '7px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', cursor: 'pointer', fontWeight: 600 }}>Mark Paid</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {invoices.length === 0 && <div className="dark-empty"><Receipt size={32} color="rgba(255,255,255,0.08)" style={{ marginBottom: '12px' }} /><p>No invoices yet. Create your first invoice to track revenue.</p></div>}
                </div>
              )}

              {/* CUSTOMERS */}
              {activeTab === 'customers' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {customers.map(cust => (
                    <div key={cust.id} className="dark-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(99,102,241,0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Users size={18} color="#818cf8" />
                        </div>
                        <div>
                          <h3 style={{ color: '#fff', margin: 0, fontSize: '14px', fontWeight: 700 }}>{cust.name}</h3>
                          <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, fontSize: '11px' }}>{cust.contact_person}</p>
                        </div>
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.55)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <p style={{ margin: 0 }}>📧 {cust.email}</p>
                        {cust.phone && <p style={{ margin: 0 }}>📞 {cust.phone}</p>}
                        {cust.address && <p style={{ margin: 0 }}>📍 {cust.address}</p>}
                      </div>
                      <div style={{ marginTop: '12px', padding: '8px 10px', background: 'rgba(99,102,241,0.06)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '11px', color: 'rgba(99,102,241,0.8)', margin: 0, fontWeight: 600 }}>
                          {invoices.filter(inv => inv.customer_id === cust.id).length} invoice(s) · ₹{invoices.filter(inv => inv.customer_id === cust.id).reduce((s, i) => s + (i.total_amount || 0), 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {customers.length === 0 && <div className="dark-empty" style={{ gridColumn: '1/-1' }}>No customers yet. Add your first customer to start invoicing.</div>}
                </div>
              )}

              {/* VENDORS */}
              {activeTab === 'vendors' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {vendors.map(v => (
                    <div key={v.id} className="dark-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏭</div>
                        <div>
                          <h3 style={{ color: '#fff', margin: 0, fontSize: '14px', fontWeight: 700 }}>{v.name}</h3>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: 'rgba(245,158,11,0.1)', color: '#fbbf24', fontWeight: 600 }}>{v.category || 'General'}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.55)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {v.email && <p style={{ margin: 0 }}>📧 {v.email}</p>}
                        {v.phone && <p style={{ margin: 0 }}>📞 {v.phone}</p>}
                      </div>
                    </div>
                  ))}
                  {vendors.length === 0 && <div className="dark-empty" style={{ gridColumn: '1/-1' }}>No vendors added yet.</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal — Multi-line with GST */}
      {showInvoiceModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '700px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', margin: 0, fontSize: '18px', fontWeight: 800 }}>Create Invoice</h2>
              <button onClick={() => setShowInvoiceModal(false)} className="icon-btn"><X size={16} /></button>
            </div>
            <form onSubmit={handleInvoiceSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="dark-label">Customer *</label>
                  <select className="dark-input" required value={invoiceForm.customer_id} onChange={e => setInvoiceForm({ ...invoiceForm, customer_id: e.target.value })}>
                    <option value="">Select customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="dark-label">Due Date *</label>
                  <input type="date" className="dark-input" required value={invoiceForm.due_date} onChange={e => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="dark-label" style={{ margin: 0 }}>Line Items</label>
                  <button type="button" onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: '7px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={12} /> Add Line
                  </button>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 60px 90px 80px 100px 32px', gap: '1px', background: 'rgba(255,255,255,0.05)', padding: '8px 12px' }}>
                    {['Description', 'Qty', 'Rate (₹)', 'GST %', 'Amount', ''].map((h, i) => (
                      <p key={i} style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</p>
                    ))}
                  </div>
                  {invoiceForm.items.map((item, idx) => {
                    const base = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
                    const gstAmt = base * ((parseFloat(item.gst_rate) || 0) / 100);
                    const total = base + gstAmt;
                    return (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 60px 90px 80px 100px 32px', gap: '8px', padding: '10px 12px', borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center' }}>
                        <input type="text" className="dark-input" placeholder="Service or product description" required value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} style={{ fontSize: '12.5px', padding: '8px 10px' }} />
                        <input type="number" className="dark-input" placeholder="1" min="1" required value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} style={{ fontSize: '12.5px', padding: '8px 10px' }} />
                        <input type="number" className="dark-input" placeholder="0.00" min="0" step="0.01" required value={item.price} onChange={e => updateItem(idx, 'price', e.target.value)} style={{ fontSize: '12.5px', padding: '8px 10px' }} />
                        <select className="dark-input" value={item.gst_rate} onChange={e => updateItem(idx, 'gst_rate', e.target.value)} style={{ fontSize: '12px', padding: '8px 10px' }}>
                          {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                        <p style={{ color: '#34d399', fontWeight: 700, fontSize: '13px', margin: 0, textAlign: 'right' }}>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        <button type="button" onClick={() => removeItem(idx)} style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: '7px', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', opacity: invoiceForm.items.length === 1 ? 0.3 : 1 }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                  {/* Totals */}
                  <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', gap: '32px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>Subtotal:</span>
                        <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '32px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>GST Total:</span>
                        <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>₹{gstTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '32px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px', marginTop: '4px' }}>
                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>Grand Total:</span>
                        <span style={{ color: '#34d399', fontSize: '16px', fontWeight: 900, minWidth: '80px', textAlign: 'right' }}>₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="dark-label">Notes (optional)</label>
                <textarea className="dark-input" rows="2" placeholder="Payment terms, bank details, special instructions..." value={invoiceForm.notes} onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Generate Invoice · ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '480px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', margin: 0, fontSize: '18px', fontWeight: 800 }}>Add Customer</h2>
              <button onClick={() => setShowCustomerModal(false)} className="icon-btn"><X size={16} /></button>
            </div>
            <form onSubmit={handleCustomerSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { field: 'name', label: 'Company Name *', type: 'text', required: true, placeholder: 'Acme Corp' },
                { field: 'contact_person', label: 'Contact Person', type: 'text', placeholder: 'John Doe' },
                { field: 'email', label: 'Email *', type: 'email', required: true, placeholder: 'billing@acme.com' },
                { field: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 98765 43210' },
                { field: 'address', label: 'Address', type: 'text', placeholder: 'City, State, PIN' },
              ].map(({ field, label, type, required, placeholder }) => (
                <div key={field}>
                  <label className="dark-label">{label}</label>
                  <input type={type} className="dark-input" required={required} placeholder={placeholder}
                    value={customerForm[field]} onChange={e => setCustomerForm({ ...customerForm, [field]: e.target.value })} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowCustomerModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
