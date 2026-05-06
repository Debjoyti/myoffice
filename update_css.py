import re

with open('frontend/src/index.css', 'r') as f:
    content = f.read()

# Update .glass-card
old_glass_card = """  .glass-card {
    background: var(--bg-surface);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.2);
    backdrop-filter: blur(12px);
  }"""
new_glass_card = """  .glass-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow-sm);
  }"""
content = content.replace(old_glass_card, new_glass_card)

# Update .kpi-card
old_kpi_card = """  .kpi-card {
    background: var(--bg-surface);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    position: relative;
    overflow: hidden;
  }
  .kpi-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--brand-primary), transparent);
    opacity: 0.5;
  }"""
new_kpi_card = """  .kpi-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
  }"""
content = content.replace(old_kpi_card, new_kpi_card)

with open('frontend/src/index.css', 'w') as f:
    f.write(content)
