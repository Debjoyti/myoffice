-- PRSK Enterprise Business OS Schema Migration
-- Features: Multi-tenancy, RBAC, Event-Driven Triggers, Audit Trails

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('super_admin', 'company_admin', 'hr', 'finance', 'manager', 'employee', 'auditor');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'half_day', 'late');
CREATE TYPE payroll_status AS ENUM ('draft', 'processed', 'locked', 'paid');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE pr_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected');
CREATE TYPE po_status AS ENUM ('draft', 'sent', 'acknowledged', 'fulfilled', 'cancelled');

-- 2. CORE SYSTEM & TENANCY
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    gst_number VARCHAR(15),
    pan_number VARCHAR(10),
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'employee',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AUDIT LOGGING
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_type VARCHAR(50),
    before_state JSONB,
    after_state JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. HRMS MODULE
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    manager_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    employee_code VARCHAR(50) NOT NULL,
    department_id UUID REFERENCES departments(id),
    designation VARCHAR(255) NOT NULL,
    date_of_joining DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    manager_id UUID REFERENCES employees(id),
    basic_salary NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, employee_code)
);

-- 5. ATTENDANCE & LEAVES
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status attendance_status NOT NULL,
    location_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status leave_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PAYROLL MODULE
CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status payroll_status DEFAULT 'draft',
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    basic NUMERIC(15, 2) NOT NULL,
    allowances NUMERIC(15, 2) DEFAULT 0,
    deductions NUMERIC(15, 2) DEFAULT 0,
    net_pay NUMERIC(15, 2) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FINANCE & EXPENSES
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, account_code)
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    date DATE NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    debit NUMERIC(15, 2) DEFAULT 0,
    credit NUMERIC(15, 2) DEFAULT 0,
    CHECK (debit >= 0 AND credit >= 0 AND (debit > 0 OR credit > 0))
);

CREATE TABLE expense_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    amount NUMERIC(15, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    receipt_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PROCUREMENT
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    gst_number VARCHAR(15),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    po_number VARCHAR(50) NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    total_amount NUMERIC(15, 2) NOT NULL,
    status po_status DEFAULT 'draft',
    raised_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, po_number)
);

-- 9. CRM
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    status VARCHAR(50) DEFAULT 'new',
    owner_id UUID REFERENCES users(id),
    value NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Helper Function to get current user's company
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
DECLARE
    cid UUID;
BEGIN
    SELECT company_id INTO cid FROM users WHERE id = auth.uid();
    RETURN cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- General Policy Template: Users can only see data for their company
CREATE POLICY tenant_isolation_users ON users 
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY tenant_isolation_departments ON departments 
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY tenant_isolation_employees ON employees 
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY tenant_isolation_attendance ON attendance_records 
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY tenant_isolation_payroll ON payroll_runs 
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY tenant_isolation_payslips ON payslips 
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY tenant_isolation_expenses ON expense_claims 
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY tenant_isolation_vendors ON vendors 
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY tenant_isolation_pos ON purchase_orders 
    FOR ALL USING (company_id = get_user_company_id());

CREATE POLICY tenant_isolation_leads ON leads 
    FOR ALL USING (company_id = get_user_company_id());

-- 11. AUTOMATION TRIGGERS & FUNCTIONS
-- Function: Auto-generate journal entry for approved expense
CREATE OR REPLACE FUNCTION trigger_expense_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Insert Journal Entry
        INSERT INTO journal_entries (company_id, date, description, reference_type, reference_id, created_by)
        VALUES (NEW.company_id, CURRENT_DATE, 'Expense Claim Approved: ' || NEW.id, 'expense', NEW.id, NEW.approved_by);
        
        -- Note: In a real system we would add journal_lines for DEBIT expense account, CREDIT AP/Cash account here
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expense_approval_trigger
    AFTER UPDATE ON expense_claims
    FOR EACH ROW
    EXECUTE FUNCTION trigger_expense_approval();

-- Function: Auto update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to main tables
CREATE TRIGGER set_timestamp_companies BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER set_timestamp_employees BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER set_timestamp_attendance BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER set_timestamp_leaves BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER set_timestamp_pos BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER set_timestamp_leads BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Function: Audit Logging Trigger
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_company_id UUID;
    v_action VARCHAR;
BEGIN
    v_user_id := auth.uid();
    
    IF TG_OP = 'INSERT' THEN
        v_action := 'CREATE';
        v_company_id := NEW.company_id;
        INSERT INTO audit_logs (company_id, user_id, action, module, entity_id, entity_type, after_state)
        VALUES (v_company_id, v_user_id, v_action, TG_TABLE_NAME, NEW.id, TG_TABLE_NAME, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_company_id := NEW.company_id;
        INSERT INTO audit_logs (company_id, user_id, action, module, entity_id, entity_type, before_state, after_state)
        VALUES (v_company_id, v_user_id, v_action, TG_TABLE_NAME, NEW.id, TG_TABLE_NAME, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_company_id := OLD.company_id;
        INSERT INTO audit_logs (company_id, user_id, action, module, entity_id, entity_type, before_state)
        VALUES (v_company_id, v_user_id, v_action, TG_TABLE_NAME, OLD.id, TG_TABLE_NAME, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach Audit Triggers to Sensitive Tables
CREATE TRIGGER audit_employees_trigger AFTER INSERT OR UPDATE OR DELETE ON employees FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_payroll_trigger AFTER INSERT OR UPDATE OR DELETE ON payroll_runs FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_payslips_trigger AFTER INSERT OR UPDATE OR DELETE ON payslips FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_journal_trigger AFTER INSERT OR UPDATE OR DELETE ON journal_entries FOR EACH ROW EXECUTE FUNCTION log_audit_event();

