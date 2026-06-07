-- Candidate onboarding & verification tracking (documents + police verification)
CREATE TABLE IF NOT EXISTS onboarding_candidates (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id            UUID NOT NULL REFERENCES companies(id),
    full_name             TEXT NOT NULL,
    email                 TEXT NOT NULL,
    phone                 TEXT,
    designation           TEXT,
    department_id         UUID REFERENCES departments(id),
    date_of_joining       DATE,
    stage                 TEXT NOT NULL DEFAULT 'documents_pending'
                            CHECK (stage IN ('documents_pending','verification_in_progress','verified','onboarded','on_hold')),
    -- Document verification checklist
    doc_id_proof          BOOLEAN NOT NULL DEFAULT FALSE,
    doc_address_proof     BOOLEAN NOT NULL DEFAULT FALSE,
    doc_education_certs   BOOLEAN NOT NULL DEFAULT FALSE,
    doc_experience_letter BOOLEAN NOT NULL DEFAULT FALSE,
    doc_pan_aadhaar       BOOLEAN NOT NULL DEFAULT FALSE,
    doc_bank_details      BOOLEAN NOT NULL DEFAULT FALSE,
    -- Police / background verification
    police_verification_status TEXT NOT NULL DEFAULT 'not_started'
                            CHECK (police_verification_status IN ('not_started','submitted','in_progress','cleared','flagged')),
    police_verification_ref    TEXT,
    police_verification_notes  TEXT,
    notes                 TEXT,
    created_by            UUID REFERENCES employees(id),
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_candidates_company ON onboarding_candidates(company_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_candidates_stage ON onboarding_candidates(company_id, stage);

ALTER TABLE onboarding_candidates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY tenant_isolation_onboarding_candidates ON onboarding_candidates
    FOR ALL USING (company_id = get_user_company_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
