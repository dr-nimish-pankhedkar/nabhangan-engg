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

const TimeLogSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  stage: StageSchema,
  hours_spent: z.number().positive(),
  notes: z.string().nullable(),
});

const LogFileSchema = z.object({
  projectId: z.string().uuid(),
  stage: StageSchema,
  filePath: z.string().min(1).max(1000),
  fileName: z.string().min(1).max(500),
  fileType: z.string().max(100),
  remarks: z.string().max(1000).optional(),
});

async function requireSurveyAccess(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, projectId: string) {
  const [{ data: profile }, { data: asgn }] = await Promise.all([
    supabase.from("profiles").select("role, is_active").eq("id", userId).single(),
    supabase.from("project_assignments").select("id").eq("project_id", projectId).eq("user_id", userId).eq("stage", "survey").maybeSingle(),
  ]);
  if (!profile?.is_active) return "Account is inactive.";
  if (profile?.role !== "admin" && !asgn) return "You are not assigned to this project's Survey stage.";
  return null;
}

export async function logTime(input: {
  projectId: string;
  userId: string;
  stage: string;
  hours_spent: number;
  notes: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  const parsed = TimeLogSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };
  const accessError = await requireSurveyAccess(supabase, user.id, parsed.data.projectId);
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
  const accessError = await requireSurveyAccess(supabase, user.id, input.projectId);
  if (accessError) return { error: accessError };
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

export async function advanceStage(projectId: string, _newStatus: ProjectStatus): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };
  if (!UUIDSchema.safeParse(projectId).success) return { error: "Invalid project ID" };

  const { data: proj } = await supabase.from("projects").select("status").eq("id", projectId).single();
  if (!proj) return { error: "Project not found." };
  if (proj.status !== "survey") return { error: "Project is not at the Survey stage." };

  const accessError = await requireSurveyAccess(supabase, user.id, projectId);
  if (accessError) return { error: accessError };

  await supabase.from("stage_submissions").upsert({
    project_id: projectId,
    stage: "survey",
    submitted_by: user.id,
    submitted_at: new Date().toISOString(),
    revoked_by: null,
    revoked_at: null,
  }, { onConflict: "project_id,stage" });
  const { error } = await supabase.from("projects").update({ status: "rate_verification" }).eq("id", projectId);
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
  const accessError = await requireSurveyAccess(supabase, user.id, parsed.data.projectId);
  if (accessError) return { error: accessError };
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
  const accessError = await requireSurveyAccess(supabase, user.id, input.projectId);
  if (accessError) return { error: accessError };
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
  return advanceStage(input.projectId, "rate_verification");
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
  const accessError = await requireSurveyAccess(supabase, user.id, projectId);
  if (accessError) return { error: accessError };
  const { error } = await supabase.from("projects").update({
    bank_name: parsed.data.bank_name,
    project_address: parsed.data.project_address,
    bank_metadata: parsed.data.bank_metadata,
  }).eq("id", projectId);
  if (error) return { error: error.message };
  return {};
}
