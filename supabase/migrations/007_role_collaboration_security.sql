-- ============================================================================
-- FarmPilot Phase 2.1: Role-Aware Collaboration and Scoped Security
-- Additive migration. Existing farms, crops, activities, and intelligence remain.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS app_private;

-- 1. Explicit farm and field scope. Organization membership alone is not access.
CREATE TABLE IF NOT EXISTS public.farm_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'MANAGER', 'WORKER', 'CONSULTANT')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INVITED', 'INACTIVE')),
  access_from DATE,
  access_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (farm_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.field_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_from DATE,
  access_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (field_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_farm_members_user_scope ON public.farm_members(user_id, farm_id, status);
CREATE INDEX IF NOT EXISTS idx_field_members_user_scope ON public.field_members(user_id, field_id);

-- 2. Activity verification lifecycle and traceability fields.
DO $$
BEGIN
  ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS requires_verification BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS submission_status TEXT NOT NULL DEFAULT 'DRAFT';
  ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
  ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
  ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS source_issue_id UUID;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activities_submission_status_check') THEN
    ALTER TABLE public.activities ADD CONSTRAINT activities_submission_status_check
      CHECK (submission_status IN ('DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'VERIFIED', 'COMPLETED'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activities_submission_status ON public.activities(submission_status);
CREATE INDEX IF NOT EXISTS idx_activities_submitted_by ON public.activities(submitted_by);

-- 3. Field observation -> issue -> action workflow.
CREATE TABLE IF NOT EXISTS public.field_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  observation_type TEXT NOT NULL CHECK (observation_type IN ('PEST', 'WATER_STRESS', 'WEED', 'CROP_CONDITION', 'DAMAGE', 'OTHER')),
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED' CHECK (status IN ('REVIEW_REQUIRED', 'REVIEWED', 'ACTION_CREATED', 'RESOLVED')),
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.farm_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  observation_id UUID REFERENCES public.field_observations(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('WATER', 'CROP', 'EQUIPMENT', 'INPUT', 'SAFETY', 'TASK', 'OTHER')),
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'ACTION_CREATED', 'RESOLVED')),
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_observations_farm_status ON public.field_observations(farm_id, status);
CREATE INDEX IF NOT EXISTS idx_issues_farm_status ON public.farm_issues(farm_id, status);

-- 4. Contextual documents, comments, advisory notes, notifications.
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('INSTRUCTION', 'EVIDENCE', 'INVOICE', 'REPORT', 'ADVISORY', 'OTHER')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size > 0 AND byte_size <= 26214400),
  visibility TEXT NOT NULL CHECK (visibility IN ('PRIVATE', 'ROLE_ONLY', 'FARM_TEAM', 'FARM_WIDE', 'ORGANIZATION', 'ASSIGNED_USERS')),
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_users (
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  observation_id UUID REFERENCES public.field_observations(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES public.farm_issues(id) ON DELETE CASCADE,
  recommendation_id TEXT REFERENCES public.recommendations(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 4000),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(activity_id, document_id, observation_id, issue_id, recommendation_id) = 1)
);

CREATE TABLE IF NOT EXISTS public.advisory_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE SET NULL,
  observation_id UUID REFERENCES public.field_observations(id) ON DELETE SET NULL,
  recommendation_id TEXT REFERENCES public.recommendations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  issue TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACCEPTED', 'DISMISSED', 'CONVERTED_TO_ACTIVITY')),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  decided_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  decision_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_path TEXT,
  entity_type TEXT,
  entity_id TEXT,
  priority TEXT NOT NULL DEFAULT 'INFO' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_farm_context ON public.documents(farm_id, field_id, crop_cycle_id, activity_id);
CREATE INDEX IF NOT EXISTS idx_comments_farm_created ON public.comments(farm_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_advisory_farm_status ON public.advisory_notes(farm_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_id, read_at, created_at DESC);

-- 5. Scoped authorization helpers. SECURITY DEFINER is restricted to boolean lookups,
-- validates auth.uid(), and fixes search_path to avoid object shadowing.
CREATE OR REPLACE FUNCTION app_private.has_farm_access(target_farm_id UUID, allowed_roles TEXT[] DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, app_private
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.farms f
    LEFT JOIN public.farm_members fm ON fm.farm_id = f.id AND fm.user_id = auth.uid() AND fm.status = 'ACTIVE'
    LEFT JOIN public.organization_members om ON om.organization_id = f.organization_id AND om.user_id = auth.uid() AND om.status = 'ACTIVE'
    WHERE f.id = target_farm_id
      AND auth.uid() IS NOT NULL
      AND (
        f.owner_id = auth.uid()
        OR (fm.user_id IS NOT NULL AND (allowed_roles IS NULL OR fm.role = ANY(allowed_roles)))
        OR (om.user_id IS NOT NULL AND om.role = 'OWNER' AND (allowed_roles IS NULL OR 'OWNER' = ANY(allowed_roles)))
      )
      AND (fm.access_from IS NULL OR fm.access_from <= CURRENT_DATE)
      AND (fm.access_until IS NULL OR fm.access_until >= CURRENT_DATE)
  );
$$;

CREATE OR REPLACE FUNCTION app_private.has_field_access(target_field_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, app_private
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.fields f
    WHERE f.id = target_field_id
      AND (
        app_private.has_farm_access(f.farm_id)
        OR EXISTS (
          SELECT 1 FROM public.field_members fm
          WHERE fm.field_id = f.id AND fm.user_id = auth.uid()
            AND (fm.access_from IS NULL OR fm.access_from <= CURRENT_DATE)
            AND (fm.access_until IS NULL OR fm.access_until >= CURRENT_DATE)
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION app_private.has_farm_access(UUID, TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.has_field_access(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.has_farm_access(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.has_field_access(UUID) TO authenticated;

-- 6. RLS policies. Every exposed collaboration table is tenant and scope bound.
ALTER TABLE public.farm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS farm_members_select_scoped ON public.farm_members;
CREATE POLICY farm_members_select_scoped ON public.farm_members FOR SELECT TO authenticated
USING (app_private.has_farm_access(farm_id) OR user_id = auth.uid());
DROP POLICY IF EXISTS farm_members_manage_owner_manager ON public.farm_members;
CREATE POLICY farm_members_manage_owner_manager ON public.farm_members FOR ALL TO authenticated
USING (app_private.has_farm_access(farm_id, ARRAY['OWNER', 'MANAGER']))
WITH CHECK (app_private.has_farm_access(farm_id, ARRAY['OWNER', 'MANAGER']));

DROP POLICY IF EXISTS field_members_select_scoped ON public.field_members;
CREATE POLICY field_members_select_scoped ON public.field_members FOR SELECT TO authenticated
USING (app_private.has_field_access(field_id) OR user_id = auth.uid());
DROP POLICY IF EXISTS field_members_manage_owner_manager ON public.field_members;
CREATE POLICY field_members_manage_owner_manager ON public.field_members FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.fields f
  WHERE f.id = field_id AND app_private.has_farm_access(f.farm_id, ARRAY['OWNER', 'MANAGER'])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.fields f
  WHERE f.id = field_id AND app_private.has_farm_access(f.farm_id, ARRAY['OWNER', 'MANAGER'])
));

DROP POLICY IF EXISTS observations_select_scoped ON public.field_observations;
CREATE POLICY observations_select_scoped ON public.field_observations FOR SELECT TO authenticated
USING (app_private.has_field_access(field_id));
DROP POLICY IF EXISTS observations_worker_insert ON public.field_observations;
CREATE POLICY observations_worker_insert ON public.field_observations FOR INSERT TO authenticated
WITH CHECK (submitted_by = auth.uid() AND app_private.has_field_access(field_id));
DROP POLICY IF EXISTS observations_manager_update ON public.field_observations;
CREATE POLICY observations_manager_update ON public.field_observations FOR UPDATE TO authenticated
USING (app_private.has_farm_access(farm_id, ARRAY['OWNER', 'MANAGER', 'CONSULTANT']))
WITH CHECK (app_private.has_farm_access(farm_id, ARRAY['OWNER', 'MANAGER', 'CONSULTANT']));

DROP POLICY IF EXISTS issues_select_scoped ON public.farm_issues;
CREATE POLICY issues_select_scoped ON public.farm_issues FOR SELECT TO authenticated
USING (app_private.has_farm_access(farm_id));
DROP POLICY IF EXISTS issues_worker_insert ON public.farm_issues;
CREATE POLICY issues_worker_insert ON public.farm_issues FOR INSERT TO authenticated
WITH CHECK (reported_by = auth.uid() AND app_private.has_farm_access(farm_id, ARRAY['OWNER', 'MANAGER', 'WORKER']));
DROP POLICY IF EXISTS issues_manager_update ON public.farm_issues;
CREATE POLICY issues_manager_update ON public.farm_issues FOR UPDATE TO authenticated
USING (app_private.has_farm_access(farm_id, ARRAY['OWNER', 'MANAGER']))
WITH CHECK (app_private.has_farm_access(farm_id, ARRAY['OWNER', 'MANAGER']));

DROP POLICY IF EXISTS documents_select_scoped ON public.documents;
CREATE POLICY documents_select_scoped ON public.documents FOR SELECT TO authenticated
USING (
  uploaded_by = auth.uid()
  OR app_private.has_farm_access(farm_id)
  OR (visibility = 'ASSIGNED_USERS' AND EXISTS (SELECT 1 FROM public.document_users du WHERE du.document_id = id AND du.user_id = auth.uid()))
);
DROP POLICY IF EXISTS documents_upload_scoped ON public.documents;
CREATE POLICY documents_upload_scoped ON public.documents FOR INSERT TO authenticated
WITH CHECK (uploaded_by = auth.uid() AND app_private.has_farm_access(farm_id, ARRAY['OWNER', 'MANAGER', 'CONSULTANT', 'WORKER']));
DROP POLICY IF EXISTS documents_update_owner_manager ON public.documents;
CREATE POLICY documents_update_owner_manager ON public.documents FOR UPDATE TO authenticated
USING (uploaded_by = auth.uid() OR app_private.has_farm_access(farm_id, ARRAY['OWNER', 'MANAGER']))
WITH CHECK (uploaded_by = auth.uid() OR app_private.has_farm_access(farm_id, ARRAY['OWNER', 'MANAGER']));

DROP POLICY IF EXISTS document_users_select_scoped ON public.document_users;
CREATE POLICY document_users_select_scoped ON public.document_users FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND (d.uploaded_by = auth.uid() OR app_private.has_farm_access(d.farm_id))));
DROP POLICY IF EXISTS document_users_manage_uploader ON public.document_users;
CREATE POLICY document_users_manage_uploader ON public.document_users FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.uploaded_by = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND d.uploaded_by = auth.uid()));

DROP POLICY IF EXISTS comments_select_scoped ON public.comments;
CREATE POLICY comments_select_scoped ON public.comments FOR SELECT TO authenticated
USING (app_private.has_farm_access(farm_id));
DROP POLICY IF EXISTS comments_insert_scoped ON public.comments;
CREATE POLICY comments_insert_scoped ON public.comments FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND app_private.has_farm_access(farm_id));
DROP POLICY IF EXISTS comments_update_author ON public.comments;
CREATE POLICY comments_update_author ON public.comments FOR UPDATE TO authenticated
USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS advisory_select_scoped ON public.advisory_notes;
CREATE POLICY advisory_select_scoped ON public.advisory_notes FOR SELECT TO authenticated
USING (app_private.has_farm_access(farm_id));
DROP POLICY IF EXISTS advisory_consultant_insert ON public.advisory_notes;
CREATE POLICY advisory_consultant_insert ON public.advisory_notes FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND app_private.has_farm_access(farm_id, ARRAY['OWNER', 'MANAGER', 'CONSULTANT']));
DROP POLICY IF EXISTS advisory_manager_decision ON public.advisory_notes;
CREATE POLICY advisory_manager_decision ON public.advisory_notes FOR UPDATE TO authenticated
USING (app_private.has_farm_access(farm_id, ARRAY['OWNER', 'MANAGER']))
WITH CHECK (app_private.has_farm_access(farm_id, ARRAY['OWNER', 'MANAGER']));

