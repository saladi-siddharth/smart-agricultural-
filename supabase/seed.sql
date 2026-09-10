-- ============================================
-- FARMPILOT SEED DATA SCRIPT
-- Realistic demo data for Green Valley Farm (Machilipatnam, AP)
-- ============================================

-- Note: In Supabase, you can run this script after signing up
-- with user email farmer@greenvalley.in or replace the owner_id with your auth.uid()

DO $$
DECLARE
  v_user_id uuid;
  v_farm_id uuid;
  v_field_north uuid;
  v_field_south uuid;
  v_field_east uuid;
  v_crop_paddy uuid;
  v_crop_urad uuid;
BEGIN
  -- Retrieve first user or create placeholder
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No auth.users found. Run after signing up a user in Supabase Auth.';
    RETURN;
  END IF;

  -- 1. Create Farm
  INSERT INTO public.farms (id, owner_id, name, location, district, state, total_area, area_unit, description)
  VALUES (
    gen_random_uuid(),
    v_user_id,
    'Green Valley Farm',
    'Machilipatnam Coastal Belt',
    'Krishna',
    'Andhra Pradesh',
    12.5,
    'acres',
    'Model precision and organic paddy cultivation unit with canal lift and solar drip infrastructure.'
  )
  RETURNING id INTO v_farm_id;

  -- 2. Create Fields
  INSERT INTO public.fields (id, farm_id, name, area, area_unit, soil_type, irrigation_type, description)
  VALUES
    (gen_random_uuid(), v_farm_id, 'North Field (Parcel A)', 5.0, 'acres', 'Clay Loam', 'Canal + Drip', 'Prime low-lying paddy parcel with high water retention.')
    RETURNING id INTO v_field_north;

  INSERT INTO public.fields (id, farm_id, name, area, area_unit, soil_type, irrigation_type, description)
  VALUES
    (gen_random_uuid(), v_farm_id, 'South Field (Parcel B)', 4.5, 'acres', 'Alluvial Soil', 'Borewell Flood', 'Centrally drained parcel with dedicated solar borewell pump.')
    RETURNING id INTO v_field_south;

  INSERT INTO public.fields (id, farm_id, name, area, area_unit, soil_type, irrigation_type, description)
  VALUES
    (gen_random_uuid(), v_farm_id, 'East Canal Field (Parcel C)', 3.0, 'acres', 'Sandy Clay', 'Canal Lift', 'Border field with direct canal intake sluice gate.')
    RETURNING id INTO v_field_east;

  -- 3. Create Crop Cycles
  INSERT INTO public.crop_cycles (
    id, farm_id, field_id, crop_name, variety, season,
    start_date, expected_harvest_date, status,
    target_yield, yield_unit, selling_price_per_unit, planned_budget, notes
  )
  VALUES (
    gen_random_uuid(), v_farm_id, v_field_north, 'Paddy (Rice)', 'BPT 5204 (Samba Mahsuri)', 'Kharif',
    '2026-06-15', '2026-11-20', 'ACTIVE',
    4.5, 'tonnes', 28500, 62000,
    'Export quality premium aromatic rice. Applying integrated nutrient and pest management.'
  )
  RETURNING id INTO v_crop_paddy;

  INSERT INTO public.crop_cycles (
    id, farm_id, field_id, crop_name, variety, season,
    start_date, expected_harvest_date, status,
    target_yield, yield_unit, selling_price_per_unit, planned_budget, notes
  )
  VALUES (
    gen_random_uuid(), v_farm_id, v_field_south, 'Black Gram (Urad)', 'LBG-752', 'Rabi',
    '2025-11-10', '2026-02-28', 'COMPLETED',
    1.8, 'tonnes', 74500, 28000,
    'Post-monsoon pulse rotation cycle with high market yield.'
  )
  RETURNING id INTO v_crop_urad;

  -- 4. Create Activities (5 completed, 1 overdue, 2 pending)
  INSERT INTO public.activities (farm_id, field_id, crop_cycle_id, title, description, activity_type, planned_date, completed_date, status, priority, estimated_cost, actual_cost)
  VALUES
    (v_farm_id, v_field_north, v_crop_paddy, 'Summer Ploughing & Field Puddling', 'Deep tractor ploughing followed by 2 passes of puddling.', 'LAND_PREPARATION', '2026-06-18', '2026-06-18', 'COMPLETED', 'HIGH', 7000, 7500),
    (v_farm_id, v_field_north, v_crop_paddy, 'Seed Treatment with Trichoderma', 'Treating 25 kg BPT 5204 seeds with bio-agent Trichoderma.', 'SOWING', '2026-06-22', '2026-06-22', 'COMPLETED', 'MEDIUM', 1500, 1400),
    (v_farm_id, v_field_north, v_crop_paddy, 'Nursery Bed Sowing & Mat Preparation', 'Raised nursery bed preparation and uniform seed broadcasting.', 'SOWING', '2026-06-25', '2026-06-25', 'COMPLETED', 'HIGH', 3500, 3200),
    (v_farm_id, v_field_north, v_crop_paddy, 'Main Field Mechanical Transplantation', 'Transplanting 21-day seedlings with 20x15 cm hill spacing.', 'SOWING', '2026-07-16', '2026-07-16', 'COMPLETED', 'CRITICAL', 11000, 12000),
    (v_farm_id, v_field_north, v_crop_paddy, 'First Mechanical Cono-Weeding', 'Inter-cultivation weeding between rows and root aeration.', 'WEEDING', '2026-08-05', '2026-08-06', 'COMPLETED', 'HIGH', 4000, 4200),
    -- OVERDUE TASK
    (v_farm_id, v_field_north, v_crop_paddy, 'Second Fertilizer Application (NPK 20-20-20 + Zinc)', 'Active tillering top-dressing with complex NPK and Zinc sulphate.', 'FERTILIZATION', '2026-08-28', NULL, 'OVERDUE', 'CRITICAL', 6500, 0),
    -- PENDING TASKS
    (v_farm_id, v_field_north, v_crop_paddy, 'Secondary Canal Irrigation Round', 'Maintain 3-5 cm standing water layer in parcel.', 'IRRIGATION', '2026-09-12', NULL, 'PENDING', 'MEDIUM', 2500, 0),
    (v_farm_id, v_field_north, v_crop_paddy, 'Panicle Initiation Pest Scouting (Stem Borer)', 'Pheromone trap count and scouting for stem borer.', 'PEST_INSPECTION', '2026-09-18', NULL, 'PENDING', 'HIGH', 1800, 0);

  -- 5. Create Expenses
  INSERT INTO public.expenses (farm_id, field_id, crop_cycle_id, category, description, amount, expense_date)
  VALUES
    (v_farm_id, v_field_north, v_crop_paddy, 'SEEDS', 'Certified BPT 5204 Foundation Seeds', 4800, '2026-06-16'),
    (v_farm_id, v_field_north, v_crop_paddy, 'MACHINERY', '45HP Tractor Ploughing & Dual Rotavator', 7500, '2026-06-19'),
    (v_farm_id, v_field_north, v_crop_paddy, 'LABOR', 'Transplantation Labor (15 workers @ ₹800)', 12000, '2026-07-17'),
    (v_farm_id, v_field_north, v_crop_paddy, 'FERTILIZER', 'Basal Nutrients: DAP & Neem Cake Pack', 5000, '2026-07-28'),
    (v_farm_id, v_field_north, v_crop_paddy, 'LABOR', 'First Cono-Weeding Labor (7 workers)', 4200, '2026-08-06'),
    (v_farm_id, v_field_north, v_crop_paddy, 'IRRIGATION', 'Solar Borewell Service & Canal Sluice Cess', 2500, '2026-08-20');

  -- 6. Create Inputs
  INSERT INTO public.inputs (farm_id, field_id, crop_cycle_id, name, input_type, quantity, unit, cost, used_date, supplier)
  VALUES
    (v_farm_id, v_field_north, v_crop_paddy, 'Certified BPT 5204 Paddy Seeds', 'SEED', 25, 'kg', 4800, '2026-06-20', 'AP State Seed Corp'),
    (v_farm_id, v_field_north, v_crop_paddy, 'DAP (Di-Ammonium Phosphate)', 'FERTILIZER', 100, 'kg', 3200, '2026-07-15', 'IFFCO Farmers Center'),
    (v_farm_id, v_field_north, v_crop_paddy, 'Neem Cake Organic Soil Conditioner', 'ORGANIC_MANURE', 50, 'kg', 1800, '2026-07-15', 'Sri Krishna Bio Agro'),
    (v_farm_id, v_field_north, v_crop_paddy, 'Zinc Sulphate Heptahydrate', 'FERTILIZER', 10, 'kg', 1400, '2026-08-01', 'IFFCO Machilipatnam'),
    (v_farm_id, v_field_north, v_crop_paddy, 'Trichoderma Viride Bio-Fungicide', 'PESTICIDE', 2, 'kg', 800, '2026-06-22', 'National Seeds Corp');

  -- 7. Create Irrigation Logs
  INSERT INTO public.irrigation_logs (farm_id, field_id, crop_cycle_id, irrigation_date, water_source, duration_minutes, water_quantity, water_unit, cost, method)
  VALUES
    (v_farm_id, v_field_north, v_crop_paddy, '2026-07-16', 'CANAL', 360, 120000, 'liters', 1200, 'Controlled Canal Flood'),
    (v_farm_id, v_field_north, v_crop_paddy, '2026-08-04', 'BOREWELL', 240, 80000, 'liters', 800, 'Solar Borewell Flood'),
    (v_farm_id, v_field_north, v_crop_paddy, '2026-08-22', 'CANAL', 300, 100000, 'liters', 1000, 'Canal Lift Sluice');

  -- 8. Create Harvest Records
  INSERT INTO public.harvests (farm_id, field_id, crop_cycle_id, harvest_date, actual_yield, yield_unit, selling_price, quality, buyer)
  VALUES
    (v_farm_id, v_field_south, v_crop_urad, '2026-02-28', 1.95, 'tonnes', 74500, 'EXCELLENT', 'Andhra Pradesh State Co-op Marketing Fed');

  RAISE NOTICE 'Green Valley Farm demo scenario successfully seeded!';
END;
$$;
