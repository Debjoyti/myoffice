import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Target, Plus, Check, X, AlertTriangle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

const PIP = ({ user }) => {
    const [pips, setPips] = useState([// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
    const [employees, setEmployees] = useState([// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Default 30 days PIP
    const [formData, setFormData] = useState({
        employee_id: '',
        reason: '',
        goals: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        duration_days: 30
    });

    const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [// eslint-disable-next-line react-hooks/exhaustive-deps
]);

    const fetchData = async () => {
        try {
            const [pipRes, empRes] = await Promise.all([
                axios.get(`${API}/pip`, { headers: headers() }),
                axios.get(`${API}/employees`, { headers: headers() })
            // eslint-disable-next-line react-hooks/exhaustive-deps

            // eslint-disable-next-line react-hooks/exhaustive-deps


            ]);
            setPips(pipRes.data);
            setEmployees(empRes.data);
        } catch (e) {
            console.error(e);
            toast.error('Failed to fetch data');
        }
        setLoading(false);
    };

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            // Need to ensure duration is computed
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            await axios.post(`${API}/pip`, { ...formData, duration_days: diffDays }, { headers: headers() });
            toast.success('PIP initialized');
            setShowModal(false);
            fetchData();
        } catch {
            toast.error('Failed to create PIP');
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.patch(`${API}/pip/${id}/status`, { status }, { headers: headers() });
            toast.success(`PIP marked as ${status}`);
            fetchData();
        } catch {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Performance Plans (PIP)</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>Track at-risk employees and manage performance outcomes.</p>
                </div>
                <button onClick={() => setShowModal(true)} style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} /> Initiate New PIP
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading data...</div>
            ) : pips.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No active PIPs. Team is performing well! 🚀</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {pips.map(p => (
                        <div key={p.id} style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <AlertTriangle size={14} color={p.status === 'active' ? '#fbbf24' : p.status === 'failed' ? '#ef4444' : '#10b981'} />
                                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{p.employee_name}</h3>
                                    </div>
                                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 800, background: p.status === 'successful' ? 'rgba(16,185,129,0.1)' : p.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: p.status === 'successful' ? '#34d399' : p.status === 'failed' ? '#f87171' : '#fbbf24' }}>
                                        {p.status} ({p.duration_days} Days)
                                    </span>
                                </div>
                            </div>
                            
                            <div style={{ marginTop: '16px', flex: 1 }}>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '0 0 4px', fontWeight: 600 }}>Reason:</p>
                                <p style={{ fontSize: '12.5px', color: 'var(--text-primary)', margin: '0 0 12px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px' }}>{p.reason}</p>
                                
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '0 0 4px', fontWeight: 600 }}>Actionable Goals:</p>
                                <p style={{ fontSize: '12.5px', color: '#34d399', margin: 0, background: 'rgba(16,185,129,0.05)', padding: '8px', borderRadius: '6px' }}>{p.goals}</p>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span>Start: {p.start_date}</span>
                                <span>End: {p.end_date}</span>
                            </div>
                            
                            {(user.role === 'admin' || user.role === 'hr' || user.role === 'superadmin') && p.status === 'active' && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                    <button onClick={() => handleStatusUpdate(p.id, 'successful')} style={{ flex: 1, padding: '8px', background: 'none', border: '1px solid #10b981', color: '#10b981', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}><Check size={14}/> Passed</button>
                                    <button onClick={() => handleStatusUpdate(p.id, 'failed')} style={{ flex: 1, padding: '8px', background: 'none', border: '1px solid #f43f5e', color: '#f43f5e', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}><X size={14}/> Failed</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: '#0a0a0a', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px', zIndex: 100000 }}>
                        <h3 style={{ marginTop: 0, color: 'var(--text-primary)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Target size={18} color="#fbbf24"/> Initiate PIP</h3>
                        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Employee</label>
                                <select required value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}>
                                    <option value="" style={{ background: '#1e293b' }}>Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id} style={{ background: '#1e293b' }}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Reason for PIP</label>
                                <textarea required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} rows={2} placeholder="Performance deficits..." />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Actionable Goals / Deliverables</label>
                                <textarea required value={formData.goals} onChange={e => setFormData({...formData, goals: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} rows={2} placeholder="Must close 5 deals, improve attendance..." />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Start Date</label>
                                    <input type="date" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>End Date</label>
                                    <input type="date" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: 'none', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '10px', background: '#fbbf24', border: 'none', color: '#000', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Initialize</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PIP;
