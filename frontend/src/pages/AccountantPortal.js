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
  const map = { paid: ['#e8f5e9','#2e7d32'], draft: ['#fff8e1','#f57f17'], pending: ['#fff3e0','#e65100'], overdue: ['#fce4ec','#c62828'], open: ['#e3f2fd','#1565c0'], filed: ['#e8f5e9','#2e7d32'], posted: ['#e8f5e9','#2e7d32'], available: ['#e8f5e9','#2e7d32'] };
  const [bg, col] = map[status?.toLowerCase()] || ['#f3f4f6','#374151'];
  return <span style={{ background: bg, color: col, padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, textTransform: 'capitalize' }}>{status || 'Unknown'}</span>;
};

const Table = ({ cols, rows, empty = 'No records found.' }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
      <thead>
        <tr style={{ background: '#f0f2f7' }}>
          {cols.map((c, i) => <th key={i} style={{ padding: '10px 16px', textAlign: 'left', color: Z.soft, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: `1px solid ${Z.border}` }}>{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={cols.length} style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>{empty}</td></tr>
          : rows}
      </tbody>
    </table>
  </div>
);

const TR = ({ children, onClick }) => (
  <tr onClick={onClick} style={{ borderBottom: `1px solid ${Z.border}`, cursor: onClick ? 'pointer' : 'default', transition: 'background 0.1s' }}
    onMouseEnter={e => e.currentTarget.style.background = '#f8fafd'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >{children}</tr>
);
const TD = ({ children, bold, muted, mono, right }) => (
  <td style={{ padding: '12px 16px', color: bold ? Z.text : muted ? '#9ca3af' : Z.text, fontWeight: bold ? 600 : 400, fontFamily: mono ? 'monospace' : 'inherit', textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap' }}>{children}</td>
);

const Card = ({ children, style }) => (
  <div style={{ background: Z.white, border: `1px solid ${Z.border}`, borderRadius: '8px', ...style }}>{children}</div>
);
const PageHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
    <div>
      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: Z.text }}>{title}</h2>
      {subtitle && <p style={{ margin: '4px 0 0', color: Z.soft, fontSize: '13px' }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);
const Btn = ({ onClick, children, variant = 'primary', small }) => {
  const styles = {
    primary: { background: Z.primary, color: '#fff', border: 'none' },
    secondary: { background: '#fff', color: Z.text, border: `1px solid ${Z.border}` },
    danger: { background: Z.danger, color: '#fff', border: 'none' },
  };
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: small ? '6px 12px' : '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', ...styles[variant] }}>{children}</button>
  );
};

const NAVITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'items', label: 'Items', icon: Package },
  { id: 'banking', label: 'Banking', icon: Landmark },
  {
    id: 'sales', label: 'Sales', icon: ShoppingBag, children: [
      { id: 'customers', label: 'Customers', icon: Users },
      { id: 'invoices', label: 'Invoices', icon: FileText },
      { id: 'payments_rcvd', label: 'Payments Received', icon: CreditCard },
    ]
  },
  {
    id: 'purchases', label: 'Purchases', icon: ShoppingCart, children: [
      { id: 'vendors', label: 'Vendors', icon: Building2 },
      { id: 'bills', label: 'Bills / Expenses', icon: Receipt },
      { id: 'purchase_orders', label: 'Purchase Orders', icon: BookOpen },
    ]
  },
  {
    id: 'accountant', label: 'Accountant', icon: Calculator, children: [
      { id: 'chart_of_accounts', label: 'Chart of Accounts', icon: BookOpen },
      { id: 'manual_journals', label: 'Manual Journals', icon: FileText },
    ]
  },
  {
    id: 'reports', label: 'Reports', icon: FileBarChart, children: [
      { id: 'pnl', label: 'Profit & Loss', icon: TrendingUp },
      { id: 'balance_sheet', label: 'Balance Sheet', icon: LayoutDashboard },
      { id: 'trial_balance', label: 'Trial Balance', icon: CheckCircle },
      { id: 'gst', label: 'GST / Tax', icon: Receipt },
    ]
  },
];

