-- ============================================
-- FARMPILOT — ROW LEVEL SECURITY POLICIES
-- Ownership chain: user → farm → field → crop_cycle → *
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irrigation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- FARMS — Direct ownership
-- ============================================
CREATE POLICY "Users can view own farms"
  ON public.farms FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create farms"
  ON public.farms FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own farms"
  ON public.farms FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own farms"
  ON public.farms FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================
-- FIELDS — Via farm ownership
-- ============================================
CREATE POLICY "Users can view fields of own farms"
  ON public.fields FOR SELECT
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create fields in own farms"
  ON public.fields FOR INSERT
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update fields in own farms"
  ON public.fields FOR UPDATE
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete fields in own farms"
  ON public.fields FOR DELETE
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

-- ============================================
-- CROP CYCLES — Via farm ownership
-- ============================================
CREATE POLICY "Users can view crop cycles of own farms"
  ON public.crop_cycles FOR SELECT
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create crop cycles in own farms"
  ON public.crop_cycles FOR INSERT
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update crop cycles in own farms"
  ON public.crop_cycles FOR UPDATE
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete crop cycles in own farms"
  ON public.crop_cycles FOR DELETE
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

-- ============================================
-- ACTIVITIES — Via farm ownership
-- ============================================
CREATE POLICY "Users can view activities of own farms"
  ON public.activities FOR SELECT
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create activities in own farms"
  ON public.activities FOR INSERT
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update activities in own farms"
  ON public.activities FOR UPDATE
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete activities in own farms"
  ON public.activities FOR DELETE
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

-- ============================================
-- INPUTS — Via farm ownership
-- ============================================
CREATE POLICY "Users can view inputs of own farms"
  ON public.inputs FOR SELECT
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create inputs in own farms"
  ON public.inputs FOR INSERT
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update inputs in own farms"
  ON public.inputs FOR UPDATE
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete inputs in own farms"
  ON public.inputs FOR DELETE
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

-- ============================================
-- EXPENSES — Via farm ownership
-- ============================================
CREATE POLICY "Users can view expenses of own farms"
  ON public.expenses FOR SELECT
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create expenses in own farms"
  ON public.expenses FOR INSERT
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update expenses in own farms"
  ON public.expenses FOR UPDATE
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete expenses in own farms"
  ON public.expenses FOR DELETE
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

-- ============================================
-- IRRIGATION LOGS — Via farm ownership
-- ============================================
CREATE POLICY "Users can view irrigation logs of own farms"
  ON public.irrigation_logs FOR SELECT
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create irrigation logs in own farms"
  ON public.irrigation_logs FOR INSERT
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update irrigation logs in own farms"
  ON public.irrigation_logs FOR UPDATE
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete irrigation logs in own farms"
  ON public.irrigation_logs FOR DELETE
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

-- ============================================
-- HARVESTS — Via farm ownership
-- ============================================
CREATE POLICY "Users can view harvests of own farms"
  ON public.harvests FOR SELECT
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can create harvests in own farms"
  ON public.harvests FOR INSERT
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update harvests of own farms"
  ON public.harvests FOR UPDATE
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete harvests of own farms"
  ON public.harvests FOR DELETE
  USING (farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid()));

-- ============================================
-- ALERTS — Direct ownership
-- ============================================
CREATE POLICY "Users can view own alerts"
  ON public.alerts FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create own alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own alerts"
  ON public.alerts FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own alerts"
  ON public.alerts FOR DELETE
  USING (owner_id = auth.uid());
