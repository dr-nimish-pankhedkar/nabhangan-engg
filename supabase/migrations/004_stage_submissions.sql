/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

-- Track which stages have been submitted (locked) by staff.
-- Admins can revoke a lock to allow re-editing.
-- On re-submission after revoke, the record is upserted (revoked fields cleared).

CREATE TABLE IF NOT EXISTS public.stage_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_by UUID REFERENCES public.profiles(id),
  revoked_at TIMESTAMPTZ,
  UNIQUE(project_id, stage)
);

ALTER TABLE public.stage_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stage_submissions_select"
  ON public.stage_submissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "stage_submissions_insert"
  ON public.stage_submissions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "stage_submissions_update"
  ON public.stage_submissions FOR UPDATE
  USING (auth.uid() IS NOT NULL);
