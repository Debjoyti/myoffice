import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, Send, Sparkles, ChevronDown, Lightbulb, TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context-aware suggestions per page
const PAGE_SUGGESTIONS = {
  '/': ['What are my top priorities today?', 'Show business health summary', 'Any pending approvals?', 'Revenue vs last month?'],
  '/crm': ['Which leads are most likely to close?', 'Show pipeline value by stage', 'Deals closing this month?', 'Top performing lead sources?'],
  '/hrms': ['Who is on leave today?', 'Employees with high attrition risk?', 'Pending HR approvals?', 'Department headcount breakdown?'],
  '/finance': ['Show overdue invoices', 'Cash flow this month?', 'Top expense categories?', 'GST due this quarter?'],
  '/projects': ['Projects behind schedule?', 'Resource utilization?', 'Billable vs non-billable hours?', 'Which tasks are overdue?'],
  '/support-desk': ['High priority open tickets?', 'Average resolution time?', 'SLA breaches this week?', 'Most common issue categories?'],
  '/expenses': ['Unusual expense patterns?', 'Who has highest expenses?', 'Policy violations?', 'Budget remaining?'],
  '/timesheets': ['Missing timesheets this week?', 'Billability score?', 'Hours by project?', 'Top contributors?'],
};

const DEFAULT_SUGGESTIONS = [
  'What should I focus on today?',
  'Show key business metrics',
  'Any urgent items?',
  'Help me navigate to...',
];

