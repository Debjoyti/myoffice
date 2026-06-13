-- ============================================================
-- CAREER PORTAL  ("Talent Hub")
-- A best-of-breed, two-sided hiring platform that unifies the
-- strongest ideas from Naukri / LinkedIn / Cutshort / Instahyre /
-- YC Work-at-a-Startup, plus an AI interview engine in the spirit
-- of HireVue / Interviewer.AI.
--
--  career_jobs        — the public job posting (the "listing")
--  career_candidates  — the talent profile (the seeker side)
--  career_applications— the application: job × candidate + pipeline stage
--  career_interviews  — async AI interview sessions + scored reports
--  career_application_events — immutable pipeline timeline
--  career_settings    — per-company career-site branding & config
--
-- Multi-tenant by company_id (the company runs its own career site),
-- mirroring the inventory / marketplace module RLS pattern.
-- ============================================================

-- 1. JOB POSTINGS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  -- optional linkage into HR org structure
  department_id     UUID REFERENCES departments(id) ON DELETE SET NULL,
  position_id       UUID REFERENCES positions(id) ON DELETE SET NULL,
  -- listing content
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL,
  code              TEXT,                              -- requisition code e.g. ENG-SSE-026
  department_name   TEXT,                              -- denormalised for the public board
  summary           TEXT,                              -- one-line teaser
  description       TEXT,                              -- full JD (markdown)
  responsibilities  JSONB NOT NULL DEFAULT '[]',       -- ["Own backend services", ...]
  requirements      JSONB NOT NULL DEFAULT '[]',       -- ["5+ yrs Node", ...]
  perks             JSONB NOT NULL DEFAULT '[]',       -- ["ESOPs", "Remote", ...]
  skills            JSONB NOT NULL DEFAULT '[]',       -- ["React","Postgres"] — drives AI match
  -- classification
  employment_type   TEXT NOT NULL DEFAULT 'full_time', -- full_time|part_time|contract|internship|temporary
  work_mode         TEXT NOT NULL DEFAULT 'onsite',    -- onsite|hybrid|remote
  experience_level  TEXT NOT NULL DEFAULT 'mid',       -- intern|junior|mid|senior|lead|director
  min_experience    NUMERIC(4,1) NOT NULL DEFAULT 0,   -- years
  max_experience    NUMERIC(4,1),
  location          TEXT,                              -- "Bengaluru, IN" / "Remote (India)"
  -- compensation (pay transparency, Cutshort/Instahyre style)
  currency          TEXT NOT NULL DEFAULT 'INR',
  salary_min        NUMERIC(18,2),
  salary_max        NUMERIC(18,2),
  salary_period     TEXT NOT NULL DEFAULT 'year',      -- year|month|hour
  show_salary       BOOLEAN NOT NULL DEFAULT TRUE,
  openings          INTEGER NOT NULL DEFAULT 1,
  -- AI interview wiring
  ai_interview_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ai_competencies   JSONB NOT NULL DEFAULT '[]',       -- ["communication","problem_solving",...]
  ai_question_count INTEGER NOT NULL DEFAULT 5,
  -- lifecycle / merchandising
  status            TEXT NOT NULL DEFAULT 'draft',     -- draft|open|paused|closed|filled
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  is_urgent         BOOLEAN NOT NULL DEFAULT FALSE,
  view_count        INTEGER NOT NULL DEFAULT 0,
  applicant_count   INTEGER NOT NULL DEFAULT 0,
  hired_count       INTEGER NOT NULL DEFAULT 0,
  -- ownership
  hiring_manager_id UUID,                              -- employees.id
  posted_by         UUID,
  published_at      TIMESTAMPTZ,
  closes_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_career_jobs_company ON career_jobs(company_id, status);
CREATE INDEX IF NOT EXISTS idx_career_jobs_dept    ON career_jobs(department_id);

