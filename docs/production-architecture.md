# FarmPilot Agronomic Operating System: Production Architecture, Security Model & Operational Resilience Specification

**Document Version:** 2.4.0  
**Classification:** Enterprise Engineering Specification  
**System Scope:** Precision Agronomy OS, Soil Health Intelligence Center, Multi-Tenant Farm Security, Background Job Pipelines, and Cloud/Edge Hybrid Runtime.

---

## 1. Executive Summary & System Topology

FarmPilot is an enterprise-grade precision agronomic operating system engineered for commercial farm owners, estate managers, field operators, and consulting agronomists. The system unites physical field telemetry (Alternate Wetting and Drying AWD water tubes, ICAR soil sample labs, weather microclimates) with financial accounting, workforce logistics, and artificial intelligence.

```
                                 ┌─────────────────────────────────────────────────────────┐
                                 │                 CLIENT APPLICATION LAYER                │
                                 │  Vanilla HTML5 / CSS3 / ES Modules / Service Worker     │
                                 │  • Desktop Executive Suite  • Mobile Worker Offline PWA │
                                 └────────────────────────────┬────────────────────────────┘
                                                              │
                                            HTTPS / WSS / JWT Bearer Tokens
                                            Idempotency-Key Header Protection
                                                              │
                                                              ▼
                                 ┌─────────────────────────────────────────────────────────┐
                                 │             API GATEWAY & RESILIENCE LAYER              │
                                 │  Node.js Server Runtime (Local / Vercel Serverless)     │
                                 │  • Sliding-Window Rate Limiter (Brute-force defense)    │
                                 │  • Cryptographic JWT Issuance & Token Revocation Cache  │
                                 │  • Idempotency Deduplication Store (24h TTL)            │
                                 │  • Multi-Tenant Isolation & Role Authorization Guard    │
                                 └─────────────┬─────────────────────────────┬─────────────┘
                                               │                             │
                     ┌─────────────────────────┴─────────┐         ┌─────────┴─────────────────────────┐
                     ▼                                   ▼         ▼                                   ▼
        ┌─────────────────────────┐         ┌─────────────────────────┐   ┌─────────────────────────┐
        │  ASYNCHRONOUS QUEUE     │         │ CIRCUIT BREAKER ROUTER  │   │  POSTGRESQL DATA STORE  │
        │  (FarmPilotQueue)       │         │ (CLOSED, OPEN, HALF-OPEN)│   │  Supabase Cloud DB      │
        │  • reports              │         │ • WeatherAPI.com        │   │  • Table 17488 profiles │
        │  • notifications        │         │ • Gemini Neural AI API  │   │  • user_credentials     │
        │  • analytics            │         │ • Mandi Market Telemetry│   │  • soil_tests & logs    │
        │  • integrations         │         │ • SMTP Alert Engine     │   │  • security_audit_logs  │
        │  • image_processing     │         │ Fallback: Offline Rules │   │  • Strict Tenant RLS    │
        └─────────────────────────┘         └─────────────────────────┘   └─────────────────────────┘
```

---

## 2. Security Architecture & Threat Model (STRIDE)

### 2.1 Threat Modeling Matrix
| STRIDE Category | Threat Description | FarmPilot Mitigations |
| :--- | :--- | :--- |
| **Spoofing** | Unauthorized user attempting identity impersonation or forged JWT tokens. | RFC 7519 HMAC-SHA256 tokens signed with high-entropy secret; constant-time signature comparison (`crypto.timingSafeEqual`); mandatory `sub`, `role`, and `jti` claims. |
| **Tampering** | Modification of financial expenditure ledger or soil sample lab figures in transit. | HTTPS transport encryption; SHA-256 payload integrity hashing; immutable audit logging (`security_audit_logs`). |
| **Repudiation** | Operator denying task completion or manager denying wage approvals. | Cryptographic audit trail with user ID, username, IPv4/IPv6 client address, ISO 8601 timestamp, and action signature. |
| **Information Disclosure** | Competitor viewing farm yield predictions, soil fertility cards, or worker contact info. | Multi-tenant PostgreSQL Row-Level Security (RLS) scoping all records to permitted `farm_id`; explicit column security. |
| **Denial of Service (DoS)** | Brute-force credential guessing or high-volume submission of task completion webhooks. | In-memory sliding window rate limiter: max 5 failed attempts per 15-minute window per IP/username, followed by mandatory lockout. |
| **Elevation of Privilege** | Field Worker invoking financial deletion or changing estate ownership permissions. | Hierarchical Role-Based Access Control (RBAC): `OWNER` > `MANAGER` > `CONSULTANT` > `WORKER`. Enforced both client-side and at API middleware. |

