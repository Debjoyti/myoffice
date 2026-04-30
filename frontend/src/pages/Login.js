import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

// Demo credentials for easy access
const DEMO_USERS = [
  { label: 'Super Admin', email: 'superadmin@demo.com', password: 'password123' },
  { label: 'Admin', email: 'admin@demo.com', password: 'password123' },
  { label: 'Employee', email: 'employee@demo.com', password: 'password123' },
];

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);

  const fillDemo = (email, password) => {
    setFormData(f => ({ ...f, email, password }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const response = await axios.post(`${API}${endpoint}`, formData);
      toast.success(isRegister ? 'Account created successfully!' : 'Welcome back!');
      onLogin(response.data.user, response.data.access_token);
    } catch (error) {
      if (!BACKEND_URL) {
        toast.error('Backend URL is not configured. Set REACT_APP_BACKEND_URL in .env file.');
      } else if (!error.response) {
        toast.error(`Cannot connect to backend at ${BACKEND_URL}. Please make sure the server is running.`);
      } else if (error.response.status === 401) {
        toast.error('Invalid email or password. Use demo credentials below.');
      } else {
        toast.error(error.response?.data?.detail || 'Authentication failed. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: 'var(--bg-base)',
      position: 'relative',
      padding: '24px'
    }}>
      {/* Background Glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(94, 106, 210, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{
        width: '100%', maxWidth: '400px',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)', position: 'relative'
          }}>
            <span style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: 800 }}>M</span>
            <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', background: 'var(--brand-primary)', borderRadius: '50%', border: '2px solid var(--bg-elevated)' }} />
          </div>
        </div>

        <div className="glass-card" style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', margin: '0 0 8px' }}>
              {isRegister ? 'Create an account' : 'Welcome back'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              {isRegister
                ? 'Enter your details to get started'
                : 'Enter your credentials to access your workspace'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {isRegister && (
                <div>
                  <label className="dark-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="dark-input"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="name-input"
                  />
                </div>
              )}
              <div>
                <label className="dark-label">Email address</label>
                <input
                  type="email"
                  required
                  className="dark-input"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="email-input"
                />
              </div>
              <div>
                <label className="dark-label">Password</label>
                <input
                  type="password"
                  required
                  className="dark-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  data-testid="password-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-dark-primary"
                data-testid="auth-submit-btn"
                style={{ width: '100%', marginTop: '8px', padding: '10px' }}
              >
                {loading ? 'Please wait...' : (isRegister ? 'Sign Up' : 'Log In')}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setFormData({ email: '', password: '', name: '' });
              }}
              data-testid="toggle-auth-mode"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'inherit',
              }}
            >
              {isRegister
                ? <>Already have an account? <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Log In</span></>
                : <>Don't have an account? <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Sign Up</span></>}
            </button>
          </div>
        </div>

        {!isRegister && (
          <div style={{
            marginTop: '24px', padding: '20px',
            background: 'var(--bg-card)',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Demo Credentials
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {DEMO_USERS.map(u => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => fillDemo(u.email, u.password)}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.label}</span>{' '}— {u.email}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;