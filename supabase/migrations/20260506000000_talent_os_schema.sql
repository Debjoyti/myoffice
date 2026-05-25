-- ==========================================
-- TALENT OS EXTENSION SCHEMA (PostgreSQL)
-- NOTE: Fully idempotent — IF NOT EXISTS on tables,
-- exception-safe blocks on policies and triggers.
-- NOTE: Policies using get_user_company_id() are wrapped in
-- exception-safe blocks because that function is defined in
-- a later migration (enterprise_erp_schema). They become active
-- once that migration runs.
-- ==========================================

-- 1. PERSONS (The Continuous Record)
CREATE TABLE IF NOT EXISTS public.persons (
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text,
    status text NOT NULL CHECK (status IN ('candidate', 'employee', 'alumnus', 'boomerang')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (company_id, id)
);

CREATE INDEX IF NOT EXISTS idx_persons_company ON public.persons(company_id);
CREATE INDEX IF NOT EXISTS idx_persons_email ON public.persons(email);

DO $$ BEGIN ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Tenant isolation for persons" ON public.persons
      USING (company_id = get_user_company_id());
EXCEPTION WHEN duplicate_object THEN NULL;
         WHEN undefined_function THEN NULL; END $$;

-- 2. JOBS
CREATE TABLE IF NOT EXISTS public.jobs (
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    department text,
    description text,
    rubric jsonb DEFAULT '{}'::jsonb,
    salary_band jsonb,
    status text NOT NULL DEFAULT 'draft',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (company_id, id)
);

DO $$ BEGIN ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Tenant isolation for jobs" ON public.jobs
      USING (company_id = get_user_company_id());
EXCEPTION WHEN duplicate_object THEN NULL;
         WHEN undefined_function THEN NULL; END $$;


-- 3. APPLICATIONS
CREATE TABLE IF NOT EXISTS public.applications (
    company_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    person_id uuid NOT NULL,
    source text, -- 'whatsapp', 'web', 'linkedin'
    resume_text text,
    parsed_data jsonb,
    ai_screening_score integer,
    ai_screening_rationale text,
    status text NOT NULL DEFAULT 'applied',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (company_id, id),
    FOREIGN KEY (company_id, job_id) REFERENCES public.jobs(company_id, id) ON DELETE CASCADE,
    FOREIGN KEY (company_id, person_id) REFERENCES public.persons(company_id, id) ON DELETE CASCADE
);

DO $$ BEGIN ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Tenant isolation for applications" ON public.applications
      USING (company_id = get_user_company_id());
EXCEPTION WHEN duplicate_object THEN NULL;
         WHEN undefined_function THEN NULL; END $$;


-- 4. VERIFICATIONS (Trust Backbone)
CREATE TABLE IF NOT EXISTS public.verifications (
    company_id uuid NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    person_id uuid NOT NULL,
    type text NOT NULL CHECK (type IN ('digilocker', 'uan', 'pan', 'reference', 'bgv')),
    status text NOT NULL CHECK (status IN ('pending', 'verified', 'failed')),
    result_data jsonb,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (company_id, id),
    FOREIGN KEY (company_id, person_id) REFERENCES public.persons(company_id, id) ON DELETE CASCADE
);

DO $$ BEGIN ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Tenant isolation for verifications" ON public.verifications
      USING (company_id = get_user_company_id());
EXCEPTION WHEN duplicate_object THEN NULL;
         WHEN undefined_function THEN NULL; END $$;


-- 5. TRUST SCORES
CREATE TABLE IF NOT EXISTS public.trust_scores (
    company_id uuid NOT NULL,
    person_id uuid NOT NULL,
    score integer NOT NULL CHECK (score >= 0 AND score <= 100),
    breakdown jsonb NOT NULL,
    last_computed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (company_id, person_id),
    FOREIGN KEY (company_id, person_id) REFERENCES public.persons(company_id, id) ON DELETE CASCADE
);

DO $$ BEGIN ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Tenant isolation for trust_scores" ON public.trust_scores
      USING (company_id = get_user_company_id());
EXCEPTION WHEN duplicate_object THEN NULL;
         WHEN undefined_function THEN NULL; END $$;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_persons ON public.persons;
CREATE TRIGGER set_timestamp_persons
BEFORE UPDATE ON public.persons
FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_jobs ON public.jobs;
CREATE TRIGGER set_timestamp_jobs
BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_applications ON public.applications;
CREATE TRIGGER set_timestamp_applications
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();
