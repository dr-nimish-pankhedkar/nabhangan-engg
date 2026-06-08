/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { ProjectStatus } from "@/lib/types";

export async function startSurvey(projectId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ status: "survey" }).eq("id", projectId);
  if (error) return { error: error.message };
  return {};
}

export async function advanceProjectStage(projectId: string, nextStatus: ProjectStatus): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ status: nextStatus }).eq("id", projectId);
  if (error) return { error: error.message };
  return {};
}