DROP POLICY IF EXISTS notifications_recipient_select ON public.notifications;
CREATE POLICY notifications_recipient_select ON public.notifications FOR SELECT TO authenticated
USING (recipient_id = auth.uid());
DROP POLICY IF EXISTS notifications_recipient_update ON public.notifications;
CREATE POLICY notifications_recipient_update ON public.notifications FOR UPDATE TO authenticated
USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

-- 7. Secure worker submission function. Workers cannot update arbitrary activity fields.
CREATE OR REPLACE FUNCTION app_private.submit_activity(
  target_activity_id UUID,
  submitted_note TEXT DEFAULT NULL,
  submitted_quantity TEXT DEFAULT NULL,
  submitted_hours NUMERIC DEFAULT NULL
)
RETURNS public.activities
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, app_private
AS $$
DECLARE
  target public.activities;
  updated public.activities;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO target FROM public.activities WHERE id = target_activity_id FOR UPDATE;
  IF target.id IS NULL THEN RAISE EXCEPTION 'Activity not found'; END IF;
  IF target.assigned_to IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Activity is not assigned to the current worker'; END IF;
  IF NOT app_private.has_farm_access(target.farm_id, ARRAY['WORKER', 'MANAGER', 'OWNER']) THEN RAISE EXCEPTION 'Farm access denied'; END IF;

  UPDATE public.activities
  SET status = CASE WHEN requires_verification THEN 'IN_PROGRESS' ELSE 'COMPLETED' END,
      submission_status = CASE WHEN requires_verification THEN 'SUBMITTED' ELSE 'COMPLETED' END,
      field_note = COALESCE(submitted_note, field_note),
      actual_quantity = COALESCE(submitted_quantity, actual_quantity),
      hours_worked = COALESCE(submitted_hours, hours_worked),
      submitted_by = auth.uid(),
      submitted_at = now(),
      completed_date = CASE WHEN requires_verification THEN NULL ELSE CURRENT_DATE END,
      updated_at = now()
  WHERE id = target_activity_id
  RETURNING * INTO updated;
  RETURN updated;
