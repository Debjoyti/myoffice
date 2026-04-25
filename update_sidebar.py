import re

with open('frontend/src/components/Sidebar.js', 'r') as f:
    content = f.read()

# Add collapsedGroups state
if 'const [collapsedGroups, setCollapsedGroups] = useState({});' not in content:
    content = content.replace(
        "const commandInputRef = useRef(null);",
        "const commandInputRef = useRef(null);\n  const [collapsedGroups, setCollapsedGroups] = useState({});\n\n  const toggleGroup = (groupName) => {\n    if (!groupName) return;\n    setCollapsedGroups(prev => ({\n      ...prev,\n      [groupName]: !prev[groupName]\n    }));\n  };"
    )

# Modify nav rendering to be collapsible
# Replace the visibleGroups.map block
old_nav_block = """          {visibleGroups.map((group, idx) => (
            <div key={idx} className="mb-6">
              {group.group && (
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: groupColors[group.group] || '#94a3b8' }}>
                  <div className="w-4 h-px opacity-50" style={{ background: groupColors[group.group] || '#94a3b8' }} />
                  {group.group}
                </div>
              )}
              <div className="space-y-1 mt-2">
              {group.items.map((item) => {"""

new_nav_block = """          {visibleGroups.map((group, idx) => {
            const isCollapsed = group.group ? collapsedGroups[group.group] : false;
            return (
            <div key={idx} className="mb-4">
              {group.group && (
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-between hover:bg-slate-800/50 rounded-md transition-colors cursor-pointer border-none bg-transparent"
                  style={{ color: groupColors[group.group] || '#94a3b8' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-px opacity-50" style={{ background: groupColors[group.group] || '#94a3b8' }} />
                    {group.group}
                  </div>
                  <ChevronRight size={12} className={`transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`} />
                </button>
              )}
              <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100 mt-1'}`}>
              {group.items.map((item) => {"""

content = content.replace(old_nav_block, new_nav_block)

# Fix the closing of the visibleGroups.map block
old_nav_close = """              })}
              </div>
            </div>
          ))}"""

new_nav_close = """              })}
              </div>
            </div>
          )})}"""

content = content.replace(old_nav_close, new_nav_close)

# Hide t-code by default
old_tcode = """<span className={`text-[10px] font-mono px-1.5 py-0.5 rounded tracking-wider shrink-0 ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}`}>"""
new_tcode = """<span className={`text-[10px] font-mono px-1.5 py-0.5 rounded tracking-wider shrink-0 transition-opacity duration-200 ${isActive ? 'opacity-100 bg-indigo-500/20 text-indigo-300' : 'opacity-0 group-hover:opacity-100 bg-slate-800 text-slate-500 group-hover:bg-slate-700'}`}>"""
content = content.replace(old_tcode, new_tcode)

with open('frontend/src/components/Sidebar.js', 'w') as f:
    f.write(content)
