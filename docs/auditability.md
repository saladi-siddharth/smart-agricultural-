# FarmPilot Auditability, Security Logging & Tamper-Evident History

## 1. Overview

Agricultural compliance, organic certifications (e.g. NPOP / USDA Organic), bank financing audits, and corporate farm governance require an immutable record of operational changes. FarmPilot maintains a dedicated audit ledger in `public.security_audit_logs`.

Audit records are **append-only**. Direct `UPDATE` and `DELETE` queries on the audit tables are strictly blocked by Row Level Security and database triggers.

```
       User Action (Role Change, Expense Approval, Task Verification)
                                │
                                ▼
                       PostgreSQL Transaction
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
       State Mutation Committed       Audit Record Inserted
      (e.g., expenses, members)     (security_audit_logs table)
                                               │
                                               ▼
                                      Immutable Ledger
                                     (DENY UPDATE/DELETE)
```

---

## 2. Audit Ledger Schema

```sql
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_username TEXT,
  actor_role TEXT,
  event_type TEXT NOT NULL,
  target_resource TEXT NOT NULL,
  resource_id TEXT,
  status TEXT DEFAULT 'SUCCESS',
  details JSONB,
  request_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Absolute Secret Redaction
Under no circumstance does an audit log record:
- Plaintext passwords or password hashes.
- Session JWT tokens or refresh tokens.
- Supabase service role keys.
- Sensitive payment card details.

---

## 3. Audited Domain Events

| Event Category | Event Code | Captured Metadata |
|---|---|---|
| **Authentication** | `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `PASSWORD_RESET` | Actor identity, email, client user agent, correlation ID. |
| **Team Governance** | `ROLE_CHANGE`, `MEMBER_INVITED`, `MEMBER_SUSPENDED`, `MEMBER_REMOVED` | Actor ID, affected user ID, previous role, updated role, reason. |
| **Financial Ledger**| `EXPENSE_CREATED`, `EXPENSE_APPROVED`, `EXPENSE_REJECTED` | Amount, category, linked crop cycle, approver signature. |
| **Field Operations**| `TASK_ASSIGNED`, `TASK_STARTED`, `TASK_VERIFIED` | Assignee ID, plot ID, verification evidence URL, planned date. |
| **Agronomic Prescriptions** | `RECOMMENDATION_ISSUED`, `RECOMMENDATION_ACCEPTED` | Consultant ID, crop cycle ID, dosage recommendations. |
| **Compliance Export** | `AUDIT_EXPORT_CSV`, `REPORT_PDF_GENERATED` | Requesting executive, date range, exported record count. |

---

## 4. Request Correlation & Observability

All security-sensitive operations generate a client correlation ID:

```
req-fp-2026-09-11-a8f9c2d1
```

This ID is attached to the client request header (`X-FarmPilot-Correlation-ID`) and inserted into the `security_audit_logs.request_id` column. When troubleshooting operational discrepancies or security incidents, engineers can trace the single transaction from browser dispatch to database commit.

---

## 5. Audit Access Controls (RLS)

- **Farm Owner (`OWNER`)**: Full access to view, filter, and export the entire organization's audit ledger via `audit.html`.
- **Farm Manager (`MANAGER`)**: Operational history access for assigned farms.
- **Worker (`WORKER`) & Consultant (`CONSULTANT`)**: Restricted to reviewing their own direct actions.
- **Modification**: `UPDATE` and `DELETE` on `security_audit_logs` are revoked for all roles without exception.
