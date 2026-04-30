import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Inventory from './Inventory';
import Stores from './Stores';
import PurchaseRequests from './PurchaseRequests';
import PurchaseOrders from './PurchaseOrders';

const BusinessOrders = ({ user, onLogout }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(localStorage.getItem('businessOrdersActiveTab') || 'inventory');

    React.useEffect(() => {
        localStorage.setItem('businessOrdersActiveTab', activeTab);
    }, [activeTab]);

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
    });

    return (
        <div className="page-root">
            <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <div className="page-content">
                <div style={{ padding: '0 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ padding: '24px 0 16px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Business Orders</h1>
                          <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(94, 106, 210, 0.15)', color: 'var(--brand-primary)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>ME51N/ME21N</span>
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Manage inventory, stores, purchase requests, and orders all in one place</p>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button style={getTabStyle('inventory')} onClick={() => setActiveTab('inventory')}>Inventory</button>
                        <button style={getTabStyle('stores')} onClick={() => setActiveTab('stores')}>Stores</button>
                        <button style={getTabStyle('purchase-requests')} onClick={() => setActiveTab('purchase-requests')}>Purchase Requests</button>
                        <button style={getTabStyle('purchase-orders')} onClick={() => setActiveTab('purchase-orders')}>Purchase Orders</button>
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div className="page-inner" style={{ paddingTop: '24px' }}>
                        {activeTab === 'inventory' && <Inventory isSubComponent={true} user={user} onLogout={onLogout} />}
                        {activeTab === 'stores' && <Stores isSubComponent={true} user={user} onLogout={onLogout} />}
                        {activeTab === 'purchase-requests' && <PurchaseRequests isSubComponent={true} user={user} onLogout={onLogout} />}
                        {activeTab === 'purchase-orders' && <PurchaseOrders isSubComponent={true} user={user} onLogout={onLogout} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessOrders;
