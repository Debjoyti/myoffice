-- ============================================================
-- CRM SUITE  — a full relationship CRM (HubSpot / Salesforce-class)
--
-- Model:  ACCOUNTS (companies) ← CONTACTS (people)
--         DEALS move through PIPELINE → STAGES (win probability,
--         won/lost terminals).  ACTIVITIES (call/email/meeting/
--         task/note) are logged on a timeline against any of them.
-- ============================================================

-- 1. PIPELINES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_pipelines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. STAGES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_stages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL,
  pipeline_id  UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  probability  NUMERIC(5,2) NOT NULL DEFAULT 0,  -- win % at this stage
  is_won       BOOLEAN NOT NULL DEFAULT FALSE,
  is_lost      BOOLEAN NOT NULL DEFAULT FALSE,
  color        TEXT NOT NULL DEFAULT '#3b82f6',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_stages_pipeline ON crm_stages(pipeline_id, sort_order);

-- 3. ACCOUNTS (companies) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  legal_name      TEXT,
  domain          TEXT,
  website         TEXT,
  industry        TEXT,
  employee_count  INTEGER,
  annual_revenue  NUMERIC(18,2),
  phone           TEXT,
  email           TEXT,
  address         JSONB DEFAULT '{}',
  city            TEXT,
  state           TEXT,
  country         TEXT DEFAULT 'India',
  type            TEXT NOT NULL DEFAULT 'prospect', -- prospect|customer|partner|vendor|other
  status          TEXT NOT NULL DEFAULT 'active',   -- active|inactive
  owner_id        UUID,                              -- employees.id
  tags            JSONB NOT NULL DEFAULT '[]',
  description     TEXT,
  last_activity_at TIMESTAMPTZ,
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_company ON crm_accounts(company_id, status);

-- 4. CONTACTS (people) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  account_id      UUID REFERENCES crm_accounts(id) ON DELETE SET NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT,
  email           TEXT,
  phone           TEXT,
  mobile          TEXT,
  job_title       TEXT,
  department      TEXT,
  owner_id        UUID,
  lifecycle_stage TEXT NOT NULL DEFAULT 'lead',
  -- subscriber|lead|mql|sql|opportunity|customer|evangelist
  lead_status     TEXT NOT NULL DEFAULT 'new',
  -- new|open|in_progress|qualified|unqualified|connected
  source          TEXT,  -- web|referral|ads|event|cold_call|social|import|other
  tags            JSONB NOT NULL DEFAULT '[]',
  address         JSONB DEFAULT '{}',
  linkedin        TEXT,
  twitter         TEXT,
  notes           TEXT,
  do_not_contact  BOOLEAN NOT NULL DEFAULT FALSE,
  last_activity_at TIMESTAMPTZ,
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company ON crm_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_account ON crm_contacts(account_id);

