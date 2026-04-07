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
        
        // Screenshot 2 Additions
        ptApplied: false,
        itApplied: false,
        gratuityApplied: false,
        gratuityFormula: '4.81',
        incrementAmount: 0,
        incrementTillDate: '',
        promotionLevel: '',
        promotionTillDate: '',

        // Personal
        companyName: 'BizOps Technologies Private Limited',
        companyAddress: '123, Tech Park, Hitech City, Hyderabad, Telangana - 500081',
        title: 'Mr',
        firstName: '',
        middleName: '',
        lastName: '',
        phone: '',
        email: '',
        aadhaarNumber: '',
        designation: '',
        officeLocation: 'Mumbai',
        localAddress: '',
        permanentAddress: '',
        joiningDate: '',
        offerExpiryDate: '',
        workMode: 'Work from Office', // Hybrid, Remote, Office
        shiftDetails: 'General Shift: 09:30 AM to 06:30 PM',

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

        if (formData.ptApplied) {
            calculatedComponents.push({ id: 6, name: 'Professional Tax', system_suggested: 200, hr_input_1: 200, hr_input_2: 200, final_value: 200 });
        }
        if (formData.itApplied) {
            calculatedComponents.push({ id: 7, name: 'Income Tax (IT)', system_suggested: 0, hr_input_1: 0, hr_input_2: 0, final_value: 0 });
        }

        // Preservation of manual changes if already edited
        if (salaryBreakdown.length > 0) {
            setSalaryBreakdown(salaryBreakdown.map(comp => {
                const updated = calculatedComponents.find(c => c.name === comp.name);
                return updated ? { ...updated, hr_input_1: comp.hr_input_1, hr_input_2: comp.hr_input_2, final_value: comp.final_value } : comp;
            }));
            // Add any newly enabled components that weren't there
            calculatedComponents.forEach(c => {
                if (!salaryBreakdown.find(comp => comp.name === c.name)) {
                    setSalaryBreakdown(prev => [...prev, c]);
                }
            });
        } else {
            setSalaryBreakdown(calculatedComponents);
        }
    }, [formData.yearlyCTC, formData.isMetro, formData.pfApplied, formData.foodAllowance, formData.esiApplied, formData.ptApplied, formData.itApplied]);

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
        // --- Client-side validation ---
        const name = `${formData.firstName} ${formData.lastName}`.trim();
        if (!name || name === '') { toast.error('Please enter the candidate name.'); return; }
        if (!formData.email) { toast.error('Please enter the candidate email.'); return; }
        if (!formData.phone) { toast.error('Please enter the candidate phone number.'); return; }
        if (!formData.designation) { toast.error('Please enter the designation.'); return; }
        const ctc = parseFloat(formData.yearlyCTC);
        if (!ctc || isNaN(ctc) || ctc <= 0) { toast.error('Please enter a valid CTC amount.'); return; }

        try {
            const token = localStorage.getItem('token');
            // --- Correctly structured flat payload ---
            const payload = {
                name,
                email: formData.email,
                phone: formData.phone,
                designation: formData.designation,
                ctc_yearly: ctc,
                esi_enabled: formData.esiApplied || false,
                pf_enabled: formData.pfApplied || false,
                pt_enabled: formData.ptApplied || false,
                it_enabled: formData.itApplied || false,
                gratuity_enabled: formData.gratuityApplied || false,
                details: {
                    salaryBreakdown,
                    aadhaar: formData.aadhaarNumber || '',
                    pan: formData.panNumber || '',
                    fatherName: formData.fatherName || '',
                    location: formData.officeLocation || '',
                    company: {
                        name: formData.companyName,
                        address: formData.companyAddress
                    },
                    timeline: {
                        joiningDate: formData.joiningDate || '',
                        offerExpiry: formData.offerExpiryDate || '',
                        shift: formData.shiftDetails || '',
                        workMode: formData.workMode || 'Work from Office'
                    },
                    rulesAndRegs: formData.rulesAndRegs || ''
                }
            };

            const response = await axios.post(`${API}/offer-letters`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Offer letter generated successfully!');
            onSave && onSave(response.data);
            onClose();
        } catch (error) {
            const msg = error?.response?.data?.detail || error?.message || 'Unknown error';
            toast.error(`Failed to generate offer letter: ${msg}`);
            console.error('Offer letter generation error:', error?.response?.data);
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
                                {/* Left Column: Current Setup */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label className="dark-label">Yearly CTC (₹) *</label>
                                        <input type="number" className="dark-input" value={formData.yearlyCTC} onChange={e => setFormData({ ...formData, yearlyCTC: e.target.value })} />
                                        <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                                            Monthly CTC: <span style={{ color: '#fff', fontWeight: 600 }}>₹{(formData.yearlyCTC / 12).toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="dark-label text-xs uppercase text-emerald-500 font-bold">Standard Deductions</label>
                                        <div className="space-y-2 mt-2">
                                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                <span className="text-white text-xs font-medium">Enable PF Contribution?</span>
                                                <button onClick={() => setFormData({ ...formData, pfApplied: !formData.pfApplied })} 
                                                   className={`w-8 h-4 rounded-full transition-colors ${formData.pfApplied ? 'bg-emerald-500' : 'bg-white/20'}`}>
                                                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${formData.pfApplied ? 'translate-x-4' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                <span className="text-white text-xs font-medium">Enable ESI Deduction?</span>
                                                <button onClick={() => setFormData({ ...formData, esiApplied: !formData.esiApplied })} 
                                                   className={`w-8 h-4 rounded-full transition-colors ${formData.esiApplied ? 'bg-emerald-500' : 'bg-white/20'}`}>
                                                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${formData.esiApplied ? 'translate-x-4' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {(formData.esiApplied && (formData.yearlyCTC / 12) > 22000) && (
                                        <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                                            <label className="dark-label text-[10px]">ESI Manual Yearly Amount</label>
                                            <input type="number" className="dark-input h-8 text-xs mt-1" 
                                               value={formData.esiManualValue} 
                                               onChange={e => setFormData({ ...formData, esiManualValue: parseFloat(e.target.value) })} />
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Statutory & Insurance */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                         <label className="dark-label text-xs uppercase text-emerald-500 font-bold">Enterprise Toggles (Statutory)</label>
                                         <div className="grid grid-cols-2 gap-3 mt-2">
                                             <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                 <span className="text-white text-[10px] font-medium">Prof. Tax</span>
                                                 <button onClick={() => setFormData({ ...formData, ptApplied: !formData.ptApplied })} className={`w-8 h-4 rounded-full transition-colors ${formData.ptApplied ? 'bg-emerald-500' : 'bg-white/20'}`}>
                                                     <div className={`w-3 h-3 bg-white rounded-full transition-transform ${formData.ptApplied ? 'translate-x-4' : 'translate-x-1'}`} />
                                                 </button>
                                             </div>
                                             <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                 <span className="text-white text-[10px] font-medium">Income Tax</span>
                                                 <button onClick={() => setFormData({ ...formData, itApplied: !formData.itApplied })} className={`w-8 h-4 rounded-full transition-colors ${formData.itApplied ? 'bg-emerald-500' : 'bg-white/20'}`}>
                                                     <div className={`w-3 h-3 bg-white rounded-full transition-transform ${formData.itApplied ? 'translate-x-4' : 'translate-x-1'}`} />
                                                 </button>
                                             </div>
                                         </div>
                                     </div>

                                     <div>
                                        <label className="dark-label text-xs uppercase text-emerald-500 font-bold">Shift & Work Mode</label>
                                        <div className="grid grid-cols-1 gap-3 mt-2">
                                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                                                {['Work from Office', 'Hybrid', 'Remote'].map(mode => (
                                                    <button key={mode} 
                                                        onClick={() => setFormData({...formData, workMode: mode})}
                                                        className={`flex-1 py-1.5 px-3 rounded-lg text-[9px] font-bold transition-all ${formData.workMode === mode ? 'bg-emerald-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                     </div>

                                     <div>
                                        <label className="dark-label text-xs uppercase text-emerald-500 font-bold">Insurance & Food</label>
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                            <button onClick={() => setFormData({ ...formData, coInsurance: !formData.coInsurance })} 
                                                className={`p-2 rounded-lg border text-[10px] ${formData.coInsurance ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                                Co. Ins.
                                            </button>
                                            <button onClick={() => setFormData({ ...formData, empInsurance: !formData.empInsurance })} 
                                                className={`p-2 rounded-lg border text-[10px] ${formData.empInsurance ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                                Emp. Ins.
                                            </button>
                                            <button onClick={() => setFormData({ ...formData, foodAllowance: !formData.foodAllowance })} 
                                                className={`p-2 rounded-lg border text-[10px] ${formData.foodAllowance ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                                Food
                                            </button>
                                        </div>
                                     </div>
                                </div>
                            </div>

                            {/* Section: SS-02 (Increment, Promotion, Gratuity) */}
                            <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-8">
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                    <h4 className="text-emerald-500 text-xs uppercase font-bold tracking-widest mb-4">Increment & Promotion tracking</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="dark-label text-[10px]">Increment (Rupees)</label>
                                            <input type="number" className="dark-input h-9 text-sm" value={formData.incrementAmount} onChange={e => setFormData({...formData, incrementAmount: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="dark-label text-[10px]">Till Date</label>
                                            <input type="date" className="dark-input h-9 text-sm" value={formData.incrementTillDate} onChange={e => setFormData({...formData, incrementTillDate: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="dark-label text-[10px]">Promotion Level</label>
                                            <input type="text" className="dark-input h-9 text-sm" placeholder="e.g. L2" value={formData.promotionLevel} onChange={e => setFormData({...formData, promotionLevel: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="dark-label text-[10px]">Till Date</label>
                                            <input type="date" className="dark-input h-9 text-sm" value={formData.promotionTillDate} onChange={e => setFormData({...formData, promotionTillDate: e.target.value})} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-emerald-500 text-xs uppercase font-bold tracking-widest">Gratuity Settings</h4>
                                        <button onClick={() => setFormData({ ...formData, gratuityApplied: !formData.gratuityApplied })} className={`w-8 h-4 rounded-full transition-colors ${formData.gratuityApplied ? 'bg-emerald-500' : 'bg-white/20'}`}>
                                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${formData.gratuityApplied ? 'translate-x-4' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                    {formData.gratuityApplied && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="dark-label text-[10px]">Formula in Percentage (%)</label>
                                                <input type="text" className="dark-input h-9 text-sm" value={formData.gratuityFormula} onChange={e => setFormData({...formData, gratuityFormula: e.target.value})} />
                                            </div>
                                            <p className="text-[10px] text-white/40 italic">* Calculated till date after increment change.</p>
                                        </div>
                                    )}
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
                                                <td style={{ textAlign: 'right' }}>
                                                     <input type="number" 
                                                        className="dark-input h-8 text-xs text-right border-white/5 bg-white/5 focus:border-emerald-500/50" 
                                                        value={row.hr_input_1} 
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            const newB = [...salaryBreakdown];
                                                            newB[idx].hr_input_1 = val;
                                                            newB[idx].final_value = val || newB[idx].hr_input_2 || row.system_suggested;
                                                            setSalaryBreakdown(newB);
                                                        }} />
                                                 </td>
                                                 <td style={{ textAlign: 'right' }}>
                                                     <input type="number" 
                                                        className="dark-input h-8 text-xs text-right border-white/5 bg-white/5 focus:border-emerald-500/50" 
                                                        value={row.hr_input_2} 
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            const newB = [...salaryBreakdown];
                                                            newB[idx].hr_input_2 = val;
                                                            newB[idx].final_value = val || newB[idx].hr_input_1 || row.system_suggested;
                                                            setSalaryBreakdown(newB);
                                                        }} />
                                                 </td>
                                                 <td style={{ textAlign: 'right' }}>
                                                     <div className="h-8 flex items-center justify-end px-3 rounded bg-emerald-500/10 text-emerald-400 font-bold text-xs ring-1 ring-emerald-500/20">
                                                        ₹{Math.round(row.final_value).toLocaleString('en-IN')}
                                                     </div>
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
                                        <div className="mt-4">
                                            <label className="dark-label">Aadhaar Number</label>
                                            <input className="dark-input" placeholder="XXXX XXXX XXXX" value={formData.aadhaarNumber} onChange={e => setFormData({ ...formData, aadhaarNumber: e.target.value })} />
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
                                                <label className="dark-label">Office Location (Place of Joining)</label>
                                                <input className="dark-input" placeholder="e.g. Noida, Mumbai" 
                                                   value={formData.officeLocation} onChange={e => setFormData({ ...formData, officeLocation: e.target.value })} />
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
