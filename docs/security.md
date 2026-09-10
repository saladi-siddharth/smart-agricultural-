# FarmPilot Security Model & Data Isolation

## Security Principles

FarmPilot is designed with multi-tenant enterprise data security and zero-trust data access:

1. **Authentication (Auth)**:
   - Supabase GoTrue manages user accounts with JWT bearer tokens.
   - Passwords hashed using bcrypt.
   - Tokens refreshed automatically and stored in secure browser storage.

2. **Row Level Security (RLS)**:
   - RLS is enabled on **ALL 12 tables** in PostgreSQL (`002_rls_policies.sql`).
   - Access control cascades down the ownership chain:
     ```
     auth.users -> profiles -> farms -> fields -> crop_cycles -> [activities, inputs, expenses, irrigation, harvests]
     ```
   - No user can read, insert, update, or delete another farmer's records, even if guessing foreign keys or IDs.

3. **Data Protection Policies**:
   - `farms`: Only `owner_id = auth.uid()` can read, modify, or delete.
   - `crop_cycles`: Validates `farm_id IN (SELECT id FROM farms WHERE owner_id = auth.uid())`.
   - `activities`, `expenses`, `inputs`, `irrigation_logs`, `harvests`: Validates farm ownership via direct `farm_id` or nested `crop_cycle_id` checks.

4. **Input Validation**:
   - All client-side forms validate types, boundaries, and required fields.
   - Database schema enforces PostgreSQL `CHECK` constraints (e.g., `amount >= 0`, `area > 0`, `duration_minutes >= 0`).
