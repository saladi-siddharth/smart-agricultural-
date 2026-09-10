-- ============================================================
-- FARMPILOT PHASE 2: AGRICULTURAL INTELLIGENCE EXTENSION
-- Migration: 005_agricultural_intelligence.sql
-- Supports: Crop Templates, Stages, Recommendations, Journal, Dependencies
-- ============================================================

-- 1. CROP TEMPLATES
CREATE TABLE IF NOT EXISTS public.crop_templates (
  id TEXT PRIMARY KEY,
  crop_name TEXT NOT NULL,
  variety TEXT NOT NULL DEFAULT '',
  season TEXT NOT NULL DEFAULT 'Kharif',
  typical_duration_days INTEGER NOT NULL DEFAULT 120,
  target_yield_per_acre NUMERIC NOT NULL DEFAULT 4.0,
  yield_unit TEXT NOT NULL DEFAULT 'tonnes',
  benchmark_cost_per_acre NUMERIC NOT NULL DEFAULT 50000,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CROP TEMPLATE STAGES
CREATE TABLE IF NOT EXISTS public.crop_template_stages (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES public.crop_templates(id) ON DELETE CASCADE,
  stage_order INTEGER NOT NULL DEFAULT 1,
  stage_name TEXT NOT NULL,
  start_day INTEGER NOT NULL DEFAULT 1,
  end_day INTEGER NOT NULL DEFAULT 15,
  critical_operations TEXT[] DEFAULT '{}',
  risk_indicators TEXT[] DEFAULT '{}',
  water_requirement_level TEXT DEFAULT 'MEDIUM' CHECK (water_requirement_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  notes TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_template_stages_tmpl ON public.crop_template_stages(template_id);

-- 3. ACTIVITY DEPENDENCIES
CREATE TABLE IF NOT EXISTS public.activity_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  successor_activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'FINISH_TO_START' CHECK (dependency_type IN ('FINISH_TO_START', 'START_TO_START')),
  lag_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(predecessor_activity_id, successor_activity_id)
);

CREATE INDEX IF NOT EXISTS idx_act_dep_pred ON public.activity_dependencies(predecessor_activity_id);
CREATE INDEX IF NOT EXISTS idx_act_dep_succ ON public.activity_dependencies(successor_activity_id);

-- 4. RECOMMENDATIONS LIFECYCLE
CREATE TABLE IF NOT EXISTS public.recommendations (
  id TEXT PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  category TEXT NOT NULL DEFAULT 'OPERATIONAL',
  trigger_reason TEXT NOT NULL DEFAULT '',
  agricultural_context TEXT NOT NULL DEFAULT '',
  data_considered JSONB DEFAULT '{}'::jsonb,
  why_explanation TEXT NOT NULL DEFAULT '',
  impact_explanation TEXT NOT NULL DEFAULT '',
  recommended_action TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'VIEWED', 'ACCEPTED', 'DISMISSED', 'COMPLETED')),
  user_override_action TEXT DEFAULT NULL,
  user_override_reason TEXT DEFAULT NULL,
  feedback TEXT DEFAULT NULL CHECK (feedback IN (NULL, 'HELPFUL', 'NOT_USEFUL')),
  feedback_notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_farm ON public.recommendations(farm_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_cycle ON public.recommendations(crop_cycle_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON public.recommendations(status);

-- 5. OPERATIONAL JOURNAL (Farm Operational Memory)
CREATE TABLE IF NOT EXISTS public.operational_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'ACTIVITY_COMPLETED', 'ACTIVITY_OVERDUE', 'INPUT_APPLIED',
    'EXPENSE_RECORDED', 'IRRIGATION_LOGGED', 'RISK_DETECTED',
    'RISK_RESOLVED', 'RECOMMENDATION_ACCEPTED', 'USER_OVERRIDE'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_farm ON public.operational_journal(farm_id);
CREATE INDEX IF NOT EXISTS idx_journal_event ON public.operational_journal(event_type);
CREATE INDEX IF NOT EXISTS idx_journal_created ON public.operational_journal(created_at DESC);

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.crop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_template_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_journal ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES
-- Templates are readable by all authenticated users
DROP POLICY IF EXISTS "Public read access to crop templates" ON public.crop_templates;
CREATE POLICY "Public read access to crop templates"
  ON public.crop_templates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read access to crop template stages" ON public.crop_template_stages;
CREATE POLICY "Public read access to crop template stages"
  ON public.crop_template_stages FOR SELECT
  USING (true);

-- Recommendations scoped to farm / organization
DROP POLICY IF EXISTS "Users can view recommendations for their farms" ON public.recommendations;
CREATE POLICY "Users can view recommendations for their farms"
  ON public.recommendations FOR SELECT
  USING (
    farm_id IN (
      SELECT id FROM public.farms WHERE owner_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update recommendations for their farms" ON public.recommendations;
CREATE POLICY "Users can update recommendations for their farms"
  ON public.recommendations FOR UPDATE
  USING (
    farm_id IN (
      SELECT id FROM public.farms WHERE owner_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Operational journal scoped to farm / organization
DROP POLICY IF EXISTS "Users can view operational journal for their farms" ON public.operational_journal;
CREATE POLICY "Users can view operational journal for their farms"
  ON public.operational_journal FOR SELECT
  USING (
    farm_id IN (
      SELECT id FROM public.farms WHERE owner_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert operational journal for their farms" ON public.operational_journal;
CREATE POLICY "Users can insert operational journal for their farms"
  ON public.operational_journal FOR INSERT
  WITH CHECK (
    farm_id IN (
      SELECT id FROM public.farms WHERE owner_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );
