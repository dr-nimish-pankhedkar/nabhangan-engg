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
  expiry_hours: z.number().int().min(1).max(168),
});

export async function generateThirdPartyToken(input: {
  project_id: string;
  expiry_hours: number;
}): Promise<{ error?: string; token?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Forbidden" };

  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const expires_at = new Date(
    Date.now() + parsed.data.expiry_hours * 60 * 60 * 1000
  ).toISOString();

  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("third_party_tokens")
    .insert({
      project_id: parsed.data.project_id,
      stage: "survey",
      expires_at,
      created_by: user.id,
    })
    .select("token")
    .single();

  if (error || !data) return { error: error?.message || "Failed to generate token" };
  return { token: String(data.token) };
}
