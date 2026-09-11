-- ==============================================================================
-- Migration 011: Production Hardening, Authentication, RBAC & Community Messaging
-- FarmPilot Enterprise Agriculture Platform
-- Description:
-- 1. Synchronizes auth.users encrypted passwords & metadata for all seed personas
-- 2. Hardens public.profiles with canonical normalized usernames and triggers
-- 3. Reconciles multi-tenant hierarchy (organizations, farm_members, field_members, crop_cycle_members)
-- 4. Creates normalized Community Direct Messaging tables (conversations, conversation_members, messages, message_reads, audit_logs)
-- 5. Creates Security Definer PostgreSQL authorization helper functions
-- 6. Enables Realtime publication on messages and notifications
-- 7. Enforces airtight, role-scoped RLS policies across all tenant data
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. AUTH.USERS SEED CREDENTIALS SYNCHRONIZATION
-- ------------------------------------------------------------------------------

DO $$
BEGIN
  -- Owner 1: Siddharth Saladi
  UPDATE auth.users 
  SET encrypted_password = crypt('Farmer@2026!', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object('full_name', 'Siddharth Saladi', 'username', 'siddharth', 'role', 'OWNER')
  WHERE email = 'farmer@greenvalley.in';

  -- Manager: Rajesh Patel
  UPDATE auth.users 
  SET encrypted_password = crypt('Manager@2026!', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object('full_name', 'Rajesh Patel', 'username', 'rajesh', 'role', 'MANAGER')
  WHERE email = 'manager@greenvalley.in';

  -- Worker: Ravi Kumar
  UPDATE auth.users 
  SET encrypted_password = crypt('Worker@2026!', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object('full_name', 'Ravi Kumar', 'username', 'ramu', 'role', 'WORKER')
  WHERE email = 'worker@greenvalley.in';

  -- Consultant: Dr. Anita Rao
  UPDATE auth.users 
  SET encrypted_password = crypt('Consultant@2026!', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object('full_name', 'Dr. Anita Rao', 'username', 'anita', 'role', 'CONSULTANT')
  WHERE email = 'consultant@greenvalley.in';

  -- Personal Admin Account
  UPDATE auth.users 
  SET encrypted_password = crypt('Farmer@2026!', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object('full_name', 'Siddharth (Personal)', 'username', 'siddharth_personal', 'role', 'OWNER')
  WHERE email = 'saladisiddharath@gmail.com';

  -- Regional Owner: Venkat Reddy
  UPDATE auth.users 
  SET encrypted_password = crypt('Venkat@2026!', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object('full_name', 'Venkat Reddy', 'username', 'venkat', 'role', 'OWNER')
  WHERE email = 'venkat@krishnadelta.in';

  -- Regional Consultant: Laxmi Devi
  UPDATE auth.users 
  SET encrypted_password = crypt('Laxmi@2026!', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object('full_name', 'Laxmi Devi', 'username', 'laxmi', 'role', 'CONSULTANT')
  WHERE email = 'laxmi@godavariagri.in';

  -- Regional Manager: Kiran Varma
  UPDATE auth.users 
  SET encrypted_password = crypt('Kiran@2026!', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object('full_name', 'Kiran Varma', 'username', 'kiran', 'role', 'MANAGER')
  WHERE email = 'kiran@rayalaseema.in';

  -- Regional Owner: Subba Rao
  UPDATE auth.users 
  SET encrypted_password = crypt('Subba@2026!', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object('full_name', 'Subba Rao', 'username', 'subba', 'role', 'OWNER')
  WHERE email = 'subba@andhrafarms.in';
END $$;

-- ------------------------------------------------------------------------------
-- 2. PUBLIC.PROFILES HARMONIZATION & CONSTRAINTS
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_normalized TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'WORKER';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agricultural_interests TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE public.profiles 
SET username_normalized = LOWER(TRIM(username))
WHERE username IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_normalized_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_normalized_key UNIQUE (username_normalized);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_username TEXT;
  v_norm_username TEXT;
  v_full_name TEXT;
  v_role TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  v_norm_username := LOWER(TRIM(v_username));
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'WORKER');
  IF v_role NOT IN ('OWNER', 'MANAGER', 'WORKER', 'CONSULTANT') THEN
    v_role := 'WORKER';
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    username,
    username_normalized,
    role,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    v_full_name,
    NEW.email,
    v_username,
    v_norm_username,
    v_role,
    UPPER(SUBSTRING(v_full_name FROM 1 FOR 1)),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      username = COALESCE(public.profiles.username, EXCLUDED.username),
      username_normalized = COALESCE(public.profiles.username_normalized, EXCLUDED.username_normalized),
      updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 3. ORGANIZATIONS, FARMS & MEMBERSHIPS
-- ------------------------------------------------------------------------------

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.farm_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.field_members ADD COLUMN IF NOT EXISTS assignment_type TEXT DEFAULT 'PRIMARY_OPERATOR';
ALTER TABLE public.field_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.field_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS public.crop_cycle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_role TEXT DEFAULT 'VIEWER',
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_crop_member UNIQUE (crop_cycle_id, user_id)
);

DO $$
DECLARE
  v_owner_id UUID;
  v_org_id UUID;
  v_farm_id UUID;
  v_mgr_id UUID;
  v_wkr_id UUID;
  v_con_id UUID;
BEGIN
  SELECT id INTO v_owner_id FROM auth.users WHERE email = 'farmer@greenvalley.in';
  SELECT id INTO v_mgr_id FROM auth.users WHERE email = 'manager@greenvalley.in';
  SELECT id INTO v_wkr_id FROM auth.users WHERE email = 'worker@greenvalley.in';
  SELECT id INTO v_con_id FROM auth.users WHERE email = 'consultant@greenvalley.in';

  IF v_owner_id IS NOT NULL THEN
    SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'green-valley-agri' OR slug = 'green-valley-org' LIMIT 1;
    IF v_org_id IS NULL THEN
      INSERT INTO public.organizations (id, name, slug, owner_id, plan, status, created_at, updated_at)
      VALUES (gen_random_uuid(), 'Green Valley Agriculture Ltd', 'green-valley-agri', v_owner_id, 'PROFESSIONAL', 'ACTIVE', now(), now())
      RETURNING id INTO v_org_id;
    ELSE
      UPDATE public.organizations SET owner_id = v_owner_id, status = 'ACTIVE' WHERE id = v_org_id;
    END IF;

    SELECT id INTO v_farm_id FROM public.farms WHERE name ILIKE '%Green Valley%' LIMIT 1;
    IF v_farm_id IS NULL THEN
      INSERT INTO public.farms (id, organization_id, owner_id, name, total_area, area_unit, description, created_at, updated_at)
      VALUES (gen_random_uuid(), v_org_id, v_owner_id, 'Green Valley Farm', 45.5, 'acres', 'Primary irrigated farm in Coastal Andhra', now(), now())
      RETURNING id INTO v_farm_id;
    ELSE
      UPDATE public.farms SET organization_id = v_org_id, owner_id = v_owner_id WHERE id = v_farm_id;
    END IF;

    -- Organization Members
    INSERT INTO public.organization_members (organization_id, user_id, role, status, created_at)
    VALUES (v_org_id, v_owner_id, 'OWNER', 'ACTIVE', now())
    ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'OWNER', status = 'ACTIVE';

    IF v_mgr_id IS NOT NULL THEN
      INSERT INTO public.organization_members (organization_id, user_id, role, status, created_at)
      VALUES (v_org_id, v_mgr_id, 'MANAGER', 'ACTIVE', now())
      ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'MANAGER', status = 'ACTIVE';
    END IF;

    IF v_wkr_id IS NOT NULL THEN
      INSERT INTO public.organization_members (organization_id, user_id, role, status, created_at)
      VALUES (v_org_id, v_wkr_id, 'WORKER', 'ACTIVE', now())
      ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'WORKER', status = 'ACTIVE';
    END IF;

    IF v_con_id IS NOT NULL THEN
      INSERT INTO public.organization_members (organization_id, user_id, role, status, created_at)
      VALUES (v_org_id, v_con_id, 'CONSULTANT', 'ACTIVE', now())
      ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'CONSULTANT', status = 'ACTIVE';
    END IF;

    -- Farm Members
    INSERT INTO public.farm_members (farm_id, user_id, role, status, created_at)
    VALUES (v_farm_id, v_owner_id, 'OWNER', 'ACTIVE', now())
    ON CONFLICT (farm_id, user_id) DO UPDATE SET role = 'OWNER', status = 'ACTIVE';

    IF v_mgr_id IS NOT NULL THEN
      INSERT INTO public.farm_members (farm_id, user_id, role, status, created_at)
      VALUES (v_farm_id, v_mgr_id, 'MANAGER', 'ACTIVE', now())
      ON CONFLICT (farm_id, user_id) DO UPDATE SET role = 'MANAGER', status = 'ACTIVE';
    END IF;

    IF v_wkr_id IS NOT NULL THEN
      INSERT INTO public.farm_members (farm_id, user_id, role, status, created_at)
      VALUES (v_farm_id, v_wkr_id, 'WORKER', 'ACTIVE', now())
      ON CONFLICT (farm_id, user_id) DO UPDATE SET role = 'WORKER', status = 'ACTIVE';
    END IF;

    IF v_con_id IS NOT NULL THEN
      INSERT INTO public.farm_members (farm_id, user_id, role, status, created_at)
      VALUES (v_farm_id, v_con_id, 'CONSULTANT', 'ACTIVE', now())
      ON CONFLICT (farm_id, user_id) DO UPDATE SET role = 'CONSULTANT', status = 'ACTIVE';
    END IF;

    PERFORM 1 FROM public.fields WHERE farm_id = v_farm_id LIMIT 1;
    IF FOUND AND v_wkr_id IS NOT NULL THEN
      INSERT INTO public.field_members (field_id, user_id, assignment_type, status, created_at)
      SELECT f.id, v_wkr_id, 'PRIMARY_OPERATOR', 'ACTIVE', now()
      FROM public.fields f
      WHERE f.farm_id = v_farm_id
      ON CONFLICT (field_id, user_id) DO NOTHING;
    END IF;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. NORMALIZED COMMUNITY DIRECT MESSAGING & AUDIT TABLES
-- ------------------------------------------------------------------------------

-- Conversations Table Enhancement
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS conversation_type TEXT DEFAULT 'DIRECT';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Conversation Members Table
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'ACTIVE',
  CONSTRAINT uq_conv_member UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_members_user ON public.conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_conv ON public.conversation_members(conversation_id);

-- Normalized Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_username TEXT,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_username TEXT,
  body TEXT NOT NULL,
  client_message_id TEXT,
  reference_type TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  reply_to_message_id UUID REFERENCES public.messages(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON public.messages(conversation_id, client_message_id);

-- Message Reads Table
CREATE TABLE IF NOT EXISTS public.message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_msg_read UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_msg_reads_user ON public.message_reads(user_id);

-- Audit Logs Table (Matching Section 73)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_data JSONB,
  after_data JSONB,
  request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Notifications Table Enhancements
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS reference_type TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Seed Conversation Members for initial seeded direct messages
DO $$
DECLARE
  v_sid UUID;
  v_ven UUID;
  v_ani UUID;
BEGIN
  SELECT id INTO v_sid FROM auth.users WHERE email = 'farmer@greenvalley.in';
  SELECT id INTO v_ven FROM auth.users WHERE email = 'venkat@krishnadelta.in';
  SELECT id INTO v_ani FROM auth.users WHERE email = 'consultant@greenvalley.in';

  IF v_sid IS NOT NULL AND v_ven IS NOT NULL THEN
    INSERT INTO public.conversation_members (conversation_id, user_id, username, status)
    VALUES 
      ('conv-venkat-siddharth', v_ven, 'venkat', 'ACTIVE'),
      ('conv-venkat-siddharth', v_sid, 'siddharth', 'ACTIVE')
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  IF v_sid IS NOT NULL AND v_ani IS NOT NULL THEN
    INSERT INTO public.conversation_members (conversation_id, user_id, username, status)
    VALUES 
      ('conv-anita-siddharth', v_sid, 'siddharth', 'ACTIVE'),
      ('conv-anita-siddharth', v_ani, 'anita', 'ACTIVE')
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 5. SECURITY DEFINER HELPER FUNCTIONS
-- ------------------------------------------------------------------------------

-- Helper: Get active user's organization role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.organization_members WHERE user_id = auth.uid() AND status = 'ACTIVE' LIMIT 1),
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    'WORKER'
  );
$$;

-- Helper: Check organization membership
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID, p_roles TEXT[] DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = p_org_id AND o.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = p_org_id
      AND om.user_id = auth.uid()
      AND om.status = 'ACTIVE'
      AND (p_roles IS NULL OR om.role = ANY(p_roles))
  );
$$;

-- Helper: Check farm access
CREATE OR REPLACE FUNCTION public.can_access_farm(p_farm_id UUID, p_roles TEXT[] DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    -- Direct farm owner
    SELECT 1 FROM public.farms f
    WHERE f.id = p_farm_id AND f.owner_id = auth.uid()
  ) OR EXISTS (
    -- Direct farm membership
    SELECT 1 FROM public.farm_members fm
    WHERE fm.farm_id = p_farm_id
      AND fm.user_id = auth.uid()
      AND fm.status = 'ACTIVE'
      AND (p_roles IS NULL OR fm.role = ANY(p_roles))
  ) OR EXISTS (
    -- Organization owner/manager access to all child farms
    SELECT 1 FROM public.farms f
    JOIN public.organizations o ON f.organization_id = o.id
    WHERE f.id = p_farm_id AND (
      o.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = o.id
          AND om.user_id = auth.uid()
          AND om.status = 'ACTIVE'
          AND (p_roles IS NULL OR om.role = ANY(p_roles))
      )
    )
  );
$$;

-- Helper: Check field access
CREATE OR REPLACE FUNCTION public.can_access_field(p_field_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fields f
    WHERE f.id = p_field_id AND public.can_access_farm(f.farm_id)
  ) OR EXISTS (
    SELECT 1 FROM public.field_members fm
    WHERE fm.field_id = p_field_id AND fm.user_id = auth.uid() AND fm.status = 'ACTIVE'
  );
$$;

-- Helper: Check crop access
CREATE OR REPLACE FUNCTION public.can_access_crop(p_crop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.crop_cycles c
    WHERE c.id = p_crop_id AND public.can_access_farm(c.farm_id)
  );
$$;

-- Helper: Check financial visibility (strictly denies WORKER role)
CREATE OR REPLACE FUNCTION public.can_view_financials(p_farm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT public.can_access_farm(p_farm_id, ARRAY['OWNER', 'MANAGER', 'CONSULTANT']);
$$;

-- Helper: Check conversation access
CREATE OR REPLACE FUNCTION public.can_access_conversation(p_conv_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = p_conv_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = p_conv_id AND (
      created_by = auth.uid() OR
      initiator_username = (SELECT username FROM public.profiles WHERE id = auth.uid()) OR
      recipient_username = (SELECT username FROM public.profiles WHERE id = auth.uid())
    )
  );
$$;

-- ------------------------------------------------------------------------------
-- 6. REALTIME REPLICATION CONFIGURATION
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Realtime publication setup skipped or already active: %', SQLERRM;
END $$;

-- ------------------------------------------------------------------------------
-- 7. PRODUCTION ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irrigation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- ---------------- PROFILES ----------------
DROP POLICY IF EXISTS "Allow public update to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert to profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_directory" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;

CREATE POLICY profiles_select_directory ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- ---------------- ORGANIZATIONS ----------------
DROP POLICY IF EXISTS "Members can view own organization" ON public.organizations;
DROP POLICY IF EXISTS "Owners can update own organization" ON public.organizations;
DROP POLICY IF EXISTS "org_select_policy" ON public.organizations;
DROP POLICY IF EXISTS "org_modify_policy" ON public.organizations;

CREATE POLICY org_select_policy ON public.organizations
  FOR SELECT USING (public.is_org_member(id));

CREATE POLICY org_modify_policy ON public.organizations
  FOR ALL USING (owner_id = auth.uid() OR public.is_org_member(id, ARRAY['OWNER']))
  WITH CHECK (owner_id = auth.uid() OR public.is_org_member(id, ARRAY['OWNER']));

-- ---------------- FARMS ----------------
DROP POLICY IF EXISTS "Users can view own farms" ON public.farms;
DROP POLICY IF EXISTS "Users can update own farms" ON public.farms;
DROP POLICY IF EXISTS "Users can delete own farms" ON public.farms;
DROP POLICY IF EXISTS "Users can create farms" ON public.farms;
DROP POLICY IF EXISTS "farms_select_policy" ON public.farms;
DROP POLICY IF EXISTS "farms_insert_policy" ON public.farms;
DROP POLICY IF EXISTS "farms_update_policy" ON public.farms;
DROP POLICY IF EXISTS "farms_delete_policy" ON public.farms;

CREATE POLICY farms_select_policy ON public.farms
  FOR SELECT USING (public.can_access_farm(id));

CREATE POLICY farms_insert_policy ON public.farms
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      owner_id = auth.uid() OR 
      public.is_org_member(organization_id, ARRAY['OWNER'])
    )
  );

CREATE POLICY farms_update_policy ON public.farms
  FOR UPDATE USING (public.can_access_farm(id, ARRAY['OWNER', 'MANAGER']))
  WITH CHECK (public.can_access_farm(id, ARRAY['OWNER', 'MANAGER']));

CREATE POLICY farms_delete_policy ON public.farms
  FOR DELETE USING (owner_id = auth.uid() OR public.can_access_farm(id, ARRAY['OWNER']));

-- ---------------- FIELDS ----------------
DROP POLICY IF EXISTS "Users can view fields of own farms" ON public.fields;
DROP POLICY IF EXISTS "Users can create fields in own farms" ON public.fields;
DROP POLICY IF EXISTS "Users can update fields in own farms" ON public.fields;
DROP POLICY IF EXISTS "Users can delete fields in own farms" ON public.fields;
DROP POLICY IF EXISTS "fields_select_policy" ON public.fields;
DROP POLICY IF EXISTS "fields_modify_policy" ON public.fields;

CREATE POLICY fields_select_policy ON public.fields
  FOR SELECT USING (public.can_access_farm(farm_id) OR public.can_access_field(id));

CREATE POLICY fields_modify_policy ON public.fields
  FOR ALL USING (public.can_access_farm(farm_id, ARRAY['OWNER', 'MANAGER']))
  WITH CHECK (public.can_access_farm(farm_id, ARRAY['OWNER', 'MANAGER']));

-- ---------------- CROP CYCLES ----------------
DROP POLICY IF EXISTS "Users can view crop cycles of own farms" ON public.crop_cycles;
DROP POLICY IF EXISTS "Users can create crop cycles in own farms" ON public.crop_cycles;
DROP POLICY IF EXISTS "Users can update crop cycles in own farms" ON public.crop_cycles;
DROP POLICY IF EXISTS "Users can delete crop cycles in own farms" ON public.crop_cycles;
DROP POLICY IF EXISTS "crop_cycles_select_policy" ON public.crop_cycles;
DROP POLICY IF EXISTS "crop_cycles_modify_policy" ON public.crop_cycles;

CREATE POLICY crop_cycles_select_policy ON public.crop_cycles
  FOR SELECT USING (public.can_access_farm(farm_id));

CREATE POLICY crop_cycles_modify_policy ON public.crop_cycles
  FOR ALL USING (public.can_access_farm(farm_id, ARRAY['OWNER', 'MANAGER', 'CONSULTANT']))
  WITH CHECK (public.can_access_farm(farm_id, ARRAY['OWNER', 'MANAGER', 'CONSULTANT']));

-- ---------------- ACTIVITIES ----------------
DROP POLICY IF EXISTS "Users can view activities of own farms" ON public.activities;
DROP POLICY IF EXISTS "Users can create activities in own farms" ON public.activities;
DROP POLICY IF EXISTS "Users can update activities in own farms" ON public.activities;
DROP POLICY IF EXISTS "Users can delete activities in own farms" ON public.activities;
DROP POLICY IF EXISTS "activities_select_policy" ON public.activities;
DROP POLICY IF EXISTS "activities_modify_lead" ON public.activities;
DROP POLICY IF EXISTS "activities_update_worker" ON public.activities;

CREATE POLICY activities_select_policy ON public.activities
  FOR SELECT USING (
    public.can_access_farm(farm_id) OR 
    (assigned_to = auth.uid()) OR
    (field_id IS NOT NULL AND public.can_access_field(field_id))
  );

CREATE POLICY activities_modify_lead ON public.activities
  FOR ALL USING (public.can_access_farm(farm_id, ARRAY['OWNER', 'MANAGER']))
  WITH CHECK (public.can_access_farm(farm_id, ARRAY['OWNER', 'MANAGER']));

CREATE POLICY activities_update_worker ON public.activities
  FOR UPDATE USING (assigned_to = auth.uid() OR submitted_by = auth.uid() OR public.can_access_farm(farm_id, ARRAY['WORKER']))
  WITH CHECK (assigned_to = auth.uid() OR submitted_by = auth.uid() OR public.can_access_farm(farm_id, ARRAY['WORKER']));

-- ---------------- EXPENSES (STRICT FINANCIAL PRIVACY) ----------------
DROP POLICY IF EXISTS "Users can view expenses of own farms" ON public.expenses;
DROP POLICY IF EXISTS "Users can create expenses in own farms" ON public.expenses;
DROP POLICY IF EXISTS "Users can update expenses in own farms" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete expenses in own farms" ON public.expenses;
DROP POLICY IF EXISTS "expenses_select_policy" ON public.expenses;
DROP POLICY IF EXISTS "expenses_modify_lead" ON public.expenses;

-- WORKER ROLE IS STRICTLY DENIED EXPENSE ACCESS
CREATE POLICY expenses_select_policy ON public.expenses
  FOR SELECT USING (public.can_view_financials(farm_id));

CREATE POLICY expenses_modify_lead ON public.expenses
  FOR ALL USING (public.can_access_farm(farm_id, ARRAY['OWNER', 'MANAGER']))
  WITH CHECK (public.can_access_farm(farm_id, ARRAY['OWNER', 'MANAGER']));

-- ---------------- INPUTS & IRRIGATION ----------------
DROP POLICY IF EXISTS "Users can view inputs of own farms" ON public.inputs;
DROP POLICY IF EXISTS "Users can create inputs in own farms" ON public.inputs;
DROP POLICY IF EXISTS "Users can update inputs in own farms" ON public.inputs;
DROP POLICY IF EXISTS "Users can delete inputs in own farms" ON public.inputs;
DROP POLICY IF EXISTS "inputs_select_policy" ON public.inputs;
DROP POLICY IF EXISTS "inputs_modify_policy" ON public.inputs;

CREATE POLICY inputs_select_policy ON public.inputs
  FOR SELECT USING (public.can_access_farm(farm_id));

CREATE POLICY inputs_modify_policy ON public.inputs
  FOR ALL USING (public.can_access_farm(farm_id, ARRAY['OWNER', 'MANAGER', 'WORKER']))
  WITH CHECK (public.can_access_farm(farm_id, ARRAY['OWNER', 'MANAGER', 'WORKER']));

DROP POLICY IF EXISTS "Users can view irrigation logs of own farms" ON public.irrigation_logs;
DROP POLICY IF EXISTS "Users can create irrigation logs in own farms" ON public.irrigation_logs;
DROP POLICY IF EXISTS "Users can update irrigation logs in own farms" ON public.irrigation_logs;
DROP POLICY IF EXISTS "Users can delete irrigation logs in own farms" ON public.irrigation_logs;
DROP POLICY IF EXISTS "irrigation_select_policy" ON public.irrigation_logs;
DROP POLICY IF EXISTS "irrigation_modify_policy" ON public.irrigation_logs;

CREATE POLICY irrigation_select_policy ON public.irrigation_logs
  FOR SELECT USING (public.can_access_farm(farm_id));

CREATE POLICY irrigation_modify_policy ON public.irrigation_logs
  FOR ALL USING (public.can_access_farm(farm_id, ARRAY['OWNER', 'MANAGER', 'WORKER']))
  WITH CHECK (public.can_access_farm(farm_id, ARRAY['OWNER', 'MANAGER', 'WORKER']));

-- ---------------- HARVESTS ----------------
DROP POLICY IF EXISTS "Users can view harvests of own farms" ON public.harvests;
DROP POLICY IF EXISTS "Users can create harvests in own farms" ON public.harvests;
DROP POLICY IF EXISTS "Users can update harvests of own farms" ON public.harvests;
DROP POLICY IF EXISTS "Users can delete harvests of own farms" ON public.harvests;
DROP POLICY IF EXISTS "harvests_select_policy" ON public.harvests;
DROP POLICY IF EXISTS "harvests_modify_policy" ON public.harvests;

CREATE POLICY harvests_select_policy ON public.harvests
  FOR SELECT USING (public.can_access_farm(farm_id));

CREATE POLICY harvests_modify_policy ON public.harvests
  FOR ALL USING (public.can_access_farm(farm_id, ARRAY['OWNER', 'MANAGER']))
  WITH CHECK (public.can_access_farm(farm_id, ARRAY['OWNER', 'MANAGER']));

-- ---------------- COMMUNITY CONVERSATIONS & MESSAGES ----------------
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_auth" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_participant" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;

DROP POLICY IF EXISTS "conv_members_select" ON public.conversation_members;
DROP POLICY IF EXISTS "conv_members_modify" ON public.conversation_members;
DROP POLICY IF EXISTS "conv_members_insert" ON public.conversation_members;

DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
DROP POLICY IF EXISTS "messages_update_sender" ON public.messages;

DROP POLICY IF EXISTS "msg_reads_select" ON public.message_reads;
DROP POLICY IF EXISTS "msg_reads_insert" ON public.message_reads;

-- Security Definer helper to check conversation membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conv_id TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = p_conv_id AND user_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = p_conv_id AND (
      created_by = p_user_id OR
      initiator_username = (SELECT username FROM public.profiles WHERE id = p_user_id) OR
      recipient_username = (SELECT username FROM public.profiles WHERE id = p_user_id)
    )
  );
$$;

-- 1. CONVERSATIONS (Direct row check, zero cross-table recursion)
CREATE POLICY conversations_select_participant ON public.conversations
  FOR SELECT USING (
    created_by = auth.uid() OR
    initiator_username = (SELECT username FROM public.profiles WHERE id = auth.uid()) OR
    recipient_username = (SELECT username FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY conversations_insert_auth ON public.conversations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR
      initiator_username = (SELECT username FROM public.profiles WHERE id = auth.uid()) OR
      created_by IS NULL
    )
  );

CREATE POLICY conversations_update_participant ON public.conversations
  FOR UPDATE USING (
    created_by = auth.uid() OR
    initiator_username = (SELECT username FROM public.profiles WHERE id = auth.uid()) OR
    recipient_username = (SELECT username FROM public.profiles WHERE id = auth.uid())
  ) WITH CHECK (
    created_by = auth.uid() OR
    initiator_username = (SELECT username FROM public.profiles WHERE id = auth.uid()) OR
    recipient_username = (SELECT username FROM public.profiles WHERE id = auth.uid())
  );

-- 2. CONVERSATION MEMBERS (Using security definer helper)
CREATE POLICY conv_members_select ON public.conversation_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    public.is_conversation_member(conversation_id, auth.uid())
  );

CREATE POLICY conv_members_modify ON public.conversation_members
  FOR ALL USING (
    user_id = auth.uid() OR
    public.is_conversation_member(conversation_id, auth.uid())
  ) WITH CHECK (
    user_id = auth.uid() OR
    public.is_conversation_member(conversation_id, auth.uid())
  );

-- 3. MESSAGES (Using security definer helper)
CREATE POLICY messages_select_participant ON public.messages
  FOR SELECT USING (
    sender_id = auth.uid() OR
    recipient_id = auth.uid() OR
    public.is_conversation_member(conversation_id, auth.uid())
  );

CREATE POLICY messages_insert_sender ON public.messages
  FOR INSERT WITH CHECK (
    (sender_id = auth.uid() OR sender_username = (SELECT username FROM public.profiles WHERE id = auth.uid())) AND
    public.is_conversation_member(conversation_id, auth.uid())
  );

CREATE POLICY messages_update_sender ON public.messages
  FOR UPDATE USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Message Reads:
CREATE POLICY msg_reads_select ON public.message_reads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY msg_reads_insert ON public.message_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ---------------- NOTIFICATIONS ----------------
DROP POLICY IF EXISTS "notifications_recipient_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_recipient_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_recipient" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_recipient" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_actor" ON public.notifications;

CREATE POLICY notifications_select_recipient ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY notifications_update_recipient ON public.notifications
  FOR UPDATE USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY notifications_insert_actor ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ---------------- AUDIT LOGS (SECURITY PROTECTION) ----------------
DROP POLICY IF EXISTS "Allow public select to security_audit_logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Allow public insert to security_audit_logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_owner" ON public.audit_logs;
DROP POLICY IF EXISTS "sec_audit_insert_policy" ON public.security_audit_logs;
DROP POLICY IF EXISTS "sec_audit_select_owner" ON public.security_audit_logs;

CREATE POLICY audit_logs_insert_policy ON public.audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY audit_logs_select_owner ON public.audit_logs
  FOR SELECT USING (
    actor_user_id = auth.uid() OR
    public.is_org_member(organization_id, ARRAY['OWNER'])
  );

CREATE POLICY sec_audit_insert_policy ON public.security_audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY sec_audit_select_owner ON public.security_audit_logs
  FOR SELECT USING (
    actor_id = auth.uid() OR
    public.get_auth_role() = 'OWNER'
  );

-- ==============================================================================
-- END OF MIGRATION 011
-- ==============================================================================
