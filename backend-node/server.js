import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { connectDB } from './lib/db.js';
import { hashPassword, verifyPassword, createToken, verifyToken } from './lib/auth.js';

let db;
const app = express();

app.use(async (req, res, next) => {
  if (!db) db = await connectDB();
  next();
});

app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

let db;

const authMiddleware = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Invalid authentication' });
  }
  const token = auth.slice(7);
  const userId = verifyToken(token);
  if (!userId) return res.status(401).json({ detail: 'Invalid authentication' });
  const user = await db.collection('users').findOne({ id: userId }, { projection: { _id: 0, password: 0 } });
  if (!user) return res.status(401).json({ detail: 'User not found' });
  req.user = user;
  next();
};

const orgFilter = (user) => {
  const orgId = user?.organization_id;
  return orgId ? { organization_id: orgId } : {};
};

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Auth
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const existing = await db.collection('users').findOne({ email });
    if (existing) return res.status(400).json({ detail: 'Email already registered' });
    const userId = uuidv4();
    const orgId = uuidv4();
    const verificationToken = uuidv4();
    const now = new Date().toISOString();
    const userDoc = {
      id: userId, email, name, role: 'admin', organization_id: orgId,
      password: hashPassword(password), email_verified: false, verification_token: verificationToken,
      subscription_status: 'trial', created_at: now,
    };
    await db.collection('users').insertOne(userDoc);
    await db.collection('analytics').insertOne({
      id: uuidv4(), user_id: userId, event_type: 'user_registered',
      event_data: { email, role: 'admin' }, page: 'registration', timestamp: now,
    });
    delete userDoc.password;
    delete userDoc.verification_token;
    const access_token = createToken(userId);
    res.json({ access_token, token_type: 'bearer', user: userDoc });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.collection('users').findOne({ email });
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }
    delete user.password;
    const access_token = createToken(user.id);
    res.json({ access_token, token_type: 'bearer', user });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => res.json(req.user));

app.post('/api/auth/verify-email', async (req, res) => {
  const token = req.body?.token || req.query?.token;
  const result = await db.collection('users').updateOne(
    { verification_token: token },
    { $set: { email_verified: true }, $unset: { verification_token: '' } }
  );
  if (result.matchedCount === 0) return res.status(404).json({ detail: 'Invalid verification token' });
  res.json({ message: 'Email verified successfully' });
});

// Dashboard
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const org = orgFilter(req.user);
    const [total_employees, active_employees] = await Promise.all([
      db.collection('employees').countDocuments(org),
      db.collection('employees').countDocuments({ ...org, status: 'active' }),
    ]);
    const [total_projects, pending_leaves, total_leads, pending_purchase_requests, total_stores] = await Promise.all([
      db.collection('projects').countDocuments(org),
      db.collection('leave_requests').countDocuments({ ...org, status: 'pending' }),
      db.collection('leads').countDocuments(org),
      db.collection('purchase_requests').countDocuments({ ...org, status: 'pending' }),
      db.collection('stores').countDocuments(org),
    ]);
    const expenses = await db.collection('expenses').find(org, { projection: { amount: 1 } }).toArray();
    const total_expenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    res.json({
      total_employees, active_employees, total_projects, pending_leaves,
      total_leads, total_expenses, pending_purchase_requests, total_stores,
    });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// Employees
