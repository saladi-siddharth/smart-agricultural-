# FarmPilot Phase 2: Agricultural Intelligence Architecture

## 1. Executive Product Positioning

FarmPilot is designed from first principles as an **Agricultural Decision-Support Operating System**. It is built on the operational paradigm:

```
SEE  ──►  UNDERSTAND  ──►  ACT
```

- **SEE**: What is happening in the field, phenological cycle, and input ledgers?
- **UNDERSTAND**: Why is it happening, what is the agronomic and financial implication?
- **ACT**: What specific, auditable action should the farm manager or field worker execute next?

FarmPilot transforms:
$$\text{Raw Farm Records} \longrightarrow \text{Agricultural Context} \longrightarrow \text{Decision} \longrightarrow \text{Action}$$

### Crucial Agritech Principle: Zero Generic Chatbots & No IoT Pretense
FarmPilot explicitly rejects generic conversational chatbots ("Ask AI anything about farming") and vague advice ("Water your crops regularly"). The system requires **no IoT hardware, no smart sensor telemetry, and no MQTT broker**. All intelligence is derived through software interpretation of:
1. Crop cycles, varieties, and sowing schedules
2. Field soil profiles and irrigation methods
3. Daily operational task records and assigned labour
4. Input application batches (fertilizers, micronutrients, seed stock)
5. Farm financial expense vouchers and planned cultivation budgets
6. Regional agro-meteorological forecasts (with graceful offline fallbacks)
7. Agronomic rule templates and historical cycle archives

---

## 2. Intelligence Architecture Flow

The intelligence pipeline is strictly decoupled into modular domain engines under `js/intelligence/`:

```
           Farm Records & Field Data
                      │
                      ▼
         Agricultural Context Engine
                      │
                      ▼
              Crop Stage Engine
         (Phenological Milestone Model)
                      │
                      ▼
             Operational Rules
       (Sequence & Dependency Checks)
                      │
                      ▼
             Financial Analysis
      (Cost of Cultivation & Variance)
                      │
                      ▼
                Risk Engine
        (Impact vs Urgency Register)
                      │
                      ▼
             Decision Ranking
        (Multi-Factor Task Priority)
                      │
                      ▼
        Explainable Recommendations
      (Trigger • Context • Data • Reason)
                      │
                      ▼
          User Action / Override
      (1-Click Resolution & Journaling)
```

---

## 3. Modular Intelligence Engines

| Engine | File Path | Core Functionality |
| :--- | :--- | :--- |
| **Crop Stage Engine** | `js/intelligence/crop-stage-engine.js` | Estimates operational stage (e.g. Active Tillering) based on calendar timeline, elapsed days, and completed operations. Generates interactive 9-stage progression track. |
| **Activity Intelligence** | `js/intelligence/activity-intelligence.js` | Multi-factor priority scoring (overdue days + stage relevance + financial impact), sequence warning detection (irrigation before fertilizer). |
| **Cost Intelligence** | `js/intelligence/cost-intelligence.js` | Cost of cultivation across 8 categories, cost/acre, budget variance tracking, and projected final cost calculation. |
| **Profitability Engine** | `js/intelligence/profitability-engine.js` | Break-even yield calculation, profit safety buffer, 3 scenarios (Conservative, Expected, Optimistic), and interactive What-If sensitivity simulator. |
| **Risk Engine** | `js/intelligence/risk-engine.js` | Farm risk register classifying Schedule, Cost, Data Quality, Crop Progress, and Weather hazards into an Impact vs Urgency 2x2 matrix. |
| **Weather Context Engine** | `js/intelligence/weather-context-engine.js` | Contextual weather advisory, spray window safety evaluation, and deterministic offline fallback. |
| **Data Quality Engine** | `js/intelligence/data-quality-engine.js` | Completeness score across 6 primary record classes, missing record alerts with direct "+ Add Record" actions. |
| **Farm Health 2.0 Engine** | `js/intelligence/farm-health-engine.js` | 5-pillar composite health index (Execution, Schedule, Cost, Progress, Data Quality) with dynamic explainable narrative. |
| **Cultivation Plan Builder** | `js/intelligence/cultivation-plan-engine.js` | Proposes draft operational crop plans from reusable agricultural templates (Paddy, Cotton, Maize, etc.). |
| **Comparison & Benchmarking** | `js/intelligence/comparison-benchmarking-engine.js` | Multi-farm portfolio comparison, field-by-field performance ranking, and historical cycle-to-cycle variance. |
| **Recommendation Engine** | `js/intelligence/recommendation-engine.js` | Synthesizes Today's Farm Action Plan, provides explainable "Why?" drawer data, and manages decision lifecycle. |
| **Ask FarmPilot Engine** | `js/intelligence/ask-farmpilot-engine.js` | Zero-hallucination natural query explorer answering operational questions strictly from verified database records. |
| **Orchestrator** | `js/intelligence.js` | Coordinates all 12 engines into unified `window.FarmPilotIntelligence` API. |

---

## 4. Decision-to-Action Loop

Every recommendation in FarmPilot participates in an auditable operational loop:

$$\text{DETECTED} \longrightarrow \text{EXPLAINED} \longrightarrow \text{RECOMMENDED} \longrightarrow \text{ACCEPTED} \longrightarrow \text{ACTIONED} \longrightarrow \text{MEASURED}$$

1. **Detected**: System detects that Zinc Sulfate spray is 2 days overdue during active tillering.
2. **Explained**: User opens "Why This Matters" modal to inspect trigger, agronomic context, soil test card, and biological consequences.
3. **Recommended**: Clear, unambiguous directive is presented ("Complete scheduled foliar spray today and record actual inputs").
4. **Accepted**: User executes the 1-click action or specifies an override reason.
5. **Actioned**: Task is marked COMPLETED, voucher logged, and alert resolved.
6. **Measured**: Health score immediately recalculates (e.g. 82 $\to$ 94), risk register clears the hazard, operational journal records the event, and financial projections update.

---

## 5. Future Machine Learning Roadmap

FarmPilot structures current operational facts so future predictive models can consume high-integrity agronomic datasets:
- Historical crop phenology duration vs localized weather
- Actual nitrogen/micronutrient inputs vs realized harvest yield
- AWD water table intervals vs soil fertility indices
- Cost variance trajectories across successive seasons

Because FarmPilot guarantees data completeness and traceability today, the data warehouse will be ML-ready without needing retroactive data cleanup.
