-- Bulk company onboarding / migration (e.g. moving from SAP, Zoho, Excel exports)
-- Lets a company upload its existing employee roster and AI-map it onto our schema,
-- preserving each person's original "employee code" from their old system
-- alongside the new PRSK-native employee_code.

ALTER TABLE employees ADD COLUMN IF NOT EXISTS external_employee_code TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS source_system TEXT; -- e.g. 'sap', 'zoho', 'excel', 'manual'
CREATE INDEX IF NOT EXISTS idx_employees_external_code ON employees(company_id, external_employee_code);

-- One row per uploaded migration batch (a whole company's roster import)
CREATE TABLE IF NOT EXISTS company_migrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id),
    name            TEXT NOT NULL,
    source_system   TEXT NOT NULL DEFAULT 'excel'
                      CHECK (source_system IN ('excel','sap','zoho','csv','other')),
    file_name       TEXT,
    status          TEXT NOT NULL DEFAULT 'uploaded'
                      CHECK (status IN ('uploaded','mapping_suggested','mapping_confirmed','importing','completed','completed_with_errors','failed')),
    total_rows      INTEGER NOT NULL DEFAULT 0,
    mapped_rows     INTEGER NOT NULL DEFAULT 0,
    error_rows      INTEGER NOT NULL DEFAULT 0,
    column_mapping  JSONB,             -- AI-suggested / confirmed source-column -> field mapping
    source_columns  JSONB,             -- raw header row from the uploaded file
    error_summary   TEXT,
    created_by      UUID REFERENCES employees(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

-- One row per source record (candidate/employee row) staged for review before commit
CREATE TABLE IF NOT EXISTS migration_staging_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_id    UUID NOT NULL REFERENCES company_migrations(id) ON DELETE CASCADE,
    row_number      INTEGER NOT NULL,
    raw_data        JSONB NOT NULL,     -- original row, keyed by source column name
    mapped_data     JSONB,              -- row mapped onto our employee schema
    status          TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','valid','error','imported','skipped')),
    error_message   TEXT,
    employee_id     UUID REFERENCES employees(id), -- set once imported
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_migration_staging_migration ON migration_staging_records(migration_id);
CREATE INDEX IF NOT EXISTS idx_migration_staging_status ON migration_staging_records(migration_id, status);
CREATE INDEX IF NOT EXISTS idx_company_migrations_company ON company_migrations(company_id);

ALTER TABLE company_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_staging_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY tenant_isolation_company_migrations ON company_migrations
    FOR ALL USING (company_id = get_user_company_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY tenant_isolation_migration_staging_records ON migration_staging_records
    FOR ALL USING (
      migration_id IN (SELECT id FROM company_migrations WHERE company_id = get_user_company_id())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
