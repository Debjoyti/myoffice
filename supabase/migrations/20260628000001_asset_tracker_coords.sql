-- Add geolocation columns to locations for optional map pins
ALTER TABLE public.zasset_locations
  ADD COLUMN IF NOT EXISTS lat  NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS lng  NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
