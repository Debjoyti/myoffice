import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, Calendar, Clock, Briefcase, FileText, Settings, FileSignature 
} from 'lucide-react';
import Employees from './Employees';
import Attendance from './Attendance';
import LeaveManagement from './LeaveManagement';
import OfferLetters from './OfferLetters';
import HRConfig from './HRConfig';
import Recruitment from './Recruitment';
import POSH from './POSH';
import WFHRequests from './WFHRequests';
import Resignations from './Resignations';
import PIP from './PIP';
import Sidebar from '../components/Sidebar';
import PayrollEngine from './PayrollEngine';
import { MOCK_EMPLOYEES, MOCK_HR } from '../utils/demoData';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HRMS = ({ user, onLogout, isSubComponent }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(localStorage.getItem('hrmsActiveTab') || 'dashboard');

    useEffect(() => {
        localStorage.setItem('hrmsActiveTab', activeTab);
    }, [activeTab]);
    const [employees, setEmployees] = useState([// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
    const [attendance, setAttendance] = useState([// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
    const [leaves, setLeaves] = useState([// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
    const [wfhRequests, setWfhRequests] = useState([// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
    const [stats, setStats] = useState(null);

    const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [// eslint-disable-next-line react-hooks/exhaustive-deps
]);

    const fetchData = async () => {
        try {
            const [empRes, attRes, leaveRes, wfhRes] = await Promise.all([
                axios.get(`${API}/employees`, { headers: headers() }).catch(() => ({ data: [] })),
                axios.get(`${API}/attendance`, { headers: headers() }).catch(() => ({ data: [] })),
                axios.get(`${API}/leave-requests`, { headers: headers() }).catch(() => ({ data: [] })),
                axios.get(`${API}/wfh-requests`, { headers: headers() }).catch(() => ({ data: [] }))
            // eslint-disable-next-line react-hooks/exhaustive-deps

            // eslint-disable-next-line react-hooks/exhaustive-deps


            ]);
            setEmployees((empRes.data && empRes.data.length > 0) ? empRes.data : MOCK_EMPLOYEES);
            setAttendance((attRes.data && attRes.data.length > 0) ? attRes.data : [// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
            setLeaves((leaveRes.data && leaveRes.data.length > 0) ? leaveRes.data : MOCK_HR.leaves);
            setWfhRequests((wfhRes.data && wfhRes.data.length > 0) ? wfhRes.data : [// eslint-disable-next-line react-hooks/exhaustive-deps
// eslint-disable-next-line react-hooks/exhaustive-deps

]);
            
            const effectiveEmp = (empRes.data && empRes.data.length > 0) ? empRes.data : MOCK_EMPLOYEES;
            const effectiveLeaves = (leaveRes.data && leaveRes.data.length > 0) ? leaveRes.data : MOCK_HR.leaves;
            const effectiveAtt = (attRes.data && attRes.data.length > 0) ? attRes.data : [];

            const totalEmp = effectiveEmp.length;
            const today = new Date().toISOString().split('T')[0];
            const onLeave = effectiveLeaves.filter(l => 
                l.status === 'approved' && 
                l.from_date <= today && 
                l.to_date >= today
            ).length;
            const pendingLeaves = effectiveLeaves.filter(l => l.status === 'pending').length;
            const pendingWfh = wfhRes.data.filter(r => r.status === 'pending').length;
            const presentToday = effectiveAtt.filter(a => a.date === today && a.status === 'present').length;
            
            setStats({
                totalEmp, onLeave, pendingLeaves, presentToday, pendingWfh,
                absentRate: totalEmp > 0 ? ((totalEmp - presentToday - onLeave) / totalEmp * 100).toFixed(1) : 0
            });
        } catch (e) { console.error('Failed to fetch HR data', e); }
    };

    const getTabStyle = (tabId) => ({
        padding: '16px 12px',
        border: 'none',
        background: 'none',
        color: activeTab === tabId ? 'var(--brand-primary)' : 'rgba(255,255,255,0.5)',
        borderBottom: activeTab === tabId ? '2px solid var(--brand-primary)' : '2px solid transparent',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '14px',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap'
    });

    const headcountData = [
        { month: 'Jan', count: 10 }, { month: 'Feb', count: 15 },
        { month: 'Mar', count: 22 }, { month: 'Apr', count: 30 },
        { month: 'May', count: 38 }, { month: 'Jun', count: stats?.totalEmp || 40 },
    ];

    const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    const deptData = employees.reduce((acc, emp) => {
        const dept = emp.department || 'Unassigned';
        const existing = acc.find(x => x.name === dept);
        if (existing) existing.value += 1;
        else acc.push({ name: dept, value: 1 });
        return acc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [// eslint-disable-next-line react-hooks/exhaustive-deps
]);

    const content = (
        <>
            <div style={{ padding: '0 32px', borderBottom: '1px solid var(--border)', background: 'transparent' }}>
                <div style={{ padding: '32px 0 24px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>HRMS</h1>
                        <span style={{ fontSize: '10px', fontWeight: 600, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', border: '1px solid var(--border)' }}>Module PA40</span>
                    </div>
                </div>
                <div style={{ 
                    display: 'flex', 
                    gap: '24px', 
                    overflowX: 'auto', 
                    paddingBottom: '0',
                }} className="hide-scrollbar">
                    {[
                        { id: 'dashboard', label: 'Overview' },
                        { id: 'employees', label: 'Directory' },
                        { id: 'payroll', label: '⚙ Payroll' },
                        { id: 'attendance', label: 'Attendance' },
                        { id: 'leave', label: 'Leaves' },
                        { id: 'wfh', label: 'Remote' },
                        { id: 'recruitment', label: 'ATS' },
                        { id: 'offer-letters', label: 'Offers' },
                        { id: 'posh', label: 'Compliance' },
                        { id: 'resignations', label: 'Exits' },
                        { id: 'pip', label: 'Performance' },
                        { id: 'hr-config', label: 'HR Panel' },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            style={{ padding: '6px 16px' }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div className="page-inner" style={{ paddingTop: '24px' }}>
                    {activeTab === 'dashboard' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* KPIs */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                {[
                                    { label: 'Total Headcount', val: stats?.totalEmp || 0, icon: Users },
                                    { label: 'Present Today', val: stats?.presentToday || 0, icon: Clock },
                                    { label: 'On Leave', val: stats?.onLeave || 0, icon: Calendar },
                                    { label: 'Leave Requests', val: stats?.pendingLeaves || 0, icon: FileText },
                                    { label: 'Pending WFH', val: stats?.pendingWfh || 0, icon: Briefcase },
                                ].map((kpi, i) => {
                                    const Icon = kpi.icon;
                                    return (
                                        <div key={i} className="kpi-card hover-glow" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', animationDelay: `${i * 50}ms`, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Icon size={18} color="var(--text-secondary)" />
                                            </div>
                                            <div>
                                                <p style={{ margin: '0 0 2px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{kpi.label}</p>
                                                <p style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>{kpi.val}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Charts Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '8px' }}>
                                <div className="glass-card hover-glow" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 24px', color: 'var(--text-primary)' }}>Organization Growth (YTD)</h3>
                                    <div style={{ height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={headcountData}>
                                                <defs>
                                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: '#1e293b' }} itemStyle={{color: 'var(--text-primary)'}}/>
                                                <Area type="monotone" dataKey="count" stroke="var(--brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 24px', color: 'var(--text-primary)' }}>Department Breakdown</h3>
                                    {deptData.length > 0 ? (
                                        <div style={{ height: '300px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={deptData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                                        {deptData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                    </Pie>
                                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: '#1e293b' }} itemStyle={{color: 'var(--text-primary)'}}/>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                            No department data available.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Approvals Row */}
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Pending Approvals</h3>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setActiveTab('leave')}>View All</span>
                                </div>
                                {leaves.filter(l => l.status === 'pending').slice(0,4).length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {leaves.filter(l => l.status === 'pending').slice(0,4).map(l => (
                                            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                        {employees.find(e => e.id === l.employee_id)?.name || l.employee_id || 'Unknown'}
                                                    </p>
                                                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{l.leave_type} ({l.from_date} to {l.to_date})</p>
                                                </div>
                                                <span style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontWeight: 500 }}>Review</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-base)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No pending requests.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Component Rendering */}
                    {activeTab === 'employees' && <Employees isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'attendance' && <Attendance isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'leave' && <LeaveManagement isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'wfh' && <WFHRequests isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'recruitment' && <Recruitment isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'offer-letters' && <OfferLetters isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'payroll' && <PayrollEngine isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'hr-config' && <HRConfig isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'posh' && <POSH isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'resignations' && <Resignations isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'pip' && <PIP isSubComponent={true} user={user} onLogout={onLogout} />}
                </div>
            </div>
        </>
    );

    if (isSubComponent) {
        return content;
    }

    return (
        <div className="page-root">
            <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="page-content">
                {content}
            </div>
        </div>
    );
};

export default HRMS;
