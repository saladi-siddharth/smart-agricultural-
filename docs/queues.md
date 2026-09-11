# FarmPilot Background Queues & Asynchronous Processing

## 1. Overview

To prevent web request blocking and guarantee high responsiveness for field operators, heavy computations and notifications are decoupled using **PostgreSQL-native durable queues (Supabase Queues / pgmq)**.

Ordinary CRUD operations (logging an expense, changing a plot status) write directly to PostgreSQL with transactions. Only asynchronous, retryable, and long-running tasks enter the queue system.

```
                  Client Request
                        │
                        ▼
             PostgreSQL Transaction
             (Direct CRUD Committed)
                        │
                        ▼
             Enqueues Job into pgmq
                        │
                        ▼
             Worker / Edge Function
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
 Notifications    Report PDF       AWD Health Score
  Dispatcher      Generator          Recalculation
```

---

## 2. Active Queue Topologies

| Queue Name | Primary Responsibility | Max Retries | Visibility Timeout |
|---|---|:---:|:---:|
| `farm-notifications` | Dispatches push notifications and Realtime message alerts | 5 | 30s |
| `report-generation` | Compiles comprehensive multi-page farm compliance PDFs | 3 | 120s |
| `analytics-jobs` | Recalculates Farm Health Scores and profitability projections | 3 | 60s |
| `image-processing` | Compresses and generates thumbnails for worker evidence photos | 4 | 45s |

---

## 3. Standard Queue Payload Specification

All queue payloads conform to a strict immutable schema without containing any secrets, passwords, or service keys:

```json
{
  "job_id": "job-notif-77291a-b3",
  "type": "DISPATCH_DIRECT_MESSAGE_ALERT",
  "organization_id": "33dd8f01-e3c5-42a8-9194-a92504a75246",
  "actor_user_id": "5859e5e0-f981-43bb-9585-c33b7a72d03c",
  "resource_id": "6bd79e81-46dd-499e-8481-d42cb4de5393",
  "created_at": "2026-09-11T07:35:00.000Z",
  "idempotency_key": "notif-cmid-178908389",
  "payload": {
    "recipient_id": "12f2a103-05d5-498f-b187-406bf7f634cd",
    "sender_username": "rajesh",
    "preview_text": "Please inspect North Block Plot A water level.",
    "reference_type": "FIELD"
  }
}
```

---

## 4. Idempotency & Retry Lifecycle

1. **At-Least-Once Delivery**: Consumers handle messages under at-least-once semantics.
2. **Deduplication**: Consumers verify `idempotency_key` against a processed jobs table before executing side-effects.
3. **Exponential Backoff**: Temporary network failures retry up to the configured limit ($2^n \times \text{delay}$).
4. **Dead-Letter Archive**: Jobs failing after maximum retries are moved to `dlq_failed_jobs` for engineering inspection and alert generation. They never retry indefinitely.

---

## 5. Scheduled Automation (Supabase Cron / pg_cron)

FarmPilot does not require users to open the dashboard to trigger periodic operational checks:
- **06:00 AM Daily**: Scans all active crop cycles for overdue activities and generates priority task queues.
- **08:00 AM Daily**: Dispatches Daily Farm Brief notifications summarizing soil moisture and AWD schedules.
- **Midnight**: Cleans expired temporary session buffers and archives stale notifications.
