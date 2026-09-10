// ============================================
// FARMPILOT — DATABASE TYPES
// Complete TypeScript type system for all tables
// ============================================

// ============================================
// ENUMS
// ============================================
export type AreaUnit = 'acres' | 'hectares' | 'bigha' | 'sq_meters';
export type Season = 'Kharif' | 'Rabi' | 'Zaid' | 'Annual';
export type CropStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type YieldUnit = 'tonnes' | 'quintals' | 'kg';

export type ActivityType =
  | 'LAND_PREPARATION' | 'SOWING' | 'IRRIGATION' | 'FERTILIZATION'
  | 'PEST_INSPECTION' | 'WEEDING' | 'SPRAYING' | 'HARVEST' | 'OTHER';

export type ActivityStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type InputType = 'SEED' | 'FERTILIZER' | 'PESTICIDE' | 'HERBICIDE' | 'ORGANIC_MANURE' | 'OTHER';

export type ExpenseCategory =
  | 'SEEDS' | 'FERTILIZER' | 'LABOR' | 'IRRIGATION'
  | 'PEST_CONTROL' | 'MACHINERY' | 'TRANSPORT' | 'OTHER';

export type WaterSource = '' | 'CANAL' | 'BOREWELL' | 'RIVER' | 'RAINWATER' | 'POND' | 'OTHER';
export type WaterUnit = 'liters' | 'gallons' | 'cubic_meters';
export type HarvestQuality = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';

export type AlertType =
  | 'OVERDUE_TASK' | 'COST_WARNING' | 'PROGRESS_WARNING'
  | 'PROFIT_WARNING' | 'IRRIGATION_REMINDER' | 'POSITIVE' | 'INFO';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';

