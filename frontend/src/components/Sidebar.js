import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Menu, X, LayoutDashboard, Users, Calendar, Umbrella, FolderKanban, Briefcase, TrendingUp, Package, Building2, FileText, ClipboardList, Settings, UserPlus } from 'lucide-react';

const Sidebar = ({ user, onLogout, activePage, setActivePage, isSidebarOpen, setIsSidebarOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'employees', label: 'Employees', icon: Users, path: '/employees' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, path: '/attendance' },
    { id: 'leave', label: 'Leave', icon: Umbrella, path: '/leave' },
    { id: 'projects', label: 'Projects', icon: FolderKanban, path: '/projects' },
    { id: 'crm', label: 'CRM', icon: Briefcase, path: '/crm' },
    { id: 'expenses', label: 'Expenses', icon: TrendingUp, path: '/expenses' },
    { id: 'inventory', label: 'Inventory', icon: Package, path: '/inventory' },
    { id: 'stores', label: 'Stores', icon: Building2, path: '/stores' },
    { id: 'purchase-requests', label: 'Purchase Requests', icon: FileText, path: '/purchase-requests' },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ClipboardList, path: '/purchase-orders' },
    { id: 'team', label: 'Team Members', icon: UserPlus, path: '/team' },
    { id: 'hr-config', label: 'HR Config', icon: Settings, path: '/hr-config' },
  ];

  return (
    <>
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all"
        data-testid="sidebar-toggle"
      >
        {isSidebarOpen ? <X size={20} className="text-slate-700" /> : <Menu size={20} className="text-slate-700" />}
      </button>

      <div
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 z-40 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900" data-testid="sidebar-title">BizOps</h1>
              <p className="text-xs text-slate-500">Enterprise Edition</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <Link
                key={item.id}
                to={item.path}
                data-testid={`nav-${item.id}`}
                className={`sidebar-link group ${isActive ? 'active' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                onClick={() => {
                  setActivePage(item.id);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
              >
                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="mb-3 px-3 py-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-xs">{user.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate text-sm" data-testid="user-name">{user.name}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{user.role}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            data-testid="logout-btn"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all text-sm font-medium shadow-sm hover:shadow-md"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;