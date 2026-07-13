-- Add fees_received stage to the project_status enum
-- Run this migration in the Supabase SQL editor before deploying the app update.

ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'fees_received' AFTER 'dispatch';