-- 2. CANDIDATE / TALENT PROFILES ──────────────────────────────
CREATE TABLE IF NOT EXISTS career_candidates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id           UUID,                              -- linked auth user (if self-registered)
  -- identity
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  avatar_url        TEXT,
  location          TEXT,
  -- professional snapshot
  headline          TEXT,                              -- "Senior Backend Engineer @ Razorpay"
  summary           TEXT,
  skills            JSONB NOT NULL DEFAULT '[]',
  experience_years  NUMERIC(4,1) NOT NULL DEFAULT 0,
  current_company   TEXT,
  current_title     TEXT,
  current_ctc       NUMERIC(18,2),
  expected_ctc      NUMERIC(18,2),
  notice_period_days INTEGER,
  -- structured history (lightweight — full resume lives in resume_url)
  experience        JSONB NOT NULL DEFAULT '[]',       -- [{company,title,start,end,summary}]
  education         JSONB NOT NULL DEFAULT '[]',       -- [{school,degree,year}]
  -- links & assets
  resume_url        TEXT,
  linkedin_url      TEXT,
  github_url        TEXT,
  portfolio_url     TEXT,
  -- preferences (reverse-matching, Instahyre style)
  preferred_roles   JSONB NOT NULL DEFAULT '[]',
  preferred_locations JSONB NOT NULL DEFAULT '[]',
  open_to_remote    BOOLEAN NOT NULL DEFAULT TRUE,
  open_to_work      BOOLEAN NOT NULL DEFAULT TRUE,     -- "open to opportunities" flag
  -- platform meta
  source            TEXT,                              -- linkedin|naukri|referral|direct|portal
  profile_score     INTEGER NOT NULL DEFAULT 0,        -- 0-100 completeness
  tags              JSONB NOT NULL DEFAULT '[]',
  status            TEXT NOT NULL DEFAULT 'active',     -- active|placed|archived|blacklisted
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, email)
);
CREATE INDEX IF NOT EXISTS idx_career_candidates_company ON career_candidates(company_id, status);

-- 3. APPLICATIONS (job × candidate) ───────────────────────────
CREATE TABLE IF NOT EXISTS career_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_id            UUID NOT NULL REFERENCES career_jobs(id) ON DELETE CASCADE,
  candidate_id      UUID NOT NULL REFERENCES career_candidates(id) ON DELETE CASCADE,
  reference_no      TEXT,                              -- APP-2026-0001
  -- pipeline
  stage             TEXT NOT NULL DEFAULT 'applied',
  -- applied|screening|interview|assessment|offer|hired|rejected|withdrawn
  status            TEXT NOT NULL DEFAULT 'active',    -- active|closed
  source            TEXT NOT NULL DEFAULT 'portal',
  -- candidate-supplied
  cover_note        TEXT,
  answers           JSONB NOT NULL DEFAULT '[]',       -- screening question answers
  expected_ctc      NUMERIC(18,2),
  available_from    DATE,
  -- AI scoring
  ai_match_score    INTEGER,                           -- 0-100 resume↔JD fit
  ai_match_reasons  JSONB NOT NULL DEFAULT '[]',
  ai_interview_score INTEGER,                          -- 0-100 from career_interviews
  recruiter_rating  INTEGER,                           -- 1-5 human rating
  -- decisioning
  rejection_reason  TEXT,
  notes             TEXT,
  assigned_to       UUID,                              -- recruiter (employees.id)
  applied_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stage_changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, candidate_id)
);
CREATE INDEX IF NOT EXISTS idx_career_apps_company ON career_applications(company_id, stage);
CREATE INDEX IF NOT EXISTS idx_career_apps_job     ON career_applications(job_id, stage);
CREATE INDEX IF NOT EXISTS idx_career_apps_cand    ON career_applications(candidate_id);

-- 4. AI INTERVIEW SESSIONS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_interviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  application_id    UUID REFERENCES career_applications(id) ON DELETE CASCADE,
  job_id            UUID REFERENCES career_jobs(id) ON DELETE SET NULL,
  candidate_id      UUID REFERENCES career_candidates(id) ON DELETE SET NULL,
  access_token      TEXT NOT NULL,                     -- shareable one-way interview link
  mode              TEXT NOT NULL DEFAULT 'async_text',-- async_text|async_video
  -- generated interview
  questions         JSONB NOT NULL DEFAULT '[]',
  -- [{id,competency,prompt,prep_seconds,answer_seconds}]
  responses         JSONB NOT NULL DEFAULT '[]',
  -- [{question_id,answer,duration_seconds,word_count}]
  -- AI evaluation (HireVue/Interviewer.AI-style rubric)
  scores            JSONB NOT NULL DEFAULT '{}',
  -- {relevancy,communication,problem_solving,professionalism,structure, per_question:[...]}
  overall_score     INTEGER,                           -- 0-100
  recommendation    TEXT,                              -- strong_yes|yes|maybe|no
  strengths         JSONB NOT NULL DEFAULT '[]',
  concerns          JSONB NOT NULL DEFAULT '[]',
  summary           TEXT,
  evaluated_by      TEXT,                              -- ai|human
  integrity_flags   JSONB NOT NULL DEFAULT '[]',       -- ["scripted_cadence", ...]
  status            TEXT NOT NULL DEFAULT 'pending',
  -- pending|invited|in_progress|completed|expired|abandoned
  invited_at        TIMESTAMPTZ,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_career_interviews_company ON career_interviews(company_id, status);
CREATE INDEX IF NOT EXISTS idx_career_interviews_token   ON career_interviews(access_token);
CREATE INDEX IF NOT EXISTS idx_career_interviews_app     ON career_interviews(application_id);

