/**
 * FarmPilot Agricultural Intelligence — Activity Intelligence & Priority Engine
 * Evaluates task priority, operational sequences, dependency conflicts, and stage alignment
 */

(function () {
  function diffInDays(dateA, dateB) {
    const a = new Date(dateA);
    const b = new Date(dateB);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
    return Math.round((a - b) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate Multi-Factor Task Priority Score
   * Formula: Overdue Impact + Stage Relevance + Priority Level + Financial Weight + Dependency Pressure
   */
  function scoreActivity(activity, currentStage, cropBudget = 50000) {
    const today = new Date();
    const dueDate = activity.due_date || activity.planned_date;
    const overdueDays = dueDate ? Math.max(0, diffInDays(today, dueDate)) : 0;

    // 1. Overdue impact (8 pts per day overdue, up to 40 pts)
    const overdueScore = Math.min(40, overdueDays * 8);

    // 2. Base priority weight
    const basePriorityScores = {
      CRITICAL: 40,
      HIGH: 30,
      MEDIUM: 20,
      LOW: 10
    };
    const priorityScore = basePriorityScores[activity.priority] || 20;

    // 3. Stage relevance (Is this activity crucial for current stage?)
    const title = (activity.title || '').toLowerCase();
    const stageName = (currentStage?.currentStageName || '').toLowerCase();
    let stageRelevance = 15;
    if (stageName.includes('tillering') && (title.includes('zinc') || title.includes('nitrogen') || title.includes('urea') || title.includes('top-dress'))) {
      stageRelevance = 30;
    } else if (stageName.includes('panicle') && (title.includes('potash') || title.includes('water'))) {
      stageRelevance = 30;
    } else if (stageName.includes('flowering') && (title.includes('scout') || title.includes('pest') || title.includes('trap'))) {
      stageRelevance = 25;
    }

    // 4. Financial impact weight (Higher cost operations carry financial urgency)
    const cost = parseFloat(activity.cost || activity.estimated_cost) || 0;
    const costRatio = cropBudget > 0 ? (cost / cropBudget) : 0;
    const financialScore = Math.min(15, Math.round(costRatio * 100));

    // 5. Total composite priority score (0-100 scale)
    const compositeScore = Math.min(100, overdueScore + priorityScore + stageRelevance + financialScore);

    return {
      score: compositeScore,
      overdueDays,
      overdueScore,
      priorityScore,
      stageRelevance,
      financialScore
    };
  }

  /**
   * Detect Broken Operational Sequences and Dependency Violations
   * e.g. Fertilization planned without prior irrigation record
   */
  function detectSequenceWarnings(activities, irrigationLogs = []) {
    const warnings = [];
    const pendingFertilizers = activities.filter(a => {
      const t = (a.title || '').toLowerCase();
      const c = (a.category || '').toLowerCase();
      return (t.includes('urea') || t.includes('fertil') || t.includes('top-dress') || c.includes('fertil')) && a.status !== 'COMPLETED';
    });

    const hasRecentIrrigation = irrigationLogs.some(log => {
      const logDate = new Date(log.date);
      const diff = diffInDays(new Date(), logDate);
      return diff >= 0 && diff <= 5;
    });

    if (pendingFertilizers.length > 0 && !hasRecentIrrigation) {
      warnings.push({
        type: 'SEQUENCE_WARNING',
        severity: 'HIGH',
        activityId: pendingFertilizers[0].id,
        title: 'Operational Sequence Warning: Soil Moisture Check Required',
        why: 'Scheduled nitrogen top-dressing application requires adequate soil saturation without standing floodwater. No irrigation record logged in the preceding 5 days.',
        recommendedAction: 'Review field AWD water level tube and record an irrigation check before executing fertilizer dispersal.'
      });
    }

    return warnings;
  }

  /**
   * Rank and structure Today's Farm Action Plan
   */
  function rankTodayActions(activities, currentStage, cropBudget = 50000) {
    const scored = activities
      .filter(a => a.status !== 'COMPLETED')
      .map(act => {
        const scoring = scoreActivity(act, currentStage, cropBudget);
        const overdueDays = scoring.overdueDays;

        let why = '';
        let impact = '';
        let recommendedAction = '';

        if (overdueDays > 0) {
          why = `Activity is overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}. Currently within ${currentStage?.currentStageName || 'Active Tillering'} critical window.`;
          impact = `Elevates schedule disruption risk and impairs tillering synchrony.`;
          recommendedAction = `Execute ${act.title} today and record actual materials and labor consumed.`;
        } else {
          why = `Scheduled in crop calendar for ${act.due_date || act.planned_date || 'this week'}. Direct operational milestone for ${currentStage?.currentStageName || 'current phase'}.`;
          impact = `Preserves agronomic timing and prevents task backlog.`;
          recommendedAction = `Prepare field crew and inputs for scheduled execution.`;
        }

        return {
          id: act.id,
          title: act.title,
          category: act.category,
          field_name: act.field_name || 'North Block (Plot A)',
          priority: act.priority || 'MEDIUM',
          dueDate: act.due_date || act.planned_date,
          status: act.status,
          score: scoring.score,
          overdueDays,
          why,
          impact,
          recommendedAction,
          cost: act.cost || act.estimated_cost || 0,
          assignedTo: act.assigned_to_name || 'Ravi Kumar',
          context: `${currentStage?.cropName || 'Paddy'} • ${currentStage?.currentStageName || 'Active Tillering'} • ${act.field_name || 'Field'}`
        };
      })
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 5);
  }

  window.ActivityIntelligence = {
    scoreActivity,
    detectSequenceWarnings,
    rankTodayActions
  };
})();
