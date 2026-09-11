# FarmPilot Disaster Recovery, Backup & Incident Runbook

## 1. Overview

This document outlines standard operating procedures for catastrophic failures, data corruption, migration rollbacks, and regional cloud infrastructure outages.

> [!CAUTION]
> A PostgreSQL database backup **does not automatically backup Supabase Storage objects**. Database tables contain metadata pointers to storage objects, but the actual binary files in S3-compatible buckets must be backed up independently.

---

## 2. Backup Schedules & Retention Policy

| Asset | Backup Mechanism | Frequency | Retention | RPO / RTO |
|---|---|:---:|:---:|:---:|
| **PostgreSQL Database** | Supabase Point-in-Time Recovery (PITR) & `pg_dump` snapshots | Continuous / Daily | 30 Days | RPO: 5 min / RTO: 30 min |
| **Storage Objects** | Automated daily bucket cross-region replication | Daily snapshot | 90 Days | RPO: 24 hrs / RTO: 2 hrs |
| **Schema Migrations** | Git-tracked declarative migrations in `supabase/migrations/` | Every commit | Indefinite | RPO: 0 / RTO: 5 min |
| **Application Builds** | Immutable Git commits on Vercel & Docker Hub | Every commit | Indefinite | RPO: 0 / RTO: 2 min |

---

## 3. Incident Recovery Playbooks

### A. Database Outage / Corruption
1. **Assessment**: Verify PostgreSQL connection status via Supabase Health Dashboard and direct pooler connection.
2. **Point-in-Time Recovery**: Navigate to Supabase Dashboard $\rightarrow$ Database $\rightarrow$ Backups $\rightarrow$ Select point in time prior to corruption $\rightarrow$ Initiate Restore.
3. **Verification**: Execute `node scripts/verify-all.cjs` and `node scripts/test-rls-isolation.mjs` against the restored database to confirm schema and data integrity.

### B. Bad Migration Applied to Production
1. All migrations are numbered sequentially (`001_...` through `011_...`).
2. If a migration introduces a breaking schema regression:
   - Do NOT edit historical migration files.
   - Author a forward-fix rollback migration (e.g. `012_rollback_...sql`).
   - Execute the forward migration via `scripts/migrate.js` or direct PostgreSQL pooler.

### C. Supabase Auth Service Degradation
1. When GoTrue experiences regional latency:
   - Existing valid user sessions remain active in browser memory until token expiration.
   - New logins display clear maintenance messaging: *"Authentication service is temporarily experiencing high latency. Please retry shortly."*
   - Protected routes deny access rather than falling back to unauthenticated bypasses.

### D. Deployment Rollback (Vercel)
1. Navigate to Vercel Dashboard $\rightarrow$ Deployments.
2. Locate the previous stable production deployment.
3. Click **Instant Rollback**.
4. Deployment completes in $< 60$ seconds.
