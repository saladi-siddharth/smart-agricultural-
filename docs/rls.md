# FarmPilot Row Level Security (RLS) Architecture & Verification

## 1. Overview

Every table in the `public` schema containing tenant or user data has Row Level Security strictly enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`). Default behavior for both `anon` and `authenticated` roles is **DENY ALL** unless an explicit policy evaluates to `true`.

```
                Incoming PostgREST Query
                           │
                           ▼
               PostgreSQL 15 RLS Engine
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
      ANON Role                 AUTHENTICATED Role
      (Deny all private tables)  Evaluates auth.uid()
                                         │
                                         ▼
                                SECURITY DEFINER Helpers
                                (search_path = public)
                                         │
                        ┌────────────────┴────────────────┐
                        ▼                                 ▼
                     PERMIT                             DENY
               (Row Returned)                    (0 Rows / Error)
```

---

## 2. Table-by-Table RLS Policy Coverage

| Table Name | RLS Status | Select Policy | Insert / Update Policy | Delete Policy |
|---|---|---|---|---|
| `profiles` | ENABLED | Public Safe Columns (safe directory) | User can update own profile (`id = auth.uid()`) | Denied |
| `organizations` | ENABLED | Members of org (`is_org_member`) | Owners only | Owners only |
| `organization_members`| ENABLED | Members of org | Owners only | Owners only |
| `farms` | ENABLED | Farm members (`can_access_farm`) | Owners and Managers | Owners only |
| `farm_members` | ENABLED | Farm members | Owners and Managers | Owners only |
| `fields` | ENABLED | Farm members | Owners and Managers | Owners and Managers |
| `field_members` | ENABLED | Farm members | Owners and Managers | Owners and Managers |
| `crop_cycles` | ENABLED | Farm members | Owners and Managers | Owners and Managers |
| `activities` | ENABLED | Farm members & assigned workers | Farm members & assigned workers | Owners and Managers |
| `expenses` | ENABLED | **Owners & Managers ONLY (`can_view_financials`)** | Owners and Managers | Owners only |
| `inputs` | ENABLED | Farm members | Owners and Managers | Owners only |
| `harvests` | ENABLED | Farm members | Owners and Managers | Owners only |
| `conversations` | ENABLED | Direct participants (`initiator` or `recipient`) | Authenticated participants | Denied |
| `conversation_members`| ENABLED | Conversation participants (`is_conversation_member`) | Conversation participants | Denied |
| `messages` | ENABLED | Conversation participants (`is_conversation_member`) | Sender must match `auth.uid()` and belong to conversation | Soft delete only |
| `notifications` | ENABLED | Recipient only (`recipient_id = auth.uid()`) | System / Authenticated triggers | Recipient |
| `security_audit_logs` | ENABLED | Owners only | Authenticated actions append-only | **STRICTLY DENIED** |

---

## 3. Security Definer Helper Functions

To avoid complex, duplicated policy logic and eliminate infinite recursion, authorization helpers are defined as `SECURITY DEFINER` functions with fixed `search_path`:

### A. Organization Membership Helper
```sql
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = p_user_id AND status = 'ACTIVE'
  );
$$;
```

### B. Farm Access Helper
```sql
CREATE OR REPLACE FUNCTION public.can_access_farm(p_farm_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farm_members
    WHERE farm_id = p_farm_id AND user_id = p_user_id AND status = 'ACTIVE'
  );
$$;
```

### C. Financial Ledger Access Helper
```sql
CREATE OR REPLACE FUNCTION public.can_view_financials(p_farm_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farm_members
    WHERE farm_id = p_farm_id AND user_id = p_user_id AND status = 'ACTIVE'
      AND role IN ('OWNER', 'MANAGER')
  );
$$;
```

### D. Conversation Membership Helper (Mutual Recursion Resolver)
When `conversations` checked `conversation_members` and `conversation_members` checked `conversations`, PostgreSQL threw `42P17: infinite recursion detected`. This was resolved by evaluating direct columns on `conversations` and utilizing a dedicated helper:
```sql
CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conv_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = p_conv_id AND user_id = p_user_id AND status = 'ACTIVE'
  )
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.profiles p ON p.id = p_user_id
    WHERE c.id = p_conv_id 
      AND (c.initiator_username = p.username OR c.recipient_username = p.username)
  );
$$;
```

---

## 4. Empirical Security Test Verification

The RLS test suites (`scripts/test-rls-isolation.mjs` and `scripts/test-community-messaging-rls.mjs`) ran against the live Supabase instance and produced the following confirmed results:

```
[Test 1: Worker Financial Ledger Isolation]
- Worker (worker@greenvalley.in) executes: SELECT * FROM expenses;
  RESULT: 0 rows returned. (CONFIRMED BLOCKED)
- Owner (farmer@greenvalley.in) executes: SELECT * FROM expenses;
  RESULT: 4 rows returned with monetary sums. (CONFIRMED PERMITTED)

[Test 2: Cross-Conversation Snooping Protection]
- Unrelated User C (worker@greenvalley.in) queries messages in User A & B conversation:
  RESULT: 0 rows returned. (CONFIRMED BLOCKED)

[Test 3: Identity Spoofing Protection]
- User C attempts to INSERT INTO messages with sender_id = User A (farmer):
  RESULT: 42501 (new row violates row-level security policy for table "messages"). (CONFIRMED REJECTED)
```
