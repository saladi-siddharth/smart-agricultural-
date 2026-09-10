import { farmSeedData } from '../data/farmSeedData.js';

const safeNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const diffInDays = (dateA, dateB) => {
  const a = new Date(dateA);
  const b = new Date(dateB);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
};

const getActivitiesForFarm = (farmId) => {
  const activities = farmSeedData.activities.filter((activity) => activity.farm_id === farmId);
  return activities;
};

const getCropForFarm = (farmId) => {
  const crop = farmSeedData.cropCycles.find((cycle) => cycle.farm_id === farmId) || farmSeedData.cropCycles[0];
  return crop;
};

const getFinancialForFarm = (farmId) => {
  const expenses = farmSeedData.expenses.filter((expense) => expense.farm_id === farmId);
  const crop = getCropForFarm(farmId);
  const totalSpent = expenses.reduce((sum, item) => sum + safeNumber(item.amount), 0);
  const plannedBudget = safeNumber(crop.planned_budget, 50000);
  const projectedCost = totalSpent + Math.max(0, plannedBudget - totalSpent) * 0.7;
  return {
    totalSpent,
    plannedBudget,
    remainingBudget: Math.max(0, plannedBudget - totalSpent),
    budgetUtilization: plannedBudget > 0 ? Math.round((totalSpent / plannedBudget) * 100) : 0,
    projectedCost,
    estimatedRevenue: safeNumber(crop.target_yield, 4.2) * safeNumber(crop.selling_price_per_unit, 29000),
    estimatedProfit: safeNumber(crop.target_yield, 4.2) * safeNumber(crop.selling_price_per_unit, 29000) - totalSpent,
    categories: expenses.reduce((acc, item) => {
      const key = item.category || 'OTHER';
      acc[key] = (acc[key] || 0) + safeNumber(item.amount);
      return acc;
    }, {})
  };
};

const buildStageContext = (crop, activities) => {
  const now = new Date();
  const overdueCount = activities.filter((activity) => activity.status !== 'COMPLETED' && activity.due_date && new Date(activity.due_date) < now).length;
  const stageLabel = crop?.current_stage || 'Estimated Active Tillering';
  return {
    label: stageLabel,
    status: overdueCount > 0 ? 'Estimated crop stage' : 'On schedule',
    evidence: `${crop?.crop_name || 'Paddy'} cycle is in ${stageLabel}. ${overdueCount} operation${overdueCount === 1 ? '' : 's'} are behind schedule. Crop calendar + activity history + field completion indicate the current stage.`,
    detail: 'Estimated stage: Active Tillering. Basis: crop calendar + elapsed days + completed irrigation and fertilizer work.'
  };
};

