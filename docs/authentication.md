# FarmPilot Authentication Architecture & Specification

## 1. Overview

Authentication in FarmPilot is anchored entirely by **Supabase Auth (GoTrue)**. The browser is never trusted as the identity authority. Client-side state reflects server-issued JSON Web Tokens (JWT) signed by the Supabase project.

```
┌────────────────────────────────────────────────────────┐
│                      Client Browser                    │
│   FarmPilotAuth.login(identity, password)             │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS POST /auth/v1/token
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Supabase GoTrue                      │
│   1. Verifies bcrypt password hash                     │
│   2. Validates user account status & identities table  │
│   3. Issues Access Token (JWT) & Refresh Token         │
└──────────────────────────┬─────────────────────────────┘
                           │ Authenticated Session
                           ▼
┌────────────────────────────────────────────────────────┐
│                PostgreSQL 15 (Supabase)                │
│   auth.uid() set in transaction context for RLS        │
│   Profile loaded from public.profiles via user.id     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Identity Separation: `auth.users` vs `public.profiles`

Identity is strictly separated into system credentials and application domain profiles:

| Dimension | `auth.users` (GoTrue) | `public.profiles` (Application) |
|---|---|---|
| **Access Authority** | Supabase Internal (Security Boundary) | Public schema governed by RLS |
| **Primary Key** | `id UUID PRIMARY KEY` | `id UUID REFERENCES auth.users(id) ON DELETE CASCADE` |
| **Stored Attributes** | Email, bcrypt password hash, confirmed_at, identities | Username, full name, avatar, bio, agricultural interests, role |
| **Passwords** | Strictly stored here as salt-hashed bcrypt hashes | **NEVER** stored in `profiles` under any circumstance |
| **Public Search Visibility** | 100% Inaccessible to public queries | Accessible only for safe columns (`username`, `full_name`, `avatar_url`) |

---

## 3. Username Architecture & Validation Policy

Usernames are first-class identity attributes in FarmPilot. Every community interaction, message request, and agricultural advisory mention uses `@username`.

### Validation Rules
1. **Length**: 3 to 30 characters inclusive.
2. **Allowed Characters**: Lowercase letters (`a-z`), numbers (`0-9`), underscores (`_`), and periods (`.`).
3. **Canonical Normalization**: Stored in `username_normalized` in lower case with whitespace and leading `@` stripped.
4. **Uniqueness**: Enforced via PostgreSQL database constraint:
   ```sql
   ALTER TABLE public.profiles ADD CONSTRAINT uq_profiles_username_normalized UNIQUE (username_normalized);
   ```
5. **Reserved Words Protected**: `admin`, `system`, `farmpilot`, `root`, `support`, `moderator`, `help`.

### Username Change Workflow
When a user updates their username:
1. Regex validation and normalization are executed.
2. The database checks `uq_profiles_username_normalized` constraint to prevent race conditions.
3. Foreign keys across messages, activities, and financial entries link to immutable `id UUID`, meaning a username change **never corrupts historical records**.
4. An audit record is logged into `security_audit_logs`.

---

## 4. Authentication Flows

### Sign In Flow
1. User provides `@username` or `email` and password.
2. If `@username` is supplied, `FarmPilotAuth` resolves the email via `profiles.username` lookup.
3. Invokes `supabase.auth.signInWithPassword({ email, password })`.
4. On success:
   - Sets Supabase active session with auto-token refresh.
   - Queries `public.profiles` and `organization_members` for the authenticated user's role.
   - Logs `LOGIN_SUCCESS` to `security_audit_logs`.
   - Dispatches `farmpilot:auth-changed` event and routes to `dashboard.html` (or `worker.html` for `WORKER` role).
5. On failure:
   - Clears session tokens.
   - Remains on `login.html` and renders actionable error feedback.

### Sign Up Flow
1. Form captures: Full Name, Username, Email, Password, Confirm Password.
2. Validates password minimum length (6+ characters) and format.
3. Pre-checks username availability against `public.profiles`.
4. Calls `supabase.auth.signUp({ email, password, options: { data: { full_name, username } } })`.
5. Post-signup trigger / API initializes `public.profiles` with `id = auth.users.id`.
6. Enrolls user into organization membership.

### Sign Out Flow
1. Calls `supabase.auth.signOut()`.
2. Clears all cached session tokens from memory and storage.
3. Marks `fp_logged_out = true` to prevent stale browser navigation.
4. Redirects to `login.html`.

### Password Recovery Flow
1. User requests reset link via email.
2. Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/login.html' })`.
3. Supabase dispatches a secure cryptographic token via email.
4. The replacement password is never transmitted insecurely or stored locally.

---

## 5. Session Lifecycle & Token Security

- **Storage**: Sessions are managed by the Supabase Client SDK using standard browser storage mechanisms with short-lived JWT access tokens and long-lived refresh tokens.
- **Rotation**: Tokens are automatically refreshed prior to expiration via `onAuthStateChange('TOKEN_REFRESHED')`.
- **Token Redaction**: Tokens and credentials are **never printed to console logs** or transmitted in plaintext query parameters.
- **Service Role Key Security**: `SUPABASE_SERVICE_ROLE_KEY` is **strictly prohibited** from browser code. The browser client only utilizes `VITE_SUPABASE_ANON_KEY`, relying on PostgreSQL Row Level Security as the authorization barrier.
