-- =========================================================================
-- FARMPILOT SCHEMA MIGRATION 009: USER CREDENTIALS & FARM AI REPORTS
-- Stores:
-- 1. public.user_credentials (All users, plain/hashed passwords, PINs, roles, farms)
-- 2. public.farm_ai_reports (Generated comprehensive AI farm dossiers)
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. USER CREDENTIALS & ACCOUNT DIRECTORY TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_plain TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  pin TEXT NOT NULL DEFAULT '1234',
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'WORKER', 'CONSULTANT')),
  role_label TEXT NOT NULL,
  phone TEXT NOT NULL,
  farm_name TEXT NOT NULL,
  assigned_parcel TEXT DEFAULT 'All Parcels',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
  avatar_letter TEXT NOT NULL,
  avatar_bg TEXT NOT NULL DEFAULT '#059669',
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_user_credentials_username ON public.user_credentials (lower(username));
CREATE INDEX IF NOT EXISTS idx_user_credentials_email ON public.user_credentials (lower(email));
CREATE INDEX IF NOT EXISTS idx_user_credentials_role ON public.user_credentials (role);

-- Enable RLS
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated and demo sessions
DROP POLICY IF EXISTS "Public and authenticated read for credentials directory" ON public.user_credentials;
CREATE POLICY "Public and authenticated read for credentials directory"
  ON public.user_credentials FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Owner manage user credentials" ON public.user_credentials;
CREATE POLICY "Owner manage user credentials"
  ON public.user_credentials FOR ALL
  USING (true);

