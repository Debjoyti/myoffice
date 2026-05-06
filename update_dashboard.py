import re

with open('frontend/src/pages/Dashboard.js', 'r') as f:
    content = f.read()

# Make statCards use a 4 column grid
content = content.replace("gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))'", "gridTemplateColumns: 'repeat(4, 1fr)'")

# Make quick actions and executive intelligence cleaner
old_quick_actions = """              {/* Quick Actions */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0 }}>Quick Actions</h2>
                  <span className="badge">⌘K to search</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {quickActions.map((action, i) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => navigate(action.href)}
                        className="glass-card"
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px', cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
                      >
                        <Icon size={20} color="var(--text-secondary)" style={{ marginBottom: '12px' }} />
                        <p style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, margin: '0 0 4px' }}>{action.label}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>{action.sub}</p>
                      </button>
                    )
                  })}
                </div>
              </div>"""

new_quick_actions = """              {/* Quick Actions */}
              <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Quick Actions</h2>
                  <span className="badge">⌘K to search</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {quickActions.map((action, i) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => navigate(action.href)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '16px', cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border)', background: 'var(--bg-elevated)', borderRadius: '8px', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                      >
                        <Icon size={20} color="var(--text-secondary)" style={{ marginBottom: '12px' }} />
                        <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, margin: '0 0 4px' }}>{action.label}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: 0 }}>{action.sub}</p>
                      </button>
                    )
                  })}
                </div>
              </div>"""

content = content.replace(old_quick_actions, new_quick_actions)

with open('frontend/src/pages/Dashboard.js', 'w') as f:
    f.write(content)
