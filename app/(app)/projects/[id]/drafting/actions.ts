/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { ProjectStatus } from "@/lib/types";

export async function logFileRecord(input: {
  projectId: string;
  userId: string;
  stage: ProjectStatus;
  filePath: string;
  fileName: string;
  fileType: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_files").insert({
    project_id: input.projectId,
    user_id: input.userId,
    stage: input.stage,
    file_path: input.filePath,
    file_name: input.fileName,
    file_type: input.fileType,
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
  const { error } = await supabase.from("time_logs").insert({
    project_id: input.projectId,
    user_id: input.userId,
    stage: input.stage,
    hours_spent: input.hours_spent,
    notes: input.notes,
  });
  if (error) return { error: error.message };
  return {};
}

export async function advanceStage(projectId: string, newStatus: ProjectStatus): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ status: newStatus }).eq("id", projectId);
  if (error) return { error: error.message };
  return {};
}
