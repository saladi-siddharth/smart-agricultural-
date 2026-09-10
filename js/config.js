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

  // Phase 2 Demo Personas (Role Switcher)
  PERSONAS: {
    OWNER: {
      id: '33dd8f01-e3c5-42a8-9194-a92504a75246',
      email: 'farmer@greenvalley.in',
      full_name: 'Siddharth Saladi',
      role: 'OWNER',
      roleLabel: 'Farm Owner & Executive',
      badge: 'Owner',
      badgeClass: 'badge-success',
      avatar: 'S',
      permissions: ['financials', 'org_settings', 'all_farms', 'reports', 'alerts', 'manage_members']
    },
    MANAGER: {
      id: 'usr-mgr-02',
      email: 'manager@greenvalley.in',
      full_name: 'Rajesh Patel',
      role: 'MANAGER',
      roleLabel: 'Estate Operations Manager',
      badge: 'Manager',
      badgeClass: 'badge-primary',
      avatar: 'R',
      permissions: ['operations', 'task_assignment', 'fields', 'crops', 'inputs', 'expenses', 'irrigation', 'alerts']
    },
    WORKER: {
      id: '12f2a103-05d5-498f-b187-406bf7f634cd',
      email: 'worker@greenvalley.in',
      full_name: 'Ravi Kumar',
      role: 'WORKER',
      roleLabel: 'Field Operations Operator',
      badge: 'Worker',
      badgeClass: 'badge-warning',
      avatar: 'K',
      permissions: ['today_tasks', 'start_task', 'complete_task', 'view_field']
    },
    CONSULTANT: {
      id: 'usr-con-04',
      email: 'consultant@greenvalley.in',
      full_name: 'Dr. Anita Rao',
      role: 'CONSULTANT',
      roleLabel: 'Principal Agronomist & Advisor',
      badge: 'Consultant',
      badgeClass: 'badge-neutral',
      avatar: 'A',
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
  ]
};

// Aliases for compatibility
window.FARMPILOT_CONFIG.DEFAULT_FARM = window.FARMPILOT_CONFIG.DEFAULT_FARMS[0];
