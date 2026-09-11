# FarmPilot Privacy, Data Governance & Retention Policy

## 1. Overview

FarmPilot processes sensitive operational, financial, and personal data for farmers and agricultural enterprises. This document outlines data classification, public versus private boundaries, access boundaries, and retention schedules.

---

## 2. Data Classification Matrix

| Data Category | Visibility Scope | Authorized Roles | Enforcing Boundary |
|---|---|---|---|
| **Public Community Profile** | Public within network | Any authenticated user | Explicit column SELECT in `profiles` |
| **Email & Phone Numbers** | **Strictly Private** | Account owner & Org Owner | Hidden from public search queries |
| **Farm Operational Records** | Farm-Scoped | Members of that specific farm | PostgreSQL Row Level Security |
| **Financial Ledgers & Costs**| **Restricted** | Farm Owner & Operations Manager | RLS `can_view_financials` function |
| **Direct Messages** | **End-to-End Private** | Only the two conversation participants | RLS `is_conversation_member` function |
| **Audit Logs** | Security Executive | Farm Owner only | RLS policy on `security_audit_logs` |

---

## 3. Public vs Private Boundaries in Community

### Public Directory Elements
- `@username`
- Display Name (e.g. "Dr. Anita Rao")
- Agricultural Role Badge (e.g. "Consultant / Agronomist")
- Profile Avatar URL
- Agronomic Interests & Crop Specialty (e.g. "Paddy AWD, Pulse Rotation")

### Strictly Private / Redacted Elements
- Email address (e.g. `farmer@greenvalley.in`)
- Phone number
- Exact farm GPS coordinates
- Farm bank account details, revenue, and expense ledgers
- Private advisory notes and unshared soil test PDFs

---

## 4. Message & Operational Record Retention

- **Direct Messages**: Retained indefinitely to maintain complete operational and contract agreements. If a user deletes a message, it is **soft-deleted** (`deleted_at = NOW()`), displaying *"This message was deleted"* while maintaining referential integrity for regulatory audits.
- **Financial & Activity Records**: Historical agricultural cycles are preserved as `ARCHIVED` rather than deleted, ensuring farmers can compare year-over-year crop yields and input expenditures.

---

## 5. Account Deactivation & Deletion Policy

When a team member or worker account is deactivated:
1. The user's status in `organization_members` transitions to `SUSPENDED` or `REMOVED`.
2. Supabase Auth session tokens are immediately revoked via `auth.admin.signOut()`.
3. PostgreSQL Row Level Security policies instantly block all data read and write operations.
4. Historical authored contributions (past task verifications, log entries, sent messages) remain attributed to their immutable `user_id` to preserve operational auditability without orphaned database references.
