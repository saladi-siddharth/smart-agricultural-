/**
 * FarmPilot Phase 2 Configuration & Seed State
 * Multi-Tenant SaaS Architecture: Organization -> Farm -> Field -> Crop Cycle -> Operations
 */

window.FARMPILOT_CONFIG = {
  SUPABASE_URL: 'https://xgcamlpkbgjulkfknpud.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_3rbDSN4ONrtCxacboVfEdA_3nkUt82f',

  // Phase 2 Multi-Tenant Organization Entity
  DEFAULT_ORGANIZATION: {
    id: '4b2766a7-3f5f-45bf-9f41-926c7855aeeb',
    name: 'Green Valley Agriculture Ltd',
    slug: 'green-valley-agri',
    plan: 'PROFESSIONAL', // STARTER | PROFESSIONAL | ENTERPRISE
    plan_limits: {
      farms: 5,
      fields: 25,
      users: 10,
      reporting: 'Advanced Analytics & CSV Export',
      support: 'Priority Agronomist Support'
    },
    created_at: '2026-06-01T00:00:00.000Z'
  },

  // Phase 2 Demo Personas (Role Switcher & Authentication)
  PERSONAS: {
    OWNER: {
      id: '33dd8f01-e3c5-42a8-9194-a92504a75246',
      email: 'farmer@greenvalley.in',
      username: 'siddharth',
      full_name: 'Siddharth Saladi',
      role: 'OWNER',
      roleLabel: 'Farm Owner & Executive',
      farm_name: 'Green Valley Farm',
      badge: 'Owner',
      badgeClass: 'badge-success',
      avatar: 'S',
      pin: '1234',
      permissions: ['financials', 'org_settings', 'all_farms', 'reports', 'alerts', 'manage_members']
    },
    MANAGER: {
      id: 'usr-mgr-02',
      email: 'manager@greenvalley.in',
      username: 'rajesh',
      full_name: 'Rajesh Patel',
      role: 'MANAGER',
      roleLabel: 'Estate Operations Manager',
      farm_name: 'Green Valley Farm',
      badge: 'Manager',
      badgeClass: 'badge-primary',
      avatar: 'R',
      pin: '1234',
      permissions: ['operations', 'task_assignment', 'fields', 'crops', 'inputs', 'expenses', 'irrigation', 'alerts']
    },
    WORKER: {
      id: '12f2a103-05d5-498f-b187-406bf7f634cd',
      email: 'worker@greenvalley.in',
      username: 'ramu',
      full_name: 'Ravi Kumar',
      role: 'WORKER',
      roleLabel: 'Field Operations Operator',
      farm_name: 'Green Valley Farm',
      badge: 'Worker',
      badgeClass: 'badge-warning',
      avatar: 'K',
      pin: '1234',
      permissions: ['today_tasks', 'start_task', 'complete_task', 'view_field']
    },
    CONSULTANT: {
      id: 'usr-con-04',
      email: 'consultant@greenvalley.in',
      username: 'anita',
      full_name: 'Dr. Anita Rao',
      role: 'CONSULTANT',
      roleLabel: 'Principal Agronomist & Advisor',
      farm_name: 'Delta Agronomy Advisory',
      badge: 'Consultant',
      badgeClass: 'badge-neutral',
      avatar: 'A',
      pin: '1234',
      permissions: ['farm_health', 'crop_analytics', 'advisory', 'recommendations', 'read_reports']
    }
  },

  // Phase 2 Portfolio of Farms
  DEFAULT_FARMS: [
    {
      id: '43666b6c-8208-4148-be22-df38d21b1836',
      organization_id: '4b2766a7-3f5f-45bf-9f41-926c7855aeeb',
      name: 'Green Valley Farm',
      location: 'Machilipatnam Delta Belt',
      district: 'Krishna',
      state: 'Andhra Pradesh',
      total_area: 25.0,
      area_unit: 'acres',
      coordinates: '16.1809° N, 81.1378° E',
      description: 'Primary commercial paddy and pulse production estate with canal-lift and solar drip infrastructure.',
      health_score: 82,
      active_crops: 1,
      fields_count: 3,
      budget: 50000,
      spent: 18500,
      est_revenue: 121800,
      est_profit: 71800
    },
    {
      id: 'farm-krishna-02',
      organization_id: '4b2766a7-3f5f-45bf-9f41-926c7855aeeb',
      name: 'Krishna Delta Farm',
      location: 'Tenali Lowland Sector',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      total_area: 18.5,
      area_unit: 'acres',
      coordinates: '16.2435° N, 80.6400° E',
      description: 'High-clay soil agro-plot dedicated to precision flood and AWD organic rice cultivation.',
      health_score: 91,
      active_crops: 1,
      fields_count: 2,
      budget: 38000,
      spent: 14200,
      est_revenue: 95000,
      est_profit: 57000
    },
    {
      id: 'farm-godavari-03',
      organization_id: '4b2766a7-3f5f-45bf-9f41-926c7855aeeb',
      name: 'Godavari Organic Estate',
      location: 'Rajahmundry Alluvial Basin',
      district: 'East Godavari',
      state: 'Andhra Pradesh',
      total_area: 30.0,
      area_unit: 'acres',
      coordinates: '17.0005° N, 81.8040° E',
      description: 'Certified organic agroforestry and pulse rotation block with integrated micro-sprinklers.',
      health_score: 88,
      active_crops: 1,
      fields_count: 4,
      budget: 65000,
      spent: 22000,
      est_revenue: 156000,
      est_profit: 91000
    }
  ],

  DEFAULT_FIELDS: [
    {
      id: 'field-1',
      farm_id: '43666b6c-8208-4148-be22-df38d21b1836',
      name: 'North Block (Plot A)',
      code: 'SEC-01',
      area: 10.0,
      area_unit: 'acres',
      soil_type: 'Clay Loam (pH 6.8)',
      irrigation_type: 'Canal Lift + Drip',
      status: 'ATTENTION',
      crop_name: 'Paddy (Rice)',
      variety: 'BPT-5204',
      stage: 'Fertilization (58%)'
    },
    {
      id: 'field-2',
      farm_id: '43666b6c-8208-4148-be22-df38d21b1836',
      name: 'Central Sector (Plot B)',
      code: 'SEC-02',
      area: 8.5,
      area_unit: 'acres',
      soil_type: 'Alluvial Loam (pH 7.1)',
      irrigation_type: 'Solar Borewell Flood',
      status: 'OPTIMAL',
      crop_name: 'Paddy (Rice)',
      variety: 'MTU-1010',
      stage: 'Sowing & Nursery'
    },
    {
      id: 'field-3',
      farm_id: '43666b6c-8208-4148-be22-df38d21b1836',
      name: 'South Sector (Plot C)',
      code: 'SEC-03',
      area: 6.5,
      area_unit: 'acres',
      soil_type: 'Black Cotton Soil (pH 7.4)',
      irrigation_type: 'Rainfed + Canal Line',
      status: 'FALLOW',
      crop_name: 'Dhaincha (Cover Crop)',
      variety: 'Nitrogen Fixer',
      stage: 'Soil Preparation'
    }
  ],

  DEFAULT_CROP_CYCLE: {
    id: 'crop-1',
    farm_id: '43666b6c-8208-4148-be22-df38d21b1836',
    field_id: 'field-1',
    crop_name: 'Paddy (Rice)',
    variety: 'BPT-5204 (Samba Mahsuri)',
    season: 'Kharif',
    start_date: '2026-06-15',
    expected_harvest_date: '2026-11-20',
    status: 'ACTIVE',
    target_yield: 4.2,
    yield_unit: 'tonnes',
    selling_price_per_unit: 29000,
    planned_budget: 50000,
    current_stage: 'Fertilization',
    current_stage_progress: 58,
    stages: [
      { name: 'Land preparation', duration: 'Day 1-15', status: 'COMPLETED' },
      { name: 'Sowing', duration: 'Day 16-35', status: 'COMPLETED' },
      { name: 'Irrigation', duration: 'Day 36-55', status: 'COMPLETED' },
      { name: 'Fertilization', duration: 'Day 56-80', status: 'IN_PROGRESS', progress: 58 },
      { name: 'Pest management', duration: 'Day 81-110', status: 'PLANNED' },
      { name: 'Harvest', duration: 'Day 111-140', status: 'PLANNED' }
    ]
  },

  DEFAULT_ACTIVITIES: [
    {
      id: 'act-1',
      farm_id: '43666b6c-8208-4148-be22-df38d21b1836',
      field_id: 'field-1',
      title: 'Zinc Sulfate Foliar Spray (0.5%)',
      category: 'FERTILIZATION',
      field_name: 'North Block (Plot A)',
      due_date: '2026-09-08',
      status: 'OVERDUE',
      priority: 'HIGH',
      cost: 1400,
      assigned_to: '12f2a103-05d5-498f-b187-406bf7f634cd',
      assigned_to_name: 'Ravi Kumar',
      notes: 'Soil test shows zinc level at 0.4 ppm (critical threshold <0.6 ppm). Prevent interveinal chlorosis and tillering stunted growth.'
    },
    {
      id: 'act-2',
      farm_id: '43666b6c-8208-4148-be22-df38d21b1836',
      field_id: 'field-1',
      title: 'Nitrogen Top-Dressing (Urea 45kg/ha)',
      category: 'FERTILIZATION',
      field_name: 'North Block (Plot A)',
      due_date: '2026-09-12',
      status: 'PENDING',
      priority: 'MEDIUM',
      cost: 2800,
      assigned_to: '12f2a103-05d5-498f-b187-406bf7f634cd',
      assigned_to_name: 'Ravi Kumar',
      notes: 'Split application at active tillering peak after field drying.'
    },
    {
      id: 'act-3',
      farm_id: '43666b6c-8208-4148-be22-df38d21b1836',
      field_id: 'field-2',
      title: 'Stem Borer Pheromone Trap Inspection',
      category: 'PEST_INSPECTION',
      field_name: 'Central Sector (Plot B)',
      due_date: '2026-09-14',
      status: 'PENDING',
      priority: 'LOW',
      cost: 450,
      assigned_to: '12f2a103-05d5-498f-b187-406bf7f634cd',
      assigned_to_name: 'Ravi Kumar',
      notes: 'Check 4 lure traps across central perimeter; log adult moth count.'
    },
    {
      id: 'act-4',
      farm_id: '43666b6c-8208-4148-be22-df38d21b1836',
      field_id: 'field-1',
      title: 'Basal Soil Puddling & Land Preparation',
      category: 'LAND_PREPARATION',
      field_name: 'North Block (Plot A)',
      due_date: '2026-06-15',
      completed_date: '2026-06-15',
      status: 'COMPLETED',
      priority: 'HIGH',
      cost: 6200,
      assigned_to: '12f2a103-05d5-498f-b187-406bf7f634cd',
      assigned_to_name: 'Ravi Kumar',
      notes: 'Two tractor passes followed by laser leveler board.'
    },
    {
      id: 'act-5',
      farm_id: '43666b6c-8208-4148-be22-df38d21b1836',
      field_id: 'field-1',
      title: 'Seedling Transplanting (25-Day Old)',
      category: 'SOWING',
      field_name: 'North Block (Plot A)',
      due_date: '2026-07-04',
      completed_date: '2026-07-04',
      status: 'COMPLETED',
      priority: 'HIGH',
      cost: 5600,
      assigned_to: '12f2a103-05d5-498f-b187-406bf7f634cd',
      assigned_to_name: 'Ravi Kumar',
      notes: 'Transplanted 2-3 seedlings per hill at 20x15 cm spacing.'
    }
  ],

  DEFAULT_ALERTS: [
    {
      id: 'alrt-1',
      reference_id: 'act-zinc-spray',
      farm_id: '43666b6c-8208-4148-be22-df38d21b1836',
      severity: 'CRITICAL',
      alert_type: 'OVERDUE_TASK',
      category: 'OPERATIONAL',
      title: 'Zinc Deficiency Remediation Overdue',
      message: 'North Block (Plot A) soil test shows 0.4 ppm Zn (threshold 0.6 ppm). Foliar spray is 2 days overdue.',
      recommendation: 'Spray 0.5% Zinc Sulfate + 0.25% lime solution immediately to prevent tillering stunted growth.',
      reason: 'Zinc is an essential micronutrient for indole acetic acid synthesis during active tillering in rice.',
      source_data: 'Soil Health Card #2026-AP-4891',
      is_resolved: false,
      created_at: '2026-09-08T08:30:00.000Z'
    },
    {
      id: 'alrt-2',
      reference_id: 'fin-budget-variance',
      farm_id: '43666b6c-8208-4148-be22-df38d21b1836',
      severity: 'WARNING',
      alert_type: 'COST_WARNING',
      category: 'FINANCIAL',
      title: 'Fertilizer Budget Variance (+14.3%)',
      message: 'Unplanned micronutrient spray added ₹1,400 to the Kharif nutrient outlay.',
      recommendation: 'Reallocate ₹1,400 from weed management contingency to preserve 60% target margin.',
      reason: 'Basal and top dressing costs reached ₹9,500 vs planned ₹8,100 threshold.',
      source_data: 'Financial Ledger Batch #1 & #2',
      is_resolved: false,
      created_at: '2026-09-09T10:15:00.000Z'
    },
    {
      id: 'alrt-3',
      reference_id: 'pos-tillering-vigor',
      farm_id: '43666b6c-8208-4148-be22-df38d21b1836',
      severity: 'SUCCESS',
      alert_type: 'POSITIVE',
      category: 'CROP_PROGRESS',
      title: 'Transplanting Survival at 96%',
      message: 'Vegetative tillering density has reached 24 tillers/hill on scheduled trajectory.',
      recommendation: 'Initiate scheduled Alternate Wetting and Drying (AWD) cycle to promote root aeration.',
      reason: 'Uniform root anchorage achieved across all 10.0 acres of North Block.',
      source_data: 'Agronomic Field Telemetry Station A',
      is_resolved: true,
      created_at: '2026-09-05T14:00:00.000Z'
    }
  ],

  DEFAULT_INPUTS: [
    {
      id: 'inp-1',
      name: 'Urea (46% N)',
      category: 'FERTILIZER',
      quantity: 500,
      unit: 'kg',
      unit_cost: 6.5,
      total_cost: 3250,
      supplier: 'IFFCO Farmers Service Center',
      date: '2026-06-20'
    },
    {
      id: 'inp-2',
      name: 'Di-Ammonium Phosphate (DAP 18-46-0)',
      category: 'FERTILIZER',
      quantity: 300,
      unit: 'kg',
      unit_cost: 27.0,
      total_cost: 8100,
      supplier: 'Kisan Krishi Kendra',
      date: '2026-06-22'
    },
    {
      id: 'inp-3',
      name: 'Certified Paddy Seed (BPT 5204)',
      category: 'SEED',
      quantity: 75,
      unit: 'kg',
      unit_cost: 48.0,
      total_cost: 3600,
      supplier: 'AP State Seeds Development Corp',
      date: '2026-06-10'
    },
    {
      id: 'inp-4',
      name: 'Zinc Sulfate Monohydrate (33% Zn)',
      category: 'CHEMICAL',
      quantity: 25,
      unit: 'kg',
      unit_cost: 72.0,
      total_cost: 1800,
      supplier: 'Coromandel Agritech',
      date: '2026-08-15'
    }
  ],

  DEFAULT_EXPENSES: [
    {
      id: 'exp-1',
      category: 'SEEDS',
      description: 'Certified BPT-5204 Foundation Seed Stock (75 kg)',
      amount: 3600,
      date: '2026-06-10'
    },
    {
      id: 'exp-2',
      category: 'FERTILIZERS',
      description: 'Basal DAP & Urea Nutrients Batch 1',
      amount: 8100,
      date: '2026-06-22'
    },
    {
      id: 'exp-3',
      category: 'LABOR',
      description: 'Transplanting Labor (14 Workers x 2 Days)',
      amount: 5600,
      date: '2026-07-04'
    },
    {
      id: 'exp-4',
      category: 'IRRIGATION',
      description: 'Canal Lift Sluice Operator Fee & Diesel Outlay',
      amount: 1200,
      date: '2026-07-20'
    }
  ],

  // Phase 2 Agricultural Crop Templates & Stage Definitions
  DEFAULT_CROP_TEMPLATES: [
    {
      id: 'tmpl-paddy',
      crop_name: 'Paddy (Rice)',
      variety: 'BPT-5204 (Samba Mahsuri)',
      season: 'Kharif',
      typical_duration_days: 140,
      target_yield_per_acre: 4.2,
      yield_unit: 'tonnes',
      benchmark_cost_per_acre: 5000,
      description: 'Slender superfine high-milling grain rice with high water requirement and AWD protocol compatibility.',
      stages: [
        { order: 1, name: 'Land Preparation', start_day: 1, end_day: 15, key_op: 'Puddling & Laser Leveling', risk: 'Improper leveling creates uneven submersion' },
        { order: 2, name: 'Nursery / Establishment', start_day: 16, end_day: 35, key_op: 'Wet Nursery Raising & Zinc Priming', risk: 'Seedling blight if drainage fails' },
        { order: 3, name: 'Transplanting', start_day: 36, end_day: 50, key_op: '2-3 Seedlings/Hill (20x15cm)', risk: 'Root shock or delayed establishment' },
        { order: 4, name: 'Vegetative / Active Tillering', start_day: 51, end_day: 80, key_op: 'Nitrogen Top-Dressing & Zinc Foliar Spray', risk: 'Zinc chlorosis, stem borer infestation' },
        { order: 5, name: 'Panicle Initiation', start_day: 81, end_day: 95, key_op: 'Potash Application & Water Ponding (2-3cm)', risk: 'Moisture stress aborts spikelet count' },
        { order: 6, name: 'Flowering / Anthesis', start_day: 96, end_day: 110, key_op: 'Pest Scouting & Brown Planthopper Check', risk: 'Extreme heat (>35°C) or rain causes pollen sterility' },
        { order: 7, name: 'Grain Filling (Milky to Dough)', start_day: 111, end_day: 125, key_op: 'Shallow Intermittent Wetting', risk: 'False smut or blast on neck' },
        { order: 8, name: 'Maturity & Field Drying', start_day: 126, end_day: 135, key_op: 'Canal Cut-Off & Pre-Harvest Drainage', risk: 'Lodging in unseasonal cyclonic rain' },
        { order: 9, name: 'Harvest & Threshing', start_day: 136, end_day: 140, key_op: 'Combine Harvester at 20-22% Moisture', risk: 'Shattering loss if delayed' }
      ]
    },
    {
      id: 'tmpl-cotton',
      crop_name: 'Cotton',
      variety: 'RCH-659 BG-II',
      season: 'Kharif',
      typical_duration_days: 160,
      target_yield_per_acre: 1.2,
      yield_unit: 'tonnes',
      benchmark_cost_per_acre: 5800,
      description: 'Long staple transgenic cotton demanding high nutrient balance and pink bollworm threshold monitoring.',
      stages: [
        { order: 1, name: 'Field Prep & Ridging', start_day: 1, end_day: 15, key_op: 'Deep Summer Ploughing', risk: 'Hardpan soil restricts taproot' },
        { order: 2, name: 'Emergence & Square Formation', start_day: 16, end_day: 45, key_op: 'First Intercultivation & Thinning', risk: 'Thrips and jassids sucking sap' },
        { order: 3, name: 'Peak Flowering & Boll Development', start_day: 46, end_day: 110, key_op: 'Potassium Nitrate Spray & Drip Fertigation', risk: 'Pink bollworm entry, square drop' },
        { order: 4, name: 'Boll Bursting & Multiple Pickings', start_day: 111, end_day: 160, key_op: 'Staggered Manual Cotton Picking', risk: 'Unseasonal rain discolors lint' }
      ]
    },
    {
      id: 'tmpl-maize',
      crop_name: 'Maize (Corn)',
      variety: 'Pioneer 3396',
      season: 'Rabi',
      typical_duration_days: 105,
      target_yield_per_acre: 3.5,
      yield_unit: 'tonnes',
      benchmark_cost_per_acre: 3800,
      description: 'High-yielding hybrid yellow grain maize with rapid vegetative development and critical tasseling moisture.',
      stages: [
        { order: 1, name: 'Bed Preparation', start_day: 1, end_day: 12, key_op: 'Ridge & Furrow Sowing', risk: 'Water stagnation impairs germination' },
        { order: 2, name: 'Knee-High Stage', start_day: 13, end_day: 40, key_op: 'First Nitrogen Split & Earthing Up', risk: 'Fall Armyworm whorl feeding' },
        { order: 3, name: 'Tasseling & Silking', start_day: 41, end_day: 65, key_op: 'Critical Irrigation & Boron Spray', risk: 'Drought during silking causes poor seed set' },
        { order: 4, name: 'Cob Maturity & Harvest', start_day: 66, end_day: 105, key_op: 'Harvest at Black Layer Formation', risk: 'Cob rot if moisture > 25%' }
      ]
    }
  ],

  // Phase 2 Historical Agricultural Benchmarks (For Farm Memory & Benchmarking)
  HISTORICAL_BENCHMARKS: {
    previous_cycle: {
      cycle_id: 'crop-paddy-kharif-2025',
      crop_name: 'Paddy (Rice)',
      variety: 'BPT-5204',
      season: 'Kharif 2025',
      field_name: 'North Block (Plot A)',
      total_cost: 42300,
      actual_yield: 3.9,
      selling_price: 26500,
      revenue: 103350,
      profit: 61050,
      fertilizer_spend: 6800,
      overdue_operations_count: 3,
      duration_days: 142
    },
    district_averages: {
      district: 'Krishna',
      crop: 'Paddy (Rice)',
      average_yield_acre: 3.8,
      average_cost_acre: 4800,
      typical_margin_pct: 54.0
    }
  },

  // Phase 2 Initial Seed Recommendations for Demo Decision-to-Action Loop
  DEFAULT_RECOMMENDATIONS: [
    {
      id: 'rec-1',
      title: 'Complete Zinc Sulfate Foliar Spray (0.5%)',
      priority: 'CRITICAL',
      category: 'NUTRITION',
      crop_name: 'Paddy',
      field_name: 'North Block (Plot A)',
      crop_stage: 'Active Tillering',
      activity_id: 'act-1',
      trigger_reason: 'Activity is 2 days overdue and soil test shows 0.4 ppm Zn (threshold <0.6 ppm).',
      agricultural_context: 'Paddy in active tillering phase requires immediate zinc co-factor synthesis to avert interveinal chlorosis and stunted tiller counts.',
      data_considered: {
        planned_date: '2026-09-08',
        current_date: '2026-09-10',
        soil_zinc_ppm: 0.4,
        threshold_ppm: 0.6,
        crop_stage: 'Estimated Active Tillering',
        estimated_cost: 1400
      },
      why_explanation: 'North Block (Plot A) soil test confirms severe zinc deficiency (0.4 ppm). Active tillering is the critical physiological window where zinc drives indole-3-acetic acid (IAA) enzyme activation. Delaying past this week causes permanent reduction in productive panicles.',
      impact_explanation: 'Schedule disruption risk is elevated. Potential tillering loss of 15-20% if interveinal chlorosis spreads across the 10.0 acre stand.',
      recommended_action: 'Complete scheduled foliar spray of 0.5% Zinc Sulfate + 0.25% lime today and record actual chemical inputs consumed.',
      status: 'NEW',
      feedback: null
    },
    {
      id: 'rec-2',
      title: 'Prepare Nitrogen Top-Dressing Split',
      priority: 'HIGH',
      category: 'FERTILIZATION',
      crop_name: 'Paddy',
      field_name: 'North Block (Plot A)',
      crop_stage: 'Active Tillering',
      activity_id: 'act-2',
      trigger_reason: 'Planned nitrogen top-dressing is due tomorrow in the operational calendar.',
      agricultural_context: 'Split application of Urea (45 kg/ha) at maximum tillering stage optimizes panicle number per square meter without vegetative lodging.',
      data_considered: {
        planned_date: '2026-09-12',
        crop_stage: 'Active Tillering',
        planned_cost: 2800,
        fertilizer_utilization_pct: 114
      },
      why_explanation: 'Urea applied in split doses during active tillering prevents volatilization and matches plant nitrogen uptake curves before panicle initiation.',
      impact_explanation: 'Maintains scheduled vegetative tillering density at 24-28 tillers/hill.',
      recommended_action: 'Verify field moisture status (drain standing water before application) and dispatch 45kg/ha urea application.',
      status: 'NEW',
      feedback: null
    },
    {
      id: 'rec-3',
      title: 'Review Fertilizer Budget Variance (+14.3%)',
      priority: 'MEDIUM',
      category: 'FINANCIAL',
      crop_name: 'Paddy',
      field_name: 'North Block (Plot A)',
      crop_stage: 'Active Tillering',
      trigger_reason: 'Actual fertilizer expenditure of ₹8,100 + ₹1,400 allocated exceeds planned ₹8,300 benchmark.',
      agricultural_context: 'Unplanned micronutrient spray has added ₹1,400 to the nutrition outlay. Contingency reallocation required to safeguard 58% profit margin.',
      data_considered: {
        spent_fertilizer: 8100,
        planned_benchmark: 8300,
        pending_outlay: 2800,
        variance_pct: 14.3
      },
      why_explanation: 'Fertilizer expenses are tracking 14.3% above plan due to upfront basal DAP purchases and corrective zinc spray.',
      impact_explanation: 'Current spend is ₹18,500 against ₹50,000 budget. Projected final cost may touch ₹52,400 without contingency adjustment.',
      recommended_action: 'Reallocate ₹1,400 from weed management contingency to fertilizer ledger in financial settings.',
      status: 'NEW',
      feedback: null
    }
  ],

  // Phase 2 Initial Operational Journal Records (Farm Memory)
  DEFAULT_JOURNAL: [
    {
      id: 'jrn-1',
      date: '2026-06-15',
      event_type: 'ACTIVITY_COMPLETED',
      title: 'Basal Land Preparation & Laser Leveling Completed',
      description: 'North Block (Plot A - 10.0 Ac) puddled with double disc pass and laser leveled board for AWD water conservation.',
      metadata: { cost: 6200, field: 'North Block (Plot A)', operator: 'Ravi Kumar' }
    },
    {
      id: 'jrn-2',
      date: '2026-06-22',
      event_type: 'INPUT_APPLIED',
      title: 'Basal DAP & Urea Nutrients Batch 1 Applied',
      description: 'Incorporated 300 kg DAP and 200 kg Urea into topsoil prior to seedling transplantation.',
      metadata: { cost: 8100, category: 'FERTILIZER' }
    },
    {
      id: 'jrn-3',
      date: '2026-07-04',
      event_type: 'ACTIVITY_COMPLETED',
      title: 'Seedling Transplanting Completed',
      description: '14 workers transplanted 25-day old BPT-5204 nursery stock at 20x15cm spacing across 10.0 acres.',
      metadata: { cost: 5600, workers: 14, days: 2 }
    },
    {
      id: 'jrn-4',
      date: '2026-09-08',
      event_type: 'RISK_DETECTED',
      title: 'Schedule Risk: Zinc Sulfate Spray Overdue',
      description: 'Foliar spray operation missed scheduled date of Sep 8 due to canal sluice maintenance priority.',
      metadata: { priority: 'HIGH', stage: 'Active Tillering' }
    }
  ],

  // Phase 2 Community Ag Exchange Posts (Cooperative Wall)
  DEFAULT_COMMUNITY_POSTS: [
    {
      id: 'comm-1',
      username: 'siddharth',
      author_name: 'Siddharth Saladi',
      farm_name: 'Green Valley Farm',
      role: 'OWNER',
      category: 'MANDI_RATES',
      title: 'Machilipatnam Mandi Paddy Rates Today (BPT-5204)',
      content: 'Mandi auction opened strong at ₹2,450 - ₹2,520/quintal for Grade A BPT-5204 (Samba Mahsuri). Moisture content requirement strictly below 14%. Direct millers paying ₹2,550 for spot delivery.',
      likes: 14,
      replies_count: 3,
      created_at: '2026-09-10T14:30:00.000Z'
    },
    {
      id: 'comm-2',
      username: 'anita',
      author_name: 'Dr. Anita Rao',
      farm_name: 'Delta Agronomy Advisory',
      role: 'CONSULTANT',
      category: 'PEST_ALERT',
      title: 'Brown Plant Hopper (BPH) Pre-Alert in Coastal Paddy Belts',
      content: 'Noticeable BPH nymph concentrations detected in water-stagnated plots. Maintain strict Alternate Wetting and Drying (AWD) cycle to drain fields for 36 hours. Avoid synthetic pyrethroid sprays to preserve natural mirid bug predators.',
      likes: 28,
      replies_count: 7,
      created_at: '2026-09-10T11:15:00.000Z'
    },
    {
      id: 'comm-3',
      username: 'rajesh',
      author_name: 'Rajesh Patel',
      farm_name: 'Green Valley Farm',
      role: 'MANAGER',
      category: 'EQUIPMENT',
      title: 'Laser Land Leveler & 8-Row Paddy Transplanter Available for Custom Hiring',
      content: 'Kubota 8-row walk-behind mechanical transplanter and Trimble GPS laser leveler available for custom hire in Diviseema region starting next Monday. Contact for tractor operator bookings.',
      likes: 9,
      replies_count: 2,
      created_at: '2026-09-09T18:45:00.000Z'
    },
    {
      id: 'comm-4',
      username: 'ramu',
      author_name: 'Ravi Kumar',
      farm_name: 'Green Valley Farm',
      role: 'WORKER',
      category: 'FIELD_NOTES',
      title: 'North Block AWD Observation: Soil drying rate faster on sand ridge',
      content: 'Perforated AWD pipe reached 6cm depth below soil on the ridge 1 day faster than clay basin. Opening sluice gate for Plot A2 today.',
      likes: 6,
      replies_count: 1,
      created_at: '2026-09-09T09:20:00.000Z'
    }
  ]
};

// Aliases for compatibility
window.FARMPILOT_CONFIG.DEFAULT_FARM = window.FARMPILOT_CONFIG.DEFAULT_FARMS[0];

