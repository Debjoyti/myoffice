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
    '/accountant': 'accountant', '/travel': 'travel', '/iatf-hub': 'iatf-hub',
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
    'Personal & Work': '#06b6d4',
    'Sales & Projects': '#10b981',
    'HR & Operations': '#4f46e5',
    'Finance & Assets': '#f59e0b',
    'Administration': '#e11d48',
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg lg:hidden"
        data-testid="sidebar-toggle"
      >
        {isSidebarOpen ? <X size={20} className="text-slate-100" /> : <Menu size={20} className="text-slate-100" />}
      </button>

      {/* Sidebar panel */}
      <div
        className={`fixed lg:sticky top-0 left-0 z-40 w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg relative">
                <span className="text-white font-bold text-lg">B</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
              </div>
              <div>
                <h1 className="text-slate-100 text-lg font-bold m-0 tracking-tight" data-testid="sidebar-title">PRSK</h1>
                <p className="text-slate-400 text-xs m-0 tracking-wider uppercase font-medium">Enterprise AI</p>
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
        <nav className="flex-1 overflow-y-auto p-4">
          {visibleGroups.map((group, idx) => (
            <div key={idx} className="mb-6">
              {group.group && (
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: groupColors[group.group] || '#94a3b8' }}>
                  <div className="w-4 h-px opacity-50" style={{ background: groupColors[group.group] || '#94a3b8' }} />
                  {group.group}
                </div>
              )}
              <div className="space-y-1 mt-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentActivePage === item.id;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    data-testid={`nav-${item.id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group ${isActive ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                    onClick={() => {
                      setActivePage(item.id);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }}
                  >
                    <Icon size={18} className={`shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <div className="flex items-center justify-between w-full min-w-0">
                      <span className={`text-sm truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
                        {item.label}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded tracking-wider shrink-0 ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}`}>
                        {item.tcode}
                      </span>
                    </div>
                  </Link>
                );
              })}
              </div>
            </div>
          ))}
        </nav>

        {/* AI Insight strip */}
        <div className="px-4 pb-4">
          <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-lg p-3 flex items-center gap-3">
            <Sparkles size={16} className="text-indigo-400" />
            <p className="text-slate-300 text-xs m-0 leading-relaxed">
              <strong className="text-indigo-300 font-semibold">AI Assistant</strong> active — click ✨ to ask
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-sm font-bold m-0 truncate" data-testid="user-name">{user?.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-slate-400 text-xs m-0 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            data-testid="logout-btn"
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm font-semibold transition-all hover:bg-rose-500/20 hover:border-rose-500/30"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;