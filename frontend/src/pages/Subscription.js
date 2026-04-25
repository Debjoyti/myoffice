import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { CreditCard, Calendar, Users, Briefcase, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Subscription = ({ user, onLogout }) => {
    const [subData, setSubData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API}/subscriptions/current`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubData(response.data);
        } catch (error) {
            console.error('Failed to fetch subscription:', error);
        }
        setLoading(false);
    };

    const getDaysRemaining = (dateString) => {
        if (!dateString) return null;
        const end = new Date(dateString);
        const today = new Date();
        const diff = end - today;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const daysRemaining = subData?.end_date ? getDaysRemaining(subData.end_date) : null;
    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
    const isExpired = daysRemaining !== null && daysRemaining <= 0;

    return (
        <div style={{ display: 'flex', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh', background: '#0f172a' }}>
            <Sidebar
                user={user}
                onLogout={onLogout}
                activePage="subscription"
                setActivePage={() => { }}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ marginBottom: '32px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: '0 0 4px' }}>Plan & Billing</p>
                        <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                            Subscription Management 💎
                        </h1>
                    </div>

                    {loading ? (
                        <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px' }}>Loading subscription data...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
                            {/* Status Card */}
                            <div style={{ 
                                gridColumn: '1 / -1',
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '24px',
                                padding: '32px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <div style={{ 
                                            padding: '4px 12px', 
                                            borderRadius: '50px', 
                                            background: isExpired ? '#ef4444' : '#10b981', 
                                            color: '#fff', 
                                            fontSize: '12px', 
                                            fontWeight: 700,
                                            textTransform: 'uppercase'
                                        }}>
                                            {isExpired ? 'Expired' : subData?.status || 'Active'}
                                        </div>
                                        {isExpiringSoon && (
                                            <div style={{ 
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                color: '#f59e0b', fontSize: '13px', fontWeight: 600
                                            }}>
                                                <AlertTriangle size={16} /> Expiring Soon
                                            </div>
                                        )}
                                    </div>
                                    <h2 style={{ color: '#fff', fontSize: '28px', margin: '0 0 8px' }}>
                                        {user?.organization_name || 'Enterprise'} Plan
                                    </h2>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                                        Your subscription {isExpired ? 'ended' : 'renews'} on <strong>{subData?.end_date ? new Date(subData.end_date).toLocaleDateString() : 'Unlimited'}</strong>
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', zIndex: 1 }}>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '0 0 4px' }}>Days Remaining</p>
                                    <p style={{ 
                                        color: isExpired ? '#ef4444' : isExpiringSoon ? '#f59e0b' : '#fff', 
                                        fontSize: '48px', 
                                        fontWeight: 800, 
                                        margin: 0 
                                    }}>
                                        {daysRemaining !== null ? Math.max(0, daysRemaining) : '∞'}
                                    </p>
                                </div>
                                {/* Decorative Glow */}
                                <div style={{ 
                                    position: 'absolute', top: '-50%', right: '-10%', 
                                    width: '300px', height: '300px', 
                                    background: 'rgba(99,102,241,0.2)', 
                                    filter: 'blur(80px)', 
                                    borderRadius: '50%' 
                                }} />
                            </div>

                            {/* Usage Limits */}
                            <div style={{ 
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '20px',
                                padding: '24px'
                            }}>
                                <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Zap size={20} color="#6366f1" /> Resource Usage
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Employees</span>
                                            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{subData?.usage?.employees || 0} / {subData?.limits?.max_employees || '∞'}</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${subData?.limits?.max_employees ? Math.min(100, ((subData?.usage?.employees || 0) / subData.limits.max_employees) * 100) : 100}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '4px' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Projects</span>
                                            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{subData?.usage?.projects || 0} / {subData?.limits?.max_projects || '∞'}</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${subData?.limits?.max_projects ? Math.min(100, ((subData?.usage?.projects || 0) / subData.limits.max_projects) * 100) : 100}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '4px' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Companies</span>
                                            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{subData?.usage?.companies || 0} / {subData?.limits?.max_companies || '∞'}</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${subData?.limits?.max_companies ? Math.min(100, ((subData?.usage?.companies || 0) / subData.limits.max_companies) * 100) : 100}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '4px' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Enabled Modules */}
                            <div style={{ 
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '20px',
                                padding: '24px'
                            }}>
                                <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <CheckCircle2 size={20} color="#10b981" /> Enabled Services
                                </h3>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {subData?.enabled_services?.map(service => (
                                        <div key={service} style={{ 
                                            background: 'rgba(16,185,129,0.1)', 
                                            color: '#10b981', 
                                            padding: '6px 14px', 
                                            borderRadius: '50px', 
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            border: '1px solid rgba(16,185,129,0.2)'
                                        }}>
                                            {service.charAt(0).toUpperCase() + service.slice(1)}
                                        </div>
                                    ))}
                                    {(!subData?.enabled_services || subData.enabled_services.length === 0) && (
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>All standard modules enabled by default.</p>
                                    )}
                                </div>
                            </div>

                            {/* Support Card */}
                            <div style={{ 
                                gridColumn: '1 / -1',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px dashed rgba(255,255,255,0.1)',
                                borderRadius: '20px',
                                padding: '24px',
                                textAlign: 'center'
                            }}>
                                <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 16px' }}>
                                    Need to upgrade your limits or add more services?
                                </p>
                                <button style={{ 
                                    background: 'transparent', 
                                    border: '1px solid #6366f1', 
                                    color: '#6366f1', 
                                    padding: '10px 24px', 
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}>
                                    Contact Account Manager
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Subscription;
