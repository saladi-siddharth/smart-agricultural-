// ============================================
// FARMPILOT INTELLIGENCE ENGINE
// The core differentiator — turns farm data
// into actionable intelligence
// ============================================

import type {
  Activity, CropCycle, Expense, Input as FarmInput, IrrigationLog,
  Harvest, FarmHealthScore, CropFinancials, Recommendation,
  TodayPriority, CostBreakdownItem, AlertSeverity,
  ACTIVITY_WEIGHTS as ActivityWeightsType,
} from '@/types/database';
import { ACTIVITY_WEIGHTS, COST_CATEGORY_COLORS } from '@/types/database';

// ============================================
// FARM HEALTH SCORE (0-100)
// 35% Task Completion
// 25% Schedule Adherence
// 20% Cost Efficiency
// 20% Crop Progress
// ============================================
export function calculateFarmHealthScore(
  activities: Activity[],
  expenses: Expense[],
  inputs: FarmInput[],
  irrigationLogs: IrrigationLog[],
  cropCycle: CropCycle | null,
): FarmHealthScore {
  const taskScore = calculateTaskCompletionScore(activities);
  const scheduleScore = calculateScheduleAdherenceScore(activities);
  const costScore = calculateCostEfficiencyScore(expenses, inputs, irrigationLogs, cropCycle);
  const progressScore = calculateCropProgressScore(activities);

  const overall = Math.round(
    taskScore * 0.35 +
    scheduleScore * 0.25 +
    costScore * 0.20 +
    progressScore * 0.20
  );

  const clampedOverall = Math.max(0, Math.min(100, overall));

  return {
    overall: clampedOverall,
    taskCompletion: Math.round(taskScore),
    scheduleAdherence: Math.round(scheduleScore),
    costEfficiency: Math.round(costScore),
    cropProgress: Math.round(progressScore),
    label: getHealthLabel(clampedOverall),
    color: getHealthColor(clampedOverall),
  };
}

function calculateTaskCompletionScore(activities: Activity[]): number {
  if (activities.length === 0) return 100;
  const completed = activities.filter(a => a.status === 'COMPLETED').length;
  return (completed / activities.length) * 100;
}

function calculateScheduleAdherenceScore(activities: Activity[]): number {
  const completed = activities.filter(a => a.status === 'COMPLETED');
  if (completed.length === 0) return 100;

  const onTime = completed.filter(a => {
    if (!a.completed_date) return false;
    return new Date(a.completed_date) <= new Date(a.planned_date);
  });

  return (onTime.length / completed.length) * 100;
}

function calculateCostEfficiencyScore(
  expenses: Expense[],
  inputs: FarmInput[],
  irrigationLogs: IrrigationLog[],
  cropCycle: CropCycle | null,
): number {
  if (!cropCycle || !cropCycle.planned_budget || cropCycle.planned_budget <= 0) return 80;

  const totalCost = calculateTotalCost(expenses, inputs, irrigationLogs);
  const ratio = totalCost / cropCycle.planned_budget;

  if (ratio <= 0.7) return 95;
  if (ratio <= 0.85) return 90;
  if (ratio <= 1.0) return 80;
  if (ratio <= 1.1) return 65;
  if (ratio <= 1.2) return 50;
  return 30;
}

// ============================================
// CROP PROGRESS — Weighted by activity type
// ============================================
export function calculateCropProgressScore(activities: Activity[]): number {
  if (activities.length === 0) return 0;

  let totalWeight = 0;
  let completedWeight = 0;

  for (const activity of activities) {
    const weight = ACTIVITY_WEIGHTS[activity.activity_type] || 1;
    totalWeight += weight;
    if (activity.status === 'COMPLETED') {
      completedWeight += weight;
    }
  }

  if (totalWeight === 0) return 0;
  return (completedWeight / totalWeight) * 100;
}

