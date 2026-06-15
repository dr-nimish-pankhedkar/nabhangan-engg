/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { ProjectStatus } from "@/lib/types";
import { z } from "zod";

const UUIDSchema = z.string().uuid();
const StageSchema = z.enum(["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch"]);

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

export async function advanceStage(projectId: string, newStatus: ProjectStatus): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  if (!UUIDSchema.safeParse(projectId).success) return { error: "Invalid project ID" };
  if (!StageSchema.safeParse(newStatus).success) return { error: "Invalid status" };
  const { error } = await supabase.from("projects").update({ status: newStatus }).eq("id", projectId);
  if (error) return { error: error.message };
  return {};
}
