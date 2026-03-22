import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Settings, Shield, Edit2, Users, Briefcase } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SaasAdmin = ({ user, onLogout }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newClient, setNewClient] = useState({ 
        name: '', email: '', password: '', 
        max_employees: '', max_projects: '', 
        enabled_services: [], subscription_end_date: '' 
    });

    const ALL_SERVICES = [
        { id: 'dashboard', name: 'Dashboard' },
        { id: 'employees', name: 'Employee Management' },
        { id: 'attendance', name: 'Attendance' },
        { id: 'leaves', name: 'Leave Management' },
        { id: 'recruitment', name: 'Recruitment (ATS)' },
        { id: 'projects', name: 'Project Management' },
        { id: 'crm', name: 'CRM (Leads & Deals)' },
        { id: 'inventory', name: 'Inventory & Stores' },
        { id: 'finance', name: 'Finance (Invoices)' },
        { id: 'support', name: 'Support Desk' },
        { id: 'assets', name: 'Asset Management' },
        { id: 'announcements', name: 'Office Feed' },
        { id: 'kb', name: 'Knowledge Base' },
        { id: 'audit', name: 'Audit Logs' },
        { id: 'insights', name: 'AI Business Insights' },
    ];

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API}/saas/clients`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClients(response.data);
        } catch (error) {
            console.error('Failed to fetch clients:', error);
        }
        setLoading(false);
    };

    const handleUpdateLimits = async (clientId, data) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API}/saas/clients/${clientId}/limits`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Client updated successfully');
            fetchClients();
        } catch (error) {
            console.error('Failed to update client', error);
            alert('Failed to update client');
        }
    };

    const handleCreateClient = async () => {
        try {
            if (!newClient.name || !newClient.email || !newClient.password) {
                return alert('Name, Email, and Password are required');
            }
            const token = localStorage.getItem('token');
            await axios.post(`${API}/saas/clients`, {
                ...newClient,
                max_employees: newClient.max_employees ? parseInt(newClient.max_employees) : null,
                max_projects: newClient.max_projects ? parseInt(newClient.max_projects) : null
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Client created successfully');
            setIsAdding(false);
            setNewClient({ 
                name: '', email: '', password: '', 
                max_employees: '', max_projects: '', 
                enabled_services: [], subscription_end_date: '' 
            });
            fetchClients();
        } catch (error) {
            console.error('Failed to create client', error);
            alert(error.response?.data?.detail || 'Failed to create client');
        }
    };

    return (
        <div style={{ display: 'flex', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh', background: '#0f172a' }}>
            <Sidebar
                user={user}
                onLogout={onLogout}
                activePage="saas-admin"
                setActivePage={() => { }}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: '0 0 4px' }}>SAAS Administration</p>
                            <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                                Client Management 🛡️
                            </h1>
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '50px', padding: '8px 16px 8px 8px',
                        }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 700, fontSize: '14px',
                            }}>
                                SA
                            </div>
                            <div>
                                <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0 }}>{user?.name}</p>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0, textTransform: 'capitalize' }}>Superadmin</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                            {isAdding ? 'Cancel' : '+ Add New Client'}
                        </button>
                    </div>

                    {isAdding && (
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                            <h2 style={{ color: '#fff', marginTop: 0 }}>Add New Client</h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                <input placeholder="Client Name" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '8px' }} />
                                <input placeholder="Email" type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '8px' }} />
                                <input placeholder="Password" type="password" value={newClient.password} onChange={e => setNewClient({ ...newClient, password: e.target.value })} style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '8px' }} />
                                <input placeholder="Max Employees" type="number" value={newClient.max_employees} onChange={e => setNewClient({ ...newClient, max_employees: e.target.value })} style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '8px' }} />
                                <input placeholder="Max Projects" type="number" value={newClient.max_projects} onChange={e => setNewClient({ ...newClient, max_projects: e.target.value })} style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '8px' }} />
                                <div style={{ width: '100%' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '8px' }}>Subscription End Date</p>
                                    <input type="date" value={newClient.subscription_end_date} onChange={e => setNewClient({ ...newClient, subscription_end_date: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '8px', width: '200px' }} />
                                </div>
                                <div style={{ width: '100%', marginTop: '12px' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '8px' }}>Enable Services</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                                        {ALL_SERVICES.map(service => (
                                            <label key={service.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={newClient.enabled_services.includes(service.id)}
                                                    onChange={e => {
                                                        const services = e.target.checked
                                                            ? [...newClient.enabled_services, service.id]
                                                            : newClient.enabled_services.filter(s => s !== service.id);
                                                        setNewClient({ ...newClient, enabled_services: services });
                                                    }}
                                                />
                                                {service.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleCreateClient} style={{ marginTop: '16px', background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Save Client</button>
                        </div>
                    )}

                    {/* Body */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>Loading clients...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                            {clients.map(client => (
                                <ClientCard key={client.id} client={client} onUpdate={handleUpdateLimits} ALL_SERVICES={ALL_SERVICES} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ClientCard = ({ client, onUpdate, ALL_SERVICES }) => {
    const limits = client.subscription_limits || {};
    const [empLimit, setEmpLimit] = useState(limits.max_employees || '');
    const [projLimit, setProjLimit] = useState(limits.max_projects || '');
    const [enabledServices, setEnabledServices] = useState(client.enabled_services || []);
    const [subEndDate, setSubEndDate] = useState(client.subscription_end_date || '');
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '24px',
            transition: 'transform 0.2s',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: 'rgba(99,102,241,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Shield size={20} color="#8b5cf6" />
                    </div>
                    <div>
                        <h3 style={{ color: '#fff', margin: '0 0 4px', fontSize: '16px', fontWeight: '600' }}>{client.name || 'Anonymous Client'}</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '12px' }}>{client.email}</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '10px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} /> Employees
                    </p>
                    <p style={{ color: '#fff', fontSize: '15px', fontWeight: '600', margin: 0 }}>
                        {client.usage?.employees || 0} <span style={{ color: 'rgba(255,255,255,0.3)' }}>/ {limits.max_employees || '∞'}</span>
                    </p>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '10px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Briefcase size={12} /> Projects
                    </p>
                    <p style={{ color: '#fff', fontSize: '15px', fontWeight: '600', margin: 0 }}>
                        {client.usage?.projects || 0} <span style={{ color: 'rgba(255,255,255,0.3)' }}>/ {limits.max_projects || '∞'}</span>
                    </p>
                </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                <h4 style={{ color: '#fff', fontSize: '13px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    Subscription Limits
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        style={{ background: 'transparent', border: 'none', color: '#6366f1', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Edit2 size={12} /> {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                </h4>

                {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', width: '90px' }}>Max Employees</label>
                                <input
                                    type="number"
                                    value={empLimit}
                                    onChange={e => setEmpLimit(e.target.value)}
                                    placeholder="e.g. 50"
                                    style={{
                                        flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', width: '90px' }}>Max Projects</label>
                                <input
                                    type="number"
                                    value={projLimit}
                                    onChange={e => setProjLimit(e.target.value)}
                                    placeholder="e.g. 10"
                                    style={{
                                        flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', width: '90px' }}>End Date</label>
                                <input
                                    type="date"
                                    value={subEndDate}
                                    onChange={e => setSubEndDate(e.target.value)}
                                    style={{
                                        flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ marginTop: '8px' }}>
                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '6px' }}>Enabled Services</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                    {ALL_SERVICES.map(service => (
                                        <label key={service.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={enabledServices.includes(service.id)}
                                                onChange={e => {
                                                    const services = e.target.checked
                                                        ? [...enabledServices, service.id]
                                                        : enabledServices.filter(s => s !== service.id);
                                                    setEnabledServices(services);
                                                }}
                                            />
                                            {service.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    onUpdate(client.id, {
                                        max_employees: empLimit ? parseInt(empLimit) : null,
                                        max_projects: projLimit ? parseInt(projLimit) : null,
                                        enabled_services: enabledServices,
                                        subscription_end_date: subEndDate
                                    });
                                    setIsEditing(false);
                                }}
                                style={{
                                    marginTop: '12px', background: '#6366f1', color: '#fff', border: 'none',
                                    padding: '8px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer'
                                }}>
                                Save Changes
                            </button>
                        </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '50px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                                Employees: {limits.max_employees || 'Unlimited'}
                            </span>
                            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '50px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                                Projects: {limits.max_projects || 'Unlimited'}
                            </span>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                            Expires: {client.subscription_end_date ? new Date(client.subscription_end_date).toLocaleDateString() : 'Never'}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                            {client.enabled_services?.map(s => (
                                <span key={s} style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SaasAdmin;