-- 5. DEALS (opportunities) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_deals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  pipeline_id       UUID NOT NULL REFERENCES crm_pipelines(id),
  stage_id          UUID NOT NULL REFERENCES crm_stages(id),
  name              TEXT NOT NULL,
  account_id        UUID REFERENCES crm_accounts(id) ON DELETE SET NULL,
  primary_contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  owner_id          UUID,
  amount            NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'INR',
  close_date        DATE,
  probability       NUMERIC(5,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'open', -- open|won|lost
  won_at            TIMESTAMPTZ,
  lost_at           TIMESTAMPTZ,
  lost_reason       TEXT,
  source            TEXT,
  priority          TEXT NOT NULL DEFAULT 'medium', -- low|medium|high
  tags              JSONB NOT NULL DEFAULT '[]',
  description       TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,     -- ordering within a stage column
  stage_changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_deals_company ON crm_deals(company_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage   ON crm_deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_account ON crm_deals(account_id);

-- 6. ACTIVITIES (timeline) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,  -- call|email|meeting|task|note
  subject       TEXT NOT NULL,
  body          TEXT,
  status        TEXT NOT NULL DEFAULT 'completed', -- planned|completed|cancelled
  direction     TEXT,           -- inbound|outbound
  outcome       TEXT,           -- connected|left_voicemail|no_answer|interested|not_interested|...
  due_at        TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  duration_min  INTEGER,
  contact_id    UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  account_id    UUID REFERENCES crm_accounts(id) ON DELETE CASCADE,
  deal_id       UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  owner_id      UUID,
  created_by    UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_act_company ON crm_activities(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_act_contact ON crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_act_deal    ON crm_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_act_tasks   ON crm_activities(company_id, status, due_at);

-- 7. DEAL STAGE HISTORY (velocity / funnel analytics) ─────────
CREATE TABLE IF NOT EXISTS crm_deal_stage_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL,
  deal_id       UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  from_stage_id UUID,
  to_stage_id   UUID,
  changed_by    UUID,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_hist_deal ON crm_deal_stage_history(deal_id, changed_at);

-- 8. RLS (mirrors the established service_all pattern) ────────
ALTER TABLE crm_pipelines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_accounts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deal_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all" ON crm_pipelines          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON crm_stages             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON crm_accounts           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON crm_contacts           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON crm_deals              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON crm_activities         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_all" ON crm_deal_stage_history FOR ALL USING (true) WITH CHECK (true);

-- 9. DEFAULT PIPELINE SEEDER (idempotent) ─────────────────────
CREATE OR REPLACE FUNCTION crm_seed_default_pipeline(p_company UUID)
RETURNS UUID AS $$
DECLARE
  v_pipeline UUID;
BEGIN
  SELECT id INTO v_pipeline FROM crm_pipelines
   WHERE company_id = p_company AND is_default ORDER BY created_at LIMIT 1;
  IF v_pipeline IS NOT NULL THEN RETURN v_pipeline; END IF;

  INSERT INTO crm_pipelines (company_id, name, is_default, sort_order)
  VALUES (p_company, 'Sales Pipeline', TRUE, 0) RETURNING id INTO v_pipeline;

  INSERT INTO crm_stages (company_id, pipeline_id, name, sort_order, probability, is_won, is_lost, color) VALUES
    (p_company, v_pipeline, 'Lead In',     0, 10,  FALSE, FALSE, '#94a3b8'),
    (p_company, v_pipeline, 'Qualified',   1, 25,  FALSE, FALSE, '#3b82f6'),
    (p_company, v_pipeline, 'Proposal',    2, 50,  FALSE, FALSE, '#8b5cf6'),
    (p_company, v_pipeline, 'Negotiation', 3, 75,  FALSE, FALSE, '#f59e0b'),
    (p_company, v_pipeline, 'Won',         4, 100, TRUE,  FALSE, '#10b981'),
    (p_company, v_pipeline, 'Lost',        5, 0,   FALSE, TRUE,  '#ef4444');

  RETURN v_pipeline;
END;
$$ LANGUAGE plpgsql;

-- 10. TRIGGERS ────────────────────────────────────────────────
-- generic updated_at touch
CREATE OR REPLACE FUNCTION crm_touch_updated() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- deal: sync probability/status/stage_changed_at from the (new) stage
CREATE OR REPLACE FUNCTION crm_deal_before_ins_upd() RETURNS TRIGGER AS $$
DECLARE v_stage crm_stages%ROWTYPE;
BEGIN
  NEW.updated_at = NOW();
  SELECT * INTO v_stage FROM crm_stages WHERE id = NEW.stage_id;
  IF FOUND THEN
    IF TG_OP = 'INSERT' OR NEW.stage_id IS DISTINCT FROM OLD.stage_id THEN
      NEW.stage_changed_at = NOW();
      NEW.probability = v_stage.probability;
      IF v_stage.is_won THEN
        NEW.status = 'won'; NEW.won_at = COALESCE(NEW.won_at, NOW()); NEW.lost_at = NULL;
      ELSIF v_stage.is_lost THEN
        NEW.status = 'lost'; NEW.lost_at = COALESCE(NEW.lost_at, NOW()); NEW.won_at = NULL;
      ELSE
        NEW.status = 'open'; NEW.won_at = NULL; NEW.lost_at = NULL;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crm_deal_biu ON crm_deals;
CREATE TRIGGER trg_crm_deal_biu BEFORE INSERT OR UPDATE ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION crm_deal_before_ins_upd();

-- deal: record stage transitions to history
CREATE OR REPLACE FUNCTION crm_deal_after_upd() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage_id IS DISTINCT FROM OLD.stage_id THEN
    INSERT INTO crm_deal_stage_history (company_id, deal_id, from_stage_id, to_stage_id, changed_at)
    VALUES (NEW.company_id, NEW.id, OLD.stage_id, NEW.stage_id, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crm_deal_au ON crm_deals;
CREATE TRIGGER trg_crm_deal_au AFTER UPDATE ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION crm_deal_after_upd();

DROP TRIGGER IF EXISTS trg_crm_accounts_touch ON crm_accounts;
CREATE TRIGGER trg_crm_accounts_touch BEFORE UPDATE ON crm_accounts
  FOR EACH ROW EXECUTE FUNCTION crm_touch_updated();
DROP TRIGGER IF EXISTS trg_crm_contacts_touch ON crm_contacts;
CREATE TRIGGER trg_crm_contacts_touch BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION crm_touch_updated();

-- activity: bump last_activity_at on the linked contact / account
CREATE OR REPLACE FUNCTION crm_activity_after_ins() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE crm_contacts SET last_activity_at = NOW() WHERE id = NEW.contact_id;
  END IF;
  IF NEW.account_id IS NOT NULL THEN
    UPDATE crm_accounts SET last_activity_at = NOW() WHERE id = NEW.account_id;
  END IF;
  IF NEW.deal_id IS NOT NULL THEN
    UPDATE crm_deals SET updated_at = NOW() WHERE id = NEW.deal_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crm_activity_ai ON crm_activities;
CREATE TRIGGER trg_crm_activity_ai AFTER INSERT ON crm_activities
  FOR EACH ROW EXECUTE FUNCTION crm_activity_after_ins();
