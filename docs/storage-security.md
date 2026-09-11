# FarmPilot Storage Security & Asset Governance

## 1. Overview

Agricultural operations generate critical binary and media assets, including worker task completion photos (e.g., fertilizer application evidence), drone multispectral imagery, PDF soil test lab reports, harvest weighbridge receipts, and input invoices.

FarmPilot uses **Supabase Storage** with private buckets. Asset access is governed by PostgreSQL Row Level Security policies on `storage.objects` and time-limited cryptographically signed URLs. The `storage` schema is treated as read-only by application clients.

```
       Client Upload Request
                │
                ▼
       Supabase Storage API
                │
                ▼
     storage.objects (RLS)
                │
   ┌────────────┴────────────┐
   ▼                         ▼
PERMIT                     DENY
(Signed Token URL)       (403 Forbidden)
```

---

## 2. Bucket Organization

| Bucket Name | Privacy Level | Purpose | Max Size | Allowed MIME Types |
|---|---|---|---|---|
| `farm-evidence` | **Private** | Field worker task execution photos and field logs | 10 MB | `image/jpeg`, `image/png`, `image/webp` |
| `farm-documents` | **Private** | Invoices, lab soil test reports, harvest certificates | 25 MB | `application/pdf`, `image/jpeg`, `image/png` |
| `advisory-reports`| **Private** | Agronomist prescriptions, AWD water plans, IPM guides | 20 MB | `application/pdf` |
| `public-avatars` | Public | Profile pictures and farm badges | 3 MB | `image/jpeg`, `image/png`, `image/webp` |

---

## 3. Storage Hierarchy & Path Design

Storage objects follow a deterministic multi-tenant hierarchical path:

```
{organization_id}/{farm_id}/{field_id}/{crop_cycle_id}/{resource_type}/{filename}
```

*Example*:
`org-001/farm-green-valley/field-north-block/cycle-kharif-2026/evidence/task_fertilizer_01.jpg`

> [!IMPORTANT]
> Path names represent logical organization and namespace isolation; **path names alone are never the security boundary**. Access authorization is strictly validated by evaluating the user's role against the database entity linked to that path.

---

## 4. Role-Based Storage Access Policies

```sql
-- 1. Evidence Upload: Workers can upload evidence only to tasks assigned to them
CREATE POLICY "Workers can upload task evidence"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'farm-evidence' AND
  EXISTS (
    SELECT 1 FROM public.activities a
    JOIN public.farm_members fm ON fm.farm_id = a.farm_id
    WHERE fm.user_id = auth.uid()
      AND (a.assignee_id = auth.uid() OR fm.role IN ('OWNER', 'MANAGER'))
  )
);

-- 2. Document Access: Accessible only to members of that farm
CREATE POLICY "Farm members can view farm documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('farm-evidence', 'farm-documents', 'advisory-reports') AND
  EXISTS (
    SELECT 1 FROM public.farm_members fm
    WHERE fm.user_id = auth.uid()
      AND position(fm.farm_id::text IN storage.objects.name) > 0
  )
);

-- 3. Document Deletion: Restricted to Owners and Managers
CREATE POLICY "Owners and Managers can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.farm_members fm
    WHERE fm.user_id = auth.uid()
      AND fm.role IN ('OWNER', 'MANAGER')
      AND position(fm.farm_id::text IN storage.objects.name) > 0
  )
);
```

---

## 5. Security & Isolation Testing

- **Cross-Farm Access Test**: User A (Green Valley Farm) attempting to download an invoice from Krishna Delta Farm via a direct storage path is rejected with `403 Access Denied` by Supabase Storage RLS.
- **Revocation Protection**: When a document status is updated to `REVOKED` or `ARCHIVED` in `public.documents`, any active signed URLs expire, and new download URLs cannot be generated without executive authorization.
