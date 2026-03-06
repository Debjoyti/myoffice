import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import OfferLetters from './OfferLetters';
import HRConfig from './HRConfig';

const HRMS = ({ user, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('offer-letters');

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
            <Sidebar user={user} onLogout={onLogout} activePage="hrms" setActivePage={() => { }} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="page-content">
                <div style={{ padding: '0 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ padding: '24px 0 16px', display: 'flex', flexDirection: 'column' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px', color: '#fff' }}>HRMS</h1>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Human Resource Management — Offer Letters & HR Configuration</p>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button style={getTabStyle('offer-letters')} onClick={() => setActiveTab('offer-letters')}>Offer Letters</button>
                        <button style={getTabStyle('hr-config')} onClick={() => setActiveTab('hr-config')}>HR Configuration</button>
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div className="page-inner" style={{ paddingTop: '24px' }}>
                        {activeTab === 'offer-letters' && <OfferLetters isSubComponent={true} user={user} onLogout={onLogout} />}
                        {activeTab === 'hr-config' && <HRConfig isSubComponent={true} user={user} onLogout={onLogout} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRMS;
