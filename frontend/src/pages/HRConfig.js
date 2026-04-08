import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import {
  Plus, X, Trash2, Users, ClipboardList, FileText, Gift, Calendar, Clock,
  CreditCard, Star, ChevronDown, ChevronRight, Download, RefreshCw, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SectionCard = ({ title, icon: Icon, color, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: '14px',
        background: 'none', border: 'none', cursor: 'pointer', borderBottom: open ? '1px solid rgba(255,255,255,0.07)' : 'none'
      }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff', flex: 1, textAlign: 'left' }}>{title}</span>
        {open ? <ChevronDown size={18} color="rgba(255,255,255,0.3)" /> : <ChevronRight size={18} color="rgba(255,255,255,0.3)" />}
      </button>
      {open && <div style={{ padding: '24px' }}>{children}</div>}
    </div>
  );
};

const Toggle = ({ value, onChange, label, small }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
    {label && <span style={{ fontSize: small ? '12px' : '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{label}</span>}
    <button onClick={() => onChange(!value)} style={{
      width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', flexShrink: 0,
      background: value ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.15)', position: 'relative', transition: 'background 0.25s'
    }}>
      <div style={{ position: 'absolute', top: '3px', left: value ? '18px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left 0.25s' }} />
    </button>
  </div>
);

const HRConfig = ({ user, onLogout, isSubComponent }) => {
  const [activeSection, setActiveSection] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [fieldForm, setFieldForm] = useState({ field_name: '', field_type: 'text', is_required: false, options: '', applies_to: 'employee' });

  // Leave Config State
  const [leaveConfig, setLeaveConfig] = useState({
    cl_days: 12, el_days: 15, sl_days: 7, ml_days: 180, lwp_enabled: true, cl_after_attendance: 1, el_after_attendance: 6, sl_after_attendance: 3
  });

  // Festival Gift State
  const [festivalGifts, setFestivalGifts] = useState([
    { festival: 'Diwali', amount: 500, byPost: true },
    { festival: 'Holi', amount: 250, byPost: false },
  ]);

  // Holiday List
  const [holidays, setHolidays] = useState([
    { date: '2026-01-26', name: 'Republic Day' },
    { date: '2026-08-15', name: 'Independence Day' },
    { date: '2026-10-02', name: 'Gandhi Jayanti' },
  ]);

  // Overtime
  const [overtimeConfig, setOvertimeConfig] = useState({ employee: 'all', fromMonth: '', fromYear: '', toMonth: '', toYear: '' });

  // ID Card
  const [idCardConfig, setIdCardConfig] = useState({ panCardSize: 'standard', showPhoto: true, showDesignation: true, showDept: true });

  // Salary Slip
  const [slipMonth, setSlipMonth] = useState(new Date().toISOString().slice(0, 7));
  const [slipEmployee, setSlipEmployee] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
      axios.get(`${API}/hr-fields`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
    ]).then(([empRes, fieldRes]) => {
      setEmployees(empRes.data || []);
      setFields(fieldRes.data || []);
      setLoading(false);
    });
  }, []);

  const addField = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const fd = { ...fieldForm, options: fieldForm.options ? fieldForm.options.split(',').map(o => o.trim()) : null };
      await axios.post(`${API}/hr-fields`, fd, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Field added');
      setShowFieldModal(false);
      setFieldForm({ field_name: '', field_type: 'text', is_required: false, options: '', applies_to: 'employee' });
      const r = await axios.get(`${API}/hr-fields`, { headers: { Authorization: `Bearer ${token}` } });
      setFields(r.data);
    } catch { toast.error('Failed to add field'); }
  };

  const deleteField = async (id) => {
    if (!window.confirm('Delete this field?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/hr-fields/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setFields(fields.filter(f => f.id !== id));
      toast.success('Field deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const generateExperienceLetter = (emp) => {
    const win = window.open('', '_blank');
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    win.document.write(`<!DOCTYPE html><html><head><title>Experience Letter</title>
    <style>body{font-family:Arial,sans-serif;font-size:11pt;padding:30px 40px;color:#111;line-height:1.6;}
    .header{text-align:center;border-bottom:2px solid #333;padding-bottom:16px;margin-bottom:24px;}
    .bold{font-weight:bold}.section{margin-bottom:18px;text-align:justify;}
    .signature{margin-top:60px;display:flex;justify-content:space-between;}
    .sign-box{width:40%;}.sign-line{border-top:1px solid #333;margin-top:50px;padding-top:6px;}
    </style></head><body>
    <div class="header"><h2 style="margin:0">TO WHOMSOEVER IT MAY CONCERN</h2>
    <p style="margin:4px 0">Experience Letter</p></div>
    <div class="section">Date: <b>${today}</b></div>
    <div class="section">This is to certify that <b>${emp.name}</b> ${emp.father_name ? `Son/Daughter of <b>${emp.father_name}</b>,` : ''} was employed with our organization as <b>${emp.designation}</b> in the <b>${emp.department}</b> department.</div>
    <div class="section">Employee joined on <b>${emp.date_of_joining || 'N/A'}</b> and served till <b>${new Date().toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</b>.</div>
    <div class="section">During the tenure, <b>${emp.name}</b> demonstrated professionalism, dedication, and a high degree of integrity. We wish them the very best in all future endeavours.</div>
    <div class="signature">
    <div class="sign-box"><div class="bold">For the Company</div><div class="sign-line"><b>Authorized Signatory</b><br>HR Department</div></div>
    <div class="sign-box" style="text-align:right"><div class="bold">Acknowledged By</div><div class="sign-line"><b>${emp.name}</b><br>Employee</div></div>
    </div><script>window.onload=function(){window.print()}</script></body></html>`);
    win.document.close();
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#fff' }}>
            HR <span style={{ color: '#818cf8' }}>Control Panel</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Enterprise HR administration — Full control, no system enforcement</p>
        </div>
        <button onClick={() => setShowFieldModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', color: '#818cf8', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
          <Plus size={16} /> Add Custom Field
        </button>
      </div>

      {/* Display All Employee Details */}
      <SectionCard title="Employee Database Overview" icon={Users} color="#818cf8" defaultOpen>
        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Loading...</div>
        ) : (
          <div className="dark-table-wrap" style={{ maxHeight: '280px', overflowY: 'auto' }}>
            <table style={{ fontSize: '12px' }}>
              <thead><tr>
                <th>Name</th><th>Emp ID</th><th>Dept</th><th>Designation</th><th>Status</th><th>Skill</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                          {emp.name?.charAt(0) || '?'}
                        </div>
                        {emp.name}
                      </div>
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{emp.emp_id || '—'}</td>
                    <td>{emp.department}</td>
                    <td style={{ color: 'rgba(255,255,255,0.6)' }}>{emp.designation}</td>
                    <td><span className={emp.status === 'active' ? 'badge-green' : 'badge-amber'} style={{ fontSize: '10px' }}>{emp.status}</span></td>
                    <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'capitalize' }}>{emp.skill_category || 'skilled'}</td>
                    <td>
                      <button onClick={() => generateExperienceLetter(emp)} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                        <FileText size={12} /> Exp Letter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {employees.length === 0 && <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No employees found</div>}
          </div>
        )}
      </SectionCard>

      {/* 1. Generate Salary Slip */}
      <SectionCard title="1 · Generate Salary Slip" icon={FileText} color="#10b981">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee</label>
            <select className="dark-input" value={slipEmployee} onChange={e => setSlipEmployee(e.target.value)} style={{ fontSize: '13px' }}>
              <option value="">— All Employees —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Month / Year</label>
            <input type="month" className="dark-input" value={slipMonth} onChange={e => setSlipMonth(e.target.value)} style={{ fontSize: '13px' }} />
          </div>
          <button onClick={() => { toast.info('Navigate to Payroll Engine to configure and generate salary slips'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 20px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#10b981', fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Download size={16} /> Generate Slip
          </button>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
          Tip: Month/Attendance Percentage will be factored in. Joining letter auto-created after first salary slip generation.
        </p>
      </SectionCard>



      {/* 2. Requests (Leave / Gate Pass) */}
      <SectionCard title="2 · Request (Leave & Gate Pass)" icon={CheckCircle} color="#22d3ee">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Manage Leave constraints and Official/Personal Gate Passes. Two-level senior approval required.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {[{ label: 'Leave Request', desc: 'SL / CL / EL / Without Pay / Matr Leave', color: '#22d3ee' },
              { label: 'Official Gate Pass', desc: 'Out time & In time logging', color: '#fbbf24' },
              { label: 'Personal Gate Pass', desc: 'Out time & In time logging', color: '#10b981' }
            ].map((item, i) => (
              <div key={i} style={{ padding: '16px', background: `${item.color}0d`, borderRadius: '12px', border: `1px solid ${item.color}30`, cursor: 'pointer' }} onClick={() => toast.info(`Opened ${item.label} portal`)}>
                <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: item.color }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* 3. Manual Punch */}
      <SectionCard title="3 · Manual Punch Configuration" icon={Clock} color="#f59e0b">
        <div style={{ padding: '16px', background: 'rgba(245,158,11,0.05)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.15)' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Enable manual punch records (In time / Out time) for employees overriding bio-metric devices.</p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#fbbf24', padding: '4px 10px', background: 'rgba(245,158,11,0.1)', borderRadius: '6px' }}>Requires Reason Input</span>
            <span style={{ fontSize: '12px', color: '#10b981', padding: '4px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: '6px' }}>Two-Senior Approval</span>
          </div>
        </div>
      </SectionCard>

      {/* 4. Display */}
      <SectionCard title="4 · Display Pending Activity" icon={ClipboardList} color="#818cf8">
        <div style={{ padding: '16px', background: 'rgba(99,102,241,0.05)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) auto', gap: '20px', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>View aggregated Gate Pass & Pending Leaves per month/year.</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Monitors SL, CL, EL, WPL, Matr quotas across departments.</p>
            </div>
            <button onClick={() => toast.success('Display dashboard opened')} style={{ padding: '8px 18px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#818cf8', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Launch Display Dashboard →
            </button>
          </div>
        </div>
      </SectionCard>

      {/* 5. POSH Compliance (was 3) */}
      <SectionCard title="5 · POSH Compliance & Reporting" icon={ClipboardList} color="#f87171">
        <div style={{ padding: '16px', background: 'rgba(239,68,68,0.05)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.15)' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>POSH Reports are displayed without employee reporting name to protect complainant identity.</p>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Navigate to the POSH module in HRMS → Compliance tab to view, manage, and generate reports.</p>
          <button onClick={() => toast.info('Navigate to HRMS → Compliance tab')} style={{ marginTop: '12px', padding: '8px 18px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Open POSH Reports →
          </button>
        </div>
      </SectionCard>

      {/* 6. Resign */}
      <SectionCard title="6 · Resignation Management" icon={FileText} color="#ef4444">
        <div style={{ padding: '16px', background: 'rgba(239,68,68,0.05)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.15)' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Employee resignation details, notice period (display company rule) and last date.</p>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>After two-senior approval, it transfers to Account Department.</p>
          <button onClick={() => toast.info('Navigate to Resignation Module')} style={{ marginTop: '12px', padding: '8px 18px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Manage Resignations →
          </button>
        </div>
      </SectionCard>

      {/* 7. HR Create Leave Detail */}
      <SectionCard title="7 · HR Create Leave Configuration" icon={Calendar} color="#10b981">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Configure leave types and auto-generation after attendance. Rows 4–6 are custom leave types HR can define.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { key: 'cl', label: 'CL Generate', labelFull: 'Casual Leave (CL)', days: leaveConfig.cl_days, afterKey: 'cl_after_attendance', daysKey: 'cl_days' },
              { key: 'el', label: 'EL Generate', labelFull: 'Earned Leave (EL) / Privilege Leave (PL)', days: leaveConfig.el_days, afterKey: 'el_after_attendance', daysKey: 'el_days' },
              { key: 'sl', label: 'SL Generate', labelFull: 'Sick Leave (SL)', days: leaveConfig.sl_days, afterKey: 'sl_after_attendance', daysKey: 'sl_days' },
            ].map(item => (
              <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px', gap: '12px', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#fff' }}>{item.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{item.labelFull}</p>
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '4px' }}>Days</label>
                  <input type="number" className="dark-input" value={leaveConfig[item.daysKey]} onChange={e => setLeaveConfig({ ...leaveConfig, [item.daysKey]: parseInt(e.target.value) || 0 })} style={{ fontSize: '13px', height: '34px', textAlign: 'center' }} />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '4px' }}>After Att.</label>
                  <input type="number" className="dark-input" value={leaveConfig[item.afterKey]} onChange={e => setLeaveConfig({ ...leaveConfig, [item.afterKey]: parseInt(e.target.value) || 1 })} style={{ fontSize: '13px', height: '34px', textAlign: 'center' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>months after attendance</div>
              </div>
            ))}

            {/* Maternity */}
            <div style={{ padding: '12px 16px', background: 'rgba(244,114,182,0.05)', borderRadius: '10px', border: '1px solid rgba(244,114,182,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#f472b6' }}>Maternity Leave (ML)</p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Only for female employees (sex = Female). Display in offer letter: yes/no</p>
                </div>
                <div style={{ display: 'flex', align: 'center', gap: '12px' }}>
                  <input type="number" placeholder="Days" defaultValue="180" className="dark-input" style={{ width: '80px', fontSize: '13px', height: '34px', textAlign: 'center' }} />
                  <Toggle value={true} onChange={() => {}} label="Show in Offer Letter" small />
                </div>
              </div>
            </div>

            {/* LWP */}
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Leave Without Pay (LWP)</p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>HR-approved basis only</p>
              </div>
              <Toggle value={leaveConfig.lwp_enabled} onChange={v => setLeaveConfig({ ...leaveConfig, lwp_enabled: v })} label="Enabled" small />
            </div>
          </div>
          <button onClick={() => toast.success('Leave configuration saved!')}
            style={{ alignSelf: 'flex-start', padding: '10px 22px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#10b981', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Save Leave Config
          </button>
        </div>
      </SectionCard>

      {/* 8. Festival Gift */}
      <SectionCard title="8 · Festival Gift Management" icon={Gift} color="#f59e0b">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Configure festival gift amounts by post/designation. Fill every year before the festival date.</p>
          {festivalGifts.map((g, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px auto', gap: '12px', alignItems: 'center', padding: '12px 16px', background: 'rgba(245,158,11,0.05)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Festival</label>
                <input className="dark-input" value={g.festival} onChange={e => { const n = [...festivalGifts]; n[i].festival = e.target.value; setFestivalGifts(n); }} style={{ fontSize: '13px', height: '34px' }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>Amount (₹) — Fill Every Year</label>
                <input type="number" className="dark-input" value={g.amount} onChange={e => { const n = [...festivalGifts]; n[i].amount = e.target.value; setFestivalGifts(n); }} style={{ fontSize: '13px', height: '34px' }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>As per Post</label>
                <select className="dark-input" value={g.byPost} onChange={e => { const n = [...festivalGifts]; n[i].byPost = e.target.value === 'true'; setFestivalGifts(n); }} style={{ fontSize: '13px', height: '34px' }}>
                  <option value="true">Yes</option><option value="false">No</option>
                </select>
              </div>
              <button onClick={() => setFestivalGifts(festivalGifts.filter((_, ii) => ii !== i))} style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', alignSelf: 'flex-end' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button onClick={() => setFestivalGifts([...festivalGifts, { festival: '', amount: 0, byPost: false }])}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: '4px 0' }}>
            <Plus size={15} /> Add Festival
          </button>
        </div>
      </SectionCard>

      {/* 9. Create Holiday List */}
      <SectionCard title="9 · Create Holiday List" icon={Calendar} color="#22d3ee">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {holidays.map((h, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: '12px', alignItems: 'center' }}>
              <input type="date" className="dark-input" value={h.date} onChange={e => { const n = [...holidays]; n[i].date = e.target.value; setHolidays(n); }} style={{ fontSize: '12px', height: '36px' }} />
              <input className="dark-input" placeholder="Holiday name" value={h.name} onChange={e => { const n = [...holidays]; n[i].name = e.target.value; setHolidays(n); }} style={{ fontSize: '13px', height: '36px' }} />
              <button onClick={() => setHolidays(holidays.filter((_, ii) => ii !== i))} style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setHolidays([...holidays, { date: '', name: '' }])} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22d3ee', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
              <Plus size={14} /> Add Holiday
            </button>
            <button onClick={() => toast.success('Holiday list saved!')} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
              <CheckCircle size={14} /> Save List
            </button>
          </div>
        </div>
      </SectionCard>

      {/* 10. Overtime */}
      <SectionCard title="10 · Overtime Tracker" icon={Clock} color="#f472b6">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Select Employee</label>
            <select className="dark-input" value={overtimeConfig.employee} onChange={e => setOvertimeConfig({ ...overtimeConfig, employee: e.target.value })} style={{ fontSize: '13px' }}>
              <option value="all">All Employees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto auto 1fr 1fr', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>From:</span>
            <select className="dark-input" style={{ fontSize: '12px', height: '34px' }} value={overtimeConfig.fromMonth} onChange={e => setOvertimeConfig({ ...overtimeConfig, fromMonth: e.target.value })}>
              <option value="">Month</option>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <input type="number" placeholder="Year" className="dark-input" style={{ fontSize: '12px', height: '34px' }} value={overtimeConfig.fromYear} onChange={e => setOvertimeConfig({ ...overtimeConfig, fromYear: e.target.value })} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>→</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>To:</span>
            <select className="dark-input" style={{ fontSize: '12px', height: '34px' }} value={overtimeConfig.toMonth} onChange={e => setOvertimeConfig({ ...overtimeConfig, toMonth: e.target.value })}>
              <option value="">Month</option>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <input type="number" placeholder="Year" className="dark-input" style={{ fontSize: '12px', height: '34px' }} value={overtimeConfig.toYear} onChange={e => setOvertimeConfig({ ...overtimeConfig, toYear: e.target.value })} />
          </div>
          <button onClick={() => toast.success('Overtime report generated!')}
            style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.3)', borderRadius: '10px', color: '#f472b6', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
            <Download size={16} /> Generate Overtime Report
          </button>
        </div>
      </SectionCard>

      {/* 11. Employee ID Card */}
      <SectionCard title="11 · Employee ID Card Settings" icon={CreditCard} color="#a78bfa">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>PAN Card Size Format</label>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255,255,255,0.07)' }}>
                {['standard', 'credit-card', 'A4'].map(size => (
                  <button key={size} onClick={() => setIdCardConfig({ ...idCardConfig, panCardSize: size })} style={{
                    flex: 1, padding: '7px 4px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
                    background: idCardConfig.panCardSize === size ? 'rgba(167,139,250,0.9)' : 'transparent',
                    color: idCardConfig.panCardSize === size ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s'
                  }}>{size}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Toggle value={idCardConfig.showPhoto} onChange={v => setIdCardConfig({ ...idCardConfig, showPhoto: v })} label="Show Employee Photo" small />
              <Toggle value={idCardConfig.showDesignation} onChange={v => setIdCardConfig({ ...idCardConfig, showDesignation: v })} label="Show Designation" small />
              <Toggle value={idCardConfig.showDept} onChange={v => setIdCardConfig({ ...idCardConfig, showDept: v })} label="Show Department" small />
            </div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(167,139,250,0.06)', borderRadius: '14px', border: '1px solid rgba(167,139,250,0.15)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID Card Preview</p>
            <div style={{ background: 'linear-gradient(135deg,#4f46e5,#4338ca)', borderRadius: '10px', padding: '16px', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {idCardConfig.showPhoto && <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700 }}>A</div>}
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>Arjun Mehta</p>
                  {idCardConfig.showDesignation && <p style={{ margin: '1px 0', fontSize: '10px', opacity: 0.8 }}>Sr. Software Engineer</p>}
                  {idCardConfig.showDept && <p style={{ margin: 0, fontSize: '10px', opacity: 0.6 }}>Engineering</p>}
                </div>
              </div>
              <div style={{ marginTop: '10px', padding: '6px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '10px', opacity: 0.8 }}>
                EMP: PRSK-2026-001 | PAN: BFQPM1234G
              </div>
            </div>
            <button onClick={() => toast.info('Select an employee to print their ID card')} style={{ padding: '8px', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '8px', color: '#a78bfa', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Print ID Card
            </button>
          </div>
        </div>
      </SectionCard>

      {/* 12. Printout All Documents */}
      <SectionCard title="12 · Printout All Documents" icon={FileText} color="#f59e0b">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            Select employee to generate legally formatted documents (Experience Letter, Offer Letter, etc.).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Select Employee</label>
              <select className="dark-input" id="document-emp-select" style={{ fontSize: '13px' }}>
                <option value="">— Select Employee —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.designation}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => {
                const sel = document.getElementById('document-emp-select');
                if (!sel?.value) return toast.warning('Select employee first');
                toast.success('Offer letter generated');
              }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', color: '#fbbf24', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                Offer Letter
              </button>
              <button onClick={() => {
                const sel = document.getElementById('document-emp-select');
                const emp = employees.find(e => e.id === sel?.value);
                if (!emp) return toast.warning('Select employee first');
                generateExperienceLetter(emp);
              }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 16px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '10px', color: '#fbbf24', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                Experience Letter
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 13. Department & Post */}
      <SectionCard title="13 · Department & Post Configuration" icon={Building2} color="#10b981">
        <div style={{ padding: '16px', background: 'rgba(16,185,129,0.05)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Create or edit departments and specific post/designation designations.</p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input className="dark-input" placeholder="New Department Name" style={{ flex: 1 }} />
            <input className="dark-input" placeholder="Post / Designation" style={{ flex: 1 }} />
            <button onClick={() => toast.success('Department/Post added')} style={{ padding: '10px 18px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Add</button>
          </div>
        </div>
      </SectionCard>

      {/* 14. Weekly Off */}
      <SectionCard title="14 · Weekly Off Configuration" icon={Calendar} color="#ec4899">
        <div style={{ padding: '16px', background: 'rgba(236,72,153,0.05)', borderRadius: '12px', border: '1px solid rgba(236,72,153,0.15)', display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) auto auto', gap: '16px', alignItems: 'end' }}>
          <div>
            <label className="dark-label">Select Weekly Off Policy</label>
            <select className="dark-input">
              <option>Every Sunday</option>
              <option>1st & 3rd Saturday + Sunday</option>
              <option>2nd & 4th Saturday + Sunday</option>
              <option>Custom Date Range</option>
            </select>
          </div>
          <div>
            <label className="dark-label">Till Date (Optional)</label>
            <input type="date" className="dark-input" />
          </div>
          <button onClick={() => toast.success('Weekly off rule updated')} style={{ padding: '10px 18px', background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: '8px', color: '#ec4899', fontSize: '12px', fontWeight: 600, cursor: 'pointer', height: '36px' }}>Apply Rule</button>
        </div>
      </SectionCard>

      {/* 15. Employee Promotion */}
      <SectionCard title="15 · Employee Promotion Detail" icon={Star} color="#6366f1">
        <div style={{ padding: '16px', background: 'rgba(99,102,241,0.05)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="dark-label">Select Employee</label>
              <select className="dark-input">
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.designation})</option>)}
              </select>
            </div>
            <div>
              <label className="dark-label">Promote To (Post & Dept)</label>
              <input className="dark-input" placeholder="e.g. Senior Manager - Sales" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
             <div>
              <label className="dark-label">New Amount (₹)</label>
              <input type="number" className="dark-input" placeholder="0" />
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', paddingBottom: '10px' }}>Per Month</div>
            <button onClick={() => toast.success('Promotion recorded')} style={{ padding: '10px 18px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#818cf8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', height: '36px' }}>Update Record</button>
          </div>
        </div>
      </SectionCard>

      {/* 16. Increment Detail */}
      <SectionCard title="16 · Salary Increment Tracker" icon={RefreshCw} color="#34d399">
        <div style={{ padding: '16px', background: 'rgba(52,211,153,0.05)', borderRadius: '12px', border: '1px solid rgba(52,211,153,0.15)' }}>
           <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Track upcoming and past salary increments.</p>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label className="dark-label">Employee</label>
              <select className="dark-input">
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="dark-label">Increment Amount (₹)</label>
              <input type="number" className="dark-input" placeholder="0" />
            </div>
            <div>
              <label className="dark-label">Effective Date</label>
              <input type="date" className="dark-input" />
            </div>
            <button onClick={() => toast.success('Increment saved')} style={{ padding: '10px 18px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', color: '#34d399', fontSize: '12px', fontWeight: 600, cursor: 'pointer', height: '36px' }}>Apply</button>
          </div>
        </div>
      </SectionCard>

      {/* 17. Transfer Employee */}
      <SectionCard title="17 · Employee Transfer" icon={Users} color="#f43f5e">
        <div style={{ padding: '16px', background: 'rgba(244,63,94,0.05)', borderRadius: '12px', border: '1px solid rgba(244,63,94,0.15)' }}>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 1fr auto', gap: '16px', alignItems: 'end' }}>
             <div>
              <label className="dark-label">Select Employee (From Plant Code)</label>
              <select className="dark-input">
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} (Current: 1 Plant)</option>)}
              </select>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', paddingBottom: '10px', textAlign: 'center' }}>→</div>
            <div>
              <label className="dark-label">To (Select Plant / Company Code)</label>
              <select className="dark-input">
                <option>1 Plant</option><option>2 Plant</option><option>3 Plant</option><option>4 Plant</option>
              </select>
            </div>
            <button onClick={() => toast.success('Employee transferred')} style={{ padding: '10px 18px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '8px', color: '#f43f5e', fontSize: '12px', fontWeight: 600, cursor: 'pointer', height: '36px' }}>Transfer</button>
           </div>
        </div>
      </SectionCard>

      {/* Custom Fields (existing) */}
      <SectionCard title="Custom HR Fields" icon={Plus} color="#6366f1">
        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {fields.map(f => (
              <div key={f.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#fff' }}>{f.field_name}</p>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{f.field_type} · {f.applies_to}</p>
                  <span className={f.is_required ? 'badge-green' : 'badge-amber'} style={{ fontSize: '10px' }}>{f.is_required ? 'Required' : 'Optional'}</span>
                </div>
                <button onClick={() => deleteField(f.id)} style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '7px', padding: '5px', cursor: 'pointer' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {fields.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No custom fields yet. Click "Add Custom Field" to create one.</div>}
          </div>
        )}
      </SectionCard>

      {/* Add Field Modal */}
      {showFieldModal && (
        <div className="dark-modal-overlay">
          <div className="dark-modal" style={{ maxWidth: '480px' }}>
            <div className="dark-modal-header">
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Add Custom HR Field</h2>
              <button onClick={() => setShowFieldModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}><X size={22} /></button>
            </div>
            <form onSubmit={addField} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="dark-label">Field Name *</label>
                <input required className="dark-input" placeholder="e.g., Blood Group, Height" value={fieldForm.field_name} onChange={e => setFieldForm({ ...fieldForm, field_name: e.target.value })} />
              </div>
              <div>
                <label className="dark-label">Field Type</label>
                <select className="dark-input" value={fieldForm.field_type} onChange={e => setFieldForm({ ...fieldForm, field_type: e.target.value })}>
                  <option value="text">Text</option><option value="number">Number</option>
                  <option value="email">Email</option><option value="date">Date</option>
                  <option value="select">Dropdown</option><option value="checkbox">Checkbox</option>
                </select>
              </div>
              {fieldForm.field_type === 'select' && (
                <div>
                  <label className="dark-label">Options (comma separated)</label>
                  <input className="dark-input" placeholder="A+, B+, O+, AB+" value={fieldForm.options} onChange={e => setFieldForm({ ...fieldForm, options: e.target.value })} />
                </div>
              )}
              <div>
                <label className="dark-label">Applies To</label>
                <select className="dark-input" value={fieldForm.applies_to} onChange={e => setFieldForm({ ...fieldForm, applies_to: e.target.value })}>
                  <option value="employee">Employee</option><option value="leave">Leave</option><option value="attendance">Attendance</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="req-field" style={{ width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer' }} checked={fieldForm.is_required} onChange={e => setFieldForm({ ...fieldForm, is_required: e.target.checked })} />
                <label htmlFor="req-field" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', cursor: 'pointer' }}>Required field</label>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowFieldModal(false)} className="btn-dark-cancel" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-dark-primary" style={{ flex: 1, justifyContent: 'center' }}>Add Field</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (isSubComponent) return content;

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} activePage="hr-config" setActivePage={() => {}} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content"><div className="page-inner" style={{ paddingTop: '24px' }}>{content}</div></div>
    </div>
  );
};

export default HRConfig;
