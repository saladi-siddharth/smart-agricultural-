# FarmPilot Scalability, Indexing & Query Architecture

## 1. Overview

FarmPilot is architected to scale smoothly from a single progressive family farm to multi-thousand-hectare agricultural cooperatives and regional farmer-producer organizations (FPOs).

Growth trajectory stages:
- **Phase 1 (1–100 Users)**: Single farm, direct synchronous queries, localized WebSocket channels.
- **Phase 2 (100–5,000 Users)**: Multi-organization cooperatives, composite indexing, cursor pagination, asynchronous background queues.
- **Phase 3 (5,000+ Users)**: Horizontally scaled read replicas, table partitioning for sensor/IoT telemetry.

---

## 2. Cursor-Based Message History Pagination

To avoid high database memory consumption and slow `OFFSET` scans as conversation histories reach thousands of entries, messaging queries employ **chronological cursor pagination**:

```sql
-- Load latest 50 messages
SELECT id, conversation_id, sender_username, body, created_at
FROM public.messages
WHERE conversation_id = $1
ORDER BY created_at DESC
LIMIT 50;

-- Load older page using created_at cursor
SELECT id, conversation_id, sender_username, body, created_at
FROM public.messages
WHERE conversation_id = $1 
  AND created_at < $cursor_created_at
ORDER BY created_at DESC
LIMIT 50;
```

This guarantees $O(1)$ index traversal regardless of conversation depth.

---

## 3. Safe Username Search Scalability

Searching user directories with generic leading wildcards (`LIKE '%term%'`) forces full table scans that degrade under large datasets. FarmPilot optimizes community discovery through:
1. **Normalized Canonical Username Index**:
   ```sql
   CREATE UNIQUE INDEX idx_profiles_username_norm ON public.profiles(username_normalized);
   ```
2. **Deterministic Prefix Traversal**: Queries prioritize `username_normalized LIKE p_term || '%'` to utilize B-Tree indexing efficiently before falling back to trigram matching.

---

## 4. N+1 Query Audit & Elimination

| UI Screen | Previous Pattern (Risk) | Production Resolution | Performance Impact |
|---|---|---|:---:|
| **Dashboard Cards** | Queried each crop cycle in separate HTTP loop | Single JOIN query with aggregated stats: `farms JOIN crop_cycles` | 8 requests $\rightarrow$ 1 request |
| **Conversation List** | Fetched conversations then queried each last message | Denormalized `last_message` and `last_message_at` directly onto `conversations` row | $N+1$ queries $\rightarrow$ 1 query |
| **Notification Badge** | Loaded full notifications array to count unread | PostgreSQL `COUNT(*)` with `WHERE is_read = false` (`head: true`) | Sub-10ms unread check |
| **Activities Ledger** | Queried field details per activity item | Foreign key relationship join via PostgREST `select(*, fields(*))` | Sub-25ms multi-task view |
