# FarmPilot Phase 2: Agricultural Intelligence Rules Catalog

## 1. Crop Stage Rules & Evidence Logic

The operational crop stage is estimated deterministically rather than guessed:

```
Inputs:
- Start Date (Sowing / Transplanting)
- Expected Harvest Date
- Current Date (Elapsed Days)
- Configured Crop Template Duration
- Completed Field Activities

Evaluation:
Elapsed Days = Current Date - Start Date
Cumulative Stage Window = Sum(Stage Durations)
Corroborating Operations: Check if completed tasks align with stage milestones
```

### Classification Labeling
- When derived from calendar + task milestones: **"Estimated crop stage"**
- Evidence basis string: `Crop calendar + {elapsedDays} elapsed days + {completedOpsCount} completed operations`

---

## 2. Operational Sequence & Dependency Rules

A warning is generated when an operation violates physiological or operational sequencing:

| Condition | Hazard | Action Directive |
| :--- | :--- | :--- |
| **Fertilizer top-dressing scheduled without preceding irrigation in last 5 days** | Urea applied to dry cracked soil volatilizes; nitrogen efficiency drops by up to 35%. | *Review AWD water tube and log irrigation moisture check before closing fertilizer workflow.* |
| **Pest spray scheduled with >50% rain forecast within 24h** | Rainfall washes foliar chemicals into runoff, wasting chemical and labor outlay. | *Verify 4-hour dry window before chemical application.* |
| **Panicle initiation stage reached while basal top-dressing pending** | Applying vegetative nitrogen during reproductive initiation triggers lodging. | *Cancel delayed basal urea and adjust to muriate of potash (MOP).* |

---

## 3. Multi-Factor Task Priority Scoring Formula

The Priority Score ($0 \le P \le 100$) ranks pending field operations:

$$P = S_{\text{overdue}} + S_{\text{priority}} + S_{\text{stage}} + S_{\text{financial}}$$

Where:
1. **$S_{\text{overdue}}$ (Overdue Penalty, max 40 pts)**:
   $$S_{\text{overdue}} = \min(40, \text{Days Overdue} \times 8)$$
2. **$S_{\text{priority}}$ (Base Urgency, max 40 pts)**:
   - Critical: 40 pts
   - High: 30 pts
   - Medium: 20 pts
   - Low: 10 pts
3. **$S_{\text{stage}}$ (Crop Stage Relevance, max 30 pts)**:
   - High relevance (e.g. Zinc spray during tillering, Potash during panicle initiation): 30 pts
   - General operation: 15 pts
4. **$S_{\text{financial}}$ (Financial Impact, max 15 pts)**:
   $$S_{\text{financial}} = \min\left(15, \text{round}\left(\frac{\text{Task Cost}}{\text{Crop Budget}} \times 100\right)\right)$$

---

## 4. Cultivation Cost & Variance Formulas

### Cost Per Acre
$$\text{Cost Per Acre} = \frac{\text{Total Actual Expenses}}{\text{Field Area (Acres)}}$$

### Budget Variance Percentage
$$\text{Variance \%} = \frac{\text{Total Actual Spend} - \text{Planned Budget}}{\text{Planned Budget}} \times 100$$

### Projected Final Cultivation Cost
$$\text{Projected Final Cost} = \text{Current Spend} + (\text{Remaining Planned Budget} \times V_f)$$
Where $V_f = \max\left(0.9, 1.0 + \frac{\text{Actual Variance to Date}}{\text{Budget}}\right)$ when budget utilization exceeds 25%.

### Variance Classification
- $\le 0\%$: **On Track** (Optimal)
- $> 0\%$ to $5\%$: **Watch**
- $> 5\%$ to $12\%$: **Above Plan** (Contingency recommended)
- $> 12\%$: **Critical Variance** (Executive intervention required)

---

## 5. Profitability & Break-Even Formulas

### Break-Even Yield ($Y_{\text{be}}$)
$$Y_{\text{be}} = \frac{\text{Total Projected Cultivation Cost}}{\text{Selling Price Per Unit}}$$
*Example: $\frac{₹52,400}{₹29,000/\text{Tonne}} = 1.81\text{ Tonnes}$*

### Profit Safety Buffer ($B_s$)
$$B_s = Y_{\text{target}} - Y_{\text{be}}$$
*Example: $4.2\text{ T} - 1.81\text{ T} = 2.39\text{ Tonnes (Buffer to absorb price/yield shocks)}$*

### Net Profit ($P_{\text{net}}$) and Margin
$$P_{\text{net}} = (\text{Harvest Yield} \times \text{Selling Price}) - \text{Cultivation Cost}$$
$$\text{Margin \%} = \frac{P_{\text{net}}}{\text{Gross Revenue}} \times 100$$

---

## 6. Farm Health 2.0 (5-Pillar Weighted Composite Formula)

$$\text{Farm Health} = (S_{\text{sched}} \times 0.25) + (S_{\text{cost}} \times 0.20) + (S_{\text{exec}} \times 0.20) + (S_{\text{prog}} \times 0.20) + (S_{\text{data}} \times 0.15)$$

- **Schedule ($S_{\text{sched}}$)**: $96 - (\text{Overdue Tasks} \times 18)$, clamped $[40, 96]$.
- **Cost ($S_{\text{cost}}$)**: $92$ if on track, $82$ if $0-10\%$ variance, $74$ if $10-20\%$ variance, $60$ if $>20\%$ variance.
- **Execution ($S_{\text{exec}}$)**: Task completion ratio clamped $[30, 100]$.
- **Progress ($S_{\text{prog}}$)**: Milestone completion vs elapsed calendar days ($94$ on track, $79$ if key milestone overdue).
- **Data Quality ($S_{\text{data}}$)**: Ratio of recorded primary records ($0-100\%$).

---

## 7. Explainability Standard: The 5-Point "Why?" Structure

Every high-priority recommendation must provide:
1. **Trigger**: Specific condition that activated the engine (e.g., *Activity overdue by 2 days, soil zinc at 0.4 ppm*).
2. **Context**: Biological and field setting (e.g., *Paddy BPT-5204 • North Block • Active Tillering*).
3. **Data Considered**: Raw audited data points (dates, costs, threshold ppm values).
4. **Physiological Reason**: Real agronomic mechanism (e.g., *Zinc activates IAA growth hormones; deficit causes permanent tillering stunting*).
5. **Recommended Action**: Unambiguous next step (e.g., *Execute 0.5% foliar spray today and record actual inputs*).