app.post('/api/employees', authMiddleware, async (req, res) => {
  const doc = { ...req.body, id: uuidv4(), status: 'active', organization_id: req.user.organization_id, created_at: new Date().toISOString() };
  await db.collection('employees').insertOne(doc);
  res.json(doc);
});
app.get('/api/employees', authMiddleware, async (req, res) => {
  const list = await db.collection('employees').find(orgFilter(req.user)).project({ _id: 0 }).toArray();
  res.json(list);
});
app.get('/api/employees/:id', authMiddleware, async (req, res) => {
  const doc = await db.collection('employees').findOne({ id: req.params.id }, { projection: { _id: 0 } });
  if (!doc) return res.status(404).json({ detail: 'Employee not found' });
  res.json(doc);
});
app.put('/api/employees/:id', authMiddleware, async (req, res) => {
  const { id, organization_id, status, created_at, ...rest } = req.body;
  const r = await db.collection('employees').updateOne({ id: req.params.id }, { $set: rest });
  if (!r.matchedCount) return res.status(404).json({ detail: 'Employee not found' });
  const doc = await db.collection('employees').findOne({ id: req.params.id }, { projection: { _id: 0 } });
  res.json(doc);
});
app.delete('/api/employees/:id', authMiddleware, async (req, res) => {
  const r = await db.collection('employees').deleteOne({ id: req.params.id });
  if (!r.deletedCount) return res.status(404).json({ detail: 'Employee not found' });
  res.json({ message: 'Employee deleted' });
});

// Attendance
app.post('/api/attendance', authMiddleware, async (req, res) => {
  const doc = { ...req.body, id: uuidv4(), organization_id: req.user.organization_id, created_at: new Date().toISOString() };
  await db.collection('attendance').insertOne(doc);
  res.json(doc);
});
app.get('/api/attendance', authMiddleware, async (req, res) => {
  const q = req.query.employee_id ? { employee_id: req.query.employee_id } : orgFilter(req.user);
  const list = await db.collection('attendance').find(q).project({ _id: 0 }).toArray();
  res.json(list);
});

// Leave requests
app.post('/api/leave-requests', authMiddleware, async (req, res) => {
  const doc = { ...req.body, id: uuidv4(), status: 'pending', organization_id: req.user.organization_id, created_at: new Date().toISOString() };
  await db.collection('leave_requests').insertOne(doc);
  res.json(doc);
});
app.get('/api/leave-requests', authMiddleware, async (req, res) => {
  const list = await db.collection('leave_requests').find(orgFilter(req.user)).project({ _id: 0 }).toArray();
  res.json(list);
});
app.patch('/api/leave-requests/:id/status', authMiddleware, async (req, res) => {
  const r = await db.collection('leave_requests').updateOne({ id: req.params.id }, { $set: { status: req.body.status } });
  if (!r.matchedCount) return res.status(404).json({ detail: 'Leave request not found' });
  res.json({ message: 'Status updated' });
});

// Projects
app.post('/api/projects', authMiddleware, async (req, res) => {
  const doc = { ...req.body, id: uuidv4(), status: 'active', organization_id: req.user.organization_id, created_at: new Date().toISOString() };
  await db.collection('projects').insertOne(doc);
  res.json(doc);
});
app.get('/api/projects', authMiddleware, async (req, res) => {
  const list = await db.collection('projects').find(orgFilter(req.user)).project({ _id: 0 }).toArray();
  res.json(list);
});

// Tasks
app.post('/api/tasks', authMiddleware, async (req, res) => {
  const doc = { ...req.body, id: uuidv4(), status: 'todo', organization_id: req.user.organization_id, created_at: new Date().toISOString() };
  await db.collection('tasks').insertOne(doc);
  res.json(doc);
});
app.get('/api/tasks', authMiddleware, async (req, res) => {
  const q = req.query.project_id ? { project_id: req.query.project_id } : orgFilter(req.user);
  const list = await db.collection('tasks').find(q).project({ _id: 0 }).toArray();
  res.json(list);
});
app.patch('/api/tasks/:id/status', authMiddleware, async (req, res) => {
  const r = await db.collection('tasks').updateOne({ id: req.params.id }, { $set: { status: req.body.status } });
  if (!r.matchedCount) return res.status(404).json({ detail: 'Task not found' });
  res.json({ message: 'Task status updated' });
});