// ============================================
// PROFITABILITY ENGINE
// ============================================
export function calculateCropFinancials(
  expenses: Expense[],
  inputs: FarmInput[],
  irrigationLogs: IrrigationLog[],
  activities: Activity[],
  harvests: Harvest[],
  cropCycle: CropCycle | null,
): CropFinancials {
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalInputCosts = inputs.reduce((sum, i) => sum + (i.cost || 0), 0);
  const totalIrrigationCosts = irrigationLogs.reduce((sum, i) => sum + (i.cost || 0), 0);
  const totalActivityCosts = activities.reduce((sum, a) => sum + (a.actual_cost || 0), 0);

  const totalCost = totalExpenses + totalInputCosts + totalIrrigationCosts + totalActivityCosts;
  const plannedBudget = cropCycle?.planned_budget || 0;
  const budgetUtilization = plannedBudget > 0 ? (totalCost / plannedBudget) * 100 : 0;

  // Revenue calculations
  const targetYield = cropCycle?.target_yield || 0;
  const sellingPrice = cropCycle?.selling_price_per_unit || 0;
  const estimatedRevenue = targetYield * sellingPrice;

  // Actual revenue from harvests
  const actualRevenue = harvests.reduce((sum, h) => sum + (h.revenue || 0), 0);

  const estimatedProfit = estimatedRevenue - totalCost;
  const profitMargin = estimatedRevenue > 0 ? (estimatedProfit / estimatedRevenue) * 100 : 0;

  // Cost breakdown by expense category
  const categoryTotals: Record<string, number> = {};
  for (const expense of expenses) {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
  }
  // Add input costs
  if (totalInputCosts > 0) {
    categoryTotals['INPUTS'] = totalInputCosts;
  }
  // Add irrigation costs
  if (totalIrrigationCosts > 0) {
    categoryTotals['IRRIGATION'] = (categoryTotals['IRRIGATION'] || 0) + totalIrrigationCosts;
  }

  const costBreakdown: CostBreakdownItem[] = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalCost > 0 ? (amount / totalCost) * 100 : 0,
      color: COST_CATEGORY_COLORS[category] || '#94a3b8',
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalExpenses,
    totalInputCosts,
    totalIrrigationCosts,
    totalActivityCosts,
    totalCost,
    plannedBudget,
    budgetUtilization,
    estimatedRevenue,
    estimatedProfit,
    profitMargin,
    actualRevenue,
    costBreakdown,
  };
}

function calculateTotalCost(
  expenses: Expense[],
  inputs: FarmInput[],
  irrigationLogs: IrrigationLog[],
): number {
  const expenseCost = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const inputCost = inputs.reduce((sum, i) => sum + (i.cost || 0), 0);
  const irrigationCost = irrigationLogs.reduce((sum, i) => sum + (i.cost || 0), 0);
  return expenseCost + inputCost + irrigationCost;
}

