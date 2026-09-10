/**
 * FarmPilot Precision Agronomy — Soil Health & Nutrient Intelligence Engine
 * Grounded in ICAR (Indian Council of Agricultural Research) soil test rating standards
 * Provides deterministic nutrient index, deficiency detection, fertilizer prescriptions,
 * soil amendment calculation (gypsum/lime/FYM), and hydrology retention curves.
 */

(function () {
  const SOIL_STANDARDS = Object.freeze({
    MACRO: {
      NITROGEN: { low: 280, medium: 560, unit: 'kg/ha' }, // Available N
      PHOSPHORUS: { low: 11, medium: 22, unit: 'kg/ha' }, // Available P2O5 (Olsen)
      POTASSIUM: { low: 120, medium: 280, unit: 'kg/ha' }  // Available K2O
    },
    MICRO: {
      ZINC: { critical: 0.60, optimal: 1.20, unit: 'ppm (DTPA)' }, // Critical for rice Khaira
      IRON: { critical: 4.50, optimal: 9.00, unit: 'ppm (DTPA)' },
      BORON: { critical: 0.50, optimal: 1.00, unit: 'ppm' },
      MANGANESE: { critical: 2.00, optimal: 5.00, unit: 'ppm' },
      COPPER: { critical: 0.20, optimal: 0.50, unit: 'ppm' },
      SULPHUR: { critical: 10.00, optimal: 20.00, unit: 'ppm' }
    },
    PHYSICAL: {
      PH: { acidic: 6.0, optimalMin: 6.5, optimalMax: 7.5, alkaline: 8.2 },
      EC: { normalMax: 1.0, criticalSaline: 2.0, unit: 'dS/m' },
      ORGANIC_CARBON: { low: 0.50, medium: 0.75, unit: '%' }
    }
  });

  const FarmPilotSoilEngine = {
    STANDARDS: SOIL_STANDARDS,

    /**
     * Compute comprehensive 0-100 Soil Health Index & Multi-Factor Diagnostic
     */
    evaluateSoilHealth(params = {}) {
      const p = {
        ph: parseFloat(params.ph) || 6.8,
        ec: parseFloat(params.ec_ds_m || params.ec) || 0.45,
        oc: parseFloat(params.organic_carbon_pct || params.oc) || 0.58,
        n: parseFloat(params.nitrogen_kg_ha || params.n) || 265,
        p: parseFloat(params.phosphorus_kg_ha || params.p) || 18.5,
        k: parseFloat(params.potassium_kg_ha || params.k) || 310,
        zn: parseFloat(params.zinc_ppm || params.zn) || 0.42,
        fe: parseFloat(params.iron_ppm || params.fe) || 5.8,
        moisture: parseFloat(params.current_moisture_pct || params.moisture) || 31,
        texture: params.soil_texture || 'Clay Loam'
      };

      const deficiencies = [];
      const strengths = [];

      // 1. Organic Carbon & Biological Pillar (25 pts max)
      let ocScore = 0;
      if (p.oc >= SOIL_STANDARDS.PHYSICAL.ORGANIC_CARBON.medium) {
        ocScore = 25;
        strengths.push(`Rich Organic Carbon (${p.oc.toFixed(2)}%) supporting robust microbial biomes`);
      } else if (p.oc >= SOIL_STANDARDS.PHYSICAL.ORGANIC_CARBON.low) {
        ocScore = 18;
      } else {
        ocScore = 10;
        deficiencies.push(`Low Organic Matter (${p.oc.toFixed(2)}% < 0.50% threshold)`);
      }

      // 2. Macronutrient NPK Balance Pillar (35 pts max)
      let nScore = p.n >= 280 ? 12 : p.n >= 200 ? 8 : 4;
      if (p.n < 280) deficiencies.push(`Nitrogen Deficit (${p.n} kg/ha vs 280 benchmark)`);

      let pScore = p.p >= 22 ? 12 : p.p >= 11 ? 9 : 4;
      if (p.p < 11) deficiencies.push(`Available Phosphorus Deficiency (${p.p} kg/ha)`);

      let kScore = p.k >= 280 ? 11 : p.k >= 120 ? 8 : 4;
      if (p.k >= 280) strengths.push(`Optimal Potassium Reserve (${p.k} kg/ha) enhancing stem strength`);

      const npkScore = nScore + pScore + kScore;

      // 3. Micronutrient Security Pillar (20 pts max)
      let microScore = 20;
      if (p.zn < SOIL_STANDARDS.MICRO.ZINC.critical) {
        microScore -= 12;
        deficiencies.push(`CRITICAL ZINC DEFICIENCY (${p.zn} ppm < 0.60 ppm threshold) — Elevated Rice Khaira Risk`);
      } else if (p.zn < 1.0) {
        microScore -= 4;
      }

      if (p.fe < SOIL_STANDARDS.MICRO.IRON.critical) {
        microScore -= 5;
        deficiencies.push(`Iron Chlorosis Risk (${p.fe} ppm < 4.5 ppm)`);
      }

      // 4. Physical & Chemical Reaction Pillar (pH, EC, Moisture) (20 pts max)
      let chemScore = 20;
      if (p.ph < 6.0) {
        chemScore -= 8;
        deficiencies.push(`Acidic Soil Reaction (pH ${p.ph} — Fixation of Phosphates)`);
      } else if (p.ph > 8.2) {
        chemScore -= 8;
        deficiencies.push(`Alkaline / Calcareous Soil (pH ${p.ph} — Micronutrient Immobilization)`);
      } else {
        strengths.push(`Near-Neutral pH (${p.ph}) with optimum nutrient bio-availability`);
      }

      if (p.ec > 1.2) {
        chemScore -= 6;
        deficiencies.push(`Elevated Salinity / EC (${p.ec} dS/m)`);
      }

      const totalScore = Math.min(100, Math.max(25, Math.round(ocScore + npkScore + microScore + chemScore)));

      let rating = 'MEDIUM';
      let ratingBadge = 'badge-warning';
      if (totalScore >= 85) { rating = 'EXCELLENT'; ratingBadge = 'badge-success'; }
      else if (totalScore >= 70) { rating = 'HIGH'; ratingBadge = 'badge-primary'; }
      else if (totalScore >= 55) { rating = 'MEDIUM'; ratingBadge = 'badge-warning'; }
      else { rating = 'LOW'; ratingBadge = 'badge-danger'; }

      return {
        score: totalScore,
        rating,
        ratingBadge,
        breakdown: {
          organicCarbon: { score: ocScore, max: 25 },
          macronutrients: { score: npkScore, max: 35 },
          micronutrients: { score: microScore, max: 20 },
          physicoChemical: { score: chemScore, max: 20 }
        },
        deficiencies,
        strengths,
        waterRetention: this.computeWaterRetention(p.texture, p.moisture)
      };
    },

    /**
     * Compute soil hydrology, field capacity, wilting point, and PAW
     */
    computeWaterRetention(texture = 'Clay Loam', moisturePct = 31) {
      const tables = {
        'Clay': { fc: 40.0, pwp: 20.0, infiltration: 5.0 },
        'Clay Loam': { fc: 36.0, pwp: 16.0, infiltration: 8.5 },
        'Sandy Loam': { fc: 22.0, pwp: 8.0, infiltration: 25.0 },
        'Silt Loam': { fc: 32.0, pwp: 12.0, infiltration: 15.0 },
        'Black Delta Silt': { fc: 38.0, pwp: 18.0, infiltration: 6.0 }
      };

      const spec = tables[texture] || tables['Clay Loam'];
      const pawTotal = spec.fc - spec.pwp;
      const currentPaw = Math.max(0, moisturePct - spec.pwp);
      const pawPct = pawTotal > 0 ? Math.round((currentPaw / pawTotal) * 100) : 50;

      let moistureStatus = 'OPTIMAL';
      let statusColor = '#059669';
      if (moisturePct < spec.pwp + 4) {
        moistureStatus = 'CRITICAL_WATER_STRESS';
        statusColor = '#DC2626';
      } else if (moisturePct > spec.fc + 2) {
        moistureStatus = 'SURFACE_SUBMERSION';
        statusColor = '#2563EB';
      }

      return {
        texture,
        fieldCapacityPct: spec.fc,
        permanentWiltingPointPct: spec.pwp,
        plantAvailableWaterPct: Math.min(100, pawPct),
        infiltrationRateMmHr: spec.infiltration,
        currentMoisturePct: moisturePct,
        moistureStatus,
        statusColor
      };
    },

    /**
     * Generate ICAR-calibrated fertilizer recommendations based on soil test
     */
    calculateFertilizerPrescription(crop = 'Paddy', areaAcres = 10, soil = {}) {
      const nDeficit = Math.max(0, 280 - (soil.n || 265));
      const pDeficit = Math.max(0, 22 - (soil.p || 18.5));
      const isZincDeficient = (soil.zn || 0.42) < 0.60;

      // Base Kharif Paddy requirement: 120 N : 60 P2O5 : 40 K2O (kg/ha)
      // Converted to per-acre commercial fertilizers:
      const ureaKgAc = Math.round(50 + (nDeficit * 0.15));
      const sspKgAc = Math.round(65 + (pDeficit * 1.5));
      const mopKgAc = 35; // Potash reserve maintenance
      const zincSulfateKgAc = isZincDeficient ? 10 : 0;

      return {
        crop,
        areaAcres,
        totalBags: {
          urea_45kg_bags: Math.ceil((ureaKgAc * areaAcres) / 45),
          ssp_50kg_bags: Math.ceil((sspKgAc * areaAcres) / 50),
          mop_50kg_bags: Math.ceil((mopKgAc * areaAcres) / 50),
          zinc_sulfate_10kg_packs: isZincDeficient ? areaAcres : 0
        },
        perAcreRates: {
          urea_kg: ureaKgAc,
          ssp_kg: sspKgAc,
          mop_kg: mopKgAc,
          zinc_sulfate_kg: zincSulfateKgAc
        },
        splitSchedule: [
          { timing: 'Basal (At Sowing/Transplanting)', fertilizers: `${Math.round(ureaKgAc * 0.25)} kg Urea + ${sspKgAc} kg SSP + ${Math.round(mopKgAc * 0.5)} kg MOP` },
          { timing: 'Active Tillering (Day 25-35)', fertilizers: `${Math.round(ureaKgAc * 0.50)} kg Urea + ${zincSulfateKgAc > 0 ? zincSulfateKgAc + ' kg Zinc Sulfate (soil or foliar)' : 'None'}` },
          { timing: 'Panicle Initiation (Day 55-65)', fertilizers: `${Math.round(ureaKgAc * 0.25)} kg Urea + ${Math.round(mopKgAc * 0.5)} kg MOP` }
        ],
        amendments: this.calculateSoilAmendments(soil, areaAcres)
      };
    },

    /**
     * Compute soil amendments: Gypsum for alkali, Lime for acidic, and organic manures
     */
    calculateSoilAmendments(soil = {}, areaAcres = 10) {
      const ph = soil.ph || 6.8;
      const oc = soil.oc || 0.58;

      let gypsumTonnes = 0;
      let limeTonnes = 0;
      let recommendations = [];

      if (ph > 8.2) {
        gypsumTonnes = Math.round((ph - 8.0) * 1.5 * areaAcres * 10) / 10;
        recommendations.push(`Apply ${gypsumTonnes} Tonnes Agricultural Gypsum (CaSO4.2H2O) to displace exchangeable sodium.`);
      }

      if (ph < 6.0) {
        limeTonnes = Math.round((6.5 - ph) * 1.2 * areaAcres * 10) / 10;
        recommendations.push(`Apply ${limeTonnes} Tonnes Agricultural Dolomitic Lime to neutralize soil acidity.`);
      }

      const fymTonnesAc = oc < 0.5 ? 5.0 : oc < 0.7 ? 3.5 : 2.0;
      recommendations.push(`Incorporate ${fymTonnesAc} Tonnes/Acre Farm Yard Manure (FYM) or Vermicompost at 800 kg/Ac.`);
      recommendations.push(`In situ Green Manuring: Sow Dhaincha (Sesbania aculeata) at 20 kg/Ac and incorporate at 45 days.`);

      return {
        gypsumTonnesTotal: gypsumTonnes,
        limeTonnesTotal: limeTonnes,
        fymTonnesPerAcre: fymTonnesAc,
        greenManureCrops: 'Dhaincha (Sesbania) / Sunnhemp',
        actionDirectives: recommendations
      };
    },

    /**
     * Convenience aliases for enterprise verification suites & external API
     */
    calculateFertilityIndex(params = {}) {
      return this.evaluateSoilHealth(params).score;
    },

    diagnoseDeficiencies(params = {}) {
      const res = this.evaluateSoilHealth(params);
      return {
        hasDeficiencies: res.deficiencies.length > 0,
        deficiencies: res.deficiencies.map(d => ({
          description: d,
          element: d.toUpperCase().includes('ZINC') ? 'Zinc' : d.toUpperCase().includes('NITROGEN') ? 'Nitrogen' : d.toUpperCase().includes('PHOSPHORUS') ? 'Phosphorus' : 'Nutrient',
          critical: d.toUpperCase().includes('CRITICAL') || (params.zn && params.zn < 0.60)
        }))
      };
    },

    calculateFertilizerDosage(crop = 'Paddy', areaAcres = 10, soil = {}) {
      return this.calculateFertilizerPrescription(crop, areaAcres, soil);
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FarmPilotSoilEngine;
  }
  if (typeof window !== 'undefined') {
    window.FarmPilotSoilEngine = FarmPilotSoilEngine;
  }
})();
