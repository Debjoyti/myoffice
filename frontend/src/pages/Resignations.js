import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { LogOut, ArrowRight, Calculator, Check, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const Resignations = ({ user }) => {
    const [resignations, setResignations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ reason: '', resignation_date: '', last_working_day: '', notice_period_days: 30 });
    
    const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

    useEffect(() => {
        fetchResignations();
    }, []);

    const fetchResignations = async () => {
        try {
            const res = await axios.get(`${API}/resignations`, { headers: headers() });
            setResignations(res.data);
        } catch (e) {
            console.error(e);
            toast.error('Failed to fetch resignations');
        }
        setLoading(false);
    };

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/resignations`, formData, { headers: headers() });
            toast.success('Resignation request submitted');
            setShowModal(false);
            fetchResignations();
        } catch {
            toast.error('Failed to submit resignation');
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.patch(`${API}/resignations/${id}/status`, { status }, { headers: headers() });
            toast.success(`Resignation marks as ${status}`);
            fetchResignations();
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleCalculateFnF = async (id) => {
        try {
            await axios.post(`${API}/resignations/${id}/calculate-fnf`, {}, { headers: headers() });
            toast.success('Full and Final calculations generated');
            fetchResignations();
        } catch {
            toast.error('Failed to calculate FnF');
        }
    };

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>Resignations & F&F</h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '4px 0 0' }}>Manage employee exits and final settlements natively.</p>
                </div>
                <button onClick={() => setShowModal(true)} style={{ padding: '8px 16px', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LogOut size={16} /> Apply for Resignation
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading data...</div>
            ) : resignations.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)' }}>No resignations on record. 🎉</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {resignations.map(r => (
                        <div key={r.id} style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>{r.employee_name}</h3>
                                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700, background: r.status === 'approved' ? 'rgba(16,185,129,0.1)' : r.status === 'rejected' ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)', color: r.status === 'approved' ? '#34d399' : r.status === 'rejected' ? '#fb7185' : '#fbbf24' }}>
                                            {r.status}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Reason: {r.reason}</p>
                                    <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                                        <span>Req. Date: <b>{r.resignation_date}</b></span>
                                        <span>Last Day: <b>{r.last_working_day || 'TBD'}</b></span>
                                        <span>Notice: <b>{r.notice_period_days} Days</b></span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>F&F Status</p>
                                    {r.fnf_status === 'calculated' ? (
                                        <div>
                                            <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#22d3ee' }}>₹{r.fnf_amount.toLocaleString()}</p>
                                            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Calculated Settled Amount</p>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: '12px', padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', color: 'rgba(255,255,255,0.4)' }}>Pending Calculation</span>
                                    )}
                                </div>
                            </div>
                            
                            {(user.role === 'admin' || user.role === 'hr' || user.role === 'superadmin') && (
                                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    {r.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleStatusUpdate(r.id, 'approved')} style={{ padding: '6px 12px', background: 'none', border: '1px solid #10b981', color: '#10b981', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}><Check size={14}/> Approve</button>
                                            <button onClick={() => handleStatusUpdate(r.id, 'rejected')} style={{ padding: '6px 12px', background: 'none', border: '1px solid #f43f5e', color: '#f43f5e', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}><X size={14}/> Reject</button>
                                        </>
                                    )}
                                    {r.status === 'approved' && r.fnf_status === 'pending' && (
                                        <button onClick={() => handleCalculateFnF(r.id)} style={{ padding: '6px 12px', background: '#22d3ee', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}><Calculator size={14}/> Auto-Calculate F&F</button>
                                    )}
                                    {r.fnf_status === 'calculated' && (
                                        <button style={{ padding: '6px 12px', background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>Mark as Paid / Settled</button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' }}>
                        <h3 style={{ marginTop: 0, color: '#fff', fontSize: '18px' }}>Apply for Resignation</h3>
                        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Reason</label>
                                <textarea required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }} rows={3} placeholder="Reason for resignation..." />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Resignation Date</label>
                                <input type="date" required value={formData.resignation_date} onChange={e => setFormData({...formData, resignation_date: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Expected Last Working Day</label>
                                <input type="date" required value={formData.last_working_day} onChange={e => setFormData({...formData, last_working_day: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '10px', background: '#f43f5e', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Resignations;