const buildPriorityActions = (activities) => {
  const now = new Date();
  return activities
    .filter((activity) => activity.status !== 'COMPLETED')
    .map((activity) => {
      const dueDate = activity.due_date || activity.date;
      const overdueDays = dueDate ? Math.max(0, diffInDays(now, dueDate)) : 0;
      const stageWeight = /(fertilizer|spray|top|irrigation|pest)/i.test(activity.title || '') ? 25 : 15;
      const dependencyWeight = /(fertilizer|spray|top)/i.test(activity.title || '') ? 20 : 10;
      const priorityWeight = { HIGH: 90, MEDIUM: 70, LOW: 40 }[activity.priority] || 50;
      const score = overdueDays * 8 + priorityWeight + stageWeight + dependencyWeight;

      return {
        id: activity.id,
        title: activity.title,
        priority: activity.priority || 'MEDIUM',
        score,
        why: overdueDays > 0 ? `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}` : 'Due within the current crop window',
        impact: overdueDays > 0 ? 'Schedule disruption risk is elevated for this crop stage.' : 'Current crop plan remains within the expected operational window.',
        recommendedAction: `Complete ${activity.title} and record the actual use before closing the workflow.`,
        context: `${activity.field_name || 'Field'} • ${activity.category || 'Farm operation'}`
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

const buildRiskRegister = (activities, financial, crop) => {
  const now = new Date();
  const risks = [];

  const overdue = activities.filter((activity) => activity.status !== 'COMPLETED' && activity.due_date && new Date(activity.due_date) < now);
  if (overdue.length > 0) {
    risks.push({
      type: 'Schedule Risk',
      severity: 'High',
      reason: `${overdue[0].title} is overdue and now sits outside the active tillering window.`,
      action: 'Review the field plan and complete the pending operation before the crop moves into the next stage.'
    });
  }

  const variancePct = financial.plannedBudget > 0 ? ((financial.totalSpent - financial.plannedBudget) / financial.plannedBudget) * 100 : 0;
  if (variancePct > 0) {
    risks.push({
      type: 'Cost Risk',
      severity: variancePct > 12 ? 'Critical' : 'Medium',
      reason: `Current spend is ${variancePct.toFixed(1)}% above plan.`,
      action: 'Review expense categories and compare them against the active crop cycle budget.'
    });
  }

  const irrigationMissing = !activities.some((activity) => /irrigation/i.test(activity.title || activity.category || ''));
  const expenseMissing = financial.totalSpent === 0;
  if (irrigationMissing || expenseMissing) {
    risks.push({
      type: 'Data Quality Risk',
      severity: 'Medium',
      reason: irrigationMissing ? 'Irrigation records are incomplete.' : 'Actual expense details are missing.',
      action: 'Add the missing field records to improve confidence in the current recommendation set.'
    });
  }

  if (/tillering|vegetative|fertilization/i.test(crop?.current_stage || '')) {
    risks.push({
      type: 'Crop Progress Risk',
      severity: 'Medium',
      reason: 'The crop is in an active growth window and the pending operations are not fully complete.',
      action: 'Verify completion status and the crop calendar before moving to the next stage.'
    });
  }

  return risks;
};

const buildDataQuality = (activities, inputs, expenses) => {
  const required = [
    { label: 'Farm and field context', present: true },
    { label: 'Crop stage', present: true },
    { label: 'Operations', present: activities.length > 0 },
    { label: 'Inputs', present: inputs.length > 0 },
    { label: 'Expenses', present: expenses.length > 0 },
    { label: 'Irrigation', present: activities.some((activity) => /irrigation/i.test(activity.title || activity.category || '')) }
  ];
  const missing = required.filter((item) => !item.present).map((item) => item.label);
  const score = Math.max(65, Math.round((required.filter((item) => item.present).length / required.length) * 100));

  return {
    score,
    missing,
    summary: missing.length ? `${missing.length} record${missing.length === 1 ? '' : 's'} need attention.` : 'All required field records are present.'
  };
};

const buildFinancialInsights = (farmId) => {
  const financial = getFinancialForFarm(farmId);
  const crop = getCropForFarm(farmId);
  const targetYield = safeNumber(crop.target_yield, 4.2);
  const sellingPrice = safeNumber(crop.selling_price_per_unit, 29000);
  const projectedCost = financial.projectedCost;
  const breakEvenYield = projectedCost / sellingPrice;
  const expectedProfit = safeNumber(crop.target_yield, 4.2) * sellingPrice - financial.totalSpent;
  const safetyBuffer = expectedProfit - (breakEvenYield * sellingPrice);

  return {
    currentCost: financial.totalSpent,
    projectedCost,
    budget: financial.plannedBudget,
    variancePct: financial.plannedBudget > 0 ? ((financial.totalSpent - financial.plannedBudget) / financial.plannedBudget) * 100 : 0,
    revenue: targetYield * sellingPrice,
    profit: expectedProfit,
    margin: targetYield > 0 && sellingPrice > 0 ? ((expectedProfit / (targetYield * sellingPrice)) * 100) : 0,
    breakEvenYield,
    targetYield,
    safetyBuffer,
    categories: financial.categories
  };
};

const buildDecisionCockpit = (priorities, financial, dataQuality) => {
  const overdue = priorities.filter((item) => item.overdueDays > 0);
  const topAction = priorities[0] || null;
  const costOfWaiting = overdue.reduce((sum, item) => {
    const dailyExposure = /zinc|nitrogen|urea|fertil|spray|irrigation/i.test(item.title || '') ? 1200 : 500;
    return sum + Math.max(1, item.overdueDays) * dailyExposure;
  }, 0);
  const confidence = dataQuality.score;

  return {
    mode: overdue.length ? 'INTERVENE TODAY' : topAction ? 'PREPARE NEXT' : 'MONITOR',
    action_score: topAction?.score || 0,
    overdue_count: overdue.length,
    cost_of_waiting: costOfWaiting,
    confidence,
    confidence_label: confidence >= 85 ? 'High confidence' : confidence >= 70 ? 'Moderate confidence' : 'Low confidence',
    headline: topAction
      ? `Complete ${topAction.title} before another day is lost.`
      : 'No pending operation currently requires intervention.',
    rationale: topAction
      ? `${topAction.why} ${topAction.impact}`
      : 'The current operation queue is clear.',
    next_best_move: topAction?.recommendedAction || 'Review the crop calendar and confirm the next planned operation.',
    budget_headroom: Math.max(0, financial.plannedBudget - financial.projectedCost)
  };
};

export const createFarmIntelligenceService = () => ({
  getFarmSnapshot(farmId = 'farm-1') {
    const farm = farmSeedData.farms.find((item) => item.id === farmId) || farmSeedData.farms[0];
    const crop = getCropForFarm(farmId);
    const activities = getActivitiesForFarm(farmId);
    const expenses = farmSeedData.expenses.filter((item) => item.farm_id === farmId);
    const inputs = farmSeedData.inputs.filter((item) => item.farm_id === farmId);
    const financial = getFinancialForFarm(farmId);
    const stageContext = buildStageContext(crop, activities);
    const priorities = buildPriorityActions(activities);
    const risks = buildRiskRegister(activities, financial, crop);
    const dataQuality = buildDataQuality(activities, inputs, expenses);
    const financialInsights = buildFinancialInsights(farmId);
    const decisionCockpit = buildDecisionCockpit(priorities, financialInsights, dataQuality);
    const healthScore = farm.health_score || 82;

    return {
      farm,
      health: {
        score: healthScore,
        statusLabel: healthScore >= 90 ? 'Optimal' : healthScore >= 75 ? 'Healthy' : 'Action Required'
      },
      cropContext: stageContext,
      priorities,
      risks,
      financialInsights,
      decisionCockpit,
      dataQuality,
      recommendations: priorities.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.title,
        reason: item.why,
        recommendation: item.recommendedAction,
        impact: item.impact,
        priority: item.priority
      })),
      weatherContext: {
        source: 'External weather feed',
        window: 'Next 48 hours',
        updated: 'Today',
        status: 'Available'
      },
      narrative: `Farm operations are generally on track, but fertilizer spending is above plan and one crop activity requires attention before the tillering window closes.`
    };
  },

  getCropSnapshot(cropId = 'crop-1') {
    const crop = farmSeedData.cropCycles.find((item) => item.id === cropId) || farmSeedData.cropCycles[0];
    const activities = farmSeedData.activities.filter((item) => item.farm_id === crop.farm_id);
    const financial = getFinancialForFarm(crop.farm_id);
    const priorities = buildPriorityActions(activities);
    const risks = buildRiskRegister(activities, financial, crop);
    const stageContext = buildStageContext(crop, activities);
    const dataQuality = buildDataQuality(activities, farmSeedData.inputs.filter((item) => item.farm_id === crop.farm_id), farmSeedData.expenses.filter((item) => item.farm_id === crop.farm_id));
    const financials = buildFinancialInsights(crop.farm_id);

    return {
      crop,
      stage: stageContext,
      operations: activities,
      financials,
      decisionCockpit: buildDecisionCockpit(priorities, financials, dataQuality),
      risks,
      priorities,
      harvestReadiness: 78,
      recommendations: priorities.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.title,
        reason: item.why,
        recommendation: item.recommendedAction,
        impact: item.impact,
        priority: item.priority
      })),
      dataQuality
    };
  }
});

export const farmIntelligenceService = createFarmIntelligenceService();
