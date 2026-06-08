/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { ProjectStatus } from "@/lib/types";

export async function submitChecklist(input: {
  projectId: string;
  userId: string;
  templateId: string;
  stage: ProjectStatus;
  responses: Record<string, unknown>;
  remarks: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("checklist_responses").insert({
    project_id: input.projectId,
    template_id: input.templateId,
    user_id: input.userId,
    stage: input.stage,
    responses: input.responses,
    remarks: input.remarks,
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

export async function logFileRecord(input: {
  projectId: string;
  userId: string;
  stage: ProjectStatus;
  filePath: string;
  fileName: string;
  fileType: string;
  remarks?: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_files").insert({
    project_id: input.projectId,
    user_id: input.userId,
    stage: input.stage,
    file_path: input.filePath,
    file_name: input.fileName,
    file_type: input.fileType,
    remarks: input.remarks || null,
  });
  if (error) return { error: error.message };
  return {};
}
