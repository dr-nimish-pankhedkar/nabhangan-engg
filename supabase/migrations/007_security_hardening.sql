-- Security hardening: fix Supabase linter warnings
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================================================
-- 1. Fix mutable search_path on all three custom functions
--    Prevents search_path injection attacks where a malicious
--    schema earlier in the path shadows pg_catalog functions.
-- ============================================================

ALTER FUNCTION public.update_updated_at()
  SET search_path = '';

ALTER FUNCTION public.current_user_role()
  SET search_path = '';

ALTER FUNCTION public.is_assigned(uuid, public.project_status)
  SET search_path = '';

-- ============================================================
-- 2. Revoke public RPC access on handle_new_user
--    This is a trigger function — it must only be called by
--    the system on INSERT to auth.users, never via REST API.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- ============================================================
-- 3. Revoke anon access to current_user_role and is_assigned
--    Unauthenticated callers get null/false anyway (no session),
--    but there is no reason these should be callable without auth.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_assigned(uuid, public.project_status) FROM anon;

-- ============================================================
-- REMINDER (no SQL needed):
--   Enable leaked password protection in Supabase Dashboard:
--   Authentication → Sign In / Up → Password → toggle
--   "Leaked password protection" ON
-- ============================================================
