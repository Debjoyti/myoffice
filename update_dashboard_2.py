import re

with open('frontend/src/pages/Dashboard.js', 'r') as f:
    content = f.read()

# Make AI Health Score container cleaner
content = content.replace("background: 'linear-gradient(135deg, rgba(94, 106, 210, 0.1) 0%, transparent 100%)'", "background: 'var(--bg-elevated)', border: '1px solid var(--border)'")

# Clean up Executive Intelligence
old_exec = """              {/* Executive Intelligence */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h2 style={{ margin: '0 0 20px' }}>Executive Intelligence</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {[
                    { label: 'Burn Rate', value: `₹${((stats?.burn_rate || 0) / 1000).toFixed(1)}K/day` },
                    { label: 'Rev Projection', value: `₹${((stats?.projected_revenue || 0) / 100000).toFixed(1)}L` },
                    { label: 'Hiring Progress', value: `${Math.round(stats?.hiring_progress || 0)}%` },
                  ].map((m, i) => (
                    <div key={i} style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 8px', fontWeight: 500 }}>{m.label}</p>
                      <p style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 600, margin: 0 }}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>"""

new_exec = """              {/* Executive Intelligence */}
              <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '600' }}>Executive Intelligence</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {[
                    { label: 'Burn Rate', value: `₹${((stats?.burn_rate || 0) / 1000).toFixed(1)}K/day` },
                    { label: 'Rev Projection', value: `₹${((stats?.projected_revenue || 0) / 100000).toFixed(1)}L` },
                    { label: 'Hiring Progress', value: `${Math.round(stats?.hiring_progress || 0)}%` },
                  ].map((m, i) => (
                    <div key={i} style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 8px', fontWeight: 500 }}>{m.label}</p>
                      <p style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 600, margin: 0 }}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>"""
content = content.replace(old_exec, new_exec)

with open('frontend/src/pages/Dashboard.js', 'w') as f:
    f.write(content)
