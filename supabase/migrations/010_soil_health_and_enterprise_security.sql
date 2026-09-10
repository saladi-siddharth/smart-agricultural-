-- ============================================================================
-- FarmPilot Migration 010: Soil Health, Physical/Chemical Properties, 
-- Security Audit Logs, Idempotency, and Background Jobs Schema
-- ============================================================================

-- 1. ADD CREDENTIAL & PASSWORDS COLUMNS TO PUBLIC.PROFILES (Table 17488)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='username') THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'OWNER' CHECK (role IN ('OWNER', 'MANAGER', 'WORKER', 'CONSULTANT'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='role_label') THEN
    ALTER TABLE public.profiles ADD COLUMN role_label TEXT DEFAULT 'Farm Owner & Executive';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='password_plain') THEN
    ALTER TABLE public.profiles ADD COLUMN password_plain TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='password_hash') THEN
    ALTER TABLE public.profiles ADD COLUMN password_hash TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='pin') THEN
    ALTER TABLE public.profiles ADD COLUMN pin TEXT DEFAULT '1234';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='farm_name') THEN
    ALTER TABLE public.profiles ADD COLUMN farm_name TEXT DEFAULT 'Green Valley Farm';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='assigned_parcel') THEN
    ALTER TABLE public.profiles ADD COLUMN assigned_parcel TEXT DEFAULT 'All 3 Demarcated Parcels';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='status') THEN
    ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING', 'SUSPENDED'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='permissions') THEN
    ALTER TABLE public.profiles ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_username_lookup ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. SOIL TESTS TABLE (Full Physical, Chemical, & Biological Soil Metrics)
CREATE TABLE IF NOT EXISTS public.soil_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  parcel_name TEXT NOT NULL,
  sample_id TEXT NOT NULL UNIQUE,
  sample_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sampling_depth_cm TEXT NOT NULL DEFAULT '0-15 cm (Topsoil)',
  lab_name TEXT NOT NULL DEFAULT 'Regional Agricultural Testing Laboratory (NABL Accredited)',
  
  -- Physical Properties
  soil_texture TEXT NOT NULL DEFAULT 'Clay Loam' CHECK (soil_texture IN ('Clay', 'Clay Loam', 'Sandy Loam', 'Silt Loam', 'Loamy Sand', 'Black Delta Silt')),
  bulk_density_g_cm3 NUMERIC(4,2) DEFAULT 1.32 CHECK (bulk_density_g_cm3 > 0),
  field_capacity_pct NUMERIC(5,2) NOT NULL DEFAULT 36.00 CHECK (field_capacity_pct >= 0 AND field_capacity_pct <= 100),
  wilting_point_pct NUMERIC(5,2) NOT NULL DEFAULT 16.00 CHECK (wilting_point_pct >= 0 AND wilting_point_pct <= 100),
  infiltration_rate_mm_hr NUMERIC(5,2) DEFAULT 8.50 CHECK (infiltration_rate_mm_hr >= 0),
  current_moisture_pct NUMERIC(5,2) NOT NULL DEFAULT 31.00 CHECK (current_moisture_pct >= 0 AND current_moisture_pct <= 100),

  -- Chemical & Nutrient Matrix
  ph NUMERIC(4,2) NOT NULL DEFAULT 6.80 CHECK (ph >= 0 AND ph <= 14),
  ec_ds_m NUMERIC(5,2) NOT NULL DEFAULT 0.45 CHECK (ec_ds_m >= 0),
  organic_carbon_pct NUMERIC(4,2) NOT NULL DEFAULT 0.58 CHECK (organic_carbon_pct >= 0 AND organic_carbon_pct <= 100),
  nitrogen_kg_ha NUMERIC(6,2) NOT NULL DEFAULT 265.00 CHECK (nitrogen_kg_ha >= 0),
  phosphorus_kg_ha NUMERIC(6,2) NOT NULL DEFAULT 18.50 CHECK (phosphorus_kg_ha >= 0),
  potassium_kg_ha NUMERIC(6,2) NOT NULL DEFAULT 310.00 CHECK (potassium_kg_ha >= 0),
  
  -- Micronutrients (PPM)
  zinc_ppm NUMERIC(5,2) NOT NULL DEFAULT 0.42 CHECK (zinc_ppm >= 0),
  iron_ppm NUMERIC(5,2) NOT NULL DEFAULT 5.80 CHECK (iron_ppm >= 0),
  boron_ppm NUMERIC(5,2) NOT NULL DEFAULT 0.65 CHECK (boron_ppm >= 0),
  manganese_ppm NUMERIC(5,2) NOT NULL DEFAULT 4.10 CHECK (manganese_ppm >= 0),
  copper_ppm NUMERIC(5,2) NOT NULL DEFAULT 1.20 CHECK (copper_ppm >= 0),
  sulphur_ppm NUMERIC(5,2) NOT NULL DEFAULT 14.50 CHECK (sulphur_ppm >= 0),

  -- Agronomic Evaluations & Prescriptions
  fertility_index INTEGER NOT NULL DEFAULT 74 CHECK (fertility_index >= 0 AND fertility_index <= 100),
  fertility_rating TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (fertility_rating IN ('LOW', 'MEDIUM', 'HIGH', 'EXCELLENT')),
  deficiencies_detected TEXT[] DEFAULT ARRAY['ZINC_CHLOROSIS'],
  fertilizer_recommendation JSONB NOT NULL DEFAULT '{}'::jsonb,
  soil_amendments JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  tested_by TEXT DEFAULT 'Dr. P. R. Rao (Senior Agronomist)',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_soil_tests_farm ON public.soil_tests(farm_id);
