/**
 * FarmPilot Agricultural Intelligence — Profitability Scenario Engine
 * Computes break-even yield, margin of safety, sensitivity matrices, and what-if simulations
 */

(function () {
  /**
   * Evaluate Multi-Scenario Profitability (Conservative, Expected, Optimistic)
   */
  function evaluateProfitability(cropCycle, projectedCost = 50000) {
    const targetYield = parseFloat(cropCycle?.target_yield) || 4.2; // in tonnes
    const sellingPricePerTonne = parseFloat(cropCycle?.selling_price_per_unit) || 29000; // ₹/Tonne (MSP or Mandi)
    const cost = Math.max(1000, projectedCost);

    // Break-even yield: Total Cost / Selling Price
    const breakEvenYield = cost / sellingPricePerTonne;
    const safetyBufferYield = targetYield - breakEvenYield;
    const safetyBufferRevenue = (targetYield * sellingPricePerTonne) - cost;

    // 3 Configurable Agronomic Scenarios
    const scenarios = {
      conservative: {
        label: 'Conservative Scenario',
        yield: parseFloat((targetYield * 0.85).toFixed(2)),
        pricePerKg: Math.round((sellingPricePerTonne * 0.9) / 1000),
        pricePerTonne: Math.round(sellingPricePerTonne * 0.9),
        assumptions: 'Adverse weather event or -10% Mandi price contraction'
      },
      expected: {
        label: 'Expected Plan',
        yield: parseFloat(targetYield.toFixed(2)),
        pricePerKg: Math.round(sellingPricePerTonne / 1000),
        pricePerTonne: sellingPricePerTonne,
        assumptions: 'Scheduled agronomic operations executed with normal monsoon'
      },
      optimistic: {
        label: 'Optimistic Scenario',
        yield: parseFloat((targetYield * 1.12).toFixed(2)),
        pricePerKg: Math.round((sellingPricePerTonne * 1.08) / 1000),
        pricePerTonne: Math.round(sellingPricePerTonne * 1.08),
        assumptions: 'Optimal AWD tillering density and festive premium Mandi rate'
      }
    };

    Object.keys(scenarios).forEach(key => {
      const s = scenarios[key];
      const revenue = Math.round(s.yield * s.pricePerTonne);
      const profit = revenue - cost;
      const margin = revenue > 0 ? parseFloat(((profit / revenue) * 100).toFixed(1)) : 0;
      s.revenue = revenue;
      s.cost = cost;
      s.profit = profit;
      s.margin = margin;
    });

    // Price Sensitivity Analysis (Price variance from ₹22/kg to ₹32/kg at target yield)
    const pricePoints = [22, 24, 26, 28, 30, 32];
    const priceSensitivity = pricePoints.map(p => {
      const pTonne = p * 1000;
      const revenue = Math.round(targetYield * pTonne);
      const profit = revenue - cost;
      const margin = revenue > 0 ? parseFloat(((profit / revenue) * 100).toFixed(1)) : 0;
      return {
        pricePerKg: p,
        pricePerTonne: pTonne,
        revenue,
        profit,
        margin
      };
    });

    // Yield Sensitivity Analysis (Yield variance from 3.0T to 5.0T at expected price)
    const yieldPoints = [3.0, 3.5, 4.0, 4.2, 4.5, 5.0];
    const yieldSensitivity = yieldPoints.map(y => {
      const revenue = Math.round(y * sellingPricePerTonne);
      const profit = revenue - cost;
      const margin = revenue > 0 ? parseFloat(((profit / revenue) * 100).toFixed(1)) : 0;
      return {
        yield: y,
        revenue,
        profit,
        margin,
        isTarget: Math.abs(y - targetYield) < 0.1
      };
    });

    return {
      targetYield,
      sellingPricePerTonne,
      sellingPricePerKg: Math.round(sellingPricePerTonne / 1000),
      projectedCost: cost,
      breakEvenYield: parseFloat(breakEvenYield.toFixed(2)),
      safetyBufferYield: parseFloat(safetyBufferYield.toFixed(2)),
      safetyBufferRevenue,
      scenarios,
      priceSensitivity,
      yieldSensitivity,
      trustLabel: 'Scenario Assumptions — Subject to realized harvest and market price'
    };
  }

  /**
   * Real-Time Interactive What-If Simulator
   * Called on slider adjust (Yield, Price, Remaining Cost)
   */
  function simulateWhatIf(targetYield, pricePerKg, totalCost) {
    const yieldTonnes = parseFloat(targetYield) || 4.2;
    const priceKg = parseFloat(pricePerKg) || 29;
    const priceTonne = priceKg * 1000;
    const cost = Math.max(100, parseFloat(totalCost) || 50000);

    const revenue = Math.round(yieldTonnes * priceTonne);
    const profit = revenue - cost;
    const margin = revenue > 0 ? parseFloat(((profit / revenue) * 100).toFixed(1)) : 0;
    const breakEvenYield = parseFloat((cost / priceTonne).toFixed(2));
    const safetyBuffer = profit;

    // Horizontal Scale indicator percentage (0% = Loss, 50% = Break-even, 100% = High Profit)
    // Loss threshold at -₹20k, Target profit at +₹100k
    let scalePercent = Math.round(((profit + 20000) / 120000) * 100);
    scalePercent = Math.min(100, Math.max(0, scalePercent));

    return {
      yieldTonnes,
      pricePerKg: priceKg,
      pricePerTonne: priceTonne,
      cost,
      revenue,
      profit,
      margin,
      breakEvenYield,
      safetyBuffer,
      scalePercent
    };
  }

  window.ProfitabilityEngine = {
    evaluateProfitability,
    simulateWhatIf
  };
})();
