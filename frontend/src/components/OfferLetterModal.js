import React, { useState, useEffect } from 'react';
import { X, Check, ArrowRight, ChevronLeft, Download, Plus, Search, User, Mail, Phone, Hash } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OfferLetterModal = ({ show, onClose, onSave }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // Step 1: Compensation
        yearlyCTC: 600000,
        isMetro: 'Yes',
        pf: 'Yes',
        pfCap: 'Yes',
        coInsurance: true,
        empInsurance: true,
        foodAllowance: true,
        gender: 'Male',
        disability: 'No',
        workState: 'Maharashtra',
        incomeTax: 'No',
        gratuity: 'Yes',

        // Step 3: Personal
        companyName: 'BizOps Technologies Private Limited',
        companyAddress: '123, Tech Park, Hitech City, Hyderabad, Telangana - 500081',
        title: 'Mr',
        firstName: '',
        middleName: '',
        lastName: '',
        phone: '',
        email: '',
        designation: '',
        shiftStart: '09:00',
        shiftEnd: '18:00',
        officeLocation: 'Mumbai',
        localAddress: '',
        permanentAddress: '',
        joiningDate: '',
        offerExpiryDate: '',

        // Step 4: Rules
        responsibilities: [
            'Developing product concepts',
            'Preparing CAD designs',
            'Coordinating with production teams',
            'Conducting prototype analysis',
            'Improving product designs',
            'Material selection',
            'Maintaining BOM records',
            'Ensuring confidentiality'
        ]
    });

    const [salaryBreakdown, setSalaryBreakdown] = useState({});

    // Calculation Logic
    useEffect(() => {
        const ctcYearly = parseFloat(formData.yearlyCTC) || 0;
        const ctcMonthly = ctcYearly / 12;

        const basic = ctcYearly * 0.60;
        const da = basic * 0.10;
        const hra = formData.isMetro === 'Yes' ? basic * 0.40 : basic * 0.30;

        const pfEmployer = formData.pf === 'Yes'
            ? (formData.pfCap === 'Yes' ? Math.min(15000 * 0.12 * 12, basic * 0.12) : basic * 0.12)
            : 0;

        const gratuity = formData.gratuity === 'Yes' ? basic * 0.0481 : 0;

        // Fixed costs (stubs)
        const insuranceCo = formData.coInsurance ? 5000 : 0; // Yearly
        const foodAll = formData.foodAllowance ? 24000 : 0; // Yearly (2k per month)

        // Estimated Gross for ESI
        const estimatedGrossYearly = basic + da + hra + foodAll;
        const isEsiApplicable = (estimatedGrossYearly / 12) <= 21000;

        const esiEmployer = isEsiApplicable ? estimatedGrossYearly * 0.0325 : 0;
        const esiEmployee = isEsiApplicable ? estimatedGrossYearly * 0.0075 : 0;

        const pfEmployee = pfEmployer; // Simplified for mockup

        // Special Allowance = CTC - (all other employer costs)
        const otherEmployerCosts = basic + da + hra + pfEmployer + gratuity + insuranceCo + foodAll + esiEmployer;
        const specialAllowance = Math.max(0, ctcYearly - otherEmployerCosts);

        const breakdown = {
            'Basic Pay': { yearly: basic, monthly: basic / 12 },
            'Dearness Allowance': { yearly: da, monthly: da / 12 },
            'HRA': { yearly: hra, monthly: hra / 12 },
            'Special Allowance': { yearly: specialAllowance, monthly: specialAllowance / 12 },
            'PF Employer Share': { yearly: pfEmployer, monthly: pfEmployer / 12 },
            'PF Employee Share': { yearly: pfEmployee, monthly: pfEmployee / 12 },
            'Food Allowance': { yearly: foodAll, monthly: foodAll / 12 },
            'Gratuity': { yearly: gratuity, monthly: gratuity / 12 },
            'Insurance': { yearly: insuranceCo, monthly: insuranceCo / 12 },
            'ESI Employer Share': { yearly: esiEmployer, monthly: esiEmployer / 12 },
            'ESI Employee Share': { yearly: esiEmployee, monthly: esiEmployee / 12 },
            'Professional Tax': { yearly: 2500, monthly: 200 }, // Stub
            'Income Tax': { yearly: 0, monthly: 0 }, // Stub
        };

        setSalaryBreakdown(breakdown);
    }, [formData]);

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
                is_metro: formData.isMetro,
                pf_applied: formData.pf,
                pf_cap: formData.pfCap,
                insurance_co: formData.coInsurance,
                insurance_emp: formData.empInsurance,
                food_allowance: formData.foodAllowance,
                details: {
                    salaryBreakdown,
                    company: {
                        name: formData.companyName,
                        address: formData.companyAddress
                    },
                    logistics: {
                        shiftStart: formData.shiftStart,
                        shiftEnd: formData.shiftEnd,
                        location: formData.officeLocation
                    },
                    timeline: {
                        joiningDate: formData.joiningDate,
                        offerExpiry: formData.offerExpiryDate
                    },
                    responsibilities: formData.responsibilities
                }
            };

            const response = await axios.post(`${API}/offer-letters`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onSave && onSave(response.data);
            onClose();
        } catch (error) {
            console.error('Error generating offer letter:', error);
            toast.error('Failed to generate offer letter. Please check the fields.');
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
                                        <label className="dark-label">Is this a Metro City? (HRA Rule)</label>
                                        <select className="dark-input" value={formData.isMetro} onChange={e => setFormData({ ...formData, isMetro: e.target.value })}>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="dark-label">Provident Fund (PF)</label>
                                        <select className="dark-input" value={formData.pf} onChange={e => setFormData({ ...formData, pf: e.target.value })}>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="dark-label">PF Cap at 1800?</label>
                                        <select className="dark-input" value={formData.pfCap} onChange={e => setFormData({ ...formData, pfCap: e.target.value })}>
                                            <option value="Yes">Yes (12% of ₹15,000)</option>
                                            <option value="No">No (Full Basic)</option>
                                        </select>
                                    </div>
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
                            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Salary Breakdown</h3>
                            <div className="dark-table-wrap" style={{ maxHeight: 'none' }}>
                                <table style={{ fontSize: '13px' }}>
                                    <thead>
                                        <tr>
                                            <th>Component</th>
                                            <th style={{ textAlign: 'right' }}>Monthly (₹)</th>
                                            <th style={{ textAlign: 'right' }}>Yearly (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(salaryBreakdown).map(([name, values]) => (
                                            <tr key={name}>
                                                <td style={{ color: 'rgba(255,255,255,0.7)' }}>{name}</td>
                                                <td style={{ textAlign: 'right', color: '#fff', fontWeight: 500 }}>{Math.round(values.monthly).toLocaleString('en-IN')}</td>
                                                <td style={{ textAlign: 'right', color: '#fff', fontWeight: 500 }}>{Math.round(values.yearly).toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                                            <td style={{ color: '#fff', fontWeight: 700 }}>Total Cost To Company</td>
                                            <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{Math.round(formData.yearlyCTC / 12).toLocaleString('en-IN')}</td>
                                            <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{Math.round(formData.yearlyCTC).toLocaleString('en-IN')}</td>
                                        </tr>
                                    </tfoot>
                                </table>
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
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="dark-label">Shift Start</label>
                                                    <input type="time" className="dark-input" value={formData.shiftStart} onChange={e => setFormData({ ...formData, shiftStart: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="dark-label">Shift End</label>
                                                    <input type="time" className="dark-input" value={formData.shiftEnd} onChange={e => setFormData({ ...formData, shiftEnd: e.target.value })} />
                                                </div>
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
                                <h3 className="text-white text-xl font-bold mb-4">Employment Responsibilities & Duties</h3>
                                <div className="space-y-4">
                                    {formData.responsibilities.map((resp, idx) => (
                                        <div key={idx} className="flex items-center gap-4 group">
                                            <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs font-bold">
                                                {idx + 1}
                                            </div>
                                            <input
                                                className="bg-transparent border-none text-white/80 focus:ring-0 flex-1 text-sm outline-none"
                                                value={resp}
                                                onChange={e => {
                                                    const newResp = [...formData.responsibilities];
                                                    newResp[idx] = e.target.value;
                                                    setFormData({ ...formData, responsibilities: newResp });
                                                }}
                                            />
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setFormData({ ...formData, responsibilities: [...formData.responsibilities, ''] })}
                                        className="mt-6 flex items-center gap-2 text-emerald-500 text-sm font-semibold hover:text-emerald-400 transition-colors"
                                    >
                                        <Plus size={16} /> Add Responsibility
                                    </button>
                                </div>
                            </div>
                            <div className="mt-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                    <Hash size={20} className="text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-bold mb-1">Confidentiality Note</p>
                                    <p className="text-white/50 text-xs leading-relaxed">Generated offer letters are legal documents. Ensure all responsibilities align with organizational policies before finalizing.</p>
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