### 2.2 Table 17488 (`public.profiles`) Database Integrity Guarantees
- **Plaintext & Encrypted Mirroring:** Table 17488 (`public.profiles`) maintains both `password` (TEXT), `password_plain` (TEXT), and `password_hash` (PBKDF2/Bcrypt) columns.
- **Bi-Directional Sync Trigger:** PostgreSQL trigger `trg_sync_profiles_password` automatically synchronizes modifications between `password` and `password_plain`, while packaging credentials into structured JSONB (`credentials`).
- **Integrity Constraints:**
  - `check_profiles_password_min_len`: Enforces minimum length $\ge 6$ characters.
  - `check_profiles_pin_format`: Enforces 4–6 digit numeric worker PIN format (`^[0-9]{4,6}$`).
- **Row-Level Security:** Public read policy enabled for directory search and login resolution while restricting UPDATE mutations strictly to `auth.uid() = id`.

---

## 3. Organization & Farm-Level Multi-Tenant Isolation

### 3.1 Tenancy Hierarchy
```
  Organization Level (e.g. Green Valley Agriculture Ltd)
       └── Farm Level (e.g. Green Valley Farm, Krishna Delta Organic Farms)
            └── Parcel / Field Level (e.g. North Block Plot A, South Canal Block)
                 └── Sensor & Telemetry Level (e.g. AWD Tube T-01, Soil Sample SHC-0089)
```

1. **Organization Boundary:** Every farm entity is pinned to an `organization_id`. Cross-organization queries are blocked at the database engine level via PostgreSQL RLS policies.
2. **Farm-Level Access Vector:** API requests carry tenant context via JWT claims. Requests requesting mutations for a specific `farm_id` must pass verification against the user's permitted `farm_ids` array.
3. **Field Isolation for Contract Workers:** Field operators (`WORKER`) are restricted to viewing and logging activities for their explicitly assigned parcels (`assigned_parcel`), preventing unauthorized visibility into other blocks.

---

## 4. Production Resilience: Idempotency & Circuit Breakers

### 4.1 Exactly-Once Execution via Idempotency Keys
In rural agricultural environments, mobile broadband connections frequently drop during transaction execution. When network connectivity resumes, devices retry the HTTP request.
- Mutating POST requests accept an `Idempotency-Key` or `X-Idempotency-Key` header (UUIDv4).
- The gateway checks `IdempotencyManager`:
  - **First Request:** Status set to `IN_FLIGHT`. Request processes normally. Output response status code and JSON body cached for 24 hours.
  - **Duplicate Request:** Gateway recognizes key, skips duplicate mutation, and immediately replays the cached response with header `X-Idempotent-Replay: true`.

### 4.2 Circuit Breakers for External Dependencies
External agricultural web services (WeatherAPI, Gemini AI, Central Mandi Price feeds) are prone to third-party outages or rate limiting. FarmPilot protects uptime with a 3-state Circuit Breaker:
- **`CLOSED` (Normal):** Requests execute directly against external API. Consecutive failures increment failure counter.
- **`OPEN` (Outage Protection):** When 3 consecutive failures occur, circuit trips to `OPEN` for 30 seconds. All incoming requests immediately fail over to deterministic localized agronomic rule engines without waiting for network timeouts.
- **`HALF_OPEN` (Recovery Testing):** After 30 seconds, 2 probe requests test the external provider. If successful, circuit transitions back to `CLOSED`.

---

## 5. Asynchronous Message Queue (`FarmPilotQueue`)

Non-critical and heavy background workloads are decoupled from the synchronous HTTP request-response cycle using `FarmPilotQueue`:

