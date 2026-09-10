import React from 'react';
import type { FarmHealthScore } from '@/types/database';
import { formatCurrency } from '@/services/intelligenceService';
import { Heart, Activity as ActivityIcon, Wallet, TrendingUp, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const budgetRatio = plannedBudget > 0 ? Math.round((totalSpent / plannedBudget) * 100) : 71;
  const progressRatio = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 68;

  const estimatedRevenue = 124000;
  const estimatedProfit = Math.max(0, estimatedRevenue - totalSpent);
  const profitMargin = estimatedRevenue > 0 ? Math.round((estimatedProfit / estimatedRevenue) * 100) : 62.5;

  const cards = [
    {
      label: 'Farm Health Index',
      value: healthScore?.overall ?? 82,
      subValue: '/ 100',
      badge: healthScore?.label ?? 'Optimal Condition',
      badgeType: 'success',
      trend: '+5 pts this week',
      icon: Heart,
      iconBg: 'bg-emerald-50 border-emerald-100 text-[#059669]',
    },
    {
      label: 'Crop Lifecycle Progress',
      value: `${progressRatio}%`,
      subValue: '',
      badge: `${completedTasks}/${totalTasks} Tasks Done`,
      badgeType: 'neutral',
      trend: `${cropName} • ${season}`,
      icon: ActivityIcon,
      iconBg: 'bg-sky-50 border-sky-100 text-sky-700',
    },
    {
      label: 'Operating Outlay',
      value: formatCurrency(totalSpent || 46500),
      subValue: '',
      badge: `${budgetRatio}% of budget`,
      badgeType: budgetRatio > 85 ? 'warning' : 'neutral',
      trend: `Cap: ${formatCurrency(plannedBudget || 65000)}`,
      icon: Wallet,
      iconBg: 'bg-amber-50 border-amber-100 text-amber-700',
    },
    {
      label: 'Projected Net Profit',
      value: formatCurrency(estimatedProfit || 77500),
      subValue: '',
      badge: `${profitMargin}% Net Margin`,
      badgeType: 'success',
      trend: 'Target: 4.2 Tonnes',
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 border-emerald-100 text-[#143D30]',
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
            className={`stitch-card p-5 flex flex-col justify-between relative overflow-hidden group ${
              c.highlight ? 'bg-gradient-to-b from-white to-[#F7FBF9]' : ''
            }`}
          >
            {/* Top row: Label & Icon */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                {c.label}
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${c.iconBg} transition-transform group-hover:scale-105`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Value row */}
            <div className="my-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#0F172A] tracking-tight tabular-nums font-sans">
                  {c.value}
                </span>
                {c.subValue && (
                  <span className="text-xs font-semibold text-[#94A3B8]">{c.subValue}</span>
                )}
              </div>
            </div>

            {/* Bottom row: Badge & Context */}
            <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] text-xs">
              <span className={`stitch-badge ${
                c.badgeType === 'success' ? 'stitch-badge-success' :
                c.badgeType === 'warning' ? 'stitch-badge-warning' :
                'stitch-badge-neutral'
              }`}>
                {c.badge}
              </span>
              <span className="text-[11px] text-[#64748B] font-medium truncate ml-2">
                {c.trend}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
