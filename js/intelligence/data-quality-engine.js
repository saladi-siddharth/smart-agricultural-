/**
 * FarmPilot Agricultural Intelligence — Data Quality & Completeness Engine
 * Audits farm dossier completeness, missing agricultural logs, and confidence levels
 */

(function () {
  const REQUIRED_RECORDS = [
    { id: 'farm_field', label: 'Farm & Field Soil Profile', weight: 15, page: 'farms.html', actionText: 'Verify Field Area & Soil pH' },
    { id: 'crop_cycle', label: 'Crop Cycle & Expected Harvest', weight: 20, page: 'crops.html', actionText: 'Configure Harvest Target' },
    { id: 'field_ops', label: 'Field Operations & Tasks', weight: 20, page: 'activities.html', actionText: 'Log Field Activity' },
    { id: 'inputs', label: 'Input Application Records', weight: 15, page: 'inputs.html', actionText: 'Record Input Batch' },
    { id: 'expenses', label: 'Actual Cultivation Expenses', weight: 15, page: 'expenses.html', actionText: 'Add Expense Voucher' },
    { id: 'irrigation', label: 'AWD Irrigation Log', weight: 15, page: 'activities.html#irrigation', actionText: 'Log AWD Sluice Event' }
  ];

  function evaluateDataQuality(data = {}) {
    const {
      farm = null,
      field = null,
      cropCycle = null,
      activities = [],
      inputs = [],
      expenses = [],
      irrigationLogs = []
    } = data;

    const auditItems = [
      {
        ...REQUIRED_RECORDS[0],
        present: !!(farm && field && field.area > 0),
        detail: field ? `${field.name} (${field.area} ${field.area_unit || 'acres'})` : 'No field profile'
      },
      {
        ...REQUIRED_RECORDS[1],
        present: !!(cropCycle && cropCycle.target_yield > 0 && cropCycle.expected_harvest_date),
        detail: cropCycle ? `${cropCycle.crop_name} (${cropCycle.target_yield} Tonnes target)` : 'Missing crop target'
      },
      {
        ...REQUIRED_RECORDS[2],
        present: activities.length > 0,
        detail: `${activities.length} operations logged`
      },
      {
        ...REQUIRED_RECORDS[3],
        present: inputs.length > 0,
        detail: `${inputs.length} input batches recorded`
      },
      {
        ...REQUIRED_RECORDS[4],
        present: expenses.length > 0,
        detail: `${expenses.length} financial vouchers recorded`
      },
      {
        ...REQUIRED_RECORDS[5],
        present: irrigationLogs.length > 0,
        detail: `${irrigationLogs.length} AWD logs on record`
      }
    ];

    let totalScore = 0;
    const missing = [];

    auditItems.forEach(item => {
      if (item.present) {
        totalScore += item.weight;
      } else {
        missing.push(item);
      }
    });

    // Determine overall confidence category
    let confidenceLevel = 'HIGH';
    let confidenceExplanation = 'All primary agronomic records are logged with high veracity.';
    if (totalScore < 70) {
      confidenceLevel = 'LIMITED';
      confidenceExplanation = 'Multiple primary field records are absent. Recommendations carry lower confidence.';
    } else if (totalScore < 90) {
      confidenceLevel = 'MODERATE';
      confidenceExplanation = 'Core operational records logged; minor supplemental vouchers pending.';
    }

    const summary = missing.length > 0
      ? `${missing.length} record${missing.length === 1 ? '' : 's'} require attention to ensure high-confidence intelligence.`
      : 'All operational records complete and verified.';

    return {
      score: totalScore,
      confidenceLevel,
      confidenceExplanation,
      auditItems,
      missing,
      summary,
      trustModel: {
        recorded: ['Activities Completed', 'Expense Vouchers', 'Input Usage', 'Irrigation Logs'],
        calculated: ['Cost of Cultivation', 'Cost per Acre', 'Budget Variance', 'Farm Health Score'],
        estimated: ['Operational Crop Stage', 'Harvest Readiness Percentage', 'Projected Final Cost'],
        scenario: ['Break-Even Yield', 'Mandi Price Sensitivity', 'Profit Margin Scenarios'],
        external: ['Regional Agro-Meteorological Weather Feed']
      }
    };
  }

  window.DataQualityEngine = {
    evaluateDataQuality,
    REQUIRED_RECORDS
  };
})();
