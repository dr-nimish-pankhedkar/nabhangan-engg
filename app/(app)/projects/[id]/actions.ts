/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { ProjectStatus } from "@/lib/types";
import { z } from "zod";

const ProjectIdSchema = z.string().uuid();
const StatusSchema = z.enum(["lead", "survey", "drafting", "report", "review"]);

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: "Unauthenticated" as const };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { supabase, user, error: "Forbidden" as const };
  return { supabase, user, error: null };
}

export async function startSurvey(projectId: string): Promise<{ error?: string }> {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };
  if (!ProjectIdSchema.safeParse(projectId).success) return { error: "Invalid project ID" };
  const { error: dbError } = await supabase.from("projects").update({ status: "survey" }).eq("id", projectId);
  if (dbError) return { error: dbError.message };
  return {};
}

export async function advanceProjectStage(projectId: string, nextStatus: ProjectStatus): Promise<{ error?: string }> {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };
  if (!ProjectIdSchema.safeParse(projectId).success) return { error: "Invalid project ID" };
  if (!StatusSchema.safeParse(nextStatus).success) return { error: "Invalid status" };
  const { error: dbError } = await supabase.from("projects").update({ status: nextStatus }).eq("id", projectId);
  if (dbError) return { error: dbError.message };
  return {};
}
