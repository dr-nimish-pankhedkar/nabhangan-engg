-- Third-party survey access tokens
-- Each token grants one-time, time-limited access to the survey stage of a project.
-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS third_party_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token      UUID        UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  project_id UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage      TEXT        NOT NULL DEFAULT 'survey',
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_by UUID        NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS third_party_tokens_token_idx   ON third_party_tokens(token);
CREATE INDEX IF NOT EXISTS third_party_tokens_project_idx ON third_party_tokens(project_id);

-- RLS: only the service role can read/write (all access is through server-side admin client)
ALTER TABLE third_party_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON third_party_tokens USING (false);
