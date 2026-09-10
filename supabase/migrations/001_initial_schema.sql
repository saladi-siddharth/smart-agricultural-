-- ============================================
-- FARMPILOT — INITIAL DATABASE SCHEMA
-- 12 Tables | Full Constraints | Indexes
-- ============================================

-- ============================================
-- 1. PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. FARMS
-- ============================================
CREATE TABLE IF NOT EXISTS public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT DEFAULT '',
  district TEXT DEFAULT '',
  state TEXT DEFAULT '',
  total_area NUMERIC NOT NULL DEFAULT 0 CHECK (total_area >= 0),
  area_unit TEXT NOT NULL DEFAULT 'acres' CHECK (area_unit IN ('acres', 'hectares', 'bigha', 'sq_meters')),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_farms_owner ON public.farms(owner_id);

-- ============================================
-- 3. FIELDS
-- ============================================
CREATE TABLE IF NOT EXISTS public.fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area NUMERIC NOT NULL DEFAULT 0 CHECK (area >= 0),
  area_unit TEXT NOT NULL DEFAULT 'acres' CHECK (area_unit IN ('acres', 'hectares', 'bigha', 'sq_meters')),
  soil_type TEXT DEFAULT '',
  irrigation_type TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fields_farm ON public.fields(farm_id);

-- ============================================
-- 4. CROP CYCLES
-- ============================================
CREATE TABLE IF NOT EXISTS public.crop_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  variety TEXT DEFAULT '',
  season TEXT NOT NULL DEFAULT 'Kharif' CHECK (season IN ('Kharif', 'Rabi', 'Zaid', 'Annual')),
  start_date DATE NOT NULL,
  expected_harvest_date DATE,
  status TEXT NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  target_yield NUMERIC DEFAULT 0 CHECK (target_yield >= 0),
  yield_unit TEXT NOT NULL DEFAULT 'tonnes' CHECK (yield_unit IN ('tonnes', 'quintals', 'kg')),
  selling_price_per_unit NUMERIC DEFAULT 0 CHECK (selling_price_per_unit >= 0),
  planned_budget NUMERIC DEFAULT 0 CHECK (planned_budget >= 0),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crop_cycles_farm ON public.crop_cycles(farm_id);
CREATE INDEX idx_crop_cycles_field ON public.crop_cycles(field_id);

-- ============================================
-- 5. ACTIVITIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  activity_type TEXT NOT NULL DEFAULT 'OTHER' CHECK (activity_type IN (
    'LAND_PREPARATION', 'SOWING', 'IRRIGATION', 'FERTILIZATION',
    'PEST_INSPECTION', 'WEEDING', 'SPRAYING', 'HARVEST', 'OTHER'
  )),
  planned_date DATE NOT NULL,
  completed_date DATE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  estimated_cost NUMERIC DEFAULT 0 CHECK (estimated_cost >= 0),
  actual_cost NUMERIC DEFAULT 0 CHECK (actual_cost >= 0),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_crop_cycle ON public.activities(crop_cycle_id);
CREATE INDEX idx_activities_farm ON public.activities(farm_id);
CREATE INDEX idx_activities_planned_date ON public.activities(planned_date);
CREATE INDEX idx_activities_status ON public.activities(status);

-- ============================================
-- 6. INPUTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  input_type TEXT NOT NULL DEFAULT 'OTHER' CHECK (input_type IN (
    'SEED', 'FERTILIZER', 'PESTICIDE', 'HERBICIDE', 'ORGANIC_MANURE', 'OTHER'
  )),
  quantity NUMERIC NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  cost NUMERIC NOT NULL DEFAULT 0 CHECK (cost >= 0),
  used_date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inputs_crop_cycle ON public.inputs(crop_cycle_id);
CREATE INDEX idx_inputs_farm ON public.inputs(farm_id);

-- ============================================
-- 7. EXPENSES
-- ============================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'OTHER' CHECK (category IN (
    'SEEDS', 'FERTILIZER', 'LABOR', 'IRRIGATION', 'PEST_CONTROL',
    'MACHINERY', 'TRANSPORT', 'OTHER'
  )),
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0 CHECK (amount >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_crop_cycle ON public.expenses(crop_cycle_id);
CREATE INDEX idx_expenses_farm ON public.expenses(farm_id);

-- ============================================
-- 8. IRRIGATION LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.irrigation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE CASCADE,
  irrigation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  water_source TEXT DEFAULT '' CHECK (water_source IN ('', 'CANAL', 'BOREWELL', 'RIVER', 'RAINWATER', 'POND', 'OTHER')),
  duration_minutes INTEGER DEFAULT 0 CHECK (duration_minutes >= 0),
  water_quantity NUMERIC DEFAULT 0 CHECK (water_quantity >= 0),
  water_unit TEXT DEFAULT 'liters' CHECK (water_unit IN ('liters', 'gallons', 'cubic_meters')),
  cost NUMERIC DEFAULT 0 CHECK (cost >= 0),
  method TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_irrigation_crop_cycle ON public.irrigation_logs(crop_cycle_id);
CREATE INDEX idx_irrigation_farm ON public.irrigation_logs(farm_id);

-- ============================================
-- 9. HARVESTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE CASCADE,
  harvest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  actual_yield NUMERIC DEFAULT 0 CHECK (actual_yield >= 0),
  yield_unit TEXT NOT NULL DEFAULT 'tonnes' CHECK (yield_unit IN ('tonnes', 'quintals', 'kg')),
  selling_price NUMERIC DEFAULT 0 CHECK (selling_price >= 0),
  revenue NUMERIC GENERATED ALWAYS AS (actual_yield * selling_price) STORED,
  quality TEXT DEFAULT 'GOOD' CHECK (quality IN ('EXCELLENT', 'GOOD', 'AVERAGE', 'POOR')),
  buyer TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_harvests_crop_cycle ON public.harvests(crop_cycle_id);
CREATE INDEX idx_harvests_farm ON public.harvests(farm_id);

-- ============================================
-- 10. ALERTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'INFO' CHECK (alert_type IN (
    'OVERDUE_TASK', 'COST_WARNING', 'PROGRESS_WARNING',
    'PROFIT_WARNING', 'IRRIGATION_REMINDER', 'POSITIVE', 'INFO'
  )),
  severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL', 'SUCCESS')),
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  recommendation TEXT DEFAULT '',
  source_data TEXT DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_owner ON public.alerts(owner_id);
CREATE INDEX idx_alerts_farm ON public.alerts(farm_id);
CREATE INDEX idx_alerts_resolved ON public.alerts(is_resolved);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'profiles', 'farms', 'fields', 'crop_cycles',
    'activities', 'expenses'
  ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();',
      tbl, tbl
    );
  END LOOP;
END $$;