export default function AccountantPortal({ user, onLogout }) {
  const [active, setActive] = useState('dashboard');
  const [expanded, setExpanded] = useState({ sales: true, purchases: false, accountant: false, reports: false });
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [pos, setPos] = useState([]);
  const [reports, setReports] = useState({ pnl: null, bs: null, tb: null, gst: [] });
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);

  const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const load = async () => {
    try { const { data } = await axios.get(`${API}/ledger/summary`, { headers: hdrs() }); setSummary(data); } catch {}
    const safe = (p, fn) => axios.get(`${API}/${p}`, { headers: hdrs() }).then(r => fn(r.data)).catch(() => {});
    safe('invoices', setInvoices);
    safe('expenses', setExpenses);
    safe('inventory', setInventory);
    safe('customers', setCustomers);
    safe('vendors', setVendors);
    safe('ledger/journal', setJournals);
    safe('ledger/accounts', setAccounts);
    safe('ledger/bank', setBanks);
    safe('purchase_orders', setPos);
    safe('ledger/pnl', d => setReports(p => ({ ...p, pnl: d })));
    safe('ledger/balance-sheet', d => setReports(p => ({ ...p, bs: d })));
    safe('ledger/trial-balance', d => setReports(p => ({ ...p, tb: d })));
    safe('ledger/gst', d => setReports(p => ({ ...p, gst: d })));
  };
  useEffect(() => { load(); }, []);

  const company = summary?.company?.name || user?.name || 'My Organization';
  const toggle = id => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const go = id => { setActive(id); setSearch(''); };

  const cashFlow = [
    { m: 'Oct', in: 180000, out: 120000 }, { m: 'Nov', in: 220000, out: 145000 },
    { m: 'Dec', in: 195000, out: 160000 }, { m: 'Jan', in: 280000, out: 170000 },
    { m: 'Feb', in: 310000, out: 200000 }, { m: 'Mar', in: summary?.total_revenue || 0, out: summary?.total_expense || 0 },
  ];
  const kpis = [
    { label: 'Total Receivables', val: summary?.total_revenue, trend: 'up', icon: ArrowUpRight, color: Z.success },
    { label: 'Total Payables', val: summary?.total_expense, trend: 'down', icon: ArrowDownRight, color: Z.danger },
    { label: 'Net Profit', val: summary?.net_profit, trend: (summary?.net_profit || 0) > 0 ? 'up' : 'down', icon: (summary?.net_profit || 0) > 0 ? ArrowUpRight : ArrowDownRight, color: (summary?.net_profit || 0) >= 0 ? Z.success : Z.danger },
    { label: 'Cash & Bank', val: summary?.bank_balance, trend: 'up', icon: ArrowUpRight, color: Z.primary },
  ];

  const NavItem = ({ item, depth = 0 }) => {
    const hasChildren = item.children?.length;
    const isExpanded = expanded[item.id];
    const isAct = active === item.id;
    const Icon = item.icon;
    return (
      <div>
        <div
          onClick={() => hasChildren ? toggle(item.id) : go(item.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: `9px ${depth ? '12px' : '14px'} 9px ${depth ? '28px' : '14px'}`,
            cursor: 'pointer', borderRadius: '6px', margin: '1px 6px',
            background: isAct ? Z.sidebarActive : 'transparent',
            color: isAct ? Z.primary : Z.sidebarText,
            borderLeft: isAct ? `3px solid ${Z.primary}` : '3px solid transparent',
            fontWeight: isAct ? 600 : 400, fontSize: '13px', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!isAct) e.currentTarget.style.background = Z.sidebarHover; }}
          onMouseLeave={e => { if (!isAct) e.currentTarget.style.background = 'transparent'; }}
        >
          {Icon && <Icon size={15} style={{ flexShrink: 0, opacity: isAct ? 1 : 0.6 }} />}
          <span style={{ flex: 1 }}>{item.label}</span>
          {hasChildren && (isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />)}
        </div>
        {hasChildren && isExpanded && item.children.map(c => <NavItem key={c.id} item={c} depth={1} />)}
      </div>
    );
  };

  const pageTitle = (() => {
    for (const n of NAVITEMS) {
      if (n.id === active) return n.label;
      for (const c of (n.children || [])) if (c.id === active) return c.label;
    }
    return active.replace(/_/g, ' ');
  })();

  // ── VIEWS ──
  const ViewDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <Card key={i} style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, color: Z.soft, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</p>
                  <p style={{ margin: '8px 0 0', fontSize: '22px', fontWeight: 800, color: Z.text }}>{fmt(k.val)}</p>
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: k.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={k.color} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <Card style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: 700, color: Z.text }}>Cash Flow — Last 6 Months</h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlow} barSize={18}>
                <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: Z.soft }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: Z.soft }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="in" fill={Z.success} radius={[4,4,0,0]} name="Inflow" />
                <Bar dataKey="out" fill={Z.danger} radius={[4,4,0,0]} name="Outflow" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: Z.text }}>Summary</h3>
          {[
            { label: 'Accounts', val: summary?.total_accounts || accounts.length },
            { label: 'Journals', val: summary?.journal_count || journals.length },
            { label: 'Invoices', val: invoices.length },
            { label: 'Bank Accounts', val: summary?.bank_accounts || banks.length },
            { label: 'Pending GST', val: summary?.pending_gst || 0 },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 4 ? `1px solid ${Z.border}` : 'none' }}>
              <span style={{ color: Z.soft, fontSize: '13px' }}>{s.label}</span>
              <span style={{ fontWeight: 700, color: Z.text, fontSize: '13px' }}>{s.val}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: Z.text }}>Recent Invoices</h3>
        <Table cols={['Invoice #', 'Customer', 'Date', 'Due Date', 'Amount', 'Status']}
          rows={invoices.slice(0, 5).map(inv => (
            <TR key={inv.id}>
              <TD bold><span style={{ color: Z.primary }}>{inv.invoice_number || inv.id?.slice(0,8).toUpperCase()}</span></TD>
              <TD>{customers.find(c => c.id === inv.customer_id)?.name || 'Walk-in'}</TD>
              <TD muted>{fmtDate(inv.created_at)}</TD>
              <TD muted>{fmtDate(inv.due_date)}</TD>
              <TD right bold>{fmt(inv.total_amount)}</TD>
              <TD><StatusBadge status={inv.status} /></TD>
            </TR>
          ))}
        />
      </Card>
    </div>
  );

  const ViewCustomers = () => {
    const filtered = customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()));
    return (
      <Card>
        <Table cols={['Customer Name', 'Email', 'Phone', 'Total Invoiced', 'Outstanding']}
          rows={filtered.map(c => {
            const civs = invoices.filter(i => i.customer_id === c.id);
            const total = civs.reduce((s, i) => s + (i.total_amount || 0), 0);
            const unpaid = civs.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.total_amount || 0), 0);
            return (
              <TR key={c.id}>
                <TD bold><span style={{ color: Z.primary }}>{c.name}</span></TD>
                <TD>{c.email}</TD>
                <TD muted>{c.phone || '—'}</TD>
                <TD right>{fmt(total)}</TD>
                <TD right><span style={{ color: unpaid > 0 ? Z.danger : Z.success, fontWeight: 700 }}>{fmt(unpaid)}</span></TD>
              </TR>
            );
          })}
        />
      </Card>
    );
  };

  const ViewInvoices = () => {
    const filtered = invoices.filter(i => (i.invoice_number || '').toLowerCase().includes(search.toLowerCase()));
    return (
      <Card>
        <Table cols={['Invoice #', 'Customer', 'Date', 'Due', 'Amount', 'Status', '']}
          rows={filtered.map(inv => (
            <TR key={inv.id}>
              <TD bold><span style={{ color: Z.primary }}>{inv.invoice_number || inv.id?.slice(0,8).toUpperCase()}</span></TD>
              <TD>{customers.find(c => c.id === inv.customer_id)?.name || '—'}</TD>
              <TD muted>{fmtDate(inv.created_at)}</TD>
              <TD muted>{fmtDate(inv.due_date)}</TD>
              <TD right bold>{fmt(inv.total_amount)}</TD>
              <TD><StatusBadge status={inv.status} /></TD>
              <TD><Eye size={14} style={{ color: Z.soft, cursor: 'pointer' }} /></TD>
            </TR>
          ))}
        />
      </Card>
    );
  };

  const ViewPaymentsRcvd = () => {
    const paid = invoices.filter(i => i.status === 'paid');
    return (
      <Card>
        <Table cols={['Date', 'Customer', 'Invoice #', 'Payment Mode', 'Amount']}
          rows={paid.map(p => (
            <TR key={p.id}>
              <TD muted>{fmtDate(p.created_at)}</TD>
              <TD>{customers.find(c => c.id === p.customer_id)?.name || '—'}</TD>
              <TD><span style={{ color: Z.primary, fontWeight: 600 }}>{p.invoice_number || p.id?.slice(0,8).toUpperCase()}</span></TD>
              <TD muted>Bank Transfer</TD>
              <TD right><span style={{ color: Z.success, fontWeight: 700 }}>{fmt(p.total_amount)}</span></TD>
            </TR>
          ))}
        />
      </Card>
    );
  };

  const ViewVendors = () => {
    const filtered = vendors.filter(v => v.name?.toLowerCase().includes(search.toLowerCase()));
    return (
      <Card>
        <Table cols={['Vendor Name', 'Category', 'Email', 'Phone', 'Total Bills']}
          rows={filtered.map(v => {
            const vbills = expenses.filter(e => e.vendor_id === v.id);
            return (
              <TR key={v.id}>
                <TD bold><span style={{ color: Z.primary }}>{v.name}</span></TD>
                <TD muted>{v.category || '—'}</TD>
                <TD muted>{v.email || '—'}</TD>
                <TD muted>{v.phone || '—'}</TD>
                <TD right>{fmt(vbills.reduce((s, e) => s + (e.amount || 0), 0))}</TD>
              </TR>
            );
          })}
        />
      </Card>
    );
  };

  const ViewBills = () => {
    const filtered = expenses.filter(e => (e.category || '').toLowerCase().includes(search.toLowerCase()));
    return (
      <Card>
        <Table cols={['Date', 'Category', 'Description', 'Amount', 'Status']}
          rows={filtered.map(e => (
            <TR key={e.id}>
              <TD muted>{fmtDate(e.date)}</TD>
              <TD>{e.category}</TD>
              <TD muted>{e.description || '—'}</TD>
              <TD right bold>{fmt(e.amount)}</TD>
              <TD><StatusBadge status={e.status} /></TD>
            </TR>
          ))}
        />
      </Card>
    );
  };

  const ViewPO = () => (
    <Card>
      <Table cols={['PO #', 'Vendor', 'Date', 'Amount', 'Status']}
        rows={pos.map(po => (
          <TR key={po.id}>
            <TD bold><span style={{ color: Z.primary }}>{po.id?.slice(0,8).toUpperCase()}</span></TD>
            <TD>{vendors.find(v => v.id === po.vendor_id)?.name || po.supplier_name || '—'}</TD>
            <TD muted>{fmtDate(po.created_at)}</TD>
            <TD right bold>{fmt(po.total_amount)}</TD>
            <TD><StatusBadge status={po.status} /></TD>
          </TR>
        ))}
      />
    </Card>
  );

  const ViewItems = () => {
    const filtered = inventory.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()));
    return (
      <Card>
        <Table cols={['Item Name', 'Category', 'Unit', 'Stock on Hand', 'Unit Price', 'Value']}
          rows={filtered.map(it => (
            <TR key={it.id}>
              <TD bold>{it.name}</TD>
              <TD muted>{it.category}</TD>
              <TD muted>{it.unit}</TD>
              <TD right>{it.quantity}</TD>
              <TD right>{fmt(it.price_per_unit)}</TD>
              <TD right bold>{fmt((it.quantity || 0) * (it.price_per_unit || 0))}</TD>
            </TR>
          ))}
        />
      </Card>
    );
  };

  const ViewBanking = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px' }}>
        {banks.map(b => (
          <Card key={b.id} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', background: Z.primaryLight, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Landmark size={20} color={Z.primary} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: Z.text, fontSize: '15px' }}>{b.bank_name}</p>
                <p style={{ margin: '2px 0 0', color: Z.soft, fontSize: '12px' }}>{b.account_name}</p>
              </div>
            </div>
            <p style={{ margin: '0 0 4px', color: Z.soft, fontSize: '11px', fontFamily: 'monospace' }}>A/C: {b.account_number}</p>
            {b.ifsc && <p style={{ margin: '0 0 12px', color: Z.soft, fontSize: '11px', fontFamily: 'monospace' }}>IFSC: {b.ifsc}</p>}
            <div style={{ borderTop: `1px solid ${Z.border}`, paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: Z.soft, fontSize: '12px' }}>Balance</span>
              <span style={{ fontWeight: 800, fontSize: '18px', color: Z.success }}>{fmt(b.balance)}</span>
            </div>
          </Card>
        ))}
        {banks.length === 0 && (
          <Card style={{ padding: '60px', textAlign: 'center', gridColumn: '1/-1' }}>
            <Landmark size={36} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#9ca3af', margin: 0 }}>No bank accounts linked yet.</p>
          </Card>
        )}
      </div>
    </div>
  );

  const ViewCoA = () => {
    const grouped = ['Asset','Liability','Equity','Revenue','Expense'].map(type => ({
      type, items: accounts.filter(a => a.type === type)
    })).filter(g => g.items.length > 0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {grouped.map(g => (
          <Card key={g.type}>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: `1px solid ${Z.border}`, borderRadius: '8px 8px 0 0' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: Z.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{g.type}</h3>
            </div>
            <Table cols={['Code', 'Account Name', 'Sub-Type', 'Balance']}
              rows={g.items.map(a => (
                <TR key={a.id}>
                  <TD mono muted>{a.code}</TD>
                  <TD bold>{a.name}</TD>
                  <TD muted>{a.sub_type || '—'}</TD>
                  <TD right bold><span style={{ color: (a.current_balance || 0) >= 0 ? Z.text : Z.danger }}>{fmt(a.current_balance)}</span></TD>
                </TR>
              ))}
            />
          </Card>
        ))}
        {accounts.length === 0 && <Card style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: '#9ca3af', margin: 0 }}>No accounts in chart of accounts yet.</p></Card>}
      </div>
    );
  };

  const ViewJournals = () => (
    <Card>
      <Table cols={['Date', 'Journal #', 'Narration', 'Reference', 'Total Debit', 'Status']}
        rows={journals.map(j => (
          <TR key={j.id}>
            <TD muted>{fmtDate(j.date)}</TD>
            <TD bold><span style={{ color: Z.primary }}>{j.entry_number || j.id?.slice(0,8).toUpperCase()}</span></TD>
            <TD>{j.narration || '—'}</TD>
            <TD muted>{j.reference || '—'}</TD>
            <TD right bold>{fmt(j.total_debit)}</TD>
            <TD><StatusBadge status={j.status || 'posted'} /></TD>
          </TR>
        ))}
      />
    </Card>
  );

  const ViewPnL = () => (
    <Card style={{ padding: '32px', maxWidth: '680px', margin: '0 auto' }}>
      <h3 style={{ textAlign: 'center', margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: Z.text }}>Profit & Loss Statement</h3>
      <p style={{ textAlign: 'center', color: Z.soft, fontSize: '13px', margin: '0 0 32px' }}>For the current period</p>
      {[
        { label: 'Operating Revenue', val: reports.pnl?.total_revenue, section: 'income' },
        { label: 'Operating Expenses', val: reports.pnl?.total_expense, section: 'expense' },
      ].map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${Z.border}` }}>
          <span style={{ color: Z.text, fontWeight: 500 }}>{r.label}</span>
          <span style={{ fontWeight: 600, color: r.section === 'expense' ? Z.danger : Z.text }}>{fmt(r.val)}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '18px 20px', background: (reports.pnl?.net_profit || 0) >= 0 ? '#e8f5e9' : '#fce4ec', borderRadius: '8px', marginTop: '16px' }}>
        <span style={{ fontWeight: 800, fontSize: '16px', color: Z.text }}>Net Profit / (Loss)</span>
        <span style={{ fontWeight: 800, fontSize: '18px', color: (reports.pnl?.net_profit || 0) >= 0 ? Z.success : Z.danger }}>{fmt(reports.pnl?.net_profit)}</span>
      </div>
    </Card>
  );

  const ViewBS = () => (
    <Card style={{ padding: '32px', maxWidth: '780px', margin: '0 auto' }}>
      <h3 style={{ textAlign: 'center', margin: '0 0 32px', fontSize: '18px', fontWeight: 700, color: Z.text }}>Balance Sheet</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div>
          <h4 style={{ margin: '0 0 16px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: Z.soft, fontWeight: 700 }}>Assets</h4>
          {[{ label: 'Total Assets', val: reports.bs?.total_assets }].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${Z.border}` }}>
              <span style={{ color: Z.text }}>{r.label}</span>
              <strong>{fmt(r.val)}</strong>
            </div>
          ))}
        </div>
        <div>
          <h4 style={{ margin: '0 0 16px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: Z.soft, fontWeight: 700 }}>Liabilities & Equity</h4>
          {[
            { label: 'Total Liabilities', val: reports.bs?.total_liabilities },
            { label: 'Net Worth / Equity', val: reports.bs?.net_worth, highlight: true },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${Z.border}` }}>
              <span style={{ color: Z.text }}>{r.label}</span>
              <strong style={{ color: r.highlight ? Z.success : Z.text }}>{fmt(r.val)}</strong>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  const ViewTB = () => (
    <Card>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${Z.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: Z.text }}>Trial Balance</h3>
          <p style={{ margin: '2px 0 0', color: Z.soft, fontSize: '12px' }}>Dr: {fmt(reports.tb?.total_debit)} | Cr: {fmt(reports.tb?.total_credit)}</p>
        </div>
        <Btn variant="secondary" small><Download size={14} /> Export</Btn>
      </div>
      <Table cols={['Code', 'Account Name', 'Type', 'Debit', 'Credit']}
        rows={(reports.tb?.rows || []).map((r, i) => (
          <TR key={i}>
            <TD mono muted>{r.code}</TD>
            <TD>{r.name}</TD>
            <TD muted>{r.type}</TD>
            <TD right><span style={{ color: r.debit > 0 ? Z.success : '#9ca3af' }}>{r.debit > 0 ? fmt(r.debit) : '—'}</span></TD>
            <TD right><span style={{ color: r.credit > 0 ? Z.danger : '#9ca3af' }}>{r.credit > 0 ? fmt(r.credit) : '—'}</span></TD>
          </TR>
        ))}
        empty="No trial balance data. Add accounts and journal entries first."
      />
    </Card>
  );

  const ViewGST = () => (
    <Card>
      <Table cols={['Period', 'Type', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Total Tax', 'Status']}
        rows={reports.gst.map(g => (
          <TR key={g.id}>
            <TD bold>{g.period}</TD>
            <TD><span style={{ color: Z.primary, fontWeight: 600 }}>{g.return_type}</span></TD>
            <TD right>{fmt(g.taxable_value)}</TD>
            <TD right>{fmt(g.igst)}</TD>
            <TD right>{fmt(g.cgst)}</TD>
            <TD right>{fmt(g.sgst)}</TD>
            <TD right bold>{fmt(g.total_tax)}</TD>
            <TD><StatusBadge status={g.status || 'draft'} /></TD>
          </TR>
        ))}
        empty="No GST returns filed yet."
      />
    </Card>
  );

  const VIEW_MAP = {
    dashboard: <ViewDashboard />, items: <ViewItems />, banking: <ViewBanking />,
    customers: <ViewCustomers />, invoices: <ViewInvoices />, payments_rcvd: <ViewPaymentsRcvd />,
    vendors: <ViewVendors />, bills: <ViewBills />, purchase_orders: <ViewPO />,
    chart_of_accounts: <ViewCoA />, manual_journals: <ViewJournals />,
    pnl: <ViewPnL />, balance_sheet: <ViewBS />, trial_balance: <ViewTB />, gst: <ViewGST />,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", background: Z.bg, overflow: 'hidden' }}>
      {/* SIDEBAR */}
      <div style={{ width: '230px', background: Z.sidebar, borderRight: `1px solid ${Z.sidebarBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ padding: '18px 16px', borderBottom: `1px solid ${Z.sidebarBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '34px', height: '34px', background: Z.primary, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '15px' }}>B</span>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '15px', color: Z.text }}>BizBooks</p>
              <p style={{ margin: 0, fontSize: '10px', color: Z.soft }}>Accounting Suite</p>
            </div>
          </div>
          <div style={{ background: '#fff', border: `1px solid ${Z.border}`, borderRadius: '6px', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: Z.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{company}</span>
            <ChevronDown size={12} color={Z.soft} />
          </div>
        </div>
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAVITEMS.map(item => <NavItem key={item.id} item={item} />)}
        </nav>
        <div style={{ padding: '12px', borderTop: `1px solid ${Z.sidebarBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '6px', background: '#fff', border: `1px solid ${Z.border}`, marginBottom: '8px' }}>
            <div style={{ width: '30px', height: '30px', background: Z.primary, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '12px' }}>{user?.name?.[0]?.toUpperCase() || 'A'}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '12px', color: Z.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
              <p style={{ margin: 0, fontSize: '10px', color: Z.soft, textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
            <LogOut size={14} color={Z.soft} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={onLogout} />
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* TOP BAR */}
        <header style={{ height: '54px', background: Z.header, borderBottom: `1px solid ${Z.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: Z.text }}>{pageTitle}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {active !== 'dashboard' && active !== 'banking' && active !== 'pnl' && active !== 'balance_sheet' && active !== 'trial_balance' && (
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: Z.soft }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                  style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px', border: `1px solid ${Z.border}`, borderRadius: '6px', fontSize: '13px', background: '#f8f9fc', color: Z.text, outline: 'none', width: '200px' }} />
              </div>
            )}
            <button onClick={load} style={{ background: 'none', border: `1px solid ${Z.border}`, borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={14} color={Z.soft} />
            </button>
            {active === 'invoices' && <Btn onClick={() => {}}><Plus size={14} /> New Invoice</Btn>}
            {active === 'customers' && <Btn onClick={() => {}}><Plus size={14} /> New Customer</Btn>}
            {active === 'vendors' && <Btn onClick={() => {}}><Plus size={14} /> New Vendor</Btn>}
            {active === 'bills' && <Btn onClick={() => {}}><Plus size={14} /> Record Expense</Btn>}
            {active === 'manual_journals' && <Btn onClick={() => {}}><Plus size={14} /> New Journal</Btn>}
            {active === 'chart_of_accounts' && <Btn onClick={() => {}}><Plus size={14} /> New Account</Btn>}
            {active === 'banking' && <Btn onClick={() => {}}><Plus size={14} /> Add Bank</Btn>}
            {active === 'gst' && <Btn onClick={() => {}}><Plus size={14} /> New Return</Btn>}
          </div>
        </header>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {VIEW_MAP[active] || (
            <Card style={{ padding: '60px', textAlign: 'center' }}>
              <AlertCircle size={36} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#9ca3af', margin: 0 }}>View coming soon.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
