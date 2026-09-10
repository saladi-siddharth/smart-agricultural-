-- ============================================
-- FARMPILOT DATABASE FUNCTIONS & STORED PROCEDURES
-- Migration: 003_database_functions.sql
-- ============================================

-- Function: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(new.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Execute handle_new_user on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Calculate crop financials (total expenses, target revenue, estimated net profit)
CREATE OR REPLACE FUNCTION public.calculate_crop_financials(p_crop_cycle_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_crop public.crop_cycles%ROWTYPE;
  v_total_expenses numeric := 0;
  v_estimated_revenue numeric := 0;
  v_estimated_profit numeric := 0;
  v_margin numeric := 0;
BEGIN
  SELECT * INTO v_crop FROM public.crop_cycles WHERE id = p_crop_cycle_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Crop cycle not found');
  END IF;

  -- Total expenses
  SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
  FROM public.expenses
  WHERE crop_cycle_id = p_crop_cycle_id;

  -- Target revenue
  v_estimated_revenue := COALESCE(v_crop.target_yield * v_crop.selling_price_per_unit, 0);

  -- Profit
  v_estimated_profit := v_estimated_revenue - v_total_expenses;

  -- Margin %
  IF v_estimated_revenue > 0 THEN
    v_margin := ROUND(((v_estimated_profit / v_estimated_revenue) * 100)::numeric, 1);
  ELSE
    v_margin := 0;
  END IF;

  RETURN jsonb_build_object(
    'crop_cycle_id', p_crop_cycle_id,
    'total_expenses', v_total_expenses,
    'planned_budget', v_crop.planned_budget,
    'estimated_revenue', v_estimated_revenue,
    'estimated_profit', v_estimated_profit,
    'profit_margin_pct', v_margin
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Calculate Farm Health Score (0-100)
-- 35% Task Completion + 25% Schedule Adherence + 20% Cost Efficiency + 20% Progress
CREATE OR REPLACE FUNCTION public.calculate_farm_health_score(p_farm_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_total_tasks int := 0;
  v_completed_tasks int := 0;
  v_ontime_tasks int := 0;
  v_task_completion_score numeric := 100;
  v_schedule_score numeric := 100;
  v_cost_score numeric := 85;
  v_progress_score numeric := 0;
  v_overall numeric := 0;
  v_total_budget numeric := 0;
  v_total_spent numeric := 0;
  v_budget_ratio numeric := 0;
BEGIN
  -- Total & completed activities
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'COMPLETED')
  INTO v_total_tasks, v_completed_tasks
  FROM public.activities
  WHERE farm_id = p_farm_id;

  IF v_total_tasks > 0 THEN
    v_task_completion_score := (v_completed_tasks::numeric / v_total_tasks::numeric) * 100;
  END IF;

  -- Schedule adherence
  SELECT COUNT(*) FILTER (WHERE completed_date IS NOT NULL AND completed_date <= planned_date)
  INTO v_ontime_tasks
  FROM public.activities
  WHERE farm_id = p_farm_id AND status = 'COMPLETED';

  IF v_completed_tasks > 0 THEN
    v_schedule_score := (v_ontime_tasks::numeric / v_completed_tasks::numeric) * 100;
  END IF;

  -- Cost score
  SELECT COALESCE(SUM(planned_budget), 0) INTO v_total_budget
  FROM public.crop_cycles WHERE farm_id = p_farm_id AND status = 'ACTIVE';

  SELECT COALESCE(SUM(amount), 0) INTO v_total_spent
  FROM public.expenses WHERE farm_id = p_farm_id;

  IF v_total_budget > 0 THEN
    v_budget_ratio := v_total_spent / v_total_budget;
    IF v_budget_ratio <= 0.85 THEN
      v_cost_score := 95;
    ELSIF v_budget_ratio <= 1.0 THEN
      v_cost_score := 85;
    ELSIF v_budget_ratio <= 1.15 THEN
      v_cost_score := 65;
    ELSE
      v_cost_score := 40;
    END IF;
  END IF;

  v_overall := ROUND(
    (v_task_completion_score * 0.35) +
    (v_schedule_score * 0.25) +
    (v_cost_score * 0.20) +
    (v_task_completion_score * 0.20)
  );

  RETURN jsonb_build_object(
    'farm_id', p_farm_id,
    'overall', v_overall,
    'task_completion', ROUND(v_task_completion_score),
    'schedule_adherence', ROUND(v_schedule_score),
    'cost_efficiency', ROUND(v_cost_score),
    'crop_progress', ROUND(v_task_completion_score)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