-- Seed all default users with exact passwords, roles, and details
INSERT INTO public.user_credentials (
  id, username, email, password_plain, password_hash, pin, full_name, role, role_label, phone, farm_name, assigned_parcel, avatar_letter, avatar_bg, permissions
) VALUES 
(
  '33dd8f01-e3c5-42a8-9194-a92504a75246',
  'siddharth',
  'farmer@greenvalley.in',
  'Farmer@2026!',
  '$2a$12$e8bF5dKmO8F92mN6P1zJSeZpQ9rT1uV2wX3yZ4aB5cDefGhIjKlMn',
  '1234',
  'Siddharth Saladi',
  'OWNER',
  'Farm Owner & Executive',
  '+91 98480 22334',
  'Green Valley Farm',
  'Estate Portfolio (25.0 Acres)',
  'S',
  '#059669',
  ARRAY['financials', 'org_settings', 'all_farms', 'reports', 'alerts', 'manage_members', 'operations', 'labour', 'irrigation', 'audit']
),
(
  '4b893f02-a1b2-4c3d-8e4f-5a6b7c8d9e0f',
  'rajesh',
  'manager@greenvalley.in',
  'Manager@2026!',
  '$2a$12$f9cG6eLnP9G03nO7Q2aKTfaQR0sU2vW3xY4zA5bC6eFghJkLmNoPq',
  '1234',
  'Rajesh Patel',
  'MANAGER',
  'Estate Operations Manager',
  '+91 94401 55667',
  'Green Valley Farm',
  'North & East Blocks (18.5 Acres)',
  'R',
  '#2563EB',
  ARRAY['operations', 'task_assignment', 'fields', 'crops', 'inputs', 'expenses', 'irrigation', 'alerts']
),
(
  '12f2a103-05d5-498f-b187-406bf7f634cd',
  'ramu',
  'worker@greenvalley.in',
  'Worker@2026!',
  '$2a$12$g0dH7fMoQ0H14oP8R3bLUgbRS1tV3wX4yZ5aB6cD7fGhiKmLnOpQr',
  '1234',
  'Ravi Kumar',
  'WORKER',
  'Field Operations Operator',
  '+91 91772 88990',
  'Green Valley Farm',
  'North Block Plot A (Paddy BPT-5204)',
  'K',
  '#D97706',
  ARRAY['today_tasks', 'start_task', 'complete_task', 'view_field']
),
(
  '7e61b504-f3e4-4d5c-b6a7-8c9d0e1f2a3b',
  'anita',
  'consultant@greenvalley.in',
  'Consultant@2026!',
  '$2a$12$h1eI8gNpR1I25pQ9S4cMVhcST2uW4xY5zA6bC7dE8gHijLmNoPqRs',
  '1234',
  'Dr. Anita Rao',
  'CONSULTANT',
  'Principal Agronomist & Advisor',
  '+91 98230 44112',
  'Delta Agronomy Advisory',
  'Regional Agronomy & Diagnostics',
  'A',
  '#7E22CE',
  ARRAY['farm_health', 'crop_analytics', 'advisory', 'recommendations', 'read_reports']
),
(
  '8f72c605-04f5-4e6d-c7b8-9d0e1f2a3b4c',
  'venkat',
  'venkat@krishnadelta.in',
  'Venkat@2026!',
  '$2a$12$i2fJ9hOqS2J36qR0T5dNWidTU3vX5yZ6aB7cD8eF9hIjkMnOpQrSt',
  '1234',
  'Venkat Reddy',
  'OWNER',
  'Commercial Paddy Producer',
  '+91 94901 33445',
  'Krishna Delta Farm',
  'Tenali Wet Belt (40.0 Acres)',
  'V',
  '#0D9488',
  ARRAY['financials', 'operations', 'reports']
),
(
  '9a83d706-15a6-4f7e-d8c9-0e1f2a3b4c5d',
  'laxmi',
  'laxmi@godavariagri.in',
  'Laxmi@2026!',
  '$2a$12$j3gK0iPrT3K47rS1U6eOXjeUV4wY6zA7bC8dE9fG0iJklNoPqRsTu',
  '1234',
  'Laxmi Devi',
  'OWNER',
  'Organic Horticulture Farmer',
  '+91 98492 11223',
  'Godavari Bio-Agri',
  'Godavari Alluvial Parcel (15.0 Acres)',
  'L',
  '#BE185D',
  ARRAY['financials', 'operations', 'reports']
),
(
  'ab94e807-26b7-408f-e9da-1f2a3b4c5d6e',
  'kiran',
  'kiran@rayalaseema.in',
  'Kiran@2026!',
  '$2a$12$k4hL1jQsU4L58sT2V7fPYkfVW5xZ7aB8cD9eF0gH1jKlmOpQrStUv',
  '1234',
  'Kiran Kumar',
  'OWNER',
  'Dryland Pulses Specialist',
  '+91 99887 66554',
  'Rayalaseema Dryland Estate',
  'Anantapur Rainfed Block (30.0 Acres)',
  'K',
  '#C026D3',
  ARRAY['financials', 'operations', 'reports']
),
(
  'bc05f908-37c8-4190-faeb-2a3b4c5d6e7f',
  'subba',
  'subba@andhrafarms.in',
  'Subba@2026!',
  '$2a$12$l5iM2kRtV5M69tU3W8gQZlgWX6yA8bC9dE0fG1hI2kLmnPqRsTuVw',
  '1234',
  'Subba Rao',
  'WORKER',
  'Harvest Machinery Specialist',
  '+91 98765 43210',
  'Andhra Agro Machinery Hub',
  'Custom Hire Operations',
  'S',
  '#EA580C',
  ARRAY['today_tasks', 'start_task', 'complete_task']
)
ON CONFLICT (username) DO UPDATE SET
  password_plain = EXCLUDED.password_plain,
  password_hash = EXCLUDED.password_hash,
  pin = EXCLUDED.pin,
  phone = EXCLUDED.phone,
  farm_name = EXCLUDED.farm_name,
  role = EXCLUDED.role,
  updated_at = now();

