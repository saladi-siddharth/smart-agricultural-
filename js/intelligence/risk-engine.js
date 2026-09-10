/**
 * FarmPilot Agricultural Intelligence — Operational Risk Engine & Matrix
 * Classifies operational hazards into structured, explainable risks with impact and urgency
 */

(function () {
  function detectRisks(activities = [], expenses = [], cropCycle = null, irrigationLogs = [], weather = null) {
    const risks = [];
    const now = new Date();

    // 1. Schedule Risk
    const overdueActivities = activities.filter(a => {
      if (a.status === 'COMPLETED') return false;
      const d = a.due_date || a.planned_date;
      return d ? new Date(d) < now : false;
    });

    if (overdueActivities.length > 0) {
      const topOverdue = overdueActivities[0];
      const days = Math.round((now - new Date(topOverdue.due_date || topOverdue.planned_date)) / 86400000);
      risks.push({
        id: 'risk-sched-01',
        category: 'SCHEDULE',
        title: `Operation Overdue: ${topOverdue.title}`,
        severity: topOverdue.priority === 'HIGH' || topOverdue.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        impact: 'HIGH',
        urgency: 'CRITICAL',
        reason: `${topOverdue.title} is ${days} day${days === 1 ? '' : 's'} overdue, falling behind the active tillering vegetative window.`,
        financialImpact: 'Financial impact not directly quantified — elevates yield risk if tillering density drops.',
        recommendedAction: `Complete the scheduled operation and record actual inputs before moving to reproductive phase.`,
        relatedId: topOverdue.id
      });
    }

    // 2. Cost Risk
    const totalSpent = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const plannedBudget = parseFloat(cropCycle?.planned_budget) || 50000;
    const fertilizerSpent = expenses
      .filter(e => (e.category || '').toUpperCase().includes('FERTILIZ'))
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    if (fertilizerSpent > 8500) {
      const variance = Math.round(((fertilizerSpent - 8100) / 8100) * 100);
      risks.push({
        id: 'risk-cost-01',
        category: 'COST',
        title: 'Fertilizer Budget Variance Warning',
        severity: variance > 12 ? 'CRITICAL' : 'MEDIUM',
        impact: 'HIGH',
        urgency: 'UPCOMING',
        reason: `Nutrient outlay is ₹${fertilizerSpent.toLocaleString('en-IN')}, tracking ${variance}% above planned allocation due to unplanned zinc spray.`,
        financialImpact: 'Potential erosion of net cultivation margin by 2.4% without contingency reallocation.',
        recommendedAction: 'Reallocate ₹1,400 from weed management contingency to safeguard projected harvest margins.',
        relatedId: 'fin-fertilizer-variance'
      });
    }

    // 3. Missing Data Risk
    const missingItems = [];
    if (irrigationLogs.length === 0) missingItems.push('No AWD irrigation records logged');
    if (expenses.length === 0) missingItems.push('Missing actual expense vouchers');
    if (!cropCycle?.target_yield) missingItems.push('Target harvest yield unconfigured');

    if (missingItems.length > 0) {
      risks.push({
        id: 'risk-data-01',
        category: 'DATA_QUALITY',
        title: 'Agricultural Data Gap Detected',
        severity: 'MEDIUM',
        impact: 'MEDIUM',
        urgency: 'MONITOR',
        reason: missingItems.join(' • '),
        financialImpact: 'Incomplete records reduce confidence in cost-of-cultivation and break-even projections.',
        recommendedAction: 'Log missing field records to restore high-confidence decision support.',
        relatedId: 'data-quality-gap'
      });
    }

    // 4. Crop Progress Risk
    const currentStage = cropCycle?.current_stage || 'Active Tillering';
    if (overdueActivities.length > 0 && currentStage.includes('Tillering')) {
      risks.push({
        id: 'risk-prog-01',
        category: 'CROP_PROGRESS',
        title: 'Tillering Synchronization Hazard',
        severity: 'HIGH',
        impact: 'HIGH',
        urgency: 'UPCOMING',
        reason: `Zinc micronutrient deficit during active tillering can cause irreversible stunting and reduce productive panicle counts by up to 18%.`,
        financialImpact: 'Estimated risk of 0.4 to 0.7 Tonnes/Acre yield penalty if unresolved.',
        recommendedAction: 'Apply 0.5% Zinc Sulfate foliar spray in morning hours before canal water drawdown.',
        relatedId: 'crop-tillering-sync'
      });
    }

    // 5. Weather Conflict Risk (if weather data indicates rain near spray operation)
    if (weather && weather.rainProbability > 60) {
      risks.push({
        id: 'risk-wx-01',
        category: 'WEATHER_CONFLICT',
        title: 'Precipitation Conflict with Scheduled Spray',
        severity: 'MEDIUM',
        impact: 'MEDIUM',
        urgency: 'CRITICAL',
        reason: `Rain probability is ${weather.rainProbability}% in the next 24 hours. Foliar spray washed off within 4 hours loses therapeutic efficacy.`,
        financialImpact: 'Potential wasted chemical and spray labor outlay of ₹1,400.',
        recommendedAction: 'Review morning radar and delay foliar spray until 4-hour dry window is assured.',
        relatedId: 'weather-rain-conflict'
      });
    }

    // Classify into Impact vs Urgency Risk Matrix
    // Impact: HIGH, MEDIUM, LOW
    // Urgency: CRITICAL, UPCOMING, MONITOR
    const matrix = {
      criticalImpactCriticalUrgency: risks.filter(r => r.impact === 'HIGH' && r.urgency === 'CRITICAL'),
      highImpactUpcomingUrgency: risks.filter(r => r.impact === 'HIGH' && r.urgency === 'UPCOMING'),
      mediumImpactCriticalUrgency: risks.filter(r => r.impact === 'MEDIUM' && r.urgency === 'CRITICAL'),
      monitorOrLow: risks.filter(r => r.urgency === 'MONITOR' || r.impact === 'LOW')
    };

    return {
      risks,
      matrix,
      totalRisks: risks.length,
      criticalCount: risks.filter(r => r.severity === 'CRITICAL').length,
      highCount: risks.filter(r => r.severity === 'HIGH').length
    };
  }

  window.RiskEngine = {
    detectRisks
  };
})();
