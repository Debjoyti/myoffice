import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, X, Receipt, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Finance = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [invoiceForm, setInvoiceForm] = useState({ 
    customer_id: '', items: [{ name: '', quantity: 1, price: 0 }], total_amount: 0, due_date: '' 
  });
  const [customerForm, setCustomerForm] = useState({ 
    name: '', contact_person: '', email: '', phone: '', address: '' 
  });

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [invRes, custRes] = await Promise.all([
        axios.get(`${API}/invoices`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/customers`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setInvoices(invRes.data);
      setCustomers(custRes.data);
    } catch { toast.error('Failed to fetch finance data'); }
    setLoading(false);
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const total = invoiceForm.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
      await axios.post(`${API}/invoices`, { ...invoiceForm, total_amount: total }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Invoice generated');
      setShowInvoiceModal(false);
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
      fetchData();
    } catch { toast.error('Failed to add customer'); }
  };

  const getCustomerName = (id) => customers.find(c => c.id === id)?.name || 'Unknown';

  const getTabStyle = (tabId) => ({
    padding: '12px 20px',
    border: 'none',
    background: activeTab === tabId ? 'rgba(99,102,241,0.1)' : 'transparent',
    color: activeTab === tabId ? '#818cf8' : 'rgba(255,255,255,0.5)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    transition: 'all 0.2s',
  });

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="finance" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 className="page-title">Finance &amp; Books</h1>
                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px' }}>FB60</span>
              </div>
              <p className="page-subtitle">Manage invoices, customers, and payments</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => activeTab === 'invoices' ? setShowInvoiceModal(true) : setShowCustomerModal(true)} 
                className="btn-dark-primary"
              >
                <Plus size={18} /> {activeTab === 'invoices' ? 'New Invoice' : 'New Customer'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', width: 'fit-content' }}>
            <button style={getTabStyle('invoices')} onClick={() => setActiveTab('invoices')}>Invoices</button>
            <button style={getTabStyle('customers')} onClick={() => setActiveTab('customers')}>Customers</button>
          </div>

          {loading ? (
            <div className="dark-loading">Loading books...</div>
          ) : (
            <div className="fade-in">
              {activeTab === 'invoices' && (
                <div className="dark-table-wrap">
                  <table>
                    <thead>
                      <tr><th>Invoice #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Due Date</th></tr>
                    </thead>
                    <tbody>
                      {invoices.map(inv => (
                        <tr key={inv.id}>
                          <td style={{ color: '#818cf8', fontWeight: 700 }}>{inv.invoice_number}</td>
                          <td>{getCustomerName(inv.customer_id)}</td>
                          <td style={{ color: '#fff', fontWeight: 600 }}>₹{inv.total_amount.toLocaleString()}</td>
                          <td>
                            <span className={inv.status === 'paid' ? 'badge-green' : 'badge-amber'}>{inv.status}</span>
                          </td>
                          <td>{new Date(inv.due_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {invoices.length === 0 && <div className="dark-empty">No invoices found. Click "New Invoice" to start.</div>}
                </div>
              )}

              {activeTab === 'customers' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {customers.map(cust => (
                    <div key={cust.id} className="dark-card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                          <Users size={20} />
                        </div>
                        <div>
                          <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>{cust.name}</h3>
                          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '12px' }}>{cust.contact_person}</p>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <p style={{ margin: 0 }}>📧 {cust.email}</p>
                        <p style={{ margin: 0 }}>📞 {cust.phone || 'N/A'}</p>
                        <p style={{ margin: 0 }}>📍 {cust.address || 'No address'}</p>
                      </div>
                    </div>
                  ))}
                  {customers.length === 0 && <div className="dark-empty" style={{ gridColumn: '1/-1' }}>No customers found.</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '600px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', margin: 0 }}>Create Invoice</h2>
              <button onClick={() => setShowInvoiceModal(false)} className="icon-btn"><X /></button>
            </div>
            <form onSubmit={handleInvoiceSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Select Customer</label>
                <select 
                  className="dark-input" 
                  required 
                  value={invoiceForm.customer_id} 
                  onChange={e => setInvoiceForm({...invoiceForm, customer_id: e.target.value})}
                >
                  <option value="">Select customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: '10px' }}>
                <label className="dark-label">Item</label>
                <label className="dark-label">Qty</label>
                <label className="dark-label">Rate</label>
                <input 
                  type="text" className="dark-input" placeholder="Service/Product" required 
                  onChange={e => {
                    const items = [...invoiceForm.items];
                    items[0].name = e.target.value;
                    setInvoiceForm({...invoiceForm, items});
                  }}
                />
                <input 
                  type="number" className="dark-input" placeholder="1" required 
                  onChange={e => {
                    const items = [...invoiceForm.items];
                    items[0].quantity = parseInt(e.target.value) || 0;
                    setInvoiceForm({...invoiceForm, items});
                  }}
                />
                <input 
                  type="number" className="dark-input" placeholder="0" required 
                  onChange={e => {
                    const items = [...invoiceForm.items];
                    items[0].price = parseFloat(e.target.value) || 0;
                    setInvoiceForm({...invoiceForm, items});
                  }}
                />
              </div>
              <div>
                <label className="dark-label">Due Date</label>
                <input 
                  type="date" className="dark-input" required 
                  value={invoiceForm.due_date} 
                  onChange={e => setInvoiceForm({...invoiceForm, due_date: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '500px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', margin: 0 }}>Add Customer</h2>
              <button onClick={() => setShowCustomerModal(false)} className="icon-btn"><X /></button>
            </div>
            <form onSubmit={handleCustomerSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Company Name</label>
                <input 
                  type="text" className="dark-input" required 
                  value={customerForm.name} 
                  onChange={e => setCustomerForm({...customerForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="dark-label">Email</label>
                <input 
                  type="email" className="dark-input" required 
                  value={customerForm.email} 
                  onChange={e => setCustomerForm({...customerForm, email: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
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
