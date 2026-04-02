import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);

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
        toast.error('Backend URL is not configured. Set REACT_APP_BACKEND_URL in Vercel project environment variables.');
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
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background orbs */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        animation: 'float 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
        animation: 'float 10s ease-in-out infinite reverse',
      }} />
      <div style={{
        position: 'absolute', top: '40%', right: '20%',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)',
        animation: 'float 6s ease-in-out infinite',
      }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .login-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          font-family: inherit;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .login-input::placeholder { color: rgba(255,255,255,0.35); }
        .login-input:focus {
          border-color: rgba(99,102,241,0.8);
          background: rgba(99,102,241,0.08);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
        .login-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(99,102,241,0.45);
        }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .feature-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 50px;
          color: rgba(255,255,255,0.7);
          font-size: 13px;
        }
      `}</style>

      {/* Left panel — branding */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px', maxWidth: '560px',
        animation: 'slideUp 0.6s ease forwards',
      }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 800 }}>B</span>
          </div>
          <h1 style={{
            fontSize: '42px', fontWeight: 800, color: '#fff',
            lineHeight: 1.2, margin: '0 0 12px',
            letterSpacing: '-0.02em',
          }}>
            Run your office<br />
            <span style={{
              background: 'linear-gradient(135deg, #818cf8, #c4b5fd)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>smarter, faster.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '17px', lineHeight: 1.6, margin: 0 }}>
            Complete office management — HR, payroll, projects, CRM, inventory and more, all in one platform.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {['👥 HR & Attendance', '📊 Analytics', '💼 Projects', '🎯 CRM', '🏪 Stores', '💰 Expenses'].map(f => (
            <span key={f} className="feature-pill">{f}</span>
          ))}
        </div>

        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', margin: 0 }}>
            Trusted by 500+ companies across India
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flex: 1, padding: '40px',
      }}>
        <div style={{
          width: '100%', maxWidth: '420px',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '40px',
          animation: 'slideUp 0.8s ease forwards',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 6px' }}>
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', margin: 0 }}>
              {isRegister
                ? 'Get started with a free account today'
                : 'Sign in to your PRSK workspace'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isRegister && (
                <div>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="login-input"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="name-input"
                  />
                </div>
              )}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                  Email address
                </label>
                <input
                  type="email"
                  required
                  className="login-input"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="email-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="login-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  data-testid="password-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="login-btn"
                data-testid="auth-submit-btn"
                style={{ marginTop: '8px' }}
              >
                {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
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
                color: 'rgba(255,255,255,0.45)', fontSize: '14px', fontFamily: 'inherit',
              }}
            >
              {isRegister
                ? <>Already have an account? <span style={{ color: '#818cf8', fontWeight: 600 }}>Sign In</span></>
                : <>New here? <span style={{ color: '#818cf8', fontWeight: 600 }}>Create a free account</span></>}
            </button>
          </div>

          {!isRegister && (
            <div style={{
              marginTop: '24px', padding: '14px 16px',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '12px',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0, textAlign: 'center' }}>
                💡 <strong style={{ color: 'rgba(255,255,255,0.8)' }}>First time?</strong> Click "Create a free account" to register
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;