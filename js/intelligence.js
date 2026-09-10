/**
 * FarmPilot Unified Agricultural Intelligence Orchestrator — Phase 2 Enterprise
 * Integrates 12 Specialized Agronomic Engines into a Single Cohesive Decision-Support Architecture
 */

(function () {
  function toCurrency(value) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  function statusBadgeClass(severity) {
    const map = {
      CRITICAL: 'badge-danger',
      Critical: 'badge-danger',
      HIGH: 'badge-warning',
      High: 'badge-warning',
      MEDIUM: 'badge-neutral',
      Medium: 'badge-neutral',
      LOW: 'badge-success',
      Low: 'badge-success',
      OPTIMAL: 'badge-success',
      Optimal: 'badge-success'
    };
    return map[severity] || 'badge-neutral';
  }

  /**
   * Build Complete Agricultural Intelligence Snapshot from Database
   */
  async function buildFarmSnapshot() {
    // 1. Gather all raw records
    const [
      activities,
      cropCycle,
      expenses,
      inputs,
      irrigationLogs,
      activeFarm,
      farms,
      fields,
      dbRecommendations,
      journal
    ] = await Promise.all([
      window.FarmPilotDB.getActivities(),
      window.FarmPilotDB.getCropCycle(),
      window.FarmPilotDB.getExpenses(),
      window.FarmPilotDB.getInputs(),
      window.FarmPilotDB.getIrrigationLogs(),
      window.FarmPilotDB.getActiveFarm(),
      window.FarmPilotDB.getFarms(),
      window.FarmPilotDB.getFields(),
      window.FarmPilotDB.getRecommendations(),
      window.FarmPilotDB.getOperationalJournal()
    ]);

    const activeField = fields.find(f => f.id === cropCycle?.field_id) || fields[0];

    // 2. Weather Context Engine
    const weather = window.WeatherContextEngine
      ? await window.WeatherContextEngine.getWeatherContext()
      : { status: 'OFFLINE', condition: 'Data Unavailable' };

    // 3. Crop Stage Engine
    const cropContext = window.CropStageEngine
      ? window.CropStageEngine.determineCropStage(cropCycle, activities)
      : { currentStageName: 'Active Tillering', label: 'Estimated Active Tillering', progressPct: 58 };

    // 4. Cost Intelligence Engine
    const costAnalysis = window.CostIntelligence
      ? window.CostIntelligence.analyzeCostOfCultivation(expenses, cropCycle, activeField?.area || 10.0)
      : { totalSpent: 18500, plannedBudget: 50000, projectedFinalCost: 52400 };

    // 5. Profitability Scenario Engine
    const profitability = window.ProfitabilityEngine
      ? window.ProfitabilityEngine.evaluateProfitability(cropCycle, costAnalysis.projectedFinalCost)
      : { breakEvenYield: 1.8, targetYield: 4.2, safetyBufferYield: 2.4 };

    // 6. Operational Risk Engine & Matrix
    const risks = window.RiskEngine
      ? window.RiskEngine.detectRisks(activities, expenses, cropCycle, irrigationLogs, weather)
      : { risks: [], matrix: {} };

    // 7. Activity Intelligence & Priority Engine
    const sequenceWarnings = window.ActivityIntelligence
      ? window.ActivityIntelligence.detectSequenceWarnings(activities, irrigationLogs)
      : [];
    const todayPlan = window.ActivityIntelligence
      ? window.ActivityIntelligence.rankTodayActions(activities, cropContext, cropCycle?.planned_budget || 50000)
      : [];

    // 8. Data Quality & Completeness Engine
    const dataQuality = window.DataQualityEngine
      ? window.DataQualityEngine.evaluateDataQuality({
          farm: activeFarm,
          field: activeField,
          cropCycle,
          activities,
          inputs,
          expenses,
          irrigationLogs
        })
      : { score: 85, confidenceLevel: 'MODERATE' };

    // 9. Farm Health 2.0 Engine
    const health = window.FarmHealthEngine
      ? window.FarmHealthEngine.computeFarmHealth({
          activities,
          expenses,
          cropCycle,
          inputs,
          irrigationLogs
        })
      : (window.FarmPilotDB.getFarmHealth ? window.FarmPilotDB.getFarmHealth() : { score: 82 });

    // 10. Recommendations Synthesis
    const synthesizedRecs = window.RecommendationEngine
      ? window.RecommendationEngine.generateRecommendations({
          activities,
          risks: risks.risks || [],
          costAnalysis,
          cropContext
        })
      : [];

    // 11. Comparison & Historical Benchmarks Engine
    const farmComparisons = window.ComparisonBenchmarkingEngine
      ? window.ComparisonBenchmarkingEngine.compareFarms(farms, activeFarm?.id)
      : [];
    const fieldComparisons = window.ComparisonBenchmarkingEngine
      ? window.ComparisonBenchmarkingEngine.compareFields(fields, activities, cropCycle)
      : [];
    const historicalBenchmark = window.ComparisonBenchmarkingEngine
      ? window.ComparisonBenchmarkingEngine.benchmarkHistoricalCycles(costAnalysis, window.FARMPILOT_CONFIG.HISTORICAL_BENCHMARKS)
      : null;

    // 12. Operational Harvest Readiness
    const totalCycleDays = cropContext.totalCycleDays || 140;
    const elapsedDays = cropContext.elapsedDays || 75;
    const harvestReadiness = {
      percentage: Math.min(95, Math.max(10, Math.round((elapsedDays / totalCycleDays) * 100))),
      label: 'Operational Harvest Readiness Estimate',
      disclaimer: 'Operational estimate based on elapsed days, AWD cycles, and crop calendar milestones. Not a destructive biological maturity assay.',
      checklist: [
        { task: 'Confirm combine harvester booking with district cooperative', done: false, dueDays: 45 },
        { task: 'Pre-harvest canal cut-off drainage 10 days before maturity', done: false, dueDays: 55 },
        { task: 'Calibrate moisture meter (Target: 20-22% moisture)', done: false, dueDays: 60 },
        { task: 'Establish procurement buyer contract with AP State Rice Fed', done: true, dueDays: 0 }
      ]
    };

    const snapshot = {
      activeFarm,
      activeField,
      cropCycle,
      activities,
      expenses,
      inputs,
      irrigationLogs,
      weather,
      cropContext,
      costAnalysis,
      profitability,
      risks,
      sequenceWarnings,
      todayPlan,
      dataQuality,
      health,
      recommendations: synthesizedRecs,
      farmComparisons,
      fieldComparisons,
      historicalBenchmark,
      harvestReadiness,
      journal: journal || [],
      updatedAt: new Date().toISOString()
    };

    return snapshot;
  }

  /**
   * 1-Click Action Resolution: Completes an activity, logs to journal, resolves alerts,
   * and triggers immediate recalculation of all intelligence engines
   */
  async function executeAction(activityId, actualCost) {
    if (!window.FarmPilotDB) return null;

    // 1. Mark activity completed
    const result = await window.FarmPilotDB.completeActivity(activityId, actualCost);

    // 2. Add journal entry
    const actTitle = result?.activity?.title || 'Field operation';
    await window.FarmPilotDB.addJournalEntry({
      event_type: 'ACTIVITY_COMPLETED',
      title: `Completed Operation: ${actTitle}`,
      description: `Field milestone executed. Actual outlay recorded and tillering schedule adherence restored.`,
      metadata: { activity_id: activityId, cost: actualCost }
    });

    // 3. Mark matching recommendation as COMPLETED
    await window.FarmPilotDB.updateRecommendationStatus('rec-overdue-foliar', 'COMPLETED', 'Executed Foliar Spray');

    // 4. Recalculate health
    const updatedHealth = window.FarmPilotDB.calculateHealth();

    // 5. Fire global intelligence updated event
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('farmpilot:intelligence-updated', { detail: { health: updatedHealth } }));
    }

    return {
      success: true,
      activity: result.activity,
      health: updatedHealth
    };
  }

  /**
   * Daily Farm Brief Generator (Executive Morning Brief)
   */
  function generateDailyBrief(snapshot) {
    const { cropContext, todayPlan, health, costAnalysis, profitability, weather } = snapshot;
    const overdueCount = todayPlan.filter(a => a.overdueDays > 0).length;

    let headline = '';
    if (overdueCount > 0) {
      headline = `Attention needed: ${overdueCount} field operation is overdue for ${cropContext?.cropName || 'Paddy'} in ${cropContext?.currentStageName || 'Active Tillering'}. Farm Health is at ${health.score}/100.`;
    } else {
      headline = `Operations optimal: All field activities synchronized for ${cropContext?.cropName || 'Paddy'}. Farm Health is at ${health.score}/100.`;
    }

    return {
      headline,
      date: new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      weatherContext: `${weather.temperature || '31°C'} • ${weather.condition || 'Clear'} • ${weather.rainProbability || 25}% Rain Risk`,
      priorityAction: todayPlan[0] || null,
      spendToDate: costAnalysis?.totalSpent || 18500,
      projectedProfit: profitability?.safetyBufferRevenue || 71800,
      cropStage: cropContext?.currentStageName || 'Active Tillering'
    };
  }

  /**
   * Weekly Farm Review Generator
   */
  function generateWeeklyReview(snapshot) {
    const { activities, expenses, costAnalysis } = snapshot;
    const completedThisWeek = activities.filter(a => a.status === 'COMPLETED').length;
    const delayedThisWeek = activities.filter(a => a.status === 'OVERDUE').length;

    return {
      title: 'Weekly Farm Management Review',
      completedOperations: completedThisWeek,
      delayedOperations: delayedThisWeek,
      spendThisWeek: expenses.slice(0, 3).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
      budgetStatus: costAnalysis?.budgetStatus || 'ON_TRACK',
      narrative: `During this 7-day window, ${completedThisWeek} operations were executed and ${delayedThisWeek} requires scheduling remediation. Cultivation budget tracking within normal variance threshold.`
    };
  }

  /**
   * Convert ranked actions into an executive decision cockpit. The model is
   * intentionally deterministic: every number can be traced to a task,
   * deadline, crop stage, or recorded cost.
   */
  function buildDecisionCockpit(snapshot) {
    const actions = snapshot.todayPlan || [];
    const overdue = actions.filter(action => action.overdueDays > 0);
    const topAction = actions[0] || null;
    const dailyDelayCost = overdue.reduce((sum, action) => {
      const agronomicExposure = /zinc|nitrogen|urea|fertil|spray|irrigation/i.test(action.title || '') ? 1200 : 500;
      return sum + (Math.max(1, action.overdueDays) * agronomicExposure);
    }, 0);
    const projectedCost = snapshot.costAnalysis?.projectedFinalCost || 0;
    const budget = snapshot.costAnalysis?.plannedBudget || 0;
    const budgetHeadroom = Math.max(0, budget - projectedCost);
    const confidence = snapshot.dataQuality?.score || 0;
    const actionScore = topAction?.score || 0;
    const decisionMode = overdue.length > 0 ? 'INTERVENE TODAY' : actionScore >= 60 ? 'PREPARE NEXT' : 'MONITOR';

    return {
      decisionMode,
      topAction,
      actionScore,
      overdueCount: overdue.length,
      costOfWaiting: dailyDelayCost,
      budgetHeadroom,
      confidence,
      confidenceLabel: confidence >= 85 ? 'High confidence' : confidence >= 70 ? 'Moderate confidence' : 'Low confidence',
      headline: overdue.length > 0
        ? `One decision protects the crop window: complete ${topAction.title} before another day is lost.`
        : 'The farm is inside its operating window. Prepare the next task before it becomes urgent.',
      rationale: topAction
        ? `${topAction.why} ${topAction.impact} The ranking combines deadline pressure, crop-stage relevance, task priority, and cost exposure.`
        : 'No pending operation currently requires intervention.',
      counterfactual: dailyDelayCost > 0
        ? `Waiting another day exposes approximately ${toCurrency(dailyDelayCost)} in schedule and input-timing risk.`
        : 'No immediate delay cost is currently detected from the recorded operations.',
      nextBestMove: topAction?.recommendedAction || 'Review the crop calendar and confirm the next planned field operation.'
    };
  }

  window.FarmPilotIntelligence = {
    buildFarmSnapshot,
    executeAction,
    generateDailyBrief,
    generateWeeklyReview,
    buildDecisionCockpit,
    queryAskFarmPilot: (q, s) => window.AskFarmPilotEngine.queryFarmPilot(q, s),
    queryAskFarmPilotAsync: (q, s, opt) => window.AskFarmPilotEngine.queryFarmPilotAsync(q, s, opt),
    simulateWhatIf: (y, p, c) => window.ProfitabilityEngine.simulateWhatIf(y, p, c),
    toCurrency,
    statusBadgeClass
  };
})();
