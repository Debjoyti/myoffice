import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import HRMS from './pages/HRMS';
import Expenses from './pages/Expenses';
import TeamMembers from './pages/TeamMembers';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import EmployeeManagement from './pages/EmployeeManagement';
import Careers from './pages/Careers';
import SalaryDetails from './pages/SalaryDetails';
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
              : <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/employee-management" element={user && !needsOnboarding ? <EmployeeManagement user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/reimbursements" element={user && !needsOnboarding ? <Expenses user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/salary" element={user && !needsOnboarding ? <SalaryDetails user={user} /> : <Navigate to="/login" />} />
        <Route path="/hr" element={user && !needsOnboarding ? <HRMS user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/org" element={user && !needsOnboarding ? <TeamMembers user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/audit" element={user && !needsOnboarding ? <AuditLogs user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user && !needsOnboarding ? <Settings user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/careers" element={user && !needsOnboarding ? <Careers user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
      {/* Global AI Assistant — available on all authenticated pages */}
      {user && !needsOnboarding && <AIAssistant user={user} />}
    </BrowserRouter>
  );
}

export default App;