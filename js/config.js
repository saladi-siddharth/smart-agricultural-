/**
 * FarmPilot Configuration & Seed State
 * Direct Supabase API Configuration with LocalStorage Resilient Fallback
 */

window.FARMPILOT_CONFIG = {
  SUPABASE_URL: 'https://xgcamlpkbgjulkfknpud.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_3rbDSN4ONrtCxacboVfEdA_3nkUt82f',
  
  DEFAULT_FARM: {
    id: '43666b6c-8208-4148-be22-df38d21b1836',
    name: 'Green Valley Farm',
    location: 'Rampur',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    total_area: 25.0,
    area_unit: 'acres',
    coordinates: '16.1809° N, 81.1378° E',
    description: 'High-yield commercial paddy and pulse production estate with canal-fed and solar drip irrigation.',
  },

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
      stage: 'Tillering & Nutrition'
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
      crop_name: 'Fallow / Green Manure',
      variety: 'Dhaincha (Nitrogen Fixer)',
      stage: 'Soil Preparation'
    }
  ],

  DEFAULT_CROP_CYCLE: {
    id: 'crop-1',
    farm_id: '43666b6c-8208-4148-be22-df38d21b1836',
    field_id: 'field-1',
    crop_name: 'Paddy',
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
      'Land preparation',
      'Sowing',
      'Irrigation',
      'Fertilization',
      'Pest management',
      'Harvest'
    ]
  },

  DEFAULT_ACTIVITIES: [
    {
      id: 'act-1',
      title: 'Zinc Sulfate Foliar Spray (0.5%)',
      category: 'FERTILIZATION',
      field_name: 'North Block (Plot A)',
      due_date: '2026-09-08',
      status: 'OVERDUE',
      priority: 'HIGH',
      cost: 1400,
      notes: 'Soil test shows zinc level at 0.4 ppm (critical threshold <0.6 ppm). Prevent interveinal chlorosis.'
    },
    {
      id: 'act-2',
      title: 'Nitrogen Top-Dressing (Urea 45kg/ha)',
      category: 'FERTILIZATION',
      field_name: 'North Block (Plot A)',
      due_date: '2026-09-12',
      status: 'PENDING',
      priority: 'MEDIUM',
      cost: 2800,
      notes: 'Split application at active tillering peak.'
    },
    {
      id: 'act-3',
      title: 'Stem Borer Pheromone Trap Inspection',
      category: 'PEST_MANAGEMENT',
      field_name: 'Central Sector (Plot B)',
      due_date: '2026-09-14',
      status: 'PENDING',
      priority: 'LOW',
      cost: 450,
      notes: 'Check 4 lure traps across central perimeter.'
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
      description: 'Certified BPT-5204 Foundation Seed Stock',
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
      category: 'CROP_PROTECTION',
      description: 'Zinc Sulfate Spray Solution',
      amount: 1200,
      date: '2026-08-15'
    }
  ]
};
