// ============================================
// FARMPILOT MOCK DATA STORE & LOCAL STORAGE ENGINE
// Provides immediate, zero-config demo experience
// with realistic Green Valley Farm data and reactive persistence
// ============================================

import type {
  Farm, Field, CropCycle, Activity, Input as FarmInput,
  Expense, IrrigationLog, Harvest, Profile,
  FarmInsert, FieldInsert, CropCycleInsert,
  ActivityInsert, InputInsert, ExpenseInsert,
  IrrigationLogInsert, HarvestInsert
} from '@/types/database';

const STORAGE_KEY = 'farmpilot_demo_data_v1';

export interface DemoDatabase {
  profile: Profile;
  farms: Farm[];
  fields: Field[];
  cropCycles: CropCycle[];
  activities: Activity[];
  inputs: FarmInput[];
  expenses: Expense[];
  irrigationLogs: IrrigationLog[];
  harvests: Harvest[];
}

const INITIAL_DEMO_DATA: DemoDatabase = {
  profile: {
    id: 'demo-user-1',
    full_name: 'Rajesh Patel',
    email: 'farmer@greenvalley.in',
    avatar_url: '',
    phone: '+91 98480 22334',
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-09-10T00:00:00Z',
  },
  farms: [
    {
      id: 'farm-green-valley',
      owner_id: 'demo-user-1',
      name: 'Green Valley Farm',
      location: 'Machilipatnam Coastal Belt',
      district: 'Krishna',
      state: 'Andhra Pradesh',
      total_area: 12.5,
      area_unit: 'acres',
      description: 'Model precision and organic paddy cultivation unit with canal lift and solar drip infrastructure.',
      created_at: '2026-05-10T00:00:00Z',
      updated_at: '2026-09-10T00:00:00Z',
    }
  ],
  fields: [
    {
      id: 'field-north-1',
      farm_id: 'farm-green-valley',
      name: 'North Field (Parcel A)',
      area: 5.0,
      area_unit: 'acres',
      soil_type: 'Clay Loam',
      irrigation_type: 'Canal + Drip',
      description: 'Prime low-lying paddy parcel with high water retention and nutrient-rich silt.',
      created_at: '2026-05-15T00:00:00Z',
      updated_at: '2026-09-10T00:00:00Z',
    },
    {
      id: 'field-south-2',
      farm_id: 'farm-green-valley',
      name: 'South Field (Parcel B)',
      area: 4.5,
      area_unit: 'acres',
      soil_type: 'Alluvial Soil',
      irrigation_type: 'Borewell Flood',
      description: 'Centrally drained parcel with dedicated solar borewell pump.',
      created_at: '2026-05-15T00:00:00Z',
      updated_at: '2026-09-10T00:00:00Z',
    },
    {
      id: 'field-east-3',
      farm_id: 'farm-green-valley',
      name: 'East Canal Field (Parcel C)',
      area: 3.0,
      area_unit: 'acres',
      soil_type: 'Sandy Clay',
      irrigation_type: 'Canal Lift',
      description: 'Border field with direct canal intake sluice gate.',
      created_at: '2026-05-15T00:00:00Z',
      updated_at: '2026-09-10T00:00:00Z',
    }
  ],
  cropCycles: [
    {
      id: 'crop-paddy-kharif-2026',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_name: 'Paddy (Rice)',
      variety: 'BPT 5204 (Samba Mahsuri)',
      season: 'Kharif',
      start_date: '2026-06-15',
      expected_harvest_date: '2026-11-20',
      status: 'ACTIVE',
      target_yield: 4.5,
      yield_unit: 'tonnes',
      selling_price_per_unit: 28500,
      planned_budget: 62000,
      notes: 'Export quality premium aromatic rice. Applying integrated nutrient and pest management.',
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-09-10T00:00:00Z',
    },
    {
      id: 'crop-urad-rabi-2025',
      farm_id: 'farm-green-valley',
      field_id: 'field-south-2',
      crop_name: 'Black Gram (Urad)',
      variety: 'LBG-752',
      season: 'Rabi',
      start_date: '2025-11-10',
      expected_harvest_date: '2026-02-28',
      status: 'COMPLETED',
      target_yield: 1.8,
      yield_unit: 'tonnes',
      selling_price_per_unit: 74500,
      planned_budget: 28000,
      notes: 'Nitrogen-fixing pulse rotation cycle with high market yield.',
      created_at: '2025-11-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    }
  ],
  activities: [
    {
      id: 'act-1',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      title: 'Summer Ploughing & Field Puddling',
      description: 'Deep tractor ploughing followed by 2 passes of puddling and bund plastering.',
      activity_type: 'LAND_PREPARATION',
      planned_date: '2026-06-18',
      completed_date: '2026-06-18',
      status: 'COMPLETED',
      priority: 'HIGH',
      estimated_cost: 7000,
      actual_cost: 7500,
      notes: 'Good soil churning, bunds reinforced with clay.',
      created_at: '2026-06-05T00:00:00Z',
      updated_at: '2026-06-18T00:00:00Z',
    },
    {
      id: 'act-2',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      title: 'Seed Treatment with Trichoderma',
      description: 'Treating 25 kg BPT 5204 seeds with bio-agent Trichoderma viride.',
      activity_type: 'SOWING',
      planned_date: '2026-06-22',
      completed_date: '2026-06-22',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      estimated_cost: 1500,
      actual_cost: 1400,
      notes: 'Seeds soaked for 24h, zero fungal incidence.',
      created_at: '2026-06-05T00:00:00Z',
      updated_at: '2026-06-22T00:00:00Z',
    },
    {
      id: 'act-3',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      title: 'Nursery Bed Sowing & Mat Preparation',
      description: 'Raised nursery bed preparation and uniform seed broadcasting.',
      activity_type: 'SOWING',
      planned_date: '2026-06-25',
      completed_date: '2026-06-25',
      status: 'COMPLETED',
      priority: 'HIGH',
      estimated_cost: 3500,
      actual_cost: 3200,
      notes: 'Germination rate recorded at 94%.',
      created_at: '2026-06-05T00:00:00Z',
      updated_at: '2026-06-25T00:00:00Z',
    },
    {
      id: 'act-4',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      title: 'Main Field Mechanical Transplantation',
      description: 'Transplanting 21-day seedlings with 20x15 cm hill spacing.',
      activity_type: 'SOWING',
      planned_date: '2026-07-16',
      completed_date: '2026-07-16',
      status: 'COMPLETED',
      priority: 'CRITICAL',
      estimated_cost: 11000,
      actual_cost: 12000,
      notes: '15 laborers employed; transplantation completed before heavy rains.',
      created_at: '2026-06-05T00:00:00Z',
      updated_at: '2026-07-16T00:00:00Z',
    },
    {
      id: 'act-5',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      title: 'First Mechanical Cono-Weeding',
      description: 'Inter-cultivation weeding between rows and root aeration.',
      activity_type: 'WEEDING',
      planned_date: '2026-08-05',
      completed_date: '2026-08-06',
      status: 'COMPLETED',
      priority: 'HIGH',
      estimated_cost: 4000,
      actual_cost: 4200,
      notes: 'Minor 1-day delay due to canal inflow; weed density reduced by 85%.',
      created_at: '2026-06-05T00:00:00Z',
      updated_at: '2026-08-06T00:00:00Z',
    },
    {
      id: 'act-6',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      title: 'Second Fertilizer Application (NPK 20-20-20 + Zinc)',
      description: 'Active tillering top-dressing with complex NPK and Zinc sulphate to prevent khaira disease.',
      activity_type: 'FERTILIZATION',
      planned_date: '2026-08-28',
      completed_date: null,
      status: 'OVERDUE',
      priority: 'CRITICAL',
      estimated_cost: 6500,
      actual_cost: 0,
      notes: 'Urgent: Tillering phase peaks now. Immediate application required to protect potential yield.',
      created_at: '2026-06-05T00:00:00Z',
      updated_at: '2026-08-28T00:00:00Z',
    },
    {
      id: 'act-7',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      title: 'Secondary Canal Irrigation Round',
      description: 'Maintain 3-5 cm standing water layer in parcel during panicle development.',
      activity_type: 'IRRIGATION',
      planned_date: '2026-09-12',
      completed_date: null,
      status: 'PENDING',
      priority: 'MEDIUM',
      estimated_cost: 2500,
      actual_cost: 0,
      notes: 'Scheduled for canal rotation day.',
      created_at: '2026-06-05T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    },
    {
      id: 'act-8',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      title: 'Panicle Initiation Pest Scouting (Stem Borer)',
      description: 'Pheromone trap count and scouting for yellow stem borer dead hearts.',
      activity_type: 'PEST_INSPECTION',
      planned_date: '2026-09-18',
      completed_date: null,
      status: 'PENDING',
      priority: 'HIGH',
      estimated_cost: 1800,
      actual_cost: 0,
      notes: 'Deploy 4 pheromone traps per acre if moth count exceeds threshold.',
      created_at: '2026-06-05T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    }
  ],
  inputs: [
    {
      id: 'inp-1',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      name: 'Certified BPT 5204 Paddy Seeds',
      input_type: 'SEED',
      quantity: 25,
      unit: 'kg',
      cost: 4800,
      used_date: '2026-06-20',
      supplier: 'Andhra Pradesh State Seed Corp',
      notes: 'Germination test tag: 96% certified.',
      created_at: '2026-06-15T00:00:00Z',
    },
    {
      id: 'inp-2',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      name: 'DAP (Di-Ammonium Phosphate)',
      input_type: 'FERTILIZER',
      quantity: 100,
      unit: 'kg',
      cost: 3200,
      used_date: '2026-07-15',
      supplier: 'IFFCO Farmers Service Center',
      notes: 'Applied as basal dose during final puddling.',
      created_at: '2026-07-10T00:00:00Z',
    },
    {
      id: 'inp-3',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      name: 'Neem Cake Organic Soil Conditioner',
      input_type: 'ORGANIC_MANURE',
      quantity: 50,
      unit: 'kg',
      cost: 1800,
      used_date: '2026-07-15',
      supplier: 'Sri Krishna Bio Agro',
      notes: 'Nematode suppression and slow nitrogen release.',
      created_at: '2026-07-10T00:00:00Z',
    },
    {
      id: 'inp-4',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      name: 'Zinc Sulphate Heptahydrate',
      input_type: 'FERTILIZER',
      quantity: 10,
      unit: 'kg',
      cost: 1400,
      used_date: '2026-08-01',
      supplier: 'IFFCO Machilipatnam',
      notes: 'Foliar correction for sandy patches.',
      created_at: '2026-07-28T00:00:00Z',
    },
    {
      id: 'inp-5',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      name: 'Trichoderma Viride Bio-Fungicide',
      input_type: 'PESTICIDE',
      quantity: 2,
      unit: 'kg',
      cost: 800,
      used_date: '2026-06-22',
      supplier: 'National Seeds Corp',
      notes: 'Used for seed soaking inoculation.',
      created_at: '2026-06-20T00:00:00Z',
    }
  ],
  expenses: [
    {
      id: 'exp-1',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      category: 'SEEDS',
      description: 'Certified BPT 5204 Foundation Seeds',
      amount: 4800,
      expense_date: '2026-06-16',
      notes: 'Government subsidy invoice #AP-9921',
      created_at: '2026-06-16T00:00:00Z',
      updated_at: '2026-06-16T00:00:00Z',
    },
    {
      id: 'exp-2',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      category: 'MACHINERY',
      description: '45HP Tractor Ploughing & Dual Rotavator',
      amount: 7500,
      expense_date: '2026-06-19',
      notes: 'Custom hiring center rental (6 hours @ 1250/hr)',
      created_at: '2026-06-19T00:00:00Z',
      updated_at: '2026-06-19T00:00:00Z',
    },
    {
      id: 'exp-3',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      category: 'LABOR',
      description: 'Transplantation Labor (15 workers @ ₹800)',
      amount: 12000,
      expense_date: '2026-07-17',
      notes: 'Transplantation of Parcel A completed in 1.5 days',
      created_at: '2026-07-17T00:00:00Z',
      updated_at: '2026-07-17T00:00:00Z',
    },
    {
      id: 'exp-4',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      category: 'FERTILIZER',
      description: 'Basal Nutrients: DAP & Neem Cake Pack',
      amount: 5000,
      expense_date: '2026-07-28',
      notes: 'Paid via UPI to IFFCO Center',
      created_at: '2026-07-28T00:00:00Z',
      updated_at: '2026-07-28T00:00:00Z',
    },
    {
      id: 'exp-5',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      category: 'LABOR',
      description: 'First Cono-Weeding Labor (7 workers)',
      amount: 4200,
      expense_date: '2026-08-06',
      notes: 'Includes food allowance and machinery handling',
      created_at: '2026-08-06T00:00:00Z',
      updated_at: '2026-08-06T00:00:00Z',
    },
    {
      id: 'exp-6',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      category: 'IRRIGATION',
      description: 'Solar Borewell Service & Canal Sluice Cess',
      amount: 2500,
      expense_date: '2026-08-20',
      notes: 'Quarterly irrigation authority maintenance charge',
      created_at: '2026-08-20T00:00:00Z',
      updated_at: '2026-08-20T00:00:00Z',
    }
  ],
  irrigationLogs: [
    {
      id: 'irr-1',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      irrigation_date: '2026-07-16',
      water_source: 'CANAL',
      duration_minutes: 360,
      water_quantity: 120000,
      water_unit: 'liters',
      cost: 1200,
      method: 'Controlled Canal Flood',
      notes: 'Initial standing water after transplantation maintained at 4 cm.',
      created_at: '2026-07-16T00:00:00Z',
    },
    {
      id: 'irr-2',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      irrigation_date: '2026-08-04',
      water_source: 'BOREWELL',
      duration_minutes: 240,
      water_quantity: 80000,
      water_unit: 'liters',
      cost: 800,
      method: 'Solar Borewell Flood',
      notes: 'Pre-weeding saturation to loosen weed roots for cono-weeder.',
      created_at: '2026-08-04T00:00:00Z',
    },
    {
      id: 'irr-3',
      farm_id: 'farm-green-valley',
      field_id: 'field-north-1',
      crop_cycle_id: 'crop-paddy-kharif-2026',
      irrigation_date: '2026-08-22',
      water_source: 'CANAL',
      duration_minutes: 300,
      water_quantity: 100000,
      water_unit: 'liters',
      cost: 1000,
      method: 'Canal Lift Sluice',
      notes: 'Tillering stage standing water replenishment.',
      created_at: '2026-08-22T00:00:00Z',
    }
  ],
  harvests: [
    {
      id: 'harv-1',
      farm_id: 'farm-green-valley',
      field_id: 'field-south-2',
      crop_cycle_id: 'crop-urad-rabi-2025',
      harvest_date: '2026-02-28',
      actual_yield: 1.95,
      yield_unit: 'tonnes',
      selling_price: 74500,
      revenue: 145275,
      quality: 'EXCELLENT',
      buyer: 'Andhra Pradesh State Co-op Marketing Fed',
      notes: 'Exceeded target yield (1.8T) by 8.3%. Moisture level tested at 11.2%.',
      created_at: '2026-03-01T00:00:00Z',
    }
  ]
};

// Internal in-memory and LocalStorage manager
class MockDataStore {
  private data: DemoDatabase;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): DemoDatabase {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // In SSR or error fallback to initial
    }
    this.saveToStorage(INITIAL_DEMO_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
  }

  private saveToStorage(data: DemoDatabase) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore quota errors
    }
  }

  private notify() {
    this.saveToStorage(this.data);
    this.listeners.forEach(fn => fn());
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public resetDemoData() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DEMO_DATA));
    this.notify();
  }

  // Profile
  public getProfile(): Profile {
    return this.data.profile;
  }

  public updateProfile(updates: Partial<Profile>): Profile {
    this.data.profile = { ...this.data.profile, ...updates, updated_at: new Date().toISOString() };
    this.notify();
    return this.data.profile;
  }

  // Farms
  public getFarms(): Farm[] {
    return [...this.data.farms];
  }

  public getFarmById(id: string): Farm | undefined {
    return this.data.farms.find(f => f.id === id);
  }

  public createFarm(input: FarmInsert): Farm {
    const farm: Farm = {
      ...input,
      id: 'farm-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.farms.unshift(farm);
    this.notify();
    return farm;
  }

  public updateFarm(id: string, updates: Partial<FarmInsert>): Farm {
    const idx = this.data.farms.findIndex(f => f.id === id);
    if (idx === -1) throw new Error('Farm not found');
    this.data.farms[idx] = {
      ...this.data.farms[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.notify();
    return this.data.farms[idx];
  }

  public deleteFarm(id: string): void {
    this.data.farms = this.data.farms.filter(f => f.id !== id);
    this.notify();
  }

  // Fields
  public getFields(farmId?: string): Field[] {
    if (farmId) return this.data.fields.filter(f => f.farm_id === farmId);
    return [...this.data.fields];
  }

  public getFieldById(id: string): Field | undefined {
    return this.data.fields.find(f => f.id === id);
  }

  public createField(input: FieldInsert): Field {
    const field: Field = {
      ...input,
      id: 'field-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.fields.push(field);
    this.notify();
    return field;
  }

  public updateField(id: string, updates: Partial<FieldInsert>): Field {
    const idx = this.data.fields.findIndex(f => f.id === id);
    if (idx === -1) throw new Error('Field not found');
    this.data.fields[idx] = {
      ...this.data.fields[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.notify();
    return this.data.fields[idx];
  }

  public deleteField(id: string): void {
    this.data.fields = this.data.fields.filter(f => f.id !== id);
    this.notify();
  }

  // Crop Cycles
  public getCropCycles(farmId?: string): CropCycle[] {
    let cycles = this.data.cropCycles;
    if (farmId) cycles = cycles.filter(c => c.farm_id === farmId);
    return cycles.map(c => ({
      ...c,
      field: this.data.fields.find(f => f.id === c.field_id),
      farm: this.data.farms.find(f => f.id === c.farm_id),
    }));
  }

  public getCropCycleById(id: string): CropCycle | undefined {
    const c = this.data.cropCycles.find(cycle => cycle.id === id);
    if (!c) return undefined;
    return {
      ...c,
      field: this.data.fields.find(f => f.id === c.field_id),
      farm: this.data.farms.find(f => f.id === c.farm_id),
    };
  }

  public createCropCycle(input: CropCycleInsert): CropCycle {
    const cycle: CropCycle = {
      ...input,
      id: 'crop-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.cropCycles.unshift(cycle);
    this.notify();
    return {
      ...cycle,
      field: this.data.fields.find(f => f.id === cycle.field_id),
      farm: this.data.farms.find(f => f.id === cycle.farm_id),
    };
  }

  public updateCropCycle(id: string, updates: Partial<CropCycleInsert>): CropCycle {
    const idx = this.data.cropCycles.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Crop cycle not found');
    this.data.cropCycles[idx] = {
      ...this.data.cropCycles[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.notify();
    const cycle = this.data.cropCycles[idx];
    return {
      ...cycle,
      field: this.data.fields.find(f => f.id === cycle.field_id),
      farm: this.data.farms.find(f => f.id === cycle.farm_id),
    };
  }

  public deleteCropCycle(id: string): void {
    this.data.cropCycles = this.data.cropCycles.filter(c => c.id !== id);
    this.notify();
  }

  // Activities
  public getActivities(farmId?: string, cropCycleId?: string): Activity[] {
    let list = this.data.activities;
    if (farmId) list = list.filter(a => a.farm_id === farmId);
    if (cropCycleId) list = list.filter(a => a.crop_cycle_id === cropCycleId);
    return list.map(a => ({
      ...a,
      crop_cycle: this.data.cropCycles.find(c => c.id === a.crop_cycle_id),
      field: this.data.fields.find(f => f.id === a.field_id),
    }));
  }

  public getActivityById(id: string): Activity | undefined {
    const a = this.data.activities.find(act => act.id === id);
    if (!a) return undefined;
    return {
      ...a,
      crop_cycle: this.data.cropCycles.find(c => c.id === a.crop_cycle_id),
      field: this.data.fields.find(f => f.id === a.field_id),
    };
  }

  public createActivity(input: ActivityInsert): Activity {
    const activity: Activity = {
      ...input,
      id: 'act-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.activities.unshift(activity);
    this.notify();
    return {
      ...activity,
      crop_cycle: this.data.cropCycles.find(c => c.id === activity.crop_cycle_id),
      field: this.data.fields.find(f => f.id === activity.field_id),
    };
  }

  public updateActivity(id: string, updates: Partial<ActivityInsert>): Activity {
    const idx = this.data.activities.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Activity not found');
    this.data.activities[idx] = {
      ...this.data.activities[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.notify();
    const a = this.data.activities[idx];
    return {
      ...a,
      crop_cycle: this.data.cropCycles.find(c => c.id === a.crop_cycle_id),
      field: this.data.fields.find(f => f.id === a.field_id),
    };
  }

  public completeActivity(id: string, actualCost?: number): Activity {
    const idx = this.data.activities.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Activity not found');
    const existing = this.data.activities[idx];
    this.data.activities[idx] = {
      ...existing,
      status: 'COMPLETED',
      completed_date: new Date().toISOString().split('T')[0],
      actual_cost: actualCost !== undefined ? actualCost : (existing.actual_cost || existing.estimated_cost),
      updated_at: new Date().toISOString(),
    };
    this.notify();
    const a = this.data.activities[idx];
    return {
      ...a,
      crop_cycle: this.data.cropCycles.find(c => c.id === a.crop_cycle_id),
      field: this.data.fields.find(f => f.id === a.field_id),
    };
  }

  public deleteActivity(id: string): void {
    this.data.activities = this.data.activities.filter(a => a.id !== id);
    this.notify();
  }

  // Inputs
  public getInputs(farmId?: string, cropCycleId?: string): FarmInput[] {
    let list = this.data.inputs;
    if (farmId) list = list.filter(i => i.farm_id === farmId);
    if (cropCycleId) list = list.filter(i => i.crop_cycle_id === cropCycleId);
    return [...list];
  }

  public createInput(input: InputInsert): FarmInput {
    const inp: FarmInput = {
      ...input,
      id: 'inp-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.data.inputs.unshift(inp);
    this.notify();
    return inp;
  }

  public updateInput(id: string, updates: Partial<InputInsert>): FarmInput {
    const idx = this.data.inputs.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Input record not found');
    this.data.inputs[idx] = { ...this.data.inputs[idx], ...updates };
    this.notify();
    return this.data.inputs[idx];
  }

  public deleteInput(id: string): void {
    this.data.inputs = this.data.inputs.filter(i => i.id !== id);
    this.notify();
  }

  // Expenses
  public getExpenses(farmId?: string, cropCycleId?: string): Expense[] {
    let list = this.data.expenses;
    if (farmId) list = list.filter(e => e.farm_id === farmId);
    if (cropCycleId) list = list.filter(e => e.crop_cycle_id === cropCycleId);
    return [...list];
  }

  public createExpense(input: ExpenseInsert): Expense {
    const exp: Expense = {
      ...input,
      id: 'exp-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.expenses.unshift(exp);
    this.notify();
    return exp;
  }

  public updateExpense(id: string, updates: Partial<ExpenseInsert>): Expense {
    const idx = this.data.expenses.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Expense not found');
    this.data.expenses[idx] = {
      ...this.data.expenses[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.notify();
    return this.data.expenses[idx];
  }

  public deleteExpense(id: string): void {
    this.data.expenses = this.data.expenses.filter(e => e.id !== id);
    this.notify();
  }

  // Irrigation Logs
  public getIrrigationLogs(farmId?: string, cropCycleId?: string): IrrigationLog[] {
    let list = this.data.irrigationLogs;
    if (farmId) list = list.filter(i => i.farm_id === farmId);
    if (cropCycleId) list = list.filter(i => i.crop_cycle_id === cropCycleId);
    return [...list];
  }

  public createIrrigationLog(input: IrrigationLogInsert): IrrigationLog {
    const log: IrrigationLog = {
      ...input,
      id: 'irr-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.data.irrigationLogs.unshift(log);
    this.notify();
    return log;
  }

  public updateIrrigationLog(id: string, updates: Partial<IrrigationLogInsert>): IrrigationLog {
    const idx = this.data.irrigationLogs.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Irrigation log not found');
    this.data.irrigationLogs[idx] = { ...this.data.irrigationLogs[idx], ...updates };
    this.notify();
    return this.data.irrigationLogs[idx];
  }

  public deleteIrrigationLog(id: string): void {
    this.data.irrigationLogs = this.data.irrigationLogs.filter(i => i.id !== id);
    this.notify();
  }

  // Harvests
  public getHarvests(farmId?: string, cropCycleId?: string): Harvest[] {
    let list = this.data.harvests;
    if (farmId) list = list.filter(h => h.farm_id === farmId);
    if (cropCycleId) list = list.filter(h => h.crop_cycle_id === cropCycleId);
    return [...list];
  }

  public createHarvest(input: HarvestInsert): Harvest {
    const rev = input.actual_yield * input.selling_price;
    const h: Harvest = {
      ...input,
      revenue: rev,
      id: 'harv-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.data.harvests.unshift(h);
    this.notify();
    return h;
  }

  public updateHarvest(id: string, updates: Partial<HarvestInsert>): Harvest {
    const idx = this.data.harvests.findIndex(h => h.id === id);
    if (idx === -1) throw new Error('Harvest not found');
    const existing = this.data.harvests[idx];
    const actual_yield = updates.actual_yield !== undefined ? updates.actual_yield : existing.actual_yield;
    const selling_price = updates.selling_price !== undefined ? updates.selling_price : existing.selling_price;
    this.data.harvests[idx] = {
      ...existing,
      ...updates,
      actual_yield,
      selling_price,
      revenue: actual_yield * selling_price,
    };
    this.notify();
    return this.data.harvests[idx];
  }

  public deleteHarvest(id: string): void {
    this.data.harvests = this.data.harvests.filter(h => h.id !== id);
    this.notify();
  }
}

export const mockDataStore = new MockDataStore();
