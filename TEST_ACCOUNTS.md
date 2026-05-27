# PRSK Enterprise Suite — Test Accounts & Demo Login Guide

## Quick Start

### Step 1 — Configure Vercel Environment Variables

Add these to your Vercel project (Settings → Environment Variables):

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-ref>.supabase.co` | From Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | From Supabase API settings |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | From Supabase API settings (keep secret!) |
| `ALLOW_SEED_IN_PROD` | `true` | Remove after seeding |
| `SEED_DEMO_SECRET` | any random string e.g. `my-seed-token-2026` | Protects seed endpoint |

### Step 2 — Run the Database Migration

Apply the latest migration to add the `accountant` role:
```bash
supabase db push
# OR apply manually in Supabase SQL Editor:
# supabase/migrations/20260625000000_add_accountant_role_and_demo_data.sql
```

### Step 3 — Seed Demo Accounts

Call the seed endpoint once (from browser or curl):

```bash
# Replace <your-domain> and <token> with your actual values
curl -X POST "https://<your-domain>/api/v1/admin/seed-demo?token=my-seed-token-2026"
```

Or open in browser:
```
https://<your-domain>/api/v1/admin/seed-demo?token=my-seed-token-2026
```
(Use GET to preview what will be created, POST to actually create.)

### Step 4 — Remove Seed Access

After seeding, remove `ALLOW_SEED_IN_PROD` from Vercel env vars to disable the endpoint.

---

## Test Accounts

All accounts use password: **`Demo@123456`**

### 1. Super Admin / Company Admin

| Field | Value |
|---|---|
| **Email** | `superadmin@prsk.demo` |
| **Password** | `Demo@123456` |
| **Role** | `admin` |
| **Name** | Arjun Sharma |
| **Designation** | Chief Executive Officer |

**What they see:**
- ✅ Full sidebar: All 13 modules
- ✅ Admin Dashboard with company-wide KPIs
- ✅ HRMS — add/edit/deactivate employees, change roles
- ✅ Payroll — run payroll, lock, mark paid
- ✅ All Finance, Procurement, CRM, Analytics modules
- ✅ Settings — edit org config, statutory compliance toggles
- ✅ IATF Compliance hub
- ✅ Run payroll, create departments, manage everyone

---

### 2. HR Admin

| Field | Value |
|---|---|
| **Email** | `hradmin@prsk.demo` |
| **Password** | `Demo@123456` |
| **Role** | `hr` |
| **Name** | Priya Menon |
| **Designation** | HR Manager |

**What they see:**
- ✅ My Home, Dashboard, HRMS, Attendance, Payroll, Salary, Analytics, IATF Hub
- ✅ Can add/manage employees
- ✅ Can run & manage payroll
- ✅ Can approve/reject leave requests
- ✅ Can view all salary structures and payslips
- ❌ No Finance (GL/AR/AP), Procurement, CRM, Settings

---

### 3. Accountant

| Field | Value |
|---|---|
| **Email** | `accountant@prsk.demo` |
| **Password** | `Demo@123456` |
| **Role** | `accountant` |
| **Name** | Rahul Gupta |
| **Designation** | Senior Accountant |

**What they see:**
- ✅ My Home, Finance, Payroll, Salary, Procurement, Analytics
- ✅ Full access to Finance module (invoices, expenses, P&L)
- ✅ View payroll runs and payslips
- ✅ Salary visibility for compliance
- ✅ Procurement module
- ❌ Cannot add/delete employees
- ❌ No HRMS management, Projects, CRM, Support, Settings

---

### 4. Employee (Client User)

| Field | Value |
|---|---|
| **Email** | `employee@prsk.demo` |
| **Password** | `Demo@123456` |
| **Role** | `employee` |
| **Name** | Sneha Patel |
| **Designation** | Software Engineer |

**What they see:**
- ✅ My Home — check-in/check-out, leave balance, team status
- ✅ Attendance — own history, apply for leave
- ✅ Salary — own salary structure, payslips, reimbursements
- ❌ No admin modules (HRMS management, Payroll, Finance, Analytics, Settings)
- ❌ Only sees own data, not colleagues' salaries

---

## Role Comparison Matrix

| Module | Admin | HR | Accountant | Employee |
|---|:---:|:---:|:---:|:---:|
| My Home | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ (finance KPIs) | ❌ |
| HRMS | ✅ full | ✅ full | ✅ view-only | ❌ |
| Attendance | ✅ | ✅ | ❌ | ✅ (own) |
| Payroll | ✅ run | ✅ run | ✅ view | ❌ |
| Salary | ✅ | ✅ | ✅ | ✅ (own) |
| Finance | ✅ | ❌ | ✅ full | ❌ |
| Procurement | ✅ | ❌ | ✅ full | ❌ |
| CRM | ✅ | ✅ | ❌ | ❌ |
| Projects | ✅ | ❌ | ❌ | ❌ |
| Support | ✅ | ❌ | ❌ | ❌ |
| Analytics | ✅ | ✅ | ✅ | ❌ |
| IATF Hub | ✅ | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ |

---

## Local Development Setup

```bash
# 1. Start local Supabase
cd supabase
supabase start

