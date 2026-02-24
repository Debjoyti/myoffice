import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';
import Projects from './pages/Projects';
import CRM from './pages/CRM';
import Expenses from './pages/Expenses';
import Inventory from './pages/Inventory';
import Stores from './pages/Stores';
import PurchaseRequests from './pages/PurchaseRequests';
import PurchaseOrders from './pages/PurchaseOrders';
import HRConfig from './pages/HRConfig';
import TeamMembers from './pages/TeamMembers';
import '@/App.css';

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
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
              needsOnboarding ? <Navigate to="/onboarding" /> : <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/employees" element={user && !needsOnboarding ? <Employees user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/attendance" element={user && !needsOnboarding ? <Attendance user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/leave" element={user && !needsOnboarding ? <LeaveManagement user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/projects" element={user && !needsOnboarding ? <Projects user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/crm" element={user && !needsOnboarding ? <CRM user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/expenses" element={user && !needsOnboarding ? <Expenses user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/inventory" element={user && !needsOnboarding ? <Inventory user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/stores" element={user && !needsOnboarding ? <Stores user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/purchase-requests" element={user && !needsOnboarding ? <PurchaseRequests user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/purchase-orders" element={user && !needsOnboarding ? <PurchaseOrders user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/team" element={user && !needsOnboarding ? <TeamMembers user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/hr-config" element={user && !needsOnboarding ? <HRConfig user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;