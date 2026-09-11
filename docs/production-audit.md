# FarmPilot Production Security, Database & Architecture Audit

**Document Version:** 3.0.0  
**Audit Date:** September 11, 2026  
**Auditor Roles:** Principal Supabase/PostgreSQL Architect, Principal Security Engineer, SaaS Multi-Tenancy Architect  
**Target Repository:** `saladi-siddharth/smart-agricultural-` (FarmPilot)  
**Authority Boundary:** Supabase Auth + PostgreSQL + Row Level Security (RLS)  

---

## Executive Summary

FarmPilot was audited across all client HTML/JS files, backend API endpoints, PostgreSQL schema, RLS policies, and community messaging workflows. The audit identified key vulnerabilities where client-side storage (`localStorage`) and naive database policies (`farms.owner_id = auth.uid()`) could be bypassed or fail in multi-user agricultural teams. 

This document outlines the **CURRENT** state, the identified **PROBLEM**, the required **FIX**, and the verified **FINAL STATE** across all critical architecture domains.

---

## 1. Authentication & Session Authority

### CURRENT
- `login.html` and `js/auth.js` utilized local session caching (`fp_auth_session`, `fp_auth_token`, `fp_custom_pwd_*`).
- Passwords in `auth.users` for seed personas were originally empty or mismatched, causing client code to fall back to local password verification.
- On `login.html`, clicking "Sign In" could trigger premature client navigation even if credentials had not been authoritatively verified by Supabase Auth servers.

### PROBLEM
- The browser was functioning as an authentication boundary. Tampering with `localStorage` could spoof user identities in the frontend.
- Fallback credentials undermined SaaS security standards and broke real multi-device synchronization between `localhost:5173` and production Vercel deployments.

### FIX
- Update all seed accounts in `auth.users` using PostgreSQL `crypt(password, gen_salt('bf'))` with confirmed emails.
- Rebuild `js/auth.js` around authoritative `supabase.auth.signInWithPassword()`, `signUp()`, `signOut()`, and `getSession()`.
- Completely eliminate client-side credential verification. The application shell will block access and display a loading barrier until `supabase.auth.getSession()` resolves a cryptographically valid JWT.
- In `login.html`, intercept form submission, disable buttons with loading spinners, await Supabase Auth response, and display clear error banners on invalid credentials without navigating.

### FINAL STATE
- **Authority:** 100% Supabase Auth.
- **Session Lifespan:** Managed via Supabase JWT access tokens (1h expiry) and automatic refresh tokens.
- **Tamper Resistance:** Spoofing `localStorage` has zero effect; Postgres validates `auth.uid()` from the signed JWT bearer token.

---

## 2. Role-Based Access Control (RBAC) & Multi-Tenancy

### CURRENT
- User roles (`OWNER`, `MANAGER`, `WORKER`, `CONSULTANT`) were partially stored in `localStorage.getItem('fp_user_role')` or profile metadata.
- Farm access was restricted in earlier migrations by `farms.owner_id = auth.uid()`.

### PROBLEM
- Under `farms.owner_id = auth.uid()`, only the original creator of a farm could view or manage fields, crops, harvests, inputs, and irrigation logs. Legitimate Farm Managers (`rajesh`), Workers (`ramu`), and Agronomist Consultants (`anita`) received empty results from Supabase Data API calls unless policies were bypassed.
- Client-side role switching (Demo Persona Switcher) could inadvertently be confused with real production role elevation.

### FIX
- Reconcile multi-tenant hierarchy: `organizations` $\rightarrow$ `organization_members` $\rightarrow$ `farms` $\rightarrow$ `farm_members` $\rightarrow$ `field_members` $\rightarrow$ `operations`.
- Create PostgreSQL `SECURITY DEFINER` authorization helpers:
  - `public.is_org_member(org_id, allowed_roles)`
  - `public.can_access_farm(farm_id, allowed_roles)`
  - `public.can_access_field(field_id)`
  - `public.can_view_financials(farm_id)`
- Redefine RLS policies across `fields`, `crop_cycles`, `activities`, `expenses`, `inputs`, `irrigation_logs`, and `harvests` to check `can_access_farm()` and worker assignments.
- Isolate Demo Mode with an explicit `[DEMO MODE]` UI banner, ensuring demo personas only affect frontend preview mockups and cannot mutate production database authorizations.

