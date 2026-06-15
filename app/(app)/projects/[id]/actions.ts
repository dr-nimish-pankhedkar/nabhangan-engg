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
const StatusSchema = z.enum(["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch"]);

const UpdateProjectSchema = z.object({
  bank_name: z.string().min(1).max(200),
  project_address: z.string().min(1).max(1000),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  bank_metadata: z.record(z.string(), z.unknown()),
});

const AssignmentSchema = z.object({
  stage: z.enum(["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch"]),
  user_id: z.string().uuid(),
});

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

export async function toggleDocumentsPending(projectId: string, pending: boolean): Promise<{ error?: string }> {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };
  if (!ProjectIdSchema.safeParse(projectId).success) return { error: "Invalid project ID" };
  if (typeof pending !== "boolean") return { error: "Invalid value" };
  const { error: dbError } = await supabase.from("projects").update({ documents_pending: pending }).eq("id", projectId);
  if (dbError) return { error: dbError.message };
  return {};
}

export async function updateProjectInfo(
  projectId: string,
  input: {
    bank_name: string;
    project_address: string;
    latitude: number | null;
    longitude: number | null;
    bank_metadata: Record<string, unknown>;
    assignments?: { stage: string; user_id: string }[];
  }
): Promise<{ error?: string }> {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };
  if (!ProjectIdSchema.safeParse(projectId).success) return { error: "Invalid project ID" };
  const parsed = UpdateProjectSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const { error: dbError } = await supabase.from("projects").update({
    bank_name: parsed.data.bank_name,
    project_address: parsed.data.project_address,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    bank_metadata: parsed.data.bank_metadata,
  }).eq("id", projectId);
  if (dbError) return { error: dbError.message };

  if (input.assignments && input.assignments.length > 0) {
    const validAssignments = input.assignments
      .map((a) => AssignmentSchema.safeParse(a))
      .filter((r) => r.success)
      .map((r) => r.data!);
    if (validAssignments.length > 0) {
      await supabase.from("project_assignments").delete().eq("project_id", projectId);
      await supabase.from("project_assignments").insert(
        validAssignments.map((a) => ({ project_id: projectId, user_id: a.user_id, stage: a.stage }))
      );
    }
  }

  return {};
}

export async function approveCase(projectId: string): Promise<{ error?: string }> {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };
  if (!ProjectIdSchema.safeParse(projectId).success) return { error: "Invalid project ID" };
  const { error: dbError } = await supabase.from("projects").update({ requires_review: false }).eq("id", projectId);
  if (dbError) return { error: dbError.message };
  return {};
}

export async function deleteProjectFiles(fileIds: string[]): Promise<{ error?: string }> {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };
  if (!Array.isArray(fileIds) || fileIds.length === 0) return {};
  const validIds = fileIds.filter((id) => ProjectIdSchema.safeParse(id).success);
  if (validIds.length === 0) return {};
  const { data: files } = await supabase.from("project_files").select("id, file_path").in("id", validIds);
  if (files && files.length > 0) {
    await supabase.storage.from("project-files").remove(files.map((f: any) => f.file_path));
  }
  const { error: dbError } = await supabase.from("project_files").delete().in("id", validIds);
  if (dbError) return { error: dbError.message };
  return {};
}

export async function revokeStageSubmission(projectId: string, stage: string): Promise<{ error?: string }> {
  const { supabase, user, error } = await requireAdmin();
  if (error) return { error };
  if (!ProjectIdSchema.safeParse(projectId).success) return { error: "Invalid project ID" };
  if (!StatusSchema.safeParse(stage).success) return { error: "Invalid stage" };
  const { error: dbError } = await supabase
    .from("stage_submissions")
    .update({ revoked_by: user!.id, revoked_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("stage", stage);
  if (dbError) return { error: dbError.message };
  return {};
}