// Rule-based AI responses using actual data patterns
const generateAIResponse = (message, context) => {
  const msg = message.toLowerCase();
  const { stats, page, user } = context;

  const greeting = user?.name ? `Based on your BizOps data, ` : '';

  if (msg.includes('priority') || msg.includes('focus') || msg.includes('today')) {
    const items = [];
    if (stats?.pending_leaves > 0) items.push(`📋 ${stats.pending_leaves} leave request${stats.pending_leaves > 1 ? 's' : ''} awaiting approval`);
    if (stats?.total_tickets > 0) items.push(`🎫 ${stats.total_tickets} support tickets need attention`);
    if (stats?.total_invoices > 0) items.push(`🧾 ${stats.total_invoices} invoices in system — check for overdue`);
    if (items.length === 0) items.push('✅ No urgent items detected — great day to focus on growth!');
    return `${greeting}here are your top priorities:\n\n${items.join('\n')}\n\n💡 **AI Insight**: Start with HR approvals to maintain team morale, then review invoice status for cash flow.`;
  }

  if (msg.includes('leave') || msg.includes('absent') || msg.includes('hr')) {
    return `📅 **HR Status Update**\n\n• **Pending leaves**: ${stats?.pending_leaves || 0} request(s) awaiting review\n• **Team size**: ${stats?.total_employees || 0} employees\n\n💡 Tip: Review leave patterns — Friday/Monday spikes often indicate burnout. Navigate to **HR People Hub** to take action.`;
  }

  if (msg.includes('invoice') || msg.includes('revenue') || msg.includes('cash') || msg.includes('finance')) {
    const proj = ((stats?.projected_revenue || 0) / 100000).toFixed(1);
    const burn = ((stats?.burn_rate || 0) / 1000).toFixed(1);
    return `💰 **Financial Intelligence**\n\n• **Revenue Projection**: ₹${proj}L this month\n• **Daily Burn Rate**: ₹${burn}K/day\n• **Total Invoices**: ${stats?.total_invoices || 0}\n\n💡 **AI Forecast**: Based on current invoice velocity, cash position looks ${proj > 5 ? 'healthy' : 'tight'}. Recommend following up on overdue invoices immediately.`;
  }

  if (msg.includes('lead') || msg.includes('crm') || msg.includes('deal') || msg.includes('pipeline')) {
    return `🎯 **CRM Intelligence**\n\n• **Active Leads**: ${stats?.total_leads || 0} in pipeline\n• **Pipeline Health**: ${stats?.total_leads > 10 ? 'Strong pipeline' : 'Low pipeline — needs attention'}\n\n💡 **AI Recommendation**: Focus on leads in "Negotiation" stage first — they have highest close probability. Leads older than 14 days without activity should be marked inactive.`;
  }

  if (msg.includes('employee') || msg.includes('team') || msg.includes('people')) {
    return `👥 **Team Intelligence**\n\n• **Total Team**: ${stats?.total_employees || 0} employees\n• **Status**: ${stats?.total_employees > 0 ? 'Active organization' : 'Just getting started'}\n\n💡 **AI Insight**: With ${stats?.total_employees || 0} employees, recommend setting up departments and performance cycles. Go to **HR People Hub** → Employee Directory.`;
  }

  if (msg.includes('project') || msg.includes('task') || msg.includes('sprint')) {
    return `📊 **Projects Intelligence**\n\n• **Active Projects**: ${stats?.total_projects || 0}\n• **Billable Hours**: ${stats?.total_timesheet_hours || 0}h logged\n\n💡 **AI Insight**: ${(stats?.total_timesheet_hours || 0) < 40 ? 'Low billable hours detected — ensure team is logging time daily.' : 'Good timesheet compliance! Review project deadlines to prevent scope creep.'}`;
  }

  if (msg.includes('ticket') || msg.includes('support') || msg.includes('help desk')) {
    return `🎫 **Support Desk Status**\n\n• **Total Tickets**: ${stats?.total_tickets || 0}\n• **SLA Status**: ${(stats?.total_tickets || 0) > 5 ? '⚠️ High volume — check SLA breaches' : '✅ Volume normal'}\n\n💡 **AI Suggestion**: Categorize tickets by type to identify repeated issues. Top repeating issues should become Knowledge Base articles.`;
  }

  if (msg.includes('navigate') || msg.includes('go to') || msg.includes('open')) {
    return `🧭 **Navigation Help**\n\nI can take you to any module! Try typing:\n• "Go to CRM"\n• "Open HRMS"\n• "Show Finance"\n\nOr use the **T-Code bar** in the sidebar:\n• \`VA01\` → CRM\n• \`PA40\` → HRMS\n• \`FB60\` → Finance\n• \`SO11\` → Support Desk\n• \`CAT2\` → Timesheets`;
  }

  if (msg.includes('health') || msg.includes('summary') || msg.includes('overview') || msg.includes('metric')) {
    const score = Math.min(100, Math.round(
      ((stats?.total_employees || 0) * 2) +
      ((stats?.total_leads || 0) * 3) +
      ((stats?.total_invoices || 0) * 5) -
      ((stats?.pending_leaves || 0) * 2)
    ));
    const health = score > 70 ? '🟢 Excellent' : score > 40 ? '🟡 Good' : '🔴 Needs Attention';
    return `📈 **Business Health Score: ${Math.max(0, score)}/100** — ${health}\n\n• 👥 Employees: ${stats?.total_employees || 0}\n• 🎯 Leads: ${stats?.total_leads || 0}\n• 🧾 Invoices: ${stats?.total_invoices || 0}\n• 📋 Pending Leaves: ${stats?.pending_leaves || 0}\n• 🎫 Support Tickets: ${stats?.total_tickets || 0}\n• ⏱️ Hours Logged: ${stats?.total_timesheet_hours || 0}h\n\n💡 Focus areas: ${(stats?.pending_leaves || 0) > 3 ? 'Clear leave backlogs. ' : ''}${(stats?.total_leads || 0) < 5 ? 'Build CRM pipeline. ' : ''}${(stats?.total_invoices || 0) < 3 ? 'Generate invoices to improve cash flow.' : ''}`;
  }

  // Default intelligent response
  return `🤖 **BizOps AI** is here to help!\n\nI can tell you about:\n• 📊 Business metrics & KPIs\n• 👥 HR status & team insights\n• 💰 Financial health & forecasts\n• 🎯 CRM pipeline & leads\n• 📋 Project status & utilization\n\nTry asking: *"What are my priorities today?"* or *"Show business health summary"*`;
};

