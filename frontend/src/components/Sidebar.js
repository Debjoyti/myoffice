import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Menu, X, LayoutDashboard, Users, Calendar, Umbrella, FolderKanban, Briefcase, TrendingUp, Package, Building2, FileText, ClipboardList, Settings, UserPlus, Shield } from 'lucide-react';

const Sidebar = ({ user, onLogout, activePage, setActivePage, isSidebarOpen, setIsSidebarOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    ...(user && user.role === 'superadmin' ? [{ id: 'saas-admin', label: 'SAAS Admin', icon: Shield, path: '/saas-admin' }] : []),
    { id: 'employee-management', label: 'Employee Management', icon: Users, path: '/employee-management' },
    { id: 'projects', label: 'Projects', icon: FolderKanban, path: '/projects' },
    { id: 'crm', label: 'CRM', icon: Briefcase, path: '/crm' },
    { id: 'expenses', label: 'Expenses', icon: TrendingUp, path: '/expenses' },
    { id: 'business-orders', label: 'Business Orders', icon: Package, path: '/business-orders' },
    { id: 'hrms', label: 'HRMS', icon: FileText, path: '/hrms' },
    { id: 'team', label: 'Team Members', icon: UserPlus, path: '/team' },
  ];

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
                <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
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