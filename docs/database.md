# FarmPilot Database Schema, Constraints & Calculation Integrity

## 1. Schema Overview

All FarmPilot application entities reside in the `public` schema within PostgreSQL 15 on Supabase. Storage assets are managed through the Supabase Storage API, while identity credentials reside in `auth.users`.

---

## 2. Core Entity Relational Model

```
       organizations ───────► organization_members
             │
             ▼
           farms ────────────► farm_members
             │
             ├───────────────► fields ───────► field_members
             │                   │
             └───────────────► crop_cycles ──► crop_cycle_members
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
            activities        expenses        harvests
                 │               │
                 ▼               ▼
           activity_logs      inputs
```

---

## 3. Financial & Precision Constraints

To prevent floating-point precision loss and invalid operational states, the schema enforces strict column constraints:

1. **Monetary Precision**: All currency amounts use `NUMERIC(12, 2)` or `NUMERIC(14, 2)` with check constraints:
   ```sql
   ALTER TABLE public.expenses ADD CONSTRAINT chk_expense_amount_positive CHECK (amount >= 0);
   ALTER TABLE public.harvests ADD CONSTRAINT chk_harvest_revenue_nonnegative CHECK (revenue >= 0);
   ALTER TABLE public.inputs ADD CONSTRAINT chk_input_cost_nonnegative CHECK (total_cost >= 0);
   ```
2. **Agronomic Area**:
   ```sql
   ALTER TABLE public.farms ADD CONSTRAINT chk_farm_total_area_positive CHECK (total_area > 0);
   ALTER TABLE public.fields ADD CONSTRAINT chk_field_area_positive CHECK (area > 0);
   ```
3. **Cross-Entity Integrity**:
   Foreign key relationships are strictly checked to ensure child entities belong to matching parent hierarchies:
   ```sql
   ALTER TABLE public.fields ADD CONSTRAINT fk_fields_farm FOREIGN KEY (farm_id) REFERENCES public.farms(id) ON DELETE CASCADE;
   ALTER TABLE public.crop_cycles ADD CONSTRAINT fk_crop_farm FOREIGN KEY (farm_id) REFERENCES public.farms(id) ON DELETE CASCADE;
   ALTER TABLE public.crop_cycles ADD CONSTRAINT fk_crop_field FOREIGN KEY (field_id) REFERENCES public.fields(id) ON DELETE CASCADE;
   ```

---

## 4. Agronomic Calculations & Stored Procedures

### Farm Health Score Formula
The Farm Health Score is computed through `calculate_farm_health_score(p_farm_id UUID)` combining five distinct agronomic pillars:

$$\text{Health Score} = 0.30 \times S_{\text{task}} + 0.25 \times S_{\text{schedule}} + 0.20 \times S_{\text{cost}} + 0.15 \times S_{\text{crop}} + 0.10 \times S_{\text{data}}$$

1. **Task Completion ($S_{\text{task}}$)**: Ratio of completed tasks to total assigned tasks over the past 30 days.
2. **Schedule Adherence ($S_{\text{schedule}}$)**: Penalty applied for tasks verified past their `planned_date`.
3. **Cost Efficiency ($S_{\text{cost}}$)**: Comparison of actual expenses plus input costs against allocated cycle budgets.
4. **Crop Biological Progress ($S_{\text{crop}}$)**: Evaluates days elapsed since sowing against standard GDD (Growing Degree Day) benchmarks for the specific variety (e.g. BPT-5204 Paddy 145-day cycle). **Fixed to decouple from raw task counts**.
5. **Data Quality ($S_{\text{data}}$)**: Validates presence of soil moisture readings, irrigation logs, and worker shift evidence photos.

### Financial Double-Counting Prevention
`calculate_crop_financials(p_crop_cycle_id UUID)` ensures that inputs recorded under activities are not duplicated when calculating overall farm operational expenditures:
- Direct ledger expenses are recorded in `public.expenses`.
- Seed, fertilizer, and pesticide applications are tracked in `public.inputs` with an optional `expense_id` foreign key. If an input is linked to an expense record, its monetary sum is accounted for only once in aggregated farm reporting.

---

## 5. Performance Indexing Strategy

To eliminate $N+1$ query bottlenecks and maintain sub-50ms query latency at scale, the database maintains targeted composite indexes:

```sql
-- Community Messaging Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread ON public.messages(recipient_username, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(initiator_username, recipient_username);

-- Safe Profile Search Index
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_norm ON public.profiles(username_normalized);

-- Farm & Operational Queries
CREATE INDEX IF NOT EXISTS idx_activities_farm_status ON public.activities(farm_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_farm_date ON public.expenses(farm_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON public.security_audit_logs(actor_id, created_at DESC);
```
