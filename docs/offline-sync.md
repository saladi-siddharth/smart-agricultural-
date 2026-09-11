# FarmPilot Offline Synchronization & Low-Connectivity Field Architecture

## 1. Overview

Agricultural fields in delta basins and rural districts frequently suffer from intermittent or non-existent 3G/4G connectivity. FarmPilot is engineered as a **Progressive Web App (PWA)** backed by service worker caching (`sw.js`) and a persistent client operation buffer.

Workers can record pest sightings, mark tasks in progress, and log irrigation sluice gate changes offline with zero data loss.

```
       Worker in Field (Offline)
                  │
                  ▼
         IndexedDB Buffer
    (Client Operation Queue: op_id)
                  │
        [Network Reconnected]
                  │
                  ▼
         Sync Engine (sw.js)
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
    Success              Conflict
(Status: SAVED)     (Status: NEEDS_REVIEW)
```

---

## 2. Deterministic Client Operation ID

Every offline action receives an immutable client-generated UUID:

```javascript
const clientOperation = {
  op_id: "op-shift-178908389-a7b2",
  timestamp: "2026-09-11T07:30:00.000Z",
  action: "TASK_COMPLETED",
  actor_id: "worker-ravi-01",
  entity_type: "activities",
  entity_id: "act-fert-day-38",
  payload: {
    status: "COMPLETED",
    actual_hours: 4.5,
    notes: "Applied Urea 50kg to Plot A"
  },
  status: "PENDING"
};
```

When connectivity is re-established:
1. The client flushes operations in chronological order.
2. The server processes `op_id` idempotently. If `op_id` was already applied, the server returns 200 OK without re-executing logic.
3. The UI never indicates "Completed on server" until the HTTP response confirms database commit.

---

## 3. Conflict Resolution Strategy

When an offline mutation conflicts with an updated server state:
1. **LWW (Last-Write-Wins) is strictly avoided** for critical financial and agronomic data.
2. If another user modified the task on the server during the offline period:
   - The server flags the record as `CONFLICT_DETECTED`.
   - The worker's submitted note is preserved in `activity_logs`.
   - The farm manager receives a notification: *"Conflicting updates on Task #104. Review worker submission vs manager schedule."*

---

## 4. Service Worker & Cache Strategy

`sw.js` implements a tiered caching strategy:
- **Core App Shell**: HTML, CSS, JavaScript bundle, fonts, icons are cached using `Cache-First` for instant sub-second boot.
- **Data API Requests**: `Network-First` with background fallback to cached responses.
- **Media Uploads**: Buffered in IndexedDB until online event fires.