-- 5. APPLICATION TIMELINE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_application_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL,
  application_id UUID NOT NULL REFERENCES career_applications(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,  -- applied|stage_change|note|interview_sent|interview_done|rating|rejected|hired
  from_stage    TEXT,
  to_stage      TEXT,
  message       TEXT,
  meta          JSONB DEFAULT '{}',
  actor_id      UUID,
  actor_name    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_career_events_app ON career_application_events(application_id, created_at);

-- 6. PER-COMPANY CAREER-SITE SETTINGS ─────────────────────────
CREATE TABLE IF NOT EXISTS career_settings (
  company_id            UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  brand_name            TEXT,
  tagline               TEXT,
  about                 TEXT,
  logo_url              TEXT,
  hero_image_url        TEXT,
  primary_color         TEXT NOT NULL DEFAULT '#2563eb',
  perks                 JSONB NOT NULL DEFAULT '[]',
  ai_interview_default  BOOLEAN NOT NULL DEFAULT TRUE,
  auto_screen           BOOLEAN NOT NULL DEFAULT TRUE,   -- auto AI-score new applicants
  auto_reject_threshold INTEGER NOT NULL DEFAULT 0,      -- 0 = off; reject below this match score
  allow_ai_disclosure   BOOLEAN NOT NULL DEFAULT TRUE,   -- show AI-use notice (NYC/IL/CO style)
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ROW LEVEL SECURITY (service-role pattern, like inventory/marketplace)
ALTER TABLE career_jobs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_candidates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_applications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_interviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_settings           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all" ON career_jobs               FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON career_candidates         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON career_applications       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON career_interviews         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON career_application_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON career_settings           FOR ALL USING (true) WITH CHECK (true);

-- 8. TRIGGERS & MAINTENANCE FUNCTIONS ─────────────────────────

-- keep updated_at fresh
CREATE OR REPLACE FUNCTION career_touch_updated() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_career_jobs_touch ON career_jobs;
CREATE TRIGGER trg_career_jobs_touch BEFORE UPDATE ON career_jobs
  FOR EACH ROW EXECUTE FUNCTION career_touch_updated();
DROP TRIGGER IF EXISTS trg_career_candidates_touch ON career_candidates;
CREATE TRIGGER trg_career_candidates_touch BEFORE UPDATE ON career_candidates
  FOR EACH ROW EXECUTE FUNCTION career_touch_updated();
DROP TRIGGER IF EXISTS trg_career_apps_touch ON career_applications;
CREATE TRIGGER trg_career_apps_touch BEFORE UPDATE ON career_applications
  FOR EACH ROW EXECUTE FUNCTION career_touch_updated();
DROP TRIGGER IF EXISTS trg_career_interviews_touch ON career_interviews;
CREATE TRIGGER trg_career_interviews_touch BEFORE UPDATE ON career_interviews
  FOR EACH ROW EXECUTE FUNCTION career_touch_updated();

-- Recompute a job's applicant/hire counters from its applications.
CREATE OR REPLACE FUNCTION career_refresh_job_counts(p_job_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE career_jobs j
     SET applicant_count = COALESCE((
           SELECT COUNT(*) FROM career_applications a
            WHERE a.job_id = p_job_id), 0),
         hired_count = COALESCE((
           SELECT COUNT(*) FROM career_applications a
            WHERE a.job_id = p_job_id AND a.stage = 'hired'), 0),
         updated_at = NOW()
   WHERE j.id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- BEFORE for stage stamp, AFTER for count recompute (separate to keep NEW edits)
CREATE OR REPLACE FUNCTION career_app_stage_stamp() RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.stage IS DISTINCT FROM OLD.stage) THEN
    NEW.stage_changed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION career_app_count_sync() RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM career_refresh_job_counts(OLD.job_id);
    RETURN OLD;
  END IF;
  PERFORM career_refresh_job_counts(NEW.job_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_career_app_stage ON career_applications;
CREATE TRIGGER trg_career_app_stage BEFORE UPDATE ON career_applications
  FOR EACH ROW EXECUTE FUNCTION career_app_stage_stamp();

DROP TRIGGER IF EXISTS trg_career_app_counts ON career_applications;
CREATE TRIGGER trg_career_app_counts AFTER INSERT OR UPDATE OR DELETE ON career_applications
  FOR EACH ROW EXECUTE FUNCTION career_app_count_sync();

-- Generate a per-company sequential reference like APP-2026-0042.
CREATE OR REPLACE FUNCTION career_next_reference(p_company UUID)
RETURNS TEXT AS $$
DECLARE v_seq INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_seq FROM career_applications WHERE company_id = p_company;
  RETURN 'APP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
