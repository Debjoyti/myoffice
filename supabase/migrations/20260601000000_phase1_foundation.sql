-- ==========================================
-- Phase 1 Foundation Migration
-- NOTE: Fully idempotent — safe to run on any DB state.
-- All CREATE TABLE uses IF NOT EXISTS, triggers/policies/indexes
-- are wrapped in exception-safe or DROP-IF-EXISTS blocks.
-- ==========================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 2. Schemas
CREATE SCHEMA IF NOT EXISTS private;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS integrations;

-- 3. Helper Functions
CREATE OR REPLACE FUNCTION private.current_company_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN nullif(current_setting('app.current_company_id', true), '')::uuid;
END;
$$;

CREATE OR REPLACE FUNCTION private.user_has_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  has_role boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_company_roles
    WHERE user_id = auth.uid()
      AND company_id = private.current_company_id()
      AND role = required_role
      AND deleted_at IS NULL
  ) INTO has_role;
  RETURN has_role;
END;
$$;

CREATE OR REPLACE FUNCTION private.user_belongs_to_company(c_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  belongs boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_company_roles
    WHERE user_id = auth.uid() AND company_id = c_id AND deleted_at IS NULL
  ) INTO belongs;
  RETURN belongs;
END;
$$;

CREATE OR REPLACE FUNCTION private.redact_jsonb(data jsonb, keys_to_redact text[])
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  k text;
BEGIN
  FOREACH k IN ARRAY keys_to_redact LOOP
    IF data ? k THEN
      data := jsonb_set(data, array[k], '"[REDACTED]"'::jsonb);
    END IF;
  END LOOP;
  RETURN data;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION audit.fn_log_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  keys_to_redact text[] := ARRAY['password', 'secret', 'token', 'pan_number', 'bank_account_number'];
BEGIN
  IF TG_OP = 'INSERT' THEN
    new_data := private.redact_jsonb(to_jsonb(NEW), keys_to_redact);
    INSERT INTO audit.audit_logs (table_name, record_id, action, new_data)
    VALUES (TG_TABLE_NAME::text, NEW.id, TG_OP, new_data);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := private.redact_jsonb(to_jsonb(OLD), keys_to_redact);
    new_data := private.redact_jsonb(to_jsonb(NEW), keys_to_redact);
    INSERT INTO audit.audit_logs (table_name, record_id, action, old_data, new_data)
    VALUES (TG_TABLE_NAME::text, NEW.id, TG_OP, old_data, new_data);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    old_data := private.redact_jsonb(to_jsonb(OLD), keys_to_redact);
    INSERT INTO audit.audit_logs (table_name, record_id, action, old_data)
    VALUES (TG_TABLE_NAME::text, OLD.id, TG_OP, old_data);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 4. Tables

-- public.companies (may already exist from saas_schema — IF NOT EXISTS is safe)
CREATE TABLE IF NOT EXISTS public.companies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    organization_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

-- public.users (linked to auth.users — may already exist from enterprise_erp_schema)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email citext NOT NULL UNIQUE,
    first_name text,
    last_name text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

-- public.user_company_roles
CREATE TABLE IF NOT EXISTS public.user_company_roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    role text NOT NULL CHECK (role IN ('superadmin', 'admin', 'finance', 'hr', 'employee', 'manager')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE(user_id, company_id, role)
);

-- audit.audit_logs (BRIN indexable append-only time series table)
CREATE TABLE IF NOT EXISTS audit.audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data jsonb,
    new_data jsonb,
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- public.domain_events
CREATE TABLE IF NOT EXISTS public.domain_events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

-- private.event_outbox
CREATE TABLE IF NOT EXISTS private.event_outbox (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz
);

-- integrations.config
CREATE TABLE IF NOT EXISTS integrations.config (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
    provider text NOT NULL,
    config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    UNIQUE(company_id, provider)
);

-- public.rate_limit_state
CREATE TABLE IF NOT EXISTS public.rate_limit_state (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    key text NOT NULL UNIQUE,
    points integer NOT NULL DEFAULT 0,
    expire_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Triggers (DROP IF EXISTS first to ensure idempotency)
DROP TRIGGER IF EXISTS set_companies_updated_at ON public.companies;
CREATE TRIGGER set_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_user_company_roles_updated_at ON public.user_company_roles;
CREATE TRIGGER set_user_company_roles_updated_at
    BEFORE UPDATE ON public.user_company_roles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_integrations_config_updated_at ON integrations.config;
CREATE TRIGGER set_integrations_config_updated_at
    BEFORE UPDATE ON integrations.config
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS audit_companies_changes ON public.companies;
CREATE TRIGGER audit_companies_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION audit.fn_log_change();

DROP TRIGGER IF EXISTS audit_user_company_roles_changes ON public.user_company_roles;
CREATE TRIGGER audit_user_company_roles_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.user_company_roles
    FOR EACH ROW EXECUTE FUNCTION audit.fn_log_change();

-- 6. Indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_user_company_roles_user_id ON public.user_company_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_company_roles_company_id ON public.user_company_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_domain_events_company_id ON public.domain_events(company_id);
CREATE INDEX IF NOT EXISTS idx_integrations_config_company_id ON integrations.config(company_id);

CREATE INDEX IF NOT EXISTS idx_companies_deleted_at ON public.companies(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_company_roles_deleted_at ON public.user_company_roles(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_domain_events_deleted_at ON public.domain_events(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_integrations_config_deleted_at ON integrations.config(deleted_at) WHERE deleted_at IS NULL;

DO $$ BEGIN
  CREATE INDEX idx_audit_logs_created_at ON audit.audit_logs USING BRIN (created_at);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- 7. RLS
DO $$ BEGIN ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.users ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.user_company_roles ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE integrations.config ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE audit.audit_logs ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE private.event_outbox ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policies (exception-safe — harmless if already exist)
DO $$ BEGIN
  CREATE POLICY "Users can view companies they belong to" ON public.companies
  FOR SELECT USING (private.user_belongs_to_company(id) AND deleted_at IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view users in same company" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_company_roles r1
      JOIN public.user_company_roles r2 ON r1.company_id = r2.company_id
      WHERE r1.user_id = auth.uid() AND r2.user_id = public.users.id
        AND r1.deleted_at IS NULL AND r2.deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid() AND deleted_at IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view roles in same company" ON public.user_company_roles
  FOR SELECT USING (private.user_belongs_to_company(company_id) AND deleted_at IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view events for their company" ON public.domain_events
  FOR SELECT USING (private.user_belongs_to_company(company_id) AND deleted_at IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can view integration config for their company" ON integrations.config
  FOR SELECT USING (private.user_belongs_to_company(company_id) AND private.user_has_role('admin') AND deleted_at IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 8. Auth Hook Setup (Custom Claim Injection)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  claims jsonb;
  user_role text;
  c_id uuid;
BEGIN
  claims := event->'claims';

  SELECT jsonb_object_agg(company_id::text, role)
  INTO claims
  FROM public.user_company_roles
  WHERE user_id = (event->>'user_id')::uuid AND deleted_at IS NULL;

  IF claims IS NULL THEN
    claims := '{}'::jsonb;
  END IF;

  RETURN jsonb_set(event, '{claims, user_roles}', claims);
END;
$$;

-- Grant permissions for supabase_auth_admin to execute the hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Automatically create a user record on signup
-- (init_schema already defines handle_new_user for profiles; this version upserts users table)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert into profiles (legacy support)
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert into users (new schema)
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  ) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
