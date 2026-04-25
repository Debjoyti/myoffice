import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Plus, Trash2, Download, FileText, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DEFAULT_EARNINGS = [
  { id: 1, name: 'Basic Salary',        amount: 0, locked: true },
  { id: 2, name: 'House Rent Allowance', amount: 0, locked: true },
  { id: 3, name: 'Special Allowance',   amount: 0, locked: true },
  { id: 4, name: 'Other Allowance',     amount: 0, locked: true }
];

const DEFAULT_DEDUCTIONS = [
  { id: 1, name: 'Provident Fund (EPF)', amount: 0, locked: true },
  { id: 2, name: 'Professional Tax',    amount: 0, locked: true },
  { id: 3, name: 'Income Tax IT',       amount: 0, locked: true },
  { id: 4, name: 'ESI',                 amount: 0, locked: true }
];

const Toggle = ({ value, onChange, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{label}</span>
    <button onClick={() => onChange(!value)} style={{
      width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
      background: value ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.15)',
      position: 'relative', transition: 'background 0.25s', flexShrink: 0
    }}>
      <div style={{ position: 'absolute', top: '3px', left: value ? '18px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </button>
  </div>
);

const PayrollEngine = ({ user, onLogout, isSubComponent }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [ctc, setCtc] = useState(600000);
  const [isMetro, setIsMetro] = useState(true);
  const [pfEnabled, setPfEnabled] = useState(true);
  const [esiEnabled, setEsiEnabled] = useState(false);
  const [esiManual, setEsiManual] = useState(0);
  const [ptEnabled, setPtEnabled] = useState(false);
  const [itEnabled, setItEnabled] = useState(false);
  const [gratuityEnabled, setGratuityEnabled] = useState(false);
  const [foodEnabled, setFoodEnabled] = useState(true);

  const [earnings, setEarnings] = useState(DEFAULT_EARNINGS.map(r => ({ ...r })));
  const [deductions, setDeductions] = useState(DEFAULT_DEDUCTIONS.map(r => ({ ...r })));

  const [validationStart, setValidationStart] = useState('');
  const [validationEnd, setValidationEnd] = useState('');
  const [windowStatus, setWindowStatus] = useState(null);

  // Auto-suggest on CTC or toggle change
  useEffect(() => {
    const monthly = parseFloat(ctc) / 12 || 0;
    const basic = monthly * 0.5;
    const hra = basic * (isMetro ? 0.4 : 0.3);
    const food = foodEnabled ? 2000 : 0;
    const pf = pfEnabled ? Math.min(1800, basic * 0.12) : 0;
    const special = Math.max(0, monthly - basic - hra - food - pf);

    setEarnings(prev => prev.map(row => {
      if (!row.locked) return row;
      let suggested = 0;
      if (row.id === 1) suggested = Math.round(basic);
      if (row.id === 2) suggested = Math.round(hra);
      if (row.id === 3) suggested = Math.round(special);
      if (row.id === 4) suggested = Math.round(food);
      return { ...row, amount: suggested };
    }));

    const esiAmt = esiEnabled
      ? (monthly <= 22000 ? Math.round(monthly * 0.0325) : esiManual)
      : 0;
    const pfAmt = pfEnabled ? Math.round(pf) : 0;
    const ptAmt = ptEnabled ? 200 : 0;
    const itAmt = itEnabled ? 0 : 0;

    setDeductions(prev => prev.map(row => {
      if (!row.locked) return row;
      let suggested = 0;
      if (row.id === 1) suggested = pfAmt;
      if (row.id === 2) suggested = ptAmt;
      if (row.id === 3) suggested = itAmt;
      if (row.id === 4) suggested = esiAmt;
      return { ...row, amount: suggested };
    }));
  }, [ctc, isMetro, pfEnabled, esiEnabled, esiManual, ptEnabled, itEnabled, foodEnabled]);

  // Check validation window
  useEffect(() => {
    if (!validationStart || !validationEnd) { setWindowStatus(null); return; }
    const today = new Date();
    const start = new Date(validationStart);
    const end = new Date(validationEnd);
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    const inWindow = today >= start && today <= end;
    setWindowStatus({ inWindow, daysLeft: Math.max(0, daysLeft), nearExpiry: inWindow && daysLeft <= 3 });
  }, [validationStart, validationEnd]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setEmployees(r.data)).catch(() => {});
  }, []);

  const totalEarnings = earnings.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const totalDeductions = deductions.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const netSalary = totalEarnings - totalDeductions;
  const monthlyGross = parseFloat(ctc) / 12 || 0;
  const esiAboveThreshold = esiEnabled && monthlyGross > 22000;

  const updateEarning = (idx, field, val) => {
    setEarnings(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: val }; return n; });
  };
  const updateDeduction = (idx, field, val) => {
    setDeductions(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: val }; return n; });
  };

  const addEarning   = () => setEarnings(p   => [...p, { id: Date.now(), name: '', amount: 0, locked: false }]);
  const addDeduction = () => setDeductions(p => [...p, { id: Date.now(), name: '', amount: 0, locked: false }]);
  const removeE = (i) => setEarnings(p   => p.filter((_, ii) => ii !== i));
  const removeD = (i) => setDeductions(p => p.filter((_, ii) => ii !== i));

  const handleGenerateSalarySlip = () => {
    if (!selectedEmp) { toast.warning('Please select an employee first'); return; }
    const emp = employees.find(e => e.id === selectedEmp);
    const win = window.open('', '_blank');
    win.document.write(generateSalarySlipHTML(emp, earnings, deductions, netSalary, totalEarnings, totalDeductions));
    win.document.close();
    toast.success('Salary slip opened for printing');
  };

  const generateSalarySlipHTML = (emp, earn, ded, net, totalE, totalD) => `
    <!DOCTYPE html><html><head><title>Salary Slip</title>
    <style>body{font-family:Arial,sans-serif;font-size:10pt;padding:20px;color:#111;}
    table{width:100%;border-collapse:collapse;margin:12px 0;}
    th,td{border:1px solid #999;padding:5px 10px;}
    .header{text-align:center;margin-bottom:20px;border-bottom:2px solid #333;padding-bottom:14px;}
    .bold{font-weight:bold}.bg{background:#eee}.net-row{background:#ccc;font-weight:bold;}
    </style></head><body>
    <div class="header"><h2 style="margin:0">SALARY SLIP</h2>
    <p style="margin:4px 0">Company | Month: ${new Date().toLocaleString('default',{month:'long',year:'numeric'})}</p></div>
    <table style="margin-bottom:16px"><tr><td><b>Employee:</b> ${emp?.name||'N/A'}</td><td><b>Designation:</b> ${emp?.designation||'N/A'}</td></tr>
    <tr><td><b>Emp ID:</b> ${emp?.emp_id||'N/A'}</td><td><b>Dept:</b> ${emp?.department||'N/A'}</td></tr>
    <tr><td><b>PAN:</b> ${emp?.pan_number||'N/A'}</td><td><b>ESI No:</b> ${emp?.esi_number||'N/A'}</td></tr></table>
    <table><thead><tr><th>Particulars (Earnings)</th><th>Amount(₹)</th><th>Particulars (Deductions)</th><th>Amount(₹)</th></tr></thead>
    <tbody>${earn.map((e,i)=>`<tr><td>${i+1}. ${e.name||'-'}</td><td>${e.name||e.amount>0?Math.round(e.amount||0).toLocaleString('en-IN'):''}</td>
    <td>${i+1}. ${ded[i]?.name||'-'}</td><td>${ded[i]?.name||ded[i]?.amount>0?Math.round(ded[i]?.amount||0).toLocaleString('en-IN'):''}</td></tr>`).join('')}
    <tr class="bg"><td><b>Total Earnings</b></td><td><b>${Math.round(totalE).toLocaleString('en-IN')}</b></td>
    <td><b>Total Deductions</b></td><td><b>${Math.round(totalD).toLocaleString('en-IN')}</b></td></tr>
    <tr class="net-row"><td colspan="2"><b>Net Salary: ₹${Math.round(net).toLocaleString('en-IN')}</b></td><td colspan="2"></td></tr>
    </tbody></table>
    <script>window.onload=function(){window.print()}</script></body></html>`;

  const rowStyle = { display: 'grid', gridTemplateColumns: '28px 1fr 120px', gap: '8px', alignItems: 'center', padding: '4px 0' };
  const numStyle = { fontSize: '12px', color: 'rgba(255,255,255,0.35)', textAlign: 'center', fontWeight: 600 };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#fff' }}>
            Payroll <span style={{ color: '#10b981' }}>Engine</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
            HR-controlled salary structure · System suggests, HR decides
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleGenerateSalarySlip}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#10b981', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            <FileText size={16} /> Salary Slip
          </button>
          <button onClick={() => { setEarnings(DEFAULT_EARNINGS.map(r => ({ ...r }))); setDeductions(DEFAULT_DEDUCTIONS.map(r => ({ ...r }))); toast.info('Reset to defaults'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            <RefreshCw size={15} /> Reset
          </button>
        </div>
      </div>

      {/* Validation Window Banner */}
      {windowStatus && (
        <div style={{
          padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px',
          background: windowStatus.nearExpiry ? 'rgba(245,158,11,0.1)' : windowStatus.inWindow ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${windowStatus.nearExpiry ? 'rgba(245,158,11,0.3)' : windowStatus.inWindow ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          {windowStatus.inWindow ? <CheckCircle size={18} color={windowStatus.nearExpiry ? '#fbbf24' : '#10b981'} /> : <AlertTriangle size={18} color="#f87171" />}
          <div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#fff' }}>
              {windowStatus.inWindow
                ? windowStatus.nearExpiry ? `⚠️ Change window closes in ${windowStatus.daysLeft} day(s). Submit before ${validationEnd}.` : `✅ Change window open — ${windowStatus.daysLeft} days remaining`
                : '🔒 Change window closed. Edits disabled until HR extends the window.'}
            </p>
            {windowStatus.nearExpiry && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Reminder: File required statutory notifications (PF, ESI, PT) before month end.</p>}
          </div>
        </div>
      )}

      {/* Top Controls Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left: Setup */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '13px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Setup</h3>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Employee</label>
            <select className="dark-input" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} style={{ fontSize: '13px' }}>
              <option value="">— Select Employee —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.emp_id || e.id.slice(0,8)})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Yearly CTC (₹)</label>
            <input type="number" className="dark-input" value={ctc} onChange={e => setCtc(e.target.value)} style={{ fontSize: '14px' }} />
            <div style={{ marginTop: '6px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              Monthly: <span style={{ color: '#fff', fontWeight: 700 }}>₹{Math.round(monthlyGross).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>City Type</label>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255,255,255,0.07)' }}>
                {['Metro', 'Non-Metro'].map(m => (
                  <button key={m} onClick={() => setIsMetro(m === 'Metro')} style={{
                    flex:1, padding: '7px 4px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                    background: (m === 'Metro') === isMetro ? 'rgba(16,185,129,0.9)' : 'transparent',
                    color: (m === 'Metro') === isMetro ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s'
                  }}>{m}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>HRA %</label>
              <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '14px', color: '#10b981', fontWeight: 700 }}>
                {isMetro ? '40%' : '30%'} of Basic
              </div>
            </div>
          </div>
        </div>

        {/* Right: Toggles */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '13px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statutory Toggles</h3>
          <Toggle value={pfEnabled} onChange={setPfEnabled} label="Provident Fund (PF) — 12% of Basic" />
          <Toggle value={esiEnabled} onChange={setEsiEnabled} label="ESI (Employee State Insurance)" />
          {esiAboveThreshold && (
            <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#fbbf24', fontWeight: 600 }}>⚠ Salary exceeds ₹22,000/month threshold — ESI amount requires manual HR input</p>
              <input type="number" className="dark-input" placeholder="ESI monthly amount (₹)" value={esiManual} onChange={e => setEsiManual(parseFloat(e.target.value)||0)} style={{ fontSize: '12px', height: '34px' }} />
            </div>
          )}
          <Toggle value={ptEnabled} onChange={setPtEnabled} label="Professional Tax (PT) — ₹200/month" />
          <Toggle value={itEnabled} onChange={setItEnabled} label="Income Tax (IT / TDS)" />
          <Toggle value={gratuityEnabled} onChange={setGratuityEnabled} label="Gratuity (4.81% of Basic)" />
          <Toggle value={foodEnabled} onChange={setFoodEnabled} label="Food Allowance — ₹2,000/month" />
          {/* Validation Window */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '4px' }}>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change Validation Window</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Start Date</label>
                <input type="date" className="dark-input" value={validationStart} onChange={e => setValidationStart(e.target.value)} style={{ fontSize: '12px', height: '34px' }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>End Date</label>
                <input type="date" className="dark-input" value={validationEnd} onChange={e => setValidationEnd(e.target.value)} style={{ fontSize: '12px', height: '34px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SALARY FORMAT — BILATERAL TABLE */}
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        {/* Section header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' }}>Salary Format</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Rows 1–4 auto-suggested · Unlimited custom rows · HR controlled</p>
          </div>
          <div style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            System Suggestion Mode
          </div>
        </div>

        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ padding: '12px 24px', display: 'grid', gridTemplateColumns: '28px 1fr 120px', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>#</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Particulars (Earnings)</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', textAlign: 'right' }}>Amount (₹)</span>
          </div>
          <div style={{ padding: '12px 24px', display: 'grid', gridTemplateColumns: '28px 1fr 120px', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>#</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Particulars (Deductions)</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', textAlign: 'right' }}>Amount (₹)</span>
          </div>
        </div>

        {/* ── Earnings + Deductions render independently ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {/* EARNINGS column */}
            <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                {earnings.map((earn, idx) => (
                    <div key={earn.id || idx} style={{ padding: '5px 16px 5px 20px', display: 'grid', gridTemplateColumns: '22px 1fr 100px 26px', gap: '7px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontWeight: 600 }}>{idx + 1}</span>
                        {earn.locked
                            ? <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{earn.name}</span>
                            : <input value={earn.name} onChange={e => updateEarning(idx, 'name', e.target.value)} placeholder="Earning name" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '5px 8px', color: '#fff', fontSize: '12px', outline: 'none', width: '100%' }} />
                        }
                        <input type="number" value={earn.amount || ''} onChange={e => updateEarning(idx, 'amount', parseFloat(e.target.value) || 0)} placeholder="0" style={{
                            background: earn.locked ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${earn.locked ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: '7px', padding: '5px 8px', color: earn.locked ? '#10b981' : '#fff', fontSize: '12px', outline: 'none', textAlign: 'right', width: '100%'
                        }} />
                        {!earn.locked
                            ? <button type="button" onClick={() => removeE(idx)} style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '5px', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} /></button>
                            : <span />}
                    </div>
                ))}
                {/* Add earning button */}
                <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <button type="button" onClick={addEarning} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', background: 'rgba(16,185,129,0.08)', border: '1px dashed rgba(16,185,129,0.3)', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, width: '100%', justifyContent: 'center' }}>
                        <Plus size={14} /> Add Earning Row
                    </button>
                </div>
            </div>

            {/* DEDUCTIONS column */}
            <div>
                {deductions.map((ded, idx) => (
                    <div key={ded.id || idx} style={{ padding: '5px 16px 5px 20px', display: 'grid', gridTemplateColumns: '22px 1fr 100px 26px', gap: '7px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.012)' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontWeight: 600 }}>{idx + 1}</span>
                        {ded.locked
                            ? <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{ded.name}</span>
                            : <input value={ded.name} onChange={e => updateDeduction(idx, 'name', e.target.value)} placeholder="Deduction name" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '5px 8px', color: '#fff', fontSize: '12px', outline: 'none', width: '100%' }} />
                        }
                        <input type="number" value={ded.amount || ''} onChange={e => updateDeduction(idx, 'amount', parseFloat(e.target.value) || 0)} placeholder="0" style={{
                            background: ded.locked ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${ded.locked ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: '7px', padding: '5px 8px', color: ded.locked ? '#f87171' : '#fff', fontSize: '12px', outline: 'none', textAlign: 'right', width: '100%'
                        }} />
                        {!ded.locked
                            ? <button type="button" onClick={() => removeD(idx)} style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '5px', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} /></button>
                            : <span />}
                    </div>
                ))}
                {/* Add deduction button */}
                <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <button type="button" onClick={addDeduction} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', background: 'rgba(239,68,68,0.06)', border: '1px dashed rgba(239,68,68,0.3)', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, width: '100%', justifyContent: 'center' }}>
                        <Plus size={14} /> Add Deduction Row
                    </button>
                </div>
            </div>
        </div>

        {/* Totals Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255,255,255,0.04)', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
          <div style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Total Earnings</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>₹{Math.round(totalEarnings).toLocaleString('en-IN')}</span>
          </div>
          <div style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Total Deductions</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#f87171' }}>₹{Math.round(totalDeductions).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Net Salary */}
        <div style={{ padding: '18px 24px', background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))', borderTop: '1px solid rgba(16,185,129,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Net Salary (Monthly)</p>
            <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Total Earnings − Total Deductions</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>₹{Math.round(netSalary).toLocaleString('en-IN')}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>Annual: ₹{Math.round(netSalary * 12).toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* After Generate Notice */}
        <div style={{ padding: '12px 24px', background: 'rgba(244,63,94,0.06)', borderTop: '1px solid rgba(244,63,94,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={14} color="#f87171" />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>After generating offer letter → <span style={{ color: '#f87171', fontWeight: 600 }}>Exit with Reason</span> must be documented</span>
          </div>
          <button onClick={() => { if(!selectedEmp){toast.warning('Select an employee first'); return;} toast.info('Exit reason feature: Use Resignations module'); }}
            style={{ padding: '6px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Exit with Reason
          </button>
        </div>
      </div>

      {/* Gratuity Settings (if enabled) */}
      {gratuityEnabled && (
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(99,102,241,0.2)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '13px', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gratuity Configuration</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Formula (% of Basic)</label>
              <input type="number" className="dark-input" defaultValue="4.81" style={{ fontSize: '13px' }} />
              <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>4.81% = statutory formula</p>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Effective Till</label>
              <input type="date" className="dark-input" style={{ fontSize: '13px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ padding: '14px', background: 'rgba(99,102,241,0.08)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.15)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Monthly Gratuity</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#818cf8' }}>
                  ₹{Math.round((earnings[0]?.amount || 0) * 0.0481).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isSubComponent) return content;

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner" style={{ paddingTop: '24px' }}>{content}</div>
      </div>
    </div>
  );
};

export default PayrollEngine;