// Leads & Deals
app.post('/api/leads', authMiddleware, async (req, res) => {
  const doc = { ...req.body, id: uuidv4(), status: 'new', organization_id: req.user.organization_id, created_at: new Date().toISOString() };
  await db.collection('leads').insertOne(doc);
  res.json(doc);
});
app.get('/api/leads', authMiddleware, async (req, res) => {
  const list = await db.collection('leads').find(orgFilter(req.user)).project({ _id: 0 }).toArray();
  res.json(list);
});
app.post('/api/deals', authMiddleware, async (req, res) => {
  const doc = { ...req.body, id: uuidv4(), organization_id: req.user.organization_id, created_at: new Date().toISOString() };
  await db.collection('deals').insertOne(doc);
  res.json(doc);
});
app.get('/api/deals', authMiddleware, async (req, res) => {
  const list = await db.collection('deals').find(orgFilter(req.user)).project({ _id: 0 }).toArray();
  res.json(list);
});

// Expenses
app.post('/api/expenses', authMiddleware, async (req, res) => {
  const doc = { ...req.body, id: uuidv4(), status: 'pending', organization_id: req.user.organization_id, created_at: new Date().toISOString() };
  await db.collection('expenses').insertOne(doc);
  res.json(doc);
});
app.get('/api/expenses', authMiddleware, async (req, res) => {
  const list = await db.collection('expenses').find(orgFilter(req.user)).project({ _id: 0 }).toArray();
  res.json(list);
});

// Inventory
app.post('/api/inventory', authMiddleware, async (req, res) => {
  const doc = { ...req.body, id: uuidv4(), organization_id: req.user.organization_id, created_at: new Date().toISOString() };
  await db.collection('inventory').insertOne(doc);
  res.json(doc);
});
app.get('/api/inventory', authMiddleware, async (req, res) => {
  const list = await db.collection('inventory').find(orgFilter(req.user)).project({ _id: 0 }).toArray();
  res.json(list);
});

// Stores
app.post('/api/stores', authMiddleware, async (req, res) => {
  const doc = { ...req.body, id: uuidv4(), status: 'active', organization_id: req.user.organization_id, created_at: new Date().toISOString() };
  await db.collection('stores').insertOne(doc);
  res.json(doc);
});
app.get('/api/stores', authMiddleware, async (req, res) => {
  const list = await db.collection('stores').find(orgFilter(req.user)).project({ _id: 0 }).toArray();
  res.json(list);
});
app.get('/api/stores/:id', authMiddleware, async (req, res) => {
  const doc = await db.collection('stores').findOne({ id: req.params.id }, { projection: { _id: 0 } });
  if (!doc) return res.status(404).json({ detail: 'Store not found' });
  res.json(doc);
});
app.put('/api/stores/:id', authMiddleware, async (req, res) => {
  const { id, organization_id, status, created_at, ...rest } = req.body;
  const r = await db.collection('stores').updateOne({ id: req.params.id }, { $set: rest });
  if (!r.matchedCount) return res.status(404).json({ detail: 'Store not found' });
  const doc = await db.collection('stores').findOne({ id: req.params.id }, { projection: { _id: 0 } });
  res.json(doc);
});
app.delete('/api/stores/:id', authMiddleware, async (req, res) => {
  const r = await db.collection('stores').deleteOne({ id: req.params.id });
  if (!r.deletedCount) return res.status(404).json({ detail: 'Store not found' });
  res.json({ message: 'Store deleted' });
});

