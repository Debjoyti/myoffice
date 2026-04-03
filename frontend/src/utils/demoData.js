// Comprehensive Demo Data for PRSK Enterprise AI
export const MOCK_DASHBOARD_STATS = {
    total_employees: 25,
    active_employees: 20,
    total_projects: 6,
    pending_leaves: 3,
    total_leads: 12,
    total_expenses: 450000.0,
    total_invoices: 15,
    total_tickets: 5,
    total_timesheet_hours: 120.5,
    burn_rate: 15000.0,
    projected_revenue: 850000.0,
    hiring_progress: 65.0
};

export const MOCK_INSIGHTS = [
    { id: '1', type: 'warning', title: 'Churn Risk Detected', message: '3 high-performing engineers in Engineering Dept have upcoming notice period endings. Consider retention talks.', impact: 'high' },
    { id: '2', type: 'opportunity', title: 'Revenue Surge Potential', message: 'CRM Pipeline shows 5 deals in "Negotiation" phase with expected value > ₹20L. High closing probability.', impact: 'medium' },
    { id: '3', type: 'kpi', title: 'Expense Optimization', message: 'Travel expenses have increased by 22% this quarter. AI suggests shifting to virtual internal audits.', impact: 'low' }
];

export const MOCK_ANNOUNCEMENTS = [
    { id: '1', title: 'Q2 Performance Reviews Starting', content: 'Managers will coordinate with teams to begin the appraisal cycle next week.', author_name: 'HR Central', priority: 'high', created_at: new Date().toISOString() },
    { id: '2', title: 'Office Security Patch Update', content: 'IT will be patching all workstations this Sunday. Please save your work.', author_name: 'IT Dept', priority: 'normal', created_at: new Date().toISOString() }
];

export const MOCK_EMPLOYEES = [
    { id: '1', name: 'Rahul Sharma', email: 'rahul.sharma@prsk.ai', department: 'Engineering', designation: 'Senior Architect', status: 'active', phone: '+91 9876543210' },
    { id: '2', name: 'Priya Patel', email: 'priya.patel@prsk.ai', department: 'Product', designation: 'Product Manager', status: 'active', phone: '+91 9876543211' }
];

export const MOCK_FINANCE = {
    summary: { total_revenue: 852000, total_expense: 425000, net_profit: 427000, bank_balance: 154000, company: { name: 'PRSK Enterprise' } },
    invoices: [
        { id: '1', invoice_number: 'PRSK-INV-001', customer_id: 'c1', total_amount: 45000, status: 'paid', created_at: '2024-03-28', due_date: '2024-04-28' },
        { id: '2', invoice_number: 'PRSK-INV-002', customer_id: 'c2', total_amount: 15000, status: 'overdue', created_at: '2024-04-01', due_date: '2024-04-10' }
    ],
    customers: [{ id: 'c1', name: 'Global Tech' }, { id: 'c2', name: 'Vertex Labs' }],
    accounts: [
        { id: 'a1', code: '1001', name: 'Cash On Hand', type: 'Asset', current_balance: 15000 },
        { id: 'a2', code: '2001', name: 'Operating Revenue', type: 'Revenue', current_balance: 450000 }
    ],
    banks: [{ id: 'b1', bank_name: 'HDFC Bank', account_name: 'Main Business Account', account_number: 'xxxx-8822', balance: 154000 }],
    pnl: { total_revenue: 852000, total_expense: 425000, net_profit: 427000 },
    bs: { total_assets: 950000, total_liabilities: 120000 }
};

export const MOCK_PROJECTS = [
    { id: '1', name: 'Project Pegasus', description: 'Enterprise AI Implementation', status: 'active', start_date: '2024-01-01', created_at: new Date().toISOString() },
    { id: '2', name: 'Phoenix Redesign', description: 'Cloud infrastructure optimization', status: 'active', start_date: '2024-02-15', created_at: new Date().toISOString() }
];

export const MOCK_CRM = {
    leads: [{ id: '1', name: 'Vijay Kumar', company: 'Infinite Soft', status: 'qualified', created_at: new Date().toISOString() }],
    deals: [{ id: '1', title: 'Vertex Global - Enterprise License', value: 250000, stage: 'negotiation', created_at: new Date().toISOString() }]
};

export const MOCK_INVENTORY = [
    { id: '1', name: 'MacBook Pro 14"', category: 'Hardware', quantity: 5, unit: 'pcs', price_per_unit: 145000, location: 'Warehouse A' },
    { id: '2', name: 'A4 Paper Bundle', category: 'Supplies', quantity: 45, unit: 'bundle', price_per_unit: 450, location: 'Warehouse B' }
];

export const MOCK_TICKETS = [
    { id: '1', subject: 'System Login Issue', status: 'open', priority: 'high', author_name: 'Rahul S', created_at: new Date().toISOString() },
    { id: '2', subject: 'VPN Access Request', status: 'closed', priority: 'medium', author_name: 'Anjali V', created_at: new Date().toISOString() }
];

export const MOCK_HR = {
    leaves: [{ id: '1', employee_name: 'Rahul Sharma', leave_type: 'Medical', status: 'approved', from_date: '2024-04-10', to_date: '2024-04-12' }],
    resignations: [{ id: '1', employee_name: 'Amit Singh', last_working_day: '2024-05-15', status: 'approved' }],
    pip: [{ id: '1', employee_name: 'Sanjay V', status: 'active', goals: 'Complete 3 PRs weekly' }]
};
