import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  LogOut, Menu, X, LayoutDashboard, Users, Calendar, FolderKanban, Briefcase,
  TrendingUp, Package, Building2, FileText, ClipboardList, Settings, UserPlus,
  Shield, Receipt, Clock, MessageSquare, Rss, Box, Book, ShieldCheck,
  ChevronRight, Sparkles, Zap, Search, Bell, MapPin
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const Sidebar = ({ user, onLogout, activePage, setActivePage, isSidebarOpen, setIsSidebarOpen }) => {
  const [commandInput, setCommandInput] = useState('');
  const [commandFocused, setCommandFocused] = useState(false);
  const commandInputRef = useRef(null);
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
        { id: 'company-onboarding', label: 'Company Setup', icon: Building2, path: '/company-onboarding', tcode: 'COMP', desc: 'Company profile' },
        { id: 'settings', label: 'Platform Settings', icon: Settings, path: '/settings', tcode: 'SPRO', desc: 'Preferences' },
      ]
    }
  ];

  const isItemVisible = (item) => {
    if (user?.role === 'superadmin') return true;
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

  const pathToId = {
    '/': 'dashboard', '/employee-management': 'employee-management', '/projects': 'projects',
    '/crm': 'crm', '/expenses': 'expenses', '/business-orders': 'business-orders',
    '/hrms': 'hrms', '/team': 'team', '/saas-admin': 'saas-admin', '/finance': 'finance',
    '/timesheets': 'timesheets', '/support-desk': 'support-desk', '/feed': 'feed',
    '/assets': 'assets', '/recruitment': 'recruitment', '/kb': 'kb', '/audit': 'audit',
    '/settings': 'settings', '/subscription': 'subscription', '/company-onboarding': 'company-onboarding',
    '/accountant': 'accountant', '/travel': 'travel', '/iatf-hub': 'iatf-hub', '/careers': 'careers',
  };
  const currentActivePage = pathToId[location.pathname] || activePage;

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
    setActivePage(item.id);
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

  // Group color accent
  const groupColors = {
    'Personal & Work': '#22d3ee',
    'Sales & Projects': '#10b981',
    'HR & Operations': '#8b5cf6',
    'Finance & Assets': '#f59e0b',
    'Administration': '#f43f5e',
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
          position: 'fixed', top: '16px', left: '16px', zIndex: 50,
          padding: '8px', background: 'rgba(6,9,20,0.9)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', display: 'none',
        }}
        className="lg:hidden"
        data-testid="sidebar-toggle"
      >
        {isSidebarOpen ? <X size={20} color="#fff" /> : <Menu size={20} color="#fff" />}
      </button>

      {/* Sidebar panel */}
      <div
        style={{
          width: '248px', minWidth: '248px', height: '100vh',
          background: '#060d1a',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, flexShrink: 0,
        }}
        className={`fixed lg:sticky top-0 left-0 z-40 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div style={{ padding: '22px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px', height: '36px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(99,102,241,0.45)',
                position: 'relative',
              }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: '15px' }}>B</span>
                <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', border: '2px solid #060d1a' }} />
              </div>
              <div>
                <h1 style={{ color: '#fff', fontSize: '15px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }} data-testid="sidebar-title">PRSK</h1>
                <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: '10px', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Enterprise AI</p>
              </div>
            </div>
            {/* Notification center in sidebar header */}
            <NotificationCenter user={user} />
          </div>
        </div>

        {/* AI Command Bar */}
        <div style={{ padding: '12px 14px 8px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              {commandFocused ? <Sparkles size={14} color="#818cf8" /> : <Search size={14} color="rgba(255,255,255,0.25)" />}
            </div>
            <input
              ref={commandInputRef}
              type="text"
              placeholder="Search or T-Code... ⌘K"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onFocus={() => setCommandFocused(true)}
              onBlur={() => setTimeout(() => { setCommandFocused(false); if (!commandInput) setCommandResults([]); }, 150)}
              onKeyDown={handleCommandKeyDown}
              style={{
                width: '100%', background: commandFocused ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${commandFocused ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '10px', padding: '9px 10px 9px 34px', color: '#fff', fontSize: '12px',
                fontWeight: 500, outline: 'none', transition: 'all 0.2s ease',
                boxShadow: commandFocused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            {commandInput && (
              <button onClick={() => { setCommandInput(''); setCommandResults([]); }} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '2px' }}>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {commandResults.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% - 4px)', left: '14px', right: '14px', zIndex: 60,
              background: '#0c1525', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px',
              padding: '6px', boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
              animation: 'fadeInUp 0.15s ease',
            }}>
              {commandResults.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => handleCommandSelect(item)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 10px', borderRadius: '8px', background: idx === 0 ? 'rgba(99,102,241,0.1)' : 'transparent',
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx === 0 ? 'rgba(99,102,241,0.1)' : 'transparent'}
                  >
                    <Icon size={14} color="#818cf8" />
                    <span style={{ flex: 1, color: '#fff', fontSize: '12.5px', fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace' }}>{item.tcode}</span>
                    <ChevronRight size={12} color="rgba(255,255,255,0.2)" />
                  </button>
                );
              })}
              <div style={{ padding: '6px 10px 2px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '4px' }}>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', margin: 0, textAlign: 'center' }}>↵ to navigate · ESC to close</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          {visibleGroups.map((group, idx) => (
            <div key={idx} style={{ marginBottom: '20px' }}>
              {group.group && (
                <div style={{
                  padding: '6px 10px 5px', fontSize: '9.5px', fontWeight: 800,
                  color: groupColors[group.group] || 'rgba(255,255,255,0.25)',
                  textTransform: 'uppercase', letterSpacing: '0.09em',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <div style={{ width: '16px', height: '1px', background: groupColors[group.group] || 'rgba(255,255,255,0.1)', opacity: 0.5 }} />
                  {group.group}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentActivePage === item.id;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    data-testid={`nav-${item.id}`}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    style={{
                      marginBottom: '2px',
                      paddingLeft: '10px',
                    }}
                    onClick={() => {
                      setActivePage(item.id);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                  >
                    <Icon size={15} style={{ color: isActive ? '#818cf8' : 'rgba(255,255,255,0.38)', flexShrink: 0 }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minWidth: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                      <span style={{
                        fontSize: '9px', color: isActive ? '#818cf8' : 'rgba(255,255,255,0.18)',
                        fontWeight: 700, background: isActive ? 'rgba(129,140,248,0.15)' : 'transparent',
                        padding: '2px 5px', borderRadius: '4px', flexShrink: 0,
                        fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.03em',
                      }}>
                        {item.tcode}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* AI Insight strip */}
        <div style={{ padding: '0 12px 10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: '12px', padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Sparkles size={13} color="#818cf8" />
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', margin: 0, lineHeight: 1.4 }}>
              <strong style={{ color: '#a5b4fc' }}>AI Assistant</strong> active — click ✨ to ask
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 14px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            marginBottom: '10px',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '12px', flexShrink: 0,
            }}>
              {getInitials(user?.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: '12.5px', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} data-testid="user-name">{user?.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10.5px', margin: 0, textTransform: 'capitalize' }}>{user?.role}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            data-testid="logout-btn"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '9px 16px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.18)',
              borderRadius: '10px', color: '#f87171', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.18)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.18)'; }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 30, backdropFilter: 'blur(6px)' }}
          className="lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;