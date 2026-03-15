import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, LayoutDashboard, Users, Calendar, Umbrella, FolderKanban, Briefcase, TrendingUp, Package, Building2, FileText, ClipboardList, Settings, UserPlus, Shield, Receipt, Clock, MessageSquare, Rss, Box, Search, Bell, Book, ShieldCheck } from 'lucide-react';

const Sidebar = ({ user, onLogout, activePage, setActivePage, isSidebarOpen, setIsSidebarOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/', tcode: 'S000' },
    ...(user && user.role === 'superadmin' ? [{ id: 'saas-admin', label: 'SAAS Admin', icon: Shield, path: '/saas-admin', tcode: 'SU01' }] : []),
    { id: 'employee-management', label: 'Employee Management', icon: Users, path: '/employee-management', tcode: 'PA30' },
    { id: 'projects', label: 'Projects', icon: FolderKanban, path: '/projects', tcode: 'CJ20N' },
    { id: 'crm', label: 'CRM', icon: Briefcase, path: '/crm', tcode: 'VA01' },
    { id: 'expenses', label: 'Expenses', icon: TrendingUp, path: '/expenses', tcode: 'FB60' },
    { id: 'business-orders', label: 'Business Orders', icon: Package, path: '/business-orders', tcode: 'ME51N' },
    { id: 'hrms', label: 'HRMS', icon: FileText, path: '/hrms', tcode: 'PA40' },
    { id: 'team', label: 'Team Members', icon: UserPlus, path: '/team', tcode: 'SU01' },
    { id: 'finance', label: 'Finance & Books', icon: Receipt, path: '/finance', tcode: 'VF01' },
    { id: 'timesheets', label: 'Timesheets', icon: Clock, path: '/timesheets', tcode: 'CAT2' },
    { id: 'support-desk', label: 'Support Desk', icon: MessageSquare, path: '/support-desk', tcode: 'SO11' },
    { id: 'feed', label: 'Office Feed', icon: Rss, path: '/feed', tcode: 'ZFEED' },
    { id: 'assets', label: 'Asset Management', icon: Box, path: '/assets', tcode: 'AA01' },
    { id: 'recruitment', label: 'Recruitment (ATS)', icon: Briefcase, path: '/recruitment', tcode: 'PB10' },
    { id: 'kb', label: 'Knowledge Base', icon: Book, path: '/kb', tcode: 'DB02' },
    { id: 'audit', label: 'Audit Logs', icon: ShieldCheck, path: '/audit', tcode: 'SM20' },
    { id: 'settings', label: 'Platform Settings', icon: Settings, path: '/settings', tcode: 'SPRO' },
  ];

  const [tcodeSearch, setTcodeSearch] = useState('');
  const navigate = useNavigate();

  const handleTcodeSubmit = (e) => {
    e.preventDefault();
    const command = tcodeSearch.trim().toUpperCase();
    const target = menuItems.find(item => item.tcode === command || item.id === command.toLowerCase());
    if (target) {
      setActivePage(target.id);
      navigate(target.path);
      setTcodeSearch('');
    } else {
      alert(`Transaction code ${command} not found`);
    }
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
          position: 'fixed', top: '16px', left: '16px', zIndex: 50,
          padding: '8px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '10px',
          cursor: 'pointer',
          display: 'none',
        }}
        className="lg:hidden"
        data-testid="sidebar-toggle"
      >
        {isSidebarOpen ? <X size={20} color="#fff" /> : <Menu size={20} color="#fff" />}
      </button>

      {/* Sidebar panel */}
      <div
        style={{
          width: '240px',
          minWidth: '240px',
          height: '100vh',
          background: '#0a1628',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          flexShrink: 0,
        }}
        className={`fixed lg:sticky top-0 left-0 z-40 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '16px' }}>B</span>
            </div>
            <div>
              <h1 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0 }} data-testid="sidebar-title">BizOps</h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>Enterprise Edition</p>
            </div>
          </div>
        </div>

        {/* SAP-style Command Bar */}
        <div style={{ padding: '16px 16px 8px' }}>
          <form onSubmit={handleTcodeSubmit} style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Enter T-Code (e.g. PA30)"
                value={tcodeSearch}
                onChange={(e) => setTcodeSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 500,
                  outline: 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1), inset 0 2px 4px rgba(0,0,0,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)';
                }}
              />
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.2)',
                fontWeight: 700,
                pointerEvents: 'none',
              }}>
                ↵
              </div>
            </div>
            <button type="submit" style={{ display: 'none' }} />
          </form>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <Link
                key={item.id}
                to={item.path}
                data-testid={`nav-${item.id}`}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                style={{
                  color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                  marginBottom: '2px',
                  textDecoration: 'none',
                }}
                onClick={() => {
                  setActivePage(item.id);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
              >
                <Icon size={16} style={{ color: isActive ? '#818cf8' : 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                  <span style={{ 
                    fontSize: '10px', 
                    color: isActive ? '#818cf8' : 'rgba(255,255,255,0.2)', 
                    fontWeight: 700,
                    background: isActive ? 'rgba(129,140,248,0.15)' : 'transparent',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}>
                    {item.tcode}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.05)',
            marginBottom: '10px',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '13px', flexShrink: 0,
            }}>
              {getInitials(user?.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} data-testid="user-name">{user?.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', margin: 0, textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            data-testid="logout-btn"
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '9px 16px',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px',
              color: '#f87171',
              fontSize: '13px', fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30, backdropFilter: 'blur(4px)' }}
          className="lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;