// Purchase requests
app.post('/api/purchase-requests', authMiddleware, async (req, res) => {
  const doc = { ...req.body, id: uuidv4(), status: 'pending', organization_id: req.user.organization_id, created_at: new Date().toISOString() };
  await db.collection('purchase_requests').insertOne(doc);
  res.json(doc);
});
app.get('/api/purchase-requests', authMiddleware, async (req, res) => {
  const list = await db.collection('purchase_requests').find(orgFilter(req.user)).project({ _id: 0 }).toArray();
  res.json(list);
});
app.patch('/api/purchase-requests/:id/approve', authMiddleware, async (req, res) => {
  const now = new Date().toISOString();
  const r = await db.collection('purchase_requests').updateOne(
    { id: req.params.id },
    { $set: { status: 'approved', approved_by: req.user.id, approved_date: now } }
  );
  if (!r.matchedCount) return res.status(404).json({ detail: 'Purchase request not found' });
  res.json({ message: 'Purchase request approved' });
});
app.patch('/api/purchase-requests/:id/reject', authMiddleware, async (req, res) => {
  const now = new Date().toISOString();
  const r = await db.collection('purchase_requests').updateOne(
    { id: req.params.id },
    { $set: { status: 'rejected', approved_by: req.user.id, approved_date: now } }
  );
  if (!r.matchedCount) return res.status(404).json({ detail: 'Purchase request not found' });
  res.json({ message: 'Purchase request rejected' });
});

// Purchase orders
app.post('/api/purchase-orders', authMiddleware, async (req, res) => {
  const doc = { ...req.body, id: uuidv4(), status: 'pending', organization_id: req.user.organization_id, created_at: new Date().toISOString() };
  await db.collection('purchase_orders').insertOne(doc);
  res.json(doc);
});
app.get('/api/purchase-orders', authMiddleware, async (req, res) => {
  const list = await db.collection('purchase_orders').find(orgFilter(req.user)).project({ _id: 0 }).toArray();
  res.json(list);
});
app.patch('/api/purchase-orders/:id/status', authMiddleware, async (req, res) => {
  const r = await db.collection('purchase_orders').updateOne({ id: req.params.id }, { $set: { status: req.body.status } });
  if (!r.matchedCount) return res.status(404).json({ detail: 'Purchase order not found' });
  res.json({ message: 'Purchase order status updated' });
});

// HR fields
app.post('/api/hr-fields', authMiddleware, async (req, res) => {
  const doc = { ...req.body, id: uuidv4(), organization_id: req.user.organization_id, created_at: new Date().toISOString() };
  await db.collection('hr_fields').insertOne(doc);
  res.json(doc);
});
app.get('/api/hr-fields', authMiddleware, async (req, res) => {
  const q = req.query.applies_to ? { applies_to: req.query.applies_to } : orgFilter(req.user);
  const list = await db.collection('hr_fields').find(q).project({ _id: 0 }).toArray();
  res.json(list);
});
app.delete('/api/hr-fields/:id', authMiddleware, async (req, res) => {
  const r = await db.collection('hr_fields').deleteOne({ id: req.params.id });
  if (!r.deletedCount) return res.status(404).json({ detail: 'HR field not found' });
  res.json({ message: 'HR field deleted' });
});