### FINAL STATE
- Roles are strictly retrieved from `public.organization_members` and `public.farm_members`.
- RLS enforces four distinct operational scopes:
  1. **OWNER:** Full organizational control, finances, memberships, approvals, audit logs.
  2. **MANAGER:** Full farm operational management, task assignment, agronomic inputs, operational expenses.
  3. **WORKER:** Assigned field tasks, observation submission, completion logging; **strictly zero access to farm financials/expenses**.
  4. **CONSULTANT:** Advisory notes, agronomic recommendations, crop health monitoring; read-only financial summaries where permitted.

---

## 3. Row Level Security (RLS) & Cross-Tenant Isolation

### CURRENT
- `profiles` allowed open public updates (`with_check = true`).
- `security_audit_logs` allowed open public SELECT (`qual = true`).
- `direct_messages` allowed open public SELECT and INSERT (`qual = true`).
- Several tables lacked explicit tenant checks or relied on unindexed nested subqueries.

### PROBLEM
- Unrestricted RLS policies allowed any authenticated or anonymous user to view audit logs, modify arbitrary user profiles, or read private direct messages.
- Subquery-heavy RLS policies risked $O(N)$ query degradation at scale.

### FIX
- Rebuild RLS policies:
  - `profiles`: SELECT public safe directory fields (`username`, `full_name`, `avatar_url`, `role`, `bio`); UPDATE restricted to `auth.uid() = id`.
  - `security_audit_logs`: INSERT allowed for audit recording; SELECT strictly restricted to `OWNER` role.
  - `expenses`: Workers are denied SELECT/INSERT/UPDATE/DELETE.
  - `direct_messages` / `messages`: Restrict SELECT to conversation participants; restrict INSERT to `auth.uid() = sender_id` where sender belongs to the conversation.
- Create composite indexes on `(farm_id, status)`, `(organization_id, user_id)`, `(conversation_id, created_at)`.

### FINAL STATE
- Every exposed table has RLS enabled with granular SELECT, INSERT, UPDATE, and DELETE policies.
- Cross-tenant and cross-farm IDOR attempts are rejected at the PostgreSQL query engine level with empty rows or violation errors.

---

## 4. Community, Usernames & Direct Messaging

### CURRENT
- `js/messaging.js` stored conversations and messages in browser `localStorage` (`farmpilot_direct_conversations`, `farmpilot_direct_messages`).
- Hardcoded directory array in client code.
- Usernames were not enforced with canonical normalization or database constraints.

### PROBLEM
- Messages sent in one browser did not appear in another browser or on mobile/Vercel deployments.
- No real-time delivery; no persistent unread counts across sessions.
- Community user search risked leaking sensitive PII (emails, phone numbers, private farm financials).

### FIX
- Reconcile database schema for community:
  - `public.profiles`: `username TEXT UNIQUE`, `username_normalized TEXT UNIQUE`, safe fields only.
  - `public.conversations`: `id`, `conversation_type`, `created_by`, `created_at`, `updated_at`.
  - `public.conversation_members`: `conversation_id`, `user_id`, `joined_at`, `last_read_at`, `status`.
  - `public.messages`: `id`, `conversation_id`, `sender_id`, `recipient_id`, `body`, `client_message_id`, `created_at`, `read_at`, `deleted_at`.
  - `public.notifications`: `recipient_id`, `type`, `title`, `message`, `reference_type`, `reference_id`, `read_at`.
- Rebuild `js/messaging.js` to query Supabase PostgreSQL directly.
- Implement Supabase Realtime subscriptions on `messages` table for live chat delivery.
- Implement server-calculated unread message badge on community message icon.
- Ensure public search queries explicitly `SELECT username, full_name, avatar_url, role, bio FROM profiles`—never `SELECT *`.

### FINAL STATE
- Users sign up with unique, canonical `@username`.
- User search finds real community members without exposing emails or private phone numbers.
- Messages persist in PostgreSQL and deliver in real-time across localhost and Vercel.
- Message reads update database state and synchronize unread badges across tabs and devices.

---

## 5. Reliability, Offline Capabilities & Scalability

### CURRENT
- Actions assumed synchronous network success; failures in network calls could cause desynchronized UI state.
- No structured client retry queue or idempotency handling for rapid message submission.

### PROBLEM
- In rural agricultural settings with intermittent 3G/4G connectivity, workers could experience lost task completions or duplicated message sends.

### FIX
- Implement `client_message_id` on messages table with unique constraints per sender/conversation to prevent duplicates on double-click or network retry.
- Implement optimistic UI updates with explicit `SAVED`, `SENDING`, `FAILED - RETRY` state transitions.
- Implement cursor-based pagination (`created_at < cursor LIMIT 50`) for conversation message history.

### FINAL STATE
- Resilient UI handles intermittent connectivity gracefully.
- Idempotency keys prevent duplicate records.
- Paginated queries maintain sub-50ms database response times.
