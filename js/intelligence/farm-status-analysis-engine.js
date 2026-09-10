/**
 * FarmPilot Agricultural OS — Farm Status Input & Real-Time Agronomic Analysis Engine
 * Computes end-to-end agronomic status, AWD water balance, phenology, nutrient deficiency,
 * operational risk, workforce requirement, and financial break-even in real time.
 */

(function () {
  function computeAnalysis(input = {}) {
    const fieldId = input.fieldId || 'north-block';
    const fieldName = input.fieldName || 'North Block (Plot A)';
    const crop = input.crop || 'Paddy (BPT-5204 Samba Mahsuri)';
    const areaAcres = parseFloat(input.areaAcres) || 10.0;
    const daysFromSowing = parseInt(input.daysFromSowing, 10) || 38;
    const soilMoisture = parseFloat(input.soilMoisture) || 31; // %
    const waterDepthCm = parseFloat(input.waterDepthCm) || 5.0; // cm (-15 to +10)
    const ureaAppliedKg = parseFloat(input.ureaAppliedKg) || 45; // kg/acre
    const ureaTargetKg = parseFloat(input.ureaTargetKg) || 60; // kg/acre
    const zincStatus = input.zincStatus || 'OVERDUE'; // 'COMPLETED' or 'OVERDUE'
    const pestSymptom = input.pestSymptom || 'NONE'; // 'NONE', 'CHLOROSIS', 'LEAF_FOLDER', 'STEM_BORER'
    const temperature = parseFloat(input.temperature) || 31.5; // °C
    const weatherDesc = input.weatherDesc || 'Overcast • Optimal';
    const windSpeed = parseFloat(input.windSpeed) || 7; // km/h
    const expectedYield = parseFloat(input.expectedYield) || 4.2; // Tonnes/Acre
    const mandiPrice = parseFloat(input.mandiPrice) || 28; // ₹/kg
    const workersCount = parseInt(input.workersCount, 10) || 8;
    const workerWage = parseFloat(input.workerWage) || 250; // ₹/day

    // 1. Phenological Crop Stage Determination
    let stageName = 'Active Tillering';
    let stageCode = 'TILLERING';
    let stageRange = 'Days 21 - 50';
    let stageProgressPct = 45;
    let stageDescription = 'Rapid vegetative growth, tiller multiplication, and crown root development.';
    let criticalNeeds = 'Zinc foliar spray, nitrogen top-dressing, alternate wetting & drying (AWD).';

    if (daysFromSowing <= 20) {
      stageName = 'Nursery & Seedling Establishment';
      stageCode = 'NURSERY';
      stageRange = 'Days 1 - 20';
      stageProgressPct = 15;
      stageDescription = 'Seed germination, nursery bed management, and seedling acclimatization.';
      criticalNeeds = 'Shallow 1-2 cm water standing, phosphorus root establishment.';
    } else if (daysFromSowing <= 50) {
      stageName = 'Active Tillering Phase';
      stageCode = 'TILLERING';
      stageRange = 'Days 21 - 50';
      stageProgressPct = Math.round(((daysFromSowing - 20) / 30) * 100);
      stageDescription = 'Max tiller initiation. Number of panicle-bearing tillers determines potential yield.';
      criticalNeeds = 'Strict AWD cycle, foliar micronutrient correction (Zinc Sulfate), Nitrogen split.';
    } else if (daysFromSowing <= 80) {
      stageName = 'Panicle Initiation & Stem Elongation';
      stageCode = 'PANICLE_INITIATION';
      stageRange = 'Days 51 - 80';
      stageProgressPct = Math.round(((daysFromSowing - 50) / 30) * 100);
      stageDescription = 'Reproductive phase transition, embryonic panicle formation inside the stem.';
      criticalNeeds = 'Continuous 3-5 cm ponding (no water stress tolerated), MOP Potash application.';
    } else if (daysFromSowing <= 110) {
      stageName = 'Flowering & Anthesis Phase';
      stageCode = 'FLOWERING';
      stageRange = 'Days 81 - 110';
      stageProgressPct = Math.round(((daysFromSowing - 80) / 30) * 100);
      stageDescription = 'Pollen shed, fertilization, spikelet opening between 09:00 AM - 11:30 AM.';
      criticalNeeds = 'Avoid any chemical spray during anthesis, maintain steady water cushion.';
    } else if (daysFromSowing <= 130) {
      stageName = 'Grain Filling (Milky to Dough)';
      stageCode = 'GRAIN_FILLING';
      stageRange = 'Days 111 - 130';
      stageProgressPct = Math.round(((daysFromSowing - 110) / 20) * 100);
      stageDescription = 'Starch accumulation in grains, progressive yellowing of foliage.';
      criticalNeeds = 'Intermittent irrigation, stop spraying pesticides, monitor sheath blight.';
    } else {
      stageName = 'Physiological Maturity & Harvest';
      stageCode = 'MATURITY';
      stageRange = 'Days 131 - 140+';
      stageProgressPct = 100;
      stageDescription = '85% panicles turned golden brown, grain moisture dropping to 20-22%.';
      criticalNeeds = 'Complete terminal field drainage 10 days before harvest, schedule combine harvester.';
    }

    // 2. Irrigation & AWD Water Balance Diagnosis
    let waterStatus = 'OPTIMAL';
    let waterBadge = 'Safe AWD Range';
    let waterColor = '#059669';
    let waterRecommendation = '';
    let litersNeeded = 0;
    let irrigationUrgencyHours = 72;

    if (waterDepthCm < -15 || soilMoisture < 24) {
      waterStatus = 'CRITICAL_WATER_STRESS';
      waterBadge = 'Severe Water Stress';
      waterColor = '#DC2626';
      litersNeeded = Math.round(areaAcres * (5.0 - waterDepthCm) * 1000);
      irrigationUrgencyHours = 12;
      waterRecommendation = `CRITICAL DEFICIT: Water table dropped below -15 cm perforated AWD tube threshold and soil moisture is ${soilMoisture}%. Re-flood to +5.0 cm within 12-18 hours (${litersNeeded.toLocaleString('en-IN')} Litres required) to prevent spikelet sterility.`;
    } else if (waterDepthCm < 0 || soilMoisture < 28) {
      waterStatus = 'AWD_REIRRIGATION_DUE';
      waterBadge = 'AWD Re-flood Due';
      waterColor = '#D97706';
      litersNeeded = Math.round(areaAcres * (5.0 - waterDepthCm) * 800);
      irrigationUrgencyHours = 36;
      waterRecommendation = `AWD THRESHOLD REACHED: Field surface is drying naturally for root aeration. Schedule re-irrigation to +5 cm within 36 hours (${litersNeeded.toLocaleString('en-IN')} Litres).`;
    } else if (waterDepthCm > 8.0) {
      waterStatus = 'OVER_FLOODED';
      waterBadge = 'Excess Ponding';
      waterColor = '#2563EB';
      litersNeeded = 0;
      waterRecommendation = `EXCESS WATER DEPTH: Standing water at ${waterDepthCm} cm exceeds optimal 3–5 cm AWD depth. Open field drainage weir to avoid tiller asphyxiation and save pumping energy.`;
    } else {
      waterStatus = 'OPTIMAL';
      waterBadge = 'Safe AWD Depth (3–5 cm)';
      waterColor = '#059669';
      litersNeeded = 0;
      waterRecommendation = `SAFE AWD BALANCE: Water depth is ${waterDepthCm} cm and soil moisture is ${soilMoisture}%. Root zone oxygenation is optimal. Next irrigation scheduled in 48–60 hours.`;
    }

    // 3. Nutrient & Foliar Health Assessment
    let nutrientStatus = 'OPTIMAL';
    let nutrientNotes = [];
    let sprayWindowSafe = windSpeed <= 12 && !weatherDesc.toLowerCase().includes('heavy rain');

    const ureaVariancePct = Math.round(((ureaAppliedKg - ureaTargetKg) / ureaTargetKg) * 100);
    if (ureaVariancePct < -20) {
      nutrientStatus = 'NITROGEN_DEFICIT';
      nutrientNotes.push(`Nitrogen deficit: Applied ${ureaAppliedKg} kg/Ac vs ${ureaTargetKg} kg target (${ureaVariancePct}% variance). Tillering vigour will be compromised.`);
    } else if (ureaVariancePct > 20) {
      nutrientStatus = 'NITROGEN_EXCESS';
      nutrientNotes.push(`Nitrogen excess: Applied ${ureaAppliedKg} kg/Ac (+${ureaVariancePct}% over target). High risk of succulent lodging and brown planthopper attraction.`);
    } else {
      nutrientNotes.push(`Nitrogen top-dressing is on schedule (${ureaAppliedKg} kg/Ac applied).`);
    }

    if (zincStatus === 'OVERDUE' || pestSymptom === 'CHLOROSIS') {
      nutrientNotes.push(`ZINC DEFICIENCY ALERT: Zinc Sulfate 21% foliar spray is OVERDUE. Risk of Khaira disease interveinal chlorosis.`);
    } else {
      nutrientNotes.push(`Zinc micronutrient balance is satisfied.`);
    }

    if (!sprayWindowSafe) {
      nutrientNotes.push(`⚠️ SPRAY SAFETY WARNING: Wind speed ${windSpeed} km/h exceeds 12 km/h safety threshold. Foliar spray droplets will drift. Defer spraying until evening.`);
    } else {
      nutrientNotes.push(`✓ Spray weather window is OPTIMAL (Wind: ${windSpeed} km/h, Temp: ${temperature}°C).`);
    }

    // 4. Financial Economics & Break-Even Shield
    const baselineCostPerAcre = 4200; // seeds, land prep, nursery
    const fertilizerCost = areaAcres * (ureaAppliedKg * 28 + (zincStatus === 'COMPLETED' ? 850 : 0));
    const dailyWageTotal = workersCount * workerWage;
    const estimatedTotalCultivationCost = Math.round(
      (areaAcres * baselineCostPerAcre) + fertilizerCost + (dailyWageTotal * 12) + (areaAcres * 1200)
    );

    const projectedGrossRevenue = Math.round(areaAcres * expectedYield * mandiPrice * 1000);
    const netProfit = Math.round(projectedGrossRevenue - estimatedTotalCultivationCost);
    const profitMarginPct = projectedGrossRevenue > 0 ? ((netProfit / projectedGrossRevenue) * 100).toFixed(1) : 0;
    const breakEvenYieldPerAcre = (estimatedTotalCultivationCost / (mandiPrice * 1000 * areaAcres)).toFixed(2);
    const profitSafetyBuffer = (expectedYield - parseFloat(breakEvenYieldPerAcre)).toFixed(2);

    // 5. Composite Farm Health Score (100-Point Scale)
    let healthScore = 100;
    let limitingFactors = [];

    // Water penalty
    if (waterStatus === 'CRITICAL_WATER_STRESS') {
      healthScore -= 28;
      limitingFactors.push('Critical soil moisture deficit below AWD survival threshold');
    } else if (waterStatus === 'AWD_REIRRIGATION_DUE') {
      healthScore -= 8;
      limitingFactors.push('AWD re-flooding cycle due in next 36h');
    } else if (waterStatus === 'OVER_FLOODED') {
      healthScore -= 6;
      limitingFactors.push('Over-flooded field parcel exceeds 5 cm canopy respiration zone');
    }

    // Nutrient penalty
    if (zincStatus === 'OVERDUE') {
      healthScore -= 12;
      limitingFactors.push('Overdue Zinc Sulfate foliar spray in active tillering phase');
    }
    if (ureaVariancePct < -20) {
      healthScore -= 10;
      limitingFactors.push('Sub-optimal nitrogen dosage');
    }

    // Pest symptom penalty
    if (pestSymptom === 'CHLOROSIS') {
      healthScore -= 15;
      limitingFactors.push('Visual interveinal chlorosis (Khaira disease pattern)');
    } else if (pestSymptom === 'LEAF_FOLDER') {
      healthScore -= 14;
      limitingFactors.push('Leaf folder caterpillar webbing detected on vegetative tillers');
    } else if (pestSymptom === 'STEM_BORER') {
      healthScore -= 18;
      limitingFactors.push('Dead heart symptom caused by yellow stem borer larvae');
    }

    // Cost variance penalty
    if (ureaVariancePct > 25) {
      healthScore -= 6;
      limitingFactors.push('Fertilizer expenditure budget overrun');
    }

    healthScore = Math.max(25, Math.min(100, healthScore));

    let healthStatus = 'Optimal Condition';
    let healthBadgeClass = 'badge-success';
    if (healthScore < 60) {
      healthStatus = 'Critical Attention Required';
      healthBadgeClass = 'badge-danger';
    } else if (healthScore < 85) {
      healthStatus = 'Attention Required';
      healthBadgeClass = 'badge-warning';
    }

    // 6. Actionable Prescriptions (Top 3 Ranked)
    const priorityActions = [];
    if (waterStatus === 'CRITICAL_WATER_STRESS' || waterStatus === 'AWD_REIRRIGATION_DUE') {
      priorityActions.push({
        id: 'act-irrig',
        title: `Deliver ${litersNeeded.toLocaleString('en-IN')} L AWD Irrigation to +5.0 cm`,
        field: fieldName,
        urgency: waterStatus === 'CRITICAL_WATER_STRESS' ? 'CRITICAL (Next 12h)' : 'HIGH (Next 36h)',
        why: waterRecommendation,
        actionBtn: 'Schedule Water Pumping'
      });
    }

    if (zincStatus === 'OVERDUE' || pestSymptom === 'CHLOROSIS') {
      priorityActions.push({
        id: 'act-zinc',
        title: 'Apply Zinc Sulfate 21% Foliar Spray (5 g/L)',
        field: fieldName,
        urgency: 'HIGH',
        why: 'Correct micronutrient deficiency during tillering before leaf surface chlorosis hardens into permanent biomass penalty.',
        actionBtn: 'Dispatch Spray Team'
      });
    }

    if (pestSymptom === 'LEAF_FOLDER' || pestSymptom === 'STEM_BORER') {
      priorityActions.push({
        id: 'act-pest',
        title: `Bio-Pesticide Foliar Application (${pestSymptom === 'STEM_BORER' ? 'Cartap Hydrochloride 50 SP' : 'Chlorantraniliprole 18.5 SC'})`,
        field: fieldName,
        urgency: 'CRITICAL',
        why: `Target larvae within early instar phase before boring into tiller nodes.`,
        actionBtn: 'Issue Agrochemical Order'
      });
    }

    priorityActions.push({
      id: 'act-labour',
      title: `Mobilize Morning Labour Shift (${workersCount} Workers Assigned)`,
      field: fieldName,
      urgency: 'NORMAL',
      why: `Shift tasks: Weeding, bund reinforcement, and AWD canal gate inspection. Outlay: ₹${dailyWageTotal.toLocaleString('en-IN')}.`,
      actionBtn: 'Confirm Shift Roster'
    });

    return {
      inputs: { ...input, fieldName, crop, areaAcres, daysFromSowing, soilMoisture, waterDepthCm, expectedYield, mandiPrice },
      stage: {
        name: stageName,
        code: stageCode,
        range: stageRange,
        progressPct: stageProgressPct,
        description: stageDescription,
        criticalNeeds
      },
      irrigation: {
        status: waterStatus,
        badge: waterBadge,
        color: waterColor,
        recommendation: waterRecommendation,
        litersNeeded,
        urgencyHours: irrigationUrgencyHours
      },
      nutrient: {
        status: nutrientStatus,
        ureaVariancePct,
        zincStatus,
        pestSymptom,
        sprayWindowSafe,
        notes: nutrientNotes
      },
      economics: {
        totalRevenue: projectedGrossRevenue,
        totalOperatingCost: estimatedTotalCultivationCost,
        netProfit,
        profitMarginPct,
        breakEvenYield: breakEvenYieldPerAcre,
        safetyBuffer: profitSafetyBuffer,
        currencySymbol: '₹'
      },
      health: {
        score: healthScore,
        status: healthStatus,
        badgeClass: healthBadgeClass,
        limitingFactors
      },
      priorityActions: priorityActions.slice(0, 3),
      timestamp: new Date().toISOString()
    };
  }

  window.FarmStatusAnalysisEngine = {
    computeAnalysis
  };
})();
