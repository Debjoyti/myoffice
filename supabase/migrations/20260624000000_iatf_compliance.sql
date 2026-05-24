-- ============================================================
-- IATF 16949 / ISO HR Compliance Module
-- Migration: 20260624000000_iatf_compliance.sql
-- ============================================================

-- Helper function: get company_id for a given auth user
CREATE OR REPLACE FUNCTION private.get_employee_company(uid uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT company_id FROM users WHERE id = uid LIMIT 1;
$$;

-- ============================================================
-- 1. COMPLIANCE SETTINGS (one row per company)
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  esi_enabled BOOL DEFAULT true,
  esi_wage_threshold NUMERIC DEFAULT 22000,
  esi_employer_rate NUMERIC DEFAULT 3.25,
  esi_employee_rate NUMERIC DEFAULT 0.75,
  pf_enabled BOOL DEFAULT true,
  pf_employer_rate NUMERIC DEFAULT 12.00,
  pf_employee_rate NUMERIC DEFAULT 12.00,
  vpf_allowed BOOL DEFAULT true,
  pt_enabled BOOL DEFAULT true,
  lwf_enabled BOOL DEFAULT false,
  tds_enabled BOOL DEFAULT true,
  gratuity_enabled BOOL DEFAULT true,
  notes TEXT,
  updated_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

ALTER TABLE compliance_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compliance_settings_company_isolation" ON compliance_settings
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_compliance_settings_company ON compliance_settings(company_id);

-- ============================================================
-- 2. GOVERNMENT NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS govt_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('ESI','PF','PT','TDS','LWF')),
  period_month INT,
  period_year INT,
  due_date DATE NOT NULL,
  amount_due NUMERIC,
  amount_paid NUMERIC,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','filed','overdue','waived')),
  filed_date DATE,
  reference_number TEXT,
  filed_by UUID REFERENCES employees(id),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE govt_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "govt_notifications_company_isolation" ON govt_notifications
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_govt_notifications_company ON govt_notifications(company_id);

-- ============================================================
-- 3. JOB DESCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id),
  title VARCHAR(255) NOT NULL,
  purpose TEXT,
  key_responsibilities JSONB DEFAULT '[]',
  qualifications JSONB DEFAULT '[]',
  required_skills JSONB DEFAULT '[]',
  experience_years_min INT DEFAULT 0,
  experience_years_max INT,
  key_performance_indicators JSONB DEFAULT '[]',
  reporting_to VARCHAR(255),
  version INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  created_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  effective_date DATE,
  document_number VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_descriptions_company_isolation" ON job_descriptions
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_job_descriptions_company ON job_descriptions(company_id);

-- ============================================================
-- 4. SKILL DEFINITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS skill_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  proficiency_scale JSONB DEFAULT '[{"level":0,"label":"None"},{"level":1,"label":"Aware"},{"level":2,"label":"Basic"},{"level":3,"label":"Proficient"},{"level":4,"label":"Expert"}]',
  is_active BOOL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE skill_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill_definitions_company_isolation" ON skill_definitions
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_skill_definitions_company ON skill_definitions(company_id);

-- ============================================================
-- 5. SKILL MATRIX ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS skill_matrix_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  skill_id UUID NOT NULL REFERENCES skill_definitions(id),
  current_level INT DEFAULT 0,
  target_level INT DEFAULT 2,
  assessed_by UUID REFERENCES employees(id),
  assessed_at DATE,
  next_review_date DATE,
  training_required BOOL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, skill_id)
);

ALTER TABLE skill_matrix_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill_matrix_entries_company_isolation" ON skill_matrix_entries
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_skill_matrix_entries_company ON skill_matrix_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_skill_matrix_entries_employee ON skill_matrix_entries(employee_id);

-- ============================================================
-- 6. COMPETENCY DEFINITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS competency_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  assessment_criteria TEXT,
  is_active BOOL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE competency_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competency_definitions_company_isolation" ON competency_definitions
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_competency_definitions_company ON competency_definitions(company_id);

-- ============================================================
-- 7. COMPETENCE MATRIX ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS competence_matrix_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id),
  designation VARCHAR(255) NOT NULL,
  competency_id UUID NOT NULL REFERENCES competency_definitions(id),
  required_level INT DEFAULT 1,
  is_mandatory BOOL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE competence_matrix_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competence_matrix_entries_company_isolation" ON competence_matrix_entries
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_competence_matrix_entries_company ON competence_matrix_entries(company_id);

