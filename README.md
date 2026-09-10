# 🌱 FarmPilot — The Operating System for the Farm
> **Phase 2 Enterprise Productization: Multi-Tenant Agricultural SaaS with Role-Based Access Control, Mobile Worker Shift, Automated Agronomic SMTP Alerts, and Executive Financial Intelligence.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Stack: HTML5 / CSS3 / Vanilla JS ES Modules](https://img.shields.io/badge/Frontend-HTML5%20%2F%20CSS3%20%2F%20ES%20Modules-blue.svg)](https://developer.mozilla.org)
[![Database: Supabase PostgreSQL](https://img.shields.io/badge/Database-Supabase%20PostgreSQL%2015-emerald.svg)](https://supabase.com)
[![Server: Zero--Dependency Node.js SMTP](https://img.shields.io/badge/Server-Node.js%20TLS%2FNET%20SMTP-purple.svg)](https://nodejs.org)

FarmPilot transforms scattered farm operations, financial ledgers, input consumption, and biological crop timelines into one unified, commercial-grade agricultural management operating system. Built for agricultural enterprises, multi-farm operators, managers, agronomists, and frontline field workers.

---

## 🏆 Directly Addressing the 7 Judge Pain Points

| Farm Problem | Judge Pain Point | FarmPilot Phase 2 Solution | Screen / Feature |
|---|---|---|---|
| **Work completed is unclear** | Activity & task status visibility | Complete operations ledger with non-destructive status tracking (`PENDING` → `IN_PROGRESS` → `COMPLETED`) preserving historical completion dates. | [`activities.html`](file:///d:/smart%20agriculture/activities.html) & [`worker.html`](file:///d:/smart%20agriculture/worker.html) |
| **Pending work is unclear** | Smart task queue & prioritization | Priority-ranked operational queues (Critical → High → Medium) with worker assignment and overdue detection. | [`dashboard.html`](file:///d:/smart%20agriculture/dashboard.html) & [`intelligence.html`](file:///d:/smart%20agriculture/intelligence.html) |
| **Spending is unclear** | Crop-wise expense tracking | Dynamic database-driven category breakdown, real-time budget vs. actual spend meters, and operational unit costs. | [`expenses.html`](file:///d:/smart%20agriculture/expenses.html) & [`reports.html`](file:///d:/smart%20agriculture/reports.html) |
| **Inputs are unclear** | Input consumption tracking | Unit-based inventory consumption logging (NPK, Urea, bio-agents) linked directly to specific crop cycles and fields. | [`inputs.html`](file:///d:/smart%20agriculture/inputs.html) & [`crops.html`](file:///d:/smart%20agriculture/crops.html) |
| **Operations may be late** | Schedule & overdue detection | Centralized Agronomic Alert Center with deterministic deduplication, priority tags, and automated executive SMTP email alerts. | [`alerts.html`](file:///d:/smart%20agriculture/alerts.html) & [`server.js`](file:///d:/smart%20agriculture/server.js) |
| **Crop progress is unclear** | Crop-cycle progression | 5-Tab operational workspace tracking phenological stages (Land Prep → Vegetative → Harvest) with interactive timeline. | [`crops.html`](file:///d:/smart%20agriculture/crops.html) |
| **Profitability is uncertain** | Uncertain margins & yield value | Interactive Yield Simulator & dynamic P&L engine: Live projection of Target Yield vs. Market Price vs. Total Spend. | [`crops.html`](file:///d:/smart%20agriculture/crops.html) & [`reports.html`](file:///d:/smart%20agriculture/reports.html) |

---

## 🌟 What's New in Phase 2

1. **Multi-Tenant Enterprise Organization & Farm Portfolio Hierarchy**:
   - Organization: `Green Valley Agriculture Ltd`
   - Multi-farm portfolio: `Green Valley Main Farm`, `Godavari Delta Rice Estate`, and `Coastal Plains Agro-Hub`.
   - Global farm switcher in top navigation that reactively updates all dashboard metrics, plots, cycles, and ledgers.

2. **Enterprise Role-Based Access Control (RBAC)**:
   - 4 distinct personas switchable in 1 click from the header profile dropdown:
     - 👑 **Farm Owner / Agri-Executive** (`Rajesh Verma`): Unrestricted administrative access, full financial ledgers, audit reports, and multi-farm oversight.
     - 📋 **Farm Manager** (`Suresh Patel`): Operational command, task scheduling, input ordering, worker assignment, and crop cycle management.
     - 🚜 **Field Worker** (`Ramesh Kumar`): Mobile-optimized shift view (`worker.html`) with 1-tap **Start** and **Complete**, zero financial noise.
     - 🔬 **Agronomist Consultant** (`Dr. Ananya Rao`): Agronomic intelligence, soil/weather advisories, input recommendation notes, and yield simulations.

3. **Automated Executive SMTP Email Alert System**:
   - Built-in zero-dependency Node.js SMTP protocol client (`server.js`) connecting directly to standard mail hosts (e.g. Brevo/Sendinblue, Gmail, Amazon SES).
   - Responsive, executive agronomic HTML email template featuring branded headers, operational KPI badges, task details, field context, and direct deep-link actions.
   - Triggers automatically whenever operations are scheduled or updated via [`js/mailer.js`](file:///d:/smart%20agriculture/js/mailer.js).
   - Built-in offline fallback: writes email artifacts to `logs/emails/` and provides instant browser preview via `/api/email-preview/:file`.

4. **Dedicated Mobile-First Field Worker Shift Mode (`worker.html`)**:
   - Designed specifically for smartphone screens in the field.
   - Clean card-based feed of today's assigned tasks.
   - Large touch targets for 1-tap **"Start Task"** (`IN_PROGRESS`) and **"Mark Completed"** (`COMPLETED`).
   - Eliminates all financial, P&L, and enterprise configuration clutter.

5. **Centralized Agronomic Alert Center (`alerts.html`)**:
   - Deterministic alert deduplication engine in [`js/supabase.js`](file:///d:/smart%20agriculture/js/supabase.js).
   - Filter by severity: **All**, **Critical**, **Warning**, **Advisory**.
   - Explainable agronomic reasoning behind each alert (e.g., biological risk of delayed NPK application).
   - Direct action buttons (e.g., "Resolve & Apply Fertilizer", "Inspect Sensor").

6. **Executive Audit-Ready Reports (`reports.html`)**:
   - Executive portfolio financial & agronomic summary.
   - One-click **CSV Export** for accounting and compliance.
   - Clean **Print-Optimized View** for stakeholder meetings and bank audit documentation.

7. **5-Tab Operational Crop Cycle Workspace (`crops.html`)**:
   - **Timeline**: Visual stage-by-stage progression through phenological phases.
   - **Activities**: Filtered operational history for the active cycle.
   - **Inputs Applied**: Cumulative fertilizer, seed, and chemical consumption.
   - **Financials**: Category breakdown of direct crop expenses.
   - **Yield Simulator**: Interactive slider adjusting projected yield (Quintals/Acre) and expected market price (₹/Qtl) to compute live Net Margin and ROI.

8. **Preserved Operational History (Non-Destructive Task Lifecycle)**:
   - Fixed legacy antipattern where tasks were permanently deleted from the database.
   - Completed tasks are preserved with status `COMPLETED`, timestamp `completed_date`, and operator attribution.
   - Historical task review available under the **"Completed History"** tab on `activities.html`.

---

## 💻 Technology Stack & Architecture

- **Frontend**: Semantic HTML5, Vanilla CSS3 (Custom Agricultural Design System with responsive grid, glassmorphism cards, and badge components), Vanilla JavaScript (Native ES Modules `import`/`export`).
- **Database**: Supabase PostgreSQL 15, Row Level Security (RLS) policies, idempotent schema migrations, and relational foreign keys.
- **Server & API**: Zero-dependency Node.js HTTP/SMTP server (`server.js`) handling static asset serving and direct socket-based SMTP email dispatch (`POST /api/send-email`).
- **Data Resilience**: Dual-mode data layer (`js/supabase.js`): seamlessly connects to live Supabase cloud database with fallback to pre-seeded demo state.

```
smart-agriculture/
├── server.js                     # Zero-dependency Node.js HTTP & SMTP socket server
├── index.html                    # Public landing / entry page
├── login.html                    # Authentication & 1-click persona quick-switch
├── dashboard.html                # Executive command center (Health score, KPIs, alerts)
├── farms.html                    # Multi-farm portfolio manager & plot parcels
├── crops.html                    # 5-Tab crop cycle workspace & yield simulator
├── activities.html               # Farm operations queue with completed history
├── worker.html                   # Mobile-first field worker shift view
├── alerts.html                   # Centralized agronomic alert center
├── inputs.html                   # Fertilizer, seed & chemical inventory ledger
├── expenses.html                 # Financial expense tracking & category breakdown
├── intelligence.html             # Farm health score analytics & explainable recommendations
├── reports.html                  # Executive portfolio reports with CSV & print export
│
├── js/
│   ├── app.js                    # Global layout controller, header farm switcher & RBAC
│   ├── auth.js                   # Enterprise RBAC manager & persona state
│   ├── config.js                 # App configuration & fallback datasets
│   ├── mailer.js                 # Client-side SMTP email dispatch helper
│   ├── supabase.js               # Multi-tenant data layer & business logic engine
│   ├── collaboration.js          # Shared observations, issues, advisory and notifications contract
│   └── icons.js                  # Feather icons integration
│
├── css/
│   ├── main.css                  # Global layout, typography, sidebar & responsive shell
│   ├── components.css            # Buttons, badges, tables, modals & cards
│   ├── dashboard.css             # Health score meter, KPI widgets & feed
│   └── activities.css            # Task card styling, priority pills & animations
│
├── docs/
│   ├── repository-audit.md        # Forensic audit of code vs documentation
│   ├── roles-and-permissions.md   # RBAC permission matrix (Owner, Manager, Worker, Consultant)
│   └── phase2-implementation-report.md # Comprehensive Phase 2 architectural report
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql         # Base database schema
│       ├── 002_rls_policies.sql           # Row Level Security policies
│       ├── 003_database_functions.sql     # Database functions & aggregations
│       ├── 004_phase2_multi_tenant.sql    # Multi-tenant orgs, members & RBAC schema
│       ├── 005_agricultural_intelligence.sql # Recommendations and farm memory
│       ├── 006_user_roles_community.sql  # Role fields and operational notes
│       └── 007_role_collaboration_security.sql # Farm/field scope, RLS, storage and workflows
│
├── scripts/
│   ├── migrate.js                # Migration runner with idempotent tracking (_migrations)
│   └── seed.js                   # Comprehensive multi-tenant scenario seeder
│
├── package.json                  # Node.js project manifest & scripts
├── .env.example                  # Environment variable template
└── README.md                     # Technical documentation & walkthrough
```

## Role-aware collaboration architecture

FarmPilot uses one shared farm truth with four scoped experiences:

- `OWNER` — portfolio, financial, organization, and approval oversight
- `MANAGER` — operations, assignments, verification, budgets, and documents
- `WORKER` — assigned work, observations, issues, notes, and evidence
- `CONSULTANT` — permitted analytics, advisory notes, comments, and recommendations

The browser permission contract in `js/auth.js` controls experience and demo mode. Supabase Auth, farm/field membership, and Row Level Security in migration 007 enforce access. Client-side role state is not a security boundary.

The collaboration loop is modeled as:

`Field observation → Issue → Advisory note → Manager decision → Activity → Worker submission → Verification → Farm memory`

Private contextual files use the `farm-documents` Supabase Storage bucket and document metadata. Uploads are scoped by farm, field, crop, activity, visibility, and actor.

---

## ⚡ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org) (v18 or higher recommended)
- A modern web browser (Chrome, Edge, Firefox, Safari)

### 2. Setup & Configuration

Clone the repository and install dependencies:
```bash
git clone https://github.com/saladi-siddharth/smart-agricultural-.git
cd smart-agricultural-
npm install
```

Configure your environment variables in `.env` (or copy from `.env.example`):
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.your-project:your-password@aws-0-region.pooler.supabase.com:6543/postgres

# SMTP Email Configuration
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-key
SMTP_FROM="FarmPilot Operations <alerts@farmpilot.ag>"
```

### 3. Database Migration & Seeding (Optional for live Supabase)
To apply the multi-tenant Phase 2 schema and seed reference agricultural data:
```bash
# Apply migrations idempotently
npm run migrate

# Seed organizations, farms, fields, crop cycles, activities, inputs, and expenses
npm run seed
```

### 4. Run Application
Start the unified application and email service:
```bash
npm start
```
Open **`http://localhost:5173`** in your browser.

---

## 🎯 5-Minute Judge Demo Walkthrough

Follow this sequence to experience the full power of the Phase 2 FarmPilot SaaS:

### Step 1: Executive Command Center Overview (Role: Farm Owner)
1. Navigate to **`http://localhost:5173/dashboard.html`**.
2. Notice the **Organization Header**: `Green Valley Agriculture Ltd`.
3. Use the **Farm Switcher** dropdown in the header to switch between `Green Valley Main Farm (Krishna)`, `Godavari Delta Rice Estate`, and `Coastal Plains Agro-Hub`. Watch all KPI counters, health scores, and active crop stages adjust reactively.
4. Review the **Farm Health Score (82/100)** broken down into Task Completion, Schedule Adherence, Cost Efficiency, and Crop Progress.

### Step 2: Agronomic Alert Center & Explainable AI
1. Click **Alerts** in the sidebar navigation or go to [`alerts.html`](file:///d:/smart%20agriculture/alerts.html).
2. Filter alerts by **Critical**, **Warning**, and **Advisory**.
3. Note the explainable agronomic reasoning provided for the overdue NPK fertilization task.
4. Click **"View Operation"** on an alert to navigate directly into the operational queue.

### Step 3: Schedule an Operation & Trigger SMTP Email Alert
1. In [`activities.html`](file:///d:/smart%20agriculture/activities.html), click **"+ Log Activity"**.
2. Fill in:
   - **Activity Name**: `Emergency Bio-Pesticide Spray (Neem Extract)`
   - **Crop Cycle**: `Paddy (BPT 5204) - Kharif 2024`
   - **Category**: `Pest Control`
   - **Priority**: `Critical`
   - **Assigned Worker**: `Ramesh Kumar`
   - **Date**: Today's date
3. Click **"Save Activity"**.
4. Observe:
   - The activity appears instantly in the queue.
   - An automated **Executive SMTP Email Alert** is generated and dispatched via `server.js`.
   - A success notification appears with an instant preview link to review the email formatting.

### Step 4: Frontline Field Worker Shift Mode
1. Click the top-right user profile dropdown and switch persona to **🚜 Ramesh Kumar (Field Worker)**.
2. The UI switches to the mobile-first [`worker.html`](file:///d:/smart%20agriculture/worker.html).
3. Tap **"Start Task"** on the assigned task — notice its status transitions to **IN PROGRESS**.
4. Tap **"Mark Completed"** — the task completes smoothly with visual feedback.
5. Notice that financial figures, P&L, and enterprise settings are completely hidden, keeping the field worker's UI clean and distraction-free.

### Step 5: Crop Workspace, Financials & Yield Simulator
1. Switch back to **👑 Rajesh Verma (Owner)**.
2. Navigate to [`crops.html`](file:///d:/smart%20agriculture/crops.html) and inspect the **Paddy (BPT 5204)** cycle.
3. Switch between the 5 tabs: **Timeline**, **Activities**, **Inputs Applied**, **Financials**, and **Yield Simulator**.
4. On the **Yield Simulator** tab, drag the **Projected Yield** slider to `28 Qtl/Ac` and **Market Price** slider to `₹2,400/Qtl`.
5. Observe the live recalculation of **Estimated Gross Revenue**, **Total Operational Cost**, **Net Margin**, and **ROI %**.

### Step 6: Executive Audit-Ready Reports
1. Navigate to [`reports.html`](file:///d:/smart%20agriculture/reports.html).
2. Review the consolidated portfolio performance, operational task completion ratios, and crop-wise expense breakdowns.
3. Click **"Export CSV"** to download an audit-ready operational and financial ledger.
4. Click **"Print Report"** to view the clean, professional print layout for banking and agronomic advisory reviews.

---

## 🔐 Security & Non-Destructive Principles

- **Row Level Security (RLS)**: Enforced across all Supabase tables ensuring tenant isolation and user data privacy.
- **Role-Based Guards**: Navigation and interface controls adapt dynamically based on user role (`Owner`, `Manager`, `Worker`, `Consultant`).
- **Non-Destructive Task Lifecycle**: Completed activities are preserved for full audit trail compliance (`completed_date`, status change history) rather than deleted.
- **Audit-Ready Ledgers**: Every financial expense, input application, and activity record retains foreign-key integrity back to its respective farm, field, and crop cycle.

---

## 📜 License

MIT License. Designed and engineered for the Smart Agriculture Innovation Hackathon.
