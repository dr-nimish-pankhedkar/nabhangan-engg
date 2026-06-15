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
const StageSchema = z.enum(["lead", "survey", "drafting", "report", "review"]);

const LogFileSchema = z.object({
  projectId: z.string().uuid(),
  stage: StageSchema,
  filePath: z.string().min(1).max(1000),
  fileName: z.string().min(1).max(500),
  fileType: z.string().max(100),
  remarks: z.string().max(1000).optional(),
});

export async function submitChecklist(input: {
  projectId: string;
  userId: string;
  templateId: string;
  stage: ProjectStatus;
  responses: Record<string, unknown>;
  remarks: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  if (!UUIDSchema.safeParse(input.projectId).success) return { error: "Invalid project ID" };
  if (!UUIDSchema.safeParse(input.templateId).success) return { error: "Invalid template ID" };
  if (!StageSchema.safeParse(input.stage).success) return { error: "Invalid stage" };

  const { error } = await supabase.from("checklist_responses").insert({
    project_id: input.projectId,
    template_id: input.templateId,
    user_id: user.id,
    stage: input.stage,
    responses: input.responses,
    remarks: input.remarks,
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
    remarks: parsed.data.remarks || null,
  });
  if (error) return { error: error.message };
  return {};
}

export async function saveSiteVisitReport(input: {
  projectId: string;
  data: Record<string, string>;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  if (!UUIDSchema.safeParse(input.projectId).success) return { error: "Invalid project ID" };

  const { error } = await supabase.from("site_visit_reports").upsert({
    project_id: input.projectId,
    user_id: user.id,
    data: input.data,
    updated_at: new Date().toISOString(),
  }, { onConflict: "project_id" });

  if (error) return { error: error.message };
  return {};
}

export async function submitSiteVisitReport(input: {
  projectId: string;
  data: Record<string, string>;
}): Promise<{ error?: string }> {
  const saveResult = await saveSiteVisitReport(input);
  if (saveResult.error) return saveResult;
  return advanceStage(input.projectId, "drafting");
}

const UpdateCaseSchema = z.object({
  bank_name: z.string().min(1).max(200),
  project_address: z.string().min(1).max(1000),
  bank_metadata: z.record(z.string(), z.unknown()),
});

export async function updateCaseInfoFromSurvey(
  projectId: string,
  input: {
    bank_name: string;
    project_address: string;
    bank_metadata: Record<string, unknown>;
  }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  if (!UUIDSchema.safeParse(projectId).success) return { error: "Invalid project ID" };
  const parsed = UpdateCaseSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const { error } = await supabase.from("projects").update({
    bank_name: parsed.data.bank_name,
    project_address: parsed.data.project_address,
    bank_metadata: parsed.data.bank_metadata,
  }).eq("id", projectId);

  if (error) return { error: error.message };
  return {};
}