-- ============================================================
-- 8. RESPONSIBILITY MATRICES
-- ============================================================
CREATE TABLE IF NOT EXISTS responsibility_matrices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  process_name VARCHAR(255),
  description TEXT,
  version INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'draft',
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE responsibility_matrices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "responsibility_matrices_company_isolation" ON responsibility_matrices
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_responsibility_matrices_company ON responsibility_matrices(company_id);

-- ============================================================
-- 9. RESPONSIBILITY MATRIX ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS responsibility_matrix_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  matrix_id UUID NOT NULL REFERENCES responsibility_matrices(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  process_activity TEXT NOT NULL,
  raci_role VARCHAR(20) NOT NULL CHECK (raci_role IN ('Responsible','Accountable','Consulted','Informed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE responsibility_matrix_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "responsibility_matrix_entries_company_isolation" ON responsibility_matrix_entries
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_responsibility_matrix_entries_company ON responsibility_matrix_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_responsibility_matrix_entries_employee ON responsibility_matrix_entries(employee_id);

-- ============================================================
-- 10. PROCESS APPROACHES
-- ============================================================
CREATE TABLE IF NOT EXISTS process_approaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  process_type VARCHAR(30) NOT NULL CHECK (process_type IN ('motivation','training')),
  title VARCHAR(255) NOT NULL,
  objective TEXT,
  scope TEXT,
  process_owner_id UUID REFERENCES employees(id),
  inputs JSONB DEFAULT '[]',
  outputs JSONB DEFAULT '[]',
  activities JSONB DEFAULT '[]',
  resources JSONB DEFAULT '[]',
  controls JSONB DEFAULT '[]',
  kpis JSONB DEFAULT '[]',
  risks JSONB DEFAULT '[]',
  version INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'draft',
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE process_approaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "process_approaches_company_isolation" ON process_approaches
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_process_approaches_company ON process_approaches(company_id);

-- ============================================================
-- 11. TURTLE DIAGRAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS turtle_diagrams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  process_approach_id UUID REFERENCES process_approaches(id),
  process_name VARCHAR(255) NOT NULL,
  process_owner_id UUID REFERENCES employees(id),
  input_what TEXT,
  who_persons TEXT,
  how_documents TEXT,
  what_equipment TEXT,
  output_what TEXT,
  how_do_we_know_kpis TEXT,
  controls_standards TEXT,
  version INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'draft',
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE turtle_diagrams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "turtle_diagrams_company_isolation" ON turtle_diagrams
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_turtle_diagrams_company ON turtle_diagrams(company_id);

-- ============================================================
-- 12. INDUCTION PROGRAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS induction_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  topics JSONB DEFAULT '[]',
  total_duration_hours NUMERIC DEFAULT 0,
  version INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'draft',
  created_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  effective_from DATE,
  is_active BOOL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE induction_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "induction_programs_company_isolation" ON induction_programs
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_induction_programs_company ON induction_programs(company_id);

-- ============================================================
-- 13. INDUCTION RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS induction_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  program_id UUID NOT NULL REFERENCES induction_programs(id),
  scheduled_date DATE,
  completed_date DATE,
  topics_completed JSONB DEFAULT '[]',
  overall_score NUMERIC,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','failed')),
  remarks TEXT,
  conducted_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE induction_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "induction_records_company_isolation" ON induction_records
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_induction_records_company ON induction_records(company_id);
CREATE INDEX IF NOT EXISTS idx_induction_records_employee ON induction_records(employee_id);

-- ============================================================
-- 14. SATISFACTION ASSESSMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS satisfaction_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assessment_year INT NOT NULL,
  assessment_period VARCHAR(10) NOT NULL CHECK (assessment_period IN ('H1','H2','Annual','Q1','Q2','Q3','Q4')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  questions JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','open','closed')),
  target_departments JSONB DEFAULT '[]',
  is_anonymous BOOL DEFAULT true,
  response_deadline DATE,
  created_by UUID REFERENCES employees(id),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE satisfaction_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "satisfaction_assessments_company_isolation" ON satisfaction_assessments
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_satisfaction_assessments_company ON satisfaction_assessments(company_id);

-- ============================================================
-- 15. SATISFACTION RESPONSES
-- ============================================================
CREATE TABLE IF NOT EXISTS satisfaction_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES satisfaction_assessments(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  responses JSONB NOT NULL DEFAULT '[]',
  overall_score NUMERIC,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id, employee_id)
);

ALTER TABLE satisfaction_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "satisfaction_responses_company_isolation" ON satisfaction_responses
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_satisfaction_responses_company ON satisfaction_responses(company_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_responses_employee ON satisfaction_responses(employee_id);

-- ============================================================
-- 16. ANNUAL TRAINING CALENDARS
-- ============================================================
CREATE TABLE IF NOT EXISTS annual_training_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  year INT NOT NULL,
  title VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','approved','active','closed')),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  budget_allocated NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, year)
);

ALTER TABLE annual_training_calendars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "annual_training_calendars_company_isolation" ON annual_training_calendars
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_annual_training_calendars_company ON annual_training_calendars(company_id);

-- ============================================================
-- 17. TRAINING CALENDAR ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS training_calendar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  calendar_id UUID NOT NULL REFERENCES annual_training_calendars(id) ON DELETE CASCADE,
  training_title VARCHAR(255) NOT NULL,
  training_type VARCHAR(50) NOT NULL CHECK (training_type IN ('technical','behavioural','safety','compliance','ojt','induction')),
  target_audience TEXT,
  target_departments JSONB DEFAULT '[]',
  scheduled_month INT NOT NULL,
  scheduled_date DATE,
  duration_hours NUMERIC NOT NULL,
  trainer_type VARCHAR(20) NOT NULL CHECK (trainer_type IN ('internal','external')),
  trainer_name TEXT,
  venue TEXT,
  max_participants INT,
  estimated_cost NUMERIC,
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned','scheduled','completed','cancelled')),
  actual_date DATE,
  completion_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE training_calendar_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_calendar_items_company_isolation" ON training_calendar_items
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_training_calendar_items_company ON training_calendar_items(company_id);

-- ============================================================
-- 18. TRAINING SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  calendar_item_id UUID REFERENCES training_calendar_items(id),
  session_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  actual_duration_hours NUMERIC,
  venue TEXT,
  trainer_name TEXT NOT NULL,
  trainer_type VARCHAR(20) DEFAULT 'internal',
  training_title VARCHAR(255) NOT NULL,
  training_type VARCHAR(50),
  objectives TEXT,
  topics_covered JSONB DEFAULT '[]',
  pre_test_conducted BOOL DEFAULT false,
  post_test_conducted BOOL DEFAULT false,
  max_participants INT,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','ongoing','completed','cancelled')),
  conducted_by UUID REFERENCES employees(id),
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_sessions_company_isolation" ON training_sessions
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_training_sessions_company ON training_sessions(company_id);

-- ============================================================
-- 19. TRAINING ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS training_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  attendance_status VARCHAR(20) DEFAULT 'present' CHECK (attendance_status IN ('present','absent','partial')),
  arrival_time TIME,
  departure_time TIME,
  signature_obtained BOOL DEFAULT false,
  pre_test_score NUMERIC,
  post_test_score NUMERIC,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, employee_id)
);

ALTER TABLE training_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_attendance_company_isolation" ON training_attendance
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_training_attendance_company ON training_attendance(company_id);
CREATE INDEX IF NOT EXISTS idx_training_attendance_employee ON training_attendance(employee_id);

-- ============================================================
-- 20. TRAINING FEEDBACK
-- ============================================================
CREATE TABLE IF NOT EXISTS training_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  content_rating INT CHECK (content_rating BETWEEN 1 AND 5),
  trainer_rating INT CHECK (trainer_rating BETWEEN 1 AND 5),
  venue_rating INT CHECK (venue_rating BETWEEN 1 AND 5),
  material_rating INT CHECK (material_rating BETWEEN 1 AND 5),
  overall_rating INT CHECK (overall_rating BETWEEN 1 AND 5),
  what_did_you_learn TEXT,
  how_will_you_apply TEXT,
  suggestions TEXT,
  most_useful_aspect TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, employee_id)
);

