# FarmPilot Phase 2: Data Confidence & Trust Model

## 1. Philosophy of Agronomic Trust

In agriculture, unearned certainty causes disastrous operational failures. FarmPilot strictly differentiates what the software **knows**, what it **calculates**, what it **estimates**, and what is merely a **simulated scenario**.

Under no circumstances does FarmPilot claim:
- "Satellite imagery indicates..." (unless genuine multispectral API feeds exist)
- "IoT soil telemetry reveals..." (when no hardware sensors exist)
- "AI predicts exact harvest date..." (when calculating deterministic calendar days)

---

## 2. The 5 Data Veracity Tiers

| Tier | Veracity Level | Examples in FarmPilot | UI Labeling |
| :--- | :--- | :--- | :--- |
| **Tier 1: Recorded Facts** | 100% (Audited) | Completed task dates, signed-off labour shifts, actual purchase invoices, logged AWD sluice readings, soil health card lab tests. | `Recorded Data` |
| **Tier 2: Calculated Metrics** | 100% (Mathematical) | Actual spend to date, cost of cultivation per acre, budget variance %, farm health composite index, task overdue day count. | `Calculated` |
| **Tier 3: Estimated Context** | Moderate (~80-90%) | Operational crop stage (inferred from planting date + completed tasks), harvest readiness percentage, projected final cultivation cost. | `Estimated [Context]` |
| **Tier 4: Scenario Simulations** | Hypothesis-based | Mandi selling price shocks, yield variation sensitivities, break-even yield, conservative/optimistic profit models. | `Scenario Assumption` |
| **Tier 5: External Feeds** | External Dependency | Regional agro-meteorological weather forecasts, rain probability, wind speed. | `External Weather Context` |

---

## 3. Graceful Degradation & Offline Fallbacks

When external feeds (e.g. weather radar or remote database synchronization) are unavailable:
1. **Never halt execution**: The system continues operating on local transactional facts.
2. **Display honest uncertainty**: The UI displays *"Weather intelligence unavailable — core farm operations continue"*.
3. **No fabricated data**: The system never substitutes synthetic sensor readings for missing live telemetry.

---

## 4. Addressing Incomplete Agricultural Records

A critical differentiator of FarmPilot is **Data Quality Intelligence**. Agriculture frequently suffers from delayed or missing records. Rather than silently assuming missing numbers are zero, FarmPilot:
1. Surfaces missing records explicitly in the **Data Quality Audit** panel.
2. Directs the user to log missing entries (e.g., *"Yesterday's AWD irrigation sluice reading is missing"*).
3. Adjusts the **Data Quality Pillar** in the Farm Health score, transparently penalizing incomplete documentation.
