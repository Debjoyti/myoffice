-- Create custom types for roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'hr', 'finance', 'manager', 'employee');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create companies table if it doesn't exist (assuming it might be there, but we'll create/enhance)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    website TEXT,
    industry TEXT,
    country TEXT DEFAULT 'IN',
    currency TEXT DEFAULT 'INR',
    fiscal_year_start INT DEFAULT 4, -- April for India
    timezone TEXT DEFAULT 'Asia/Kolkata',
    tax_id TEXT, -- GST number
    address JSONB, -- { street, city, state, pincode, country }
    settings JSONB DEFAULT '{}', -- configurable org settings
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Trigger for companies updated_at
DROP TRIGGER IF EXISTS set_companies_updated_at ON public.companies;
CREATE TRIGGER set_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create users table (extending Supabase auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role public.app_role DEFAULT 'employee',
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    invited_by UUID REFERENCES public.users(id),
    invited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Trigger for users updated_at
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Employees table (needed for employee_id in JWT and other tables)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    employee_code TEXT,
    department_id UUID, -- Assuming departments table will be created
    position_id UUID, -- Assuming positions table will be created
    manager_id UUID REFERENCES public.employees(id),
    date_of_joining DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Trigger for employees updated_at
DROP TRIGGER IF EXISTS set_employees_updated_at ON public.employees;
CREATE TRIGGER set_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'view', 'approve'
    resource_type TEXT NOT NULL, -- table name
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Function for generic audit logging trigger
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    audit_company_id UUID;
    audit_user_id UUID;
BEGIN
    -- Extract company_id
    IF TG_OP = 'DELETE' THEN
        -- Try to get company_id from OLD
        BEGIN
            audit_company_id := OLD.company_id;
        EXCEPTION WHEN undefined_column THEN
            audit_company_id := NULL;
        END;
    ELSE
        -- Try to get company_id from NEW
        BEGIN
            audit_company_id := NEW.company_id;
        EXCEPTION WHEN undefined_column THEN
            audit_company_id := NULL;
        END;
    END IF;

    -- Extract user_id from auth.uid() if available, else NULL
    audit_user_id := auth.uid();

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (company_id, user_id, action, resource_type, resource_id, new_values)
        VALUES (audit_company_id, audit_user_id, 'create', TG_TABLE_NAME, NEW.id, row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (company_id, user_id, action, resource_type, resource_id, old_values, new_values)
        VALUES (audit_company_id, audit_user_id, 'update', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (company_id, user_id, action, resource_type, resource_id, old_values)
        VALUES (audit_company_id, audit_user_id, 'delete', TG_TABLE_NAME, OLD.id, row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit log triggers
DROP TRIGGER IF EXISTS audit_companies ON public.companies;
CREATE TRIGGER audit_companies
    AFTER INSERT OR UPDATE OR DELETE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

DROP TRIGGER IF EXISTS audit_users ON public.users;
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

DROP TRIGGER IF EXISTS audit_employees ON public.employees;
CREATE TRIGGER audit_employees
    AFTER INSERT OR UPDATE OR DELETE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- Setup Row Level Security (RLS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Companies Policies
-- For initial setup, we might need a bypass or specific policy for super_admin
CREATE POLICY "Super admins can do all on companies" ON public.companies
    FOR ALL
    USING ((auth.jwt() ->> 'role') = 'super_admin');

CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT
    USING (id = (auth.jwt() ->> 'company_id')::uuid);

CREATE POLICY "Admins can update their company" ON public.companies
    FOR UPDATE
    USING (
        id = (auth.jwt() ->> 'company_id')::uuid AND
        (auth.jwt() ->> 'role') IN ('admin')
    )
    WITH CHECK (
        id = (auth.jwt() ->> 'company_id')::uuid AND
        (auth.jwt() ->> 'role') IN ('admin')
    );

-- Users Policies
CREATE POLICY "company_isolation_users" ON public.users
    FOR ALL
    USING (company_id = (auth.jwt() ->> 'company_id')::uuid)
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Employees Policies
CREATE POLICY "company_isolation_employees" ON public.employees
    FOR ALL
    USING (company_id = (auth.jwt() ->> 'company_id')::uuid)
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Audit Logs Policies (Admins only typically)
CREATE POLICY "Admins can view company audit logs" ON public.audit_logs
    FOR SELECT
    USING (
        company_id = (auth.jwt() ->> 'company_id')::uuid AND
        (auth.jwt() ->> 'role') IN ('admin', 'super_admin')
    );
