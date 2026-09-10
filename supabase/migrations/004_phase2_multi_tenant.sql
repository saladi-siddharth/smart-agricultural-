-- ============================================================
-- FARMPILOT PHASE 2: MULTI-TENANT DOMAIN MODEL & RBAC
-- Migration: 004_phase2_multi_tenant.sql
-- Hierarchy: Organization -> Farm -> Field -> Crop Cycle -> Operations
-- ============================================================

-- 1. ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  plan TEXT NOT NULL DEFAULT 'PROFESSIONAL' CHECK (plan IN ('STARTER', 'PROFESSIONAL', 'ENTERPRISE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- 2. ORGANIZATION MEMBERSHIP TABLE (RBAC)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'WORKER' CHECK (role IN ('OWNER', 'MANAGER', 'WORKER', 'CONSULTANT')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INVITED', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.organization_members(role);

-- 3. LINK FARMS TO ORGANIZATIONS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'farms' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.farms ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
    CREATE INDEX idx_farms_organization ON public.farms(organization_id);
  END IF;
END $$;

-- 4. ADD ASSIGNED_TO TO ACTIVITIES FOR TASK WORKFLOW
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.activities ADD COLUMN assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    CREATE INDEX idx_activities_assigned ON public.activities(assigned_to);
  END IF;
END $$;

-- 5. LINK ALERTS TO ORGANIZATIONS & DEDUPLICATION HASH
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'alerts' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.alerts ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
    ALTER TABLE public.alerts ADD COLUMN reference_id TEXT DEFAULT '';
    CREATE INDEX idx_alerts_org ON public.alerts(organization_id);
    CREATE INDEX idx_alerts_ref ON public.alerts(reference_id);
  END IF;
END $$;

-- 6. SECURITY HELPER: Check user's organization membership & role
CREATE OR REPLACE FUNCTION public.check_org_access(org_id UUID, allowed_roles TEXT[] DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND status = 'ACTIVE'
      AND (allowed_roles IS NULL OR role = ANY(allowed_roles))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 7. ENABLE ROW LEVEL SECURITY ON NEW ENTITIES
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Organizations RLS
DROP POLICY IF EXISTS "Members can view own organization" ON public.organizations;
CREATE POLICY "Members can view own organization"
  ON public.organizations FOR SELECT
  USING (public.check_org_access(id) OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update own organization" ON public.organizations;
CREATE POLICY "Owners can update own organization"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid() OR public.check_org_access(id, ARRAY['OWNER']))
  WITH CHECK (owner_id = auth.uid() OR public.check_org_access(id, ARRAY['OWNER']));

-- Organization Members RLS
DROP POLICY IF EXISTS "Members can view organization membership" ON public.organization_members;
CREATE POLICY "Members can view organization membership"
  ON public.organization_members FOR SELECT
  USING (public.check_org_access(organization_id) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Owners and managers can manage membership" ON public.organization_members;
CREATE POLICY "Owners and managers can manage membership"
  ON public.organization_members FOR ALL
  USING (public.check_org_access(organization_id, ARRAY['OWNER', 'MANAGER']))
  WITH CHECK (public.check_org_access(organization_id, ARRAY['OWNER', 'MANAGER']));

-- Farms RLS updated for organization scope
DROP POLICY IF EXISTS "Users can view own farms" ON public.farms;
CREATE POLICY "Users can view own or org farms"
  ON public.farms FOR SELECT
  USING (
    owner_id = auth.uid() 
    OR (organization_id IS NOT NULL AND public.check_org_access(organization_id))
  );

DROP POLICY IF EXISTS "Users can create farms" ON public.farms;
CREATE POLICY "Owners and managers can create farms"
  ON public.farms FOR INSERT
  WITH CHECK (
    owner_id = auth.uid() 
    OR (organization_id IS NOT NULL AND public.check_org_access(organization_id, ARRAY['OWNER', 'MANAGER']))
  );

DROP POLICY IF EXISTS "Users can update own farms" ON public.farms;
CREATE POLICY "Owners and managers can update farms"
  ON public.farms FOR UPDATE
  USING (
    owner_id = auth.uid() 
    OR (organization_id IS NOT NULL AND public.check_org_access(organization_id, ARRAY['OWNER', 'MANAGER']))
  );

-- 8. SEED DEFAULT ORGANIZATION & MEMBERS
DO $$
DECLARE
  v_owner_id UUID;
  v_org_id UUID;
BEGIN
  -- Get or use demo owner
  SELECT id INTO v_owner_id FROM public.profiles WHERE email = 'farmer@greenvalley.in' LIMIT 1;
  IF v_owner_id IS NULL THEN
    SELECT id INTO v_owner_id FROM public.profiles LIMIT 1;
  END IF;

  IF v_owner_id IS NOT NULL THEN
    -- Insert default Organization if not exists
    INSERT INTO public.organizations (name, slug, owner_id, plan)
    VALUES ('Green Valley Agriculture Ltd', 'green-valley-agri', v_owner_id, 'PROFESSIONAL')
    ON CONFLICT (slug) DO UPDATE SET updated_at = now()
    RETURNING id INTO v_org_id;

    -- Add Owner membership
    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (v_org_id, v_owner_id, 'OWNER', 'ACTIVE')
    ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'OWNER';

    -- Associate existing farms with this organization
    UPDATE public.farms SET organization_id = v_org_id WHERE organization_id IS NULL;
  END IF;
END $$;