// Team
app.post('/api/team/invite', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ detail: 'Only admins can invite team members' });
  const { email, role = 'employee' } = req.body;
  const existing = await db.collection('users').findOne({ email });
  if (existing) return res.status(400).json({ detail: 'User already exists' });
  const existingInvite = await db.collection('team_invites').findOne({ email, status: 'pending' });
  if (existingInvite) return res.status(400).json({ detail: 'Invitation already sent' });
  const inviteToken = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const inviteDoc = {
    id: uuidv4(), email, invited_by: req.user.id, organization_id: req.user.organization_id,
    role, status: 'pending', token: inviteToken, expires_at: expiresAt, created_at: new Date().toISOString(),
  };
  await db.collection('team_invites').insertOne(inviteDoc);
  await db.collection('analytics').insertOne({
    id: uuidv4(), user_id: req.user.id, event_type: 'team_invite_sent',
    event_data: { invitee_email: email, role }, page: 'team', timestamp: new Date().toISOString(),
  });
  res.json(inviteDoc);
});
app.get('/api/team/invites', authMiddleware, async (req, res) => {
  const list = await db.collection('team_invites')
    .find({ organization_id: req.user.organization_id }).project({ _id: 0 }).toArray();
  res.json(list);
});
app.post('/api/team/accept-invite', async (req, res) => {
  const { token, name, password } = req.body;
  const invite = await db.collection('team_invites').findOne({ token, status: 'pending' });
  if (!invite) return res.status(404).json({ detail: 'Invalid or expired invitation' });
  if (new Date(invite.expires_at) < new Date()) return res.status(400).json({ detail: 'Invitation has expired' });
  const userId = uuidv4();
  const userDoc = {
    id: userId, email: invite.email, password: hashPassword(password), name,
    role: invite.role, organization_id: invite.organization_id, email_verified: true,
    subscription_status: 'active', created_at: new Date().toISOString(),
  };
  await db.collection('users').insertOne(userDoc);
  await db.collection('team_invites').updateOne({ token }, { $set: { status: 'accepted' } });
  await db.collection('analytics').insertOne({
    id: uuidv4(), user_id: userId, event_type: 'invite_accepted',
    event_data: { email: invite.email }, page: 'onboarding', timestamp: new Date().toISOString(),
  });
  delete userDoc.password;
  const access_token = createToken(userId);
  res.json({ access_token, token_type: 'bearer', user: userDoc });
});
app.get('/api/team/members', authMiddleware, async (req, res) => {
  const list = await db.collection('users')
    .find({ organization_id: req.user.organization_id })
    .project({ _id: 0, password: 0, verification_token: 0 }).toArray();
  res.json(list);
});

// Subscriptions
app.post('/api/subscriptions', authMiddleware, async (req, res) => {
  const plans = { starter: 999, professional: 2999, enterprise: 9999 };
  const { plan, billing_cycle = 'monthly' } = req.body;
  if (!plans[plan]) return res.status(400).json({ detail: 'Invalid plan' });
  const endsAt = billing_cycle === 'monthly'
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const subDoc = {
    id: uuidv4(), user_id: req.user.id, organization_id: req.user.organization_id,
    plan, status: 'active', amount: plans[plan], currency: 'INR', billing_cycle,
    starts_at: new Date().toISOString(), ends_at: endsAt, created_at: new Date().toISOString(),
  };
  await db.collection('subscriptions').insertOne(subDoc);
  await db.collection('users').updateOne({ id: req.user.id }, { $set: { subscription_status: 'active' } });
  res.json(subDoc);
});
app.get('/api/subscriptions/plans', (_, res) => {
  res.json({
    plans: [
      { id: 'starter', name: 'Starter', price_monthly: 999, price_yearly: 9999, features: ['Up to 50 employees', 'Basic HR features', 'Email support'] },
      { id: 'professional', name: 'Professional', price_monthly: 2999, price_yearly: 29999, popular: true, features: ['Up to 200 employees', 'All features', 'Priority support'] },
      { id: 'enterprise', name: 'Enterprise', price_monthly: 9999, price_yearly: 99999, features: ['Unlimited employees', 'Custom features', 'Dedicated support'] },
    ],
  });
});
app.get('/api/subscriptions/current', authMiddleware, async (req, res) => {
  const sub = await db.collection('subscriptions')
    .findOne({ user_id: req.user.id, status: 'active' }, { projection: { _id: 0 }, sort: { created_at: -1 } });
  res.json(sub);
});

