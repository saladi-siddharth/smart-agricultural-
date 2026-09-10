import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { farmService } from '@/services/farmService';
import { cropService } from '@/services/cropService';
import { activityService } from '@/services/activityService';
import { expenseService } from '@/services/expenseService';
import { inputService } from '@/services/inputService';
import { irrigationService } from '@/services/irrigationService';
import { harvestService } from '@/services/harvestService';
import {
  calculateFarmHealthScore,
  calculateCropFinancials,
  calculateCropProgressScore,
  generateRecommendations,
  generateTodayPriorities,
  formatCurrency,
} from '@/services/intelligenceService';
import type {
  Farm, CropCycle, Activity, Expense, Input as FarmInput,
  IrrigationLog, Harvest, FarmHealthScore, CropFinancials,
  Recommendation, TodayPriority,
} from '@/types/database';
import {
  Activity as ActivityIcon, TrendingUp, Wallet, Heart,
  Leaf, CheckCircle2, Clock, AlertTriangle, ChevronRight,
  Lightbulb, ArrowUpRight, ArrowDownRight, Loader2,
  Sprout, BarChart3, Target
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeFarm, setActiveFarm] = useState<Farm | null>(null);
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inputs, setInputs] = useState<FarmInput[]>([]);
  const [irrigationLogs, setIrrigationLogs] = useState<IrrigationLog[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [healthScore, setHealthScore] = useState<FarmHealthScore | null>(null);
  const [financials, setFinancials] = useState<CropFinancials | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [priorities, setPriorities] = useState<TodayPriority[]>([]);
  const [cropProgress, setCropProgress] = useState(0);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const allFarms = await farmService.getAll();
      setFarms(allFarms);

      if (allFarms.length === 0) {
        setLoading(false);
        return;
      }

      const farm = allFarms[0];
      setActiveFarm(farm);

      const [cycles, acts, exps, inps, irrs, harvs] = await Promise.all([
        cropService.getByFarm(farm.id),
        activityService.getByFarm(farm.id),
        expenseService.getByFarm(farm.id),
        inputService.getByFarm(farm.id),
        irrigationService.getByFarm(farm.id),
        harvestService.getByFarm(farm.id),
      ]);

      setCropCycles(cycles);
      setActivities(acts);
      setExpenses(exps);
      setInputs(inps);
      setIrrigationLogs(irrs);
      setHarvests(harvs);

      // Calculate intelligence
      const activeCycle = cycles.find(c => c.status === 'ACTIVE') || cycles[0] || null;
      const cycleActivities = activeCycle
        ? acts.filter(a => a.crop_cycle_id === activeCycle.id)
        : acts;
      const cycleExpenses = activeCycle
        ? exps.filter(e => e.crop_cycle_id === activeCycle.id)
        : exps;
      const cycleInputs = activeCycle
        ? inps.filter(i => i.crop_cycle_id === activeCycle.id)
        : inps;
      const cycleIrrigation = activeCycle
        ? irrs.filter(i => i.crop_cycle_id === activeCycle.id)
        : irrs;
      const cycleHarvests = activeCycle
        ? harvs.filter(h => h.crop_cycle_id === activeCycle.id)
        : harvs;

      const health = calculateFarmHealthScore(cycleActivities, cycleExpenses, cycleInputs, cycleIrrigation, activeCycle);
      setHealthScore(health);

      const fins = calculateCropFinancials(cycleExpenses, cycleInputs, cycleIrrigation, cycleActivities, cycleHarvests, activeCycle);
      setFinancials(fins);

      const progress = calculateCropProgressScore(cycleActivities);
      setCropProgress(Math.round(progress));

      const recs = generateRecommendations(cycleActivities, cycleExpenses, cycleInputs, cycleIrrigation, activeCycle);
      setRecommendations(recs);

      const pris = generateTodayPriorities(acts);
      setPriorities(pris);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleCompleteActivity = async (activityId: string) => {
    try {
      await activityService.complete(activityId);
      await loadDashboard(); // Refresh everything
    } catch (err) {
      console.error('Failed to complete activity:', err);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (farms.length === 0) {
    return <EmptyDashboard />;
  }

  const overdueCount = activities.filter(a => {
    const planned = new Date(a.planned_date);
    planned.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return planned < today && a.status !== 'COMPLETED';
  }).length;

  const completedCount = activities.filter(a => a.status === 'COMPLETED').length;
  const pendingCount = activities.filter(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Farm Health"
          value={healthScore?.overall ?? 0}
          suffix="/ 100"
          subtitle={healthScore?.label ?? 'N/A'}
          icon={<Heart className="w-5 h-5" />}
          color={healthScore?.color ?? '#16a34a'}
          trend={healthScore && healthScore.overall >= 75 ? 'up' : 'down'}
        />
        <KpiCard
          title="Crop Progress"
          value={cropProgress}
          suffix="%"
          subtitle={`${completedCount} of ${activities.length} activities`}
          icon={<Leaf className="w-5 h-5" />}
          color="#3b82f6"
          trend="up"
        />
        <KpiCard
          title="Total Spend"
          value={financials?.totalCost ?? 0}
          prefix="₹"
          subtitle={financials ? `${Math.round(financials.budgetUtilization)}% of budget` : 'N/A'}
          icon={<Wallet className="w-5 h-5" />}
          color="#f59e0b"
          format="currency"
        />
        <KpiCard
          title="Est. Profit"
          value={financials?.estimatedProfit ?? 0}
          prefix="₹"
          subtitle={financials ? `${Math.round(financials.profitMargin)}% margin` : 'N/A'}
          icon={<TrendingUp className="w-5 h-5" />}
          color="#22c55e"
          format="currency"
          trend={(financials?.estimatedProfit ?? 0) > 0 ? 'up' : 'down'}
        />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Operations */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Today's Operations</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Tasks requiring your attention</p>
            </div>
            <div className="flex gap-2">
              <span className="status-completed text-xs px-2.5 py-1 rounded-full font-medium">
                ✅ {completedCount} Done
              </span>
              {overdueCount > 0 && (
                <span className="status-overdue text-xs px-2.5 py-1 rounded-full font-medium">
                  ⚠ {overdueCount} Overdue
                </span>
              )}
              <span className="status-pending text-xs px-2.5 py-1 rounded-full font-medium">
                ⏳ {pendingCount} Pending
              </span>
            </div>
          </div>

          {priorities.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-muted)]">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-[var(--color-success)]" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs">No urgent tasks for today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {priorities.slice(0, 5).map((priority, i) => (
                <div
                  key={priority.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-all duration-200 animate-slide-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <span className="text-lg">{priority.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{priority.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{priority.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      priority.severity === 'CRITICAL' ? 'status-overdue' :
                      priority.severity === 'WARNING' ? 'status-overdue' :
                      'status-pending'
                    }`}>
                      {priority.severity === 'CRITICAL' ? 'Critical' : priority.severity === 'WARNING' ? 'Overdue' : 'Due'}
                    </span>
                    {priority.activityId && (
                      <button
                        onClick={() => handleCompleteActivity(priority.activityId!)}
                        className="text-xs px-3 py-1 rounded-lg bg-[var(--color-primary-600)] text-white font-medium
                          hover:bg-[var(--color-primary-700)] transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Farm Health Breakdown */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">Health Breakdown</h3>
          {healthScore && (
            <div className="space-y-4">
              {/* Score gauge */}
              <div className="text-center py-4">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={healthScore.color}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${healthScore.overall * 3.14} 314`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-bold" style={{ color: healthScore.color }}>
                      {healthScore.overall}
                    </span>
                    <p className="text-[10px] text-[var(--color-text-muted)]">/ 100</p>
                  </div>
                </div>
                <p className="text-sm font-medium mt-2" style={{ color: healthScore.color }}>
                  {healthScore.label}
                </p>
              </div>

              {/* Breakdown bars */}
              {[
                { label: 'Task Completion', value: healthScore.taskCompletion, weight: '35%' },
                { label: 'Schedule', value: healthScore.scheduleAdherence, weight: '25%' },
                { label: 'Cost Efficiency', value: healthScore.costEfficiency, weight: '20%' },
                { label: 'Crop Progress', value: healthScore.cropProgress, weight: '20%' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--color-text-secondary)]">{item.label}</span>
                    <span className="text-xs font-medium text-[var(--color-text-primary)]">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: item.value >= 75 ? '#22c55e' : item.value >= 50 ? '#f59e0b' : '#ef4444',
                        animation: 'progress-fill 1s ease-out',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crop Performance */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">Crop Performance</h3>
          {cropCycles.filter(c => c.status === 'ACTIVE' || c.status === 'PLANNED').length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-muted)]">
              <Sprout className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">No active crop cycles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cropCycles.filter(c => c.status === 'ACTIVE' || c.status === 'PLANNED').slice(0, 3).map((cycle) => {
                const cycleActivities = activities.filter(a => a.crop_cycle_id === cycle.id);
                const progress = calculateCropProgressScore(cycleActivities);
                const estimatedRevenue = (cycle.target_yield || 0) * (cycle.selling_price_per_unit || 0);

                return (
                  <div key={cycle.id} className="p-4 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-light)]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-[var(--color-primary-600)]" />
                        <span className="text-sm font-medium">{cycle.crop_name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-700)]">
                          {cycle.season}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)]">{cycle.field?.name}</span>
                    </div>
                    <div className="h-2 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-[var(--color-primary-500)] rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(progress)}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">Progress</p>
                        <p className="text-sm font-semibold text-[var(--color-primary-700)]">{Math.round(progress)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">Target Yield</p>
                        <p className="text-sm font-semibold">{cycle.target_yield} {cycle.yield_unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-text-muted)]">Est. Revenue</p>
                        <p className="text-sm font-semibold text-[var(--color-success)]">{formatCurrency(estimatedRevenue)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Intelligence Panel */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-[var(--color-amber-500)]" />
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">FarmPilot Intelligence</h3>
          </div>
          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-muted)]">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-[var(--color-success)]" />
              <p className="text-sm font-medium">Everything looks great!</p>
              <p className="text-xs">No recommendations at this time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.slice(0, 4).map((rec, i) => (
                <div
                  key={rec.id}
                  className={`p-3 rounded-xl border animate-slide-up ${
                    rec.severity === 'CRITICAL' ? 'bg-red-50/50 border-red-200' :
                    rec.severity === 'WARNING' ? 'bg-amber-50/50 border-amber-200' :
                    rec.severity === 'SUCCESS' ? 'bg-green-50/50 border-green-200' :
                    'bg-blue-50/50 border-blue-200'
                  }`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{rec.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{rec.title}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{rec.problem}</p>
                      <p className="text-xs text-[var(--color-primary-700)] mt-1 font-medium">
                        💡 {rec.action}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Financial Overview */}
      {financials && (
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">Financial Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cost Breakdown Chart */}
            <div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">Cost Distribution</p>
              {financials.costBreakdown.length > 0 ? (
                <div className="flex items-center gap-6">
                  <div className="w-36 h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financials.costBreakdown}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={60}
                          paddingAngle={2}
                        >
                          {financials.costBreakdown.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => formatCurrency(Number(value))}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid var(--color-border-light)',
                            boxShadow: 'var(--shadow-md)',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {financials.costBreakdown.slice(0, 5).map((item) => (
                      <div key={item.category} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[var(--color-text-secondary)]">{item.category}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">No expenses recorded</p>
              )}
            </div>

            {/* Financial Summary */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">Profitability</p>
              {[
                { label: 'Total Cost', value: financials.totalCost, color: '#ef4444' },
                { label: 'Planned Budget', value: financials.plannedBudget, color: '#94a3b8' },
                { label: 'Est. Revenue', value: financials.estimatedRevenue, color: '#3b82f6' },
                { label: 'Est. Profit', value: financials.estimatedProfit, color: '#22c55e' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-[var(--color-border-light)] last:border-0">
                  <span className="text-sm text-[var(--color-text-secondary)]">{item.label}</span>
                  <span className="text-sm font-semibold" style={{ color: item.color }}>
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
              <div className="p-3 rounded-xl bg-[var(--color-primary-50)] border border-[var(--color-primary-200)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--color-primary-800)]">Profit Margin</span>
                  <span className="text-lg font-bold text-[var(--color-primary-700)]">
                    {Math.round(financials.profitMargin)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// KPI CARD COMPONENT
// ============================================
function KpiCard({ title, value, prefix, suffix, subtitle, icon, color, format, trend }: {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  format?: 'currency';
  trend?: 'up' | 'down';
}) {
  const displayValue = format === 'currency'
    ? value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toLocaleString('en-IN')
    : value.toString();

  return (
    <div className="glass-card p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <div style={{ color }}>{icon}</div>
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${trend === 'up' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          </div>
        )}
      </div>
      <div className="animate-count-up">
        <p className="text-2xl font-bold text-[var(--color-text-primary)]">
          {prefix}{displayValue}{suffix && <span className="text-sm font-normal text-[var(--color-text-muted)] ml-1">{suffix}</span>}
        </p>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">{subtitle}</p>
      <p className="text-[10px] font-medium text-[var(--color-text-muted)] mt-2 uppercase tracking-wider">{title}</p>
    </div>
  );
}

// ============================================
// SKELETON LOADING
// ============================================
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-card p-5">
            <div className="skeleton h-10 w-10 rounded-xl mb-3" />
            <div className="skeleton h-8 w-24 mb-2" />
            <div className="skeleton h-4 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="skeleton h-6 w-48 mb-4" />
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-16 w-full mb-2 rounded-xl" />
          ))}
        </div>
        <div className="glass-card p-6">
          <div className="skeleton h-6 w-36 mb-4" />
          <div className="skeleton h-28 w-28 rounded-full mx-auto mb-4" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================
function EmptyDashboard() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
          <Sprout className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Welcome to FarmPilot</h2>
        <p className="text-[var(--color-text-secondary)] mb-6">
          Start by creating your first farm to begin tracking operations, expenses, and crop progress.
        </p>
        <a
          href="/farms"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-medium shadow-sm hover:shadow-md transition-all"
        >
          Create Your First Farm
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