ALTER TABLE training_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_feedback_company_isolation" ON training_feedback
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_training_feedback_company ON training_feedback(company_id);
CREATE INDEX IF NOT EXISTS idx_training_feedback_employee ON training_feedback(employee_id);

-- ============================================================
-- 21. TRAINING EFFECTIVENESS REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS training_effectiveness_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  review_type VARCHAR(20) NOT NULL CHECK (review_type IN ('management','general')),
  review_period_days INT DEFAULT 30,
  review_date DATE,
  reviewer_id UUID REFERENCES employees(id),
  objectives_achieved BOOL,
  knowledge_applied TEXT,
  behavior_change_observed TEXT,
  business_impact TEXT,
  effectiveness_score INT CHECK (effectiveness_score BETWEEN 1 AND 5),
  overall_effective BOOL,
  comments TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, employee_id, review_type)
);

ALTER TABLE training_effectiveness_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_effectiveness_reviews_company_isolation" ON training_effectiveness_reviews
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_training_effectiveness_reviews_company ON training_effectiveness_reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_training_effectiveness_reviews_employee ON training_effectiveness_reviews(employee_id);

-- ============================================================
-- 22. OJT RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS ojt_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  mentor_id UUID NOT NULL REFERENCES employees(id),
  department_id UUID REFERENCES departments(id),
  job_title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  objectives JSONB DEFAULT '[]',
  competencies_to_develop JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned','ongoing','completed','evaluated')),
  daily_logs JSONB DEFAULT '[]',
  final_assessment_score NUMERIC,
  mentor_remarks TEXT,
  employee_feedback TEXT,
  hr_remarks TEXT,
  approved_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ojt_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ojt_records_company_isolation" ON ojt_records
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_ojt_records_company ON ojt_records(company_id);
CREATE INDEX IF NOT EXISTS idx_ojt_records_employee ON ojt_records(employee_id);