CREATE INDEX IF NOT EXISTS idx_soil_tests_field ON public.soil_tests(field_id);
CREATE INDEX IF NOT EXISTS idx_soil_tests_date ON public.soil_tests(sample_date DESC);
CREATE INDEX IF NOT EXISTS idx_soil_tests_sample_id ON public.soil_tests(sample_id);

-- 3. SECURITY AUDIT LOGS TABLE (Tamper-Evident Security & Mutation Trail)
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'TOKEN_REVOKED', 'PERMISSION_DENIED', 'PASSWORD_RESET', 'DATA_MUTATION', 'TENANT_BREACH_ATTEMPT')),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_username TEXT,
  actor_role TEXT,
  target_resource TEXT,
  target_id TEXT,
  ip_address TEXT DEFAULT '127.0.0.1',
  user_agent TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILURE', 'WARNING', 'BLOCKED')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_event ON public.security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_created ON public.security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_actor ON public.security_audit_logs(actor_id);

-- 4. IDEMPOTENCY KEYS TABLE (Prevent Duplicate Operations Across Network Drops)
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON public.idempotency_keys(expires_at);

-- 5. ASYNCHRONOUS BACKGROUND JOBS TABLE (Queue Persistence & Failure Recovery)
CREATE TABLE IF NOT EXISTS public.background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL CHECK (channel IN ('reports', 'notifications', 'analytics', 'integrations', 'image_processing')),
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('CRITICAL', 'HIGH', 'NORMAL', 'LOW')),
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'DEAD_LETTER')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_background_jobs_channel_status ON public.background_jobs(channel, status);
CREATE INDEX IF NOT EXISTS idx_background_jobs_scheduled ON public.background_jobs(scheduled_at);

-- 6. ROW-LEVEL SECURITY POLICIES FOR SOIL TESTS & AUDIT
ALTER TABLE public.soil_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS soil_tests_select_tenant ON public.soil_tests;
CREATE POLICY soil_tests_select_tenant ON public.soil_tests FOR SELECT TO authenticated
USING (
  farm_id IN (
    SELECT f.id FROM public.farms f WHERE f.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.farm_members fm WHERE fm.farm_id = soil_tests.farm_id AND fm.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.user_credentials uc WHERE uc.id = auth.uid() AND (uc.role IN ('OWNER', 'MANAGER', 'CONSULTANT'))
  )
);

DROP POLICY IF EXISTS soil_tests_modify_manager ON public.soil_tests;
CREATE POLICY soil_tests_modify_manager ON public.soil_tests FOR ALL TO authenticated
USING (
  farm_id IN (
    SELECT f.id FROM public.farms f WHERE f.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.farm_members fm WHERE fm.farm_id = soil_tests.farm_id AND fm.user_id = auth.uid() AND fm.role IN ('OWNER', 'MANAGER')
  )
)
WITH CHECK (
  farm_id IN (
    SELECT f.id FROM public.farms f WHERE f.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.farm_members fm WHERE fm.farm_id = soil_tests.farm_id AND fm.user_id = auth.uid() AND fm.role IN ('OWNER', 'MANAGER')
  )
);
