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

const STEPS = ['Basic Info', 'Contact & Address', 'Tax & Legal', 'Branding'];

const EMPTY_FORM = {
  name: '', legal_name: '', industry: '', email: '', phone: '', website: '',
  address: '', city: '', state: '', country: 'India', pincode: '',
  pan_number: '', gst_number: '', cin_number: '', logo: '', stamp: '',
  esi_account_no: '', uan_account_no: '', eway_bill_account: '', plant_code: '', payment_barcode: ''
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
  const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444'];
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
          <img src={company.logo} alt="logo" style={{ width: '52px', height: '52px', borderRadius: '14px', objectFit: 'contain', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
        ) : (
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `linear-gradient(135deg, ${color}33, ${color}11)`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color }}>
            {initials}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: '15px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{company.name}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 0' }}>{company.industry || 'No industry set'}</p>
        </div>
        <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '99px', fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
          Active
        </span>
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        {company.email && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Mail size={12} color="rgba(255,255,255,0.3)" />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{company.email}</span>
          </div>
        )}
        {company.phone && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Phone size={12} color="rgba(255,255,255,0.3)" />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{company.phone}</span>
          </div>
        )}
        {(company.city || company.state) && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <MapPin size={12} color="rgba(255,255,255,0.3)" />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{[company.city, company.state].filter(Boolean).join(', ')}</span>
          </div>
        )}
      </div>

      {/* Tax badges */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {company.pan_number && (
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', fontFamily: 'monospace' }}>
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
        <div style={{ marginBottom: '16px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
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
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Click to upload {label}</span>
            {hint && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>{hint}</span>}
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={async (e) => {
        if (e.target.files[0]) {
          const b64 = await imageToBase64(e.target.files[0]);
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
          width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px', color: '#fff', fontSize: mono ? '13px' : '14px', fontFamily: mono ? 'monospace' : 'inherit',
          outline: 'none', boxSizing: 'border-box', letterSpacing: mono ? '0.05em' : 'normal'
        }}
        onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = 'rgba(99,102,241,0.07)'; }}
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
        width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px', color: value ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
      }}>
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

const CompanyOnboarding = ({ user, onLogout }) => {
  const [companies, setCompanies] = useState([]);
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
      const res = await axios.get(`${API}/companies`, { headers: authHeaders() });
      setCompanies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const field = (key) => ({
    value: form[key],
    onChange: (v) => setForm(f => ({ ...f, [key]: v }))
  });

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Company name is required', 'error'); setStep(0); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/companies`, form, { headers: authHeaders() });
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
      await axios.delete(`${API}/companies/${id}`, { headers: authHeaders() });
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div style={{ gridColumn: '1/-1' }}>
        <FormField label="Company Name *" placeholder="e.g. Acme Technologies Pvt Ltd" {...field('name')} />
      </div>
      <FormField label="Legal / Registered Name" placeholder="Full legal name as per MCA" {...field('legal_name')} />
      <SelectField label="Industry" options={INDUSTRIES} {...field('industry')} />
    </div>,

    // Step 1: Contact & Address
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <FormField label="Email Address" type="email" placeholder="contact@company.com" {...field('email')} />
      <FormField label="Phone Number" placeholder="+91 98765 43210" {...field('phone')} />
      <FormField label="Website" placeholder="https://www.company.com" {...field('website')} />
      <FormField label="City" placeholder="Mumbai" {...field('city')} />
      <FormField label="State" placeholder="Maharashtra" {...field('state')} />
      <FormField label="Pincode" placeholder="400001" {...field('pincode')} />
      <div style={{ gridColumn: '1/-1' }}>
        <FormField label="Full Address" placeholder="Building, Street, Area, City, State" {...field('address')} />
      </div>
    </div>,

    // Step 2: Tax & Legal
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div style={{ padding: '16px', background: 'rgba(99,102,241,0.06)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.15)', gridColumn: '1/-1' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 4px' }}>🔒 Tax identifiers are stored securely and used only for document generation.</p>
      </div>
      <FormField label="PAN Number" placeholder="ABCDE1234F" {...field('pan_number')} mono />
      <FormField label="GST Number" placeholder="22ABCDE1234F1Z5" {...field('gst_number')} mono />
      <FormField label="Company ESI Account No." placeholder="ESI account number" {...field('esi_account_no')} mono />
      <FormField label="Company UAN Account No." placeholder="UAN account number" {...field('uan_account_no')} mono />
      <FormField label="Company E-Way Bill Account" placeholder="E-way bill account" {...field('eway_bill_account')} mono />
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <FormField label="Plant Code" placeholder="e.g. 1 Plant" {...field('plant_code')} />
        </div>
      </div>
      <div style={{ gridColumn: '1/-1' }}>
        <FormField label="CIN / LLPIN (optional)" placeholder="U12345MH2020PTC123456" {...field('cin_number')} mono />
      </div>
    </div>,

    // Step 3: Branding
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <UploadBox label="Company Payment Bar Code" hint="Upload QR or Payment barcode" {...field('payment_barcode')} />
      <UploadBox label="Company Logo" hint="PNG or SVG recommended, max 2MB" {...field('logo')} />
      <UploadBox label="Company Stamp / Seal" hint="PNG with transparent background recommended" {...field('stamp')} />
    </div>
  ];

  return (
    <div style={{ display: 'flex', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh', background: '#0f172a' }}>
      <Sidebar user={user} onLogout={onLogout} activePage="company-onboarding" setActivePage={() => {}} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Toast */}
          {toast && (
            <div style={{
              position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
              padding: '12px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '14px',
              background: toast.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)',
              color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              {toast.msg}
            </div>
          )}

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', margin: '0 0 4px' }}>Business Suite</p>
              <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Building2 size={28} color="#6366f1" /> Company Onboarding
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '6px 0 0' }}>
                Register and manage all client & partner company profiles in one place
              </p>
            </div>
            <button
              onClick={() => { setShowForm(true); setStep(0); setForm(EMPTY_FORM); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none',
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
              { label: 'Total Companies', value: companies.length, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', emoji: '🏢' },
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
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 4px' }}>{s.label}</p>
                <p style={{ color: s.color, fontSize: '28px', fontWeight: 800, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search companies by name, industry, city…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px 12px 42px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '14px',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', whiteSpace: 'nowrap' }}>
              {filtered.length} of {companies.length} companies
            </span>
          </div>

          {/* Company Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
              <p>Loading company profiles…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.3)' }}>
              <Building2 size={56} color="rgba(255,255,255,0.1)" style={{ marginBottom: '16px' }} />
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', margin: '0 0 8px' }}>
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
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Modal Header */}
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, margin: 0 }}>Onboard New Company</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '4px 0 0' }}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
              </div>
              <button onClick={() => { setShowForm(false); setStep(0); }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
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
                      background: i < step ? '#10b981' : i === step ? '#6366f1' : 'rgba(255,255,255,0.08)',
                      color: '#fff'
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
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                <ChevronLeft size={16} /> {step === 0 ? 'Cancel' : 'Back'}
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                {step < STEPS.length - 1 && (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', color: '#818cf8', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                )}
                {step === STEPS.length - 1 && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', background: saving ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
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
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'auto' }}>

            <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {viewCompany.logo ? (
                  <img src={viewCompany.logo} alt="logo" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'contain', background: 'rgba(255,255,255,0.08)' }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, color: '#818cf8' }}>
                    {viewCompany.name?.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, margin: 0 }}>{viewCompany.name}</h2>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '2px 0 0' }}>{viewCompany.industry || '—'}</p>
                </div>
              </div>
              <button onClick={() => setViewCompany(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
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
                  <span style={{ color: '#fff', fontSize: '14px' }}>{f.value}</span>
                </div>
              ))}

              {/* Tax IDs */}
              {(viewCompany.pan_number || viewCompany.gst_number || viewCompany.cin_number) && (
                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(99,102,241,0.06)', borderRadius: '14px', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 700, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tax & Legal IDs</p>
                  {viewCompany.pan_number && <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', width: '40px' }}>PAN</span><span style={{ color: '#818cf8', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700 }}>{viewCompany.pan_number}</span></div>}
                  {viewCompany.gst_number && <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', width: '40px' }}>GST</span><span style={{ color: '#34d399', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700 }}>{viewCompany.gst_number}</span></div>}
                  {viewCompany.cin_number && <div style={{ display: 'flex', gap: '12px' }}><span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', width: '40px' }}>CIN</span><span style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700 }}>{viewCompany.cin_number}</span></div>}
                </div>
              )}

              {/* Stamp */}
              {viewCompany.stamp && (
                <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Official Stamp / Seal</p>
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
