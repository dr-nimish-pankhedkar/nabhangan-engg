-- Add surveyor_name to third_party_tokens
-- Run this in the Supabase SQL Editor after migration 005.

ALTER TABLE third_party_tokens
  ADD COLUMN IF NOT EXISTS surveyor_name TEXT NOT NULL DEFAULT '';