# 2. Apply migrations
supabase db reset  # fresh start with all migrations

# 3. Start Next.js
cd ../frontend
npm install
npm run dev

# 4. Seed demo data (local — no token needed in dev)
curl -X POST http://localhost:3000/api/v1/admin/seed-demo

# 5. Login at http://localhost:3000/login
# Use any account from above
```

---

## New Features (Added This Session)

### Finance & Procurement — Real Data
The Finance and Procurement pages now fetch **live data from Supabase** with mock data as fallback:
- Create invoices at `/finance` → they persist to the `invoices` table
- Add vendors at `/procurement` → they persist to the `vendors` table
- A "Preview mode" amber banner shows only when the DB has no records yet

### HRMS — Salary Structure Assignment
In the HRMS employee detail modal (click any employee):
- HR/Admin see a **Compensation** section showing current CTC
- "Set Salary" / "Revise Salary" button opens a salary calculator
- Enter CTC monthly → all Indian payroll components auto-calculate:
  - Basic (40%), HRA (50% of Basic), Special Allowance, Transport (₹1,600), Medical (₹1,250)
  - PF 12%, ESI 0.75%/3.25%, Professional Tax ₹200, Gratuity 4.81%
- Saving creates a salary revision record automatically

### CRM — Real Data Pipeline
The CRM pipeline board now uses live data from the `leads` table with a mock fallback. Add leads via the "Add Lead" button and they appear in the pipeline board.

### Dashboard — Role-Specific Views
Each role sees a different dashboard:
- **Admin/HR**: Headcount, attendance, leave approvals, recent hires
- **Accountant**: Payroll total, expense claims, P&L snapshot
- Quick links change per role

### Home Page — Role Banner
Non-employee roles see a contextual banner on `/home`:
- **Admin/HR**: Indigo banner with pending approval count
- **Accountant**: Teal banner with Finance and Payroll links
- **Manager**: Sky banner with team management links

---

## Troubleshooting

**"Employee record not found" after login:**
- The seed created the auth user but the employee record wasn't linked
- Re-run the seed: `POST /api/v1/admin/seed-demo` — it will update existing records

**"Seed endpoint disabled in production":**
- Add `ALLOW_SEED_IN_PROD=true` to Vercel env vars and redeploy

**"Invalid seed token":**
- Pass `?token=<SEED_DEMO_SECRET>` matching what you set in Vercel env

**Payroll run fails with "function calculate_payslip does not exist":**
- Apply the production schema sync migration: `supabase db push`
- Or apply `supabase/migrations/20260626000000_production_schema_sync.sql` in SQL editor

**Login redirects loop:**
- Clear browser cookies and try again
- Check Supabase URL and anon key are correct in Vercel env

**Can't see some menu items:**
- Role-based nav is active — each role sees only their permitted modules
- Check employee record has the correct `role` in Supabase employees table

**supabase db reset fails:**
- All migrations are now idempotent (IF NOT EXISTS, exception-safe blocks)
- If issues persist, check that `public.companies` table exists after `saas_schema` migration
