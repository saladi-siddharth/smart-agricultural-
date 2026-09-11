# FarmPilot Observability, Telemetry & Security Monitoring

## 1. Overview

Production agricultural platforms require practical observability without the excessive overhead of complex APM vendors. FarmPilot achieves high reliability through structured JSON client logging, request correlation IDs, security event tracking, and Supabase platform health metrics.

---

## 2. Telemetry & Metric Dimensions

| Telemetry Metric | Measurement Scope | Alert Threshold | Remediation Action |
|---|---|:---:|---|
| **Auth Failures** | Number of failed login attempts per IP / hour | > 5 attempts | Trigger temporary rate-limit delay |
| **RLS Denials** | 42501 Postgres errors captured on API calls | > 0 on normal flows | Flag potential IDOR attempt or role bug |
| **Message Send Latency** | Time from Send click to Supabase write commit | > 1500 ms | Switch to optimistic UI queue + retry |
| **Notification Lag** | Time from message creation to Realtime delivery | > 3000 ms | Inspect WebSocket channel health |
| **Weather API Availability** | HTTP responses from WeatherAPI | 3 consecutive 5xx | Serve cached meteorological data |
| **Queue Error Rate** | Percentage of dead-lettered background jobs | > 2% | Alert DevOps engineering |

---

## 3. Structured Logging Standard

All client and server logs adhere to a consistent structured JSON format:

```json
{
  "timestamp": "2026-09-11T07:40:12.314Z",
  "level": "WARN",
  "service": "FarmPilotAuth",
  "event": "ROUTE_ACCESS_DENIED",
  "request_id": "req-fp-2026-09-11-c91f0",
  "actor_id": "12f2a103-05d5-498f-b187-406bf7f634cd",
  "role": "WORKER",
  "attempted_path": "/expenses.html",
  "message": "Access restricted: Workers cannot access financial ledgers."
}
```

---

## 4. Owner Security Dashboard Overview

The Farm Owner has exclusive access to the **Security & Telemetry Overview** (`intelligence.html` and `audit.html`), which highlights:
1. Recent team member additions, removals, and role modifications.
2. Suspicious unauthorized access attempts blocked by RLS.
3. System sync status between localhost and Vercel production environments.
4. Tamper-evident audit export options for agricultural lending compliance.
