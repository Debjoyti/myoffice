import re

with open('frontend/src/index.css', 'r') as f:
    content = f.read()

# Make tabs cleaner
old_tabs = """  .tab-btn {
    padding: 8px 16px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    transition: all 0.15s ease;
    margin-bottom: -1px;
  }
  .tab-btn:hover { color: var(--text-primary); }
  .tab-btn.active {
    color: #fff;
    border-bottom-color: var(--brand-primary);
  }"""
new_tabs = """  .tab-btn {
    padding: 8px 16px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-muted);
    transition: all 0.15s ease;
    margin-bottom: -1px;
  }
  .tab-btn:hover { color: var(--text-primary); }
  .tab-btn.active {
    color: var(--text-primary);
    border-bottom-color: var(--text-primary);
  }"""
content = content.replace(old_tabs, new_tabs)

with open('frontend/src/index.css', 'w') as f:
    f.write(content)
