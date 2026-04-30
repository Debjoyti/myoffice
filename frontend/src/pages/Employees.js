import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import OfferLetterModal from '../components/OfferLetterModal';
import { Plus, Edit2, Trash2, X, GraduationCap, Award, CreditCard, BookOpen, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TABS = [
  { id: 'personal',   label: 'Personal',   icon: UserCheck },
  { id: 'statutory',  label: 'Statutory',  icon: BookOpen },
  { id: 'employment', label: 'Employment', icon: UserCheck },
  { id: 'leave',      label: 'Leave Config', icon: Award },
  { id: 'education',  label: 'Education',  icon: GraduationCap },
  { id: 'skills',     label: 'Skills / Certs', icon: Award },
  { id: 'bank',       label: 'Bank Details', icon: CreditCard },
];

const EMPTY_FORM = {
  name: '', email: '', phone: '', department: '', designation: '', date_of_joining: '', parking_slot: '', vehicle_number: '',
  pan_number: '', aadhaar_number: '', abha_number: '', driving_license: '', driving_expiry: '',
  esi_number: '', esi_registration_date: '',
  present_address: '', temp_address: '',
  photo: '', emp_id: '', previous_emp_id: '', father_name: '', sex: 'Male', is_disabled: 'No',
  emergency_contact: '', nationality: '',
  skill_category: 'skilled', senior_level_code: '', approval_gate_pass: '',
  company_insurance_no: '', company_insurance_reg_date: '', company_insurance_expiry: '',
  employee_insurance_no: '', employee_insurance_reg_date: '', employee_insurance_expiry: '',
  food_allowance: 'No', food_charges: '', food_start_date: '', food_close_date: '',
  pf_enabled: 'No',
  // Leave config (stored locally / in details)
  leave_el: 15, leave_cl: 12, leave_sl: 7, leave_ml: 180, leave_lwp: 0,
  // Education (array)
  education: [{ school: '', degree: '', field_of_study: '', start_date: '', end_date: '', grade: '' }],
  // Skills / Certs (array)
  skills: [{ cert_name: '', cert_number: '', grant_date: '', expiry_date: '' }],
  // Bank detail
  bank_name: '', bank_ifsc: '', bank_account_number: '', bank_holder_name: '',
};

const Toggle = ({ value, onChange }) => (
  <button type="button" onClick={() => onChange(!value)} style={{
    width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', flexShrink: 0,
    background: value ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.15)', position: 'relative', transition: 'background 0.25s'
  }}>
    <div style={{ position: 'absolute', top: '3px', left: value ? '18px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left 0.25s' }} />
  </button>
);

const Field = ({ label, children, col }) => (
  <div style={{ gridColumn: col ? `span ${col}` : undefined }}>
    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    {children}
  </div>
);

const InputField = ({ label, field, formData, setFormData, type = 'text', col, placeholder, required: req }) => (
  <Field label={label} col={col}>
    <input
      type={type}
      placeholder={placeholder}
      required={req}
      className="dark-input"
      value={formData[field] || ''}
      onChange={e => setFormData({ ...formData, [field]: e.target.value })}
      style={{ fontSize: '13px' }}
    />
  </Field>
);

