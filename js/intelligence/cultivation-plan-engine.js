/**
 * FarmPilot Agricultural Intelligence — Cultivation Plan Builder
 * Generates structured, editable operational crop plans from agricultural templates
 */

(function () {
  function generateDraftPlan(cropTemplate, startDateStr, fieldArea = 10.0) {
    const startDate = new Date(startDateStr || new Date());
    const stages = cropTemplate?.stages || [];
    const generatedActivities = [];

    stages.forEach((stage) => {
      const stageStart = new Date(startDate);
      stageStart.setDate(stageStart.getDate() + (stage.start_day - 1));

      const stageEnd = new Date(startDate);
      stageEnd.setDate(stageEnd.getDate() + (stage.end_day - 1));

      // Key operation for this stage
      let category = 'OTHER';
      const nameLower = (stage.name || '').toLowerCase();
      const opLower = (stage.key_op || '').toLowerCase();

      if (nameLower.includes('prep') || opLower.includes('puddl') || opLower.includes('plough')) category = 'LAND_PREPARATION';
      else if (nameLower.includes('nursery') || nameLower.includes('sow') || nameLower.includes('transplant')) category = 'SOWING';
      else if (opLower.includes('fertil') || opLower.includes('urea') || opLower.includes('spray') || opLower.includes('zinc')) category = 'FERTILIZATION';
      else if (opLower.includes('scout') || opLower.includes('trap') || opLower.includes('pest')) category = 'PEST_INSPECTION';
      else if (opLower.includes('water') || opLower.includes('awd') || opLower.includes('irrig')) category = 'IRRIGATION';
      else if (nameLower.includes('harvest')) category = 'HARVEST';

      // Estimated cost calculation per operation based on benchmark
      const estCost = Math.round((cropTemplate.benchmark_cost_per_acre || 5000) * (fieldArea / 10) * 0.15);

      generatedActivities.push({
        id: 'plan-act-' + stage.order,
        stage_order: stage.order,
        stage_name: stage.name,
        title: stage.key_op || `${stage.name} Field Operation`,
        category,
        planned_date: stageStart.toISOString().split('T')[0],
        window_end_date: stageEnd.toISOString().split('T')[0],
        priority: stage.order <= 4 ? 'HIGH' : 'MEDIUM',
        estimated_cost: estCost,
        status: 'PLANNED',
        risk: stage.risk || 'Monitor moisture and timing window closely',
        notes: `Operational milestone during ${stage.name} (Days ${stage.start_day}-${stage.end_day}).`
      });
    });

    return {
      templateId: cropTemplate?.id || 'tmpl-paddy',
      cropName: cropTemplate?.crop_name || 'Paddy (Rice)',
      variety: cropTemplate?.variety || 'BPT-5204',
      season: cropTemplate?.season || 'Kharif',
      totalDays: cropTemplate?.typical_duration_days || 140,
      fieldArea,
      totalEstimatedCost: generatedActivities.reduce((sum, a) => sum + a.estimated_cost, 0),
      activities: generatedActivities
    };
  }

  window.CultivationPlanEngine = {
    generateDraftPlan
  };
})();
