-- ==========================================
-- TALENT OS EXTENSION SCHEMA (PostgreSQL)
-- ==========================================

-- 1. PERSONS (The Continuous Record)
CREATE TABLE public.persons (
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

CREATE INDEX idx_persons_company ON public.persons(company_id);
CREATE INDEX idx_persons_email ON public.persons(email);

ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for persons" ON public.persons
    USING (company_id = get_user_company_id());

-- 2. JOBS
CREATE TABLE public.jobs (
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

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for jobs" ON public.jobs
    USING (company_id = get_user_company_id());


-- 3. APPLICATIONS
CREATE TABLE public.applications (
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

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for applications" ON public.applications
    USING (company_id = get_user_company_id());


-- 4. VERIFICATIONS (Trust Backbone)
CREATE TABLE public.verifications (
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

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for verifications" ON public.verifications
    USING (company_id = get_user_company_id());


-- 5. TRUST SCORES
CREATE TABLE public.trust_scores (
    company_id uuid NOT NULL,
    person_id uuid NOT NULL,
    score integer NOT NULL CHECK (score >= 0 AND score <= 100),
    breakdown jsonb NOT NULL,
    last_computed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (company_id, person_id),
    FOREIGN KEY (company_id, person_id) REFERENCES public.persons(company_id, id) ON DELETE CASCADE
);

ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation for trust_scores" ON public.trust_scores
    USING (company_id = get_user_company_id());

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_persons
BEFORE UPDATE ON public.persons
FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

CREATE TRIGGER set_timestamp_jobs
BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();

CREATE TRIGGER set_timestamp_applications
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE PROCEDURE trigger_set_updated_at();
