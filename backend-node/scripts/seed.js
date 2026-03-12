import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../lib/auth.js';

const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'myoffice';

const firstNames = [
  'Rahul', 'Priya', 'Amit', 'Sneha', 'Vijay', 'Anjali', 'Rajesh', 'Pooja', 'Sanjay', 'Neha',
  'Arun', 'Kavita', 'Suresh', 'Deepika', 'Manoj', 'Ria', 'Karan', 'Simran', 'Ravi', 'Meera',
  'Vishal', 'Divya', 'Arjun', 'Shreya', 'Nikhil', 'Ananya', 'Rohan', 'Sakshi', 'Akash', 'Nisha',
];
const lastNames = [
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Verma', 'Reddy', 'Shah', 'Joshi', 'Mehta',
  'Desai', 'Iyer', 'Nair', 'Rao', 'Agarwal', 'Chopra', 'Malhotra', 'Kapoor', 'Bhatia', 'Sinha',
];
const departments = [
  'Engineering', 'Product', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations',
  'Customer Support', 'Quality Assurance', 'Business Development',
];
const designations = [
  'Software Engineer', 'Senior Software Engineer', 'Team Lead', 'Manager',
  'Product Manager', 'Sales Executive', 'Marketing Specialist', 'HR Executive',
  'Accountant', 'Operations Executive', 'Support Engineer', 'QA Engineer', 'Business Analyst',
];
const cities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  'Jaipur', 'Surat', 'Lucknow', 'Nagpur', 'Indore', 'Bhopal', 'Vadodara',
];
const storeNames = ['Main Warehouse', 'Branch Office', 'Regional Hub', 'Distribution Center', 'Corporate Office'];
const projectNames = [
  'Website Redesign', 'Mobile App', 'CRM Implementation', 'Data Migration', 'Cloud Infrastructure',
  'AI Chatbot', 'Analytics Dashboard', 'Payment Gateway', 'Inventory System', 'Customer Portal',
];
const companies = ['Tech Corp', 'Global Industries', 'Future Solutions', 'Prime Enterprises', 'Smart Systems'];
const sources = ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Email Campaign'];
const itemCatalog = [
  { name: 'HP LaserJet Printer', unit: 'piece', unit_price: 18500 },
  { name: 'Office Chair (Ergonomic)', unit: 'piece', unit_price: 7200 },
  { name: 'A4 Paper Ream (500 sheets)', unit: 'ream', unit_price: 320 },
  { name: 'Laptop Dell Inspiron 15', unit: 'piece', unit_price: 62000 },
  { name: 'Toner Cartridge (Black)', unit: 'piece', unit_price: 2400 },
  { name: 'USB Hub 7-Port', unit: 'piece', unit_price: 950 },
  { name: 'Wireless Mouse + Keyboard Combo', unit: 'set', unit_price: 1850 },
  { name: 'Tea/Coffee Kit', unit: 'box', unit_price: 1200 },
  { name: 'Hand Sanitizer (500ml)', unit: 'bottle', unit_price: 180 },
  { name: 'Webcam HD 1080p', unit: 'piece', unit_price: 2900 },
];
const suppliers = [
  { name: 'Ratan Electronics Pvt Ltd', contact: '+91 98200 11234' },
  { name: 'Sharma Office Supplies Co.', contact: '+91 99300 56789' },
  { name: 'TechMart India Ltd', contact: '+91 97600 88866' },
  { name: 'Global Office Traders', contact: '+91 98100 22233' },
];
const reasons = [
  'Monthly office supplies replenishment',
  'New employee onboarding kit',
  'Pantry restocking for Q1',
  'IT equipment upgrade for dev team',
  'Quarterly stationery procurement',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pad = (n) => String(n).padStart(2, '0');

async function seed() {
  const client = await MongoClient.connect(uri);
  const db = client.db(dbName);
  const now = new Date().toISOString();

  const clearCollections = [
    'users', 'employees', 'stores', 'attendance', 'projects', 'tasks',
    'leads', 'deals', 'expenses', 'leave_requests', 'inventory',
    'purchase_requests', 'purchase_orders', 'hr_fields',
  ];
  for (const c of clearCollections) {
    await db.collection(c).deleteMany({});
  }
  console.log('🗑️  Cleared existing data');

  const adminOrgId = uuidv4();
  const superadminOrgId = uuidv4();
  const clientOrgId = uuidv4();

  // 1. Demo users (superadmin, admin, client)
  await db.collection('users').insertMany([
    {
      id: uuidv4(), email: 'superadmin@demo.com', name: 'Demo SuperAdmin', role: 'superadmin',
      organization_id: superadminOrgId, password: hashPassword('password123'),
      email_verified: true, subscription_status: 'active', created_at: now,
    },
    {
      id: uuidv4(), email: 'admin@demo.com', name: 'Demo Admin', role: 'admin',
      organization_id: adminOrgId, password: hashPassword('demo123'),
      email_verified: true, subscription_status: 'trial', created_at: now,
    },
    {
      id: uuidv4(), email: 'client@demo.com', name: 'Demo Client', role: 'admin',
      organization_id: clientOrgId, password: hashPassword('password123'),
      email_verified: true, subscription_status: 'active',
      subscription_limits: { max_employees: 10, max_projects: 5 }, created_at: now,
    },
  ]);
  console.log('✅ Users: superadmin@demo.com/password123, admin@demo.com/demo123, client@demo.com/password123');

  // 2. Employees (100 for admin org)
  const employees = [];
  for (let i = 0; i < 100; i++) {
    const f = pick(firstNames), l = pick(lastNames);
    const daysAgo = rand(0, 1825);
    const joinDate = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
    employees.push({
      id: uuidv4(), organization_id: adminOrgId,
      name: `${f} ${l}`, email: `${f.toLowerCase()}.${l.toLowerCase()}${i}@company.com`,
      phone: `+91 ${rand(70000, 99999)} ${rand(10000, 99999)}`,
      department: pick(departments), designation: pick(designations),
      date_of_joining: joinDate, pan_number: `ABCDE${rand(1000, 9999)}F`,
      aadhaar_number: `${rand(1000, 9999)} ${rand(1000, 9999)} ${rand(1000, 9999)}`,
      address: `${rand(1, 999)}, Sector ${rand(1, 50)}, ${pick(cities)}, Maharashtra`,
      status: 'active', created_at: now,
    });
  }
  await db.collection('employees').insertMany(employees);
  const empIds = employees.map((e) => e.id);
  console.log('✅ 100 employees');

  // 3. Stores
  const stores = [];
  for (let i = 0; i < 10; i++) {
    const s = {
      id: uuidv4(), organization_id: adminOrgId,
      name: `${pick(storeNames)} ${i + 1}`,
      location: `${pick(cities)}, ${pick(['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu'])}`,
      manager: `${pick(firstNames)} ${pick(lastNames)}`,
      contact: `+91 ${rand(70000, 99999)} ${rand(10000, 99999)}`,
      status: 'active', created_at: now,
    };
    stores.push(s);
  }
  await db.collection('stores').insertMany(stores);
  const storeIds = stores.map((s) => s.id);
  console.log('✅ 10 stores');

  // 4. Attendance (30 days for 50 employees)
  const attendance = [];
  for (let d = 0; d < 30; d++) {
    const date = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    for (let e = 0; e < 50; e++) {
      const st = pick(['present', 'present', 'present', 'absent', 'half-day']);
      attendance.push({
        id: uuidv4(), organization_id: adminOrgId, employee_id: empIds[e],
        date, status: st,
        check_in: st !== 'absent' ? `${rand(8, 10)}:${pad(rand(0, 59))}` : null,
        check_out: st !== 'absent' ? `${rand(17, 19)}:${pad(rand(0, 59))}` : null,
        created_at: now,
      });
    }
  }
  await db.collection('attendance').insertMany(attendance);
  console.log('✅ ~1500 attendance logs');

  // 5. Projects
  const projects = [];
  for (let i = 0; i < 20; i++) {
    const daysAgo = rand(0, 180);
    const startDate = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
    const endDate = new Date(Date.now() + rand(30, 180) * 86400000).toISOString().slice(0, 10);
    projects.push({
      id: uuidv4(), organization_id: adminOrgId,
      name: `${pick(projectNames)} ${i + 1}`,
      description: 'Strategic project for business growth and digital transformation',
      status: pick(['active', 'completed']), start_date: startDate, end_date: endDate,
      created_at: now,
    });
  }
  await db.collection('projects').insertMany(projects);
  const projectIds = projects.map((p) => p.id);
  console.log('✅ 20 projects');

  // 6. Tasks
  const tasks = [];
  for (let i = 0; i < 30; i++) {
    tasks.push({
      id: uuidv4(), organization_id: adminOrgId, project_id: pick(projectIds),
      title: `Task ${i + 1}`, description: 'Task description',
      status: pick(['todo', 'in_progress', 'done']), priority: pick(['low', 'medium', 'high']),
      assigned_to: pick(empIds), created_at: now,
    });
  }
  await db.collection('tasks').insertMany(tasks);
  console.log('✅ 30 tasks');

  // 7. Leads
  const leads = [];
  for (let i = 0; i < 50; i++) {
    leads.push({
      id: uuidv4(), organization_id: adminOrgId,
      name: `${pick(companies)} Ltd`, email: `contact${i}@${pick(['tech', 'business', 'sales'])}.com`,
      phone: `+91 ${rand(70000, 99999)} ${rand(10000, 99999)}`,
      company: `${pick(companies)} ${i + 1}`, source: pick(sources),
      status: pick(['new', 'contacted', 'qualified']), created_at: now,
    });
  }
  await db.collection('leads').insertMany(leads);
  const leadIds = leads.map((l) => l.id);
  console.log('✅ 50 leads');

  // 8. Deals
  const deals = [];
  for (let i = 0; i < 20; i++) {
    deals.push({
      id: uuidv4(), organization_id: adminOrgId, lead_id: pick(leadIds),
      title: `Deal ${i + 1}`, value: rand(50000, 500000),
      stage: pick(['proposal', 'negotiation', 'won', 'lost']),
      probability: rand(20, 90),
      expected_close_date: new Date(Date.now() + rand(7, 90) * 86400000).toISOString().slice(0, 10),
      created_at: now,
    });
  }
  await db.collection('deals').insertMany(deals);
  console.log('✅ 20 deals');

  // 9. Expenses
  const expenses = [];
  for (let i = 0; i < 100; i++) {
    const daysAgo = rand(0, 90);
    expenses.push({
      id: uuidv4(), organization_id: adminOrgId, employee_id: pick(empIds.slice(0, 50)),
      category: pick(['travel', 'meals', 'supplies', 'software', 'marketing', 'other']),
      amount: rand(500, 50000), description: `Business expense`,
      date: new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10),
      status: pick(['pending', 'approved', 'rejected']), created_at: now,
    });
  }
  await db.collection('expenses').insertMany(expenses);
  console.log('✅ 100 expenses');

  // 10. Leave requests
  const leaveTypes = ['sick', 'casual', 'annual', 'unpaid'];
  const leaveReqs = [];
  for (let i = 0; i < 25; i++) {
    const from = new Date(Date.now() - rand(0, 60) * 86400000);
    const to = new Date(from.getTime() + rand(1, 5) * 86400000);
    leaveReqs.push({
      id: uuidv4(), organization_id: adminOrgId, employee_id: pick(empIds),
      leave_type: pick(leaveTypes), from_date: from.toISOString().slice(0, 10),
      to_date: to.toISOString().slice(0, 10), reason: 'Personal / medical',
      status: pick(['pending', 'approved', 'rejected']), created_at: now,
    });
  }
  await db.collection('leave_requests').insertMany(leaveReqs);
  console.log('✅ 25 leave requests');

  // 11. Inventory
  const inventory = [];
  for (let i = 0; i < itemCatalog.length; i++) {
    const it = itemCatalog[i];
    inventory.push({
      id: uuidv4(), organization_id: adminOrgId,
      name: it.name, category: pick(['electronics', 'furniture', 'stationery', 'consumables']),
      quantity: rand(10, 200), unit: it.unit, price_per_unit: it.unit_price,
      location: pick(storeNames), created_at: now,
    });
  }
  await db.collection('inventory').insertMany(inventory);
  console.log('✅ Inventory items');

  // 12. Purchase requests
  const requestors = employees.slice(0, 8).map((e) => e.name);
  const prs = [];
  for (let i = 0; i < 15; i++) {
    const chosen = itemCatalog.slice(0, rand(2, 5)).map((it) => {
      const qty = rand(1, 10);
      const subtotal = qty * it.unit_price;
      return { name: it.name, quantity: qty, unit: it.unit, unit_price: it.unit_price, subtotal };
    });
    const total = chosen.reduce((s, c) => s + c.subtotal, 0);
    prs.push({
      id: uuidv4(), organization_id: adminOrgId, store_id: pick(storeIds),
      requested_by: pick(requestors), items: chosen, total_amount: total,
      reason: pick(reasons), status: pick(['pending', 'pending', 'approved', 'approved', 'rejected']),
      created_at: now,
    });
  }
  await db.collection('purchase_requests').insertMany(prs);
  console.log('✅ 15 purchase requests');

  // 13. Purchase orders
  const approvedPrs = prs.filter((p) => p.status === 'approved');
  const prsForPo = approvedPrs.length ? approvedPrs : prs;
  for (let i = 0; i < 10; i++) {
    const pr = pick(prsForPo);
    const supplier = pick(suppliers);
    await db.collection('purchase_orders').insertOne({
      id: uuidv4(), organization_id: adminOrgId,
      purchase_request_id: pr.id, store_id: pr.store_id,
      supplier_name: supplier.name, supplier_contact: supplier.contact,
      items: pr.items, total_amount: pr.total_amount,
      delivery_date: new Date(Date.now() + rand(3, 21) * 86400000).toISOString().slice(0, 10),
      status: pick(['pending', 'confirmed', 'delivered']),
      created_by: pick(requestors), created_at: now,
    });
  }
  console.log('✅ 10 purchase orders');

  // 14. HR fields (sample)
  const hrFields = [
    { field_name: 'Blood Group', field_type: 'text', is_required: false, options: null, applies_to: 'employee' },
    { field_name: 'Emergency Contact', field_type: 'text', is_required: true, options: null, applies_to: 'employee' },
    { field_name: 'Marital Status', field_type: 'select', is_required: false, options: ['Single', 'Married', 'Divorced'], applies_to: 'employee' },
  ];
  for (const f of hrFields) {
    await db.collection('hr_fields').insertOne({
      id: uuidv4(), organization_id: adminOrgId, ...f, created_at: now,
    });
  }
  console.log('✅ 3 HR fields');

  console.log('\n✨ Full sample data seeded!');
  console.log('   Login: superadmin@demo.com / password123  (SAAS Admin)');
  console.log('   Login: admin@demo.com / demo123          (full demo data)');
  console.log('   Login: client@demo.com / password123     (client)');
  await client.close();
}

seed().catch(console.error);
