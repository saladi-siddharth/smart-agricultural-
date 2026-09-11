# FarmPilot Community Direct Messaging & Real-Time Collaboration

## 1. Overview

Community direct messaging in FarmPilot is a production communication network purpose-built for precision agriculture. It enables verified farmers, estate operations managers, field workers, and agronomists to exchange critical field intelligence, pest alerts, AWD water schedules, and machinery hire requests.

Unlike ephemeral chat widgets, all conversations and messages are persisted in PostgreSQL, governed by Row Level Security, delivered instantaneously via Supabase Realtime, and monitored by unread notification counters.

```
 User A (Sender)                    PostgreSQL Database                   User B (Recipient)
       │                                     │                                    │
       │── 1. Send Message ─────────────────►│                                    │
       │   (body, client_message_id)         │                                    │
       │                                     │── 2. Persist Message & ───────────►│
       │                                     │      Generate Notification Row     │
       │                                     │                                    │
       │                                     │── 3. Supabase Realtime ───────────►│
       │                                     │      WebSocket Broadcast           │
       │                                     │                                    │
       │                                     │                                    ▼
       │                                     │                         Unread Badge Increments (💬 1)
       │                                     │                         Message Displayed in Thread
       │                                     │                                    │
       │                                     │◄── 4. Mark As Read (Open Thread) ──┘
       │                                     │       (read_at updated)
       │                                     │
       │◄── 5. Realtime Read Status ─────────┤
```

---

## 2. Relational Data Model

### A. Conversations (`public.conversations`)
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `conversation_type TEXT DEFAULT 'DIRECT' CHECK (conversation_type IN ('DIRECT', 'GROUP', 'ADVISORY'))`
- `initiator_username TEXT NOT NULL`
- `recipient_username TEXT NOT NULL`
- `status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED'))`
- `last_message TEXT`
- `last_message_at TIMESTAMPTZ DEFAULT NOW()`
- `accepted_at TIMESTAMPTZ`
- `created_at TIMESTAMPTZ DEFAULT NOW()`

### B. Conversation Members (`public.conversation_members`)
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE`
- `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
- `username TEXT NOT NULL`
- `joined_at TIMESTAMPTZ DEFAULT NOW()`
- `last_read_at TIMESTAMPTZ`
- `status TEXT DEFAULT 'ACTIVE'`
- `UNIQUE(conversation_id, user_id)`

### C. Messages (`public.messages`)
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE`
- `sender_id UUID REFERENCES auth.users(id)`
- `sender_username TEXT NOT NULL`
- `recipient_username TEXT NOT NULL`
- `body TEXT NOT NULL`
- `reference_type TEXT CHECK (reference_type IN ('TASK', 'ACTIVITY', 'FIELD', 'CROP', 'ISSUE', 'DOCUMENT'))`
- `reference_id UUID`
- `client_message_id TEXT UNIQUE` -- Enforces network retry idempotency
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `edited_at TIMESTAMPTZ`
- `deleted_at TIMESTAMPTZ` -- Soft deletion support
- `read_at TIMESTAMPTZ`

---

## 3. Privacy-Preserving User Search

Public community directory search strictly isolates private personal and farm data:

```sql
-- Safe public profile directory query
SELECT id, username, full_name, role, avatar_url, bio, agricultural_interests
FROM public.profiles
WHERE username_normalized ILIKE '%' || p_search_term || '%'
LIMIT 25;
```

- **Exposed**: `@username`, display name, agricultural role badge, avatar, public agronomy bio.
- **Strictly Redacted**: Email address, phone number, private farm financial ledgers, organization administration settings.

---

## 4. Handshake Security: Accept / Reject Gateway

To prevent unsolicited contact and spam between farmers and external vendors, direct messages initialize in a controlled gateway state:

1. **First-Time Contact (`PENDING`)**: When User A sends an initial message to User B, the conversation is marked `PENDING`. User A cannot spam additional messages until accepted.
2. **Recipient Review**: User B sees an incoming message request under the **Requests** tab with full context.
3. **Acceptance (`ACCEPTED`)**: When User B clicks Accept (or replies to the message), the conversation transitions to `ACCEPTED`. Realtime two-way messaging is activated.
4. **Rejection (`REJECTED`)**: If User B declines the request, the conversation transitions to `REJECTED`. Subsequent message insertions are blocked by validation and RLS.

---

## 5. Idempotency & Network Failure Resilience

To prevent duplicate messages caused by double-clicking the send button or retrying over poor rural mobile connectivity:
- The client generates a unique `client_message_id` (`cmid-${timestamp}-${random}`).
- The `messages` table enforces a unique constraint on `client_message_id`.
- If a retry attempt occurs with the same `client_message_id`, PostgreSQL rejects the duplicate row, and the client treats it as an existing confirmed send.

---

## 6. Operational Agricultural Context

Messages can link directly to operational resources via `reference_type` and `reference_id`.
- *Example*: Manager Rajesh sends: *"Please inspect water level at North Block Plot A"* with `reference_type: 'FIELD'` and `reference_id: 'field-north-block'`.
- *Recipient Experience*: Worker Ramu clicks **Open Context** and is routed directly to the authorized field view. Row Level Security guarantees that clicking the link only reveals data the recipient is authorized to view.
