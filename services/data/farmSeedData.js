export const farmSeedData = {
  organization: {
    id: 'org-green-valley',
    name: 'Green Valley Agriculture Ltd',
    plan: 'PROFESSIONAL'
  },
  farms: [
    {
      id: 'farm-1',
      name: 'Green Valley Farm',
      location: 'Machilipatnam Delta Belt',
      district: 'Krishna',
      state: 'Andhra Pradesh',
      total_area: 25,
      area_unit: 'acres',
      health_score: 82,
      budget: 50000,
      spent: 18500,
      est_revenue: 121800,
      est_profit: 71800
    }
  ],
  fields: [
    {
      id: 'field-1',
      farm_id: 'farm-1',
      name: 'North Block (Plot A)',
      area: 10,
      crop_name: 'Paddy (Rice)',
      variety: 'BPT-5204',
      stage: 'Estimated Active Tillering'
    }
  ],
  cropCycles: [
    {
      id: 'crop-1',
      farm_id: 'farm-1',
      field_id: 'field-1',
      crop_name: 'Paddy',
      variety: 'BPT-5204',
      season: 'Kharif',
      start_date: '2026-06-15',
      expected_harvest_date: '2026-11-20',
      target_yield: 4.2,
      selling_price_per_unit: 29000,
      planned_budget: 50000,
      current_stage: 'Estimated Active Tillering',
      current_stage_progress: 58,
      status: 'ACTIVE'
    }
  ],
  activities: [
    {
      id: 'act-1',
      farm_id: 'farm-1',
      field_id: 'field-1',
      title: 'Zinc Sulfate Foliar Spray (0.5%)',
      category: 'FERTILIZATION',
      field_name: 'North Block (Plot A)',
      due_date: '2026-09-08',
      status: 'OVERDUE',
      priority: 'HIGH',
      cost: 1400,
      assigned_to: 'worker-1',
      assigned_to_name: 'Ravi Kumar',
      notes: 'Soil test shows zinc level below threshold. Prevent chlorosis and tillering delay.'
    },
    {
      id: 'act-2',
      farm_id: 'farm-1',
      field_id: 'field-1',
      title: 'Nitrogen Top-Dressing (Urea 45kg/ha)',
      category: 'FERTILIZATION',
      field_name: 'North Block (Plot A)',
      due_date: '2026-09-12',
      status: 'PENDING',
      priority: 'MEDIUM',
      cost: 2800,
      assigned_to: 'worker-1',
      assigned_to_name: 'Ravi Kumar',
      notes: 'Split application during active tillering stage.'
    },
    {
      id: 'act-3',
      farm_id: 'farm-1',
      field_id: 'field-1',
      title: 'Pest Scouting',
      category: 'PEST_INSPECTION',
      field_name: 'North Block (Plot A)',
      due_date: '2026-09-14',
      status: 'PENDING',
      priority: 'MEDIUM',
      cost: 500,
      assigned_to: 'worker-1',
      assigned_to_name: 'Ravi Kumar',
      notes: 'Inspect trap count and leaf damage before reproductive phase.'
    },
    {
      id: 'act-4',
      farm_id: 'farm-1',
      field_id: 'field-1',
      title: 'Irrigation Check',
      category: 'IRRIGATION',
      field_name: 'North Block (Plot A)',
      due_date: '2026-09-10',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      cost: 350,
      assigned_to: 'worker-1',
      assigned_to_name: 'Ravi Kumar',
      notes: 'Irrigation completed successfully.'
    }
  ],
  expenses: [
    { id: 'exp-1', farm_id: 'farm-1', category: 'FERTILIZER', amount: 7800, date: '2026-09-02' },
    { id: 'exp-2', farm_id: 'farm-1', category: 'LABOR', amount: 4200, date: '2026-09-04' },
    { id: 'exp-3', farm_id: 'farm-1', category: 'IRRIGATION', amount: 1600, date: '2026-09-05' },
    { id: 'exp-4', farm_id: 'farm-1', category: 'OTHER', amount: 1200, date: '2026-09-07' }
  ],
  inputs: [
    { id: 'inp-1', farm_id: 'farm-1', category: 'FERTILIZER', name: 'Urea', quantity: 40, unit: 'kg', total_cost: 2600, date: '2026-09-02' },
    { id: 'inp-2', farm_id: 'farm-1', category: 'FERTILIZER', name: 'Zinc Sulfate', quantity: 6, unit: 'kg', total_cost: 1400, date: '2026-09-03' }
  ],
  alerts: [
    {
      id: 'alert-1',
      farm_id: 'farm-1',
      title: 'Fertilizer application overdue',
      severity: 'HIGH',
      is_resolved: false,
      reference_id: 'act-zinc-spray'
    }
  ]
};
