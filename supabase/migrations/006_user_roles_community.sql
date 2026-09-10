-- ============================================================================
-- Migration 006: User Profiles Username, Community Ag Exchange, Task Field Notes, & Worker RBAC
-- FarmPilot Phase 2 Decision-Support & Operational System
-- ============================================================================

-- 1. ADD USERNAME TO PROFILES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
    CREATE INDEX idx_profiles_username ON public.profiles(username);
  END IF;
END $$;

-- Update existing demo profiles with designated usernames
UPDATE public.profiles SET username = 'siddharth' WHERE email = 'farmer@greenvalley.in' AND (username IS NULL OR username = '');
UPDATE public.profiles SET username = 'rajesh' WHERE email = 'manager@greenvalley.in' AND (username IS NULL OR username = '');
UPDATE public.profiles SET username = 'ramu' WHERE email = 'worker@greenvalley.in' AND (username IS NULL OR username = '');
UPDATE public.profiles SET username = 'anita' WHERE email = 'consultant@greenvalley.in' AND (username IS NULL OR username = '');

-- 2. ADD WORKER PIN & CREDENTIALS TO ORGANIZATION MEMBERS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'organization_members' AND column_name = 'worker_pin'
  ) THEN
    ALTER TABLE public.organization_members ADD COLUMN worker_pin TEXT DEFAULT '1234';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'organization_members' AND column_name = 'assigned_field_id'
  ) THEN
    ALTER TABLE public.organization_members ADD COLUMN assigned_field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. ADD TARGET & ACTUAL QUANTITIES TO ACTIVITIES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'target_quantity'
  ) THEN
    ALTER TABLE public.activities ADD COLUMN target_quantity TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'actual_quantity'
  ) THEN
    ALTER TABLE public.activities ADD COLUMN actual_quantity TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'hours_worked'
  ) THEN
    ALTER TABLE public.activities ADD COLUMN hours_worked NUMERIC(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'field_note'
  ) THEN
    ALTER TABLE public.activities ADD COLUMN field_note TEXT;
  END IF;
END $$;

-- 4. CREATE COMMUNITY POSTS TABLE (Open Ag Exchange / Cooperative Board)
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  author_name TEXT NOT NULL,
  farm_name TEXT NOT NULL DEFAULT 'Green Valley Farm',
  role TEXT NOT NULL DEFAULT 'FARMER',
  category TEXT NOT NULL CHECK (category IN ('MANDI_RATES', 'PEST_ALERT', 'FIELD_NOTES', 'AGRONOMY_QA', 'EQUIPMENT')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_cat ON public.community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON public.community_posts(user_id);

-- 5. CREATE TASK-LEVEL FIELD NOTES TABLE (Internal Farm Operations Communication)
CREATE TABLE IF NOT EXISTS public.field_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  author_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'WORKER',
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_field_notes_act ON public.field_notes(activity_id);
CREATE INDEX IF NOT EXISTS idx_field_notes_created ON public.field_notes(created_at DESC);

-- 6. SEED INITIAL COMMUNITY BOARD DISCUSSIONS
INSERT INTO public.community_posts (username, author_name, farm_name, role, category, title, content, likes, replies_count)
VALUES
  ('siddharth', 'Siddharth Saladi', 'Green Valley Farm', 'OWNER', 'MANDI_RATES', 
   'Machilipatnam Mandi Paddy Rates Today (BPT-5204)', 
   'Mandi auction opened strong at ₹2,450 - ₹2,520/quintal for Grade A BPT-5204 (Samba Mahsuri). Moisture content requirement strictly below 14%. Direct millers paying ₹2,550 for spot delivery.', 14, 3),
   
  ('anita', 'Dr. Anita Rao', 'Delta Agronomy Advisory', 'CONSULTANT', 'PEST_ALERT', 
   'Brown Plant Hopper (BPH) Pre-Alert in Coastal Paddy Belts', 
   'Noticeable BPH nymph concentrations detected in water-stagnated plots. Maintain strict Alternate Wetting and Drying (AWD) cycle to drain fields for 36 hours. Avoid synthetic pyrethroid sprays to preserve natural mirid bug predators.', 28, 7),
   
  ('rajesh', 'Rajesh Patel', 'Green Valley Farm', 'MANAGER', 'EQUIPMENT', 
   'Laser Land Leveler & 8-Row Paddy Transplanter Available for Custom Hiring', 
   'Kubota 8-row walk-behind mechanical transplanter and Trimble GPS laser leveler available for custom hire in Diviseema region starting next Monday. Contact for tractor operator bookings.', 9, 2),

  ('ramu', 'Ravi Kumar', 'Green Valley Farm', 'WORKER', 'FIELD_NOTES', 
   'North Block AWD Observation: Soil drying rate faster on sand ridge', 
   'Perforated AWD pipe reached 6cm depth below soil on the ridge 1 day faster than clay basin. Opening sluice gate for Plot A2 today.', 6, 1)
ON CONFLICT DO NOTHING;

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_notes ENABLE ROW LEVEL SECURITY;

-- Allow public/authenticated read and write for community exchange
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'community_posts_select_policy') THEN
    CREATE POLICY community_posts_select_policy ON public.community_posts FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'community_posts_insert_policy') THEN
    CREATE POLICY community_posts_insert_policy ON public.community_posts FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'community_posts_update_policy') THEN
    CREATE POLICY community_posts_update_policy ON public.community_posts FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'field_notes_select_policy') THEN
    CREATE POLICY field_notes_select_policy ON public.field_notes FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'field_notes_insert_policy') THEN
    CREATE POLICY field_notes_insert_policy ON public.field_notes FOR INSERT WITH CHECK (true);
  END IF;
END $$;