const SectionHeader = ({ title, color = 'var(--brand-primary)' }) => (
  <div style={{ gridColumn: '1/-1', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px', marginBottom: '4px', marginTop: '8px' }}>
    <h3 style={{ margin: 0, fontSize: '12px', color, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{title}</h3>
  </div>
);

const Employees = ({ user, onLogout, isSubComponent }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(localStorage.getItem('employeesActiveTab') || 'personal');

  useEffect(() => {
    localStorage.setItem('employeesActiveTab', activeTab);
  }, [activeTab]);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    fetchEmployees();
    fetchPositions();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const r = await axios.get(`${API}/employees`, { headers: { Authorization: `Bearer ${token}` } });
      setEmployees(r.data);
    } catch { toast.error('Failed to fetch employees'); }
    setLoading(false);
  };

  const fetchPositions = async () => {
    try {
      const token = localStorage.getItem('token');
      const r = await axios.get(`${API}/positions`, { headers: { Authorization: `Bearer ${token}` } });
      setPositions(r.data);
    } catch (err) { console.error('Failed to fetch positions', err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = { ...formData };
      delete payload.education; delete payload.skills;
      delete payload.leave_el; delete payload.leave_cl; delete payload.leave_sl; delete payload.leave_ml; delete payload.leave_lwp;

      if (editId) {
        await axios.put(`${API}/employees/${editId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Employee updated');
      } else {
        await axios.post(`${API}/employees`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Employee added');
      }
      setShowModal(false);
      setFormData({ ...EMPTY_FORM });
      setEditId(null);
      setActiveTab('personal');
      fetchEmployees();
    } catch (err) { toast.error('Failed to save employee: ' + (err.response?.data?.detail || err.message)); console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/employees/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Employee deleted');
      fetchEmployees();
    } catch { toast.error('Failed to delete employee'); }
  };

  const openEdit = (emp) => {
    setFormData({ ...EMPTY_FORM, ...emp });
    setEditId(emp.id);
    setActiveTab('personal');
    setShowModal(true);
  };

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM });
    setEditId(null);
    setActiveTab('personal');
    setShowModal(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentParse = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    toast.info('Parsing document...');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/parse-document`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const parsedData = response.data;
      setFormData(prev => ({ ...prev, ...parsedData }));
      toast.success('Document parsed and fields populated!');
    } catch (err) {
      toast.error('Failed to parse document');
      console.error(err);
    }
  };

  const addEducationRow = () => setFormData({ ...formData, education: [...(formData.education || []), { school: '', degree: '', field_of_study: '', start_date: '', end_date: '', grade: '' }] });
  const removeEducationRow = (i) => setFormData({ ...formData, education: formData.education.filter((_, ii) => ii !== i) });
  const updateEducation = (i, field, val) => {
    const arr = [...(formData.education || [])];
    arr[i] = { ...arr[i], [field]: val };
    setFormData({ ...formData, education: arr });
  };

  const addSkillRow = () => setFormData({ ...formData, skills: [...(formData.skills || []), { cert_name: '', cert_number: '', grant_date: '', expiry_date: '' }] });
  const removeSkillRow = (i) => setFormData({ ...formData, skills: formData.skills.filter((_, ii) => ii !== i) });
  const updateSkill = (i, field, val) => {
    const arr = [...(formData.skills || [])];
    arr[i] = { ...arr[i], [field]: val };
    setFormData({ ...formData, skills: arr });
  };

  const filtered = employees.filter(e =>
    [e.name, e.email, e.department, e.designation, e.emp_id].some(v => (v || '').toLowerCase().includes(searchQ.toLowerCase()))
  );

  const tabStyle = (id) => ({
    padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
    color: activeTab === id ? '#10b981' : 'rgba(255,255,255,0.4)',
    borderBottom: `2px solid ${activeTab === id ? '#10b981' : 'transparent'}`,
    transition: 'all 0.2s'
  });

  const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' };
  const grid2Style = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' };

  const content = (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" data-testid="employees-title">Employee Directory</h1>
          <p className="page-subtitle">Manage all employee profiles — personal, statutory, leave, bank &amp; more</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text" placeholder="Search employees..." className="dark-input"
            style={{ width: '220px', fontSize: '13px', height: '40px' }}
            value={searchQ} onChange={e => setSearchQ(e.target.value)}
          />
          <button onClick={() => setShowOfferModal(true)} className="btn-dark-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '40px' }}>
            Generate Offer Letter
          </button>
          <button onClick={openAdd} data-testid="add-employee-btn" className="btn-dark-primary" style={{ height: '40px' }}>
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* Employee Table */}
      {loading ? (
        <div className="dark-loading">Loading employees…</div>
      ) : filtered.length === 0 ? (
        <div className="dark-empty">
          <p style={{ marginBottom: '12px' }}>{searchQ ? 'No results found' : 'No employees found'}</p>
          {!searchQ && <button onClick={openAdd} style={{ color: 'var(--brand-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Add your first employee</button>}
        </div>
      ) : (
        <div className="dark-table-wrap fade-in">
          <table>
            <thead>
              <tr>
                <th>Employee</th><th>Emp ID</th><th>Dept / Role</th><th>Joining</th><th>Skill</th><th>PAN</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id} data-testid={`employee-row-${emp.id}`}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {emp.photo ? (
                        <img src={emp.photo} alt={emp.name} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
                      ) : (
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                          {emp.name?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{emp.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{emp.emp_id || '—'}</td>
                  <td>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{emp.department}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{emp.designation}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{emp.date_of_joining || '—'}</td>
                  <td><span style={{ fontSize: '11px', color: '#10b981', textTransform: 'capitalize' }}>{emp.skill_category || 'skilled'}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{emp.pan_number || '—'}</td>
                  <td><span className={emp.status === 'active' ? 'badge-green' : 'badge-amber'}>{emp.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(emp)} style={{ color: 'var(--brand-primary)', background: 'rgba(94, 106, 210, 0.1)', border: 'none', borderRadius: '7px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                        <Edit2 size={12} /> Edit
                      </button>
                      <button onClick={() => handleDelete(emp.id)} data-testid={`delete-employee-${emp.id}`} style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '7px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="dark-modal-overlay" style={{ zIndex: 1500 }}>
          <div className="dark-modal" style={{ maxWidth: '780px', width: '95%', padding: 0, height: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <h2 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, margin: 0 }} data-testid="add-employee-modal-title">
                  {editId ? 'Edit Employee Profile' : 'Add New Employee'}
                </h2>
                <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>Complete all sections for a full employee record</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
                <X size={22} />
              </button>
            </div>

            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: '0', overflow: 'auto', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, padding: '0 12px' }} className="hide-scrollbar">
              {TABS.map(tab => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={tabStyle(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
              {/* ── PERSONAL ── */}
              {activeTab === 'personal' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Auto-fill from Document */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', background: 'rgba(94, 106, 210, 0.1)', borderRadius: '12px', border: '1px dashed rgba(99,102,241,0.3)' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: 'var(--brand-primary)' }}>Auto-fill via OCR</p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Upload a CV or Aadhaar card to automatically fill out details.</p>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button type="button" className="btn-dark-primary" style={{ padding: '6px 12px', pointerEvents: 'none' }}>
                        Upload Document
                      </button>
                      <input type="file" accept=".pdf,image/*" onChange={handleDocumentParse} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    </div>
                  </div>

                  {/* Photo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ position: 'relative', width: '72px', height: '72px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '2px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {formData.photo ? <img src={formData.photo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Plus size={22} style={{ opacity: 0.3 }} />}
                      <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Click to upload employee photo</div>
                  </div>

                  <div style={gridStyle}>
                    <SectionHeader title="Identity" />
                    <InputField label="Full Name *" field="name" formData={formData} setFormData={setFormData} required />
                    <InputField label="Father's Name" field="father_name" formData={formData} setFormData={setFormData} />
                    <Field label="Sex">
                      <select className="dark-input" style={{ fontSize: '13px' }} value={formData.sex} onChange={e => setFormData({ ...formData, sex: e.target.value })}>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </Field>
                    <InputField label="Mobile No." field="phone" formData={formData} setFormData={setFormData} type="tel" required />
                    <InputField label="Emergency Contact No." field="emergency_contact" formData={formData} setFormData={setFormData} type="tel" />
                    <InputField label="Nationality" field="nationality" formData={formData} setFormData={setFormData} />
                    <Field label="Person With Disability?">
                      <select className="dark-input" style={{ fontSize: '13px' }} value={formData.is_disabled} onChange={e => setFormData({ ...formData, is_disabled: e.target.value })}>
                        <option value="No">No</option><option value="Yes">Yes</option>
                      </select>
                    </Field>
                    <InputField label="Email Address *" field="email" formData={formData} setFormData={setFormData} type="email" required col={2} />

                    <SectionHeader title="Address" />
                    <Field label="Present Address" col={2}>
                      <textarea rows="2" className="dark-input" value={formData.present_address || ''} onChange={e => setFormData({ ...formData, present_address: e.target.value })} style={{ fontSize: '13px' }} />
                    </Field>
                    <Field label="Temp. Address">
                      <textarea rows="2" className="dark-input" value={formData.temp_address || ''} onChange={e => setFormData({ ...formData, temp_address: e.target.value })} style={{ fontSize: '13px' }} />
                    </Field>
                  </div>
                </div>
              )}

              {/* ── STATUTORY ── */}
              {activeTab === 'statutory' && (
                <div style={gridStyle}>
                  <SectionHeader title="Identity Documents" />
                  <InputField label="Aadhaar Number" field="aadhaar_number" formData={formData} setFormData={setFormData} placeholder="XXXX XXXX XXXX" />
                  <InputField label="ABHA ID Number" field="abha_number" formData={formData} setFormData={setFormData} />
                  <InputField label="PAN Card Number" field="pan_number" formData={formData} setFormData={setFormData} />
                  <InputField label="Driving Licence No." field="driving_license" formData={formData} setFormData={setFormData} />
                  <InputField label="DL Expiry Date" field="driving_expiry" formData={formData} setFormData={setFormData} type="date" />
                  <div />

                  <SectionHeader title="Provident Fund (PF)" />
                  <Field label="PF Enabled?">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '6px' }}>
                      <Toggle value={formData.pf_enabled === 'Yes'} onChange={v => setFormData({ ...formData, pf_enabled: v ? 'Yes' : 'No' })} />
                      <span style={{ fontSize: '13px', color: formData.pf_enabled === 'Yes' ? '#10b981' : 'rgba(255,255,255,0.4)' }}>{formData.pf_enabled === 'Yes' ? 'Yes' : 'No'}</span>
                    </div>
                  </Field>
                  <div />
                  <div />

                  <SectionHeader title="ESI (Employee State Insurance)" />
                  <InputField label="ESI Number" field="esi_number" formData={formData} setFormData={setFormData} />
                  <InputField label="ESI Registration Date" field="esi_registration_date" formData={formData} setFormData={setFormData} type="date" />
                  <div />

                  <SectionHeader title="Company Insurance" />
                  <InputField label="Company Insurance No." field="company_insurance_no" formData={formData} setFormData={setFormData} />
                  <InputField label="Registration Date" field="company_insurance_reg_date" formData={formData} setFormData={setFormData} type="date" />
                  <InputField label="Expiry Date" field="company_insurance_expiry" formData={formData} setFormData={setFormData} type="date" />

                  <SectionHeader title="Employee Insurance" />
                  <InputField label="Employee Insurance No." field="employee_insurance_no" formData={formData} setFormData={setFormData} />
                  <InputField label="Registration Date" field="employee_insurance_reg_date" formData={formData} setFormData={setFormData} type="date" />
                  <InputField label="Expiry Date" field="employee_insurance_expiry" formData={formData} setFormData={setFormData} type="date" />

                  <SectionHeader title="Food Allowance" />
                  <Field label="Food Allowance?">
                    <select className="dark-input" style={{ fontSize: '13px' }} value={formData.food_allowance} onChange={e => setFormData({ ...formData, food_allowance: e.target.value })}>
                      <option value="No">No</option><option value="Yes">Yes</option>
                    </select>
                  </Field>
                  {formData.food_allowance === 'Yes' && (
                    <>
                      <InputField label="Monthly Charges (₹)" field="food_charges" formData={formData} setFormData={setFormData} type="number" />
                      <div />
                      <InputField label="Food Start Date" field="food_start_date" formData={formData} setFormData={setFormData} type="date" />
                      <InputField label="Food Close Date" field="food_close_date" formData={formData} setFormData={setFormData} type="date" />
                      <div />
                    </>
                  )}
                </div>
              )}

              {/* ── EMPLOYMENT ── */}
              {activeTab === 'employment' && (
                <div style={gridStyle}>
                  <SectionHeader title="Employment Details" />
                  <InputField label="Company EMP ID" field="emp_id" formData={formData} setFormData={setFormData} placeholder="Auto-generate or enter" />
                  <InputField label="Previous EMP ID" field="previous_emp_id" formData={formData} setFormData={setFormData} />
                  <Field label="Position *">
                    <select
                      className="dark-input"
                      style={{ fontSize: '13px' }}
                      value={formData.position_id || ''}
                      onChange={e => {
                        const selectedPosId = e.target.value;
                        const pos = positions.find(p => p.id === selectedPosId);
                        setFormData({
                          ...formData,
                          position_id: selectedPosId,
                          department: pos?.department_id || formData.department || 'General',
                          designation: pos?.title || formData.designation || 'Employee'
                        });
                      }}
                      required
                    >
                      <option value="">Select Position</option>
                      {positions.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </Field>
                  <InputField label="Department *" field="department" formData={formData} setFormData={setFormData} required />
                  <InputField label="Designation *" field="designation" formData={formData} setFormData={setFormData} required />
                  <InputField label="Parking Slot" field="parking_slot" formData={formData} setFormData={setFormData} placeholder="e.g. A-12" />
                  <InputField label="Vehicle Number" field="vehicle_number" formData={formData} setFormData={setFormData} placeholder="e.g. MH12AB1234" />
                  <InputField label="Joining Date *" field="date_of_joining" formData={formData} setFormData={setFormData} type="date" required />
                  <Field label="Skill Category">
                    <select className="dark-input" style={{ fontSize: '13px' }} value={formData.skill_category} onChange={e => setFormData({ ...formData, skill_category: e.target.value })}>
                      <option value="unskilled">Unskilled</option>
                      <option value="semiskilled">Semiskilled</option>
                      <option value="skilled">Skilled</option>
                    </select>
                  </Field>
                  <SectionHeader title="Approval & Gate Pass" />
                  <InputField label="Senior Level (EMP Code)" field="senior_level_code" formData={formData} setFormData={setFormData} placeholder="Employee Code" />
                  <InputField label="Approval Gate Pass Code" field="approval_gate_pass" formData={formData} setFormData={setFormData} placeholder="Employee Code" />
                  <InputField label="Senior Employee Code" field="approval_gate_pass" formData={formData} setFormData={setFormData} placeholder="Senior EMP Code" />
                </div>
              )}

              {/* ── LEAVE CONFIG ── */}
              {activeTab === 'leave' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Configure individual leave entitlements. These will be reflected in the employee portal and payroll module.
                  </p>
                  {[
                    { label: 'Earned Leave (EL) / Privilege Leave (PL)', key: 'leave_el', color: 'var(--brand-primary)' },
                    { label: 'Casual Leave (CL)', key: 'leave_cl', color: '#10b981' },
                    { label: 'Sick Leave (SL)', key: 'leave_sl', color: '#f59e0b' },
                    { label: 'Maternity Leave (ML) — Female only', key: 'leave_ml', color: '#f472b6' },
                    { label: 'Leave Without Pay (LWP)', key: 'leave_lwp', color: '#f87171' },
                  ].map(item => (
                    <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px', gap: '14px', alignItems: 'center', padding: '14px 18px', background: `${item.color}0a`, borderRadius: '12px', border: `1px solid ${item.color}25` }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: item.color }}>{item.label}</p>
                      <div>
                        <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '4px' }}>Days / Year</label>
                        <input type="number" className="dark-input" value={formData[item.key] || 0} onChange={e => setFormData({ ...formData, [item.key]: parseInt(e.target.value) || 0 })} style={{ fontSize: '13px', height: '34px', textAlign: 'center' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>days/year</span>
                    </div>
                  ))}
                  <div style={{ padding: '14px 18px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'var(--text-secondary)' }}>Note: Maternity Leave only appears in offer letter for female employees. Display in offer letter → Yes / No (as per sex field)</p>
                  </div>
                </div>
              )}

              {/* ── EDUCATION ── */}
              {activeTab === 'education' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Add academic qualifications. Each row = one qualification.</p>
                  <div className="dark-table-wrap" style={{ maxHeight: 'none' }}>
                    <table style={{ fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>School / University</th>
                          <th>Degree</th>
                          <th>Field of Study</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Grade / %</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(formData.education || []).map((row, i) => (
                          <tr key={i}>
                            <td style={{ color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
                            {['school', 'degree', 'field_of_study'].map(f => (
                              <td key={f}>
                                <input value={row[f] || ''} onChange={e => updateEducation(i, f, e.target.value)} className="dark-input" style={{ fontSize: '12px', height: '32px', minWidth: '100px' }} />
                              </td>
                            ))}
                            {['start_date', 'end_date'].map(f => (
                              <td key={f}>
                                <input type="date" value={row[f] || ''} onChange={e => updateEducation(i, f, e.target.value)} className="dark-input" style={{ fontSize: '12px', height: '32px' }} />
                              </td>
                            ))}
                            <td>
                              <input value={row.grade || ''} onChange={e => updateEducation(i, 'grade', e.target.value)} className="dark-input" style={{ fontSize: '12px', height: '32px', width: '80px' }} placeholder="A / 85%" />
                            </td>
                            <td>
                              <button type="button" onClick={() => removeEducationRow(i)} style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer' }}>
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" onClick={addEducationRow} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-primary)', background: 'rgba(94, 106, 210, 0.1)', border: '1px solid rgba(94, 106, 210, 0.2)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, alignSelf: 'flex-start' }}>
                    <Plus size={14} /> Add Education Row
                  </button>
                </div>
              )}

              {/* ── SKILLS / CERTS ── */}
              {activeTab === 'skills' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Add professional certifications and skills. Each row = one certification.</p>
                  <div className="dark-table-wrap" style={{ maxHeight: 'none' }}>
                    <table style={{ fontSize: '12px' }}>
                      <thead>
                        <tr>
                          <th>#</th><th>Certification Name</th><th>Certification Number</th><th>Original Grant Date</th><th>Expiration Date</th><th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(formData.skills || []).map((row, i) => (
                          <tr key={i}>
                            <td style={{ color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>{i + 1}</td>
                            <td><input value={row.cert_name || ''} onChange={e => updateSkill(i, 'cert_name', e.target.value)} className="dark-input" style={{ fontSize: '12px', height: '32px', minWidth: '140px' }} placeholder="e.g. AWS Solutions Architect" /></td>
                            <td><input value={row.cert_number || ''} onChange={e => updateSkill(i, 'cert_number', e.target.value)} className="dark-input" style={{ fontSize: '12px', height: '32px', minWidth: '100px' }} /></td>
                            <td><input type="date" value={row.grant_date || ''} onChange={e => updateSkill(i, 'grant_date', e.target.value)} className="dark-input" style={{ fontSize: '12px', height: '32px' }} /></td>
                            <td><input type="date" value={row.expiry_date || ''} onChange={e => updateSkill(i, 'expiry_date', e.target.value)} className="dark-input" style={{ fontSize: '12px', height: '32px' }} /></td>
                            <td>
                              <button type="button" onClick={() => removeSkillRow(i)} style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer' }}>
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" onClick={addSkillRow} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, alignSelf: 'flex-start' }}>
                    <Plus size={14} /> Add Certification
                  </button>
                </div>
              )}

              {/* ── BANK DETAILS ── */}
              {activeTab === 'bank' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Bank details are used for salary transfer. After employee exit, all balance is cleared to Account Department.
                  </p>
                  <div style={grid2Style}>
                    <InputField label="Bank Name" field="bank_name" formData={formData} setFormData={setFormData} placeholder="e.g. HDFC Bank" />
                    <InputField label="Bank IFSC Code" field="bank_ifsc" formData={formData} setFormData={setFormData} placeholder="e.g. HDFC0001234" />
                    <InputField label="Bank Account Number" field="bank_account_number" formData={formData} setFormData={setFormData} placeholder="Account number" />
                    <InputField label="Account Holder Name" field="bank_holder_name" formData={formData} setFormData={setFormData} placeholder="Name as on bank account" />
                  </div>
                  <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.05)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: '#f87171' }}>Exit Policy</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>After exit: all outstanding balance cleared to Account Department. Full settlement creates experience letter (joining date → exit date).</p>
                  </div>
                </div>
              )}

              {/* Form Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {TABS.map((tab, i) => (
                    <div key={tab.id} style={{ width: '24px', height: '4px', borderRadius: '2px', background: activeTab === tab.id ? '#10b981' : 'rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => setActiveTab(tab.id)} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-dark-cancel">Cancel</button>
                  <button type="submit" data-testid="submit-employee-btn" className="btn-dark-primary">
                    {editId ? 'Update Profile' : 'Save Employee Profile'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOfferModal && (
        <OfferLetterModal
          show={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          onSave={(newOffer) => toast.success(`Offer letter generated for ${newOffer.name}`)}
          employees={employees}
        />
      )}
    </>
  );

  if (isSubComponent) return content;

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content"><div className="page-inner">{content}</div></div>
    </div>
  );
};

export default Employees;