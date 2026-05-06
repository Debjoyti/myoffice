import re

with open('frontend/src/components/Sidebar.js', 'r') as f:
    content = f.read()

new_categories = """  const categorizedMenuItems = [
    {
      group: null,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/', tcode: 'S000', desc: 'Home base' },
      ]
    },
    {
      group: 'Home',
      items: [
        { id: 'feed', label: 'Office Feed', icon: Rss, path: '/feed', tcode: 'ZFEED', desc: 'Announcements' },
      ]
    },
    {
      group: 'People',
      items: [
        { id: 'hrms', label: 'HR People Hub', icon: Users, path: '/hrms', tcode: 'PA40', desc: 'Human resources' },
        { id: 'team', label: 'Team Members', icon: UserPlus, path: '/team', tcode: 'SU01', desc: 'User management' },
      ]
    },
    {
      group: 'Payroll',
      items: [
        { id: 'salary-details', label: 'Salary Details', icon: Receipt, path: '/salary-details', tcode: 'SAL1', desc: 'My compensation' },
        { id: 'expenses', label: 'Reimbursements', icon: TrendingUp, path: '/expenses', tcode: 'FB60', desc: 'Expense tracker' },
      ]
    },
    {
      group: 'Recruitment',
      items: [
        { id: 'careers', label: 'Careers Page', icon: Briefcase, path: '/careers', tcode: 'CARE', desc: 'Careers portal' },
        { id: 'recruitment', label: 'ATS & Hiring', icon: Users, path: '/recruitment', tcode: 'REC1', desc: 'Hiring dashboard' },
      ]
    },
    {
      group: 'Operations',
      items: [
        { id: 'projects', label: 'Projects', icon: FolderKanban, path: '/projects', tcode: 'CJ20N', desc: 'Track projects' },
        { id: 'timesheets', label: 'Timesheets', icon: Clock, path: '/timesheets', tcode: 'CAT2', desc: 'Time tracking' },
        { id: 'crm', label: 'CRM', icon: Briefcase, path: '/crm', tcode: 'VA01', desc: 'Leads & deals' },
        { id: 'finance', label: 'Finance & Books', icon: Receipt, path: '/finance', tcode: 'VF01', desc: 'Invoices & billing' },
        { id: 'business-orders', label: 'Business Orders', icon: Package, path: '/business-orders', tcode: 'ME51N', desc: 'Purchase orders' },
        { id: 'assets', label: 'Asset Management', icon: Box, path: '/assets', tcode: 'AA01', desc: 'Fixed assets' },
        { id: 'travel', label: 'Travel Tracker', icon: MapPin, path: '/travel', tcode: 'TRV1', desc: 'GPS trip tracker' },
        { id: 'support-desk', label: 'Support Desk', icon: MessageSquare, path: '/support-desk', tcode: 'SO11', desc: 'Help tickets' },
      ]
    },
    {
      group: 'Administration',
      items: [
        ...(user?.role === 'superadmin' ? [{ id: 'saas-admin', label: 'SAAS Admin', icon: Shield, path: '/saas-admin', tcode: 'SU01', desc: 'Platform admin' }] : []),
        ...(user?.role === 'admin' ? [{ id: 'subscription', label: 'Subscription', icon: Receipt, path: '/subscription', tcode: 'SUB1', desc: 'Billing plan' }] : []),
        { id: 'audit', label: 'Audit Logs', icon: ShieldCheck, path: '/audit', tcode: 'SM20', desc: 'Activity trail' },
        ...(user?.role === 'admin' ? [{ id: 'company-onboarding', label: 'Company Setup', icon: Building2, path: '/company-onboarding', tcode: 'COMP', desc: 'Company profile' }] : []),
      ]
    },
    {
      group: 'Settings',
      items: [
        { id: 'settings', label: 'Platform Settings', icon: Settings, path: '/settings', tcode: 'SPRO', desc: 'Preferences' },
        { id: 'kb', label: 'Knowledge Base', icon: Book, path: '/kb', tcode: 'DB02', desc: 'Docs & SOPs' },
        { id: 'iatf-hub', label: 'IATF Hub', icon: ShieldCheck, path: '/iatf-hub', tcode: 'IATF', desc: 'L&D & Compliance' },
      ]
    }
  ];"""

content = re.sub(r'const categorizedMenuItems = \[\s*\{.*?\];\n', new_categories + '\n', content, flags=re.DOTALL)

with open('frontend/src/components/Sidebar.js', 'w') as f:
    f.write(content)
