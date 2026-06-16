/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const TokenSchema = z.string().uuid();

async function validateToken(token: string) {
  if (!TokenSchema.safeParse(token).success) return { error: "Invalid token" as const, tokenRow: null };
  const admin = await createAdminClient();
  const { data } = await admin
    .from("third_party_tokens")
    .select("id, project_id, expires_at, used_at, created_by")
    .eq("token", token)
    .single();
  if (!data) return { error: "Invalid token" as const, tokenRow: null };
  if (data.used_at) return { error: "This link has already been submitted." as const, tokenRow: null };
  if (new Date(data.expires_at) < new Date()) return { error: "This link has expired." as const, tokenRow: null };
  return { error: null, tokenRow: data };
}

export async function saveThirdPartyDraft(
  token: string,
  data: Record<string, string>
): Promise<{ error?: string }> {
  const { error, tokenRow } = await validateToken(token);
  if (error || !tokenRow) return { error: error ?? "Invalid token" };

  const admin = await createAdminClient();
  const { error: dbError } = await admin.from("site_visit_reports").upsert(
    {
      project_id: tokenRow.project_id,
      user_id: tokenRow.created_by,
      data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id" }
  );
  if (dbError) return { error: dbError.message };
  return {};
}

export async function submitThirdPartyReport(
  token: string,
  data: Record<string, string>
): Promise<{ error?: string }> {
  const { error, tokenRow } = await validateToken(token);
  if (error || !tokenRow) return { error: error ?? "Invalid token" };

  const admin = await createAdminClient();

  // Guard: project must still be at survey stage
  const { data: proj } = await admin
    .from("projects")
    .select("status")
    .eq("id", tokenRow.project_id)
    .single();
  if (proj?.status !== "survey") {
    return { error: "This project has moved past the Survey stage. This link is no longer valid." };
  }

  // Atomically mark token as used — if used_at is already set (concurrent request), this matches 0 rows
  const { data: claimedToken, error: claimError } = await admin
    .from("third_party_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenRow.id)
    .is("used_at", null)
    .select("id");
  if (claimError) return { error: claimError.message };
  if (!claimedToken || claimedToken.length === 0) {
    return { error: "This link has already been submitted." };
  }

  // Save the report
  const { error: saveError } = await admin.from("site_visit_reports").upsert(
    {
      project_id: tokenRow.project_id,
      user_id: tokenRow.created_by,
      data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "project_id" }
  );
  if (saveError) return { error: saveError.message };

  // Record stage submission so revocation works uniformly
  await admin.from("stage_submissions").upsert({
    project_id: tokenRow.project_id,
    stage: "survey",
    submitted_by: tokenRow.created_by,
    submitted_at: new Date().toISOString(),
    revoked_by: null,
    revoked_at: null,
  }, { onConflict: "project_id,stage" });

  // Advance project to rate_verification (only if still at survey to guard against a concurrent staff submission)
  await admin
    .from("projects")
    .update({ status: "rate_verification" })
    .eq("id", tokenRow.project_id)
    .eq("status", "survey");

  return {};
}