END;
$$;

REVOKE ALL ON FUNCTION app_private.submit_activity(UUID, TEXT, TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.submit_activity(UUID, TEXT, TEXT, NUMERIC) TO authenticated;

-- 8. Private Storage bucket for contextual documents and evidence.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('farm-documents', 'farm-documents', false, 26214400, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/csv'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 26214400;

DROP POLICY IF EXISTS farm_documents_storage_select ON storage.objects;
CREATE POLICY farm_documents_storage_select ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'farm-documents' AND EXISTS (
  SELECT 1 FROM public.documents d
  WHERE d.storage_path = name
    AND (d.uploaded_by = auth.uid() OR app_private.has_farm_access(d.farm_id))
));

DROP POLICY IF EXISTS farm_documents_storage_insert ON storage.objects;
CREATE POLICY farm_documents_storage_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'farm-documents' AND EXISTS (
  SELECT 1 FROM public.farms f
  WHERE f.id::text = split_part(name, '/', 2)
    AND app_private.has_farm_access(f.id, ARRAY['OWNER', 'MANAGER', 'CONSULTANT', 'WORKER'])
));

DROP POLICY IF EXISTS farm_documents_storage_delete ON storage.objects;
CREATE POLICY farm_documents_storage_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'farm-documents' AND EXISTS (
  SELECT 1 FROM public.documents d
  WHERE d.storage_path = name
    AND (d.uploaded_by = auth.uid() OR app_private.has_farm_access(d.farm_id, ARRAY['OWNER', 'MANAGER']))
));