-- ============================================================
-- 23. KAIZEN SUGGESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS kaizen_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  suggestion_number VARCHAR(20),
  submitted_by UUID NOT NULL REFERENCES employees(id),
  department_id UUID REFERENCES departments(id),
  title VARCHAR(255) NOT NULL,
  problem_description TEXT NOT NULL,
  proposed_solution TEXT NOT NULL,
  expected_benefit TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('safety','quality','productivity','cost','environment','morale')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status VARCHAR(30) DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','approved','rejected','implementing','implemented','verified')),
  submission_date DATE DEFAULT CURRENT_DATE,
  target_date DATE,
  implementation_date DATE,
  rejection_reason TEXT,
  reward_points INT DEFAULT 0,
  reviewed_by UUID REFERENCES employees(id),
  review_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE kaizen_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kaizen_suggestions_company_isolation" ON kaizen_suggestions
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_kaizen_suggestions_company ON kaizen_suggestions(company_id);
CREATE INDEX IF NOT EXISTS idx_kaizen_suggestions_employee ON kaizen_suggestions(submitted_by);

-- ============================================================
-- 24. KAIZEN SHEETS
-- ============================================================
CREATE TABLE IF NOT EXISTS kaizen_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  suggestion_id UUID NOT NULL UNIQUE REFERENCES kaizen_suggestions(id) ON DELETE CASCADE,
  before_description TEXT,
  after_description TEXT,
  implementation_steps JSONB DEFAULT '[]',
  actual_benefit TEXT,
  cost_savings NUMERIC,
  time_savings_hours NUMERIC,
  defect_reduction_percent NUMERIC,
  lessons_learned TEXT,
  before_photo_urls JSONB DEFAULT '[]',
  after_photo_urls JSONB DEFAULT '[]',
  verified_by UUID REFERENCES employees(id),
  verification_date DATE,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','closed')),
  verification_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE kaizen_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kaizen_sheets_company_isolation" ON kaizen_sheets
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_kaizen_sheets_company ON kaizen_sheets(company_id);

-- ============================================================
-- 25. ACTION IMPROVEMENT PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS action_improvement_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_type VARCHAR(30) NOT NULL CHECK (plan_type IN ('motivation','training_gap','compliance','kaizen','audit_finding')),
  title VARCHAR(255) NOT NULL,
  identified_by UUID REFERENCES employees(id),
  department_id UUID REFERENCES departments(id),
  employee_id UUID REFERENCES employees(id),
  problem_statement TEXT,
  root_cause TEXT,
  action_description TEXT NOT NULL,
  responsible_person_id UUID REFERENCES employees(id),
  target_date DATE NOT NULL,
  actual_completion_date DATE,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','overdue','cancelled')),
  effectiveness_review_due DATE,
  effectiveness_score INT CHECK (effectiveness_score BETWEEN 1 AND 5),
  effectiveness_notes TEXT,
  evidence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE action_improvement_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "action_improvement_plans_company_isolation" ON action_improvement_plans
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_action_improvement_plans_company ON action_improvement_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_action_improvement_plans_employee ON action_improvement_plans(employee_id);

-- ============================================================
-- 26. DOCUMENT VERSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  version_number INT NOT NULL,
  change_summary TEXT,
  content_snapshot JSONB,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module, entity_id, version_number)
);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "document_versions_company_isolation" ON document_versions
  USING (company_id IN (SELECT company_id FROM employees WHERE user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_document_versions_company ON document_versions(company_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_entity ON document_versions(entity_id);
