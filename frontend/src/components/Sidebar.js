import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  LogOut, Menu, X, LayoutDashboard, Users, Calendar, FolderKanban, Briefcase,
  TrendingUp, Package, Building2, FileText, ClipboardList, Settings, UserPlus,
  Shield, Receipt, Clock, MessageSquare, Rss, Box, Book, ShieldCheck,
  ChevronRight, Sparkles, Zap, Search, Bell, MapPin
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const Sidebar = ({ user, onLogout, isSidebarOpen, setIsSidebarOpen }) => {
  const [commandInput, setCommandInput] = useState('');
  const [commandFocused, setCommandFocused] = useState(false);
  const commandInputRef = useRef(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (groupName) => {
    if (!groupName) return;
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };
  const navigate = useNavigate();
  const location = useLocation();

  const serviceMapping = {
    'employee-management': 'employees',
    'projects': 'projects',
    'crm': 'crm',
    'expenses': 'finance',
    'business-orders': 'inventory',
    'hrms': 'leaves',
    'team': 'employees',
    'finance': 'finance',
    'timesheets': 'projects',
    'support-desk': 'support',
    'feed': 'announcements',
    'assets': 'assets',
    'recruitment': 'recruitment',
    'kb': 'kb',
    'audit': 'audit',
    'company-onboarding': 'dashboard',
    'settings': 'dashboard',
    'travel': 'assets',
    'iatf-hub': 'employees',
    'careers': 'recruitment',
  };

  const categorizedMenuItems = [
    {
      group: null,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/', tcode: 'S000', desc: 'Home base' },
      ]
    },
    {
      group: 'Personal & Work',
      items: [
        { id: 'feed', label: 'Office Feed', icon: Rss, path: '/feed', tcode: 'ZFEED', desc: 'Announcements' },
        { id: 'timesheets', label: 'Timesheets', icon: Clock, path: '/timesheets', tcode: 'CAT2', desc: 'Time tracking' },
        { id: 'support-desk', label: 'Support Desk', icon: MessageSquare, path: '/support-desk', tcode: 'SO11', desc: 'Help tickets' },
        { id: 'kb', label: 'Knowledge Base', icon: Book, path: '/kb', tcode: 'DB02', desc: 'Docs & SOPs' },
        { id: 'travel', label: 'Travel Tracker', icon: MapPin, path: '/travel', tcode: 'TRV1', desc: 'GPS trip tracker' },
      ]
    },
    {
      group: 'Sales & Projects',
      items: [
        { id: 'crm', label: 'CRM', icon: Briefcase, path: '/crm', tcode: 'VA01', desc: 'Leads & deals' },
        { id: 'projects', label: 'Projects', icon: FolderKanban, path: '/projects', tcode: 'CJ20N', desc: 'Track projects' },
      ]
    },
    {
      group: 'HR & Operations',
      items: [
        { id: 'hrms', label: 'HR People Hub', icon: Users, path: '/hrms', tcode: 'PA40', desc: 'Human resources' },
        { id: 'salary-details', label: 'Salary Details', icon: Receipt, path: '/salary-details', tcode: 'SAL1', desc: 'My compensation' },
        { id: 'iatf-hub', label: 'IATF Hub', icon: ShieldCheck, path: '/iatf-hub', tcode: 'IATF', desc: 'L&D & Compliance' },
        { id: 'team', label: 'Team Members', icon: UserPlus, path: '/team', tcode: 'SU01', desc: 'User management' },
        { id: 'careers', label: 'Careers', icon: Briefcase, path: '/careers', tcode: 'CARE', desc: 'Careers & Hiring' },
      ]
    },
    {
      group: 'Finance & Assets',
      items: [
        { id: 'accountant', label: 'Accountant Portal', icon: ClipboardList, path: '/accountant', tcode: 'FB01', desc: 'Books & accounts' },
        { id: 'finance', label: 'Finance & Books', icon: Receipt, path: '/finance', tcode: 'VF01', desc: 'Invoices & billing' },
        { id: 'expenses', label: 'Expenses', icon: TrendingUp, path: '/expenses', tcode: 'FB60', desc: 'Expense tracker' },
        { id: 'business-orders', label: 'Business Orders', icon: Package, path: '/business-orders', tcode: 'ME51N', desc: 'Purchase orders' },
        { id: 'assets', label: 'Asset Management', icon: Box, path: '/assets', tcode: 'AA01', desc: 'Fixed assets' },
      ]
    },
    {
      group: 'Administration',
      items: [
        ...(user?.role === 'superadmin' ? [{ id: 'saas-admin', label: 'SAAS Admin', icon: Shield, path: '/saas-admin', tcode: 'SU01', desc: 'Platform admin' }] : []),
        ...(user?.role === 'admin' ? [{ id: 'subscription', label: 'Subscription', icon: Receipt, path: '/subscription', tcode: 'SUB1', desc: 'Billing plan' }] : []),
        { id: 'audit', label: 'Audit Logs', icon: ShieldCheck, path: '/audit', tcode: 'SM20', desc: 'Activity trail' },
        ...(user?.role === 'admin' ? [{ id: 'company-onboarding', label: 'Company Setup', icon: Building2, path: '/company-onboarding', tcode: 'COMP', desc: 'Company profile' }] : []),
        { id: 'settings', label: 'Platform Settings', icon: Settings, path: '/settings', tcode: 'SPRO', desc: 'Preferences' },
      ]
    }
  ];

  const isItemVisible = (item) => {
    if (user?.role === 'superadmin') return true;
    if (item.id === 'audit' && user?.role !== 'admin') return false;
    if (['dashboard', 'subscription', 'settings'].includes(item.id)) return true;
    if (user?.role === 'accountant' && ['dashboard', 'accountant', 'settings', 'feed'].includes(item.id)) return true;
    const serviceId = serviceMapping[item.id];
    if (!serviceId) return true;
    if (!user?.enabled_services) return true;
    return user.enabled_services.includes(serviceId);
  };

  const visibleGroups = categorizedMenuItems.map(cat => ({
    ...cat,
    items: cat.items.filter(isItemVisible)
  })).filter(cat => cat.items.length > 0);

  const flatMenuItems = visibleGroups.flatMap(cat => cat.items);


  // Command palette search
  const commandResults = useMemo(() => {
    if (!commandInput.trim()) return [];
    const q = commandInput.toLowerCase().trim();
    return flatMenuItems.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.tcode.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      (item.desc || '').toLowerCase().includes(q)
    ).slice(0, 6);
  }, [commandInput, flatMenuItems]);

  const handleCommandSelect = (item) => {
    navigate(item.path);
    setCommandInput('');
    setCommandFocused(false);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  // Global keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        commandInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleCommandKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (commandResults.length > 0) {
        handleCommandSelect(commandResults[0]);
      }
    }
    if (e.key === 'Escape') {
      setCommandInput('');
      setCommandFocused(false);
    }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 50, padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px' }}
        className="lg:hidden"
        data-testid="sidebar-toggle"
      >
        {isSidebarOpen ? <X size={20} color="#fff" /> : <Menu size={20} color="#fff" />}
      </button>

      {/* Sidebar panel */}
      <div
        style={{ background: 'var(--bg-base)', borderRight: '1px solid var(--border)' }}
        className={`fixed lg:sticky top-0 left-0 z-40 w-64 h-screen flex flex-col shrink-0 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', background: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span style={{ color: '#000', fontWeight: '800', fontSize: '18px' }}>M</span>
                <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'var(--brand-primary)', borderRadius: '50%', border: '2px solid var(--bg-base)' }} />
              </div>
              <div>
                <h1 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: '0', letterSpacing: '-0.02em' }} data-testid="sidebar-title">MyOffice</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '0', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: '500' }}>Enterprise</p>
              </div>
            </div>
            {/* Notification center in sidebar header */}
            <NotificationCenter user={user} />
          </div>
        </div>

        {/* AI Command Bar */}
        <div style={{ padding: '16px 16px 8px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              {commandFocused ? <Sparkles size={14} color="var(--brand-primary)" /> : <Search size={14} color="var(--text-muted)" />}
            </div>
            <input
              ref={commandInputRef}
              type="text"
              placeholder="Search or jump to... ⌘K"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onFocus={() => setCommandFocused(true)}
              onBlur={() => setTimeout(() => { setCommandFocused(false); if (!commandInput) setCommandResults([]); }, 150)}
              onKeyDown={handleCommandKeyDown}
              className="dark-input"
              style={{
                paddingLeft: '34px',
                paddingRight: '24px',
                height: '36px',
                fontSize: '13px'
              }}
            />
            {commandInput && (
              <button onClick={() => { setCommandInput(''); setCommandResults([]); }} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {commandResults.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: '16px', right: '16px', zIndex: 60,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px',
              padding: '6px', boxShadow: 'var(--shadow-lg)'
            }}>
              {commandResults.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => handleCommandSelect(item)} className="sidebar-link" style={{ width: '100%', border: 'none', cursor: 'pointer', background: idx === 0 ? 'rgba(255,255,255,0.04)' : 'transparent', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx === 0 ? 'rgba(255,255,255,0.04)' : 'transparent'}
                  >
                    <Icon size={14} style={{ color: 'var(--brand-primary)' }} />
                    <span style={{ flex: 1, color: '#fff' }}>{item.label}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.tcode}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px' }} className="hide-scrollbar">
          {visibleGroups.map((group, idx) => {
            const isCollapsed = group.group ? collapsedGroups[group.group] : false;
            return (
            <div key={idx} style={{ marginBottom: '24px' }}>
              {group.group && (
                <button
                  onClick={() => toggleGroup(group.group)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: '8px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {group.group}
                  </span>
                  <ChevronRight size={12} color="var(--text-muted)" style={{ transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(0)' : 'rotate(90deg)' }} />
                </button>
              )}
              <div style={{ overflow: 'hidden', transition: 'max-height 0.3s', maxHeight: isCollapsed ? '0' : '1000px' }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    data-testid={`nav-${item.id}`}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    style={{ marginBottom: '2px' }}
                    onClick={() => {
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                  >
                    <Icon size={16} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </Link>
                );
              })}
              </div>
            </div>
          )})}
        </nav>

        {/* Footer User Area */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: '600', border: '1px solid var(--border)' }}>
              {getInitials(user?.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: '13px', fontWeight: '500', margin: '0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} data-testid="user-name">{user?.name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '2px 0 0', textTransform: 'capitalize' }}>{user?.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            data-testid="logout-btn"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500', cursor: 'pointer', borderRadius: '6px', transition: 'all 0.15s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 30 }}
          className="lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;