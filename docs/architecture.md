# FarmPilot Production Architecture & Technical Specification

## 1. System Overview

FarmPilot is a multi-tenant precision agronomy and agricultural operating system designed to manage farm hierarchies, crop cycles, task execution, financial ledgers, real-time community messaging, and agronomic intelligence.

The architecture strictly adheres to the principle that **the database is the security boundary**. The client (browser running on `localhost:5173` or deployed on Vercel) is an experience layer; all identity, authorization, state transitions, and isolation guarantees are enforced natively by Supabase Auth, PostgreSQL 15, and Row Level Security (RLS).

---

## 2. End-to-End Architecture Diagram

```
                       FARMPILOT CLIENT
               (Vanilla HTML5 / CSS3 / ES6+)
           [localhost:5173 / Production Vercel]
                             │
                             ▼
                     SUPABASE AUTH (GoTrue)
               (JWT Tokens, bcrypt crypt auth)
                             │
                             ▼
                    AUTHENTICATED USER
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
      ORGANIZATION                        COMMUNITY
            │                                 │
       MEMBERSHIPS                        MESSAGES
    (Owner/Mgr/Wkr/Cons)                      │
            │                             REALTIME
          FARMS                     (Postgres Subscriptions)
            │                                 │
         FIELDS                         NOTIFICATIONS
            │                           (Unread Count)
       CROP CYCLES
            │
   ┌────────┼────────┐
   ▼        ▼        ▼
ACTIVITIES FINANCE HARVEST
   │
   ▼
INTELLIGENCE ENGINE
   │
   ▼
ALERTS & ACTIONS
```

### Infrastructure Components

| Layer | Technology | Operational Responsibility |
|---|---|---|
| **Identity & Authentication** | Supabase Auth (GoTrue) | JWT issuance, password hashing (`bcrypt`), email confirmation, session token rotation. |
| **Data Authority** | PostgreSQL 15 | Source of truth for organizations, farms, fields, crops, activities, financial ledgers, and messages. |
| **Access Control** | Row Level Security (RLS) | Declarative access policies evaluated inside Postgres for `anon` and `authenticated` roles. |
| **Realtime Engine** | Supabase Realtime | PostgreSQL change-data-capture publication (`supabase_realtime`) for instant chat & notification delivery. |
| **File & Asset Storage** | Supabase Storage | Scoped private buckets for crop evidence, soil test PDFs, invoice receipts, and avatars. |
| **Asynchronous Processing** | Background Queues / pgmq | Decoupled notification dispatch, farm health recalculation, and background report generation. |
| **Scheduled Jobs** | pg_cron / Supabase Cron | Overdue task scans, daily agricultural briefs, weather cache invalidation. |
| **Audit Logging** | `security_audit_logs` / `audit_logs` | Immutable audit trail capturing `actor_id`, `event_type`, `target_resource`, and timestamp. |
| **Observability** | Structured Client Telemetry | Correlation IDs, latency metrics, error classification, and failed mutation buffers. |

---

## 3. Current vs Production Hardening vs Future Scale

To maintain technical integrity without false claims, the system layers are classified below:

### A. Currently Implemented & Verified
- **Real Supabase Auth**: Direct integration with GoTrue across 4 roles (`OWNER`, `MANAGER`, `WORKER`, `CONSULTANT`). Verified with automated credential validation.
- **Relational Data Model**: Organizations, organization members, farms, farm members, fields, field members, crop cycles, activities, inputs, expenses, irrigation, harvests.
- **PostgreSQL Row Level Security**: Active RLS across all tables. Verified worker financial isolation (workers receive 0 expense rows; owners receive 4 rows).
- **Persistent Community Messaging**: Normalized tables (`conversations`, `conversation_members`, `messages`, `notifications`) in PostgreSQL with RLS isolation. Cross-user snooping and message spoofing are strictly blocked by PostgreSQL policies.
- **Realtime Push Subscriptions**: `supabase_realtime` publication enabled for `messages` and `notifications` tables.
- **13/13 Automated Verification Suites Passing**: Verified through `node scripts/verify-all.cjs`.

### B. Production Hardening (Active In This Release)
- Idempotent client message submission (`client_message_id` deduplication).
- Non-blocking asynchronous message replication with local optimistic cache for instantaneous responsiveness.
- Multi-tenant query optimization via composite indexes on `(conversation_id, created_at)` and `(farm_id, status)`.
- Replaced frontend-only session checks with database-authenticated route enforcement.

### C. Future Scale (Architected, Documented For Scale)
- Horizontal partitioning for high-frequency telemetry/IoT sensor data.
- Read-replica pools for regional agronomist advisory reporting.
- End-to-end encrypted message payloads for proprietary contract farming.

---

## 4. Environment Parity (Localhost & Vercel)

Both development (`http://localhost:5173` / `http://localhost:3000`) and deployed Vercel environments interact with the identical Supabase project (`https://xgcamlpkbgjulkfknpud.supabase.co`).

```
localhost:5173 ───────┐
                      ├───► [Supabase Project: xgcamlpkbgjulkfknpud] ◄─── Single Source of Truth
Vercel Deployment ────┘
```

1. There is **no local-only database** in live production mode.
2. An expense logged on `localhost` reflects instantly on Vercel upon database commit.
3. A message sent from Vercel triggers a Supabase Realtime event received on `localhost` without page refresh.
