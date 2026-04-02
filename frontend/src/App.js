import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import HRMS from './pages/HRMS';
import Projects from './pages/Projects';
import CRM from './pages/CRM';
import Expenses from './pages/Expenses';
import BusinessOrders from './pages/BusinessOrders';
import TeamMembers from './pages/TeamMembers';
import SaasAdmin from './pages/SaasAdmin';
import Finance from './pages/Finance';
import Timesheets from './pages/Timesheets';
import SupportDesk from './pages/SupportDesk';
import OfficeFeed from './pages/OfficeFeed';
import AssetManagement from './pages/AssetManagement';
import Recruitment from './pages/Recruitment';
import Settings from './pages/Settings';
import KnowledgeBase from './pages/KnowledgeBase';
import AuditLogs from './pages/AuditLogs';
import Subscription from './pages/Subscription';
import CompanyOnboarding from './pages/CompanyOnboarding';
import AccountantPortal from './pages/AccountantPortal';
import TravelTracker from './pages/TravelTracker';
import EmployeeManagement from './pages/EmployeeManagement';
import AIAssistant from './components/AIAssistant';
import './App.css'; // Fixed: was @/App.css which CRA doesn't support

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    // Skip onboarding — go directly to dashboard
    setNeedsOnboarding(false);
  };

  const handleOnboardingComplete = () => {
    const updatedUser = { ...user, subscription_status: 'active' };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setNeedsOnboarding(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setNeedsOnboarding(false);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#05070f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <div style={{
          width: '56px', height: '56px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: '22px' }}>B</span>
        </div>
        <div style={{
          display: 'flex', gap: '6px', alignItems: 'center',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#6366f1',
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 500, margin: 0 }}>Loading BizOps...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
        <Route
          path="/onboarding"
          element={user && needsOnboarding ? <Onboarding user={user} onComplete={handleOnboardingComplete} /> : <Navigate to="/" />}
        />
        <Route
          path="/"
          element={
            user ? (
              needsOnboarding ? <Navigate to="/onboarding" /> 
              : user.role === 'accountant' ? <AccountantPortal user={user} onLogout={handleLogout} />
              : <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/accountant" element={user && (user.role === 'accountant' || user.role === 'admin' || user.role === 'superadmin') ? <AccountantPortal user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/employee-management" element={user && !needsOnboarding ? <EmployeeManagement user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/projects" element={user && !needsOnboarding ? <Projects user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/crm" element={user && !needsOnboarding ? <CRM user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/expenses" element={user && !needsOnboarding ? <Expenses user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/business-orders" element={user && !needsOnboarding ? <BusinessOrders user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/hrms" element={user && !needsOnboarding ? <HRMS user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/team" element={user && !needsOnboarding ? <TeamMembers user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/saas-admin" element={user && user.role === 'superadmin' ? <SaasAdmin user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
        <Route path="/finance" element={user && !needsOnboarding ? <Finance user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/timesheets" element={user && !needsOnboarding ? <Timesheets user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/support-desk" element={user && !needsOnboarding ? <SupportDesk user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/feed" element={user && !needsOnboarding ? <OfficeFeed user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/assets" element={user && !needsOnboarding ? <AssetManagement user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/recruitment" element={user && !needsOnboarding ? <Recruitment user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/kb" element={user && !needsOnboarding ? <KnowledgeBase user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/audit" element={user && !needsOnboarding ? <AuditLogs user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user && !needsOnboarding ? <Settings user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/subscription" element={user && user.role === 'admin' ? <Subscription user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
        <Route path="/company-onboarding" element={user && !needsOnboarding ? <CompanyOnboarding user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/travel" element={user && !needsOnboarding ? <TravelTracker user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
      {/* Global AI Assistant — available on all authenticated pages */}
      {user && !needsOnboarding && <AIAssistant user={user} />}
    </BrowserRouter>
  );
}

export default App;