// Format AI response markdown-lite
const formatMessage = (text) => {
  const parts = text.split('\n');
  return parts.map((part, i) => {
    if (part.startsWith('## ')) return <p key={i} style={{ fontWeight: 800, fontSize: '15px', color: '#fff', margin: '12px 0 6px' }}>{part.replace('## ', '')}</p>;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <p key={i} style={{ fontWeight: 700, color: '#c4b5fd', margin: '4px 0' }}>{part.replace(/\*\*/g, '')}</p>;
    }
    if (part.includes('**')) {
      const html = part.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>');
      return <p key={i} style={{ margin: '4px 0', lineHeight: 1.6, fontSize: '13.5px' }} dangerouslySetInnerHTML={{ __html: html }} />;
    }
    if (part.startsWith('• ')) {
      return <p key={i} style={{ margin: '3px 0', paddingLeft: '4px', lineHeight: 1.5, fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{part}</p>;
    }
    if (part.trim() === '') return <br key={i} />;
    return <p key={i} style={{ margin: '4px 0', lineHeight: 1.6, fontSize: '13.5px' }}>{part}</p>;
  });
};

const AIAssistant = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [stats, setStats] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const location = useLocation();

  const currentPage = location.pathname;
  const suggestions = PAGE_SUGGESTIONS[currentPage] || DEFAULT_SUGGESTIONS;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } });
        setStats(res.data);
      } catch {}
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      setMessages([{
        id: 1,
        role: 'assistant',
        content: `✨ ${greeting}, ${user?.name?.split(' ')[0] || 'there'}! I'm your **BizOps AI Assistant**.\n\nI have access to your live business data and can help you with insights, decisions, and navigation. What would you like to explore?`,
        timestamp: new Date()
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.name]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    const msgText = text || input.trim();
    if (!msgText) return;

    const userMsg = { id: Date.now(), role: 'user', content: msgText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay (320-900ms for realism)
    const delay = 320 + Math.random() * 580;
    await new Promise(r => setTimeout(r, delay));

    const response = generateAIResponse(msgText, { stats, page: currentPage, user });
    const aiMsg = { id: Date.now() + 1, role: 'assistant', content: response, timestamp: new Date() };
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  }, [input, stats, currentPage, user]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const pageLabel = {
    '/': 'Dashboard', '/crm': 'CRM', '/hrms': 'HRMS', '/finance': 'Finance',
    '/projects': 'Projects', '/support-desk': 'Support Desk', '/expenses': 'Expenses',
    '/timesheets': 'Timesheets', '/assets': 'Assets', '/recruitment': 'Recruitment',
  }[currentPage] || 'Platform';

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 1000,
          width: '56px', height: '56px', borderRadius: '18px',
          background: isOpen ? 'rgba(99,102,241,0.2)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: isOpen ? '2px solid rgba(99,102,241,0.5)' : 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isOpen ? 'none' : '0 8px 32px rgba(99,102,241,0.45)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
        title="AI Assistant (Ctrl+Shift+A)"
      >
        {isOpen
          ? <X size={22} color="#a5b4fc" />
          : <Sparkles size={22} color="#fff" />
        }
        {!isOpen && messages.length === 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px', width: '14px', height: '14px',
            background: '#10b981', borderRadius: '50%', border: '2px solid #05070f',
            fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800'
          }}>✓</span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '96px', right: '28px', zIndex: 999,
          width: '390px', height: '580px',
          background: '#0c1220',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '22px',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.06)',
          animation: 'slideInFromBottom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))',
            borderBottom: '1px solid rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: 0 }}>BizOps AI</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0 }}>Live · Context: {pageLabel}</p>
              </div>
            </div>
            <button
              onClick={() => { setMessages([]); }}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '5px 8px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '10px', fontWeight: 700 }}
              title="Clear chat"
            >CLEAR</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: '10px', alignItems: 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={13} color="#fff" />
                  </div>
                )}
                <div style={{
                  maxWidth: '85%',
                  padding: msg.role === 'user' ? '10px 14px' : '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                  border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  color: msg.role === 'user' ? '#fff' : 'rgba(255,255,255,0.85)',
                  fontSize: '13.5px',
                }}>
                  {msg.role === 'assistant' ? formatMessage(msg.content) : <p style={{ margin: 0, lineHeight: 1.5 }}>{msg.content}</p>}
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', margin: '6px 0 0', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={13} color="#fff" />
                </div>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px 16px 16px 16px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            {/* Suggestions */}
            {messages.length <= 1 && !isTyping && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggested for {pageLabel}</p>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} style={{
                    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                    borderRadius: '10px', padding: '9px 14px', textAlign: 'left',
                    color: 'rgba(255,255,255,0.75)', fontSize: '12.5px', cursor: 'pointer',
                    transition: 'all 0.18s ease', fontFamily: 'Inter, sans-serif', fontWeight: 500,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                  >
                    💬 {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your business..."
                rows={1}
                style={{
                  flex: 1, resize: 'none', overflow: 'hidden',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', color: '#fff', padding: '10px 14px',
                  fontSize: '13.5px', fontFamily: 'Inter, sans-serif', outline: 'none',
                  transition: 'border-color 0.2s ease',
                  maxHeight: '100px',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                style={{
                  width: '40px', height: '40px', flexShrink: 0, borderRadius: '12px',
                  background: input.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: input.trim() ? '0 4px 16px rgba(99,102,241,0.35)' : 'none',
                }}
              >
                <Send size={16} color={input.trim() ? '#fff' : 'rgba(255,255,255,0.25)'} />
              </button>
            </div>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', margin: '8px 0 0', textAlign: 'center' }}>
              ⌨️ Enter to send · Shift+Enter for newline · Context-aware AI
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
