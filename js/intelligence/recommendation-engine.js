/**
 * FarmPilot Agricultural Intelligence — Recommendation & Explainability Engine
 * Manages decision-to-action lifecycle, explainable "Why?" drawer data, user overrides, and feedback
 */

(function () {
  /**
   * Synthesize high-priority actionable recommendations from current farm telemetry and records
   */
  function generateRecommendations(snapshot) {
    const { activities = [], risks = [], costAnalysis = null, cropContext = null } = snapshot;
    const recs = [];

    // 1. Overdue operation recommendation (Demo flagship)
    const overdueAct = activities.find(a => a.status === 'OVERDUE');
    if (overdueAct) {
      recs.push({
        id: 'rec-overdue-foliar',
        title: `Execute Overdue Operation: ${overdueAct.title}`,
        priority: 'CRITICAL',
        category: 'NUTRITION',
        crop_name: cropContext?.cropName || 'Paddy',
        field_name: overdueAct.field_name || 'North Block (Plot A)',
        crop_stage: cropContext?.currentStageName || 'Active Tillering',
        activity_id: overdueAct.id,
        trigger_reason: `Activity is overdue by ${overdueAct.overdueDays || 2} days. Soil test indicates zinc level 0.4 ppm (critical threshold <0.6 ppm).`,
        agricultural_context: `Paddy in active tillering phase requires immediate zinc co-factor synthesis to avert interveinal chlorosis and stunted tiller counts.`,
        data_considered: {
          planned_date: overdueAct.due_date || overdueAct.planned_date,
          current_date: new Date().toISOString().split('T')[0],
          soil_zinc_ppm: 0.4,
          threshold_ppm: 0.6,
          crop_stage: cropContext?.currentStageName || 'Estimated Active Tillering',
          estimated_cost: overdueAct.cost || 1400
        },
        why_explanation: `North Block (Plot A) soil test confirms severe zinc deficiency (0.4 ppm). Active tillering is the critical physiological window where zinc drives indole-3-acetic acid (IAA) enzyme activation. Delaying past this week causes permanent reduction in productive panicles.`,
        impact_explanation: `Schedule disruption risk is elevated. Potential tillering loss of 15-20% if interveinal chlorosis spreads across the 10.0 acre stand.`,
        recommended_action: `Complete scheduled foliar spray of 0.5% Zinc Sulfate + 0.25% lime today and record actual chemical inputs consumed before closing activity.`,
        status: overdueAct.status === 'COMPLETED' ? 'COMPLETED' : 'NEW',
        canExecute: true
      });
    }

    // 2. Scheduled nitrogen top-dressing
    const nitrogenAct = activities.find(a => (a.title || '').toLowerCase().includes('nitrogen') && a.status !== 'COMPLETED');
    if (nitrogenAct) {
      recs.push({
        id: 'rec-nitrogen-split',
        title: 'Prepare Nitrogen Top-Dressing Split Application',
        priority: 'HIGH',
        category: 'FERTILIZATION',
        crop_name: cropContext?.cropName || 'Paddy',
        field_name: nitrogenAct.field_name || 'North Block (Plot A)',
        crop_stage: cropContext?.currentStageName || 'Active Tillering',
        activity_id: nitrogenAct.id,
        trigger_reason: 'Scheduled nitrogen top-dressing is due tomorrow in the operational crop calendar.',
        agricultural_context: 'Split application of Urea (45 kg/ha) at maximum tillering stage optimizes panicle number per square meter without vegetative lodging.',
        data_considered: {
          planned_date: nitrogenAct.due_date || nitrogenAct.planned_date,
          crop_stage: cropContext?.currentStageName || 'Active Tillering',
          planned_cost: nitrogenAct.cost || 2800
        },
        why_explanation: 'Urea applied in split doses during active tillering prevents volatilization and matches plant nitrogen uptake curves before panicle initiation.',
        impact_explanation: 'Maintains scheduled vegetative tillering density at 24-28 tillers/hill.',
        recommended_action: 'Verify field moisture status (drain standing water before application) and dispatch 45kg/ha urea application.',
        status: 'NEW',
        canExecute: true
      });
    }

    // 3. Cost alert recommendation
    if (costAnalysis && costAnalysis.projectedVariancePct > 5) {
      recs.push({
        id: 'rec-cost-reallocation',
        title: `Reallocate Contingency for Fertilizer Variance (+${costAnalysis.projectedVariancePct}%)`,
        priority: 'MEDIUM',
        category: 'FINANCIAL',
        crop_name: cropContext?.cropName || 'Paddy',
        field_name: 'North Block (Plot A)',
        crop_stage: cropContext?.currentStageName || 'Active Tillering',
        trigger_reason: `Actual fertilizer expenditure of ₹${costAnalysis.totalSpent.toLocaleString('en-IN')} exceeds seasonal benchmark.`,
        agricultural_context: 'Unplanned micronutrient spray has added to the nutrition outlay. Contingency reallocation required to safeguard 58% profit margin.',
        data_considered: {
          spent: costAnalysis.totalSpent,
          budget: costAnalysis.plannedBudget,
          projectedFinal: costAnalysis.projectedFinalCost,
          variancePct: costAnalysis.projectedVariancePct
        },
        why_explanation: 'Fertilizer expenses are tracking above plan due to upfront basal DAP purchases and corrective zinc spray.',
        impact_explanation: `Current spend is ₹${costAnalysis.totalSpent.toLocaleString('en-IN')} against ₹${costAnalysis.plannedBudget.toLocaleString('en-IN')} budget. Projected final cost may touch ₹${costAnalysis.projectedFinalCost.toLocaleString('en-IN')} without contingency adjustment.`,
        recommended_action: 'Reallocate ₹1,400 from weed management contingency to fertilizer ledger in financial settings.',
        status: 'NEW',
        canExecute: false
      });
    }

    // 4. Pest trap inspection
    const pestAct = activities.find(a => (a.title || '').toLowerCase().includes('trap') || (a.title || '').toLowerCase().includes('pest'));
    if (pestAct && pestAct.status !== 'COMPLETED') {
      recs.push({
        id: 'rec-pest-trap-inspection',
        title: 'Check Stem Borer Pheromone Traps',
        priority: 'LOW',
        category: 'PEST_INSPECTION',
        crop_name: cropContext?.cropName || 'Paddy',
        field_name: pestAct.field_name || 'Central Sector (Plot B)',
        crop_stage: 'Sowing & Nursery',
        activity_id: pestAct.id,
        trigger_reason: 'Periodic pheromone trap monitoring due within 3 days.',
        agricultural_context: 'Yellow stem borer adult moth flight monitoring establishes early ETL (economic threshold level) before dead-heart symptoms appear.',
        data_considered: {
          traps_installed: 4,
          field_area: 8.5,
          priority: 'LOW'
        },
        why_explanation: 'Early detection of adult moths prevents unmonitored egg mass laying on leaf tips during nursery transition.',
        impact_explanation: 'Keeps stem borer infestation below 5% ETL threshold without preventative insecticide spray.',
        recommended_action: 'Count and log adult moths in all 4 perimeter traps.',
        status: 'NEW',
        canExecute: true
      });
    }

    return recs;
  }

  window.RecommendationEngine = {
    generateRecommendations
  };
})();
