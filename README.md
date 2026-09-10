# 🌱 FarmPilot — The Operating System for the Farm

> **Operational visibility and intelligent decision-making across the entire crop cycle.**
> FarmPilot turns scattered farm activities, expenses, inputs, and crop progress into one unified command center with a live **Farm Health Score**, **profitability engine**, and **explainable recommendations**.

---

## 🏆 Directly Addressing the 7 Judge Pain Points

FarmPilot was purpose-built to eliminate the operational chaos and financial uncertainty in agricultural management:

| Farm Problem | Judge Pain Point | FarmPilot Solution | Screen / Feature |
|---|---|---|---|
| **Work completed is unclear** | Activity & task status visibility | Complete operations ledger with on-time adherence tagging | `ActivitiesPage` (`/activities`) |
| **Pending work is unclear** | Smart task queue & prioritization | Priority-ranked queue (Critical → High → Medium) with action prompts | `DashboardPage` & `IntelligencePage` |
| **Spending is unclear** | Crop-wise expense tracking | Real-time budget vs. actual spend meters and category breakdowns | `ExpensesPage` & `CropDetailPage` |
| **Inputs are unclear** | Input consumption tracking | Unit-based inventory & application logging (seed, fertilizer, bio-agents) | `InputsPage` (`/inputs`) |
| **Operations may be late** | Schedule & overdue detection | Automated overdue detection with urgent alerts and health impact | `IntelligencePage` & `Alerts` |
| **Crop progress is unclear** | Crop-cycle progression | Weighted stage completion tracker (Land Prep → Sowing → Harvest) | `CropsPage` & `CropDetailPage` |
| **Profitability is uncertain** | Uncertain margins & yield value | Live Profit & Loss simulation: Costs vs. Target Yield & Market Price | `ReportsPage` & `IntelligencePage` |

---

## 🧠 The Farm Health Score Engine

FarmPilot introduces an objective, multi-dimensional **Farm Health Score (0–100)**:

$$\text{Health Score} = (\text{Task Completion} \times 0.35) + (\text{Schedule Adherence} \times 0.25) + (\text{Cost Efficiency} \times 0.20) + (\text{Crop Progress} \times 0.20)$$

- **Task Completion (35%):** Ratio of finished operational tasks against planned milestones.
- **Schedule Adherence (25%):** Ratio of completed tasks finished on or before their planned agricultural deadline.
- **Cost Efficiency (20%):** Ratio of actual expenditures against planned seasonal budget threshold.
- **Crop Progress (20%):** Stage-weighted progress through the biological crop cycle.

---

## 🚀 The Killer Demo Test (Judge Walkthrough)

1. **Launch App**: Open the dashboard (`http://localhost:5173/dashboard`).
2. **Review Initial Health Score**: Notice the initial **Farm Health Score of 82/100**.
3. **Inspect Today's Priorities**: Note the **Critical Overdue Task**:
   > *Second Fertilizer Application (NPK 20-20-20 + Zinc)* — Planned for active tillering.
4. **Complete the Operation**: Click **"Mark Complete"** on the overdue task.
5. **Observe Instant Impact**:
   - Farm Health Score dynamically increases to **87+**.
   - Overdue alert resolves automatically.
   - Financial ledgers and crop stage progress update in real time.

---

## 💻 Technology Stack

- **Frontend**: React 19, TypeScript 6, Vite 8
- **Styling**: Tailwind CSS, Custom Light Theme Design System, Glassmorphism, Micro-animations
- **Charts & Visualizations**: Recharts (Pie, Bar, Area, Cartesian Charts)
- **Icons & Polish**: Lucide React
- **Backend & Database**: Supabase PostgreSQL 15, Row Level Security (RLS), Stored Procedures & Triggers
- **State & Storage**: TanStack Query + Reactive LocalStorage Engine for zero-config offline/demo resilience

---

## 📁 Repository & Architecture Structure

```
smart-agriculture/
├── public/
├── src/
│   ├── assets/              # SVG icons & branding
│   ├── hooks/
│   │   └── useAuth.tsx      # AuthProvider supporting live Supabase & 1-click Demo Mode
│   ├── layouts/
│   │   └── AppLayout.tsx    # Responsive command center sidebar & top navigation
│   ├── lib/
│   │   └── supabase.ts      # Safe Supabase client initialization
│   ├── pages/
│   │   ├── DashboardPage.tsx     # Command center with KPIs, Health Score, Today's Ops
│   │   ├── FarmsPage.tsx         # Farm portfolio management
│   │   ├── FarmDetailsPage.tsx   # Detailed farm overview, plots, and active cycles
│   │   ├── FieldsPage.tsx        # Plot parcels, soil types, and irrigation methods
│   │   ├── CropsPage.tsx         # Crop cycle lifecycle tracking & budget vs. spend
│   │   ├── CropDetailPage.tsx    # Deep-dive crop stage timeline & P&L simulation
│   │   ├── ActivitiesPage.tsx    # Operations queue with overdue filtering
│   │   ├── InputsPage.tsx        # Fertilizer, seed, and chemical consumption ledger
│   │   ├── ExpensesPage.tsx      # Financial expense tracking with category charts
│   │   ├── IrrigationPage.tsx    # Water discharge volume, source, and pumping costs
│   │   ├── HarvestPage.tsx       # Realized yield tonnage, quality grades, and revenue
│   │   ├── IntelligencePage.tsx  # Health Score breakdown & explainable AI recommendations
│   │   ├── ReportsPage.tsx       # Audit-ready executive report with CSV & print export
│   │   ├── LoginPage.tsx         # Authentication with 1-click Demo Farm access
│   │   └── RegisterPage.tsx      # New account registration
│   ├── services/
│   │   ├── mockDataStore.ts      # Reactive local demo database (Green Valley Farm)
│   │   ├── intelligenceService.ts# Health score, P&L, priority & recommendation algorithms
│   │   ├── farmService.ts        # Farm CRUD
│   │   ├── fieldService.ts       # Field parcel CRUD
│   │   ├── cropService.ts        # Crop cycle CRUD
│   │   ├── activityService.ts    # Activity lifecycle management
│   │   ├── expenseService.ts     # Financial expenses
│   │   ├── inputService.ts       # Agricultural inputs
│   │   ├── irrigationService.ts  # Irrigation logging
│   │   └── harvestService.ts     # Harvest & revenue recording
│   ├── types/
│   │   └── database.ts           # Strict TypeScript interfaces & database schemas
│   ├── App.tsx                   # Central router & protected routes
│   └── index.css                 # Clean light theme agricultural design system
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql      # 12 core tables with constraints & indexes
│   │   ├── 002_rls_policies.sql        # Row Level Security policies per user
│   │   └── 003_database_functions.sql  # SQL functions for health score & financials
│   └── seed.sql                        # Green Valley Farm demo seed scenario
├── .env.example
└── package.json
```

---

## ⚡ Getting Started

### 1. Zero-Config Demo Mode (Immediate Run)

No Supabase account or API keys required to test. The application automatically detects demo mode and initializes **Green Valley Farm (Machilipatnam, AP)**:

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

Open `http://localhost:5173` in your browser. Click **"Explore Green Valley Demo Farm"** to enter the command center immediately!

### 2. Connecting to Live Supabase (Optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Run migrations in `supabase/migrations/` inside the Supabase SQL Editor:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_database_functions.sql`
3. Optionally run `supabase/seed.sql` to populate the reference demo scenario.
4. Copy `.env.example` to `.env` and fill in your keys:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. Restart Vite (`npm run dev`).

---

## 📜 License

MIT License. Designed and engineered for the Smart Agriculture Innovation Hackathon.
