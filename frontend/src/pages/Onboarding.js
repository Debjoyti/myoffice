import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Check, ArrowRight, Zap, Users, Shield, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Onboarding = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price_monthly: 999,
      price_yearly: 9999,
      features: ['Up to 50 employees', 'Basic HR features', 'Email support', 'Mobile app access']
    },
    {
      id: 'professional',
      name: 'Professional',
      price_monthly: 2999,
      price_yearly: 29999,
      popular: true,
      features: ['Up to 200 employees', 'All HR features', 'Priority support', 'Advanced analytics', 'API access']
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price_monthly: 9999,
      price_yearly: 99999,
      features: ['Unlimited employees', 'Custom features', 'Dedicated support', 'Custom integrations', 'SLA guarantee']
    }
  ];

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/subscriptions`, {
        plan: selectedPlan,
        billing_cycle: billingCycle
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Track analytics
      await axios.post(`${API}/analytics/track`, {
        event_type: 'onboarding_completed',
        event_data: { plan: selectedPlan, billing_cycle: billingCycle },
        page: 'onboarding'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Subscription activated successfully!');
      onComplete();
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Subscription failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">B</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Welcome to BizOps! 🎉</h1>
          <p className="text-lg text-slate-600">Choose the perfect plan for your organization</p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-xl p-1.5 shadow-md border border-slate-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
            const isSelected = selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative bg-white rounded-2xl p-8 cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-blue-600 shadow-xl scale-105'
                    : 'border border-slate-200 shadow-sm hover:shadow-lg hover:scale-102'
                } ${plan.popular ? 'md:scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-slate-900">₹{price.toLocaleString('en-IN')}</span>
                    <span className="text-slate-600">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                        <Check size={14} className="text-green-600" />
                      </div>
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select Plan'}
                </button>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Start Your Free Trial'}
            <ArrowRight size={20} />
          </button>
          <p className="text-sm text-slate-600 mt-4">14-day free trial • No credit card required • Cancel anytime</p>
        </div>

        {/* Features Banner */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Zap, title: 'Instant Setup', desc: 'Get started in minutes' },
            { icon: Users, title: '200+ Employees', desc: 'Scale with your team' },
            { icon: Shield, title: 'Secure & Compliant', desc: 'Enterprise-grade security' },
            { icon: TrendingUp, title: 'Analytics', desc: 'Track your growth' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3">
                  <Icon size={24} className="text-blue-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