// ============================================
// RECOMMENDATION ENGINE (Rule-based)
// ============================================
export function generateRecommendations(
  activities: Activity[],
  expenses: Expense[],
  inputs: FarmInput[],
  irrigationLogs: IrrigationLog[],
  cropCycle: CropCycle | null,
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Rule 1: Overdue activities
  const overdueActivities = activities.filter(a => {
    const planned = new Date(a.planned_date);
    planned.setHours(0, 0, 0, 0);
    return planned < today && a.status !== 'COMPLETED';
  });

  for (const activity of overdueActivities) {
    const planned = new Date(activity.planned_date);
    planned.setHours(0, 0, 0, 0);
    const daysOverdue = Math.floor((today.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));
    const severity: AlertSeverity = daysOverdue > 3 ? 'CRITICAL' : 'WARNING';

    recommendations.push({
      id: `overdue-${activity.id}`,
      title: `Complete ${activity.title}`,
      severity,
      problem: `${activity.title} is overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}.`,
      reason: `The planned date (${formatDate(activity.planned_date)}) has passed and this ${activity.activity_type.toLowerCase().replace('_', ' ')} activity remains incomplete.`,
      action: `Complete ${activity.title.toLowerCase()} immediately to prevent crop schedule delays and increased operational risk.`,
      sourceData: `Activity schedule — planned for ${formatDate(activity.planned_date)}`,
      icon: daysOverdue > 3 ? '🚨' : '⚠️',
    });
  }

  // Rule 2: Cost overrun warning
  if (cropCycle && cropCycle.planned_budget > 0) {
    const totalCost = calculateTotalCost(expenses, inputs, irrigationLogs);
    const ratio = totalCost / cropCycle.planned_budget;

    if (ratio > 1.0) {
      const overrunPercent = Math.round((ratio - 1) * 100);
      recommendations.push({
        id: 'cost-overrun',
        title: 'Review spending — over budget',
        severity: 'CRITICAL',
        problem: `Current spending is ${overrunPercent}% above the planned budget.`,
        reason: `Total cost (₹${formatAmount(totalCost)}) exceeds the planned budget (₹${formatAmount(cropCycle.planned_budget)}).`,
        action: 'Review expense categories and identify areas where costs can be optimized for the remainder of the crop cycle.',
        sourceData: `Budget: ₹${formatAmount(cropCycle.planned_budget)} | Spent: ₹${formatAmount(totalCost)}`,
        icon: '💸',
      });
    } else if (ratio > 0.85) {
      const usedPercent = Math.round(ratio * 100);
      recommendations.push({
        id: 'cost-warning',
        title: 'Monitor spending — approaching budget',
        severity: 'WARNING',
        problem: `${usedPercent}% of the planned budget has been utilized.`,
        reason: `Current spending (₹${formatAmount(totalCost)}) is approaching the planned budget (₹${formatAmount(cropCycle.planned_budget)}).`,
        action: 'Review upcoming planned expenses and prioritize essential activities.',
        sourceData: `Budget utilization: ${usedPercent}%`,
        icon: '📊',
      });
    }
  }

  // Rule 3: Low profitability warning
  if (cropCycle && cropCycle.target_yield > 0 && cropCycle.selling_price_per_unit > 0) {
    const totalCost = calculateTotalCost(expenses, inputs, irrigationLogs);
    const estimatedRevenue = cropCycle.target_yield * cropCycle.selling_price_per_unit;
    const margin = estimatedRevenue > 0 ? ((estimatedRevenue - totalCost) / estimatedRevenue) * 100 : 0;

    if (margin < 20 && margin > 0) {
      recommendations.push({
        id: 'low-profit',
        title: 'Profitability at risk',
        severity: 'WARNING',
        problem: `Expected profit margin is only ${Math.round(margin)}%.`,
        reason: `High operational costs relative to expected revenue may impact the final profitability of this crop cycle.`,
        action: 'Review cost structure and explore ways to increase yield or reduce remaining expenses.',
        sourceData: `Revenue: ₹${formatAmount(estimatedRevenue)} | Cost: ₹${formatAmount(totalCost)} | Margin: ${Math.round(margin)}%`,
        icon: '📉',
      });
    } else if (margin <= 0) {
      recommendations.push({
        id: 'loss-warning',
        title: 'Potential loss detected',
        severity: 'CRITICAL',
        problem: 'Current costs exceed expected revenue.',
        reason: `Total costs (₹${formatAmount(totalCost)}) are higher than estimated revenue (₹${formatAmount(estimatedRevenue)}).`,
        action: 'Urgently review all expenses. Consider adjusting the selling price or reducing costs.',
        sourceData: `Revenue: ₹${formatAmount(estimatedRevenue)} | Cost: ₹${formatAmount(totalCost)}`,
        icon: '🚨',
      });
    }
  }

  // Rule 4: Crop progress behind schedule
  if (cropCycle && cropCycle.start_date && cropCycle.expected_harvest_date) {
    const start = new Date(cropCycle.start_date).getTime();
    const end = new Date(cropCycle.expected_harvest_date).getTime();
    const now = today.getTime();
    const totalDuration = end - start;
    const elapsed = now - start;

    if (totalDuration > 0 && elapsed > 0) {
      const expectedProgress = Math.min((elapsed / totalDuration) * 100, 100);
      const actualProgress = calculateCropProgressScore(activities);

      if (actualProgress < expectedProgress - 15 && actualProgress < 90) {
        recommendations.push({
          id: 'progress-behind',
          title: 'Crop progress behind schedule',
          severity: 'WARNING',
          problem: `Actual progress (${Math.round(actualProgress)}%) is behind expected progress (${Math.round(expectedProgress)}%).`,
          reason: 'Incomplete activities are causing the crop cycle to fall behind the planned schedule.',
          action: 'Prioritize completing pending activities to bring the crop cycle back on track.',
          sourceData: `Expected: ${Math.round(expectedProgress)}% | Actual: ${Math.round(actualProgress)}%`,
          icon: '📅',
        });
      }
    }
  }

  // Rule 5: Positive — ahead of schedule
  if (activities.length > 0) {
    const completionRate = (activities.filter(a => a.status === 'COMPLETED').length / activities.length) * 100;
    if (completionRate >= 80 && overdueActivities.length === 0) {
      recommendations.push({
        id: 'on-track',
        title: 'Crop cycle on track',
        severity: 'SUCCESS',
        problem: `${Math.round(completionRate)}% of planned activities are completed.`,
        reason: 'All activities are on schedule with no overdue tasks.',
        action: 'Continue monitoring and prepare for upcoming activities.',
        sourceData: `Completion rate: ${Math.round(completionRate)}%`,
        icon: '✅',
      });
    }
  }

  // Rule 6: Cost efficiency positive
  if (cropCycle && cropCycle.planned_budget > 0) {
    const totalCost = calculateTotalCost(expenses, inputs, irrigationLogs);
    const ratio = totalCost / cropCycle.planned_budget;
    if (ratio > 0 && ratio <= 0.75) {
      const savedPercent = Math.round((1 - ratio) * 100);
      recommendations.push({
        id: 'cost-efficient',
        title: 'Spending is well managed',
        severity: 'SUCCESS',
        problem: `Current spending is ${savedPercent}% below the planned budget.`,
        reason: 'Efficient use of resources is keeping costs under control.',
        action: 'Maintain current spending discipline while ensuring quality inputs.',
        sourceData: `Budget: ₹${formatAmount(cropCycle.planned_budget)} | Spent: ₹${formatAmount(totalCost)}`,
        icon: '💰',
      });
    }
  }

  return recommendations.sort((a, b) => {
    const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2, SUCCESS: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// ============================================
// TODAY'S PRIORITIES
// ============================================
export function generateTodayPriorities(activities: Activity[]): TodayPriority[] {
  const priorities: TodayPriority[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Overdue activities (highest priority)
  const overdue = activities.filter(a => {
    const planned = new Date(a.planned_date);
    planned.setHours(0, 0, 0, 0);
    return planned < today && a.status !== 'COMPLETED';
  }).sort((a, b) => {
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
  });

  for (const activity of overdue) {
    const planned = new Date(activity.planned_date);
    planned.setHours(0, 0, 0, 0);
    const daysOverdue = Math.floor((today.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));

    priorities.push({
      id: `overdue-${activity.id}`,
      title: activity.title,
      subtitle: `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
      severity: daysOverdue > 3 ? 'CRITICAL' : 'WARNING',
      type: 'overdue',
      activityId: activity.id,
      icon: '🔴',
    });
  }

  // Due today
  const dueToday = activities.filter(a => {
    const planned = new Date(a.planned_date);
    planned.setHours(0, 0, 0, 0);
    return planned.getTime() === today.getTime() && a.status !== 'COMPLETED';
  });

  for (const activity of dueToday) {
    priorities.push({
      id: `today-${activity.id}`,
      title: activity.title,
      subtitle: 'Due today',
      severity: 'INFO',
      type: 'due_today',
      activityId: activity.id,
      icon: '🟡',
    });
  }

  return priorities;
}

// ============================================
// HELPERS
// ============================================
function getHealthLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Healthy';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'At Risk';
  return 'Critical';
}

function getHealthColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 75) return '#16a34a';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatAmount(amount: number): string {
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toLocaleString('en-IN');
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
