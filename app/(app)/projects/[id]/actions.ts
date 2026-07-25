/**
 * Nabhangan Engineers — Project & Workflow Tracker
 * Copyright © 2026 Dr. Nimish Pankhedkar, Chemiligence Solutions
 * All rights reserved.
 */

"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ProjectStatus } from "@/lib/types";
import { z } from "zod";

const ProjectIdSchema = z.string().uuid();
const StatusSchema = z.enum(["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch", "fees_received"]);

const UpdateProjectSchema = z.object({
  bank_name: z.string().min(1).max(200),
  project_address: z.string().min(1).max(1000),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  bank_metadata: z.record(z.string(), z.unknown()),
});

const AssignmentSchema = z.object({
  stage: z.enum(["lead", "survey", "rate_verification", "drafting", "checking", "print", "scan", "dispatch", "fees_received"]),
  user_id: z.string().uuid().nullable(),
});

async function requireActiveUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { admin: null, user: null, error: "Unauthenticated" as const, isAdmin: false };
  const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).single();
  if (!profile?.is_active) return { admin: null, user, error: "Account is inactive." as const, isAdmin: false };
  const admin = await createAdminClient();
  return { admin, user, error: null, isAdmin: profile?.role === "admin" };
}

export async function startSurvey(projectId: string): Promise<{ error?: string }> {
  const { admin, error } = await requireActiveUser();
  if (error || !admin) return { error: error ?? "Unauthenticated" };
  if (!ProjectIdSchema.safeParse(projectId).success) return { error: "Invalid project ID" };
  const { error: dbError } = await admin.from("projects").update({ status: "survey" }).eq("id", projectId);
  if (dbError) return { error: dbError.message };
  return {};
}

export async function advanceProjectStage(projectId: string, nextStatus: ProjectStatus): Promise<{ error?: string }> {
  const { admin, error } = await requireActiveUser();
  if (error || !admin) return { error: error ?? "Unauthenticated" };
  if (!ProjectIdSchema.safeParse(projectId).success) return { error: "Invalid project ID" };
  if (!StatusSchema.safeParse(nextStatus).success) return { error: "Invalid status" };
  const { error: dbError } = await admin.from("projects").update({ status: nextStatus }).eq("id", projectId);
  if (dbError) return { error: dbError.message };
  return {};
}

export async function toggleDocumentsPending(projectId: string, pending: boolean): Promise<{ error?: string }> {
  const { admin, error } = await requireActiveUser();
  if (error || !admin) return { error: error ?? "Unauthenticated" };
  if (!ProjectIdSchema.safeParse(projectId).success) return { error: "Invalid project ID" };
  if (typeof pending !== "boolean") return { error: "Invalid value" };
  const { error: dbError } = await admin.from("projects").update({ documents_pending: pending }).eq("id", projectId);
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
    assignments?: { stage: string; user_id: string | null }[];
  }
): Promise<{ error?: string }> {
  const { admin, error } = await requireActiveUser();
  if (error || !admin) return { error: error ?? "Unauthenticated" };
  if (!ProjectIdSchema.safeParse(projectId).success) return { error: "Invalid project ID" };
  const parsed = UpdateProjectSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const { error: dbError } = await admin.from("projects").update({
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
      const stages = validAssignments.map((a) => a.stage);
      // Delete only the stages being explicitly managed — other stages are untouched
      await admin.from("project_assignments").delete().eq("project_id", projectId).in("stage", stages);
      const toInsert = validAssignments.filter((a) => a.user_id !== null);
      if (toInsert.length > 0) {
        await admin.from("project_assignments").insert(
          toInsert.map((a) => ({ project_id: projectId, user_id: a.user_id, stage: a.stage }))
        );
      }
      // Auto-advance lead → survey when a survey assignee is being set
      if (validAssignments.some((a) => a.stage === "survey" && a.user_id !== null)) {
        const { data: proj } = await admin.from("projects").select("status").eq("id", projectId).single();
        if (proj?.status === "lead") {
          await admin.from("projects").update({ status: "survey" }).eq("id", projectId);
        }
      }
    }
  }

  return {};
}

export async function approveCase(projectId: string): Promise<{ error?: string }> {
  const { admin, error, isAdmin } = await requireActiveUser();
  if (error || !admin) return { error: error ?? "Unauthenticated" };
  if (!isAdmin) return { error: "Forbidden" };
  if (!ProjectIdSchema.safeParse(projectId).success) return { error: "Invalid project ID" };
  const { error: dbError } = await admin.from("projects").update({ requires_review: false }).eq("id", projectId);
  if (dbError) return { error: dbError.message };
  return {};
}

export async function deleteProject(projectId: string): Promise<{ error?: string }> {
  const { admin, error, isAdmin } = await requireActiveUser();
  if (error || !admin) return { error: error ?? "Unauthenticated" };
  if (!isAdmin) return { error: "Forbidden" };
  if (!ProjectIdSchema.safeParse(projectId).success) return { error: "Invalid project ID" };
  const { data: files } = await admin.from("project_files").select("file_path").eq("project_id", projectId);
  if (files && files.length > 0) {
    await admin.storage.from("project-files").remove(files.map((f: any) => f.file_path));
  }
  const { error: dbError } = await admin.from("projects").delete().eq("id", projectId);
  if (dbError) return { error: dbError.message };
  return {};
}

export async function deleteProjectFiles(fileIds: string[]): Promise<{ error?: string }> {
  const { admin, error } = await requireActiveUser();
  if (error || !admin) return { error: error ?? "Unauthenticated" };
  if (!Array.isArray(fileIds) || fileIds.length === 0) return {};
  const validIds = fileIds.filter((id) => ProjectIdSchema.safeParse(id).success);
  if (validIds.length === 0) return {};
  const { data: files } = await admin.from("project_files").select("id, file_path").in("id", validIds);
  if (files && files.length > 0) {
    await admin.storage.from("project-files").remove(files.map((f: any) => f.file_path));
  }
  const { error: dbError } = await admin.from("project_files").delete().in("id", validIds);
  if (dbError) return { error: dbError.message };
  return {};
}

export async function revokeStageSubmission(projectId: string, stage: string): Promise<{ error?: string }> {
  const { admin, user, error } = await requireActiveUser();
  if (error || !admin || !user) return { error: error ?? "Unauthenticated" };
  if (!ProjectIdSchema.safeParse(projectId).success) return { error: "Invalid project ID" };
  if (!StatusSchema.safeParse(stage).success) return { error: "Invalid stage" };

  const { error: dbError } = await admin
    .from("stage_submissions")
    .update({ revoked_by: user.id, revoked_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("stage", stage);
  if (dbError) return { error: dbError.message };

  const { error: statusError } = await admin
    .from("projects")
    .update({ status: stage })
    .eq("id", projectId);
  if (statusError) return { error: statusError.message };

  await admin
    .from("third_party_tokens")
    .update({ used_at: null })
    .eq("project_id", projectId)
    .eq("stage", stage)
    .not("used_at", "is", null);

  return {};
}
