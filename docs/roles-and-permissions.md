# FarmPilot — Roles, Permissions & Multi-Tenant RBAC

**Document:** Roles and Permissions Matrix  
**Product Version:** FarmPilot Phase 2 Productized SaaS  

---

## 1. Role Hierarchy

FarmPilot enforces a 4-tier Role-Based Access Control (RBAC) model aligned with real agricultural enterprise operations:

```
                  ┌───────────────────────────────┐
                  │       ORGANIZATION OWNER      │
                  │ (Full Financials & Portfolio) │
                  └───────────────┬───────────────┘
                                  │
                  ┌───────────────▼───────────────┐
                  │         FARM MANAGER          │
                  │  (Operations, Fields & Labor) │
                  └───────┬───────────────┬───────┘
                          │               │
          ┌───────────────▼──────┐ ┌──────▼────────────────┐
          │     FIELD WORKER     │ │ AGRICULTURAL ADVISOR  │
          │ (Mobile Tasks Shift) │ │ (Health Diagnostics)  │
          └──────────────────────┘ └───────────────────────┘
```

---

## 2. Permissions Matrix

| Feature / Domain Action | OWNER | MANAGER | WORKER | CONSULTANT |
|---|:---:|:---:|:---:|:---:|
| **Organization & Billing Plan** | ✅ Full Control | ❌ Denied | ❌ Denied | ❌ Denied |
| **Manage Team & Invite Members** | ✅ Full Control | ✅ Manage Staff | ❌ Denied | ❌ Denied |
| **Multi-Farm Portfolio Access** | ✅ All Farms | ✅ Assigned Farms | ❌ Assigned Parcel | ✅ Assigned Farms |
| **Financial Ledger & Margins** | ✅ Full Access | ✅ Cost Tracking | ❌ Concealed | ❌ Read-Only |
| **Schedule & Assign Field Tasks** | ✅ Allowed | ✅ Primary Workflow | ❌ Denied | ❌ Denied |
| **Execute & Complete Tasks** | ✅ Allowed | ✅ Allowed | ✅ 1-Tap Mobile Shift | ❌ Read-Only |
| **Alert Triage & Resolution** | ✅ Allowed | ✅ Primary Workflow | ❌ Concealed | ✅ Advisory View |
| **Farm Health Diagnostics** | ✅ Allowed | ✅ Allowed | ❌ Concealed | ✅ In-Depth Audit |
| **Executive Reports & CSV Export**| ✅ Full Access | ✅ Operations Report | ❌ Denied | ✅ Agronomic Report |

---

## 3. Persona Specific UX Profiles

### 👑 OWNER (`farmer@greenvalley.in` — Siddharth Saladi)
- **Primary Goals:** Portfolio health, cash-flow burn rate, projected net profit margin, and multi-farm risk oversight.
- **Key Screens:** `dashboard.html` (Executive View), `farms.html` (Portfolio Dossiers), `reports.html` (Financial Statements).

### 🛠️ MANAGER (`manager@greenvalley.in` — Rajesh Patel)
- **Primary Goals:** Daily operations execution, task assignment to workers, inventory procurement, and overdue triage.
- **Key Screens:** `activities.html` (Field Operations Ledger), `crops.html` (Crop Workspace), `alerts.html` (Alert Center).

### 🚜 WORKER (`worker@greenvalley.in` — Ravi Kumar)
- **Primary Goals:** Distraction-free mobile interface showing today's tasks, parcel locations, instructions, and 1-tap completion.
- **Key Screens:** `worker.html` (Touch-friendly shift view with 0 financial noise).

### 🔬 CONSULTANT (`consultant@greenvalley.in` — Dr. M. S. Swaminathan)
- **Primary Goals:** Soil vitality diagnostics, micronutrient foliar spray protocols, AWD water balance, and yield optimization.
- **Key Screens:** `intelligence.html` (4-pillar health telemetry), `crops.html` (Biological lifecycle).

---

## 4. Demo Switcher vs. Authenticated Mode

To support national hackathon presentations, FarmPilot provides two parallel modes:
1. **Interactive Demo Persona Switcher (Top Header):**
   - Instant 1-click toggling between `Owner`, `Manager`, `Worker`, and `Consultant` without requiring repeated password re-entry.
   - Automatically adapts the sidebar, header stats, and page permissions.
2. **Authenticated Mode (Supabase Auth & RLS):**
   - Real PostgreSQL `organization_members` table gating data at the database layer.
   - Row-level security blocks cross-tenant reads even if an unauthorized user crafts direct API calls.