-- =========================================================================
-- 2. FARM AI REPORTS TABLE (Comprehensive Dossiers Generated by AI Engine)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.farm_ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID DEFAULT '43666b6c-8208-4148-be22-df38d21b1836',
  farm_name TEXT NOT NULL DEFAULT 'Green Valley Farm',
  generated_by TEXT NOT NULL DEFAULT 'siddharth',
  language TEXT NOT NULL DEFAULT 'en',
  language_name TEXT NOT NULL DEFAULT 'English',
  report_title TEXT NOT NULL,
  executive_summary TEXT NOT NULL,
  health_score INTEGER NOT NULL DEFAULT 82,
  crop_stage_analysis JSONB NOT NULL DEFAULT '{}',
  water_awd_telemetry JSONB NOT NULL DEFAULT '{}',
  pathology_nutrient_status JSONB NOT NULL DEFAULT '{}',
  weather_context JSONB NOT NULL DEFAULT '{}',
  financial_projection JSONB NOT NULL DEFAULT '{}',
  priority_actions JSONB NOT NULL DEFAULT '[]',
  raw_content TEXT,
  model_used TEXT NOT NULL DEFAULT 'farmpilot-neural-engine',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_farm_ai_reports_farm_id ON public.farm_ai_reports (farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_ai_reports_created ON public.farm_ai_reports (created_at DESC);

-- Enable RLS
ALTER TABLE public.farm_ai_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and authenticated read for farm AI reports" ON public.farm_ai_reports;
CREATE POLICY "Public and authenticated read for farm AI reports"
  ON public.farm_ai_reports FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Insert farm AI reports" ON public.farm_ai_reports;
CREATE POLICY "Insert farm AI reports"
  ON public.farm_ai_reports FOR INSERT
  WITH CHECK (true);

-- Seed initial benchmark AI farm report
INSERT INTO public.farm_ai_reports (
  id,
  farm_id,
  farm_name,
  generated_by,
  language,
  language_name,
  report_title,
  executive_summary,
  health_score,
  crop_stage_analysis,
  water_awd_telemetry,
  pathology_nutrient_status,
  weather_context,
  financial_projection,
  priority_actions,
  raw_content
) VALUES (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  '43666b6c-8208-4148-be22-df38d21b1836',
  'Green Valley Farm',
  'siddharth',
  'en',
  'English',
  'Comprehensive Kharif 2026 Estate Agronomic & Financial Intelligence Report',
  'Green Valley Farm demonstrates robust operational vigor (Overall Health: 82/100) on Day 38 of the Kharif Paddy cycle. Sowing of BPT-5204 Samba Mahsuri is progressing through peak Active Tillering. Water hydrology under Alternate Wetting and Drying (AWD) is currently in the safe perched zone at -4.0 cm. However, proactive foliar intervention with 0.5% Zinc Sulfate is required immediately to remedy nascent chlorosis symptoms before day 40. Financial outlay is currently 37% of budget with an estimated break-even yield of 1.81 Tonnes/Acre against a projected 4.20 Tonnes/Acre, indicating an expected net operating profit of ₹1,93,500.',
  82,
  '{"crop": "Paddy (BPT-5204 Samba Mahsuri)", "parcel": "North Block (Plot A)", "area_acres": 10.0, "sowing_date": "2026-06-15", "days_from_sowing": 38, "current_stage": "Active Tillering", "target_harvest": "2026-10-15", "canopy_vigor": "Optimal", "panicle_initiation_due_in_days": 17}',
  '{"regime": "Alternate Wetting & Drying (AWD)", "field_water_tube_depth_cm": -4.0, "status": "SAFE_PERCHED_TABLE", "soil_moisture_pct": 31.2, "next_irrigation_due_in_hours": 48, "sluice_valve": "CLOSED", "cumulative_water_saved_liters": 420000}',
  '{"symptoms_detected": "Minor interveinal chlorosis on lower leaves", "deficiency": "Zinc (Zn)", "risk_level": "MODERATE_URGENT", "prescription": "Foliar spray of 0.5% ZnSO4 (Zinc Sulfate 21%) + 1% Urea", "target_window": "Before Day 40 (within 48 hours)", "blast_risk": "LOW (Dry canopy window)"}',
  '{"temp_c": 28.5, "rh_pct": 78, "wind_speed_kmh": 8.2, "rain_prob_48h": 15, "foliar_spray_window": "SAFE (Optimal wind < 10 km/h, rain probability low)"}',
  '{"total_spent_inr": 18500, "total_budget_inr": 50000, "budget_utilized_pct": 37, "cost_per_acre_inr": 1850, "expected_yield_t_per_ac": 4.2, "break_even_yield_t_per_ac": 1.81, "mandi_spot_rate_per_quintal_inr": 2550, "projected_revenue_inr": 336000, "projected_net_margin_inr": 193500}',
  '[{"id": "act-1", "priority": "CRITICAL", "action": "Foliar spray of 0.5% Zinc Sulfate + 1% Urea on North Block Plot A before Day 40.", "assignee": "Ravi Kumar (@ramu)"}, {"id": "act-2", "priority": "HIGH", "action": "Verify field water tube level at 06:00 tomorrow; do not flood field until water drops below -15 cm threshold.", "assignee": "Rajesh Patel (@rajesh)"}, {"id": "act-3", "priority": "MEDIUM", "action": "Monitor Machilipatnam Mandi spot bids for premium BPT-5204 grade A delivery.", "assignee": "Siddharth Saladi (@siddharth)"}]',
  'Automated Agronomic AI Synthesis generated for Green Valley Agriculture Ltd.'
) ON CONFLICT (id) DO NOTHING;
