import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import {
  Building2, Plus, Search, X, Upload, ChevronRight, ChevronLeft,
  FileText, Phone, Mail, Globe, MapPin, Hash, Stamp, Trash2, Eye,
  CheckCircle, AlertCircle, Edit3
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const INDUSTRIES = [
  'Technology', 'Manufacturing', 'Finance & Banking', 'Healthcare', 'Retail & E-Commerce',
  'Construction', 'Education', 'Logistics & Transport', 'Food & Beverage', 'Consulting',
  'Media & Entertainment', 'Real Estate', 'Agriculture', 'Pharma', 'Government', 'Other'
];

const STEPS = ['Basic Info', 'Contact & Address', 'Tax & Legal', 'Branding', 'Team Onboarding'];

const EMPTY_FORM = {
  name: '', company_code: '', legal_name: '', industry: '', email: '', phone: '', website: '',
  address: '', city: '', state: '', country: 'India', pincode: '',
  pan_number: '', gst_number: '', cin_number: '', logo: '', stamp: '',
  esi_account_no: '', uan_account_no: '', eway_bill_account: '', plants: [], payment_barcode: '', employees: []
};

function imageToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function CompanyCard({ company, onView, onDelete }) {
  const initials = company.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
  const colors = ['var(--brand-primary)', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444'];
  const colorIdx = company.name ? company.name.charCodeAt(0) % colors.length : 0;
  const color = colors[colorIdx];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.3)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Glow strip */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${color}, transparent)` }} />

      {/* Logo / Initials */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
        {company.logo ? (
          <img src={company.logo} alt="logo" style={{ width: '52px', height: '52px', borderRadius: '14px', objectFit: 'contain', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)' }} />
        ) : (
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `linear-gradient(135deg, ${color}33, ${color}11)`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color }}>
            {initials}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{company.name}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '2px 0 0' }}>{company.industry || 'No industry set'}</p>
        </div>
        <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '99px', fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
          Active
        </span>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {company.email && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Mail size={12} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{company.email}</span>
          </div>
        )}
        {company.phone && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Phone size={12} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{company.phone}</span>
          </div>
        )}
        {(company.city || company.state) && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <MapPin size={12} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{[company.city, company.state].filter(Boolean).join(', ')}</span>
          </div>
        )}
      </div>

      {/* Tax badges */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {company.pan_number && (
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(94, 106, 210, 0.1)', color: 'var(--brand-primary)', border: '1px solid rgba(94, 106, 210, 0.2)', fontFamily: 'monospace' }}>
            PAN: {company.pan_number}
          </span>
        )}
        {company.gst_number && (
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', fontFamily: 'monospace' }}>
            GST: {company.gst_number.slice(0, 6)}…
          </span>
        )}
        {company.cin_number && (
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)', fontFamily: 'monospace' }}>
            CIN: {company.cin_number.slice(0, 6)}…
          </span>
        )}
      </div>

      {/* Stamp thumbnail */}
      {company.stamp && (
        <div style={{ marginBottom: '16px', padding: '8px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <img src={company.stamp} alt="stamp" style={{ maxHeight: '48px', opacity: 0.7, filter: 'brightness(0.9)' }} />
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: '4px 0 0' }}>Company Stamp</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => onView(company)} style={{ flex: 1, padding: '8px', background: `${color}18`, border: `1px solid ${color}33`, borderRadius: '10px', color, fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Eye size={13} /> View
        </button>
        <button onClick={() => onDelete(company.id)} style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function UploadBox({ label, value, onChange, accept = 'image/*', hint }) {
  const ref = useRef();
  return (
    <div>
      <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>{label}</label>
      <div
        onClick={() => ref.current.click()}
        style={{
          border: '2px dashed rgba(255,255,255,0.12)', borderRadius: '14px', padding: '24px', cursor: 'pointer',
          background: 'rgba(255,255,255,0.02)', textAlign: 'center', transition: 'border-color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
      >
        {value ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <img src={value} alt="preview" style={{ maxHeight: '80px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }} />
            <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 700 }}>✓ Uploaded — click to change</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Upload size={24} color="rgba(255,255,255,0.2)" />
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Click to upload {label}</span>
            {hint && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>{hint}</span>}
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={async (e) => {
        if (e.target.files[0]) {
          const b64 = await imageToBase64(e.target.files[0// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
          onChange(b64);
        }
      }} />
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text', mono }) {
  return (
    <div>
      <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: '10px', color: 'var(--text-primary)', fontSize: mono ? '13px' : '14px', fontFamily: mono ? 'monospace' : 'inherit',
          outline: 'none', boxSizing: 'border-box', letterSpacing: mono ? '0.05em' : 'normal'
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--brand-primary)'; e.target.style.background = 'rgba(99,102,241,0.07)'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '10px', color: value ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
      }}>
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function PlantList({ plants, onChange }) {
  const [input, setInput] = useState('');
  const addPlant = () => {
    if (!input.trim()) return;
    onChange([...plants, { plant_code: input.trim() }// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
    setInput('');
  };
  const removePlant = (idx) => {
    onChange(plants.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
      <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '12px' }}>Plant Codes</label>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={input}
          placeholder="e.g. Plant 1"
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addPlant()}
          style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }}
        />
        <button onClick={addPlant} style={{ padding: '8px 16px', background: 'var(--brand-primary)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
          Add Plant
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {plants.length === 0 && <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', margin: 0 }}>No plants added yet</p>}
        {plants.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(94, 106, 210, 0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px' }}>
            <span style={{ color: 'var(--brand-primary)', fontSize: '12px', fontWeight: 600 }}>{p.plant_code}</span>
            <X size={14} color="var(--brand-primary)" style={{ cursor: 'pointer' }} onClick={() => removePlant(i)} />
          </div>
        ))}
      </div>
    </div>
  );
}

const CompanyOnboarding = ({ user, onLogout }) => {
  const [companies, setCompanies] = useState([// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [viewCompany, setViewCompany] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API}/company`, { headers: authHeaders() });
      setCompanies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCompanies(); }, [// eslint-disable-next-line react-hooks/exhaustive-deps
]);

  const field = (key) => ({
    value: form[key],
    onChange: (v) => setForm(f => ({ ...f, [key]: v }))
  });


  const [aiPrompt, setAiPrompt] = useState('');
  const [parsingAI, setParsingAI] = useState(false);


  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setParsingAI(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API}/ai/upload-employees`, formData, {
        headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.length > 0) {
        setForm(f => ({ ...f, employees: [...f.employees, ...res.data] }));
        showToast(`Successfully extracted ${res.data.length} employees from file`);
      } else {
        showToast('No employees could be extracted from the file', 'error');
      }
    } catch (err) {
      showToast('File Parsing failed', 'error');
    } finally {
      setParsingAI(false);
      e.target.value = null; // reset input
    }
  };

  const handleParseAI = async () => {
    if (!aiPrompt.trim()) return;
    setParsingAI(true);
    try {
      const res = await axios.post(`${API}/ai/parse-employees`, { text: aiPrompt }, { headers: authHeaders() });
      if (res.data && res.data.length > 0) {
        setForm(f => ({ ...f, employees: [...f.employees, ...res.data] }));
        setAiPrompt('');
        showToast(`Successfully extracted ${res.data.length} employees`);
      } else {
        showToast('No employees could be extracted from the text', 'error');
      }
    } catch (err) {
      showToast('AI Parsing failed', 'error');
    } finally {
      setParsingAI(false);
    }
  };

  const removeParsedEmployee = (idx) => {
    setForm(f => ({ ...f, employees: f.employees.filter((_, i) => i !== idx) }));
  };

  const updateParsedEmployee = (idx, field, val) => {
    const newEmps = [...form.employees];
    newEmps[idx][field] = val;
    setForm(f => ({ ...f, employees: newEmps }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Company name is required', 'error'); setStep(0); return; }
    setSaving(true);
    try {
      const companyRes = await axios.post(`${API}/company`, form, { headers: authHeaders() });
      const createdCompanyId = companyRes.data.id;

      if (form.employees && form.employees.length > 0) {
        await axios.post(`${API}/companies/${createdCompanyId}/bulk-onboard`, { employees: form.employees }, { headers: authHeaders() });
      }

      showToast('Company onboarded successfully! 🎉');
      setShowForm(false);
      setForm(EMPTY_FORM);
      setStep(0);
      fetchCompanies();
    } catch (err) {
      showToast('Failed to save company. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this company?')) return;
    try {
      await axios.delete(`${API}/company/${id}`, { headers: authHeaders() });
      showToast('Company removed');
      fetchCompanies();
    } catch {
      showToast('Failed to delete company', 'error');
    }
  };

  const filtered = companies.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  );

  const stepContent = [
    // Step 0: Basic Info
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div style={{ gridColumn: '1/-1' }}>
        <FormField label="Company Name *" placeholder="e.g. Acme Technologies Pvt Ltd" {...field('name')} />
      </div>
      <FormField label="Company Code (Leave blank for auto)" placeholder="e.g. ACME-001" {...field('company_code')} mono />
      <SelectField label="Industry" options={INDUSTRIES} {...field('industry')} />
      <FormField label="Legal / Registered Name" placeholder="Full legal name as per MCA" {...field('legal_name')} />
      <FormField label="Email Address" type="email" placeholder="contact@company.com" {...field('email')} />
      <FormField label="Phone Number" placeholder="+91 98765 43210" {...field('phone')} />
      <FormField label="Website" placeholder="https://www.company.com" {...field('website')} />
    </div>,

    // Step 1: Statutory Details (ESI/UAN/E-Way)
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div style={{ padding: '16px', background: 'rgba(99,102,241,0.06)', borderRadius: '12px', border: '1px solid rgba(94, 106, 210, 0.15)', gridColumn: '1/-1' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, margin: '0 0 4px' }}>Compliance & Statutory Identifiers</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: 0 }}>These details are used for payroll and government portal integrations.</p>
      </div>
      <FormField label="Company ESI Account No." placeholder="ESI account number" {...field('esi_account_no')} mono />
      <FormField label="Company UAN Account No." placeholder="UAN account number" {...field('uan_account_no')} mono />
      <FormField label="Company E-Way Bill Account" placeholder="E-way bill account" {...field('eway_bill_account')} mono />
      <FormField label="PAN Number" placeholder="ABCDE1234F" {...field('pan_number')} mono />
      <FormField label="GST Number" placeholder="22ABCDE1234F1Z5" {...field('gst_number')} mono />
      <FormField label="CIN / LLPIN" placeholder="U12345MH2020PTC123456" {...field('cin_number')} mono />
    </div>,

    // Step 2: Plants & Locations
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PlantList plants={form.plants} onChange={(v) => setForm(f => ({ ...f, plants: v }))} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <FormField label="Address" placeholder="Building, Street, Area" {...field('address')} />
        <FormField label="City" placeholder="Mumbai" {...field('city')} />
        <FormField label="State" placeholder="Maharashtra" {...field('state')} />
        <FormField label="Pincode" placeholder="400001" {...field('pincode')} />
      </div>
    </div>,

    // Step 3: Identification (Barcode & Branding)
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <UploadBox label="Company Payment Bar Code" hint="Upload QR or Payment barcode for invoices" {...field('payment_barcode')} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <UploadBox label="Company Logo" hint="PNG or SVG recommended" {...field('logo')} />
        <UploadBox label="Company Stamp / Seal" hint="Transparent PNG recommended" {...field('stamp')} />
      </div>
    </div>,

    // Step 4: Team Onboarding
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ padding: '16px', background: 'rgba(99,102,241,0.06)', borderRadius: '12px', border: '1px solid rgba(94, 106, 210, 0.15)' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, margin: '0 0 4px' }}>Bulk AI Employee Onboarding</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '0 0 12px' }}>Paste any text containing employee names, emails, roles, etc. Our AI will extract and structure them.</p>
        <textarea
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
          placeholder="e.g. John Doe, john@example.com, Developer... \n Jane Smith, jane@example.com, HR"
          style={{ width: '100%', minHeight: '100px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'monospace', marginBottom: '12px', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button
            onClick={handleParseAI}
            disabled={parsingAI}
            style={{ padding: '8px 16px', background: 'var(--brand-primary)', color: 'var(--text-primary)', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: parsingAI ? 'not-allowed' : 'pointer' }}
          >
            {parsingAI ? 'Extracting...' : 'Extract from Text'}
          </button>

          <div style={{ position: 'relative' }}>
            <input
              type="file"
              accept=".csv, .xlsx"
              onChange={handleFileUpload}
              disabled={parsingAI}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: parsingAI ? 'not-allowed' : 'pointer' }}
            />
            <button
              disabled={parsingAI}
              style={{ padding: '8px 16px', background: 'rgba(94, 106, 210, 0.2)', color: 'var(--brand-primary)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: parsingAI ? 'not-allowed' : 'pointer' }}
            >
              Upload CSV/Excel
            </button>
          </div>
        </div>
      </div>

      {form.employees.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', overflowX: 'auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600, margin: '0 0 12px' }}>Extracted Employees ({form.employees.length})</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '8px' }}>Name</th>
                <th style={{ padding: '8px' }}>Email</th>
                <th style={{ padding: '8px' }}>Department</th>
                <th style={{ padding: '8px' }}>Designation</th>
                <th style={{ padding: '8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {form.employees.map((emp, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '4px' }}>
                    <input type="text" value={emp.name} onChange={e => updateParsedEmployee(idx, 'name', e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '12px' }} />
                  </td>
                  <td style={{ padding: '4px' }}>
                    <input type="text" value={emp.email} onChange={e => updateParsedEmployee(idx, 'email', e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '12px' }} />
                  </td>
                  <td style={{ padding: '4px' }}>
                    <input type="text" value={emp.department} onChange={e => updateParsedEmployee(idx, 'department', e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '12px' }} />
                  </td>
                  <td style={{ padding: '4px' }}>
                    <input type="text" value={emp.designation} onChange={e => updateParsedEmployee(idx, 'designation', e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '12px' }} />
                  </td>
                  <td style={{ padding: '4px' }}>
                    <X size={14} color="#f87171" style={{ cursor: 'pointer' }} onClick={() => removeParsedEmployee(idx)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  ];

  return (
    <div style={{ display: 'flex', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Toast */}
          {toast && (
            <div style={{
              position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
              padding: '12px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '14px',
              background: toast.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)',
              color: 'var(--text-primary)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              {toast.msg}
            </div>
          )}

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', margin: '0 0 4px' }}>Business Suite</p>
              <h1 style={{ color: 'var(--text-primary)', fontSize: '28px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Building2 size={28} color="var(--brand-primary)" /> Company Onboarding
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '6px 0 0' }}>
                Register and manage all client & partner company profiles in one place
              </p>
            </div>
            <button
              onClick={() => { setShowForm(true); setStep(0); setForm(EMPTY_FORM); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
                background: 'var(--brand-primary)', color: 'var(--text-primary)', border: 'none',
                borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)'
              }}
            >
              <Plus size={18} /> Onboard New Company
            </button>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
            {[
              { label: 'Total Companies', value: companies.length, color: 'var(--brand-primary)', bg: 'rgba(99,102,241,0.12)', emoji: '🏢' },
              { label: 'Active', value: companies.filter(c => c.status === 'active').length, color: '#10b981', bg: 'rgba(16,185,129,0.12)', emoji: '✅' },
              { label: 'With GST', value: companies.filter(c => c.gst_number).length, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', emoji: '📋' },
              { label: 'With Logo', value: companies.filter(c => c.logo).length, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', emoji: '🎨' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                    {s.emoji}
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 4px' }}>{s.label}</p>
                <p style={{ color: s.color, fontSize: '28px', fontWeight: 800, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search companies by name, industry, city…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px 12px 42px', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
              {filtered.length} of {companies.length} companies
            </span>
          </div>

          {/* Company Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
              <p>Loading company profiles…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <Building2 size={56} color="rgba(255,255,255,0.1)" style={{ marginBottom: '16px' }} />
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                {search ? 'No companies match your search' : 'No companies onboarded yet'}
              </p>
              <p style={{ fontSize: '14px' }}>Click "Onboard New Company" to get started</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {filtered.map(c => (
                <CompanyCard key={c.id} company={c} onView={setViewCompany} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ──── NEW COMPANY MODAL ──── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--bg-base)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Modal Header */}
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 800, margin: 0 }}>Onboard Company - Basic Detail</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
              </div>
              <button onClick={() => { setShowForm(false); setStep(0); }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            {/* Step indicators */}
            <div style={{ padding: '16px 28px', display: 'flex', gap: '8px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {STEPS.map((s, i) => (
                <React.Fragment key={s}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    opacity: i <= step ? 1 : 0.3
                  }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%', fontSize: '11px', fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: i < step ? '#10b981' : i === step ? 'var(--brand-primary)' : 'rgba(255,255,255,0.08)',
                      color: 'var(--text-primary)'
                    }}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span style={{ color: i === step ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <div style={{ flex: 1, height: '1px', background: i < step ? '#10b981' : 'rgba(255,255,255,0.08)' }} />}
                </React.Fragment>
              ))}
            </div>

            {/* Form Body */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
              {stepContent[step]}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => step === 0 ? setShowForm(false) : setStep(s => s - 1)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                <ChevronLeft size={16} /> {step === 0 ? 'Cancel' : 'Back'}
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                {step < STEPS.length - 1 && (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: 'rgba(94, 106, 210, 0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', color: 'var(--brand-primary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                )}
                {step === STEPS.length - 1 && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', background: saving ? 'rgba(99,102,241,0.5)' : 'var(--brand-primary)', border: 'none', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
                  >
                    <CheckCircle size={16} /> {saving ? 'Saving…' : 'Onboard Company'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──── VIEW COMPANY MODAL ──── */}
      {viewCompany && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--bg-base)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'auto' }}>

            <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {viewCompany.logo ? (
                  <img src={viewCompany.logo} alt="logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'contain', background: 'rgba(255,255,255,0.08)' }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(94, 106, 210, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, color: 'var(--brand-primary)' }}>
                    {viewCompany.name?.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 800, margin: 0 }}>{viewCompany.name}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '2px 0 0' }}>{viewCompany.industry || '—'}</p>
                </div>
              </div>
              <button onClick={() => setViewCompany(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px 28px' }}>
              {/* Info grid */}
              {[
                { label: 'Legal Name', value: viewCompany.legal_name },
                { label: 'Email', value: viewCompany.email },
                { label: 'Phone', value: viewCompany.phone },
                { label: 'Website', value: viewCompany.website },
                { label: 'Address', value: [viewCompany.address, viewCompany.city, viewCompany.state, viewCompany.pincode, viewCompany.country].filter(Boolean).join(', ') },
              ].filter(f => f.value).map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', fontWeight: 700, width: '90px', flexShrink: 0, paddingTop: '2px' }}>{f.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{f.value}</span>
                </div>
              ))}

              {/* Tax IDs */}
              {(viewCompany.pan_number || viewCompany.gst_number || viewCompany.cin_number) && (
                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(99,102,241,0.06)', borderRadius: '14px', border: '1px solid rgba(94, 106, 210, 0.15)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 700, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tax & Legal IDs</p>
                  {viewCompany.pan_number && <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', width: '40px' }}>PAN</span><span style={{ color: 'var(--brand-primary)', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700 }}>{viewCompany.pan_number}</span></div>}
                  {viewCompany.gst_number && <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', width: '40px' }}>GST</span><span style={{ color: '#34d399', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700 }}>{viewCompany.gst_number}</span></div>}
                  {viewCompany.cin_number && <div style={{ display: 'flex', gap: '12px' }}><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', width: '40px' }}>CIN</span><span style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700 }}>{viewCompany.cin_number}</span></div>}
                </div>
              )}

              {/* Stamp */}
              {viewCompany.stamp && (
                <div style={{ marginTop: '20px', padding: '20px', background: 'var(--bg-card)', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Official Stamp / Seal</p>
                  <img src={viewCompany.stamp} alt="stamp" style={{ maxHeight: '120px', maxWidth: '100%', filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.3))' }} />
                </div>
              )}

              <div style={{ marginTop: '16px', color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>
                Onboarded by {viewCompany.onboarded_by || '—'} • {new Date(viewCompany.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyOnboarding;