// Analytics
app.post('/api/analytics/track', authMiddleware, async (req, res) => {
  const doc = {
    id: uuidv4(), user_id: req.user.id, organization_id: req.user.organization_id,
    event_type: req.body.event_type, event_data: req.body.event_data || {},
    page: req.body.page, timestamp: new Date().toISOString(),
  };
  await db.collection('analytics').insertOne(doc);
  res.json({ message: 'Event tracked' });
});
app.get('/api/analytics/funnel', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ detail: 'Admin access required' });
  const pipeline = [
    { $match: { event_type: { $in: ['user_registered', 'email_verified', 'subscription_created', 'team_invite_sent'] } } },
    { $group: { _id: '$event_type', count: { $sum: 1 } } },
  ];
  const results = await db.collection('analytics').aggregate(pipeline).toArray();
  const funnel = Object.fromEntries(results.map(r => [r._id, r.count]));
  const reg = funnel.user_registered || 0;
  res.json({
    registrations: reg,
    verifications: funnel.email_verified || 0,
    subscriptions: funnel.subscription_created || 0,
    invites_sent: funnel.team_invite_sent || 0,
    conversion_rate: reg ? Math.round((funnel.subscription_created || 0) / reg * 100 * 100) / 100 : 0,
  });
});

// Offer letters
app.post('/api/offer-letters', authMiddleware, async (req, res) => {
  const data = req.body;
  const id = `OFFER-${uuidv4().slice(0, 8).toUpperCase()}`;
  const doc = {
    ...data, id, organization_id: req.user.organization_id,
    status: 'Generated', created_at: new Date().toISOString(),
  };
  await db.collection('offer_letters').insertOne(doc);
  res.json(doc);
});
app.get('/api/offer-letters', authMiddleware, async (req, res) => {
  const list = await db.collection('offer_letters').find(orgFilter(req.user)).project({ _id: 0 }).toArray();
  res.json(list);
});
app.delete('/api/offer-letters/:id', authMiddleware, async (req, res) => {
  const r = await db.collection('offer_letters').deleteOne({
    id: req.params.id,
    organization_id: req.user.organization_id,
  });
  if (!r.deletedCount) return res.status(404).json({ detail: 'Offer letter not found' });
  res.json({ message: 'Offer letter deleted' });
});

// SaaS clients (superadmin only)
app.post('/api/saas/clients', authMiddleware, async (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ detail: 'Superadmin access required' });
  const { name, email, password, max_employees, max_projects } = req.body;
  const existing = await db.collection('users').findOne({ email });
  if (existing) return res.status(400).json({ detail: 'Email already registered' });
  const userId = uuidv4();
  const orgId = uuidv4();
  const limits = {};
  if (max_employees != null) limits.max_employees = max_employees;
  if (max_projects != null) limits.max_projects = max_projects;
  const userDoc = {
    id: userId, email, name, role: 'admin', organization_id: orgId,
    password: hashPassword(password), email_verified: true, subscription_status: 'active',
    subscription_limits: limits, created_at: new Date().toISOString(),
  };
  await db.collection('users').insertOne(userDoc);
  delete userDoc.password;
  res.json({ message: 'Client created successfully', client: userDoc });
});
app.get('/api/saas/clients', authMiddleware, async (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ detail: 'Superadmin access required' });
  const clients = await db.collection('users').find({ role: 'admin' }).project({ _id: 0, password: 0 }).toArray();
  for (const c of clients) {
    const orgId = c.organization_id;
    if (orgId) {
      c.usage = {
        employees: await db.collection('employees').countDocuments({ organization_id: orgId }),
        projects: await db.collection('projects').countDocuments({ organization_id: orgId }),
      };
    }
  }
  res.json(clients);
});
app.put('/api/saas/clients/:id/limits', authMiddleware, async (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ detail: 'Superadmin access required' });
  const client = await db.collection('users').findOne({ id: req.params.id });
  if (!client) return res.status(404).json({ detail: 'Client not found' });
  const { max_employees, max_projects } = req.body;
  const limits = client.subscription_limits || {};
  if (max_employees != null) limits.max_employees = max_employees;
  if (max_projects != null) limits.max_projects = max_projects;
  await db.collection('users').updateOne({ id: req.params.id }, { $set: { subscription_limits: limits } });
  res.json({ message: 'Limits updated', limits });
});

async function start() {
  db = await connectDB();
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`API running on port ${port}`));
}

if (!process.env.VERCEL) {
  start().catch(console.error);
}

export default app;
