import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Employees from './Employees';
import Attendance from './Attendance';
import LeaveManagement from './LeaveManagement';

const EmployeeManagement = ({ user, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('employees');

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
    });

    return (
        <div className="page-root">
            <Sidebar user={user} onLogout={onLogout} activePage="employee-management" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="page-content">
                <div style={{ padding: '0 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ padding: '24px 0 16px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#fff' }}>Employee Management</h1>
                          <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>PA30</span>
                        </div>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Manage employees, attendance, and leave records in one place</p>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button style={getTabStyle('employees')} onClick={() => setActiveTab('employees')}>Employees</button>
                        <button style={getTabStyle('attendance')} onClick={() => setActiveTab('attendance')}>Attendance</button>
                        <button style={getTabStyle('leave')} onClick={() => setActiveTab('leave')}>Leave</button>
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div className="page-inner" style={{ paddingTop: '24px' }}>
                        {activeTab === 'employees' && <Employees isSubComponent={true} user={user} onLogout={onLogout} />}
                        {activeTab === 'attendance' && <Attendance isSubComponent={true} user={user} onLogout={onLogout} />}
                        {activeTab === 'leave' && <LeaveManagement isSubComponent={true} user={user} onLogout={onLogout} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeManagement;
