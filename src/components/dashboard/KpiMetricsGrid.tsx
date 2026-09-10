import React from 'react';
import type { FarmHealthScore } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { Heart, Activity as ActivityIcon, Wallet, Leaf, TrendingUp, AlertTriangle } from 'lucide-react';

interface KpiMetricsGridProps {
  healthScore: FarmHealthScore | null;
  totalAcreage: number;
  completedTasks: number;
  totalTasks: number;
  overdueTasks: number;
  totalSpent: number;
  plannedBudget: number;
  cropName: string;
  season: string;
}

export function KpiMetricsGrid({
  healthScore,
  totalAcreage,
  completedTasks,
  totalTasks,
  overdueTasks,
  totalSpent,
  plannedBudget,
  cropName,
  season,
}: KpiMetricsGridProps) {
  const budgetRatio = plannedBudget > 0 ? Math.round((totalSpent / plannedBudget) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Farm Health Score */}
      <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-5 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Farm Health
          </span>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs"
            style={{ backgroundColor: `${healthScore?.color || '#16a34a'}15`, color: healthScore?.color || '#16a34a' }}
          >
            <Heart className="w-4 h-4 fill-current" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="text-3xl font-black tracking-tight" style={{ color: healthScore?.color || '#16a34a' }}>
            {healthScore?.overall ?? 82}
          </span>
          <span className="text-xs font-semibold text-[var(--color-text-muted)]">/ 100</span>
        </div>
        <p className="text-xs font-semibold mt-1" style={{ color: healthScore?.color || '#16a34a' }}>
          {healthScore?.label ?? 'Healthy Condition'}
        </p>
      </div>

      {/* KPI 2: Crop Context & Acreage */}
      <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-5 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Active Context
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
            <Leaf className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-2 truncate">
          <span className="text-2xl font-black text-[var(--color-text-primary)]">
            {totalAcreage} <span className="text-sm font-normal text-[var(--color-text-muted)]">Acres</span>
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1 truncate">
          {cropName} • {season}
        </p>
      </div>

      {/* KPI 3: Operations & Tasks */}
      <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-5 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Operations
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-xs">
            <ActivityIcon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-2xl font-black text-[var(--color-text-primary)]">
            {completedTasks}
          </span>
          <span className="text-sm font-normal text-[var(--color-text-muted)]">
            / {totalTasks} Tasks Done
          </span>
        </div>
        <p className={`text-xs mt-1 font-semibold flex items-center gap-1 ${
          overdueTasks > 0 ? 'text-red-600' : 'text-emerald-600'
        }`}>
          {overdueTasks > 0 ? (
            <>
              <AlertTriangle className="w-3 h-3" />
              {overdueTasks} Overdue Operation!
            </>
          ) : (
            'All Tasks On Schedule'
          )}
        </p>
      </div>

      {/* KPI 4: Financial Expenditure */}
      <div className="bg-white rounded-2xl border border-[var(--color-border-light)] p-5 shadow-xs hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Budget Outlay
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-xs">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-2xl font-black text-[var(--color-text-primary)]">
            {formatCurrency(totalSpent)}
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {budgetRatio}% of {formatCurrency(plannedBudget)} budget
        </p>
      </div>
    </div>
  );
}
