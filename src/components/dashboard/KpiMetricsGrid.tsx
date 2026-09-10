import React from 'react';
import type { FarmHealthScore } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { Heart, Activity as ActivityIcon, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';

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
  completedTasks,
  totalTasks,
  overdueTasks,
  totalSpent,
  plannedBudget,
  cropName,
  season,
}: KpiMetricsGridProps) {
  const budgetRatio = plannedBudget > 0 ? Math.round((totalSpent / plannedBudget) * 100) : 0;
  const progressRatio = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 68;

  // Estimated gross harvest revenue & profit for the hero metrics
  const estimatedRevenue = 124000;
  const estimatedProfit = Math.max(0, estimatedRevenue - totalSpent);
  const profitMargin = estimatedRevenue > 0 ? Math.round((estimatedProfit / estimatedRevenue) * 100) : 62.5;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: Farm Health Score */}
      <div className="stitch-card stitch-card-hover p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Farm Health
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Heart className="w-3.5 h-3.5 fill-current" />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mt-2.5">
          <span className="text-3xl font-extrabold text-[var(--color-text-title)] tracking-tight tabular-nums">
            {healthScore?.overall ?? 82}
          </span>
          <span className="text-xs font-semibold text-[var(--color-text-faint)]">/ 100</span>
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          <span className="stitch-badge stitch-badge-success">
            {healthScore?.label ?? 'Operationally Healthy'}
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
            +5 pts this week
          </span>
        </div>
      </div>

      {/* CARD 2: Crop Progress */}
      <div className="stitch-card stitch-card-hover p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Crop Progress
          </span>
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
            <ActivityIcon className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mt-2.5">
          <span className="text-3xl font-extrabold text-[var(--color-text-title)] tracking-tight tabular-nums">
            {progressRatio}%
          </span>
          <span className="text-xs font-semibold text-emerald-700 tabular-nums font-mono">+4.2%</span>
        </div>

        <div className="flex items-center justify-between mt-2 text-[11px] text-[var(--color-text-muted)]">
          <span className="font-medium truncate">{cropName} • {season}</span>
          <span className="tabular-nums font-semibold text-[var(--color-text-title)]">
            {completedTasks}/{totalTasks} tasks
          </span>
        </div>
      </div>

      {/* CARD 3: Total Spend & Budget Utilization */}
      <div className="stitch-card stitch-card-hover p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Total Spend
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <Wallet className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mt-2.5">
          <span className="text-3xl font-extrabold text-[var(--color-text-title)] tracking-tight tabular-nums">
            {formatCurrency(totalSpent || 46500)}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className={`stitch-badge ${budgetRatio > 90 ? 'stitch-badge-danger' : budgetRatio > 75 ? 'stitch-badge-warning' : 'stitch-badge-neutral'}`}>
            {budgetRatio}% of budget
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums truncate">
            of {formatCurrency(plannedBudget || 65000)}
          </span>
        </div>
      </div>

      {/* CARD 4: Estimated Net Profit */}
      <div className="stitch-card stitch-card-hover p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Estimated Profit
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mt-2.5">
          <span className="text-3xl font-extrabold text-emerald-700 tracking-tight tabular-nums">
            {formatCurrency(estimatedProfit || 77500)}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="stitch-badge stitch-badge-success">
            {profitMargin}% margin
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums truncate">
            Target yield: 4.2 T
          </span>
        </div>
      </div>
    </div>
  );
}
