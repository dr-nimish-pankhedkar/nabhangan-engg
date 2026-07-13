/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ProjectStatus } from "@/lib/types";
import { z } from "zod";

const UUIDSchema = z.string().uuid();
const StageSchema = z.enum(["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch", "fees_received"]);

const LogFileSchema = z.object({
  projectId: z.string().uuid(),
  stage: StageSchema,
  filePath: z.string().min(1).max(1000),
  fileName: z.string().min(1).max(500),
  fileType: z.string().max(100),
});

const LogTimeSchema = z.object({
  projectId: z.string().uuid(),
  stage: StageSchema,
  hours_spent: z.number().positive().max(24),
  notes: z.string().max(1000).nullable(),
});

async function requireActiveUser(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", userId).single();
  if (!profile?.is_active) return "Account is inactive.";
  return null;
}

export async function logFileRecord(input: {
  projectId: string;
  userId: string;
  stage: ProjectStatus;
  filePath: string;
  fileName: string;
  fileType: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  const parsed = LogFileSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };
  const accessError = await requireActiveUser(supabase, user.id);
  if (accessError) return { error: accessError };
  const { error } = await supabase.from("project_files").insert({
    project_id: parsed.data.projectId,
    user_id: user.id,
    stage: parsed.data.stage,
    file_path: parsed.data.filePath,
    file_name: parsed.data.fileName,
    file_type: parsed.data.fileType,
  });
  if (error) return { error: error.message };
  return {};
}

export async function logTime(input: {
  projectId: string;
  userId: string;
  stage: ProjectStatus;
  hours_spent: number;
  notes: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  const parsed = LogTimeSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };
  const accessError = await requireActiveUser(supabase, user.id);
  if (accessError) return { error: accessError };
  const { error } = await supabase.from("time_logs").insert({
    project_id: parsed.data.projectId,
    user_id: user.id,
    stage: parsed.data.stage,
    hours_spent: parsed.data.hours_spent,
    notes: parsed.data.notes,
  });
  if (error) return { error: error.message };
  return {};
}

export async function advanceStage(projectId: string, _newStatus: ProjectStatus): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  if (!UUIDSchema.safeParse(projectId).success) return { error: "Invalid project ID" };

  const { data: proj } = await supabase.from("projects").select("status").eq("id", projectId).single();
  if (!proj) return { error: "Project not found." };
  if (proj.status !== "drafting") return { error: "Project is not at the Drafting stage." };

  const accessError = await requireActiveUser(supabase, user.id);
  if (accessError) return { error: accessError };

  const admin = await createAdminClient();
  await admin.from("stage_submissions").upsert({
    project_id: projectId,
    stage: "drafting",
    submitted_by: user.id,
    submitted_at: new Date().toISOString(),
    revoked_by: null,
    revoked_at: null,
  }, { onConflict: "project_id,stage" });
  const { error } = await admin.from("projects").update({ status: "checking" }).eq("id", projectId);
  if (error) return { error: error.message };
  return {};
}