| Channel | Workload Description | Execution Policy | Retry & DLQ Strategy |
| :--- | :--- | :--- | :--- |
| `reports` | Comprehensive 10-page seasonal farm dossiers and PDF compilation. | Low priority, concurrency limit 2. | 3 retries with exponential backoff (2s, 4s, 8s); moves to DLQ on terminal failure. |
| `notifications` | Critical weather alerts, frost advisories, and SMS/Email/Push alerts. | High priority, immediate dispatch. | 4 retries; alerts administrator on DLQ. |
| `analytics` | Nightly multi-parcel yield simulations and break-even recalculations. | Scheduled off-peak batch. | 2 retries; logs audit metric. |
| `integrations` | Periodic synchronization of mandi rates and microclimate forecasts. | Background poll. | 3 retries; circuit breaker trip protection. |
| `image_processing` | Drone crop canopy imagery and leaf chlorosis diagnostic neural networks. | Concurrency limit 1. | 2 retries; moves corrupted images to DLQ. |

---

## 6. Soil Health & Farm Health 2.0 Engine Architecture

### 6.1 The 6-Pillar Agronomic Index
FarmPilot replaces opaque health indicators with a deterministic, explainable 6-Pillar mathematical score ($0 - 100$):

$$\text{Health Index} = 0.20 S + 0.20 C + 0.15 E + 0.15 P + 0.15 F + 0.15 D$$

Where:
- $S$: **Schedule Adherence (20%)** — Penalizes overdue agricultural interventions by 18 points per milestone.
- $C$: **Cost Control (20%)** — Budget variance tracking against planned input costs.
- $E$: **Execution Velocity (15%)** — Proportion of seasonal field operations verified complete.
- $P$: **Crop Phenological Progress (15%)** — Biological advancement vs calendar days from sowing.
- $F$: **Soil Fertility & Nutrient Health (15%)** — Grounded in laboratory N-P-K, Organic Carbon %, and DTPA Zinc thresholds ($Zn < 0.60\text{ ppm}$ critical Khaira trigger).
- $D$: **Operational Data Quality (15%)** — Audit completeness of activities, inputs, water readings, and tests.

### 6.2 ICAR-Compliant Soil Health Card Generator
- **Chemical Ratings:** N, P, K classified as Low, Medium, High against ICAR standards.
- **Physical Dynamics:** pH evaluation for salinity/alkalinity; Electrical Conductivity (EC) threshold ($1.0\text{ dS/m}$).
- **Soil Amendments:** Automatic prescription of Agricultural Gypsum for sodic soils ($pH > 8.2$) and Agricultural Lime for acid soils ($pH < 6.0$).
- **Export Formats:** Full digital Soil Health Card view with responsive print layout formatted for state agricultural credit verification and crop insurance subsidies.

---

## 7. Disaster Recovery & Business Continuity (BCDR)

### 7.1 Recovery Objectives
- **Recovery Point Objective (RPO):** $\le 5\text{ minutes}$ (continuous PostgreSQL WAL archiving + client-side IndexedDB buffer).
- **Recovery Time Objective (RTO):** $\le 30\text{ seconds}$ (automated stateless instance failover on Vercel Edge).

### 7.2 Offline Operation & Partition Tolerance (CAP Theorem)
FarmPilot adopts an **AP (Availability / Partition Tolerance)** model at the edge:
1. When connectivity is severed, the client Service Worker (`sw.js`) continues serving all assets from the Cache API.
2. Field task completion, soil measurements, and AWD water logs are written to client-side `IndexedDB` with pending sync state.
3. Upon network reconnection, `js/offline-sync.js` replays buffered mutations sequentially with `Idempotency-Key` headers, guaranteeing consistency without duplicate task logging.

---

## 8. Deployment Architecture & Scalability

### 8.1 Production Deployment Pipeline
- **Frontend Assets:** Static HTML5/CSS3/Vanilla JS distributed globally via Vercel Global Edge CDN with HTTP/2 and Brotli compression.
- **Cache Strategy:** Immutable caching (`max-age=31536000, immutable`) for hashed assets; `no-cache, must-revalidate` for `sw.js` and `manifest.json`.
- **Database Backend:** Hosted Supabase PostgreSQL instance in Mumbai (`ap-south-1`) with pooled connections via PgBouncer for transaction concurrency.
- **Automatic CI/CD:** GitHub `main` branch push triggers Vercel automated build script (`node build.js`), compiling `dist/` and propagating edge distribution across 300+ edge locations worldwide.
