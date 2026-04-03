import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import {
  LayoutDashboard, Package, Landmark, ShoppingBag, ShoppingCart, Calculator,
  FileBarChart, ChevronRight, ChevronDown, Plus, LogOut, Users, FileText,
  CreditCard, Receipt, BookOpen, TrendingUp, AlertCircle, CheckCircle,
  Clock, X, Search, Bell, Settings, RefreshCw, Download, Filter, Eye,
  ArrowUpRight, ArrowDownRight, Building2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const Z = {
  sidebar: '#f4f5f7', sidebarText: '#444', sidebarHover: '#e8edf3',
  sidebarActive: '#dfe9f7', sidebarBorder: '#e0e4ea',
  primary: '#1877c4', primaryHover: '#1465a8', primaryLight: '#e8f1fc',
  bg: '#f8f9fc', white: '#ffffff', text: '#3d4249', soft: '#6b7280',
  border: '#e0e4ea', header: '#ffffff', success: '#27ae60', danger: '#e53935',
  warning: '#f5a623', info: '#2196f3',
};

const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = s => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const StatusBadge = ({ status }) => {
  const map = { 
    paid: ['#e8f5e9','#2e7d32'], 
    draft: ['#fff8e1','#f57f17'], 
    pending: ['#fff3e0','#e65100'], 
    overdue: ['#fce4ec','#c62828'], 
    open: ['#e3f2fd','#1565c0'],
    active: ['#e8f5e9','#2e7d32'],
    inactive: ['#f3f4f6','#374151'],
    posted: ['#e8f5e9','#2e7d32'],
  };
  const [bg, col] = map[status?.toLowerCase()] || ['#f3f4f6','#374151'];
  return <span style={{ background: bg, color: col, padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize' }}>{status || 'Unknown'}</span>;
};

const Table = ({ cols, rows, empty = 'No records found.' }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
      <thead>
        <tr style={{ background: '#f0f2f7' }}>
          {cols.map((c, i) => <th key={i} style={{ padding: '12px 16px', textAlign: 'left', color: Z.soft, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: `1px solid ${Z.border}` }}>{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? 
          <tr><td colSpan={cols.length} style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>{empty}</td></tr> : 
          rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${Z.border}`, transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafd'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{r}</tr>
          ))
        }
      </tbody>
    </table>
  </div>
);

const TD = ({ children, bold, muted, mono, right }) => (
  <td style={{ padding: '14px 16px', color: bold ? Z.text : muted ? '#9ca3af' : Z.text, fontWeight: bold ? 600 : 400, fontFamily: mono ? 'monospace' : 'inherit', textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap' }}>{children}</td>
);

const Card = ({ children, style }) => (
  <div style={{ background: Z.white, border: `1px solid ${Z.border}`, borderRadius: '8px', ...style }}>{children}</div>
);

const Btn = ({ onClick, children, variant = 'primary', small }) => {
  const styles = {
    primary: { background: Z.primary, color: '#fff', border: 'none' },
    secondary: { background: '#fff', color: Z.text, border: `1px solid ${Z.border}` },
    danger: { background: Z.danger, color: '#fff', border: 'none' },
  };
  return <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: small ? '6px 12px' : '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', ...styles[variant] }}>{children}</button>;
};

// ── VIEWS ──
const ViewDashboard = ({ summary, invoices, customers }) => {
  const kpis = [
    { label: 'Total Receivables', value: summary?.total_revenue, icon: ArrowUpRight, color: Z.success },
    { label: 'Total Payables', value: summary?.total_expense, icon: ArrowDownRight, color: Z.danger },
    { label: 'Net Profit', value: summary?.net_profit, icon: TrendingUp, color: Z.info },
    { label: 'Bank Balance', value: summary?.bank_balance, icon: Landmark, color: Z.primary },
  ];

  const chartData = [
    { name: 'Oct', in: 150000, out: 120000 },
    { name: 'Nov', in: 220000, out: 145000 },
    { name: 'Dec', in: 195000, out: 160000 },
    { name: 'Jan', in: 280000, out: 210000 },
    { name: 'Feb', in: 310000, out: 230000 },
    { name: 'Mar', in: summary?.total_revenue || 0, out: summary?.total_expense || 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {kpis.map((k, i) => (
          <Card key={i} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, color: Z.soft, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{k.label}</p>
                <p style={{ margin: '8px 0 0', fontSize: '22px', fontWeight: 800, color: Z.text }}>{fmt(k.value)}</p>
              </div>
              <div style={{ background: k.color + '15', padding: '10px', borderRadius: '8px' }}>
                <k.icon size={20} color={k.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <Card style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 700 }}>Cash Flow Trend</h3>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={20}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: Z.soft }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: Z.soft }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => fmt(v)} cursor={{ fill: '#f8f9fc' }} />
                <Bar dataKey="in" fill={Z.success} radius={[4, 4, 0, 0]} name="Inflow" />
                <Bar dataKey="out" fill={Z.danger} radius={[4, 4, 0, 0]} name="Outflow" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 700 }}>Profitability</h3>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="name" hide />
                <Tooltip formatter={v => fmt(v)} />
                <Line type="monotone" dataKey="in" stroke={Z.primary} strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="out" stroke={Z.danger} strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700 }}>Recent Invoices</h3>
        <Table cols={['Invoice #', 'Customer', 'Date', 'Amount', 'Status']} rows={invoices.slice(0, 5).map(inv => [
          <TD key={1} bold><span style={{ color: Z.primary }}>{inv.invoice_number || 'INV-001'}</span></TD>,
          <TD key={2}>{customers.find(c => c.id === inv.customer_id)?.name || 'Walk-in'}</TD>,
          <TD key={3} muted>{fmtDate(inv.created_at)}</TD>,
          <TD key={4} right bold>{fmt(inv.total_amount)}</TD>,
          <TD key={5}><StatusBadge status={inv.status} /></TD>
        ])} />
      </Card>
    </div>
  );
};

const ViewList = ({ title, cols, rows }) => (
  <Card style={{ padding: '0' }}>
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${Z.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{title}</h3>
      <Btn small><Plus size={14} /> Add New</Btn>
    </div>
    <Table cols={cols} rows={rows} />
  </Card>
);

const ViewReports = ({ type, data }) => (
  <Card style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>{type === 'pnl' ? 'Profit & Loss Statement' : 'Balance Sheet'}</h2>
      <p style={{ color: Z.soft, marginTop: '8px' }}>For the period ended 31 March 2026</p>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {type === 'pnl' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${Z.border}` }}><span>Operating Revenue</span><strong>{fmt(data?.total_revenue)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${Z.border}` }}><span>Operating Expense</span><strong style={{ color: Z.danger }}>{fmt(data?.total_expense)}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: (data?.net_profit || 0) >= 0 ? '#e8f5e9' : '#fce4ec', borderRadius: '8px', marginTop: '16px' }}>
            <span style={{ fontWeight: 800 }}>NET PROFIT / (LOSS)</span>
            <span style={{ fontWeight: 800, fontSize: '18px', color: (data?.net_profit || 0) >= 0 ? Z.success : Z.danger }}>{fmt(data?.net_profit)}</span>
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
           <div><h4 style={{ textTransform: 'uppercase', fontSize: '12px', color: Z.soft }}>Assets</h4><div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}><span>Total Assets</span><strong>{fmt(data?.total_assets)}</strong></div></div>
           <div><h4 style={{ textTransform: 'uppercase', fontSize: '12px', color: Z.soft }}>Liabilities</h4><div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}><span>Total Liabilities</span><strong>{fmt(data?.total_liabilities)}</strong></div></div>
        </div>
      )}
    </div>
  </Card>
);

export default function AccountantPortal({ user, onLogout }) {
  const [active, setActive] = useState('dashboard');
  const [expanded, setExpanded] = useState({ sales: true, purchases: false, accountant: false, reports: false });
  const [data, setData] = useState({ summary: null, invoices: [], customers: [], vendors: [], inventory: [], accounts: [], banks: [], journals: [], reports: { pnl: null, bs: null } });
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    const h = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    const get = async p => axios.get(`${API}/${p}`, { headers: h }).then(r => r.data).catch(() => null);
    const [s, i, c, v, it, ac, bk, jr, pnl, bs] = await Promise.all([ get('ledger/summary'), get('invoices'), get('customers'), get('vendors'), get('inventory'), get('ledger/accounts'), get('ledger/bank'), get('ledger/journal'), get('ledger/pnl'), get('ledger/balance-sheet') ]);
    setData({ summary: s, invoices: i || [], customers: c || [], vendors: v || [], inventory: it || [], accounts: ac || [], banks: bk || [], journals: jr || [], reports: { pnl, bs } });
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'banking', label: 'Banking', icon: Landmark },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'sales', label: 'Sales', icon: ShoppingBag, children: [ { id: 'customers', label: 'Customers' }, { id: 'invoices', label: 'Invoices' } ] },
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart, children: [ { id: 'vendors', label: 'Vendors' }, { id: 'bills', label: 'Bills' } ] },
    { id: 'accountant', label: 'Accountant', icon: Calculator, children: [ { id: 'coa', label: 'Chart of Accounts' }, { id: 'journals', label: 'Manual Journals' } ] },
    { id: 'reports', label: 'Reports', icon: FileBarChart, children: [ { id: 'pnl', label: 'Profit & Loss' }, { id: 'bs', label: 'Balance Sheet' } ] },
  ];

  const renderContent = () => {
    if (loading) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RefreshCw size={32} className="animate-spin" color={Z.primary} /></div>;
    const { summary, invoices, customers, vendors, inventory, accounts, banks, journals, reports } = data;
    switch (active) {
      case 'dashboard': return <ViewDashboard summary={summary} invoices={invoices} customers={customers} />;
      case 'banking': return <ViewList title="Bank Accounts" cols={['Bank Name', 'Account Name', 'Number', 'Balance']} rows={banks.map(b => [<TD key={1} bold>{b.bank_name}</TD>, <TD key={2}>{b.account_name}</TD>, <TD key={3} mono muted>{b.account_number}</TD>, <TD key={4} right bold>{fmt(b.balance)}</TD>])} />;
      case 'customers': return <ViewList title="Customers" cols={['Name', 'Email', 'Phone', 'Total Invoiced']} rows={customers.map(c => [<TD key={1} bold>{c.name}</TD>, <TD key={2}>{c.email}</TD>, <TD key={3} muted>{c.phone}</TD>, <TD key={4} right bold>{fmt(invoices.filter(i => i.customer_id === c.id).reduce((s, i) => s + (i.total_amount || 0), 0))}</TD>])} />;
      case 'invoices': return <ViewList title="Invoices" cols={['Number', 'Customer', 'Date', 'Amount', 'Status']} rows={invoices.map(i => [<TD key={1} bold>{i.invoice_number}</TD>, <TD key={2}>{customers.find(c => c.id === i.customer_id)?.name}</TD>, <TD key={3} muted>{fmtDate(i.created_at)}</TD>, <TD key={4} right bold>{fmt(i.total_amount)}</TD>, <TD key={5}><StatusBadge status={i.status} /></TD>])} />;
      case 'coa': return <ViewList title="Chart of Accounts" cols={['Code', 'Name', 'Type', 'Balance']} rows={accounts.map(a => [<TD key={1} mono muted>{a.code}</TD>, <TD key={2} bold>{a.name}</TD>, <TD key={3} muted>{a.type}</TD>, <TD key={4} right bold>{fmt(a.current_balance)}</TD>])} />;
      case 'journals': return <ViewList title="Manual Journals" cols={['Date', 'Number', 'Narration', 'Amount']} rows={journals.map(j => [<TD key={1} muted>{fmtDate(j.date)}</TD>, <TD key={2} bold>{j.entry_number}</TD>, <TD key={3} muted>{j.narration}</TD>, <TD key={4} right bold>{fmt(j.total_debit)}</TD>])} />;
      case 'pnl': return <ViewReports type="pnl" data={reports.pnl} />;
      case 'bs': return <ViewReports type="bs" data={reports.bs} />;
      default: return <Card style={{ padding: '60px', textAlign: 'center' }}><Settings size={48} color={Z.border} style={{ margin: '0 auto 16px' }} /><h3 style={{ margin: 0, color: Z.soft }}>Coming Soon</h3></Card>;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: Z.bg, color: Z.text, fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      <div style={{ width: '250px', background: Z.sidebar, borderRight: `1px solid ${Z.sidebarBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px', borderBottom: `1px solid ${Z.sidebarBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}><div style={{ background: Z.primary, padding: '8px', borderRadius: '10px' }}><Calculator size={20} color="#fff" /></div><div><h1 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>PRSK Books</h1><p style={{ fontSize: '11px', color: Z.soft, margin: 0, fontWeight: 700 }}>ACCOUNTANT PORTAL</p></div></div>
          <div style={{ background: '#fff', border: `1px solid ${Z.border}`, borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}><span style={{ fontSize: '13px', fontWeight: 600 }}>{data.summary?.company?.name || 'My Organization'}</span><ChevronDown size={14} color={Z.soft} /></div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {navItems.map(n => (
            <div key={n.id}>
              <div onClick={() => n.children ? setExpanded(p => ({ ...p, [n.id]: !p[n.id] })) : setActive(n.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', cursor: 'pointer', background: active === n.id ? Z.sidebarActive : 'transparent', color: active === n.id ? Z.primary : Z.sidebarText, borderLeft: `3px solid ${active === n.id ? Z.primary : 'transparent'}`, fontSize: '13px', fontWeight: active === n.id ? 600 : 400 }}>
                {n.icon && <n.icon size={16} style={{ opacity: active === n.id ? 1 : 0.6 }} />}<span style={{ flex: 1 }}>{n.label}</span>{n.children && (expanded[n.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
              </div>
              {n.children && expanded[n.id] && n.children.map(c => <div key={c.id} onClick={() => setActive(c.id)} style={{ padding: '8px 20px 8px 46px', cursor: 'pointer', fontSize: '13px', color: active === c.id ? Z.primary : Z.sidebarText, background: active === c.id ? Z.sidebarActive : 'transparent', fontWeight: active === c.id ? 600 : 400 }}>{c.label}</div>)}
            </div>
          ))}
        </div>
        <div style={{ padding: '16px', borderTop: `1px solid ${Z.sidebarBorder}` }}><div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#fff', border: `1px solid ${Z.border}`, borderRadius: '10px' }}><div style={{ background: Z.primary, width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '12px' }}>{user?.name?.[0].toUpperCase()}</div><div style={{ flex: 1, overflow: 'hidden' }}><p style={{ margin: 0, fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name}</p></div><LogOut size={16} color={Z.soft} onClick={onLogout} style={{ cursor: 'pointer' }} /></div></div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: '64px', background: Z.header, borderBottom: `1px solid ${Z.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{navItems.find(n => n.id === active)?.label || navItems.flatMap(n => n.children || []).find(c => c.id === active)?.label || 'Portal'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><div style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: Z.soft }} /><input placeholder="Search metrics..." style={{ background: Z.bg, border: 'none', borderRadius: '8px', padding: '10px 16px 10px 40px', fontSize: '13px', width: '240px', outline: 'none' }} /></div><Btn variant="secondary" small onClick={fetch}><RefreshCw size={14} /></Btn><Btn><Plus size={16} /> New</Btn></div>
        </header>
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>{renderContent()}</main>
      </div>
    </div>
  );
}
