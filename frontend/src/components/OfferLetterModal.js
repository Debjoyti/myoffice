import React, { useState, useEffect } from 'react';
import { X, Check, ArrowRight, ChevronLeft, Download, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ─── Build auto-suggested rows from CTC + toggles ─────────────────────────
const buildRows = (ctcYearly, isMetro, pf, esi, esiManual, pt, it, food) => {
    const monthly = parseFloat(ctcYearly) / 12 || 0;
    const basic   = monthly * 0.50;
    const hra     = basic * (isMetro === 'Yes' ? 0.40 : 0.30);
    const foodAmt = food ? 2000 : 0;
    const pfAmt   = pf   ? Math.min(1800, basic * 0.12) : 0;
    const special = Math.max(0, monthly - basic - hra - foodAmt - pfAmt);
    const esiAmt  = esi  ? (monthly <= 22000 ? Math.round(monthly * 0.0325) : parseFloat(esiManual) || 0) : 0;

    const mkE = (id, name, amount, locked) => ({ id, name, amount: Math.round(amount), locked });
    const mkD = (id, name, amount, locked) => ({ id, name, amount: Math.round(amount), locked });

    return {
        earnings: [
            mkE(1, 'Basic Salary',         basic,   true),
            mkE(2, 'House Rent Allowance', hra,     true),
            mkE(3, 'Special Allowance',    special, true),
            mkE(4, 'Other Allowance',      foodAmt, true),
        ],
        deductions: [
            mkD(1, 'Provident Fund (EPF)', pfAmt,      true),
            mkD(2, 'Professional Tax',     pt ? 200:0, true),
            mkD(3, 'Income Tax IT',        it ? 0:0,   true),
            mkD(4, 'ESI',                  esiAmt,     true),
        ],
    };
};

// ─── Toggle ────────────────────────────────────────────────────────────────
const Tog = ({ value, onChange }) => (
    <button type="button" onClick={() => onChange(!value)} style={{
        width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', flexShrink: 0,
        background: value ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.15)',
        position: 'relative', transition: 'background 0.25s',
    }}>
        <div style={{ position: 'absolute', top: '3px', left: value ? '18px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left 0.25s' }} />
    </button>
);
const TogRow = ({ label, value, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{label}</span>
        <Tog value={value} onChange={onChange} />
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════
const OfferLetterModal = ({ show, onClose, onSave }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        yearlyCTC: 600000, isMetro: 'Yes',
        pfApplied: true, esiApplied: false, esiManualValue: 0,
        ptApplied: false, itApplied: false, gratuityApplied: false,
        foodAllowance: true, coInsurance: true, empInsurance: true,
        gratuityFormula: '4.81', incrementAmount: 0, incrementTillDate: '',
        promotionLevel: '', promotionTillDate: '',
        companyName: 'BizOps Technologies Private Limited',
        companyAddress: '123, Tech Park, Hitech City, Hyderabad - 500081',
        companyCIN: 'U72200MH2000PTC125631', companyPhone: '+91 908 256 1327', companyWebsite: 'www.bizops.in',
        title: 'Mr', firstName: '', middleName: '', lastName: '',
        phone: '', email: '', aadhaarNumber: '', designation: '',
        officeLocation: 'Mumbai', localAddress: '', joiningDate: '', offerExpiryDate: '',
        workMode: 'Work from Office', shiftDetails: 'General Shift: 09:30 AM to 06:30 PM',
        rulesAndRegs: `1. Employment Duties: Your duties will be defined by your reporting manager.\n2. Probation: You will be on probation for 6 months.\n3. Confidentiality: You shall maintain standard corporate confidentiality.\n4. Leave Policy: As per company norms.`,
    });

    const [earnings,   setEarnings]   = useState([]);
    const [deductions, setDeductions] = useState([]);

    // Rebuild rows whenever Step-1 toggles change
    useEffect(() => {
        const { earnings: e, deductions: d } = buildRows(
            formData.yearlyCTC, formData.isMetro,
            formData.pfApplied, formData.esiApplied, formData.esiManualValue,
            formData.ptApplied, formData.itApplied, formData.foodAllowance
        );
        setEarnings(prev   => e.map((r, i) => (prev[i] && !r.locked) ? { ...r, name: prev[i].name, amount: prev[i].amount } : r));
        setDeductions(prev => d.map((r, i) => (prev[i] && !r.locked) ? { ...r, name: prev[i].name, amount: prev[i].amount } : r));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.yearlyCTC, formData.isMetro, formData.pfApplied, formData.esiApplied,
        formData.esiManualValue, formData.ptApplied, formData.itApplied, formData.foodAllowance]);

    if (!show) return null;

    const monthly  = parseFloat(formData.yearlyCTC) / 12 || 0;
    const esiAbove = formData.esiApplied && monthly > 22000;
    const totalE   = earnings.reduce((s, r) => s + (r.amount || 0), 0);
    const totalD   = deductions.reduce((s, r) => s + (r.amount || 0), 0);
    const netSal   = totalE - totalD;

    const updE = (i, f, v) => setEarnings(p   => { const n = [...p]; n[i] = { ...n[i], [f]: v }; return n; });
    const updD = (i, f, v) => setDeductions(p => { const n = [...p]; n[i] = { ...n[i], [f]: v }; return n; });

    const addEarning   = () => setEarnings(p   => [...p, { id: Date.now(), name: '', amount: 0, locked: false }]);
    const addDeduction = () => setDeductions(p => [...p, { id: Date.now(), name: '', amount: 0, locked: false }]);
    const removeE = (i) => setEarnings(p   => p.filter((_, ii) => ii !== i));
    const removeD = (i) => setDeductions(p => p.filter((_, ii) => ii !== i));

    const numStyle = (locked, col) => ({
        background: locked ? `${col}14` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${locked ? `${col}35` : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '7px', padding: '5px 8px', color: locked ? col : '#fff',
        fontSize: '12px', outline: 'none', textAlign: 'right', width: '100%',
    });

    const buildBreakdown = () => {
        const rows = [];
        earnings.forEach((e, i) => { if (e.name || e.amount) rows.push({ id: `e${i+1}`, name: e.name || `Earning ${i+1}`, category: i < 4 ? 'fixed' : 'custom', final_value: e.amount || 0, type: 'earning' }); });
        deductions.forEach((d, i) => { if (d.name || d.amount) rows.push({ id: `d${i+1}`, name: d.name || `Deduction ${i+1}`, category: 'deduction', final_value: d.amount || 0, type: 'deduction' }); });
        return rows;
    };

    const handleGenerate = async () => {
        const name = `${formData.firstName} ${formData.lastName}`.trim();
        if (!name)               { toast.error('Please enter candidate name.');  return; }
        if (!formData.email)     { toast.error('Please enter candidate email.'); return; }
        if (!formData.phone)     { toast.error('Please enter candidate phone.'); return; }
        if (!formData.designation){ toast.error('Please enter designation.');    return; }
        const ctc = parseFloat(formData.yearlyCTC);
        if (!ctc || isNaN(ctc) || ctc <= 0) { toast.error('Enter a valid CTC.'); return; }
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API}/offer-letters`, {
                name, email: formData.email, phone: formData.phone,
                designation: formData.designation, ctc_yearly: ctc,
                esi_enabled: formData.esiApplied, pf_enabled: formData.pfApplied,
                pt_enabled: formData.ptApplied, it_enabled: formData.itApplied,
                gratuity_enabled: formData.gratuityApplied,
                details: {
                    salaryBreakdown: buildBreakdown(), earningsRows: earnings, deductionRows: deductions,
                    totalEarnings: totalE, totalDeductions: totalD, netSalary: netSal,
                    aadhaar: formData.aadhaarNumber, location: formData.officeLocation,
                    company: { name: formData.companyName, address: formData.companyAddress, cin: formData.companyCIN, phone: formData.companyPhone, website: formData.companyWebsite },
                    timeline: { joiningDate: formData.joiningDate, offerExpiry: formData.offerExpiryDate, shift: formData.shiftDetails, workMode: formData.workMode },
                    rulesAndRegs: formData.rulesAndRegs,
                },
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Offer letter generated!');
            onSave && onSave(res.data);
            onClose();
        } catch (err) { toast.error(`Failed: ${err?.response?.data?.detail || err?.message}`); }
    };

    const STEPS = [{ id:1, name:'Compensation' }, { id:2, name:'Salary Format' }, { id:3, name:'Personal' }, { id:4, name:'Rules' }];

    const renderStepHeader = () => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', marginBottom: '32px' }}>
            {STEPS.map((s, idx) => (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
                    <div onClick={() => setStep(s.id)} style={{ width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', background: step === s.id ? 'linear-gradient(135deg,#10b981,#059669)' : step > s.id ? '#10b981' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 600, border: step === s.id ? '2px solid rgba(16,185,129,0.3)' : 'none', boxShadow: step === s.id ? '0 0 15px rgba(16,185,129,0.4)' : 'none' }}>
                        {step > s.id ? <Check size={16} /> : s.id}
                    </div>
                    <span style={{ fontSize: '12px', color: step >= s.id ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: 500, whiteSpace: 'nowrap' }}>{s.name}</span>
                    {idx < STEPS.length - 1 && <div style={{ position: 'absolute', top: '16px', left: '52px', width: '40px', height: '1px', background: step > s.id ? '#10b981' : 'rgba(255,255,255,0.1)' }} />}
                </div>
            ))}
        </div>
    );

    return (
        <div className="dark-modal-overlay" style={{ zIndex: 2000 }}>
            <div className="dark-modal" style={{ maxWidth: '960px', width: '97%', padding: '0', height: '90vh', display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0 }}>Generate Offer Letter</h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '3px 0 0' }}>HR-controlled · System suggests, HR decides</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
                    {renderStepHeader()}

                    {/* ══════════ STEP 1: Compensation ══════════ */}
                    {step === 1 && (
                        <div className="fade-in">
                            <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: 700, marginBottom: '22px' }}>Compensation &amp; Statutory Settings</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                                {/* Left */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    <div>
                                        <label className="dark-label">Yearly CTC (₹) *</label>
                                        <input type="number" className="dark-input" value={formData.yearlyCTC} onChange={e => setFormData({ ...formData, yearlyCTC: e.target.value })} />
                                        <div style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                                            Monthly: <span style={{ color: '#fff', fontWeight: 700 }}>₹{Math.round(monthly).toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="dark-label" style={{ marginBottom: '8px', display: 'block' }}>City Type (affects HRA)</label>
                                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255,255,255,0.07)' }}>
                                            {['Yes', 'No'].map(v => (
                                                <button key={v} type="button" onClick={() => setFormData({ ...formData, isMetro: v })} style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: formData.isMetro === v ? 'rgba(16,185,129,0.85)' : 'transparent', color: formData.isMetro === v ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>
                                                    {v === 'Yes' ? '🏙 Metro (HRA 40%)' : '🌆 Non-Metro (HRA 30%)'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="dark-label" style={{ marginBottom: '8px', display: 'block' }}>Work Mode</label>
                                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255,255,255,0.07)' }}>
                                            {['Work from Office', 'Hybrid', 'Remote'].map(m => (
                                                <button key={m} type="button" onClick={() => setFormData({ ...formData, workMode: m })} style={{ flex: 1, padding: '8px 4px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, background: formData.workMode === m ? 'rgba(99,102,241,0.85)' : 'transparent', color: formData.workMode === m ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }}>
                                                    {m}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#10b981', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Increment &amp; Promotion</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div><label className="dark-label" style={{ fontSize: '10px' }}>Increment (₹)</label><input type="number" className="dark-input" style={{ fontSize: '12px', height: '34px' }} value={formData.incrementAmount} onChange={e => setFormData({ ...formData, incrementAmount: e.target.value })} /></div>
                                            <div><label className="dark-label" style={{ fontSize: '10px' }}>Till Date</label><input type="date" className="dark-input" style={{ fontSize: '12px', height: '34px' }} value={formData.incrementTillDate} onChange={e => setFormData({ ...formData, incrementTillDate: e.target.value })} /></div>
                                            <div><label className="dark-label" style={{ fontSize: '10px' }}>Promotion Level</label><input className="dark-input" style={{ fontSize: '12px', height: '34px' }} placeholder="e.g. L3" value={formData.promotionLevel} onChange={e => setFormData({ ...formData, promotionLevel: e.target.value })} /></div>
                                            <div><label className="dark-label" style={{ fontSize: '10px' }}>Till Date</label><input type="date" className="dark-input" style={{ fontSize: '12px', height: '34px' }} value={formData.promotionTillDate} onChange={e => setFormData({ ...formData, promotionTillDate: e.target.value })} /></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Toggles */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#10b981', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Statutory Toggles</p>
                                    <TogRow label="Provident Fund (PF) — 12% of Basic"  value={formData.pfApplied}     onChange={v => setFormData({ ...formData, pfApplied: v })} />
                                    <TogRow label="ESI (Employee State Insurance)"       value={formData.esiApplied}    onChange={v => setFormData({ ...formData, esiApplied: v })} />
                                    {esiAbove && (
                                        <div style={{ padding: '12px 14px', background: 'rgba(245,158,11,0.06)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                                            <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#fbbf24', fontWeight: 600 }}>⚠ Salary &gt; ₹22,000/month — Enter ESI manually</p>
                                            <input type="number" className="dark-input" placeholder="ESI monthly amount (₹)" style={{ fontSize: '12px', height: '34px' }} value={formData.esiManualValue} onChange={e => setFormData({ ...formData, esiManualValue: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                    )}
                                    <TogRow label="Professional Tax (PT) — ₹200/month" value={formData.ptApplied}     onChange={v => setFormData({ ...formData, ptApplied: v })} />
                                    <TogRow label="Income Tax / TDS"                   value={formData.itApplied}     onChange={v => setFormData({ ...formData, itApplied: v })} />
                                    <TogRow label="Food Allowance — ₹2,000/month"      value={formData.foodAllowance} onChange={v => setFormData({ ...formData, foodAllowance: v })} />
                                    <TogRow label="Company Insurance"                  value={formData.coInsurance}   onChange={v => setFormData({ ...formData, coInsurance: v })} />
                                    <TogRow label="Employee Insurance"                 value={formData.empInsurance}  onChange={v => setFormData({ ...formData, empInsurance: v })} />
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '10px', marginTop: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <p style={{ margin: 0, fontSize: '11px', color: '#10b981', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Gratuity</p>
                                            <Tog value={formData.gratuityApplied} onChange={v => setFormData({ ...formData, gratuityApplied: v })} />
                                        </div>
                                        {formData.gratuityApplied && (
                                            <div>
                                                <label className="dark-label" style={{ fontSize: '10px' }}>Formula (% of Basic)</label>
                                                <input className="dark-input" style={{ fontSize: '12px', height: '34px' }} value={formData.gratuityFormula} onChange={e => setFormData({ ...formData, gratuityFormula: e.target.value })} />
                                                <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Calculated till date after increment change.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════ STEP 2: BILATERAL SALARY FORMAT ══════════ */}
                    {step === 2 && (
                        <div className="fade-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: 700, margin: 0 }}>Salary Format</h3>
                                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                                        Rows 1–4 auto-suggested · Rows 5–14: HR enters name &amp; amount manually · After create offer letter, use advance C-F
                                    </p>
                                </div>
                                <div style={{ padding: '6px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '11px', color: '#10b981', fontWeight: 600 }}>System Suggestion Mode</div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>

                                {/* Column headers */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    {[['PARTICULARS (EARNINGS)', 'AMOUNT (₹)'], ['PARTICULARS (DEDUCTIONS)', 'AMOUNT (₹)']].map(([a, b], ci) => (
                                        <div key={ci} style={{ padding: '10px 20px', display: 'grid', gridTemplateColumns: '24px 1fr 110px', gap: '8px', borderLeft: ci ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>#</span>
                                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>{a}</span>
                                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', textAlign: 'right' }}>{b}</span>
                                        </div>
                                    ))}
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
                                                    : <input value={earn.name} onChange={e => updE(idx, 'name', e.target.value)} placeholder="Earning name" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '5px 8px', color: '#fff', fontSize: '12px', outline: 'none', width: '100%' }} />
                                                }
                                                <input type="number" value={earn.amount || ''} onChange={e => updE(idx, 'amount', parseFloat(e.target.value) || 0)} placeholder="0" style={numStyle(earn.locked, '#10b981')} />
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
                                                    : <input value={ded.name} onChange={e => updD(idx, 'name', e.target.value)} placeholder="Deduction name" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '5px 8px', color: '#fff', fontSize: '12px', outline: 'none', width: '100%' }} />
                                                }
                                                <input type="number" value={ded.amount || ''} onChange={e => updD(idx, 'amount', parseFloat(e.target.value) || 0)} placeholder="0" style={numStyle(ded.locked, '#f87171')} />
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

                                {/* Totals */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255,255,255,0.04)', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ padding: '13px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Total Earnings</span>
                                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>₹{Math.round(totalE).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div style={{ padding: '13px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Total Deductions</span>
                                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#f87171' }}>₹{Math.round(totalD).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                {/* Net Salary */}
                                <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.06))', borderTop: '1px solid rgba(16,185,129,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Net Salary (Monthly)</p>
                                        <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Total Earnings − Total Deductions</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '26px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>₹{Math.round(netSal).toLocaleString('en-IN')}</div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>Annual: ₹{Math.round(netSal * 12).toLocaleString('en-IN')}</div>
                                    </div>
                                </div>

                                {/* Exit notice */}
                                <div style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.04)', borderTop: '1px solid rgba(239,68,68,0.12)' }}>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>📋 After generating offer letter → <span style={{ color: '#f87171', fontWeight: 600 }}>Exit with Reason</span> must be documented in Resignations module</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════ STEP 3: Personal Details ══════════ */}
                    {step === 3 && (
                        <div className="fade-in">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <section>
                                        <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-4">Company Info</h4>
                                        <div className="space-y-4">
                                            <div><label className="dark-label">Company Name</label><input className="dark-input" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} /></div>
                                            <div><label className="dark-label">CIN</label><input className="dark-input" value={formData.companyCIN} onChange={e => setFormData({ ...formData, companyCIN: e.target.value })} /></div>
                                            <div><label className="dark-label">Company Address</label><textarea className="dark-input" rows="2" value={formData.companyAddress} onChange={e => setFormData({ ...formData, companyAddress: e.target.value })} /></div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                <div><label className="dark-label">Phone</label><input className="dark-input" value={formData.companyPhone} onChange={e => setFormData({ ...formData, companyPhone: e.target.value })} /></div>
                                                <div><label className="dark-label">Website</label><input className="dark-input" value={formData.companyWebsite} onChange={e => setFormData({ ...formData, companyWebsite: e.target.value })} /></div>
                                            </div>
                                        </div>
                                    </section>
                                    <section>
                                        <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-4">Identity &amp; Contact</h4>
                                        <div className="grid grid-cols-4 gap-4">
                                            <div><label className="dark-label">Title</label><select className="dark-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}><option>Mr</option><option>Ms</option><option>Dr</option></select></div>
                                            <div className="col-span-3"><label className="dark-label">First Name</label><input className="dark-input" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div><label className="dark-label">Middle Name</label><input className="dark-input" value={formData.middleName} onChange={e => setFormData({ ...formData, middleName: e.target.value })} /></div>
                                            <div><label className="dark-label">Last Name</label><input className="dark-input" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div><label className="dark-label">Phone</label><input className="dark-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                                            <div><label className="dark-label">Email</label><input className="dark-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                                        </div>
                                        <div className="mt-4"><label className="dark-label">Aadhaar Number</label><input className="dark-input" placeholder="XXXX XXXX XXXX" value={formData.aadhaarNumber} onChange={e => setFormData({ ...formData, aadhaarNumber: e.target.value })} /></div>
                                    </section>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <section>
                                        <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-4">Role &amp; Logistics</h4>
                                        <div className="space-y-4">
                                            <div><label className="dark-label">Designation</label><input className="dark-input" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} /></div>
                                            <div><label className="dark-label">Office Location (Place of Joining)</label><input className="dark-input" placeholder="e.g. Noida, Mumbai" value={formData.officeLocation} onChange={e => setFormData({ ...formData, officeLocation: e.target.value })} /></div>
                                            <div><label className="dark-label">Shift Details (Offer Wording)</label><input className="dark-input" placeholder="e.g. 9:00 AM to 6:00 PM (Mon–Fri)" value={formData.shiftDetails} onChange={e => setFormData({ ...formData, shiftDetails: e.target.value })} /></div>
                                        </div>
                                    </section>
                                    <section>
                                        <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-4">Timeline</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="dark-label">Joining Date</label><input type="date" className="dark-input" value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} /></div>
                                            <div><label className="dark-label">Offer Expiry</label><input type="date" className="dark-input" value={formData.offerExpiryDate} onChange={e => setFormData({ ...formData, offerExpiryDate: e.target.value })} /></div>
                                        </div>
                                    </section>
                                    <section>
                                        <h4 className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-4">Address</h4>
                                        <div><label className="dark-label">Local Address</label><textarea className="dark-input" rows="2" value={formData.localAddress} onChange={e => setFormData({ ...formData, localAddress: e.target.value })} /></div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════ STEP 4: Rules ══════════ */}
                    {step === 4 && (
                        <div className="fade-in">
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '28px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Rules, Regulations &amp; Policies</h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0 0 20px' }}>This section appears verbatim in the offer letter. HR writes everything — no system content injected.</p>
                                <textarea className="dark-input" style={{ minHeight: '300px', lineHeight: '1.7', fontFamily: 'monospace', fontSize: '13px' }} value={formData.rulesAndRegs} onChange={e => setFormData({ ...formData, rulesAndRegs: e.target.value })} placeholder="Type the entire rules section here..." />
                                <p style={{ fontSize: '11px', color: 'rgba(245,158,11,0.7)', marginTop: '8px' }}>* Printed as-is in the offer letter. Character count: {formData.rulesAndRegs.length}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <button onClick={onClose} className="btn-dark-cancel">Cancel</button>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {step > 1 && (
                            <button onClick={() => setStep(step - 1)} className="btn-dark-cancel" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ChevronLeft size={18} /> Back
                            </button>
                        )}
                        {step < 4
                            ? <button onClick={() => setStep(step + 1)} className="btn-dark-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Next Step <ArrowRight size={18} /></button>
                            : <button onClick={handleGenerate} className="btn-dark-primary" style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none' }}>Generate Offer Letter <Download size={18} /></button>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfferLetterModal;
