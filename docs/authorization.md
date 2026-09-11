# FarmPilot Authorization, Multi-Tenancy & RBAC Specification

## 1. Overview

Authorization in FarmPilot is enforced through a multi-tier hierarchy spanning organizations, farms, fields, and individual crop cycles. The system does not rely on a single `owner_id` column on farm rows; instead, permissions flow through explicit relational memberships evaluated within PostgreSQL Row Level Security policies.

```
                  auth.uid()
                      │
                      ▼
            ORGANIZATION MEMBERSHIP
             (organizations table)
                      │
                      ▼
               FARM MEMBERSHIP
             (farm_members table)
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
     FIELD SCOPE           CROP SCOPE
  (field_members)    (crop_cycle_members)
            │                   │
            └─────────┬─────────┘
                      ▼
               TENANT RESOURCE
    (Activities, Expenses, Harvests, Documents)
```

---

## 2. Multi-Tenant Relational Schema

### A. Organizations (`organizations`)
Represents the top-level agricultural enterprise or cooperative tenant.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `name TEXT NOT NULL`
- `slug TEXT UNIQUE NOT NULL`
- `owner_id UUID REFERENCES auth.users(id)`
- `plan TEXT DEFAULT 'ENTERPRISE'`
- `status TEXT DEFAULT 'ACTIVE'`

### B. Organization Members (`organization_members`)
Maps users to organizations with tenant-level roles.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE`
- `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
- `role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'WORKER', 'CONSULTANT'))`
- `status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INVITED', 'SUSPENDED', 'REMOVED'))`
- `UNIQUE(organization_id, user_id)`

### C. Farm Memberships (`farm_members`)
Grants operational access to specific farms within an organization.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `farm_id UUID REFERENCES farms(id) ON DELETE CASCADE`
- `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
- `role TEXT NOT NULL`
- `status TEXT DEFAULT 'ACTIVE'`
- `UNIQUE(farm_id, user_id)`

### D. Field Memberships (`field_members`)
Provides fine-grained assignment of field operators/workers to specific geographical blocks.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `field_id UUID REFERENCES fields(id) ON DELETE CASCADE`
- `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
- `assignment_type TEXT DEFAULT 'PRIMARY_OPERATOR'`
- `UNIQUE(field_id, user_id)`

### E. Crop Cycle Memberships (`crop_cycle_members`)
Authorizes agronomic consultants, managers, or specialized contractors to observe or manage specific seasonal cycles.
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `crop_cycle_id UUID REFERENCES crop_cycles(id) ON DELETE CASCADE`
- `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
- `access_role TEXT NOT NULL`
- `UNIQUE(crop_cycle_id, user_id)`

---

## 3. Four Core Roles & Responsibilities

| Role | Scope | Financial Access | Operational Capabilities |
|---|---|---|---|
| **OWNER** | Enterprise & All Farms | Full (Read / Write / Approve) | Tenant administration, role provisioning, subscription, audit ledger, farm creation. |
| **MANAGER** | Assigned Farms | Operational (Log Expenses / Budgets) | Task scheduling, field assignment, crop cycle initialization, worker coordination. |
| **WORKER** | Assigned Fields & Tasks | **Zero (Blocked by RLS)** | Task execution, daily shift logging, photo evidence upload, field observation notes. |
| **CONSULTANT** | Assigned Farms & Crops | Aggregated / Advisory summaries | Prescription advisory, disease diagnostic reports, irrigation recommendations. |

---

## 4. Centralized Permission Matrix

| Permission Code | Description | OWNER | MANAGER | WORKER | CONSULTANT |
|---|---|:---:|:---:|:---:|:---:|
| `VIEW` | View general farm dashboards and crop cycles | ✅ | ✅ | Assigned | Assigned |
| `CREATE` | Create tasks, crop cycles, and operational logs | ✅ | ✅ | ❌ | ❌ |
| `EDIT` | Modify farm configurations and operational schedules | ✅ | ✅ | ❌ | ❌ |
| `DELETE` | Soft-delete or archive records | ✅ | ✅ | ❌ | ❌ |
| `ASSIGN` | Assign field workers to tasks and plots | ✅ | ✅ | ❌ | ❌ |
| `APPROVE` | Verify completed tasks and approve expenses | ✅ | ✅ | ❌ | ❌ |
| `EXPORT` | Export compliance reports, PDF summaries, and ledgers | ✅ | ✅ | ❌ | ✅ |
| `UPLOAD` | Upload worker field evidence or advisory documents | ✅ | ✅ | Task Only | Advisory Only |
| `COMMENT` | Add discussion remarks on activities or recommendations | ✅ | ✅ | ✅ | ✅ |
| `RECOMMEND` | Issue agronomic prescriptions and AWD recommendations | ✅ | ✅ | ❌ | ✅ |
| `MANAGE_USERS`| Invite, provision, or suspend team members | ✅ | ❌ | ❌ | ❌ |
| `MANAGE_ORG` | Organization billing, plan, and settings | ✅ | ❌ | ❌ | ❌ |
| `VIEW_FINANCES`| Access farm expense ledgers, input costs, and revenue | ✅ | ✅ | ❌ | Summary |
| `VIEW_AUDIT` | Inspect tamper-evident security audit logs | ✅ | ❌ | ❌ | ❌ |

---

## 5. IDOR & Cross-Tenant Protection

Insecure Direct Object References (IDOR) are strictly defeated at the PostgreSQL engine level:

1. **URL Tampering Immunity**: If a Manager assigned only to `Farm A` manually modifies a request to `/api/farms/FARM_B` or queries `farm_id = 'FARM_B'`, the PostgreSQL RLS policy filters out all records. The response is an empty set or a 403 Forbidden error.
2. **Worker Financial Masking**: If a Worker queries the `expenses` table directly via the PostgREST API with a valid JWT token, PostgreSQL evaluates:
   ```sql
   CREATE POLICY "Allow farm members to view expenses" ON public.expenses
   FOR SELECT TO authenticated
   USING (public.can_view_financials(farm_id));
   ```
   Since `public.can_view_financials(farm_id)` requires an `OWNER` or `MANAGER` role, the worker receives `0` rows.
