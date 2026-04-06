import React, { useState, useEffect } from 'react';
import { X, Check, ArrowRight, ChevronLeft, Download, Plus, Search, User, Mail, Phone, Hash } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OfferLetterModal = ({ show, onClose, onSave }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        yearlyCTC: 600000,
        isMetro: 'Yes',
        pfApplied: true,
        pfCap: 'Yes',
        coInsurance: true,
        empInsurance: true,
        foodAllowance: true,
        esiApplied: true,
        esiManualValue: 0,
        esiState: 'Maharashtra',
        validationStart: '',
        validationEnd: '',

        // Personal
        companyName: 'BizOps Technologies Private Limited',
        companyAddress: '123, Tech Park, Hitech City, Hyderabad, Telangana - 500081',
        title: 'Mr',
        firstName: '',
        middleName: '',
        lastName: '',
        phone: '',
        email: '',
        designation: '',
        officeLocation: 'Mumbai',
        localAddress: '',
        permanentAddress: '',
        joiningDate: '',
        offerExpiryDate: '',
        shiftDetails: 'General Shift: 09:30 AM to 06:30 PM', // Handled as free text in letter

        // Rules - Fully editable section at end
        rulesAndRegs: `1. Employment Duties: Your duties will be defined by your reporting manager.\n2. Probation: You will be on probation for 6 months.\n3. Confidentiality: You shall maintain standard corporate confidentiality.\n4. Leave Policy: As per company norms.`
    });

    const [salaryBreakdown, setSalaryBreakdown] = useState([]);

    // Calculation Logic
    useEffect(() => {
        const ctcYearly = parseFloat(formData.yearlyCTC) || 0;
        const basic = ctcYearly * 0.50;
        const hra = formData.isMetro === 'Yes' ? basic * 0.40 : basic * 0.30;
        const foodAll = formData.foodAllowance ? 24000 : 0;
        const pfEmployer = formData.pfApplied ? Math.min(1800 * 12, basic * 0.12) : 0;
        
        let esiEmp = 0;
        if (formData.esiApplied) {
            // Rule: > 22000 gross monthly -> manual only
            if ((ctcYearly / 12) <= 22000) {
                esiEmp = (ctcYearly) * 0.0325;
            } else {
                esiEmp = formData.esiManualValue || 0;
            }
        }

        const calculatedComponents = [
            { id: 1, name: 'Basic Pay', system_suggested: basic / 12, hr_input_1: basic / 12, hr_input_2: basic / 12, final_value: basic / 12 },
            { id: 2, name: 'HRA', system_suggested: hra / 12, hr_input_1: hra / 12, hr_input_2: hra / 12, final_value: hra / 12 },
            { id: 3, name: 'Food Allowance', system_suggested: foodAll / 12, hr_input_1: foodAll / 12, hr_input_2: foodAll / 12, final_value: foodAll / 12 },
            { id: 4, name: 'PF Employer', system_suggested: pfEmployer / 12, hr_input_1: pfEmployer / 12, hr_input_2: pfEmployer / 12, final_value: pfEmployer / 12 },
            { id: 5, name: 'ESI Employer', system_suggested: esiEmp / 12, hr_input_1: esiEmp / 12, hr_input_2: esiEmp / 12, final_value: esiEmp / 12 },
        ];

        // Preservation of manual changes if already edited
        if (salaryBreakdown.length > 0) {
            setSalaryBreakdown(salaryBreakdown.map(comp => {
                const updated = calculatedComponents.find(c => c.name === comp.name);
                return updated ? { ...updated, hr_input_1: comp.hr_input_1, hr_input_2: comp.hr_input_2, final_value: comp.final_value } : comp;
            }));
        } else {
            setSalaryBreakdown(calculatedComponents);
        }
    }, [formData.yearlyCTC, formData.isMetro, formData.pfApplied, formData.foodAllowance, formData.esiApplied]);

    if (!show) return null;

    const renderStepHeader = () => {
        const steps = [
            { id: 1, name: 'Compensation' },
            { id: 2, name: 'Salary' },
            { id: 3, name: 'Personal' },
            { id: 4, name: 'Rules' },
        ];

        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', marginBottom: '40px', position: 'relative' }}>
                {steps.map((s, idx) => (
                    <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: step === s.id ? 'linear-gradient(135deg, #10b981, #059669)' : step > s.id ? '#10b981' : 'rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 600,
                            border: step === s.id ? '2px solid rgba(16,185,129,0.3)' : 'none',
                            boxShadow: step === s.id ? '0 0 15px rgba(16,185,129,0.4)' : 'none'
                        }}>
                            {step > s.id ? <Check size={16} /> : s.id}
                        </div>
                        <span style={{ fontSize: '12px', color: step >= s.id ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{s.name}</span>
                        {idx < steps.length - 1 && (
                            <div style={{
                                position: 'absolute', top: '16px', left: '52px', width: '40px', height: '1px',
                                background: step > s.id ? '#10b981' : 'rgba(255,255,255,0.1)'
                            }} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleGenerate = async () => {
        try {
            const token = localStorage.getItem('token');
            const payload = {
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone,
                designation: formData.designation,
                ctc_yearly: parseFloat(formData.yearlyCTC),
                esi_enabled: formData.esiApplied,
                pf_enabled: formData.pfApplied,
                details: {
                    salaryBreakdown,
                    company: {
                        name: formData.companyName,
                        address: formData.companyAddress
                    },
                    timeline: {
                        joiningDate: formData.joiningDate,
                        offerExpiry: formData.offerExpiryDate,
                        shift: formData.shiftDetails
                    },
                    rulesAndRegs: formData.rulesAndRegs
                }
            };

            const response = await axios.post(`${API}/offer-letters`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onSave && onSave(response.data);
            onClose();
        } catch (error) {
            toast.error('Failed to generate offer letter.');
        }
    };

    return (
        <div className="dark-modal-overlay" style={{ zIndex: 2000 }}>
            <div className="dark-modal" style={{ maxWidth: '900px', width: '95%', padding: '0', height: '90vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0 }}>Generate Offer Letter</h2>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '4px 0 0' }}>Quickly create, review and save offer letters with payroll estimates.</p>
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={24} /></button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                    {renderStepHeader()}

                    {/* Step 1: Compensation */}
                    {step === 1 && (
                        <div className="fade-in">
                            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Compensation Details</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label className="dark-label">Yearly CTC (₹) *</label>
                                        <input type="number" className="dark-input" value={formData.yearlyCTC} onChange={e => setFormData({ ...formData, yearlyCTC: e.target.value })} />
                                        <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                                            Monthly CTC: <span style={{ color: '#fff', fontWeight: 600 }}>₹{(formData.yearlyCTC / 12).toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="dark-label">Provident Fund (PF)</label>
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                            <span className="text-white text-sm font-medium">Enable PF Share?</span>
                                            <button onClick={() => setFormData({ ...formData, pfApplied: !formData.pfApplied })} 
                                               className={`w-10 h-5 rounded-full transition-colors ${formData.pfApplied ? 'bg-emerald-500' : 'bg-white/20'}`}>
                                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.pfApplied ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="dark-label">ESI Status</label>
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                            <span className="text-white text-sm font-medium">Enable ESI Deduction?</span>
                                            <button onClick={() => setFormData({ ...formData, esiApplied: !formData.esiApplied })} 
                                               className={`w-10 h-5 rounded-full transition-colors ${formData.esiApplied ? 'bg-emerald-500' : 'bg-white/20'}`}>
                                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.esiApplied ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                    {(formData.esiApplied && (formData.yearlyCTC / 12) > 22000) && (
                                        <div>
                                            <label className="dark-label">Manual ESI Yearly (Amount)</label>
                                            <input type="number" className="dark-input border-emerald-500/30" 
                                               placeholder="Enter annual ESI contribution" 
                                               value={formData.esiManualValue} 
                                               onChange={e => setFormData({ ...formData, esiManualValue: parseFloat(e.target.value) })} />
                                            <p className="text-[10px] text-emerald-400 mt-1">* Manual HR Input required for Monthly Gross &gt; 22,000</p>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                        <span className="text-white text-sm font-medium">Company Insurance</span>
                                        <button onClick={() => setFormData({ ...formData, coInsurance: !formData.coInsurance })} className={`w-10 h-5 rounded-full transition-colors ${formData.coInsurance ? 'bg-emerald-500' : 'bg-white/20'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.coInsurance ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                        <span className="text-white text-sm font-medium">Employee Insurance</span>
                                        <button onClick={() => setFormData({ ...formData, empInsurance: !formData.empInsurance })} className={`w-10 h-5 rounded-full transition-colors ${formData.empInsurance ? 'bg-emerald-500' : 'bg-white/20'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.empInsurance ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                        <span className="text-white text-sm font-medium">Food Allowance</span>
                                        <button onClick={() => setFormData({ ...formData, foodAllowance: !formData.foodAllowance })} className={`w-10 h-5 rounded-full transition-colors ${formData.foodAllowance ? 'bg-emerald-500' : 'bg-white/20'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.foodAllowance ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Salary Breakdown */}
                    {step === 2 && (
                        <div className="fade-in">
                            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Final Salary Breakdown (HR Override)</h3>
                            <div className="dark-table-wrap" style={{ maxHeight: 'none' }}>
                                <table style={{ fontSize: '12px' }}>
                                    <thead>
                                        <tr>
                                            <th>Component</th>
                                            <th style={{ textAlign: 'right' }}>Suggestion (M)</th>
                                            <th style={{ textAlign: 'right' }}>HR Input 1</th>
                                            <th style={{ textAlign: 'right' }}>HR Input 2</th>
                                            <th style={{ textAlign: 'right' }}>Final (M)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salaryBreakdown.map((row, idx) => (
                                            <tr key={idx}>
                                                <td style={{ color: 'rgba(255,255,255,0.7)' }}>{row.name}</td>
                                                <td style={{ textAlign: 'right', color: 'rgba(255,255,255,0.3)' }}>{Math.round(row.system_suggested).toLocaleString('en-IN')}</td>
                                                <td><input type="number" className="table-input" value={row.hr_input_1} onChange={e => {
                                                    const newB = [...salaryBreakdown];
                                                    newB[idx].hr_input_1 = parseFloat(e.target.value);
                                                    setSalaryBreakdown(newB);
                                                }} /></td>
                                                <td><input type="number" className="table-input" value={row.hr_input_2} onChange={e => {
                                                    const newB = [...salaryBreakdown];
                                                    newB[idx].hr_input_2 = parseFloat(e.target.value);
                                                    setSalaryBreakdown(newB);
                                                }} /></td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <input type="number" className="table-input-final" value={row.final_value} onChange={e => {
                                                        const newB = [...salaryBreakdown];
                                                        newB[idx].final_value = parseFloat(e.target.value);
                                                        setSalaryBreakdown(newB);
                                                    }} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button
                                    onClick={() => setSalaryBreakdown([...salaryBreakdown, { id: Date.now(), name: 'Custom Allowance', system_suggested: 0, hr_input_1: 0, hr_input_2: 0, final_value: 0 }])}
                                    className="mt-4 flex items-center gap-2 text-emerald-500 text-sm font-semibold p-2"
                                >
                                    <Plus size={16} /> Add Custom Component
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Personal Details */}
                    {step === 3 && (
                        <div className="fade-in">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <section>
                                        <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-4">Company Info</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="dark-label">Company Name</label>
                                                <input className="dark-input" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="dark-label">Company Address</label>
                                                <textarea className="dark-input" rows="2" value={formData.companyAddress} onChange={e => setFormData({ ...formData, companyAddress: e.target.value })} />
                                            </div>
                                        </div>
                                    </section>
                                    <section>
                                        <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-4">Identity & Contact</h4>
                                        <div className="grid grid-cols-4 gap-4">
                                            <div>
                                                <label className="dark-label">Title</label>
                                                <select className="dark-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}>
                                                    <option>Mr</option><option>Ms</option><option>Dr</option>
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <label className="dark-label">First Name</label>
                                                <input className="dark-input" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <label className="dark-label">Middle Name</label>
                                                <input className="dark-input" value={formData.middleName} onChange={e => setFormData({ ...formData, middleName: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="dark-label">Last Name</label>
                                                <input className="dark-input" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <label className="dark-label">Phone</label>
                                                <input className="dark-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="dark-label">Email</label>
                                                <input className="dark-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                            </div>
                                        </div>
                                    </section>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <section>
                                        <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-4">Role & Logistics</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="dark-label">Designation</label>
                                                <input className="dark-input" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="dark-label">Shift Details (Offer Wording)</label>
                                                <input className="dark-input" placeholder="e.g. 9:00 AM to 6:00 PM (Monday to Friday)" 
                                                   value={formData.shiftDetails} onChange={e => setFormData({ ...formData, shiftDetails: e.target.value })} />
                                            </div>
                                        </div>
                                    </section>
                                    <section>
                                        <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-4">Timeline</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="dark-label">Joining Date</label>
                                                <input type="date" className="dark-input" value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="dark-label">Offer Expiry</label>
                                                <input type="date" className="dark-input" value={formData.offerExpiryDate} onChange={e => setFormData({ ...formData, offerExpiryDate: e.target.value })} />
                                            </div>
                                        </div>
                                    </section>
                                    <section>
                                        <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-4">Residential Address</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="dark-label">Local Address</label>
                                                <textarea className="dark-input" rows="2" value={formData.localAddress} onChange={e => setFormData({ ...formData, localAddress: e.target.value })} />
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Rules */}
                    {step === 4 && (
                        <div className="fade-in">
                            <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
                                <h3 className="text-white text-xl font-bold mb-4">Rules, Regulations & Policies</h3>
                                <div className="space-y-4">
                                    <textarea 
                                        className="dark-input font-mono text-sm" 
                                        style={{ minHeight: '300px', lineHeight: '1.6' }}
                                        value={formData.rulesAndRegs}
                                        onChange={e => setFormData({ ...formData, rulesAndRegs: e.target.value })}
                                        placeholder="Type entire rules section here... HR has full control."
                                    />
                                    <p className="text-[11px] text-amber-500/80 mt-2">
                                        * Note: This entire section will be printed as is at the end of the offer letter.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={onClose} className="btn-dark-cancel">Cancel</button>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {step > 1 && (
                            <button onClick={handleBack} className="btn-dark-cancel" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ChevronLeft size={18} /> Back
                            </button>
                        )}
                        {step < 4 ? (
                            <button onClick={handleNext} className="btn-dark-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Next Step <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button onClick={handleGenerate} className="btn-dark-primary" style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>
                                Generate Offer Letter <Download size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfferLetterModal;
