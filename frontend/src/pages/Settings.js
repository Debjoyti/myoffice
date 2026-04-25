import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Settings as SettingsIcon, Globe, Shield, Bell, Palette, Building } from 'lucide-react';

const Settings = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState(localStorage.getItem('settingsActiveTab') || 'general');

  useEffect(() => {
    localStorage.setItem('settingsActiveTab', activeTab);
  }, [activeTab]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="page-root">
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="page-content">
        <div className="page-inner">
          <div className="page-header">
            <div>
                <h1 className="page-title">Platform Settings</h1>
                <p className="page-subtitle">Configure BizOps for your organization</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
            {/* Sidebar for Settings */}
            <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                    { id: 'general', label: 'General', icon: Building },
                    { id: 'branding', label: 'Branding & UI', icon: Palette },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                    { id: 'security', label: 'Security & SSO', icon: Shield },
                    { id: 'localization', label: 'Localization', icon: Globe },
                ].map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                            background: activeTab === item.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                            color: activeTab === item.id ? '#818cf8' : 'rgba(255,255,255,0.4)',
                            border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                            fontWeight: 600, transition: 'all 0.2s'
                        }}
                    >
                        <item.icon size={18} /> {item.label}
                    </button>
                ))}
            </div>

            {/* Content for Settings */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '40px' }}>
                {activeTab === 'general' && (
                    <div className="fade-in">
                        <h2 style={{ color: '#fff', fontSize: '20px', margin: '0 0 24px' }}>Organization Details</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
                            <div>
                                <label className="dark-label">Organization Name</label>
                                <input type="text" className="dark-input" defaultValue="BizOps Enterprise" />
                            </div>
                            <div>
                                <label className="dark-label">Corporate Email</label>
                                <input type="email" className="dark-input" defaultValue="admin@bizops.io" />
                            </div>
                            <div>
                                <label className="dark-label">Timezone</label>
                                <select className="dark-input">
                                    <option>UTC +5:30 (IST)</option>
                                    <option>UTC +0:00 (GMT)</option>
                                    <option>UTC -5:00 (EST)</option>
                                </select>
                            </div>
                            <button className="btn-dark-primary" style={{ marginTop: '20px', width: 'fit-content' }}>Save Changes</button>
                        </div>
                    </div>
                )}
                {activeTab === 'branding' && (
                    <div className="fade-in">
                        <h2 style={{ color: '#fff', fontSize: '20px', margin: '0 0 24px' }}>Visual Branding</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            <div>
                                <label className="dark-label">Company Logo</label>
                                <div style={{ marginTop: '10px', width: '100px', height: '100px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Upload PNG</span>
                                </div>
                            </div>
                            <div>
                                <label className="dark-label">Primary Color</label>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map(color => (
                                        <div key={color} style={{ width: '32px', height: '32px', borderRadius: '50%', background: color, border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab !== 'general' && activeTab !== 'branding' && (
                    <div style={{ textAlign: 'center', padding: '60px' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <SettingsIcon size={32} color="rgba(255,255,255,0.2)" />
                        </div>
                        <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 8px' }}>Module Under Development</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>This configuration tab will be available in the next Enterprise update.</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
