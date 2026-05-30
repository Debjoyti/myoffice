-- ═══════════════════════════════════════════════════════════════
-- Maintenance Department Module
-- ═══════════════════════════════════════════════════════════════

-- Equipment Categories
CREATE TABLE IF NOT EXISTS public.maint_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code        text NOT NULL,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

-- Locations / Plant Sections / Rooms / Function Locations
CREATE TABLE IF NOT EXISTS public.maint_locations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('location','room','plant_section','function_location')),
  name         text NOT NULL,
  parent_id    uuid REFERENCES public.maint_locations(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Object Types
CREATE TABLE IF NOT EXISTS public.maint_object_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Equipment (master)
CREATE TABLE IF NOT EXISTS public.maint_equipment (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  equipment_number      text UNIQUE,
  description           text NOT NULL,
  category_id           uuid REFERENCES public.maint_categories(id),
  object_type_id        uuid REFERENCES public.maint_object_types(id),
  location_id           uuid REFERENCES public.maint_locations(id),
  plant_section_id      uuid REFERENCES public.maint_locations(id),
  function_location_id  uuid REFERENCES public.maint_locations(id),
  room_id               uuid REFERENCES public.maint_locations(id),
  abc_indicator         text CHECK (abc_indicator IN ('A','B','C')),
  plant_code            text,
  company_code          text,
  planning_plant        text,
  work_center           text,
  weight_kg             numeric,
  width                 numeric,
  height                numeric,
  length                numeric,
  dimension_unit        text DEFAULT 'mm',
  invoice_number        text,
  invoice_date          date,
  assets_number         text,
  valid_from            date,
  valid_to              date,
  install_date          date,
  electricity_meter_number text,
  -- Manufacturer
  manufacturer_name     text,
  manufacturer_country  text,
  model_number          text,
  manufacture_date      text,
  manufacture_part_number text,
  manufacture_serial_number text,
  status                text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','under_repair','retired')),
  created_by            uuid REFERENCES public.employees(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Equipment material details (BOM-lite)
CREATE TABLE IF NOT EXISTS public.maint_equipment_materials (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id    uuid NOT NULL REFERENCES public.maint_equipment(id) ON DELETE CASCADE,
  sr_no           int NOT NULL,
  material_code   text,
  description     text,
  qty             numeric,
  unit            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Task Lists (preventive/predictive task definitions)
CREATE TABLE IF NOT EXISTS public.maint_task_lists (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  equipment_id          uuid REFERENCES public.maint_equipment(id) ON DELETE CASCADE,
  operation             text NOT NULL,
  sub_operation         text,
  group_name            text,
  work_center           text,
  description           text NOT NULL,
  control_key           text,
  work_hours            numeric,
  number_of_workers     int DEFAULT 1,
  normal_duration       numeric,
  percentage            numeric,
  preventive_schedule_months numeric,
  predictive_schedule   text,
  task_list_code        text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- CAPA Codes
CREATE TABLE IF NOT EXISTS public.maint_capa_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code        text NOT NULL,
  description text NOT NULL,
  type        text CHECK (type IN ('why','activity')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

-- Breakdown / Malfunction Notifications
CREATE TABLE IF NOT EXISTS public.maint_breakdowns (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  notification_number   text UNIQUE,
  equipment_id          uuid REFERENCES public.maint_equipment(id),
  function_location_id  uuid REFERENCES public.maint_locations(id),
  notification_text     text,
  employee_id           uuid REFERENCES public.employees(id),
  department            text,
  malfunction_start     timestamptz,
  malfunction_end       timestamptz,
  is_breakdown          boolean DEFAULT false,
  breakdown_hours       numeric GENERATED ALWAYS AS (
    CASE WHEN malfunction_end IS NOT NULL AND malfunction_start IS NOT NULL
         THEN EXTRACT(EPOCH FROM (malfunction_end - malfunction_start)) / 3600
         ELSE NULL END
  ) STORED,
  maint_work_center     text,
  maint_work_sub_center text,
  status                text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','closed')),
  closed_at             timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- BD Notification material usage
CREATE TABLE IF NOT EXISTS public.maint_bd_materials (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id        uuid NOT NULL REFERENCES public.maint_breakdowns(id) ON DELETE CASCADE,
  sr_no               int,
  material_code       text,
  description         text,
  qty                 numeric,
  unit                text,
  store_location      text,
  where_used          text,
  receiver_employee_id uuid REFERENCES public.employees(id)
);

-- Maintenance team assignment per notification
CREATE TABLE IF NOT EXISTS public.maint_bd_team (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id    uuid NOT NULL REFERENCES public.maint_breakdowns(id) ON DELETE CASCADE,
  employee_id     uuid REFERENCES public.employees(id),
  remarks         text,
  maintenance_end timestamptz
);

-- Why-Why Analysis
CREATE TABLE IF NOT EXISTS public.maint_why_why (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breakdown_id        uuid NOT NULL REFERENCES public.maint_breakdowns(id) ON DELETE CASCADE,
  equipment_id        uuid REFERENCES public.maint_equipment(id),
  objective_damage    text,
  notification_number text,
  -- 5 Whys + RCA
  why1 text, why1_code text, why1_text text,
  why2 text, why2_code text, why2_text text,
  why3 text, why3_code text, why3_text text,
  why4 text, why4_code text, why4_text text,
  why5 text, why5_code text, why5_text text,
  rca  text, rca_code  text, rca_text  text,
  -- Activities (C, CA, PA)
  correction text, correction_code text, correction_text text,
  corrective_action text, ca_code text, ca_text text,
  preventive_action text, pa_code text, pa_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Electricity Meters
CREATE TABLE IF NOT EXISTS public.maint_electricity_meters (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  meter_number  text NOT NULL,
  meter_name    text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, meter_number)
);

-- Electricity daily readings
CREATE TABLE IF NOT EXISTS public.maint_meter_readings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id    uuid NOT NULL REFERENCES public.maint_electricity_meters(id) ON DELETE CASCADE,
  reading_date date NOT NULL,
  units_consumed numeric,
  recorded_by uuid REFERENCES public.employees(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meter_id, reading_date)
);

-- Preventive / Predictive Maintenance Plans
CREATE TABLE IF NOT EXISTS public.maint_pm_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  equipment_id    uuid REFERENCES public.maint_equipment(id),
  plan_type       text NOT NULL CHECK (plan_type IN ('preventive','predictive')),
  scheduled_month int CHECK (scheduled_month BETWEEN 1 AND 12),
  scheduled_year  int,
  task_list_id    uuid REFERENCES public.maint_task_lists(id),
  status          text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','done','skipped')),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE public.maint_categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maint_locations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maint_object_types         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maint_equipment            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maint_equipment_materials  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maint_task_lists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maint_capa_codes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maint_breakdowns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maint_bd_materials         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maint_bd_team              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maint_why_why              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maint_electricity_meters   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maint_meter_readings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maint_pm_plans             ENABLE ROW LEVEL SECURITY;

-- All company members can read; admin/hr/manager can write
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'maint_categories','maint_locations','maint_object_types','maint_equipment',
    'maint_equipment_materials','maint_task_lists','maint_capa_codes','maint_breakdowns',
    'maint_bd_materials','maint_bd_team','maint_why_why',
    'maint_electricity_meters','maint_meter_readings','maint_pm_plans'
  ] LOOP
    EXECUTE format($$
      CREATE POLICY %I ON public.%I FOR SELECT USING (
        true
      )$$, t||'_read', t);
    EXECUTE format($$
      CREATE POLICY %I ON public.%I FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.employees e
          WHERE e.user_id = auth.uid()
          AND e.role IN ('admin','hr','manager')
        )
      )$$, t||'_write', t);
  END LOOP;
END $$;

-- Auto-generate equipment numbers
CREATE SEQUENCE IF NOT EXISTS maint_equipment_seq START 1000;
CREATE OR REPLACE FUNCTION public.set_equipment_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.equipment_number IS NULL THEN
    NEW.equipment_number := 'EQ-' || LPAD(nextval('maint_equipment_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER equipment_number_trigger
  BEFORE INSERT ON public.maint_equipment
  FOR EACH ROW EXECUTE FUNCTION public.set_equipment_number();

-- Auto-generate notification numbers
CREATE SEQUENCE IF NOT EXISTS maint_notification_seq START 100000;
CREATE OR REPLACE FUNCTION public.set_notification_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.notification_number IS NULL THEN
    NEW.notification_number := 'BD-' || LPAD(nextval('maint_notification_seq')::text, 7, '0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER notification_number_trigger
  BEFORE INSERT ON public.maint_breakdowns
  FOR EACH ROW EXECUTE FUNCTION public.set_notification_number();

-- Seed default categories (matches Excel sheet)
INSERT INTO public.maint_categories (company_id, code, name)
SELECT c.id, v.code, v.name
FROM public.companies c
CROSS JOIN (VALUES
  ('C','Construction Machine'),('D','DSD Vehicle'),('G','GG Equip Category'),
  ('H','Medical Device'),('I','IT Equipment'),('J','Containers'),
  ('L','Liner Equipment'),('M','Machines'),('N','Mining Equipment'),
  ('O','Transmitter Equipment'),('P','Production Resources / Tools'),
  ('Q','Test/Measurement Equipment'),('R','RFID Equipment'),
  ('S','Customer Equipment'),('T','Transport Equipment'),
  ('V','Vehicles'),('X','Equipment Services')
) AS v(code, name)
ON CONFLICT DO NOTHING;
