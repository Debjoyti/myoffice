import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Check, ArrowRight, Zap, Users, Shield, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price_monthly: 999,
    price_yearly: 9999,
    features: ['Up to 50 employees', 'Basic HR features', 'Email support', 'Mobile app access'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price_monthly: 2999,
    price_yearly: 29999,
    popular: true,
    features: ['Up to 200 employees', 'All HR features', 'Priority support', 'Advanced analytics', 'API access'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price_monthly: 9999,
    price_yearly: 99999,
    features: ['Unlimited employees', 'Custom features', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
  },
];

const feature_tiles = [
  { icon: Zap, title: 'Instant Setup', desc: 'Get started in minutes' },
  { icon: Users, title: '200+ Employees', desc: 'Scale with your team' },
  { icon: Shield, title: 'Secure & Compliant', desc: 'Enterprise-grade security' },
  { icon: TrendingUp, title: 'Analytics', desc: 'Track your growth' },
];

const Onboarding = ({ user, onComplete }) => {
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/subscriptions`, { plan: selectedPlan, billing_cycle: billingCycle }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await axios.post(`${API}/analytics/track`, {
        event_type: 'onboarding_completed',
        event_data: { plan: selectedPlan, billing_cycle: billingCycle },
        page: 'onboarding',
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success('Subscription activated successfully!');
      onComplete();
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Subscription failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1080px', width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '18px', marginBottom: '20px', boxShadow: '0 8px 28px rgba(99,102,241,0.4)' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '26px' }}>B</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: '36px', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em' }}>Welcome to BizOps! 🎉</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '17px', margin: 0 }}>Choose the perfect plan for your organization</p>
        </div>

        {/* Billing Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '5px' }}>
            {['monthly', 'yearly'].map(cycle => (
              <button key={cycle} onClick={() => setBillingCycle(cycle)}
                style={{
                  padding: '9px 24px', borderRadius: '10px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
                  background: billingCycle === cycle ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                  color: billingCycle === cycle ? '#fff' : 'rgba(255,255,255,0.45)',
                  boxShadow: billingCycle === cycle ? '0 4px 14px rgba(99,102,241,0.3)' : 'none',
                }}>
                {cycle === 'monthly' ? 'Monthly' : (
                  <span>Yearly <span style={{ marginLeft: '6px', background: 'rgba(16,185,129,0.2)', color: '#34d399', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>Save 17%</span></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '36px' }}>
          {plans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
            const isSelected = selectedPlan === plan.id;

            return (
              <div key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                style={{
                  position: 'relative',
                  background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                  border: isSelected ? '1.5px solid rgba(99,102,241,0.6)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px', padding: '32px 24px',
                  cursor: 'pointer', transition: 'all 0.25s ease',
                  transform: (isSelected || plan.popular) ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? '0 12px 40px rgba(99,102,241,0.25)' : 'none',
                }}
                onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; } }}
                onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; } }}
              >
                {plan.popular && (
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '5px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h3 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 10px' }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                    <span style={{ color: '#fff', fontSize: '36px', fontWeight: 800 }}>₹{price.toLocaleString('en-IN')}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={12} color="#34d399" />
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px' }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button style={{
                  width: '100%', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
                  background: isSelected ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.08)',
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.5)',
                  boxShadow: isSelected ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
                }}>
                  {isSelected ? 'Selected ✓' : 'Select Plan'}
                </button>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <button onClick={handleSubscribe} disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '16px 40px',
              background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none', borderRadius: '14px',
              fontWeight: 700, fontSize: '17px', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 28px rgba(99,102,241,0.4)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(99,102,241,0.55)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.4)'; }}
          >
            {loading ? 'Processing…' : 'Start Your Free Trial'}
            <ArrowRight size={20} />
          </button>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginTop: '14px' }}>
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>

        {/* Feature tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {feature_tiles.map((tile, idx) => {
            const Icon = tile.icon;
            return (
              <div key={idx} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ width: '46px', height: '46px', background: 'rgba(99,102,241,0.15)', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <Icon size={22} color="#818cf8" />
                </div>
                <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: '0 0 6px' }}>{tile.title}</h4>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>{tile.desc}</p>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default Onboarding;
