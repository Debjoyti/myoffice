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
import Sidebar from '../components/Sidebar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HRMS = ({ user, onLogout, isSubComponent }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [wfhRequests, setWfhRequests] = useState([]);
    const [stats, setStats] = useState(null);

    const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [empRes, attRes, leaveRes, wfhRes] = await Promise.all([
                axios.get(`${API}/employees`, { headers: headers() }).catch(() => ({ data: [] })),
                axios.get(`${API}/attendance`, { headers: headers() }).catch(() => ({ data: [] })),
                axios.get(`${API}/leave-management`, { headers: headers() }).catch(() => ({ data: [] })),
                axios.get(`${API}/wfh-requests`, { headers: headers() }).catch(() => ({ data: [] }))
            ]);
            setEmployees(empRes.data);
            setAttendance(attRes.data);
            setLeaves(leaveRes.data);
            setWfhRequests(wfhRes.data);
            
            const totalEmp = empRes.data.length;
            const onLeave = leaveRes.data.filter(l => l.status === 'approved' && new Date(l.start_date) <= new Date() && new Date(l.end_date) >= new Date()).length;
            const pendingLeaves = leaveRes.data.filter(l => l.status === 'pending').length;
            const pendingWfh = wfhRes.data.filter(r => r.status === 'pending').length;
            const presentToday = attRes.data.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'present').length;
            
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
        color: activeTab === tabId ? '#818cf8' : 'rgba(255,255,255,0.5)',
        borderBottom: activeTab === tabId ? '2px solid #818cf8' : '2px solid transparent',
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
    }, []);

    const content = (
        <>
            <div style={{ padding: '0 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ padding: '24px 0 16px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#fff' }}>HR People Hub</h1>
                        <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>PA40</span>
                    </div>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Unified Zoho-Style HR Workspace</p>
                </div>
                <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '2px' }}>
                    <button style={getTabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                    <button style={getTabStyle('employees')} onClick={() => setActiveTab('employees')}>Employee Directory</button>
                    <button style={getTabStyle('attendance')} onClick={() => setActiveTab('attendance')}>Attendance</button>
                    <button style={getTabStyle('leave')} onClick={() => setActiveTab('leave')}>Leave Tracker</button>
                    <button style={getTabStyle('wfh')} onClick={() => setActiveTab('wfh')}>Work From Home</button>
                    <button style={getTabStyle('recruitment')} onClick={() => setActiveTab('recruitment')}>Recruitment (ATS)</button>
                    <button style={getTabStyle('offer-letters')} onClick={() => setActiveTab('offer-letters')}>Offer Letters</button>
                    <button style={getTabStyle('hr-config')} onClick={() => setActiveTab('hr-config')}>Configuration</button>
                    <button style={getTabStyle('posh')} onClick={() => setActiveTab('posh')}>POSH Compliance</button>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div className="page-inner" style={{ paddingTop: '24px' }}>
                    {activeTab === 'dashboard' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* KPIs */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                                {[
                                    { label: 'Total Headcount', val: stats?.totalEmp || 0, icon: Users, bg: 'rgba(99,102,241,0.12)', c: '#818cf8' },
                                    { label: 'Present Today', val: stats?.presentToday || 0, icon: Clock, bg: 'rgba(16,185,129,0.12)', c: '#34d399' },
                                    { label: 'On Leave', val: stats?.onLeave || 0, icon: Calendar, bg: 'rgba(245,158,11,0.12)', c: '#fbbf24' },
                                    { label: 'Leave Requests', val: stats?.pendingLeaves || 0, icon: FileText, bg: 'rgba(239,68,68,0.12)', c: '#f87171' },
                                    { label: 'Pending WFH', val: stats?.pendingWfh || 0, icon: Clock, bg: 'rgba(6,182,212,0.12)', c: '#22d3ee' },
                                ].map((kpi, i) => {
                                    const Icon = kpi.icon;
                                    return (
                                        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Icon size={24} color={kpi.c} />
                                            </div>
                                            <div>
                                                <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{kpi.label}</p>
                                                <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{kpi.val}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Charts Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '8px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 24px', color: '#fff' }}>Organization Growth (YTD)</h3>
                                    <div style={{ height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={headcountData}>
                                                <defs>
                                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b' }} itemStyle={{color: '#fff'}}/>
                                                <Area type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 24px', color: '#fff' }}>Department Breakdown</h3>
                                    {deptData.length > 0 ? (
                                        <div style={{ height: '300px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={deptData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                                        {deptData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                    </Pie>
                                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#1e293b' }} itemStyle={{color: '#fff'}}/>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                                            No department data available.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Approvals Row */}
                            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#fff' }}>Pending Approvals</h3>
                                    <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('leave')}>View All</span>
                                </div>
                                {leaves.filter(l => l.status === 'pending').slice(0,4).length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {leaves.filter(l => l.status === 'pending').slice(0,4).map(l => (
                                            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#fff' }}>{l.employee_name}</p>
                                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{l.type} ({l.start_date} to {l.end_date})</p>
                                                </div>
                                                <span className="badge-red">Review Required</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>No pending requests 🎉</p>
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
                    {activeTab === 'hr-config' && <HRConfig isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'posh' && <POSH isSubComponent={true} user={user} onLogout={onLogout} />}
                </div>
            </div>
        </>
    );

    if (isSubComponent) {
        return content;
    }

    return (
        <div className="page-root">
            <Sidebar user={user} onLogout={onLogout} activePage="hrms" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="page-content">
                {content}
            </div>
        </div>
    );
};

export default HRMS;
