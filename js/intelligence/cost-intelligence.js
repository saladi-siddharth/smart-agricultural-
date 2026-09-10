/**
 * FarmPilot Agricultural Intelligence — Cost Intelligence & Cultivation Cost Engine
 * Grounded in: farm expenses, crop cycle budget, field area, and agronomic input categories
 */

(function () {
  const STANDARD_CATEGORIES = [
    'SEEDS',
    'FERTILIZERS',
    'LABOR',
    'IRRIGATION',
    'PEST_CONTROL',
    'MACHINERY',
    'TRANSPORT',
    'OTHER'
  ];

  // Benchmark allocations (% of planned budget) for commercial paddy
  const BENCHMARK_PERCENTAGES = {
    SEEDS: 8,
    FERTILIZERS: 25,
    LABOR: 35,
    IRRIGATION: 10,
    PEST_CONTROL: 8,
    MACHINERY: 10,
    TRANSPORT: 2,
    OTHER: 2
  };

  /**
   * Analyze Cost of Cultivation with Category Variance, Cost/Acre, and Final Projection
   */
  function analyzeCostOfCultivation(expenses = [], cropCycle = null, fieldArea = 10.0) {
    const plannedBudget = parseFloat(cropCycle?.planned_budget) || 50000;
    const totalSpent = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // Group actuals by category
    const actualByCategory = {};
    STANDARD_CATEGORIES.forEach(cat => { actualByCategory[cat] = 0; });

    expenses.forEach(e => {
      let rawCat = (e.category || 'OTHER').toUpperCase();
      if (rawCat === 'FERTILIZER') rawCat = 'FERTILIZERS';
      if (rawCat === 'SEED') rawCat = 'SEEDS';
      if (rawCat === 'LABOUR') rawCat = 'LABOR';
      if (rawCat === 'CHEMICAL' || rawCat === 'PESTICIDE') rawCat = 'PEST_CONTROL';

      if (!actualByCategory[rawCat]) actualByCategory[rawCat] = 0;
      actualByCategory[rawCat] += parseFloat(e.amount) || 0;
    });

    // Compute category level variances against benchmark allocations
    const categoryBreakdown = STANDARD_CATEGORIES.map(cat => {
      const actual = actualByCategory[cat] || 0;
      const plannedAllocation = Math.round(plannedBudget * (BENCHMARK_PERCENTAGES[cat] / 100));
      const variance = actual - plannedAllocation;
      const variancePct = plannedAllocation > 0 ? (variance / plannedAllocation) * 100 : 0;
      const shareOfTotal = totalSpent > 0 ? (actual / totalSpent) * 100 : 0;

      let status = 'ON_TRACK';
      if (variancePct > 15) status = 'CRITICAL';
      else if (variancePct > 8) status = 'ABOVE_PLAN';
      else if (variancePct > 0) status = 'WATCH';

      return {
        category: cat,
        displayName: cat.replace('_', ' '),
        actual,
        planned: plannedAllocation,
        variance,
        variancePct: parseFloat(variancePct.toFixed(1)),
        shareOfTotal: parseFloat(shareOfTotal.toFixed(1)),
        status
      };
    });

    // Cost Per Acre (Crucial Agricultural Metric)
    const area = Math.max(0.1, fieldArea);
    const costPerAcre = Math.round(totalSpent / area);
    const plannedCostPerAcre = Math.round(plannedBudget / area);

    // Projected Final Cultivation Cost
    // Formula: Current Spend + (Remaining Budget adjusted by current overall variance trend)
    const budgetUtilization = plannedBudget > 0 ? (totalSpent / plannedBudget) * 100 : 0;
    const remainingBudget = Math.max(0, plannedBudget - totalSpent);
    
    // If spending is running 12% hot, projected remaining spend scales proportionally
    const overallVarianceFactor = totalSpent > 0 && budgetUtilization > 25
      ? Math.max(0.9, 1.0 + ((totalSpent - (plannedBudget * (budgetUtilization / 100))) / plannedBudget))
      : 1.0;
    const projectedRemaining = Math.round(remainingBudget * overallVarianceFactor);
    const projectedFinalCost = totalSpent + projectedRemaining;
    const projectedVariance = projectedFinalCost - plannedBudget;
    const projectedVariancePct = plannedBudget > 0 ? ((projectedVariance / plannedBudget) * 100) : 0;

    let budgetStatus = 'ON_TRACK';
    if (projectedVariancePct > 12) budgetStatus = 'CRITICAL';
    else if (projectedVariancePct > 5) budgetStatus = 'ABOVE_PLAN';
    else if (projectedVariancePct > 0) budgetStatus = 'WATCH';

    // Alerts
    const alerts = [];
    const fertilizerCat = categoryBreakdown.find(c => c.category === 'FERTILIZERS');
    if (fertilizerCat && fertilizerCat.variancePct > 10) {
      alerts.push({
        type: 'COST_ALERT',
        severity: 'WARNING',
        title: `Fertilizer spending is +${fertilizerCat.variancePct}% above seasonal allocation`,
        detail: `Actual fertilizer outlay is ₹${fertilizerCat.actual.toLocaleString('en-IN')} vs allocated benchmark ₹${fertilizerCat.planned.toLocaleString('en-IN')}.`,
        action: 'Review nutrient batch vouchers and adjust pending top-dressing schedule.'
      });
    }

    return {
      totalSpent,
      plannedBudget,
      remainingBudget,
      budgetUtilization: parseFloat(budgetUtilization.toFixed(1)),
      projectedFinalCost,
      projectedVariance,
      projectedVariancePct: parseFloat(projectedVariancePct.toFixed(1)),
      budgetStatus,
      costPerAcre,
      plannedCostPerAcre,
      fieldArea: area,
      categoryBreakdown,
      alerts,
      trustLabels: {
        totalSpent: 'Recorded Data',
        projectedFinalCost: 'Calculated Projection',
        plannedBudget: 'Configured Budget'
      }
    };
  }

  window.CostIntelligence = {
    analyzeCostOfCultivation,
    BENCHMARK_PERCENTAGES
  };
})();
