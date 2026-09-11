# FarmPilot Reliability, Resilience & Failure Recovery

## 1. Reliability Principle

> **"Never hide failure. Never turn missing data into false certainty."**

In agricultural environments, software operates under unstable field conditions: spotty 2G/3G cellular networks, device power loss, concurrent edits by estate staff, and external API latency. FarmPilot implements proactive defense mechanisms across all layers.

---

## 2. Three-Tier Data Validation Architecture

```
┌────────────────────────────────────────────────────────┐
│  Tier 1: Frontend Client Validation                     │
│  - Instant regex & format checking                     │
│  - Field type & numeric boundary checks                │
│  - Non-empty message validation                        │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP REST / WebSocket
                           ▼
┌────────────────────────────────────────────────────────┐
│  Tier 2: Application Controller Validation             │
│  - Auth state & role capability checking               │
│  - Entity hierarchy validation (Field ∈ Farm)         │
│  - Idempotency key evaluation                          │
└──────────────────────────┬─────────────────────────────┘
                           │ SQL Engine
                           ▼
┌────────────────────────────────────────────────────────┐
│  Tier 3: PostgreSQL Database Constraints               │
│  - CHECK (amount >= 0), CHECK (area > 0)               │
│  - UNIQUE (username_normalized), UNIQUE (member)      │
│  - Foreign Key constraints with referential actions    │
└────────────────────────────────────────────────────────┘
```

---

## 3. Explicit Mutation States

FarmPilot eliminates silent failures by exposing clear, deterministic states during every data mutation:

| Mutation State | UI Presentation | System Meaning |
|---|---|---|
| `SAVED` | Green checkmark / Clean card | PostgreSQL confirmed persistence and transaction committed. |
| `PENDING` | Orange dot / "Sending..." | Mutation queued locally in memory / IndexedDB buffer. |
| `SYNCING` | Pulsing cloud icon | Active synchronization request in flight over network. |
| `FAILED` | Red alert banner + "Retry" | Request failed due to timeout or network drop. Data preserved. |
| `RETRY` | Active retry indicator | Automated exponential backoff retry in progress. |
| `CONFLICT` | Yellow warning + Review modal | Server record updated by another user while local change was pending. |

---

## 4. Specific Failure Recovery Scenarios

### A. Supabase Auth Temporary Outage
- **Behavior**: If GoTrue returns a 503 or network timeout during sign-in, FarmPilot **does not open the dashboard as a fallback**.
- **User Message**: *"Authentication service is temporarily unavailable. Please verify your connection and try again."*
- **Security Guarantee**: Unauthenticated users never gain access to cached private operational data.

### B. Partial Task Completion with Failed Photo Upload
- **Scenario**: A field worker submits task completion, but cellular connectivity drops during a 3MB image upload.
- **Handling**:
  1. The task status update (`SUBMITTED`) is committed to the database.
  2. The image upload enters a `PENDING_EVIDENCE` queue in the Service Worker cache.
  3. UI feedback: *"Task completion saved. Photo evidence upload pending network recovery."*

### C. External Weather API (WeatherAPI) Outage
- **Handling**: Cached meteorological readings remain displayed with an explicit timestamp tag: *"Updated 42 minutes ago (Cached)"*. Agronomic AWD water calculators degrade gracefully without crashing dashboard widgets.

### D. Concurrent Operational Updates
- Edits submit an `updated_at` timestamp. If the server record contains a newer `updated_at`, the mutation is rejected with `409 Conflict`, prompting the user to review the remote changes rather than silently overwriting them.

---

## 5. Role-Tailored Failure UX

| Role | Tone & Focus | Example Alert |
|---|---|---|
| **Worker** | Simple, clear, non-technical | *"No internet connection. Your shift record is safely saved and will send automatically when network returns."* |
| **Manager** | Actionable, operational context | *"Warning: Fertilizer task #104 evidence upload failed on North Block (Timeout 504). Retry queued."* |
| **Owner** | Financial and business impact | *"System alert: 1 pending invoice sync failed. Re-run bank reconciliation after network stabilization."* |
| **Consultant** | Data confidence and precision | *"Advisory note: Soil sensor data confidence is 78% due to missing Day 35 telemetry."* |
