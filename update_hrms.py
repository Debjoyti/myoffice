import re

with open('frontend/src/pages/HRMS.js', 'r') as f:
    content = f.read()

# Simplify tabs
old_tabs = """                    {[
                        { id: 'dashboard', label: 'Overview' },
                        { id: 'employees', label: 'Directory' },
                        { id: 'payroll', label: '⚙ Payroll' },
                        { id: 'attendance', label: 'Attendance' },
                        { id: 'leave', label: 'Leaves' },
                        { id: 'wfh', label: 'Remote' },
                        { id: 'recruitment', label: 'ATS' },
                        { id: 'offer-letters', label: 'Offers' },
                        { id: 'posh', label: 'Compliance' },
                        { id: 'resignations', label: 'Exits' },
                        { id: 'pip', label: 'Performance' },
                        { id: 'hr-config', label: 'HR Panel' },
                    ].map(tab => ("""

new_tabs = """                    {[
                        { id: 'dashboard', label: 'Overview' },
                        { id: 'employees', label: 'Directory' },
                        { id: 'attendance', label: 'Attendance' },
                        { id: 'leave', label: 'Leaves' },
                        { id: 'wfh', label: 'Remote' },
                        { id: 'hr-config', label: 'HR Panel' },
                    ].map(tab => ("""
content = content.replace(old_tabs, new_tabs)

old_components = """                    {activeTab === 'employees' && <Employees isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'attendance' && <Attendance isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'leave' && <LeaveManagement isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'wfh' && <WFHRequests isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'recruitment' && <Recruitment isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'offer-letters' && <OfferLetters isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'payroll' && <PayrollEngine isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'hr-config' && <HRConfig isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'posh' && <POSH isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'resignations' && <Resignations isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'pip' && <PIP isSubComponent={true} user={user} onLogout={onLogout} />}"""

new_components = """                    {activeTab === 'employees' && <Employees isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'attendance' && <Attendance isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'leave' && <LeaveManagement isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'wfh' && <WFHRequests isSubComponent={true} user={user} onLogout={onLogout} />}
                    {activeTab === 'hr-config' && <HRConfig isSubComponent={true} user={user} onLogout={onLogout} />}"""
content = content.replace(old_components, new_components)

with open('frontend/src/pages/HRMS.js', 'w') as f:
    f.write(content)
