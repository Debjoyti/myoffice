import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import { Settings as SettingsIcon, Globe, Shield, Bell, Palette, Building, ToggleLeft, ToggleRight, CheckSquare } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState(localStorage.getItem('settingsActiveTab') || 'general');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    localStorage.setItem('settingsActiveTab', activeTab);
  }, [activeTab]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/settings`, { headers: { Authorization: `Bearer ${token}` } });
      setSettings(res.data);
    } catch (err) {
      toast.error('Failed to load platform settings');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      await axios.put(`${API}/settings`, settings, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    }
    setSaving(false);
  };

  const updateFeatureToggle = (key, value) => {
      setSettings(prev => ({ ...prev, feature_toggles: { ...prev.feature_toggles, [key]: value } }));
  };

  const updateEnabledModule = (module, isEnabled) => {
      setSettings(prev => {
          const modules = new Set(prev.enabled_modules || []);
          if (isEnabled) modules.add(module);
          else modules.delete(module);
          return { ...prev, enabled_modules: Array.from(modules) };
      });
  };

  const updateNotification = (key, value) => {
      setSettings(prev => ({ ...prev, notification_settings: { ...prev.notification_settings, [key]: value } }));
  };

  const updateIntegration = (key, value) => {
      setSettings(prev => ({ ...prev, integration_configs: { ...prev.integration_configs, [key]: value } }));
  };

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
                    { id: 'notifications', label: 'Notifications', icon: Bell },
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
                {loading ? <div className="dark-loading">Loading settings...</div> : settings && (
                    <>
                        {activeTab === 'general' && (
                            <div className="fade-in">
                                <h2 style={{ color: '#fff', fontSize: '20px', margin: '0 0 24px' }}>Feature & Module Configurations</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
                                    <div>
                                        <label className="dark-label" style={{ marginBottom: '12px', display: 'block' }}>Feature Toggles</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {Object.entries(settings.feature_toggles || {}).map(([key, value]) => (
                                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px' }}>
                                                    <span style={{ color: '#fff', textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                                                    <div style={{ cursor: 'pointer' }} onClick={() => updateFeatureToggle(key, !value)}>
                                                        {value ? <ToggleRight color="#10b981" size={24} /> : <ToggleLeft color="rgba(255,255,255,0.4)" size={24} />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="dark-label" style={{ marginBottom: '12px', display: 'block' }}>Enabled Modules</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            {['HRMS', 'FINANCE', 'CRM', 'INVENTORY', 'ASSETS'].map(module => {
                                                const isEnabled = (settings.enabled_modules || []).includes(module);
                                                return (
                                                    <div key={module} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer' }} onClick={() => updateEnabledModule(module, !isEnabled)}>
                                                        <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${isEnabled ? '#6366f1' : 'rgba(255,255,255,0.2)'}`, background: isEnabled ? '#6366f1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {isEnabled && <CheckSquare size={14} color="#fff" />}
                                                        </div>
                                                        <span style={{ color: '#fff' }}>{module}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <button className="btn-dark-primary" onClick={handleSave} disabled={saving} style={{ marginTop: '20px', width: 'fit-content' }}>
                                        {saving ? 'Saving...' : 'Save General Settings'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="fade-in">
                                <h2 style={{ color: '#fff', fontSize: '20px', margin: '0 0 24px' }}>Notification Preferences</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
                                    {Object.entries(settings.notification_settings || {}).map(([key, value]) => (
                                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                                            <div>
                                                <div style={{ color: '#fff', fontWeight: 500, textTransform: 'capitalize' }}>{key.replace('_', ' ')}</div>
                                            </div>
                                            <div style={{ cursor: 'pointer' }} onClick={() => updateNotification(key, !value)}>
                                                {value ? <ToggleRight color="#10b981" size={24} /> : <ToggleLeft color="rgba(255,255,255,0.4)" size={24} />}
                                            </div>
                                        </div>
                                    ))}
                                    <button className="btn-dark-primary" onClick={handleSave} disabled={saving} style={{ marginTop: '20px', width: 'fit-content' }}>
                                        {saving ? 'Saving...' : 'Save Notification Settings'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'localization' && (
                            <div className="fade-in">
                                <h2 style={{ color: '#fff', fontSize: '20px', margin: '0 0 24px' }}>Integrations & External Configs</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
                                    {Object.entries(settings.integration_configs || {}).map(([key, value]) => (
                                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                                            <div style={{ color: '#fff', fontWeight: 500, textTransform: 'capitalize' }}>{key.replace('_', ' ')} Integration</div>
                                            <div style={{ cursor: 'pointer' }} onClick={() => updateIntegration(key, !value)}>
                                                {value ? <ToggleRight color="#10b981" size={24} /> : <ToggleLeft color="rgba(255,255,255,0.4)" size={24} />}
                                            </div>
                                        </div>
                                    ))}
                                    <button className="btn-dark-primary" onClick={handleSave} disabled={saving} style={{ marginTop: '20px', width: 'fit-content' }}>
                                        {saving ? 'Saving...' : 'Save Integrations'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab !== 'general' && activeTab !== 'notifications' && activeTab !== 'localization' && (
                            <div style={{ textAlign: 'center', padding: '60px' }}>
                                <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <SettingsIcon size={32} color="rgba(255,255,255,0.2)" />
                                </div>
                                <h3 style={{ color: '#fff', fontSize: '18px', margin: '0 0 8px' }}>Coming Soon</h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>This configuration tab will be available in future releases.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
