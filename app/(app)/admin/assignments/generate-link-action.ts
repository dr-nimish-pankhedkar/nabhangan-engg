/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const Schema = z.object({
  project_id: z.string().uuid(),
  expiry_hours: z.number().int().min(1).max(360),
  surveyor_name: z.string().min(1).max(200),
});

export async function generateThirdPartyToken(input: {
  project_id: string;
  expiry_hours: number;
  surveyor_name: string;
}): Promise<{ error?: string; token?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const expires_at = new Date(
    Date.now() + parsed.data.expiry_hours * 60 * 60 * 1000
  ).toISOString();

  const admin = await createAdminClient();

  // Guard: project must currently be in the survey stage
  const { data: project } = await admin
    .from("projects")
    .select("status")
    .eq("id", parsed.data.project_id)
    .single();

  if (!project) return { error: "Project not found." };
  if (project.status !== "survey") {
    return { error: "This project is not in the Survey stage. Survey links can only be generated while the project is at Survey stage." };
  }

  // Guard: no non-revoked stage submission exists (staff or prior third-party)
  const { data: existing } = await admin
    .from("stage_submissions")
    .select("id, revoked_by")
    .eq("project_id", parsed.data.project_id)
    .eq("stage", "survey")
    .maybeSingle();

  if (existing && !existing.revoked_by) {
    return { error: "Survey has already been submitted for this project. Revoke the Survey stage first before generating a new link." };
  }

  // Guard: no prior third-party token already used for this project
  const { data: usedToken } = await admin
    .from("third_party_tokens")
    .select("id")
    .eq("project_id", parsed.data.project_id)
    .not("used_at", "is", null)
    .maybeSingle();

  if (usedToken) {
    return { error: "A third-party survey has already been submitted for this project. Revoke the Survey stage first before generating a new link." };
  }

  const { data, error } = await admin
    .from("third_party_tokens")
    .insert({
      project_id: parsed.data.project_id,
      stage: "survey",
      surveyor_name: parsed.data.surveyor_name,
      expires_at,
      created_by: user.id,
    })
    .select("token")
    .single();

  if (error || !data) return { error: error?.message || "Failed to generate token" };
  return { token: String(data.token) };
}