// ============================================
// TABLE TYPES
// ============================================
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Farm {
  id: string;
  owner_id: string;
  name: string;
  location: string;
  district: string;
  state: string;
  total_area: number;
  area_unit: AreaUnit;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Field {
  id: string;
  farm_id: string;
  name: string;
  area: number;
  area_unit: AreaUnit;
  soil_type: string;
  irrigation_type: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CropCycle {
  id: string;
  farm_id: string;
  field_id: string;
  crop_name: string;
  variety: string;
  season: Season;
  start_date: string;
  expected_harvest_date: string | null;
  status: CropStatus;
  target_yield: number;
  yield_unit: YieldUnit;
  selling_price_per_unit: number;
  planned_budget: number;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined data
  field?: Field;
  farm?: Farm;
}

export interface Activity {
  id: string;
  farm_id: string;
  field_id: string | null;
  crop_cycle_id: string | null;
  title: string;
  description: string;
  activity_type: ActivityType;
  planned_date: string;
  completed_date: string | null;
  status: ActivityStatus;
  priority: Priority;
  estimated_cost: number;
  actual_cost: number;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined
  crop_cycle?: CropCycle;
  field?: Field;
}

export interface Input {
  id: string;
  farm_id: string;
  field_id: string | null;
  crop_cycle_id: string | null;
  name: string;
  input_type: InputType;
  quantity: number;
  unit: string;
  cost: number;
  used_date: string;
  supplier: string;
  notes: string;
  created_at: string;
}

export interface Expense {
  id: string;
  farm_id: string;
  field_id: string | null;
  crop_cycle_id: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface IrrigationLog {
  id: string;
  farm_id: string;
  field_id: string | null;
  crop_cycle_id: string | null;
  irrigation_date: string;
  water_source: WaterSource;
  duration_minutes: number;
  water_quantity: number;
  water_unit: WaterUnit;
  cost: number;
  method: string;
  notes: string;
  created_at: string;
}

export interface Harvest {
  id: string;
  farm_id: string;
  field_id: string | null;
  crop_cycle_id: string | null;
  harvest_date: string;
  actual_yield: number;
  yield_unit: YieldUnit;
  selling_price: number;
  revenue: number;
  quality: HarvestQuality;
  buyer: string;
  notes: string;
  created_at: string;
}

export interface Alert {
  id: string;
  owner_id: string;
  farm_id: string | null;
  crop_cycle_id: string | null;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  recommendation: string;
  source_data: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

// ============================================
// INSERT TYPES (Omit auto-generated fields)
// ============================================
export type FarmInsert = Omit<Farm, 'id' | 'created_at' | 'updated_at'>;
export type FieldInsert = Omit<Field, 'id' | 'created_at' | 'updated_at'>;
export type CropCycleInsert = Omit<CropCycle, 'id' | 'created_at' | 'updated_at' | 'field' | 'farm'>;
export type ActivityInsert = Omit<Activity, 'id' | 'created_at' | 'updated_at' | 'crop_cycle' | 'field'>;
export type InputInsert = Omit<Input, 'id' | 'created_at'>;
export type ExpenseInsert = Omit<Expense, 'id' | 'created_at' | 'updated_at'>;
export type IrrigationLogInsert = Omit<IrrigationLog, 'id' | 'created_at'>;
export type HarvestInsert = Omit<Harvest, 'id' | 'created_at' | 'revenue'>;
export type AlertInsert = Omit<Alert, 'id' | 'created_at'>;

// ============================================
// INTELLIGENCE TYPES
// ============================================
export interface FarmHealthScore {
  overall: number;
  taskCompletion: number;
  scheduleAdherence: number;
  costEfficiency: number;
  cropProgress: number;
  label: string;
  color: string;
}

export interface CropFinancials {
  totalExpenses: number;
  totalInputCosts: number;
  totalIrrigationCosts: number;
  totalActivityCosts: number;
  totalCost: number;
  plannedBudget: number;
  budgetUtilization: number;
  estimatedRevenue: number;
  estimatedProfit: number;
  profitMargin: number;
  actualRevenue: number;
  costBreakdown: CostBreakdownItem[];
}

export interface CostBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface Recommendation {
  id: string;
  title: string;
  severity: AlertSeverity;
  problem: string;
  reason: string;
  action: string;
  sourceData: string;
  icon: string;
}

export interface TodayPriority {
  id: string;
  title: string;
  subtitle: string;
  severity: AlertSeverity;
  type: 'overdue' | 'due_today' | 'cost_anomaly' | 'missing_record';
  activityId?: string;
  icon: string;
}

export interface DashboardData {
  farmHealth: FarmHealthScore;
  cropProgress: number;
  totalSpend: number;
  estimatedProfit: number;
  activeCropCycles: number;
  totalActivities: number;
  completedActivities: number;
  overdueActivities: number;
  pendingActivities: number;
  todayPriorities: TodayPriority[];
  recommendations: Recommendation[];
  cropPerformance: CropPerformanceItem[];
  financials: CropFinancials;
}

export interface CropPerformanceItem {
  cropCycleId: string;
  cropName: string;
  fieldName: string;
  progress: number;
  status: CropStatus;
  targetYield: number;
  yieldUnit: string;
  estimatedRevenue: number;
  estimatedProfit: number;
  area: number;
  areaUnit: string;
}

// ============================================
// ACTIVITY WEIGHTS FOR CROP PROGRESS
// ============================================
export const ACTIVITY_WEIGHTS: Record<ActivityType, number> = {
  LAND_PREPARATION: 10,
  SOWING: 15,
  IRRIGATION: 15,
  FERTILIZATION: 20,
  PEST_INSPECTION: 10,
  WEEDING: 10,
  SPRAYING: 5,
  HARVEST: 15,
  OTHER: 0,
};

// ============================================
// DISPLAY HELPERS
// ============================================
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  LAND_PREPARATION: 'Land Preparation',
  SOWING: 'Sowing',
  IRRIGATION: 'Irrigation',
  FERTILIZATION: 'Fertilization',
  PEST_INSPECTION: 'Pest Inspection',
  WEEDING: 'Weeding',
  SPRAYING: 'Spraying',
  HARVEST: 'Harvest',
  OTHER: 'Other',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  SEEDS: 'Seeds',
  FERTILIZER: 'Fertilizer',
  LABOR: 'Labor',
  IRRIGATION: 'Irrigation',
  PEST_CONTROL: 'Pest Control',
  MACHINERY: 'Machinery',
  TRANSPORT: 'Transport',
  OTHER: 'Other',
};

export const INPUT_TYPE_LABELS: Record<InputType, string> = {
  SEED: 'Seed',
  FERTILIZER: 'Fertilizer',
  PESTICIDE: 'Pesticide',
  HERBICIDE: 'Herbicide',
  ORGANIC_MANURE: 'Organic Manure',
  OTHER: 'Other',
};

export const STATUS_LABELS: Record<ActivityStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  INFO: '#3b82f6',
  WARNING: '#f97316',
  CRITICAL: '#ef4444',
  SUCCESS: '#22c55e',
};

export const COST_CATEGORY_COLORS: Record<string, string> = {
  SEEDS: '#22c55e',
  FERTILIZER: '#3b82f6',
  LABOR: '#f59e0b',
  IRRIGATION: '#06b6d4',
  PEST_CONTROL: '#ef4444',
  MACHINERY: '#8b5cf6',
  TRANSPORT: '#ec4899',
  OTHER: '#94a3b8',
};
