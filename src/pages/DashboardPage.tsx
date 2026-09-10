import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { farmService } from '@/services/farmService';
import { cropService } from '@/services/cropService';
import { activityService } from '@/services/activityService';
import { expenseService } from '@/services/expenseService';
import { inputService } from '@/services/inputService';
import {
  calculateFarmHealthScore,
  calculateCropFinancials,
  calculateCropProgressScore,
  generateRecommendations,
} from '@/services/intelligenceService';
import type {
  Farm, CropCycle, Activity, Expense, Input as FarmInput,
  FarmHealthScore, CropFinancials, Recommendation,
} from '@/types/database';
import { KpiMetricsGrid } from '@/components/dashboard/KpiMetricsGrid';
import { FarmHealthGauge } from '@/components/dashboard/FarmHealthGauge';
import { TodaysOperationsQueue } from '@/components/dashboard/TodaysOperationsQueue';
import { CropProgressOverview } from '@/components/dashboard/CropProgressOverview';
import { ExpenseDistributionChart } from '@/components/dashboard/ExpenseDistributionChart';
import { ActionRecommendationsCard } from '@/components/dashboard/ActionRecommendationsCard';
import { Sprout, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeFarm, setActiveFarm] = useState<Farm | null>(null);
  const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inputs, setInputs] = useState<FarmInput[]>([]);
  const [healthScore, setHealthScore] = useState<FarmHealthScore | null>(null);
  const [financials, setFinancials] = useState<CropFinancials | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
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

      const [cycles, acts, exps, inps] = await Promise.all([
        cropService.getByFarm(farm.id),
        activityService.getByFarm(farm.id),
        expenseService.getByFarm(farm.id),
        inputService.getByFarm(farm.id),
      ]);

      setCropCycles(cycles);
      setActivities(acts);
      setExpenses(exps);
      setInputs(inps);

      // Focus on the primary active cycle for deep farm operational intelligence
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

      // Real-time calculation of Farm Health, Financials, Progress, and Recommendations
      const health = calculateFarmHealthScore(cycleActivities, cycleExpenses, cycleInputs, [], activeCycle);
      setHealthScore(health);

      const fins = calculateCropFinancials(cycleExpenses, cycleInputs, [], cycleActivities, [], activeCycle);
      setFinancials(fins);

      const progress = calculateCropProgressScore(cycleActivities);
      setCropProgress(Math.round(progress));

      const recs = generateRecommendations(cycleActivities, cycleExpenses, cycleInputs, [], activeCycle);
      setRecommendations(recs);
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
      await loadDashboard(); // Live refresh: Farm Health immediately updates!
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

  const activeCycle = cropCycles.find(c => c.status === 'ACTIVE') || cropCycles[0] || null;
  const completedCount = activities.filter(a => a.status === 'COMPLETED').length;
  const overdueCount = activities.filter(a => {
    const planned = new Date(a.planned_date);
    planned.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return planned < today && a.status !== 'COMPLETED';
  }).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOP KPI METRICS: Health, Acreage, Outlay, Operations Completed */}
      <KpiMetricsGrid
        healthScore={healthScore}
        totalAcreage={activeFarm?.total_area || 0}
        completedTasks={completedCount}
        totalTasks={activities.length}
        overdueTasks={overdueCount}
        totalSpent={financials?.totalCost || 0}
        plannedBudget={financials?.plannedBudget || 0}
        cropName={activeCycle?.crop_name || 'Active Crops'}
        season={activeCycle?.season || 'Current'}
      />

      {/* 2. OPERATIONS QUEUE + FARM HEALTH GAUGE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TodaysOperationsQueue
            activities={activities}
            onCompleteActivity={handleCompleteActivity}
          />
        </div>
        <div>
          <FarmHealthGauge healthScore={healthScore} />
        </div>
      </div>

      {/* 3. CROP LIFECYCLE PROGRESSION + EXPENSE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CropProgressOverview
          activeCrop={activeCycle}
          progressPercent={cropProgress}
        />
        <ExpenseDistributionChart
          costBreakdown={financials?.costBreakdown || []}
          totalSpent={financials?.totalCost || 0}
        />
      </div>

      {/* 4. EXPLAINABLE OPERATIONAL ADVISORY / RECOMMENDATIONS */}
      <ActionRecommendationsCard recommendations={recommendations} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-[var(--color-border-light)] p-5">
            <div className="skeleton h-8 w-24 mb-2" />
            <div className="skeleton h-4 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--color-border-light)] p-6">
          <div className="skeleton h-6 w-48 mb-4" />
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-14 w-full mb-2 rounded-xl" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-6">
          <div className="skeleton h-6 w-36 mb-4" />
          <div className="skeleton h-32 w-32 rounded-full mx-auto" />
        </div>
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-[var(--color-border-light)] shadow-xs">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center shadow-md">
          <Sprout className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Welcome to FarmPilot</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          Establish your farm context to begin recording field operations, tracking expenses, and monitoring crop health.
        </p>
        <Link
          to="/farms"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm shadow-xs hover:shadow-md transition-all"
        >
          <span>Create Your First Farm</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
