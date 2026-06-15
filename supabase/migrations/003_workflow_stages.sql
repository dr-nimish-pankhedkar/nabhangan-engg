/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

-- Add new 8-stage workflow values to the project_status enum.
-- New pipeline: lead → survey → rate_verification → drafting → checking → print → scan → dispatch
-- Note: 'report' and 'review' (old stages) are left in the enum — Postgres
-- does not support removing enum values without recreating the type.
-- They are simply unused going forward.

ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'rate_verification' AFTER 'survey';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'checking' AFTER 'drafting';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'print' AFTER 'checking';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'scan' AFTER 'print';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'dispatch' AFTER 'scan';
